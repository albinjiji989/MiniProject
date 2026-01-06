const PetRegistry = require('../models/PetRegistry');
const Pet = require('../models/Pet');
const AdoptionPet = require('../../modules/adoption/manager/models/AdoptionPet');
const PetInventoryItem = require('../../modules/petshop/manager/models/PetInventoryItem');

/**
 * Centralized Pet Service
 * Ensures all pets from different sources are properly registered in the central registry
 */
const CentralizedPetService = {
  /**
   * Register a pet from any source in the centralized registry
   * @param {Object} petData - Pet data including source information
   * @param {String} petData.source - Source of the pet ('core', 'petshop', 'adoption')
   * @param {String} petData.petCode - Unique pet code
   * @param {String} petData.name - Pet name
   * @param {mongoose.Types.ObjectId} petData.species - Species reference
   * @param {mongoose.Types.ObjectId} petData.breed - Breed reference
   * @param {Array} petData.images - Array of image objects with url property
   * @param {mongoose.Types.ObjectId} petData.corePetId - Reference to core pet (Pet or PetNew)
   * @param {mongoose.Types.ObjectId} petData.petShopItemId - Reference to petshop item
   * @param {mongoose.Types.ObjectId} petData.adoptionPetId - Reference to adoption pet
   * @param {mongoose.Types.ObjectId} petData.actorUserId - User who performed the action
   * @param {Object} state - State information for the pet
   * @returns {Promise<Object>} Registered pet registry entry
   */
  async registerPet(petData, state = {}) {
    const {
      source,
      petCode,
      name,
      species,
      breed,
      images = [],
      corePetId,
      petShopItemId,
      adoptionPetId,
      actorUserId
    } = petData;

    if (!petCode) throw new Error('petCode is required for registry registration');
    if (!source) throw new Error('source is required for registry registration');

    // Prepare registry data
    const registryData = {
      petCode,
      name,
      species,
      breed,
      imageIds: Array.isArray(images) ? images.map(img => img.url || img) : [],
      source,
      corePetId,
      petShopItemId,
      adoptionPetId,
      createdBy: actorUserId || undefined,
      updatedBy: actorUserId || undefined
    };

    // Use PetRegistry.ensureRegistered to register the pet
    const registryEntry = await PetRegistry.ensureRegistered(registryData, state);

    return registryEntry;
  },

  /**
   * Update the state of a pet in the centralized registry
   * @param {String} petCode - Unique pet code
   * @param {Object} state - State information to update
   * @param {mongoose.Types.ObjectId} state.currentOwnerId - Current owner ID
   * @param {String} state.currentLocation - Current location
   * @param {String} state.currentStatus - Current status
   * @param {mongoose.Types.ObjectId} state.actorUserId - User who performed the action
   * @param {Date} state.lastTransferAt - Last transfer timestamp
   * @returns {Promise<Object>} Updated registry entry
   */
  async updatePetState(petCode, state) {
    const {
      currentOwnerId,
      currentLocation,
      currentStatus,
      actorUserId,
      lastTransferAt
    } = state;

    // First find the registry entry by petCode
    const registryEntry = await PetRegistry.findOne({ petCode });
    if (!registryEntry) {
      throw new Error(`Pet with code ${petCode} not found in registry`);
    }

    const update = {
      updatedBy: actorUserId || undefined,
      lastSeenAt: new Date()
    };

    if (typeof currentOwnerId !== 'undefined') update.currentOwnerId = currentOwnerId;
    if (typeof currentLocation !== 'undefined') update.currentLocation = currentLocation;
    if (typeof currentStatus !== 'undefined') update.currentStatus = currentStatus;
    if (lastTransferAt) update.lastTransferAt = lastTransferAt;

    // Update the registry entry using findByIdAndUpdate
    const updatedRegistryEntry = await PetRegistry.findByIdAndUpdate(
      registryEntry._id,
      { $set: update },
      { new: true }
    );

    return updatedRegistryEntry;
  },

  /**
   * Get a pet from the centralized registry with all source data populated
   * @param {String} petCode - Unique pet code
   * @returns {Promise<Object>} Pet data with all source information
   */
  async getCentralizedPet(petCode) {
    console.log('🔍 Centralized Service - Looking for pet with petCode:', petCode);
    
    const registryEntry = await PetRegistry.findOne({ petCode })
      .populate('species', 'name displayName')
      .populate('breed', 'name')
      .populate('currentOwnerId', 'name email');

    if (!registryEntry) {
      console.log('❌ Centralized Service - Pet not found in registry with petCode:', petCode);
      throw new Error(`Pet with code ${petCode} not found in registry`);
    }

    console.log('✅ Centralized Service - Found registry entry:', {
      petCode: registryEntry.petCode,
      source: registryEntry.source,
      corePetId: registryEntry.corePetId,
      petShopItemId: registryEntry.petShopItemId,
      adoptionPetId: registryEntry.adoptionPetId
    });

    // Populate the source-specific data based on the source AND fetch images from source
    let sourceData = null;
    let images = [];
    
    switch (registryEntry.source) {
      case 'core':
        // Find in Pet
        console.log('📦 Fetching from core Pet with ID:', registryEntry.corePetId);
        sourceData = await Pet.findById(registryEntry.corePetId).populate('imageIds');
        if (sourceData?.imageIds) {
          images = sourceData.imageIds.map(img => ({
            _id: img._id,
            url: img.url,
            caption: img.caption,
            isPrimary: img.isPrimary
          }));
        }
        break;
      case 'petshop':
        console.log('📦 Fetching from PetInventoryItem with ID:', registryEntry.petShopItemId);
        sourceData = await PetInventoryItem.findById(registryEntry.petShopItemId).populate('imageIds');
        if (sourceData?.imageIds) {
          images = sourceData.imageIds.map(img => ({
            _id: img._id,
            url: img.url,
            caption: img.caption,
            isPrimary: img.isPrimary
          }));
        }
        break;
      case 'adoption':
        console.log('📦 Fetching from AdoptionPet with ID:', registryEntry.adoptionPetId);
        sourceData = await AdoptionPet.findById(registryEntry.adoptionPetId).populate('imageIds');
        if (sourceData?.imageIds) {
          images = sourceData.imageIds.map(img => ({
            _id: img._id,
            url: img.url,
            caption: img.caption,
            isPrimary: img.isPrimary
          }));
        }
        break;
    }

    console.log('✅ Centralized Service - Returning pet with', images.length, 'images');

    return {
      ...registryEntry.toObject(),
      sourceData,
      images  // Add images from source data
    };
  },

  /**
   * Get all pets from the centralized registry with optional filtering
   * @param {Object} filter - Filter criteria
   * @param {Object} options - Query options
   * @param {Number} options.page - Page number
   * @param {Number} options.limit - Results per page
   * @param {Object} options.sort - Sort criteria
   * @returns {Promise<Object>} Paginated results
   */
  async getAllCentralizedPets(filter = {}, options = {}) {
    const { page = 1, limit = 20, sort = { createdAt: -1 } } = options;
    
    const query = { ...filter };
    
    const pets = await PetRegistry.find(query)
      .populate('species', 'name displayName')
      .populate('breed', 'name')
      .populate('currentOwnerId', 'name email')
      .populate('images')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await PetRegistry.countDocuments(query);

    return {
      pets,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    };
  },

  /**
   * Search pets in the centralized registry
   * @param {String} searchTerm - Search term
   * @param {Object} filter - Additional filter criteria
   * @returns {Promise<Array>} Search results
   */
  async searchCentralizedPets(searchTerm, filter = {}) {
    const query = {
      ...filter,
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { petCode: { $regex: searchTerm, $options: 'i' } }
      ]
    };

    const pets = await PetRegistry.find(query)
      .populate('species', 'name displayName')
      .populate('breed', 'name')
      .populate('currentOwnerId', 'name email')
      .populate('images')
      .limit(20);

    return pets;
  }
};

module.exports = CentralizedPetService;