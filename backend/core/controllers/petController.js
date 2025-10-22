const Pet = require('../models/Pet');
const PetChangeLog = require('../models/PetChangeLog');
const { getStoreFilter, addStoreInfo } = require('../utils/storeFilter');
const PetRegistryService = require('../services/centralizedPetService');

// Helper: ensure current user can access this pet
const canAccessPet = (user, pet) => {
  if (!pet) return false;
  if (!user.storeId) return true; // public users or others without store restriction
  return String(pet.storeId || '') === String(user.storeId || '');
};

// @route   GET /api/pets/my-pets
// @desc    Get owned pets (pets that user purchased and received)
const getOwnedPets = async (req, res) => {
  try {
    // Query PetRegistry for all pets owned by current user
    const PetRegistry = require('../models/PetRegistry');
    
    let registryPets = await PetRegistry.find({ 
      currentOwnerId: req.user._id,
      currentStatus: { $in: ['owned', 'sold'] }
    })
      .populate('species', 'name displayName')
      .populate('breed', 'name')
      .populate('images') // Populate images virtual property
      .sort({ updatedAt: -1 });
    
    console.log('🔍 Registry pets found:', registryPets.length);
    registryPets.forEach((regPet, idx) => {
      console.log(`📦 Registry Pet ${idx + 1}:`, {
        name: regPet.name,
        petCode: regPet.petCode,
        imageIds: regPet.imageIds,
        images: regPet.images,
        imagesCount: regPet.images?.length || 0
      });
    });
    
    // Convert to plain objects AFTER population
    const registryPetsPlain = registryPets.map(p => p.toObject({ virtuals: true }));
    
    // Map registry pets to include source information
    const pets = registryPetsPlain.map(regPet => ({
      _id: regPet.corePetId || regPet.petShopItemId || regPet.adoptionPetId || regPet._id,
      name: regPet.name,
      petCode: regPet.petCode,
      images: regPet.images || [],
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
      // Include source IDs for reference
      corePetId: regPet.corePetId,
      petShopItemId: regPet.petShopItemId,
      adoptionPetId: regPet.adoptionPetId
    }));
    
    console.log('✅ Mapped pets to return:', pets.length);
    pets.forEach((pet, idx) => {
      console.log(`🐾 Pet ${idx + 1}:`, {
        name: pet.name,
        petCode: pet.petCode,
        imagesCount: pet.images?.length || 0,
        firstImage: pet.images?.[0]
      });
    });
    
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
          .populate('images') // Populate images virtual property
          .sort({ updatedAt: -1 })
          .lean();
        
        if (legacyPets && legacyPets.length > 0) {
          return res.json({ success: true, data: { pets: legacyPets } });
        }
      } catch (petErr) {
        console.warn('Failed to query legacy Pet model:', petErr);
      }
      
      // Second fallback: show completed petshop reservations
      try {
        const PetReservation = require('../../petshop/models/PetReservation');
        const reservations = await PetReservation.find({
          userId: req.user._id,
          status: { $in: ['completed', 'at_owner'] }
        }).populate('itemId');
        
        const fallbackPets = (reservations || [])
          .filter(r => r.itemId)
          .map(r => ({
            _id: r.itemId._id,
            name: r.itemId.name,
            petCode: r.itemId.petCode,
            images: r.itemId.images,
            species: r.itemId.speciesId,
            breed: r.itemId.breedId,
            gender: r.itemId.gender,
            age: r.itemId.age,
            color: r.itemId.color,
            currentStatus: 'sold',
            source: 'petshop',
            acquiredDate: r.updatedAt
          }));
        
        return res.json({ success: true, data: { pets: fallbackPets } });
      } catch (e) {
        // All fallbacks failed; return empty list
        return res.json({ success: true, data: { pets: [] } });
      }
    }

    res.json({ success: true, data: { pets } });
  } catch (error) {
    console.error('Get owned pets error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Create a new pet (user-added) in the unified Pet model
// POST /api/pets
const createPet = async (req, res) => {
  try {
    const PetNew = require('../models/PetNew'); // Also save to PetNew for consistency

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
    } = req.body || {};

    if (!name || !(speciesId || species) || !(breedId || breed)) {
      return res.status(400).json({ success: false, message: 'name, species and breed are required' });
    }

    // Map incoming fields to Pet schema
    const petPayload = {
      name: String(name).trim(),
      species: species || speciesId,
      breed: breed || breedId,
      owner: req.user._id,
      createdBy: req.user._id,
      gender: gender || 'Unknown',
      age: typeof age === 'number' ? age : (age ? Number(age) : undefined),
      ageUnit: ageUnit || 'months',
      color: color || undefined,
      images: Array.isArray(images) ? images.filter(Boolean).map((img) => ({
        url: typeof img === 'string' ? img : img.url,
        caption: (typeof img === 'object' && img.caption) ? img.caption : undefined,
        isPrimary: (typeof img === 'object' && img.isPrimary) ? !!img.isPrimary : false
      })) : []
    };

    // Save to main Pet model
    const pet = new Pet(petPayload);
    await pet.save();

    // Also save to PetNew model for user dashboard consistency
    try {
      const petNewPayload = {
        name: String(name).trim(),
        speciesId: species || speciesId,
        breedId: breed || breedId,
        ownerId: req.user._id,
        createdBy: req.user._id,
        gender: gender || 'Unknown',
        age: typeof age === 'number' ? age : (age ? Number(age) : undefined),
        ageUnit: ageUnit || 'months',
        color: color || undefined,
        images: Array.isArray(images) ? images.filter(Boolean).map((img) => ({
          url: typeof img === 'string' ? img : img.url,
          alt: (typeof img === 'object' && img.caption) ? img.caption : undefined,
          isPrimary: (typeof img === 'object' && img.isPrimary) ? !!img.isPrimary : false
        })) : [],
        currentStatus: 'Available',
        healthStatus: 'Good'
      };
      
      const petNew = new PetNew(petNewPayload);
      await petNew.save();
    } catch (petNewError) {
      console.warn('Failed to save to PetNew model:', petNewError?.message || petNewError);
      // Continue even if PetNew save fails
    }

    // Populate minimal refs for client display
    await pet.populate([
      { path: 'species', select: 'name displayName' },
      { path: 'breed', select: 'name' }
    ]);

    // Upsert centralized registry entry
    try {
      // Populate images if they exist
      let images = [];
      if (pet.images && pet.images.length > 0) {
        images = pet.images;
      } else if (pet.imageIds && pet.imageIds.length > 0) {
        // If using the new structure, populate images
        await pet.populate('images');
        images = pet.images || [];
      }
      
      await PetRegistryService.upsertAndSetState({
        petCode: pet.petCode,
        name: pet.name,
        species: pet.species?._id || pet.species,
        breed: pet.breed?._id || pet.breed,
        images: images,
        source: 'core',
        corePetId: pet._id,
        actorUserId: req.user._id,
      }, {
        currentOwnerId: req.user._id,
        currentLocation: 'at_owner',
        currentStatus: 'owned',
        lastTransferAt: new Date()
      })
    } catch (regErr) {
      console.warn('PetRegistry upsert failed (create pet):', regErr?.message || regErr)
    }

    return res.status(201).json({ success: true, data: { pet } });
  } catch (error) {
    console.error('Create pet error:', error);
    const message = error?.errors ? Object.values(error.errors).map(e => e.message).join(', ') : (error.message || 'Server error')
    res.status(500).json({ success: false, message });
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

    res.json({
      success: true,
      data: {
        pets,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get pets error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @route   GET /api/pets/:id
// @desc    Get pet by ID
// @access  Private
const getPetById = async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email');

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    if (!canAccessPet(req.user, pet)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    res.json({
      success: true,
      data: {
        pet
      }
    });
  } catch (error) {
    console.error('Get pet error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @route   PUT /api/pets/:id
// @desc    Update pet
// @access  Private
const updatePet = async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    if (!canAccessPet(req.user, pet)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
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

    res.json({
      success: true,
      message: 'Pet updated successfully',
      data: {
        pet: updatedPet
      }
    });
  } catch (error) {
    console.error('Update pet error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during pet update'
    });
  }
};

// @route   DELETE /api/pets/:id
// @desc    Delete pet
// @access  Private
const deletePet = async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    if (!canAccessPet(req.user, pet)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    await Pet.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Pet deleted successfully'
    });
  } catch (error) {
    console.error('Delete pet error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during pet deletion'
    });
  }
};

// @route   PUT /api/pets/:id/medical-history
// @desc    Add medical history entry
// @access  Private
const addMedicalHistory = async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    if (!canAccessPet(req.user, pet)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const medicalEntry = {
      ...req.body,
      date: new Date()
    };

    pet.medicalHistory.push(medicalEntry);
    pet.lastUpdatedBy = req.user._id;
    await pet.save();

    await PetChangeLog.create({
      petId: pet._id,
      action: 'medical_add',
      changedBy: req.user._id,
      meta: medicalEntry
    });

    res.json({
      success: true,
      message: 'Medical history added successfully',
      data: {
        pet
      }
    });
  } catch (error) {
    console.error('Add medical history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during medical history addition'
    });
  }
};

