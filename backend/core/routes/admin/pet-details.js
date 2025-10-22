const express = require('express');
const router = express.Router();
const PetDetails = require('../../models/PetDetails');
const Species = require('../../models/Species');
const Breed = require('../../models/Breed');
const { auth, authorize } = require('../../middleware/auth');

// Get all pet details
router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', speciesId, breedId, isActive = true } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { color: { $regex: search, $options: 'i' } }
      ];
    }

    if (speciesId) {
      query.speciesId = speciesId;
    }

    if (breedId) {
      query.breedId = breedId;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const petDetails = await PetDetails.find(query)
      .populate('species', 'name displayName')
      .populate('breed', 'name size temperament')
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email')
      .sort({ name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await PetDetails.countDocuments(query);

    res.json({
      success: true,
      data: petDetails,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
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

// Get active pet details (for dropdowns)
router.get('/active', auth, async (req, res) => {
  try {
    const { speciesId, breedId } = req.query;
    let petDetails;

    if (speciesId && breedId) {
      petDetails = await PetDetails.findBySpeciesAndBreed(speciesId, breedId);
    } else if (speciesId) {
      petDetails = await PetDetails.findBySpecies(speciesId);
    } else {
      petDetails = await PetDetails.findActive();
    }

    res.json({
      success: true,
      data: petDetails
    });
  } catch (error) {
    console.error('Error fetching active pet details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching active pet details',
      error: error.message
    });
  }
});

// Get pet details by ID
router.get('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const petDetails = await PetDetails.findById(req.params.id)
      .populate('species', 'name displayName')
      .populate('breed', 'name size temperament groomingNeeds exerciseNeeds')
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email');

    if (!petDetails) {
      return res.status(404).json({
        success: false,
        message: 'Pet details not found'
      });
    }

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

// Create new pet details
router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    const {
      speciesId,
      breedId,
      name,
      description,
      color,
      ageRange,
      weightRange,
      typicalLifespan,
      vaccinationRequirements,
      careInstructions,
      temperament,
      specialNeeds
    } = req.body;

    // Verify species exists
    const species = await Species.findById(speciesId);
    if (!species) {
      return res.status(400).json({
        success: false,
        message: 'Species not found'
      });
    }

    // Verify breed exists
    const breed = await Breed.findById(breedId);
    if (!breed) {
      return res.status(400).json({
        success: false,
        message: 'Breed not found'
      });
    }

    // Check if pet details already exist for this species and breed combination
    const existingPetDetails = await PetDetails.findBySpeciesAndBreed(speciesId, breedId);
    if (existingPetDetails.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Pet details already exist for this species and breed combination'
      });
    }

    const petDetails = new PetDetails({
      speciesId,
      breedId,
      name,
      description,
      color,
      ageRange,
      weightRange,
      typicalLifespan,
      vaccinationRequirements,
      careInstructions,
      temperament,
      specialNeeds,
      createdBy: req.user.id
    });

    await petDetails.save();

    await petDetails.populate('species', 'name displayName');
    await petDetails.populate('breed', 'name size temperament');
    await petDetails.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Pet details created successfully',
      data: petDetails
    });
  } catch (error) {
    console.error('Error creating pet details:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating pet details',
      error: error.message
    });
  }
});

