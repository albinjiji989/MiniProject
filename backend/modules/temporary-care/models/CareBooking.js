const mongoose = require('mongoose');

/**
 * Care Booking Model
 * Main booking entity for temporary care services
 */

const activityLogSchema = new mongoose.Schema({
  activityType: {
    type: String,
    enum: ['feeding', 'bathing', 'walking', 'medication', 'playtime', 'health_check', 'emergency', 'other'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    required: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  media: [{
    url: String,
    type: { type: String, enum: ['image', 'video'] },
    caption: String,
    uploadedAt: { type: Date, default: Date.now }
  }]
}, { _id: true });

const careBookingSchema = new mongoose.Schema({
  // Booking Reference
  bookingNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // User and Pet Information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  petId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet',
    required: true,
    index: true
  },
  
  // Service Information
  serviceType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceType',
    required: true
  },
  serviceCategory: {
    type: String,
    enum: ['boarding', 'in-home', 'daycare', 'overnight'],
    required: true
  },
  
  // Schedule
  startDate: {
    type: Date,
    required: true,
    index: true
  },
  endDate: {
    type: Date,
    required: true
  },
  duration: {
    value: { type: Number, required: true },
    unit: { type: String, enum: ['hours', 'days'], default: 'days' }
  },
  
  // Location details (for in-home services)
  location: {
    type: {
      type: String,
      enum: ['facility', 'customer_home'],
      required: true
    },
    address: {
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      zipCode: String,
      country: { type: String, default: 'India' },
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    facilityId: {
      type: String
    },
    facilityName: String
  },
  
  // Special Requirements
  specialRequirements: {
    diet: {
      type: String,
      default: ''
    },
    medication: [{
      name: String,
      dosage: String,
      frequency: String,
      timing: String
    }],
    allergies: [{
      type: String
    }],
    behaviorNotes: {
      type: String,
      default: ''
    },
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String
    },
    vetContact: {
      name: String,
      phone: String,
      clinicName: String
    }
  },
  
  // Assigned Staff
  assignedCaregivers: [{
    caregiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    role: {
      type: String,
      enum: ['primary', 'backup'],
      default: 'primary'
    }
  }],
  
  // Pricing
  pricing: {
    baseAmount: {
      type: Number,
      required: true,
      min: 0
    },
    additionalCharges: [{
      name: String,
      amount: Number
    }],
    discount: {
      amount: { type: Number, default: 0 },
      reason: String
    },
    tax: {
      amount: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 }
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    advanceAmount: {
      type: Number,
      required: true,
      min: 0
    },
    remainingAmount: {
      type: Number,
      required: true,
      min: 0
    }
  },
  
  // Payment Status
  paymentStatus: {
    advance: {
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
      },
      paidAt: Date,
      paymentId: String
    },
    final: {
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
      },
      paidAt: Date,
      paymentId: String
    }
  },
  
  // Booking Status
  status: {
    type: String,
    enum: [
      'pending_payment',
      'confirmed',
      'in_progress',
      'completed',
      'cancelled',
      'refunded'
    ],
    default: 'pending_payment',
    index: true
  },
  
  // Drop-off and Pick-up
  handover: {
    dropOff: {
      method: {
        type: String,
        enum: ['customer_dropoff', 'staff_pickup'],
        default: 'customer_dropoff'
      },
      scheduledTime: Date,
      actualTime: Date,
      completedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      notes: String,
      otp: {
        code: String,
        generatedAt: Date,
        expiresAt: Date,
        verified: { type: Boolean, default: false },
        verifiedAt: Date
      }
    },
    pickup: {
      method: {
        type: String,
        enum: ['customer_pickup', 'staff_delivery'],
        default: 'customer_pickup'
      },
      scheduledTime: Date,
      actualTime: Date,
      completedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      notes: String,
      otp: {
        code: String,
        generatedAt: Date,
        expiresAt: Date,
        verified: { type: Boolean, default: false },
        verifiedAt: Date
      }
    }
  },
  
  // Activity Log
  activityLog: [activityLogSchema],
  
  // Cancellation
  cancellation: {
    cancelledAt: Date,
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    refundAmount: Number,
    refundStatus: {
      type: String,
      enum: ['pending', 'processed', 'failed']
    }
  },
  
  // Review and Rating
  review: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    reviewedAt: Date
  },
  
  // Store reference
  storeId: {
    type: String,
    index: true
  },
  
  // Notes
  internalNotes: {
    type: String,
    default: ''
  },
  
  metadata: {
    type: Object,
    default: {}
  }
}, { 
  timestamps: true 
});

// Indexes for efficient queries
careBookingSchema.index({ userId: 1, status: 1 });
careBookingSchema.index({ petId: 1 });
careBookingSchema.index({ startDate: 1, endDate: 1 });
careBookingSchema.index({ status: 1, startDate: 1 });
careBookingSchema.index({ 'assignedCaregivers.caregiver': 1 });
careBookingSchema.index({ storeId: 1, status: 1 });

// Generate booking number before save
careBookingSchema.pre('save', async function(next) {
  if (this.isNew && !this.bookingNumber) {
    const count = await this.constructor.countDocuments();
    this.bookingNumber = `TCB${Date.now()}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Virtual for total duration in days
careBookingSchema.virtual('durationInDays').get(function() {
  if (this.duration.unit === 'days') {
    return this.duration.value;
  } else if (this.duration.unit === 'hours') {
    return Math.ceil(this.duration.value / 24);
  }
  return 0;
});

// Method to check if booking is active
careBookingSchema.methods.isActive = function() {
  return ['confirmed', 'in_progress'].includes(this.status);
};

// Method to check if booking can be cancelled
careBookingSchema.methods.canBeCancelled = function() {
  const now = new Date();
  const startDate = new Date(this.startDate);
  const hoursDifference = (startDate - now) / (1000 * 60 * 60);
  
  return (
    ['pending_payment', 'confirmed'].includes(this.status) &&
    hoursDifference > 24 // Can cancel at least 24 hours before
  );
};

module.exports = mongoose.model('CareBooking', careBookingSchema);
