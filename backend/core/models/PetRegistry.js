const mongoose = require('mongoose')

// Centralized registry for ALL pets across modules
// One document per unique petCode
const petRegistrySchema = new mongoose.Schema({
  // Identity
  petCode: {
    type: String,
    required: true,
    index: true,
    validate: {
      validator: v => /^[A-Z]{3}\d{5}$/.test(v),
      message: 'petCode must be 3 uppercase letters followed by 5 digits'
    }
  },
  name: { type: String, trim: true },
  species: { type: mongoose.Schema.Types.ObjectId, ref: 'Species' },
  breed: { type: mongoose.Schema.Types.ObjectId, ref: 'Breed' },
  imageIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Image'
  }],

  // Source references (sparse, only one is typically set)
  source: { type: String, enum: ['core', 'petshop', 'adoption'], required: true },
  sourceLabel: { type: String, default: '' }, // Human-readable source label
  firstAddedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Who first added this pet
  firstAddedAt: { type: Date, default: Date.now }, // When pet was first added
  firstAddedSource: { type: String, enum: ['user', 'adoption_center', 'pet_shop'], required: true }, // Where pet was first added
  corePetId: { type: mongoose.Schema.Types.ObjectId, index: true, sparse: true }, // Can reference either Pet or PetNew
  petShopItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'PetInventoryItem', index: true, sparse: true },
  adoptionPetId: { type: mongoose.Schema.Types.ObjectId, ref: 'AdoptionPet', index: true, sparse: true },

  // Ownership/location/state
  currentOwnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  currentLocation: { type: String, enum: ['at_petshop', 'at_adoption_center', 'in_transit', 'at_owner', 'unknown'], default: 'unknown' },
  currentStatus: { type: String, default: 'unknown' }, // e.g., available, reserved, sold, adopted, owned
  lastTransferAt: { type: Date },
  lastSeenAt: { type: Date, default: Date.now },
  
  // Ownership history tracking
  ownershipHistory: [{
    previousOwnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    newOwnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    transferType: { type: String, enum: ['initial', 'purchase', 'adoption', 'transfer', 'return'], required: true },
    transferDate: { type: Date, default: Date.now },
    transferPrice: { type: Number, default: 0 },
    transferReason: { type: String, trim: true },
    source: { type: String }, // Where transfer happened (petshop, adoption, user-to-user)
    notes: { type: String, trim: true },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],

  // For quick joins with history/logs
  logsCount: { type: Number, default: 0 },

  // Audit
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  metadata: { type: Object }
}, { timestamps: true })

petRegistrySchema.index({ petCode: 1 }, { unique: true })
petRegistrySchema.index({ currentOwnerId: 1 })

// Virtual for populating images
petRegistrySchema.virtual('images', {
  ref: 'Image',
  localField: 'imageIds',
  foreignField: '_id',
  justOne: false
});

// Include virtuals in JSON/Object outputs
petRegistrySchema.set('toJSON', { virtuals: true })
petRegistrySchema.set('toObject', { virtuals: true })

// Instance methods for ownership tracking
petRegistrySchema.methods.recordOwnershipTransfer = function({
  previousOwnerId,
  newOwnerId,
  transferType,
  transferPrice = 0,
  transferReason = '',
  source = '',
  notes = '',
  performedBy
}) {
  // Close previous ownership record if exists
  if (this.ownershipHistory.length > 0) {
    const lastRecord = this.ownershipHistory[this.ownershipHistory.length - 1]
    if (!lastRecord.endDate) {
      lastRecord.endDate = new Date()
    }
  }
  
  // Add new ownership record
  this.ownershipHistory.push({
    previousOwnerId: previousOwnerId || this.currentOwnerId,
    newOwnerId,
    transferType,
    transferDate: new Date(),
    transferPrice,
    transferReason,
    source,
    notes,
    performedBy
  })
  
  // Update current owner
  this.currentOwnerId = newOwnerId
  this.lastTransferAt = new Date()
  
  return this
}

petRegistrySchema.methods.getOwnershipSummary = function() {
  const history = this.ownershipHistory || []
  const firstOwnership = history.length > 0 ? history[0] : null
  const currentOwnership = history.length > 0 ? history[history.length - 1] : null
  
  return {
    totalTransfers: history.length,
    firstAddedSource: this.firstAddedSource,
    firstAddedAt: this.firstAddedAt,
    firstOwner: firstOwnership?.newOwnerId,
    currentOwner: this.currentOwnerId,
    currentOwnerSince: currentOwnership?.transferDate,
    totalOwners: new Set(history.map(h => h.newOwnerId?.toString())).size
  }
}

module.exports = mongoose.model('PetRegistry', petRegistrySchema)