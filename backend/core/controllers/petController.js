const Pet = require('../models/Pet');
const PetChangeLog = require('../models/PetChangeLog');
const { getStoreFilter, addStoreInfo } = require('../utils/storeFilter');
const PetRegistryService = require('../services/centralizedPetService');
const UnifiedPetRegistrationService = require('../services/unifiedPetRegistrationService');

// Import modularized controllers
const { canAccessPet } = require('./pet/helpers');
const { addOwnershipHistory, getPetHistory } = require('./pet/petOwnershipController');
const { addMedicalHistory, addVaccinationRecord, addMedicationRecord } = require('./pet/petMedicalController');
const { getRegistryHistory, getRegistryPetById } = require('./pet/petRegistryController');
const ErrorHandler = require('../utils/errorHandler');
const logger = require('../utils/logger');
const { validate, createPetSchema, updatePetSchema, searchNearbyPetsSchema } = require('../utils/validation');

// @route   GET /api/pets/my-pets
// @desc    Get owned pets (pets that user purchased and received)
const getOwnedPets = async (req, res) => {
  try {
    // Query PetRegistry for all pets owned by current user
    const PetRegistry = require('../models/PetRegistry');
    
    // Include pets with status 'owned', 'sold', 'adopted' or location 'at_owner' AND owned by current user
    let registryPets = await PetRegistry.find({ 
      $and: [
        {
          currentOwnerId: req.user._id
        },
        {
          $or: [
            { currentStatus: { $in: ['owned', 'sold', 'adopted'] } },
            { currentLocation: 'at_owner' }
          ]
        }
      ]
    })
      .populate('species', 'name displayName')
      .populate('breed', 'name')
      .populate('imageIds') // Populate the imageIds field
      .sort({ updatedAt: -1 });
    
    // Manually populate the virtual 'images' field for each pet
    // Safer population with error handling
    for (const pet of registryPets) {
      try {
        await pet.populate('images');
      } catch (populateErr) {
        logger.warn(`Failed to populate images for pet ${pet._id}:`, populateErr.message);
        // Continue with the pet even if image population fails
      }
    }
    
    logger.debug(`Registry pets found: ${registryPets.length}`);
    
    // Convert to plain objects AFTER population
    const registryPetsPlain = registryPets.map(p => {
      const plain = p.toObject({ virtuals: true });
      // Ensure images are properly included
      plain.images = plain.images || plain.imageIds || [];
      return plain;
    });
    
    // Map registry pets to include source information
    const pets = registryPetsPlain.map(regPet => {
      return {
        _id: regPet.corePetId || regPet.petShopItemId || regPet.adoptionPetId || regPet._id,
        name: regPet.name,
        petCode: regPet.petCode,
        images: regPet.images || regPet.imageIds || [], // Ensure images are properly included
        species: regPet.species,
        speciesId: regPet.species,
        breed: regPet.breed,
        breedId: regPet.breed,
        currentStatus: regPet.currentStatus,
        source: regPet.source,
        sourceLabel: regPet.sourceLabel,
        firstAddedSource: regPet.firstAddedSource,
        firstAddedAt: regPet.firstAddedAt,
        acquiredDate: regPet.lastTransferAt || regPet.updatedAt,
        gender: regPet.gender,
        age: regPet.age,
        ageUnit: regPet.ageUnit,
        color: regPet.color,
        // Include source IDs for reference
        corePetId: regPet.corePetId,
        petShopItemId: regPet.petShopItemId,
        adoptionPetId: regPet.adoptionPetId
      };
    });
    
    logger.debug(`Mapped pets to return: ${pets.length}`);
    
    // Fallback: if none found in registry, show legacy Pet model data
    if (!pets || pets.length === 0) {
      try {
        const Pet = require('../models/Pet');
        let legacyPets = await Pet.find({ 
          $or: [
            { owner: req.user._id },          // new schema field
            { currentOwnerId: req.user._id }  // legacy field
          ]
        })
          .populate('species', 'name displayName')
          .populate('breed', 'name')
          .populate('imageIds') // Populate the imageIds field
          .sort({ updatedAt: -1 })
          .lean();
        
        // Manually populate the virtual 'images' field for each pet
        // Safer population with error handling
        for (const pet of legacyPets) {
          if (pet) {
            try {
              await pet.populate('images');
            } catch (populateErr) {
              logger.warn(`Failed to populate images for legacy pet ${pet._id}:`, populateErr.message);
              // Continue with the pet even if image population fails
            }
          }
        }
        
        if (legacyPets && legacyPets.length > 0) {
          return ErrorHandler.sendSuccess(res, { pets: legacyPets });
        }
      } catch (petErr) {
        logger.warn('Failed to query legacy Pet model:', petErr);
      }
      
      // Second fallback: show completed petshop reservations
      try {
        const PetReservation = require('../../modules/petshop/user/models/PetReservation');
        const reservations = await PetReservation.find({
          userId: req.user._id,
          status: { $in: ['completed', 'at_owner', 'paid'] }
        }).populate({
          path: 'itemId',
          populate: [
            { path: 'speciesId', select: 'name displayName' },
            { path: 'breedId', select: 'name' },
            { path: 'imageIds' }
          ]
        });
        
        // Manually populate the virtual 'images' field for each item
        // Safer population with error handling
        for (const reservation of reservations) {
          if (reservation && reservation.itemId) {
            try {
              await reservation.itemId.populate('images');
            } catch (populateErr) {
              logger.warn(`Failed to populate images for petshop item ${reservation.itemId?._id}:`, populateErr.message);
              // Continue with the reservation even if image population fails
            }
          }
        }
        
        const fallbackPets = (reservations || [])
          .filter(r => r.itemId)
          .map(r => ({
            _id: r.itemId._id,
            name: r.itemId.name,
            petCode: r.itemId.petCode,
            images: r.itemId.images || r.itemId.imageIds || [], // Ensure images are properly included
            species: r.itemId.speciesId,
            breed: r.itemId.breedId,
            gender: r.itemId.gender,
            age: r.itemId.age,
            color: r.itemId.color,
            currentStatus: r.itemId.status || 'sold', // Use actual inventory item status
            source: 'petshop',
            acquiredDate: r.updatedAt
          }));
        
        return ErrorHandler.sendSuccess(res, { pets: fallbackPets });
      } catch (e) {
        // All fallbacks failed; return empty list
        return ErrorHandler.sendSuccess(res, { pets: [] });
      }
    }

    ErrorHandler.sendSuccess(res, { pets });
  } catch (error) {
    ErrorHandler.handleControllerError(res, error, 'get_owned_pets');
  }
};

