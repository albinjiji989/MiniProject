const mongoose = require('mongoose');

/**
 * Service Type Model
 * Defines different temporary care services offered
 */
const serviceTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['boarding', 'in-home', 'daycare', 'overnight'],
    required: true
  },
  
  // Pricing structure
  pricing: {
    basePrice: {
      type: Number,
      required: true,
      min: 0
    },
    priceUnit: {
      type: String,
      enum: ['per_day', 'per_hour', 'per_visit', 'per_session'],
      default: 'per_day'
    },
    // Additional charges
    additionalCharges: [{
      name: String,
      amount: Number,
      isPercentage: { type: Boolean, default: false }
    }],
    // Advance payment percentage
    advancePercentage: {
      type: Number,
      default: 50,
      min: 0,
      max: 100
    }
  },
  
  // Service details
  features: [{
    type: String
  }],
  
  // Requirements and conditions
  requirements: {
    minDuration: {
      value: { type: Number, default: 1 },
      unit: { type: String, enum: ['hours', 'days'], default: 'days' }
    },
    maxDuration: {
      value: { type: Number },
      unit: { type: String, enum: ['hours', 'days'], default: 'days' }
    },
    advanceBookingRequired: {
      type: Number,
      default: 24, // hours
      min: 0
    },
    cancellationPolicy: {
      type: String,
      default: 'Full refund if cancelled 24 hours before service start'
    }
  },
  
  // Availability
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  // Images
  images: [{
    url: String,
    caption: String
  }],
  
  // Store specific (if applicable)
  storeId: {
    type: String,
    index: true
  },
  
  metadata: {
    type: Object,
    default: {}
  }
}, { 
  timestamps: true 
});

// Indexes
serviceTypeSchema.index({ code: 1 });
serviceTypeSchema.index({ category: 1, isActive: 1 });
serviceTypeSchema.index({ storeId: 1, isActive: 1 });

module.exports = mongoose.model('ServiceType', serviceTypeSchema);
