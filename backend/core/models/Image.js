const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  caption: {
    type: String,
    trim: true
  },
  isPrimary: {
    type: Boolean,
    default: false
  },
  entityType: {
    type: String,
    required: true,
    enum: ['Pet', 'PetRegistry', 'AdoptionPet', 'PetInventoryItem', 'PetNew', 'PetShop', 'Product', 'InventoryItem', 'VeterinaryMedicalRecord']
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false, // Can be set after creation during adoption pet processing
    refPath: 'entityType'
  },
  // New fields for better organization
  module: {
    type: String,
    required: false,
    enum: ['core', 'adoption', 'petshop', 'veterinary', 'temporary-care', 'otherpets']
  },
  role: {
    type: String,
    required: false,
    enum: ['admin', 'manager', 'user']
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
imageSchema.index({ entityId: 1, entityType: 1 });
imageSchema.index({ isPrimary: 1 });
imageSchema.index({ uploadedAt: -1 });
imageSchema.index({ module: 1, role: 1 });

// Add a pre-save hook to log when an image is being saved
imageSchema.pre('save', function(next) {
  console.log('💾 Saving image document:', {
    url: this.url,
    entityType: this.entityType,
    entityId: this.entityId,
    isPrimary: this.isPrimary,
    module: this.module,
    role: this.role
  });
  next();
});

module.exports = mongoose.model('Image', imageSchema);