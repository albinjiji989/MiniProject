const mongoose = require('mongoose');

const adoptionRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  petId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdoptionPet',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'payment_pending', 'payment_completed', 'completed', 'cancelled'],
    default: 'pending',
  },
  applicationData: {
    // Personal Information
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: String,
    },
    // Home Environment
    homeType: {
      type: String,
      enum: ['apartment', 'house', 'farm', 'other'],
      required: true,
    },
    hasGarden: {
      type: Boolean,
      default: false,
    },
    hasOtherPets: {
      type: Boolean,
      default: false,
    },
    otherPetsDetails: String,
    // Experience
    petExperience: {
      type: String,
      enum: ['none', 'some', 'extensive'],
      required: true,
    },
    previousPets: String,
    // Lifestyle
    workSchedule: {
      type: String,
      enum: ['full_time', 'part_time', 'work_from_home', 'unemployed', 'retired'],
      required: true,
    },
    timeAtHome: {
      type: String,
      enum: ['less_than_4_hours', '4_8_hours', '8_12_hours', 'more_than_12_hours'],
      required: true,
    },
    // Motivation
    adoptionReason: {
      type: String,
      required: true,
    },
    expectations: String,
    // References
    references: [{
      name: String,
      relationship: String,
      phone: String,
      email: String,
    }],
    // Additional Information
    additionalInfo: String,
    // Emergency Contact
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
    },
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending',
  },
  paymentDetails: {
    razorpayOrderId: String,
    razorpayPaymentId: String,
    amount: Number,
    currency: String,
    paymentDate: Date,
    transactionId: String,
  },
  contractURL: {
    type: String,
    default: null,
  },
  contractGeneratedAt: {
    type: Date,
    default: null,
  },
  // Approval/Rejection Details
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  reviewedAt: {
    type: Date,
  },
  reviewNotes: {
    type: String,
  },
  rejectionReason: {
    type: String,
  },
  // Follow-up
  followUpDate: {
    type: Date,
  },
  followUpNotes: String,
  // Status History
  statusHistory: [{
    status: String,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    notes: String,
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
adoptionRequestSchema.index({ userId: 1 });
adoptionRequestSchema.index({ petId: 1 });
adoptionRequestSchema.index({ status: 1 });
adoptionRequestSchema.index({ paymentStatus: 1 });
adoptionRequestSchema.index({ reviewedBy: 1 });
adoptionRequestSchema.index({ createdAt: -1 });

// Virtual for application status display
adoptionRequestSchema.virtual('statusDisplay').get(function() {
  const statusMap = {
    pending: 'Under Review',
    approved: 'Approved',
    rejected: 'Rejected',
    payment_pending: 'Payment Pending',
    payment_completed: 'Payment Completed',
    completed: 'Adoption Completed',
    cancelled: 'Cancelled',
  };
  return statusMap[this.status] || this.status;
});

// Method to update status with history
adoptionRequestSchema.methods.updateStatus = function(newStatus, changedBy, notes = '') {
  this.statusHistory.push({
    status: this.status,
    changedBy: changedBy,
    changedAt: new Date(),
    notes: notes,
  });
  this.status = newStatus;
  if (newStatus === 'approved' || newStatus === 'rejected') {
    this.reviewedBy = changedBy;
    this.reviewedAt = new Date();
  }
  return this.save();
};

// Method to approve request
adoptionRequestSchema.methods.approve = function(reviewedBy, notes = '') {
  return this.updateStatus('approved', reviewedBy, notes);
};

// Method to reject request
adoptionRequestSchema.methods.reject = function(reviewedBy, reason, notes = '') {
  this.rejectionReason = reason;
  return this.updateStatus('rejected', reviewedBy, notes);
};

// Method to complete payment
adoptionRequestSchema.methods.completePayment = function(paymentDetails) {
  this.paymentStatus = 'completed';
  this.paymentDetails = paymentDetails;
  this.paymentDetails.paymentDate = new Date();
  return this.updateStatus('payment_completed', null, 'Payment completed successfully');
};

// Method to complete adoption
adoptionRequestSchema.methods.completeAdoption = function(contractURL) {
  this.contractURL = contractURL;
  this.contractGeneratedAt = new Date();
  return this.updateStatus('completed', null, 'Adoption completed successfully');
};

// Static method to get requests by status
adoptionRequestSchema.statics.getByStatus = function(status) {
  return this.find({ status, isActive: true }).populate('userId petId reviewedBy');
};

// Static method to get user requests
adoptionRequestSchema.statics.getUserRequests = function(userId) {
  return this.find({ userId, isActive: true }).populate('petId reviewedBy');
};

module.exports = mongoose.model('AdoptionRequest', adoptionRequestSchema);