// Create a new pet (user-added) in the unified Pet model
// POST /api/pets
const createPet = async (req, res) => {
  try {
    // Validate input
    const { isValid, error } = validate(createPetSchema, req.body);
    if (!isValid) {
      return ErrorHandler.sendError(res, error, 400);
    }

    const {
      name,
      speciesId, // incoming from UI
      species,   // allow either speciesId or species
      breedId,
      breed,
      gender,
      age,
      ageUnit,
      color,
      images = []
    } = req.body;

    // Use UnifiedPetService to create user pet and register in PetRegistry
    const UnifiedPetService = require('../services/UnifiedPetService');
    
    const userPetData = {
      name: String(name).trim(),
      speciesId: species || speciesId,
      breedId: breed || breedId,
      gender: gender || 'Unknown',
      age: typeof age === 'number' ? age : (age ? Number(age) : undefined),
      ageUnit: ageUnit || 'months',
      color: color || undefined,
      currentStatus: 'Available',
      healthStatus: 'Good'
    };

    // Process images through Cloudinary if they exist
    let imageIds = [];
    if (images && Array.isArray(images) && images.length > 0) {
      try {
        const { processEntityImages } = require('../utils/imageUploadHandler');
        
        // Process images using our new utility
        const savedImages = await processEntityImages(
          images, 
          'Pet',
          null, // Will be set after pet is created
          req.user.id, 
          'otherpets',  // Module for user pets
          'user'        // Role
        );
        
        imageIds = savedImages.map(img => img._id);
        logger.debug(`Successfully processed images, got imageIds: ${imageIds}`);
        
        // Add imageIds to userPetData
        userPetData.imageIds = imageIds;
      } catch (imgErr) {
        logger.error('Failed to save pet images:', imgErr);
      }
    }

    // Create user pet records using unified service
    const result = await UnifiedPetService.createUserPet(userPetData, req.user);

    // Populate minimal refs for client display
    await result.userPet.populate([
      { path: 'species', select: 'name displayName' },
      { path: 'breed', select: 'name' }
    ]);

    // Populate images for response
    await result.userPet.populate('images');

    ErrorHandler.sendSuccess(res, { 
      pet: result.userPet,
      registryEntry: result.registryEntry 
    }, 'Pet added successfully and registered in central registry', 201);
  } catch (error) {
    ErrorHandler.handleControllerError(res, error, 'create_pet');
  }
};

