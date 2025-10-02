const express = require('express');
const router = express.Router();
const PetNew = require('../../core/models/PetNew');
const PetDetails = require('../../core/models/PetDetails');
const Species = require('../../core/models/Species');
const Breed = require('../../core/models/Breed');
const CustomBreedRequest = require('../../core/models/CustomBreedRequest');
const PetCategory = require('../../core/models/PetCategory');
const { auth } = require('../../middleware/auth');

// Get user's pets
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1)
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10))
    const query = { ownerId: req.user.id, isActive: true };

    if (status) {
      query.currentStatus = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { color: { $regex: search, $options: 'i' } }
      ];
    }

    const pets = await PetNew.find(query)
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .lean();

    const total = await PetNew.countDocuments(query);

    res.json({
      success: true,
      data: pets,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching user pets:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pets',
      error: error.message
    });
  }
});

// Get species and breeds for dropdowns
router.get('/species-breeds', auth, async (req, res) => {
  try {
    const species = await Species.findActive();
    const breeds = await Breed.findActive();

    res.json({
      success: true,
      data: {
        species,
        breeds
      }
    });
  } catch (error) {
    console.error('Error fetching species and breeds:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching species and breeds',
      error: error.message
    });
  }
});

// Get active pet categories (public users)
router.get('/categories', auth, async (req, res) => {
  try {
    const categories = await PetCategory.find({ isActive: true }).sort({ displayName: 1 }).lean();
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, message: 'Error fetching categories', error: error.message });
  }
});

// Get active species, optional filter by category name
router.get('/species', auth, async (req, res) => {
  try {
    const { category } = req.query;
    const query = { isActive: true };
    if (category) {
      query.category = String(category).toLowerCase();
    }
    const species = await Species.find(query).sort({ displayName: 1 }).lean();
    res.json({ success: true, data: species });
  } catch (error) {
    console.error('Error fetching species:', error);
    res.status(500).json({ success: false, message: 'Error fetching species', error: error.message });
  }
});

// Get breeds by species
router.get('/breeds/:speciesId', auth, async (req, res) => {
  try {
    const breeds = await Breed.findBySpecies(req.params.speciesId);

    res.json({
      success: true,
      data: breeds
    });
  } catch (error) {
    console.error('Error fetching breeds by species:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching breeds',
      error: error.message
    });
  }
});

// Get pet details by species and breed
router.get('/pet-details/:speciesId/:breedId', auth, async (req, res) => {
  try {
    const petDetails = await PetDetails.findBySpeciesAndBreed(req.params.speciesId, req.params.breedId);

    res.json({
      success: true,
      data: petDetails
    });
  } catch (error) {
    console.error('Error fetching pet details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pet details',
      error: error.message
    });
  }
});

// Get pet by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const pet = await PetNew.findOne({ 
      _id: req.params.id, 
      ownerId: req.user.id, 
      isActive: true 
    })
    .populate('petDetails', 'name species breed color ageRange weightRange typicalLifespan vaccinationRequirements careInstructions temperament specialNeeds')
    .populate('petDetails.species', 'displayName')
    .populate('petDetails.breed', 'name size temperament groomingNeeds exerciseNeeds');

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    res.json({
      success: true,
      data: pet
    });
  } catch (error) {
    console.error('Error fetching pet:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pet',
      error: error.message
    });
  }
});

// Create new pet
router.post('/', auth, async (req, res) => {
  try {
    const {
      name,
      age,
      ageUnit,
      gender,
      color,
      speciesId,
      breedId,
      currentStatus,
      healthStatus,
      tags
    } = req.body;

    // Basic validation matching schema requirements
    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    if (age === undefined || age === null || Number.isNaN(Number(age))) {
      return res.status(400).json({ success: false, message: 'Age is required and must be a number' });
    }
    if (!gender || !['Male','Female','Unknown'].includes(gender)) {
      return res.status(400).json({ success: false, message: 'Gender must be Male, Female or Unknown' });
    }
    if (!color || !String(color).trim()) {
      return res.status(400).json({ success: false, message: 'Color is required' });
    }

    const pet = new PetNew({
      name,
      age: Number(age),
      ageUnit,
      gender,
      color,
      speciesId,
      breedId,
      currentStatus: currentStatus || undefined,
      healthStatus: healthStatus || undefined,
      tags,
      ownerId: req.user.id,
      createdBy: req.user.id
    });

    await pet.save();

    // Add ownership record
    await pet.addOwnershipRecord(req.user.id, (req.user.name || req.user.email || 'Owner'), 'Pet created by owner');

    res.status(201).json({
      success: true,
      message: 'Pet created successfully',
      data: pet
    });
  } catch (error) {
    console.error('Error creating pet:', error?.stack || error);
    res.status(500).json({
      success: false,
      message: 'Error creating pet',
      error: error?.message
    });
  }
});

