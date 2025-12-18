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

  // Physical characteristics
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Unknown'],
    default: 'Unknown'
  },
  age: {
    type: Number,
    min: [0, 'Age cannot be negative']
  },
  ageUnit: {
    type: String,
    enum: ['weeks', 'months', 'years'],
    default: 'months'
  },
  color: {
    type: String,
    trim: true,
    maxlength: [50, 'Color cannot exceed 50 characters']
  },

  // Source references (sparse, only one is typically set)
  source: { 
    type: String, 
    enum: ['core', 'petshop', 'adoption', 'user'], 
    required: true 
  },
  sourceLabel: { type: String, default: '' }, // Human-readable source label
  firstAddedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Who first added this pet
  firstAddedAt: { type: Date, default: Date.now }, // When pet was first added
  firstAddedSource: { 
    type: String, 
    enum: ['user', 'adoption_center', 'pet_shop'], 
    required: true 
  }, // Where pet was first added
  
  // References to the specific pet tables
  petShopItemId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'PetInventoryItem', 
    index: true, 
    sparse: true 
  },
  adoptionPetId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'AdoptionPet', 
    index: true, 
    sparse: true 
  },
  userPetId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Pet', 
    index: true, 
    sparse: true 
  },

  // Relationships to track generated pets from stock
  stockId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'PetStock', 
    index: true, 
    sparse: true 
  }, // If generated from stock
  generatedFromStock: { type: Boolean, default: false }, // Indicates if this pet was generated from stock
  stockGenerationDate: { type: Date }, // When this pet was generated from stock

  // Ownership/location/state
  currentOwnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  currentLocation: { 
    type: String, 
    enum: [
      'at_petshop', 
      'at_adoption_center', 
      'in_transit', 
      'at_owner', 
      'in_hospital', 
      'in_temporary_care', 
      'deceased', 
      'unknown'
    ], 
    default: 'unknown' 
  },
  currentStatus: { 
    type: String, 
    default: 'unknown' 
  }, // e.g., available, reserved, sold, adopted, owned, in_hospital, in_temporary_care
  lastTransferAt: { type: Date },
  lastSeenAt: { type: Date, default: Date.now },

  // Additional tracking
  isDeceased: { type: Boolean, default: false },
  deceasedAt: { type: Date },
  deceasedReason: { type: String, trim: true },

  // Ownership history tracking
  ownershipHistory: [{
    previousOwnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    newOwnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    transferType: { 
      type: String, 
      enum: [
        'initial', 
        'purchase', 
        'adoption', 
        'transfer', 
        'return', 
        'hospital_admission', 
        'hospital_discharge', 
        'temporary_care_start', 
        'temporary_care_end'
      ], 
      required: true 
    },
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
  metadata: { type: Object },

  // Soft Delete
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Audit Trail - Track all changes
  changeHistory: [{
    field: { type: String, required: true },
    oldValue: { type: mongoose.Schema.Types.Mixed },
    newValue: { type: mongoose.Schema.Types.Mixed },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
    reason: { type: String, trim: true }
  }]
}, { timestamps: true })

// Unique index for petCode
petRegistrySchema.index({ petCode: 1 }, { unique: true })

// Single field indexes
petRegistrySchema.index({ currentOwnerId: 1 })
petRegistrySchema.index({ source: 1 })
petRegistrySchema.index({ currentStatus: 1 })
petRegistrySchema.index({ currentLocation: 1 })
petRegistrySchema.index({ firstAddedSource: 1 })
petRegistrySchema.index({ isDeleted: 1 })