// @route   PUT /api/pets/:id/vaccination
// @desc    Add vaccination record
// @access  Private
const addVaccinationRecord = async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    if (!canAccessPet(req.user, pet)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const vaccinationRecord = {
      ...req.body,
      dateGiven: new Date(req.body.dateGiven)
    };

    pet.vaccinationRecords.push(vaccinationRecord);
    pet.lastUpdatedBy = req.user._id;
    await pet.save();

    await PetChangeLog.create({
      petId: pet._id,
      action: 'vaccination_add',
      changedBy: req.user._id,
      meta: vaccinationRecord
    });

    res.json({
      success: true,
      message: 'Vaccination record added successfully',
      data: {
        pet
      }
    });
  } catch (error) {
    console.error('Add vaccination error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during vaccination record addition'
    });
  }
};

// @route   PUT /api/pets/:id/owners
// @desc    Add ownership history entry (and close previous open ownership if any)
// @access  Private
const addOwnershipHistory = async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);
    if (!pet) {
      return res.status(404).json({ success: false, message: 'Pet not found' });
    }

    if (!canAccessPet(req.user, pet)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    // Close previous open ownership (no endDate)
    if (pet.ownershipHistory && pet.ownershipHistory.length > 0) {
      const last = pet.ownershipHistory[pet.ownershipHistory.length - 1];
      if (!last.endDate) {
        last.endDate = new Date();
      }
    }

    const entry = {
      ownerType: req.body.ownerType || 'other',
      ownerId: req.body.ownerId,
      ownerName: req.body.ownerName,
      startDate: req.body.startDate ? new Date(req.body.startDate) : new Date(),
      notes: req.body.notes || ''
    };

    pet.ownershipHistory.push(entry);
    pet.lastUpdatedBy = req.user._id;
    await pet.save();

    // Sync centralized registry state
    try {
      // Prefer explicit ownerId from request; else keep as-is
      const newOwnerId = req.body.ownerId || undefined
      await PetRegistryService.updateState({
        petCode: pet.petCode,
        currentOwnerId: newOwnerId,
        currentLocation: newOwnerId ? 'at_owner' : undefined,
        currentStatus: newOwnerId ? 'owned' : undefined,
        actorUserId: req.user._id,
        lastTransferAt: newOwnerId ? new Date() : undefined
      })
    } catch (regErr) {
      console.warn('PetRegistry state sync failed (ownership_add):', regErr?.message || regErr)
    }

    await PetChangeLog.create({
      petId: pet._id,
      action: 'ownership_add',
      changedBy: req.user._id,
      meta: entry
    });

    res.json({ success: true, message: 'Ownership history updated', data: { pet } });
  } catch (error) {
    console.error('Add ownership error:', error);
    res.status(500).json({ success: false, message: 'Server error during ownership update' });
  }
};

