const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  category: {
    type: String,
    required: true,
    enum: ['grooming', 'boarding', 'training', 'veterinary', 'daycare', 'other']
  },
  duration: {
    value: {
      type: Number,
      required: true,
      min: 1
    },
    unit: {
      type: String,
      enum: ['minutes', 'hours', 'days'],
      default: 'hours'
    }
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PetShop',
    required: true
  },
  image: String,
  requirements: [{
    type: String,
    enum: ['vaccination', 'health_certificate', 'pet_profile', 'owner_id']
  }],
  maxPetsPerSlot: {
    type: Number,
    default: 1,
    min: 1
  },
  staffRequired: {
    type: Number,
    default: 1,
    min: 0
  },
  preparationTime: {
    type: Number, // in minutes
    default: 0,
    min: 0
  },
  cleanupTime: {
    type: Number, // in minutes
    default: 0,
    min: 0
  },
  cancellationPolicy: {
    noticeHours: {
      type: Number,
      default: 24
    },
    refundPercentage: {
      type: Number,
      default: 100,
      min: 0,
      max: 100
    }
  },
  availableDays: {
    monday: { type: Boolean, default: true },
    tuesday: { type: Boolean, default: true },
    wednesday: { type: Boolean, default: true },
    thursday: { type: Boolean, default: true },
    friday: { type: Boolean, default: true },
    saturday: { type: Boolean, default: false },
    sunday: { type: Boolean, default: false }
  },
  operatingHours: {
    start: {
      type: String, // Format: 'HH:MM' in 24-hour format
      default: '09:00'
    },
    end: {
      type: String, // Format: 'HH:MM' in 24-hour format
      default: '18:00'
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  tags: [String],
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

// Indexes for better query performance
serviceSchema.index({ name: 'text', description: 'text' });
serviceSchema.index({ shop: 1, category: 1, isActive: 1 });

// Virtual for duration in minutes
serviceSchema.virtual('durationInMinutes').get(function() {
  const duration = this.duration;
  switch (duration.unit) {
    case 'minutes': return duration.value;
    case 'hours': return duration.value * 60;
    case 'days': return duration.value * 60 * 24;
    default: return duration.value * 60; // Default to minutes
  }
});

// Method to check if service is available on a specific day
serviceSchema.methods.isAvailableOnDay = function(day) {
  const dayName = day.toLowerCase();
  return this.availableDays[dayName] !== false; // true if not explicitly set to false
};

// Method to get available time slots for a given date
serviceSchema.methods.getAvailableSlots = async function(date) {
  // Implementation would check existing reservations and return available time slots
  // This is a placeholder implementation
  return [];
};

// Pre-save hook to validate operating hours
serviceSchema.pre('save', function(next) {
  if (this.operatingHours) {
    const start = this.operatingHours.start;
    const end = this.operatingHours.end;
    
    if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(start) || 
        !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(end)) {
      throw new Error('Invalid time format. Use HH:MM in 24-hour format.');
    }
    
    if (start >= end) {
      throw new Error('End time must be after start time');
    }
  }
  next();
});

module.exports = mongoose.model('Service', serviceSchema);
