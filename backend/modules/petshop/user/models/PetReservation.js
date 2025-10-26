const mongoose = require('mongoose');
const crypto = require('crypto');

const petReservationSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'PetInventoryItem', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  petId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet' }, // Add this line to reference the Pet record
  
  // Reservation details
  reservationCode: { 
    type: String
  },
  
  // Enhanced status workflow
  status: { 
    type: String, 
    enum: [
      'pending',           // User created reservation
      'manager_review',    // Sent to manager for review
      'approved',          // Manager approved - waiting for user decision
      'rejected',          // Manager rejected
      'going_to_buy',      // User confirmed they want to buy
      'payment_pending',   // Ready for payment
      'paid',             // Payment completed
      'ready_pickup',     // Pet ready for pickup/delivery
      'delivered',        // Pet delivered to user
      'at_owner',         // Pet is now with owner (final status)
      'cancelled'         // Cancelled by user or manager
    ], 
    default: 'pending' 
  },
  
  // Reservation type - simplified to remove online/offline distinction
  reservationType: {
    type: String,
    enum: ['reservation'], // Simplified to just 'reservation'
    default: 'reservation'
  },
  
  // Contact and visit details
  contactInfo: {
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
    preferredContactMethod: { type: String, enum: ['phone', 'email', 'both'], default: 'both' }
  },
  
  visitDetails: {
    preferredDate: { type: Date },
    preferredTime: { type: String }, // e.g., "morning", "afternoon", "evening"
    visitPurpose: { type: String, enum: ['meet_pet', 'final_purchase'], default: 'meet_pet' }
  },
  
  // Manager review
  managerReview: {
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    reviewNotes: { type: String, trim: true },
    approvalReason: { type: String, trim: true }
  },
  
  // Payment details
  paymentInfo: {
    amount: { type: Number, min: 0 },
    paymentMethod: { type: String, enum: ['online', 'cash', 'card', 'bank_transfer'] },
    paymentStatus: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
    transactionId: { type: String },
    paidAt: { type: Date }
  },
  
  timeline: [{
    status: { type: String },
    timestamp: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String, trim: true }
  }],
  
  // User decision tracking
  userDecision: {
    wantsToBuy: { type: Boolean }, // User's decision after manager approval
    decisionDate: { type: Date },
    decisionNotes: { type: String, trim: true },
    remindersSent: { type: Number, default: 0 }
  },
  
  // Delivery tracking
  deliveryInfo: {
    method: { type: String, enum: ['pickup', 'delivery'], default: 'pickup' },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      phone: String
    },
    scheduledDate: Date,
    actualDate: Date,
    deliveryNotes: String
  },
  
  // Additional notes
  notes: { type: String, trim: true },
  internalNotes: { type: String, trim: true }, // Manager-only notes
  
  // Expiry for pending reservations
  expiresAt: { type: Date },
  
  // Handover with OTP verification (similar to adoption module)
  handover: {
    otp: { type: String }, // Current OTP (deprecated but kept for backward compatibility)
    otpHistory: [{ // OTP history for better tracking
      otp: { type: String, required: true },
      generatedAt: { type: Date, default: Date.now },
      used: { type: Boolean, default: false },
      usedAt: { type: Date }
    }],
    status: { 
      type: String, 
      enum: ['none', 'scheduled', 'completed'], 
      default: 'none' 
    },
    method: { 
      type: String, 
      enum: ['pickup', 'delivery'], 
      default: 'pickup' 
    },
    scheduledAt: { type: Date },
    location: {
      address: { type: String, trim: true },
      lat: { type: Number },
      lng: { type: Number },
      phone: { type: String, trim: true }
    },
    notes: { type: String, trim: true },
    confirmedByUserAt: { type: Date }
  },
  handoverCompletedAt: { type: Date }
}, { timestamps: true })

petReservationSchema.index({ itemId: 1, userId: 1, status: 1 })
petReservationSchema.index({ reservationCode: 1 }, { unique: true, sparse: true })
petReservationSchema.index({ status: 1, createdAt: -1 })
petReservationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

// Static: generate unique reservation code (R + 2 letters + 5 digits = R + AA + 12345)
petReservationSchema.statics.generateReservationCode = async function() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const randomLetters = () => Array.from({ length: 2 }, () => letters[Math.floor(Math.random() * letters.length)]).join('')
  const randomNumber = () => Math.floor(10000 + Math.random() * 90000).toString() // 5 digits, no leading zero

  let code
  let exists = true
  let attempts = 0
  
  // Try to generate a unique code with better collision avoidance
  while (exists && attempts < 5) { // Limit attempts to prevent infinite loop
    code = `R${randomLetters()}${randomNumber()}` // Format: RAA12345
    console.log('Attempting to generate code:', code); // Debug log
    
    // Check collision in reservation system
    exists = await this.exists({ reservationCode: code })
    console.log('Code exists:', exists); // Debug log
    attempts++
  }
  
  // If we still have collision, use a more unique approach
  if (exists) {
    // Use timestamp + random + user ID fragment for better uniqueness
    const timestampPart = Date.now().toString().slice(-4)
    const randomPart = Math.floor(1000 + Math.random() * 9000).toString()
    const userPart = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    code = `R${timestampPart}${randomPart}${userPart}` // Format: R12345678901
    console.log('Using highly unique fallback code:', code); // Debug log
  }
  
  console.log('Final generated code:', code); // Debug log
  return code
}

// Generate unique reservation code before saving
petReservationSchema.pre('save', async function(next) {
  if (!this.reservationCode) {
    const Model = this.constructor
    this.reservationCode = await Model.generateReservationCode()
    console.log('Generated reservation code:', this.reservationCode); // Debug log
  }
  
  // Add to timeline when status changes
  if (this.isModified('status')) {
    this.timeline.push({
      status: this.status,
      timestamp: new Date(),
      updatedBy: this._updatedBy || this.userId,
      notes: this._statusChangeNote || ''
    });
  }
  
  // Set expiry for pending reservations (24 hours)
  if (this.status === 'pending' && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
  
  next();
});

// Method to update status with tracking
petReservationSchema.methods.updateStatus = function(newStatus, updatedBy, notes = '') {
  this._updatedBy = updatedBy;
  this._statusChangeNote = notes;
  this.status = newStatus;
  
  // Clear expiry when moving from pending
  if (newStatus !== 'pending') {
    this.expiresAt = undefined;
  }
  
  return this.save();
};

module.exports = mongoose.model('PetReservation', petReservationSchema)
