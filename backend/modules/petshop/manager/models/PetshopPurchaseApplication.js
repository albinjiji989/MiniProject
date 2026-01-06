const mongoose = require('mongoose');

const petshopPurchaseApplicationSchema = new mongoose.Schema({
  // User who is applying to purchase
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Pet inventory item being purchased
  petInventoryItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PetInventoryItem',
    required: true,
    index: true
  },
  
  // Batch information
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PetBatch'
  },
  
  selectedGender: {
    type: String,
    enum: ['Male', 'Female'],
    required: true
  },
  
  // User personal details
  personalDetails: {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'India' }
    },
    alternatePhone: String
  },
  
  // User uploaded photo
  userPhoto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Image'
  },
  
  // Supporting documents (ID proof, address proof, etc.)
  documents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  }],
  
  // Why they want to purchase
  purpose: {
    type: String,
    maxlength: 1000
  },
  
  // Application status flow
  status: {
    type: String,
    enum: [
      'pending',           // Initial application submitted
      'under_review',      // Manager is reviewing
      'approved',          // Manager approved, waiting for payment
      'rejected',          // Manager rejected
      'payment_pending',   // Approved, payment link sent
      'paid',              // Payment completed
      'scheduled',         // Handover scheduled, OTP sent
      'completed',         // OTP verified, pet handed over
      'cancelled'          // Cancelled by user or system
    ],
    default: 'pending',
    index: true
  },
  
  // Manager review
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  reviewDate: Date,
  
  approvalNotes: String,
  
  rejectionReason: String,
  
  // Payment details
  paymentAmount: {
    type: Number,
    required: true
  },
  
  paymentId: String,        // Razorpay payment ID
  
  razorpayOrderId: String,  // Razorpay order ID
  
  paymentStatus: {
    type: String,
    enum: ['pending', 'processing', 'success', 'failed', 'refunded'],
    default: 'pending'
  },
  
  paymentDate: Date,
  
  // Handover scheduling
  scheduledHandoverDate: Date,
  
  scheduledHandoverTime: String,
  
  handoverLocation: String,
  
  // OTP for handover verification
  otpCode: String,
  
  otpGeneratedAt: Date,
  
  otpExpiresAt: Date,
  
  otpVerified: {
    type: Boolean,
    default: false
  },
  
  otpVerifiedAt: Date,
  
  // Final handover
  handoverCompletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  handoverCompletedAt: Date,
  
  // Pet registry entry (created after handover)
  petRegistryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PetRegistry'
  },
  
  // Timestamps
  applicationDate: {
    type: Date,
    default: Date.now
  },
  
  // Store info
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: false // Made optional since PetInventoryItem might have string code instead of ObjectId
  },
  
  // Audit trail
  statusHistory: [{
    status: String,
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: String
  }],
  
  // Soft delete
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
petshopPurchaseApplicationSchema.index({ userId: 1, status: 1 });
petshopPurchaseApplicationSchema.index({ storeId: 1, status: 1 });
petshopPurchaseApplicationSchema.index({ applicationDate: -1 });
petshopPurchaseApplicationSchema.index({ scheduledHandoverDate: 1 });

// Virtual for user details
petshopPurchaseApplicationSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

// Virtual for pet details
petshopPurchaseApplicationSchema.virtual('petItem', {
  ref: 'PetInventoryItem',
  localField: 'petInventoryItemId',
  foreignField: '_id',
  justOne: true
});

// Virtual for images
petshopPurchaseApplicationSchema.virtual('userPhotoDetails', {
  ref: 'Image',
  localField: 'userPhoto',
  foreignField: '_id',
  justOne: true
});

// Virtual for documents
petshopPurchaseApplicationSchema.virtual('documentDetails', {
  ref: 'Document',
  localField: 'documents',
  foreignField: '_id'
});

// Method to add status history
petshopPurchaseApplicationSchema.methods.addStatusHistory = function(status, userId, notes) {
  this.statusHistory.push({
    status,
    changedBy: userId,
    notes,
    changedAt: new Date()
  });
};

// Method to generate OTP
petshopPurchaseApplicationSchema.methods.generateOTP = function() {
  // Generate 6-digit OTP
  this.otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  this.otpGeneratedAt = new Date();
  this.otpExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours validity
  this.otpVerified = false;
  return this.otpCode;
};

// Method to verify OTP
petshopPurchaseApplicationSchema.methods.verifyOTP = function(enteredOTP) {
  if (!this.otpCode) {
    return { success: false, message: 'No OTP generated for this application' };
  }
  
  if (this.otpVerified) {
    return { success: false, message: 'OTP already verified' };
  }
  
  if (new Date() > this.otpExpiresAt) {
    return { success: false, message: 'OTP has expired' };
  }
  
  if (this.otpCode !== enteredOTP.toString()) {
    return { success: false, message: 'Invalid OTP' };
  }
  
  this.otpVerified = true;
  this.otpVerifiedAt = new Date();
  return { success: true, message: 'OTP verified successfully' };
};

// Ensure virtuals are included in JSON
petshopPurchaseApplicationSchema.set('toJSON', { virtuals: true });
petshopPurchaseApplicationSchema.set('toObject', { virtuals: true });

const PetshopPurchaseApplication = mongoose.model('PetshopPurchaseApplication', petshopPurchaseApplicationSchema);

module.exports = PetshopPurchaseApplication;
