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
  images: [{
    url: String,
    caption: String,
    isPrimary: { type: Boolean, default: false }
  }],

  // Source references (sparse, only one is typically set)
  source: { type: String, enum: ['core', 'petshop', 'adoption'], required: true },
  corePetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', index: true, sparse: true },
  petShopItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'PetInventoryItem', index: true, sparse: true },
  adoptionPetId: { type: mongoose.Schema.Types.ObjectId, ref: 'AdoptionPet', index: true, sparse: true },

  // Ownership/location/state
  currentOwnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  currentLocation: { type: String, enum: ['at_petshop', 'at_adoption_center', 'in_transit', 'at_owner', 'unknown'], default: 'unknown' },
  currentStatus: { type: String, default: 'unknown' }, // e.g., available, reserved, sold, adopted, owned
  lastTransferAt: { type: Date },
  lastSeenAt: { type: Date, default: Date.now },

  // For quick joins with history/logs
  logsCount: { type: Number, default: 0 },

  // Audit
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  metadata: { type: Object }
}, { timestamps: true })

petRegistrySchema.index({ petCode: 1 }, { unique: true })
petRegistrySchema.index({ currentOwnerId: 1 })

module.exports = mongoose.model('PetRegistry', petRegistrySchema)