// @route   PUT /api/pets/:id/medications
// @desc    Add medication record
// @access  Private
const addMedicationRecord = async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);
    if (!pet) {
      return res.status(404).json({ success: false, message: 'Pet not found' });
    }

    if (!canAccessPet(req.user, pet)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const record = {
      medicationName: req.body.medicationName,
      dosage: req.body.dosage,
      frequency: req.body.frequency,
      startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
      endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
      prescribedBy: req.body.prescribedBy,
      notes: req.body.notes
    };

    pet.medicationRecords.push(record);
    pet.lastUpdatedBy = req.user._id;
    await pet.save();

    await PetChangeLog.create({
      petId: pet._id,
      action: 'medication_add',
      changedBy: req.user._id,
      meta: record
    });

    res.json({ success: true, message: 'Medication record added', data: { pet } });
  } catch (error) {
    console.error('Add medication error:', error);
    res.status(500).json({ success: false, message: 'Server error during medication addition' });
  }
};

// @route   GET /api/pets/:id/history
// @desc    Get combined history (ownership, medical, vaccinations, medications)
// @access  Private
const getPetHistory = async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id).select('ownershipHistory medicalHistory vaccinationRecords medicationRecords name storeId');
    if (!pet) {
      return res.status(404).json({ success: false, message: 'Pet not found' });
    }

    if (!canAccessPet(req.user, pet)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    res.json({
      success: true,
      data: {
        name: pet.name,
        ownershipHistory: pet.ownershipHistory || [],
        medicalHistory: pet.medicalHistory || [],
        vaccinationRecords: pet.vaccinationRecords || [],
        medicationRecords: pet.medicationRecords || []
      }
    });
  } catch (error) {
    console.error('Get pet history error:', error);
    res.status(500).json({ success: false, message: 'Server error during history fetch' });
  }
};