// Update pet
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      name,
      age,
      ageUnit,
      gender,
      weight,
      color,
      size,
      currentStatus,
      healthStatus,
      specialNeeds,
      temperament,
      behaviorNotes,
      adoptionFee,
      adoptionRequirements,
      isAdoptionReady,
      images,
      location,
      tags
    } = req.body;

    const pet = await PetNew.findOne({ 
      _id: req.params.id, 
      ownerId: req.user.id, 
      isActive: true 
    });

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    pet.name = name || pet.name;
    pet.age = age !== undefined ? age : pet.age;
    pet.ageUnit = ageUnit || pet.ageUnit;
    pet.gender = gender || pet.gender;
    pet.weight = weight || pet.weight;
    pet.color = color || pet.color;
    pet.size = size || pet.size;
    pet.currentStatus = currentStatus || pet.currentStatus;
    pet.healthStatus = healthStatus || pet.healthStatus;
    pet.specialNeeds = specialNeeds || pet.specialNeeds;
    pet.temperament = temperament || pet.temperament;
    pet.behaviorNotes = behaviorNotes || pet.behaviorNotes;
    pet.adoptionFee = adoptionFee !== undefined ? adoptionFee : pet.adoptionFee;
    pet.adoptionRequirements = adoptionRequirements || pet.adoptionRequirements;
    pet.isAdoptionReady = isAdoptionReady !== undefined ? isAdoptionReady : pet.isAdoptionReady;
    pet.images = images || pet.images;
    pet.location = location || pet.location;
    pet.tags = tags || pet.tags;
    pet.lastUpdatedBy = req.user.id;

    await pet.save();

    await pet.populate('petDetails', 'name species breed color ageRange weightRange');
    await pet.populate('petDetails.species', 'displayName');
    await pet.populate('petDetails.breed', 'name size');

    res.json({
      success: true,
      message: 'Pet updated successfully',
      data: pet
    });
  } catch (error) {
    console.error('Error updating pet:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating pet',
      error: error.message
    });
  }
});

// Soft delete pet
router.delete('/:id', auth, async (req, res) => {
  try {
    const pet = await PetNew.findOne({ 
      _id: req.params.id, 
      ownerId: req.user.id, 
      isActive: true 
    });

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    await pet.softDelete(req.user.id);

    res.json({
      success: true,
      message: 'Pet deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting pet:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting pet',
      error: error.message
    });
  }
});

// Submit custom breed/species request
router.post('/custom-request', auth, async (req, res) => {
  try {
    const {
      requestType,
      speciesName,
      speciesDisplayName,
      speciesDescription,
      speciesIcon,
      breedName,
      breedDescription,
      breedSize,
      breedTemperament,
      breedGroomingNeeds,
      breedExerciseNeeds,
      speciesId,
      reason,
      additionalInfo,
      supportingDocuments,
      priority,
      category
    } = req.body;

    if (requestType === 'breed' && !speciesId) {
      return res.status(400).json({
        success: false,
        message: 'Species ID is required for breed requests'
      });
    }

    const request = new CustomBreedRequest({
      requestType,
      speciesName,
      speciesDisplayName,
      speciesDescription,
      speciesIcon,
      breedName,
      breedDescription,
      breedSize,
      breedTemperament,
      breedGroomingNeeds,
      breedExerciseNeeds,
      speciesId,
      reason,
      additionalInfo,
      supportingDocuments,
      priority,
      category,
      requestedBy: req.user.id
    });

    await request.save();

    await request.populate('requester', 'name email');

    res.status(201).json({
      success: true,
      message: 'Custom breed/species request submitted successfully',
      data: request
    });
  } catch (error) {
    console.error('Error submitting custom request:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting request',
      error: error.message
    });
  }
});

// Get user's custom requests
router.get('/custom-requests/my', auth, async (req, res) => {
  try {
    const requests = await CustomBreedRequest.findByRequester(req.user.id);

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Error fetching custom requests:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching custom requests',
      error: error.message
    });
  }
});

// Add medical record
router.post('/:id/medical', auth, async (req, res) => {
  try {
    const { type, description, veterinarian, cost } = req.body;

    const pet = await PetNew.findOne({ 
      _id: req.params.id, 
      ownerId: req.user.id, 
      isActive: true 
    });

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    await pet.addMedicalRecord(type, description, veterinarian, cost);

    res.json({
      success: true,
      message: 'Medical record added successfully',
      data: pet
    });
  } catch (error) {
    console.error('Error adding medical record:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding medical record',
      error: error.message
    });
  }
});

// Add vaccination record
router.post('/:id/vaccination', auth, async (req, res) => {
  try {
    const { name, date, nextDue, veterinarian, certificate } = req.body;

    const pet = await PetNew.findOne({ 
      _id: req.params.id, 
      ownerId: req.user.id, 
      isActive: true 
    });

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    await pet.addVaccination(name, date, nextDue, veterinarian, certificate);

    res.json({
      success: true,
      message: 'Vaccination record added successfully',
      data: pet
    });
  } catch (error) {
    console.error('Error adding vaccination record:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding vaccination record',
      error: error.message
    });
  }
});

module.exports = router;
