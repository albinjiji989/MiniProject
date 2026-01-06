const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  entityType: {
    type: String,
    required: true,
    enum: ['Pet', 'AdoptionPet', 'PetInventoryItem', 'PetNew', 'PetShop', 'Product', 'InventoryItem', 'VeterinaryMedicalRecord', 'purchase_application']
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false, // Can be set after creation during adoption pet processing
    refPath: 'entityType'
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
documentSchema.index({ entityId: 1, entityType: 1 });
documentSchema.index({ type: 1 });
documentSchema.index({ uploadedAt: -1 });

module.exports = mongoose.model('Document', documentSchema);