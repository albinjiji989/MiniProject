const mongoose = require('mongoose');

/**
 * Temporary Care Application Model
 * Supports multiple pets in a single application
 * Follows status workflow: submitted → price_determined → advance_paid → approved → active_care → completed
 */

const petPricingSchema = new mongoose.Schema({
  petId: { 
    type: String, // Changed from ObjectId to String to support petCode
    required: true 
  },
  petType: { type: String }, // e.g., 'Dog', 'Cat'
  petSize: { type: String, enum: ['small', 'medium', 'large', 'extra_large'] }, // Optional size category
  baseRatePerDay: { type: Number, required: true, min: 0 },
  numberOfDays: { type: Number, required: true, min: 1 },
  baseAmount: { type: Number, required: true, min: 0 },
  specialCareAddons: [{
    name: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 }
  }],
  totalAmount: { type: Number, required: true, min: 0 } // baseAmount + addons
}, { _id: false });

const dailyCareLogSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  petId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true },
  activities: [{
    activityType: { 
      type: String, 
      enum: ['feeding', 'hygiene', 'medication', 'exercise', 'playtime', 'health_check', 'other'],
      required: true
    },
    time: { type: String }, // e.g., "09:00"
    notes: { type: String },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  notes: { type: String }
}, { _id: false });

const kennelAssignmentSchema = new mongoose.Schema({
  petId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true },
  kennelId: { type: String, required: true },
  kennelLabel: { type: String }, // e.g., "Kennel A-12"
  assignedAt: { type: Date, default: Date.now },
  caretakerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  checkInCondition: {
    description: { type: String },
    photos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Image' }],
    healthStatus: { type: String, enum: ['healthy', 'minor_issues', 'needs_attention'] },
    recordedAt: { type: Date },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  checkOutCondition: {
    description: { type: String },
    photos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Image' }],
    healthStatus: { type: String, enum: ['healthy', 'minor_issues', 'needs_attention'] },
    recordedAt: { type: Date },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }
}, { _id: false });

const emergencyRecordSchema = new mongoose.Schema({
  reportedAt: { type: Date, default: Date.now },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
  description: { type: String, required: true },
  petId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet' },
  actionsTaken: { type: String },
  ownerNotified: { type: Boolean, default: false },
  ownerNotifiedAt: { type: Date },
  vetContacted: { type: Boolean, default: false },
  vetContactedAt: { type: Date },
  resolved: { type: Boolean, default: false },
  resolvedAt: { type: Date }
}, { _id: false });

const feedbackSchema = new mongoose.Schema({
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String },
  submittedAt: { type: Date, default: Date.now },
  serviceRating: { type: Number, min: 1, max: 5 },
  staffRating: { type: Number, min: 1, max: 5 },
  facilityRating: { type: Number, min: 1, max: 5 }
}, { _id: false });