// Get all pets for the authenticated user
const getPets = async (req, res) => {
  try {
    const { 
      species, 
      status, 
      size, 
      gender, 
      location,
      q,
      mine,
      page = 1, 
      limit = 10 
    } = req.query;

    const filter = getStoreFilter(req.user);
    if (species) filter.species = species;
    if (status) filter.currentStatus = status;
    if (size) filter.size = size;
    if (gender) filter.gender = gender;

    // Text search across key fields
    if (q && String(q).trim()) {
      const regex = new RegExp(String(q).trim(), 'i');
      filter.$or = [
        { name: regex },
        { breed: regex },
        { color: regex },
        { microchipId: regex },
        { tags: { $in: [regex] } }
      ];
    }

    // Only pets related to current user (created by or in ownership history)
    if (mine === 'true' || mine === '1') {
      const mineClause = {
        $or: [
          { createdBy: req.user._id },
          { 'ownershipHistory.ownerId': req.user._id }
        ]
      };
      if (Object.keys(filter).length) {
        // combine with existing filter
        const existing = { ...filter };
        delete existing.$or; // preserve $or by merging below
        const orCombined = [];
        if (filter.$or) orCombined.push(...filter.$or);
        const andClauses = [existing, mineClause];
        const combined = { $and: andClauses };
        if (orCombined.length) combined.$or = orCombined;
        Object.assign(filter, combined);
      } else {
        Object.assign(filter, mineClause);
      }
    }

    let query = Pet.find(filter)
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email')
      .sort({ createdAt: -1 });

    // Add geospatial query if location is provided
    if (location) {
      const [lng, lat, radius = 10] = location.split(',').map(Number);
      query = query.where('location').near({
        center: { type: 'Point', coordinates: [lng, lat] },
        maxDistance: radius * 1000, // Convert km to meters
        spherical: true
      });
    }

    const pets = await query
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Pet.countDocuments(filter);

    ErrorHandler.sendSuccess(res, {
      pets,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    ErrorHandler.handleControllerError(res, error, 'get_pets');
  }
};

// @route   GET /api/pets/:id
// @desc    Get pet by ID
// @access  Private
const getPetById = async (req, res) => {
  try {
    // First try to find in Pet model (user-created pets)
    let pet = await Pet.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email')
      .populate('species', 'name displayName')
      .populate('breed', 'name')
      .populate('imageIds');

    // Manually populate the virtual 'images' field
    if (pet) {
      await pet.populate('images');
    }

    // If pet is found but has no images, check if it's a pet shop purchased pet
    if (pet && (!pet.images || pet.images.length === 0) && pet.petCode) {
      // Try to get images from PetRegistry
      try {
        const PetRegistry = require('../models/PetRegistry');
        const registryPet = await PetRegistry.findOne({ petCode: pet.petCode })
          .populate('imageIds');
        
        if (registryPet) {
          await registryPet.populate('images');
          
          // If registry has images, add them to the pet
          if (registryPet.images && registryPet.images.length > 0) {
            // Create a plain object to ensure the data is properly structured
            const petData = pet.toObject ? pet.toObject({ virtuals: true }) : { ...pet };
            petData.images = registryPet.images;
            petData.imageIds = registryPet.imageIds;
            pet = petData;
          }
        }
      } catch (registryError) {
        logger.debug(`Failed to get images from registry: ${registryError.message}`);
      }
    }

    // If pet is still not found, try PetRegistry (pets from petshop/adoption)
    if (!pet) {
      const PetRegistry = require('../models/PetRegistry');
      const registryPet = await PetRegistry.findById(req.params.id)
        .populate('species', 'name displayName')
        .populate('breed', 'name')
        .populate('imageIds')
        .populate('currentOwnerId', 'name email');

      // Manually populate the virtual 'images' field
      if (registryPet) {
        await registryPet.populate('images');
        
        // Based on the source, fetch the actual pet data
        let sourcePet = null;
        if (registryPet.source === 'petshop' && registryPet.petShopItemId) {
          // Fetch from PetInventoryItem
          const PetInventoryItem = require('../../modules/petshop/manager/models/PetInventoryItem');
          sourcePet = await PetInventoryItem.findById(registryPet.petShopItemId)
            .populate('speciesId', 'name displayName')
            .populate('breedId', 'name')
            .populate('imageIds');
          
          if (sourcePet) {
            await sourcePet.populate('images');
          }
        } else if (registryPet.source === 'adoption' && registryPet.adoptionPetId) {
          // Fetch from AdoptionPet
          const AdoptionPet = require('../../modules/adoption/manager/models/AdoptionPet');
          sourcePet = await AdoptionPet.findById(registryPet.adoptionPetId)
            .populate('species', 'name displayName')
            .populate('breed', 'name')
            .populate('imageIds');
          
          if (sourcePet) {
            await sourcePet.populate('images');
          }
        } else if (registryPet.source === 'core' && registryPet.corePetId) {
          // Fetch from PetNew
          const Pet = require('../models/Pet');
          sourcePet = await Pet.findById(registryPet.corePetId)
            .populate('speciesId', 'name displayName')
            .populate('breedId', 'name')
            .populate('imageIds');
          
          if (sourcePet) {
            await sourcePet.populate('images');
          }
        }

        // Convert to the format expected by the frontend
        pet = {
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
          imageIds: sourcePet?.imageIds || registryPet.imageIds || [],
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
      }
    }

    if (!pet) {
      return ErrorHandler.sendError(res, 'Pet not found', 404);
    }

    // Check access permissions
    if (!canAccessPet(req.user, { storeId: pet.storeId, owner: pet.createdBy || pet.currentOwnerId })) {
      return ErrorHandler.sendError(res, 'Forbidden', 403);
    }

    // Ensure the pet object properly includes images for the response
    let petResponse;
    if (typeof pet.toObject === 'function') {
      // If it's a Mongoose document, convert to object with virtuals
      petResponse = pet.toObject({ virtuals: true });
      // Explicitly ensure images are included
      if (!petResponse.images && pet.images) {
        petResponse.images = pet.images;
      }
      if (!petResponse.imageIds && pet.imageIds) {
        petResponse.imageIds = pet.imageIds;
      }
    } else {
      // If it's already a plain object, use it as is
      petResponse = pet;
    }

    ErrorHandler.sendSuccess(res, { pet: petResponse });
  } catch (error) {
    ErrorHandler.handleControllerError(res, error, 'get_pet_by_id');
  }
};

// @route   PUT /api/pets/:id
// @desc    Update pet
// @access  Private
const updatePet = async (req, res) => {
  try {
    // Validate input
    const { isValid, error } = validate(updatePetSchema, req.body);
    if (!isValid) {
      return ErrorHandler.sendError(res, error, 400);
    }

    const pet = await Pet.findById(req.params.id);

    if (!pet) {
      return ErrorHandler.sendError(res, 'Pet not found', 404);
    }

    if (!canAccessPet(req.user, pet)) {
      return ErrorHandler.sendError(res, 'Forbidden', 403);
    }

    const updateData = {
      ...req.body,
      lastUpdatedBy: req.user._id
    };

    const updatedPet = await Pet.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('lastUpdatedBy', 'name email');

    // changelog: update
    await PetChangeLog.create({
      petId: updatedPet._id,
      action: 'update',
      changedBy: req.user._id,
      changes: req.body
    });

    ErrorHandler.sendSuccess(res, { pet: updatedPet }, 'Pet updated successfully');
  } catch (error) {
    ErrorHandler.handleControllerError(res, error, 'update_pet');
  }
};

// @route   DELETE /api/pets/:id
// @desc    Delete pet
// @access  Private
const deletePet = async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);

    if (!pet) {
      return ErrorHandler.sendError(res, 'Pet not found', 404);
    }

    if (!canAccessPet(req.user, pet)) {
      return ErrorHandler.sendError(res, 'Forbidden', 403);
    }

    await Pet.findByIdAndDelete(req.params.id);

    ErrorHandler.sendSuccess(res, {}, 'Pet deleted successfully');
  } catch (error) {
    ErrorHandler.handleControllerError(res, error, 'delete_pet');
  }
};