// @route   GET /api/pets/search/nearby
// @desc    Search pets by location
// @access  Private
const searchNearbyPets = async (req, res) => {
  try {
    const { lng, lat, radius = 10 } = req.query;

    if (!lng || !lat) {
      return res.status(400).json({
        success: false,
        message: 'Longitude and latitude are required'
      });
    }

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

    res.json({
      success: true,
      data: {
        pets
      }
    });
  } catch (error) {
    console.error('Search nearby pets error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during nearby search'
    });
  }
};

// @route   GET /api/pets/:id/changelog
// @desc    Get changelog entries for a pet
// @access  Private
const getPetChangelog = async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id).select('_id storeId');
    if (!pet) return res.status(404).json({ success: false, message: 'Pet not found' });
    if (!canAccessPet(req.user, pet)) return res.status(403).json({ success: false, message: 'Forbidden' });

    const logs = await PetChangeLog.find({ petId: req.params.id })
      .populate('changedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(200);

    res.json({ success: true, data: { logs } });
  } catch (error) {
    console.error('Get pet changelog error:', error);
    res.status(500).json({ success: false, message: 'Server error during changelog fetch' });
  }
};

// @route   GET /api/pets/registry/:petCode/history
// @desc    Get registry history for a pet
// @access  Private
const getRegistryHistory = async (req, res) => {
  try {
    const { petCode } = req.params;
    const history = await PetRegistryService.getHistory(petCode);
    res.json({ success: true, data: { history } });
  } catch (error) {
    console.error('Get registry history error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
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
  getRegistryHistory
};