// Compound indexes for common queries
petRegistrySchema.index({ source: 1, currentStatus: 1 })
petRegistrySchema.index({ currentOwnerId: 1, currentLocation: 1 })
petRegistrySchema.index({ currentOwnerId: 1, isDeleted: 1 })
petRegistrySchema.index({ firstAddedSource: 1, createdAt: -1 })
petRegistrySchema.index({ currentStatus: 1, currentLocation: 1 })
petRegistrySchema.index({ isDeleted: 1, currentStatus: 1 })

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
petRegistrySchema.methods.recordOwnershipTransfer = function ({
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

petRegistrySchema.methods.getOwnershipSummary = function () {
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

// Instance method to mark pet as deceased
petRegistrySchema.methods.markAsDeceased = function (reason, performedBy) {
  this.isDeceased = true;
  this.deceasedAt = new Date();
  this.deceasedReason = reason;
  this.currentLocation = 'deceased';
  this.currentStatus = 'deceased';

  // Record ownership transfer for death
  if (this.currentOwnerId) {
    this.recordOwnershipTransfer({
      previousOwnerId: this.currentOwnerId,
      newOwnerId: null,
      transferType: 'death',
      transferReason: reason,
      performedBy: performedBy
    });
  }

  return this.save();
}

// Instance method to get pet source details
petRegistrySchema.methods.getSourceDetails = function () {
  return {
    source: this.source,
    sourceLabel: this.sourceLabel,
    firstAddedSource: this.firstAddedSource,
    firstAddedBy: this.firstAddedBy,
    firstAddedAt: this.firstAddedAt,
    generatedFromStock: this.generatedFromStock,
    stockId: this.stockId,
    stockGenerationDate: this.stockGenerationDate
  };
}

// Instance method to update pet location and status
petRegistrySchema.methods.updateLocationAndStatus = function (location, status) {
  this.currentLocation = location;
  this.currentStatus = status;
  this.lastSeenAt = new Date();
  return this.save();
}

// Static method to find all pets by owner
petRegistrySchema.statics.findByOwner = function (ownerId) {
  return this.find({ currentOwnerId: ownerId });
}

// Static method to find all pets by source
petRegistrySchema.statics.findBySource = function (source) {
  return this.find({ source: source });
}

// Static method to find all pets by location
petRegistrySchema.statics.findByLocation = function (location) {
  return this.find({ currentLocation: location });
}

// Static method to find all pets by status
petRegistrySchema.statics.findByStatus = function (status) {
  return this.find({ currentStatus: status });
}

// Static method to find deceased pets
petRegistrySchema.statics.findDeceased = function () {
  return this.find({ isDeceased: true });
}

// Static method to ensure a pet is properly registered
petRegistrySchema.statics.ensureRegistered = async function (petData, state = {}, options = {}) {
  const {
    petCode,
    name,
    species,
    breed,
    imageIds = [],
    source,
    petShopItemId,
    adoptionPetId,
    userPetId,
    firstAddedSource,
    firstAddedBy
  } = petData;

  if (!petCode) throw new Error('petCode is required for registry registration');

  // Prepare update data
  const update = {
    name,
    species,
    breed,
    imageIds: Array.isArray(imageIds) ? imageIds : [],
    source: source || 'core',
    updatedBy: firstAddedBy || undefined,
    lastSeenAt: new Date()
  };

  // Set the appropriate reference based on source
  if (userPetId) update.userPetId = userPetId;
  if (petShopItemId) update.petShopItemId = petShopItemId;
  if (adoptionPetId) update.adoptionPetId = adoptionPetId;

  // Set source label based on source
  const sourceLabels = {
    'core': 'User Added',
    'petshop': 'Pet Shop',
    'adoption': 'Adoption Center',
    'user': 'User Added'
  };
  update.sourceLabel = sourceLabels[source] || source;

  // Prepare $setOnInsert data
  const setOnInsert = {
    petCode,
    createdBy: firstAddedBy || undefined
  };

  // Set first added info if provided
  if (firstAddedSource) {
    update.firstAddedSource = firstAddedSource;
    setOnInsert.firstAddedAt = new Date();
  }
  if (firstAddedBy) {
    update.firstAddedBy = firstAddedBy;
    if (!setOnInsert.firstAddedAt) {
      setOnInsert.firstAddedAt = new Date();
    }
  }

  // Apply state if provided
  if (state) {
    if (state.currentOwnerId) update.currentOwnerId = state.currentOwnerId;
    if (state.currentLocation) update.currentLocation = state.currentLocation;
    if (state.currentStatus) update.currentStatus = state.currentStatus;
    if (state.lastTransferAt) update.lastTransferAt = state.lastTransferAt;
  }

  const registryEntry = await this.findOneAndUpdate(
    { petCode },
    { $set: update, $setOnInsert: setOnInsert },
    { new: true, upsert: true, setDefaultsOnInsert: true, session: options.session }
  );

  return registryEntry;
}

// Static method to get a pet with all its details from the appropriate source
petRegistrySchema.statics.getFullPetDetails = async function (petCode) {
  // First get the registry entry
  const registryEntry = await this.findOne({ petCode })
    .populate('species', 'name displayName')
    .populate('breed', 'name')
    .populate('images')
    .populate('currentOwnerId', 'name email')
    .populate('firstAddedBy', 'name email');

  if (!registryEntry) {
    throw new Error(`Pet with code ${petCode} not found in registry`);
  }

  // Get the detailed pet information based on source
  let detailedPet = null;
  
  if (registryEntry.userPetId) {
    // Get user pet details
    const UserPet = mongoose.model('Pet');
    detailedPet = await UserPet.findById(registryEntry.userPetId)
      .populate('speciesId', 'name displayName')
      .populate('breedId', 'name')
      .populate('ownerId', 'name email')
      .populate('createdBy', 'name email');
  } else if (registryEntry.petShopItemId) {
    // Get petshop pet details
    const PetShopItem = mongoose.model('PetInventoryItem');
    detailedPet = await PetShopItem.findById(registryEntry.petShopItemId)
      .populate('speciesId', 'name displayName')
      .populate('breedId', 'name')
      .populate('storeId', 'name')
      .populate('createdBy', 'name email');
  } else if (registryEntry.adoptionPetId) {
    // Get adoption pet details
    const AdoptionPet = mongoose.model('AdoptionPet');
    detailedPet = await AdoptionPet.findById(registryEntry.adoptionPetId)
      .populate('createdBy', 'name email');
  }

  return {
    registry: registryEntry,
    details: detailedPet
  };
}

const PetRegistry = mongoose.models.PetRegistry || mongoose.model('PetRegistry', petRegistrySchema);

module.exports = PetRegistry;
