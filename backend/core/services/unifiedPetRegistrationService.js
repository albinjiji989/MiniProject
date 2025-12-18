const PetRegistryService = require('./petRegistryService');
const Pet = require('../models/Pet');
const OwnershipHistory = require('../models/OwnershipHistory');

/**
 * Unified Pet Registration Service
 * Ensures consistent registration across all pet types:
 * - Adoption pets
 * - Pet shop pets  
 * - User-added pets
 */
const UnifiedPetRegistrationService = {
  /**
   * Register a pet in all required systems with consistent data
   * @param {Object} params - Registration parameters
   * @param {String} params.petCode - Unique pet code
   * @param {String} params.name - Pet name
   * @param {mongoose.Types.ObjectId} params.species - Species reference
   * @param {mongoose.Types.ObjectId} params.breed - Breed reference
   * @param {Array} params.images - Array of image objects or image IDs
   * @param {String} params.source - Source of pet ('core', 'petshop', 'adoption')
   * @param {String} params.firstAddedSource - Where pet was first added ('user', 'adoption_center', 'pet_shop')
   * @param {mongoose.Types.ObjectId} params.firstAddedBy - User who first added the pet
   * @param {mongoose.Types.ObjectId} params.currentOwnerId - Current owner of the pet
   * @param {String} params.currentStatus - Current status of the pet
   * @param {String} params.currentLocation - Current location of the pet
   * @param {String} params.gender - Gender of the pet
   * @param {Number} params.age - Age of the pet
   * @param {String} params.ageUnit - Age unit ('weeks', 'months', 'years')
   * @param {String} params.color - Color of the pet
   * @param {Object} params.weight - Weight object {value, unit}
   * @param {String} params.size - Size of the pet
   * @param {Array} params.temperament - Temperament traits
   * @param {Array} params.specialNeeds - Special needs
   * @param {Object} params.sourceReferences - References to source models
   * @param {mongoose.Types.ObjectId} params.sourceReferences.corePetId - Reference to Pet model
   * @param {mongoose.Types.ObjectId} params.sourceReferences.petShopItemId - Reference to PetInventoryItem model
   * @param {mongoose.Types.ObjectId} params.sourceReferences.adoptionPetId - Reference to AdoptionPet model
   * @param {Object} params.ownershipTransfer - Ownership transfer details
   * @param {mongoose.Types.ObjectId} params.ownershipTransfer.previousOwnerId - Previous owner
   * @param {String} params.ownershipTransfer.transferType - Type of transfer ('initial', 'purchase', 'adoption', 'transfer', 'return')
   * @param {Number} params.ownershipTransfer.transferPrice - Transfer price
   * @param {String} params.ownershipTransfer.transferReason - Reason for transfer
   * @param {String} params.ownershipTransfer.notes - Additional notes
   * @param {mongoose.Types.ObjectId} params.ownershipTransfer.performedBy - User who performed the transfer
   * @param {mongoose.Types.ObjectId} params.actorUserId - User performing the current action
   * @returns {Promise<Object>} Registered pet data
   */
  async registerPet({
    petCode,
    name,
    species,
    breed,
    images = [],
    source,
    firstAddedSource,
    firstAddedBy,
    currentOwnerId,
    currentStatus,
    currentLocation,
    gender,
    age,
    ageUnit,
    color,
    weight,
    size,
    temperament = [],
    specialNeeds = [],
    sourceReferences = {},
    ownershipTransfer = {},
    actorUserId
  }) {
    // Validate required parameters
    if (!petCode) throw new Error('petCode is required');
    if (!source) throw new Error('source is required');
    if (!currentOwnerId) throw new Error('currentOwnerId is required');

    // Prepare registry identity data
    const registryIdentity = {
      petCode,
      name,
      species,
      breed,
      images,
      source,
      firstAddedSource,
      firstAddedBy,
      gender,
      age,
      ageUnit,
      color,
      actorUserId,
      ...sourceReferences
    };

    // Prepare registry state data
    const registryState = {
      currentOwnerId,
      currentLocation,
      currentStatus,
      actorUserId
    };

    // Register in PetRegistry with identity and state
    const registryEntry = await PetRegistryService.upsertAndSetState(registryIdentity, registryState);

    // Record ownership transfer if provided
    if (ownershipTransfer && ownershipTransfer.newOwnerId) {
      await PetRegistryService.recordOwnershipTransfer({
        petCode,
        previousOwnerId: ownershipTransfer.previousOwnerId,
        newOwnerId: ownershipTransfer.newOwnerId,
        transferType: ownershipTransfer.transferType,
        transferPrice: ownershipTransfer.transferPrice || 0,
        transferReason: ownershipTransfer.transferReason || '',
        source: ownershipTransfer.source || source,
        notes: ownershipTransfer.notes || '',
        performedBy: ownershipTransfer.performedBy || actorUserId
      });
    }

    return registryEntry;
  },

  /**
   * Create user pet records in Pet model
   * @param {Object} params - Pet creation parameters
   * @returns {Promise<Object>} Created pet records
   */
  async createUserPetRecords({
    name,
    speciesId,
    breedId,
    ownerId,
    gender,
    age,
    ageUnit,
    color,
    weight,
    size,
    temperament,
    specialNeeds,
    imageIds,
    currentStatus,
    healthStatus,
    createdBy
  }) {
    // Create in Pet model
    const petPayload = {
      name: String(name).trim(),
      species: speciesId,
      breed: breedId,
      owner: ownerId,
      createdBy: createdBy,
      gender: gender || 'Unknown',
      age: typeof age === 'number' ? age : (age ? Number(age) : undefined),
      ageUnit: ageUnit || 'months',
      color: color || undefined,
      weight: weight || { value: 0, unit: 'kg' },
      size: size || 'medium',
      temperament: temperament || [],
      specialNeeds: specialNeeds || [],
      imageIds: imageIds || [],
      currentStatus: currentStatus || 'Available',
      healthStatus: healthStatus || 'Good'
    };

    const pet = new Pet(petPayload);
    await pet.save();

    // Removed PetNew model creation as it doesn't exist
    // Update image documents with entity IDs
    if (imageIds && imageIds.length > 0) {
      const Image = require('../models/Image');
      await Image.updateMany(
        { _id: { $in: imageIds } },
        { $set: { entityId: pet._id } }
      );
    }

    return { pet };
  },

  /**
   * Create ownership history record
   * @param {Object} params - Ownership history parameters
   * @returns {Promise<Object>} Created ownership history record
   */
  async createOwnershipHistory({
    petId,
    previousOwner,
    newOwner,
    transferType,
    reason,
    transferFee,
    createdBy
  }) {
    const ownershipHistory = new OwnershipHistory({
      pet: petId,
      previousOwner: previousOwner,
      newOwner: newOwner,
      transferType: transferType,
      reason: reason,
      transferFee: transferFee,
      createdBy: createdBy
    });

    await ownershipHistory.save();
    return ownershipHistory;
  }
};

module.exports = UnifiedPetRegistrationService;