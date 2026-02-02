const mongoose = require('mongoose')

// Centralized registry for ALL pets across modules
// One document per unique petCode
// Simplified registry - only essential identification and routing information
const petRegistrySchema = new mongoose.Schema({
  // Core identity
  petCode: {
    type: String,
    required: true,
    validate: {
      validator: v => /^[A-Z]{3}\d{5}$/.test(v),
      message: 'petCode must be 3 uppercase letters followed by 5 digits'
    }
  },
  name: { type: String, trim: true },
  species: { 
    type: mongoose.Schema.Types.Mixed, // Can be ObjectId reference or string
  },
  breed: { 
    type: mongoose.Schema.Types.Mixed, // Can be ObjectId reference or string
  },
  
  // Basic pet information
  gender: { type: String, enum: ['Male', 'Female', 'Unknown'], default: 'Unknown' },
  dateOfBirth: { type: Date },
  dobAccuracy: { type: String, enum: ['exact', 'estimated'], default: 'estimated' },
  color: { type: String },

  // Source information - where this pet lives
  source: { 
    type: String, 
    enum: ['core', 'petshop', 'adoption', 'user'], 
    required: true 
  },
  sourceLabel: { type: String, default: '' }, // Human-readable source label
  
  // References to the specific pet tables (only one will be set)
  petShopItemId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'PetInventoryItem', 
    sparse: true 
  },
  adoptionPetId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'AdoptionPet', 
    sparse: true 
  },
  userPetId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Pet', 
    sparse: true 
  },

  // Minimal tracking
  firstAddedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  firstAddedAt: { type: Date, default: Date.now },
  firstAddedSource: { 
    type: String, 
    enum: ['user', 'adoption_center', 'pet_shop'], 
    required: true 
  },
  
  // Last seen for staleness tracking
  lastSeenAt: { type: Date, default: Date.now },
  
  // Audit
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Soft Delete
  isDeleted: { type: Boolean, default: false },
  
  // Status tracking
  currentOwnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  currentLocation: { type: String, default: 'at_adoption_center' },
  currentStatus: { type: String, default: 'available' },
  lastTransferAt: { type: Date },
  isDeceased: { type: Boolean, default: false },
  deceasedAt: { type: Date },
  deceasedReason: { type: String },
  
  // Image and document references
  imageIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Image'
  }],
  
  documentIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  }],
  
  ownershipHistory: [{
    previousOwnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    newOwnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    transferType: { type: String },
    transferDate: { type: Date, default: Date.now },
    transferPrice: { type: Number, default: 0 },
    transferReason: { type: String },
    source: { type: String },
    notes: { type: String },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    endDate: { type: Date }
  }]
}, { timestamps: true })

// Unique index for petCode
petRegistrySchema.index({ petCode: 1 }, { unique: true })

// Essential indexes for common queries
petRegistrySchema.index({ source: 1 })
petRegistrySchema.index({ firstAddedSource: 1 })
petRegistrySchema.index({ isDeleted: 1 })
petRegistrySchema.index({ firstAddedSource: 1, createdAt: -1 })

// Reference indexes
petRegistrySchema.index({ petShopItemId: 1 })
petRegistrySchema.index({ adoptionPetId: 1 })
petRegistrySchema.index({ userPetId: 1 })

// Virtual for populating images
petRegistrySchema.virtual('images', {
  ref: 'Image',
  localField: 'imageIds',
  foreignField: '_id',
  justOne: false
});

// Virtual for populating documents
petRegistrySchema.virtual('documents', {
  ref: 'Document',
  localField: 'documentIds',
  foreignField: '_id',
  justOne: false
});

// Virtual for age (backward compatibility)
petRegistrySchema.virtual('age').get(function () {
  if (!this.dateOfBirth) return 0;
  const ageCalc = require('../utils/ageCalculator');
  return ageCalc.calculateAgeFromDOB(this.dateOfBirth, 'months');
});

petRegistrySchema.virtual('ageUnit').get(function () {
  return 'months'; // Default unit for backward compatibility
});

