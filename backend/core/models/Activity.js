const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'login',
      'logout',
      'profile_update',
      'pet_added',
      'pet_updated',
      'pet_deleted',
      'adoption_applied',
      'adoption_approved',
      'adoption_rejected',
      'rescue_requested',
      'rescue_completed',
      'shelter_visit',
      'veterinary_appointment',
      'pharmacy_purchase',
      'ecommerce_purchase',
      'boarding_request',
      'temporary_care_request',
      'password_change',
      'email_verification',
      'account_created',
      'account_deactivated',
      'other'
    ]
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'failed', 'cancelled'],
    default: 'completed'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  details: {
    type: String,
    default: ''
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
activitySchema.index({ userId: 1, createdAt: -1 });
activitySchema.index({ type: 1, createdAt: -1 });
activitySchema.index({ status: 1, createdAt: -1 });

// Geospatial index for location-based queries
activitySchema.index({ location: '2dsphere' });

// Virtual for formatted date
activitySchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString();
});

// Virtual for formatted time
activitySchema.virtual('formattedTime').get(function() {
  return this.createdAt.toLocaleTimeString();
});

// Static method to create activity
activitySchema.statics.createActivity = async function(userId, activityData) {
  const activity = new this({
    userId,
    ...activityData
  });
  return await activity.save();
};

// Static method to get user activities with pagination
activitySchema.statics.getUserActivities = async function(userId, options = {}) {
  const { page = 1, limit = 20, type, status } = options;
  
  const filter = { userId };
  if (type) filter.type = type;
  if (status) filter.status = status;
  
  const activities = await this.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate('userId', 'name email');
    
  const total = await this.countDocuments(filter);
  
  return {
    activities,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

module.exports = mongoose.model('Activity', activitySchema);