// Update pet details
router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const {
      speciesId,
      breedId,
      name,
      description,
      color,
      ageRange,
      weightRange,
      typicalLifespan,
      vaccinationRequirements,
      careInstructions,
      temperament,
      specialNeeds,
      isActive
    } = req.body;

    const petDetails = await PetDetails.findById(req.params.id);
    if (!petDetails) {
      return res.status(404).json({
        success: false,
        message: 'Pet details not found'
      });
    }

    // If species or breed is being changed, verify they exist
    if (speciesId && speciesId !== petDetails.speciesId.toString()) {
      const species = await Species.findById(speciesId);
      if (!species) {
        return res.status(400).json({
          success: false,
          message: 'Species not found'
        });
      }
    }

    if (breedId && breedId !== petDetails.breedId.toString()) {
      const breed = await Breed.findById(breedId);
      if (!breed) {
        return res.status(400).json({
          success: false,
          message: 'Breed not found'
        });
      }
    }

    // If both species and breed are being changed, check for conflicts
    if (speciesId && breedId && 
        (speciesId !== petDetails.speciesId.toString() || breedId !== petDetails.breedId.toString())) {
      const existingPetDetails = await PetDetails.findBySpeciesAndBreed(speciesId, breedId);
      if (existingPetDetails.length > 0 && existingPetDetails[0]._id.toString() !== petDetails._id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Pet details already exist for this species and breed combination'
        });
      }
    }

    petDetails.speciesId = speciesId || petDetails.speciesId;
    petDetails.breedId = breedId || petDetails.breedId;
    petDetails.name = name || petDetails.name;
    petDetails.description = description || petDetails.description;
    petDetails.color = color || petDetails.color;
    petDetails.ageRange = ageRange || petDetails.ageRange;
    petDetails.weightRange = weightRange || petDetails.weightRange;
    petDetails.typicalLifespan = typicalLifespan || petDetails.typicalLifespan;
    petDetails.vaccinationRequirements = vaccinationRequirements || petDetails.vaccinationRequirements;
    petDetails.careInstructions = careInstructions || petDetails.careInstructions;
    petDetails.temperament = temperament || petDetails.temperament;
    petDetails.specialNeeds = specialNeeds || petDetails.specialNeeds;
    petDetails.isActive = isActive !== undefined ? isActive : petDetails.isActive;
    petDetails.lastUpdatedBy = req.user.id;

    await petDetails.save();

    await petDetails.populate('species', 'name displayName');
    await petDetails.populate('breed', 'name size temperament');
    await petDetails.populate('createdBy', 'name email');
    await petDetails.populate('lastUpdatedBy', 'name email');

    res.json({
      success: true,
      message: 'Pet details updated successfully',
      data: petDetails
    });
  } catch (error) {
    console.error('Error updating pet details:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating pet details',
      error: error.message
    });
  }
});

// Soft delete pet details
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const petDetails = await PetDetails.findById(req.params.id);
    if (!petDetails) {
      return res.status(404).json({
        success: false,
        message: 'Pet details not found'
      });
    }

    await petDetails.softDelete(req.user.id);

    res.json({
      success: true,
      message: 'Pet details deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting pet details:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting pet details',
      error: error.message
    });
  }
});

// Restore pet details
router.patch('/:id/restore', auth, authorize('admin'), async (req, res) => {
  try {
    const petDetails = await PetDetails.findById(req.params.id);
    if (!petDetails) {
      return res.status(404).json({
        success: false,
        message: 'Pet details not found'
      });
    }

    petDetails.isActive = true;
    petDetails.lastUpdatedBy = req.user.id;
    await petDetails.save();

    res.json({
      success: true,
      message: 'Pet details restored successfully',
      data: petDetails
    });
  } catch (error) {
    console.error('Error restoring pet details:', error);
    res.status(500).json({
      success: false,
      message: 'Error restoring pet details',
      error: error.message
    });
  }
});

// Get pet details statistics
router.get('/stats/overview', auth, authorize('admin'), async (req, res) => {
  try {
    const totalPetDetails = await PetDetails.countDocuments();
    const activePetDetails = await PetDetails.countDocuments({ isActive: true });
    const inactivePetDetails = await PetDetails.countDocuments({ isActive: false });

    // Pet details by species
    const petDetailsBySpecies = await PetDetails.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$speciesId', count: { $sum: 1 } } },
      { $lookup: { from: 'species', localField: '_id', foreignField: '_id', as: 'species' } },
      { $unwind: '$species' },
      { $project: { speciesName: '$species.displayName', count: 1 } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        total: totalPetDetails,
        active: activePetDetails,
        inactive: inactivePetDetails,
        bySpecies: petDetailsBySpecies
      }
    });
  } catch (error) {
    console.error('Error fetching pet details stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pet details statistics',
      error: error.message
    });
  }
});

module.exports = router;
