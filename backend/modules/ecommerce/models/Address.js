const mongoose = require('mongoose');

/**
 * Address Model - Shipping and billing addresses
 */
const addressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Address Details
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  
  phone: {
    type: String,
    required: true,
    trim: true
  },
  
  alternatePhone: {
    type: String,
    trim: true
  },
  
  addressLine1: {
    type: String,
    required: true,
    trim: true
  },
  
  addressLine2: {
    type: String,
    trim: true
  },
  
  landmark: {
    type: String,
    trim: true
  },
  
  city: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  
  state: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  
  pincode: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  
  country: {
    type: String,
    default: 'India',
    trim: true
  },
  
  // Address Type
  addressType: {
    type: String,
    enum: ['home', 'work', 'other'],
    default: 'home'
  },
  
  // Label (optional custom name)
  label: {
    type: String,
    trim: true
  },
  
  // Default flags
  isDefault: {
    type: Boolean,
    default: false
  },
  
  isDefaultShipping: {
    type: Boolean,
    default: false
  },
  
  isDefaultBilling: {
    type: Boolean,
    default: false
  },
  
  // Location coordinates (for delivery optimization)
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
  
  // Delivery Instructions
  deliveryInstructions: {
    type: String,
    maxlength: 500
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Metadata
  lastUsed: Date,
  usageCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Indexes
addressSchema.index({ user: 1, isDefault: 1 });
addressSchema.index({ user: 1, isActive: 1 });
addressSchema.index({ location: '2dsphere' });

// Ensure only one default address per user
addressSchema.pre('save', async function(next) {
  if (this.isDefault && this.isModified('isDefault')) {
    await this.constructor.updateMany(
      { 
        user: this.user, 
        _id: { $ne: this._id },
        isDefault: true 
      },
      { isDefault: false }
    );
  }
  
  if (this.isDefaultShipping && this.isModified('isDefaultShipping')) {
    await this.constructor.updateMany(
      { 
        user: this.user, 
        _id: { $ne: this._id },
        isDefaultShipping: true 
      },
      { isDefaultShipping: false }
    );
  }
  
  if (this.isDefaultBilling && this.isModified('isDefaultBilling')) {
    await this.constructor.updateMany(
      { 
        user: this.user, 
        _id: { $ne: this._id },
        isDefaultBilling: true 
      },
      { isDefaultBilling: false }
    );
  }
  
  next();
});

// Virtual for full address
addressSchema.virtual('fullAddress').get(function() {
  const parts = [
    this.addressLine1,
    this.addressLine2,
    this.landmark,
    this.city,
    this.state,
    this.pincode,
    this.country
  ].filter(Boolean);
  
  return parts.join(', ');
});

// Method to mark as used
addressSchema.methods.markAsUsed = async function() {
  this.lastUsed = new Date();
  this.usageCount += 1;
  await this.save();
};

module.exports = mongoose.model('Address', addressSchema);