petRegistrySchema.virtual('ageDisplay').get(function () {
  if (!this.dateOfBirth) return 'Unknown';
  const ageCalc = require('../utils/ageCalculator');
  return ageCalc.formatAge(this.dateOfBirth);
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
    documentIds = [],
    source,
    petShopItemId,
    adoptionPetId,
    userPetId,
    firstAddedSource,
    firstAddedBy
  } = petData;

  if (!petCode) throw new Error('petCode is required for registry registration');

  // Simple approach: always try to create, handle duplicate key errors
  try {
    const createData = {
      petCode,
      name,
      species,
      breed,
      imageIds: Array.isArray(imageIds) ? imageIds : [],
      documentIds: Array.isArray(documentIds) ? documentIds : [],
      source: source || 'core',
      sourceLabel: source === 'adoption' ? 'Adoption Center' : 
                  source === 'petshop' ? 'Pet Shop' : 
                  source === 'user' ? 'User Added' : 
                  'User Added',
      createdBy: firstAddedBy || undefined,
      updatedBy: firstAddedBy || undefined,
      firstAddedBy: firstAddedBy || undefined,
      firstAddedSource: firstAddedSource || 'user',
      lastSeenAt: new Date()
    };

    // Set the appropriate reference based on source
    if (userPetId) createData.userPetId = userPetId;
    if (petShopItemId) createData.petShopItemId = petShopItemId;
    if (adoptionPetId) createData.adoptionPetId = adoptionPetId;

    // Apply state if provided
    if (state) {
      if (state.currentOwnerId) createData.currentOwnerId = state.currentOwnerId;
      if (state.currentLocation) createData.currentLocation = state.currentLocation;
      if (state.currentStatus) createData.currentStatus = state.currentStatus;
      if (state.lastTransferAt) createData.lastTransferAt = state.lastTransferAt;
    }

    const registryEntry = await this.create(createData);
    return registryEntry;
  } catch (error) {
    // If it's a duplicate key error, update the existing entry
    if (error.code === 11000) { // Duplicate key error
      // Find the existing entry
      const existingEntry = await this.findOne({ petCode });
      if (existingEntry) {
        // Update existing entry
        const update = {
          name,
          species,
          breed,
          imageIds: Array.isArray(imageIds) ? imageIds : [],
          documentIds: Array.isArray(documentIds) ? documentIds : [],
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

        // Apply state if provided
        if (state) {
          if (state.currentOwnerId) update.currentOwnerId = state.currentOwnerId;
          if (state.currentLocation) update.currentLocation = state.currentLocation;
          if (state.currentStatus) update.currentStatus = state.currentStatus;
          if (state.lastTransferAt) update.lastTransferAt = state.lastTransferAt;
        }

        // Update the existing entry
        const registryEntry = await this.findByIdAndUpdate(
          existingEntry._id,
          { $set: update },
          { new: true, session: options.session }
        );
        
        return registryEntry;
      }
    }
    // If it's not a duplicate key error, rethrow
    throw error;
  }
}

// Virtual getters for consistent species and breed access
petRegistrySchema.virtual('speciesName').get(function() {
  // If species is an ObjectId reference, we would populate it
  // If it's a string, return it directly
  if (typeof this.species === 'string') {
    return this.species;
  } else if (this.species && this.species.name) {
    return this.species.name;
  }
  return null;
});

petRegistrySchema.virtual('breedName').get(function() {
  // If breed is an ObjectId reference, we would populate it
  // If it's a string, return it directly
  if (typeof this.breed === 'string') {
    return this.breed;
  } else if (this.breed && this.breed.name) {
    return this.breed.name;
  }
  return null;
});

// Ensure virtual fields are serialized
petRegistrySchema.set('toJSON', { virtuals: true });

// Static method to get a pet with all its details from the appropriate source
petRegistrySchema.statics.getFullPetDetails = async function (petCode) {
  // First get the registry entry
  const registryEntry = await this.findOne({ petCode })
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
      .populate('createdBy', 'name email')
      .populate('imageIds')
      .populate('documentIds');
    
    // Manually populate the virtual 'images' and 'documents' fields
    if (detailedPet) {
      await detailedPet.populate('images');
      await detailedPet.populate('documents');
    }
  } else if (registryEntry.petShopItemId) {
    // Get petshop pet details
    const PetShopItem = mongoose.model('PetInventoryItem');
    detailedPet = await PetShopItem.findById(registryEntry.petShopItemId)
      .populate('speciesId', 'name displayName')
      .populate('breedId', 'name')
      .populate('storeId', 'name')
      .populate('createdBy', 'name email')
      .populate('imageIds')
      .populate('documentIds');
    
    // Manually populate the virtual 'images' and 'documents' fields
    if (detailedPet) {
      await detailedPet.populate('images');
      await detailedPet.populate('documents');
    }
  } else if (registryEntry.adoptionPetId) {
    // Get adoption pet details
    const AdoptionPet = mongoose.model('AdoptionPet');
    detailedPet = await AdoptionPet.findById(registryEntry.adoptionPetId)
      .populate('createdBy', 'name email')
      .populate('imageIds')
      .populate('documentIds');
    
    // Manually populate the virtual 'images' and 'documents' fields
    if (detailedPet) {
      await detailedPet.populate('images');
      await detailedPet.populate('documents');
    }
  }

  return {
    registry: registryEntry,
    details: detailedPet
  };
}

const PetRegistry = mongoose.models.PetRegistry || mongoose.model('PetRegistry', petRegistrySchema);

module.exports = PetRegistry;