const temporaryCareApplicationSchema = new mongoose.Schema({
  // Application Reference
  applicationNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // User/Owner Information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Multiple Pets
  pets: [{
    petId: { type: String, required: true }, // Support both ObjectId and petCode
    specialInstructions: {
      food: { type: String },
      medicine: { type: String },
      behavior: { type: String },
      allergies: { type: String },
      otherNotes: { type: String }
    }
  }],
  
  // Care Duration
  startDate: {
    type: Date,
    required: true,
    index: true
  },
  endDate: {
    type: Date,
    required: true,
    index: true
  },
  numberOfDays: {
    type: Number,
    required: true,
    min: 1
  },
  
  // Selected Association/Center
  centerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TemporaryCareCenter',
    required: true,
    index: true
  },
  centerName: { type: String },
  
  // Pricing - Per Pet with Detailed Breakdown
  pricing: {
    petPricing: [petPricingSchema], // One entry per pet
    subtotal: { type: Number, required: true, min: 0 },
    additionalCharges: [{
      name: { type: String, required: true },
      amount: { type: Number, required: true, min: 0 }
    }],
    discount: {
      amount: { type: Number, default: 0, min: 0 },
      reason: { type: String }
    },
    tax: {
      percentage: { type: Number, default: 0 },
      amount: { type: Number, default: 0, min: 0 }
    },
    totalAmount: { type: Number, required: true, min: 0 },
    advanceAmount: { type: Number, required: true, min: 0 }, // 50% of totalAmount
    remainingAmount: { type: Number, required: true, min: 0 }, // 50% of totalAmount
    pricingLocked: { type: Boolean, default: false }, // Locked after manager approves
    pricingDeterminedAt: { type: Date }, // When manager sets pricing
    pricingDeterminedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  
  // Payment Status
  paymentStatus: {
    advance: {
      status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
      paidAt: { type: Date },
      paymentId: { type: String },
      transactionId: { type: String }
    },
    final: {
      status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
      paidAt: { type: Date },
      paymentId: { type: String },
      transactionId: { type: String }
    }
  },
  
  // Application Status Workflow
  status: {
    type: String,
    enum: [
      'submitted',        // User submitted application
      'price_determined', // Manager set pricing
      'advance_paid',     // User paid 50% advance
      'approved',         // Manager approved after advance payment
      'active_care',      // Pet is in care (checked in)
      'completed',        // Care completed and final payment done
      'cancelled',        // Cancelled by user or manager
      'rejected'          // Rejected by manager
    ],
    default: 'submitted',
    index: true
  },
  
  // Manager Actions
  managerNotes: { type: String },
  rejectedReason: { type: String },
  approvedAt: { type: Date },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Cancellation Information
  cancellationReason: { type: String },
  cancelledAt: { type: Date },
  cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Kennel/Caretaker Assignment
  kennelAssignments: [kennelAssignmentSchema],
  
  // Daily Care Logs
  dailyCareLogs: [dailyCareLogSchema],
  
  // Emergency Records
  emergencyRecords: [emergencyRecordSchema],
  
  // Handover Information
  checkIn: {
    otp: { type: String },
    otpGeneratedAt: { type: Date },
    otpExpiresAt: { type: Date },
    otpUsed: { type: Boolean, default: false },
    actualCheckInTime: { type: Date },
    checkedInBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  checkOut: {
    otp: { type: String },
    otpGeneratedAt: { type: Date },
    otpExpiresAt: { type: Date },
    otpUsed: { type: Boolean, default: false },
    actualCheckOutTime: { type: Date },
    checkedOutBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    finalBillGenerated: { type: Boolean, default: false },
    finalBillGeneratedAt: { type: Date }
  },
  
  // Final Bill (may include extra days or services)
  finalBill: {
    originalTotal: { type: Number },
    extraDays: { type: Number, default: 0 },
    extraDaysAmount: { type: Number, default: 0 },
    additionalServices: [{
      name: { type: String },
      amount: { type: Number }
    }],
    adjustments: [{
      description: { type: String },
      amount: { type: Number }
    }],
    finalTotal: { type: Number },
    advanceAlreadyPaid: { type: Number },
    finalAmountDue: { type: Number },
    generatedAt: { type: Date },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  
  // Invoice and Payment History
  invoices: [{
    invoiceNumber: { type: String, required: true },
    invoiceType: { type: String, enum: ['advance', 'final'], required: true },
    amount: { type: Number, required: true },
    issuedAt: { type: Date, default: Date.now },
    pdfUrl: { type: String }
  }],
  
  // Feedback
  feedback: feedbackSchema,
  
  // Metadata
  submittedAt: { type: Date, default: Date.now },
  lastStatusChangeAt: { type: Date, default: Date.now },
  
}, { timestamps: true });

// Indexes
temporaryCareApplicationSchema.index({ userId: 1, status: 1 });
temporaryCareApplicationSchema.index({ centerId: 1, status: 1 });
temporaryCareApplicationSchema.index({ startDate: 1, endDate: 1 });
temporaryCareApplicationSchema.index({ 'pets.petId': 1 });

// Virtual for calculating days
temporaryCareApplicationSchema.virtual('durationInDays').get(function() {
  if (!this.startDate || !this.endDate) return 0;
  const diffTime = Math.abs(this.endDate - this.startDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save hook to generate application number
temporaryCareApplicationSchema.pre('save', async function(next) {
  if (!this.applicationNumber) {
    const count = await mongoose.model('TemporaryCareApplication').countDocuments();
    this.applicationNumber = `TC-${Date.now().toString().slice(-8)}-${String(count + 1).padStart(4, '0')}`;
  }
  
  // Update lastStatusChangeAt when status changes
  if (this.isModified('status')) {
    this.lastStatusChangeAt = new Date();
  }
  
  // Calculate numberOfDays if not set
  if (this.startDate && this.endDate && !this.numberOfDays) {
    const diffTime = Math.abs(this.endDate - this.startDate);
    this.numberOfDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  next();
});

module.exports = mongoose.model('TemporaryCareApplication', temporaryCareApplicationSchema);
