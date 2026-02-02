const mongoose = require('mongoose');

const veterinaryServiceSchema = new mongoose.Schema({
  // Basic service information
  name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true,
    maxlength: [100, 'Service name cannot exceed 100 characters'],
    index: true
  },
  description: {
    type: String,
    required: [true, 'Service description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },

  // Pricing information
  price: {
    type: Number,
    required: [true, 'Service price is required'],
    min: [0, 'Price cannot be negative'],
    validate: {
      validator: Number.isFinite,
      message: 'Price must be a valid number'
    }
  },
  duration: {
    type: Number,
    required: [true, 'Service duration is required'],
    min: [1, 'Duration must be at least 1 minute'],
    validate: {
      validator: Number.isInteger,
      message: 'Duration must be a whole number'
    }
  }, // in minutes

  // Service category
  category: {
    type: String,
    enum: {
      values: ['examination', 'vaccination', 'surgery', 'grooming', 'dentistry', 'checkup', 'dental', 'emergency', 'consultation', 'diagnostic', 'other'],
      message: '{VALUE} is not a valid category'
    },
    default: 'examination',
    index: true
  },

  // Service status
  status: {
    type: String,
    enum: {
      values: ['active', 'inactive'],
      message: '{VALUE} is not a valid status'
    },
    default: 'active',
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },

  // Store information
  storeId: {
    type: String,
    required: [true, 'Store ID is required'],
    index: true
  },
  storeName: {
    type: String,
    trim: true
  },

  // Additional details
  requirements: {
    type: String,
    trim: true
  },
  benefits: [{
    type: String,
    trim: true
  }],

  // Audit fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Compound indexes for common queries
veterinaryServiceSchema.index({ storeId: 1, status: 1 });
veterinaryServiceSchema.index({ storeId: 1, isActive: 1 });
veterinaryServiceSchema.index({ storeId: 1, category: 1, status: 1 });
veterinaryServiceSchema.index({ name: 'text', description: 'text' });

// Virtual for formatted price
veterinaryServiceSchema.virtual('formattedPrice').get(function () {
  return `$${this.price.toFixed(2)}`;
});

// Virtual for formatted duration
veterinaryServiceSchema.virtual('formattedDuration').get(function () {
  const hours = Math.floor(this.duration / 60);
  const minutes = this.duration % 60;
  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${minutes}m`;
  }
});

// Ensure virtuals are included in JSON
veterinaryServiceSchema.set('toJSON', { virtuals: true });
veterinaryServiceSchema.set('toObject', { virtuals: true });

// Pre-save middleware to sync status and isActive
veterinaryServiceSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    this.isActive = this.status === 'active';
  } else if (this.isModified('isActive')) {
    this.status = this.isActive ? 'active' : 'inactive';
  }
  next();
});

module.exports = mongoose.models.VeterinaryService || mongoose.model('VeterinaryService', veterinaryServiceSchema);