// @route   GET /api/pets/search/nearby
// @desc    Search pets by location
// @access  Private
const searchNearbyPets = async (req, res) => {
  try {
    // Validate input
    const { isValid, error } = validate(searchNearbyPetsSchema, req.query);
    if (!isValid) {
      return ErrorHandler.sendError(res, error, 400);
    }

    const { lng, lat, radius = 10 } = req.query;

    const pets = await Pet.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      }
    }).populate('createdBy', 'name email');

    ErrorHandler.sendSuccess(res, { pets });
  } catch (error) {
    ErrorHandler.handleControllerError(res, error, 'search_nearby_pets');
  }
};

// @route   GET /api/pets/:id/changelog
// @desc    Get changelog entries for a pet
// @access  Private
const getPetChangelog = async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id).select('_id storeId');
    if (!pet) return ErrorHandler.sendError(res, 'Pet not found', 404);
    if (!canAccessPet(req.user, pet)) return ErrorHandler.sendError(res, 'Forbidden', 403);

    const logs = await PetChangeLog.find({ petId: req.params.id })
      .populate('changedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(200);

    ErrorHandler.sendSuccess(res, { logs });
  } catch (error) {
    ErrorHandler.handleControllerError(res, error, 'get_pet_changelog');
  }
};

module.exports = {
  getOwnedPets,
  createPet,
  getPets,
  getPetById,
  updatePet,
  deletePet,
  addMedicalHistory,
  addVaccinationRecord,
  addOwnershipHistory,
  addMedicationRecord,
  getPetHistory,
  searchNearbyPets,
  getPetChangelog,
  getRegistryHistory,
  getRegistryPetById
};