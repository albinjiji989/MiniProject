const PetRegistryService = require('../../services/centralizedPetService');
const { canAccessPet } = require('./helpers');
const ErrorHandler = require('../../utils/errorHandler');

// @route   GET /api/pets/registry/:petCode/history
// @desc    Get registry history for a pet
// @access  Private
const getRegistryHistory = async (req, res) => {
  try {
    const { petCode } = req.params;
    const history = await PetRegistryService.getHistory(petCode);
    ErrorHandler.sendSuccess(res, { history });
  } catch (error) {
    ErrorHandler.handleControllerError(res, error, 'get_registry_history');
  }
};

// @route   GET /api/pets/registry/:id
// @desc    Get pet from registry by ID
// @access  Private
const getRegistryPetById = async (req, res) => {
  try {
    const PetRegistry = require('../../models/PetRegistry');
    
    // Try to find in PetRegistry by ID
    const registryPet = await PetRegistry.findById(req.params.id)
      .populate('species', 'name displayName')
      .populate('breed', 'name')
      .populate('imageIds')
      .populate('currentOwnerId', 'name email');

    // Manually populate the virtual 'images' field
    if (registryPet) {
      await registryPet.populate('images');
      
      // Based on the source, fetch the actual pet data to get complete information
      let sourcePet = null;
      if (registryPet.source === 'petshop' && registryPet.petShopItemId) {
        // Fetch from PetInventoryItem
        const PetInventoryItem = require('../../../modules/petshop/manager/models/PetInventoryItem');
        sourcePet = await PetInventoryItem.findById(registryPet.petShopItemId)
          .populate('speciesId', 'name displayName')
          .populate('breedId', 'name')
          .populate('imageIds');
        
        if (sourcePet) {
          await sourcePet.populate('images');
        }
      } else if (registryPet.source === 'adoption' && registryPet.adoptionPetId) {
        // Fetch from AdoptionPet
        const AdoptionPet = require('../../../modules/adoption/manager/models/AdoptionPet');
        sourcePet = await AdoptionPet.findById(registryPet.adoptionPetId)
          .populate('species', 'name displayName')
          .populate('breed', 'name')
          .populate('imageIds');
        
        if (sourcePet) {
          await sourcePet.populate('images');
        }
      } else if (registryPet.source === 'core' && registryPet.corePetId) {
        // Fetch from PetNew
        const Pet = require('../../models/Pet');
        sourcePet = await Pet.findById(registryPet.corePetId)
          .populate('speciesId', 'name displayName')
          .populate('breedId', 'name')
          .populate('imageIds');
        
        if (sourcePet) {
          await sourcePet.populate('images');
        }
      }

      // Convert to the format expected by the frontend
      const pet = {
        _id: registryPet._id,
        name: sourcePet?.name || registryPet.name,
        petCode: registryPet.petCode,
        species: sourcePet?.species || sourcePet?.speciesId || registryPet.species,
        speciesId: sourcePet?.species || sourcePet?.speciesId || registryPet.species,
        breed: sourcePet?.breed || sourcePet?.breedId || registryPet.breed,
        breedId: sourcePet?.breed || sourcePet?.breedId || registryPet.breed,
        currentStatus: registryPet.currentStatus,
        source: registryPet.source,
        firstAddedSource: registryPet.firstAddedSource,
        firstAddedAt: registryPet.firstAddedAt,
        acquiredDate: registryPet.lastTransferAt || registryPet.updatedAt,
        images: sourcePet?.images || registryPet.images || [],
        gender: sourcePet?.gender || 'Unknown',
        age: sourcePet?.age || 0,
        ageUnit: sourcePet?.ageUnit || 'months',
        color: sourcePet?.color || '',
        healthStatus: sourcePet?.healthStatus || 'Good',
        size: sourcePet?.size || 'medium',
        weight: sourcePet?.weight || { value: 0, unit: 'kg' },
        createdBy: registryPet.currentOwnerId,
        lastUpdatedBy: registryPet.currentOwnerId,
        createdAt: registryPet.createdAt,
        updatedAt: registryPet.updatedAt
      };

      // Check access permissions
      if (!canAccessPet(req.user, { storeId: registryPet.storeId, owner: registryPet.currentOwnerId })) {
        return ErrorHandler.sendError(res, 'Forbidden', 403);
      }

      return ErrorHandler.sendSuccess(res, { pet });
    }

    return ErrorHandler.sendError(res, 'Pet not found in registry', 404);
  } catch (error) {
    ErrorHandler.handleControllerError(res, error, 'get_registry_pet_by_id');
  }
};

module.exports = {
  getRegistryHistory,
  getRegistryPetById
};