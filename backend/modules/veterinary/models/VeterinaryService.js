const mongoose = require('mongoose');

const veterinaryServiceSchema = new mongoose.Schema({
  // Basic service information
  name: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 100
  },
  description: { 
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  
  // Pricing information
  price: { 
    type: Number, 
    required: true, 
    min: 0,
    validate: {
      validator: Number.isFinite,
      message: 'Price must be a valid number'
    }
  },
  duration: { 
    type: Number, 
    required: true, 
    min: 1,
    validate: {
      validator: Number.isInteger,
      message: 'Duration must be a whole number'
    }
  }, // in minutes
  
  // Service category
  category: { 
    type: String,
    enum: ['examination', 'vaccination', 'surgery', 'grooming', 'dentistry', 'other'],
    default: 'examination'
  },
  
  // Service status
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  
  // Store information
  storeId: { 
    type: String,
    required: true
  },
  
  // Audit fields
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  updatedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }
}, { 
  timestamps: true 
});

// Indexes
veterinaryServiceSchema.index({ name: 1 });
veterinaryServiceSchema.index({ category: 1 });
veterinaryServiceSchema.index({ storeId: 1 });
veterinaryServiceSchema.index({ status: 1 });

module.exports = mongoose.models.VeterinaryService || mongoose.model('VeterinaryService', veterinaryServiceSchema);