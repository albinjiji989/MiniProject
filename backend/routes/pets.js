const express = require('express');
const { body, validationResult } = require('express-validator');
const Pet = require('../core/models/Pet');
const PetChangeLog = require('../core/models/PetChangeLog');
const { auth, authorizeModule } = require('../middleware/auth');
const { getStoreFilter, addStoreInfo } = require('../utils/storeFilter');

const router = express.Router();

// Helper: ensure current user can access this pet
const canAccessPet = (user, pet) => {
  if (!pet) return false;
  if (user.role === 'super_admin') return true;
  if (!user.storeId) return true; // public users or others without store restriction
  return String(pet.storeId || '') === String(user.storeId || '');
};

// @route   GET /api/pets
// @desc    Get all pets
// @access  Private
router.get('/', auth, async (req, res) => {
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
});

// @route   GET /api/pets/:id
// @desc    Get pet by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
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
});

// @route   POST /api/pets
// @desc    Create new pet
// @access  Private
router.post('/', auth, [
  body('name').notEmpty().withMessage('Pet name is required'),
  body('species').isIn(['dog', 'cat', 'bird', 'rabbit', 'hamster', 'fish', 'reptile', 'other']).withMessage('Invalid species'),
  body('gender').optional().isIn(['male', 'female', 'unknown']).withMessage('Invalid gender'),
  body('size').optional().isIn(['small', 'medium', 'large', 'extra_large']).withMessage('Invalid size'),
  body('weightKg').optional().isNumeric().withMessage('weightKg must be a number'),
  body('weight').optional().isNumeric().withMessage('weight must be a number'),
  body('ageYears').optional().isNumeric().withMessage('ageYears must be a number'),
  body('age').optional().isNumeric().withMessage('age must be a number'),
  body('location.coordinates').optional().isArray({ min: 2, max: 2 }).withMessage('Location coordinates must be [longitude, latitude]')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const petData = {
      ...req.body,
      createdBy: req.user._id,
      lastUpdatedBy: req.user._id,
      storeId: req.user.storeId,
      storeName: req.user.storeName
    };

    // Backward compatibility mapping
    if (petData.weightKg == null && petData.weight != null) {
      petData.weightKg = petData.weight;
      delete petData.weight;
    }
    if (petData.ageYears == null && petData.age != null) {
      petData.ageYears = petData.age;
      delete petData.age;
    }

    const pet = new Pet(petData);
    await pet.save();

    await pet.populate('createdBy', 'name email');

    // changelog: create
    await PetChangeLog.create({
      petId: pet._id,
      action: 'create',
      changedBy: req.user._id,
      changes: petData
    });

    res.status(201).json({
      success: true,
      message: 'Pet created successfully',
      data: {
        pet
      }
    });
  } catch (error) {
    console.error('Create pet error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during pet creation'
    });
  }
});

// @route   PUT /api/pets/:id
// @desc    Update pet
// @access  Private
router.put('/:id', auth, async (req, res) => {
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
});

// @route   DELETE /api/pets/:id
// @desc    Delete pet
// @access  Private
router.delete('/:id', auth, async (req, res) => {
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
});

// @route   PUT /api/pets/:id/medical-history
// @desc    Add medical history entry
// @access  Private
router.put('/:id/medical-history', auth, [
  body('condition').notEmpty().withMessage('Condition is required'),
  body('treatment').notEmpty().withMessage('Treatment is required'),
  body('veterinarian').notEmpty().withMessage('Veterinarian is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

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
});

// @route   PUT /api/pets/:id/vaccination
// @desc    Add vaccination record
// @access  Private
router.put('/:id/vaccination', auth, [
  body('vaccineName').notEmpty().withMessage('Vaccine name is required'),
  body('dateGiven').isISO8601().withMessage('Date given must be a valid date'),
  body('veterinarian').notEmpty().withMessage('Veterinarian is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

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
});

// @route   PUT /api/pets/:id/owners
// @desc    Add ownership history entry (and close previous open ownership if any)
// @access  Private
router.put('/:id/owners', auth, [
  body('ownerType').optional().isIn(['public_user', 'shelter', 'adoption_center', 'rescue', 'temporary_care', 'veterinary', 'pharmacy', 'pet_shop', 'other']).withMessage('Invalid ownerType'),
  body('ownerId').optional().isMongoId().withMessage('ownerId must be a valid id'),
  body('ownerName').optional().isString(),
  body('startDate').optional().isISO8601().withMessage('startDate must be a valid date'),
  body('notes').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    }

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
});

// @route   PUT /api/pets/:id/medications
// @desc    Add medication record
// @access  Private
router.put('/:id/medications', auth, [
  body('medicationName').notEmpty().withMessage('Medication name is required'),
  body('dosage').optional().isString(),
  body('frequency').optional().isString(),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('prescribedBy').optional().isString(),
  body('notes').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    }

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
});

// @route   GET /api/pets/:id/history
// @desc    Get combined history (ownership, medical, vaccinations, medications)
// @access  Private
router.get('/:id/history', auth, async (req, res) => {
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
});

// @route   GET /api/pets/search/nearby
// @desc    Search pets by location
// @access  Private
router.get('/search/nearby', auth, async (req, res) => {
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
});

// @route   GET /api/pets/:id/changelog
// @desc    Get changelog entries for a pet
// @access  Private
router.get('/:id/changelog', auth, async (req, res) => {
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
});

module.exports = router;
