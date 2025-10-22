const express = require('express');
const router = express.Router();
const Breed = require('../../models/Breed');
const Species = require('../../models/Species');
const { auth, authorize } = require('../../middleware/auth');

// Get all breeds
router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', speciesId, isActive = true } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (speciesId) {
      query.speciesId = speciesId;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const breeds = await Breed.find(query)
      .populate('species', 'name displayName category')
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email')
      .sort({ name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Breed.countDocuments(query);

    res.json({
      success: true,
      data: breeds,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching breeds:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching breeds',
      error: error.message
    });
  }
});

// Get active breeds (for dropdowns)
router.get('/active', auth, async (req, res) => {
  try {
    const { speciesId } = req.query;
    let breeds;

    if (speciesId) {
      breeds = await Breed.findBySpecies(speciesId);
    } else {
      breeds = await Breed.findActive();
    }

    res.json({
      success: true,
      data: breeds
    });
  } catch (error) {
    console.error('Error fetching active breeds:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching active breeds',
      error: error.message
    });
  }
});

// Get breeds by species
router.get('/species/:speciesId', auth, async (req, res) => {
  try {
    const breeds = await Breed.findBySpecies(req.params.speciesId)
      .populate('species', 'name displayName category');

    res.json({
      success: true,
      data: breeds
    });
  } catch (error) {
    console.error('Error fetching breeds by species:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching breeds by species',
      error: error.message
    });
  }
});

// Get breed by ID
router.get('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const breed = await Breed.findById(req.params.id)
      .populate('species', 'name displayName category')
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email');

    if (!breed) {
      return res.status(404).json({
        success: false,
        message: 'Breed not found'
      });
    }

    res.json({
      success: true,
      data: breed
    });
  } catch (error) {
    console.error('Error fetching breed:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching breed',
      error: error.message
    });
  }
});

// Create new breed
router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { name, speciesId, description, size, temperament, groomingNeeds, exerciseNeeds } = req.body;

    // Verify species exists
    const species = await Species.findById(speciesId);
    if (!species) {
      return res.status(400).json({
        success: false,
        message: 'Species not found'
      });
    }

    // Check if breed already exists for this species
    const existingBreed = await Breed.findByNameAndSpecies(name, speciesId);
    if (existingBreed) {
      return res.status(400).json({
        success: false,
        message: 'Breed with this name already exists for this species'
      });
    }

    const breed = new Breed({
      name,
      speciesId,
      description,
      groomingNeeds,
      exerciseNeeds,
      createdBy: req.user.id
    });

    // Handle optional fields explicitly
    if (size) {
      breed.size = size;
    }
    if (temperament !== undefined) {
      breed.temperament = Array.isArray(temperament)
        ? temperament
        : (typeof temperament === 'string'
          ? temperament.split(',').map(t => t.trim()).filter(Boolean)
          : []);
    }

    await breed.save();

    await breed.populate('species', 'name displayName category');
    await breed.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Breed created successfully',
      data: breed
    });
  } catch (error) {
    console.error('Error creating breed:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating breed',
      error: error.message
    });
  }
});

// Update breed
router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { name, speciesId, description, size, temperament, groomingNeeds, exerciseNeeds, isActive } = req.body;

    const breed = await Breed.findById(req.params.id);
    if (!breed) {
      return res.status(404).json({
        success: false,
        message: 'Breed not found'
      });
    }

    // If species is being changed, verify new species exists
    if (speciesId && speciesId !== breed.speciesId.toString()) {
      const species = await Species.findById(speciesId);
      if (!species) {
        return res.status(400).json({
          success: false,
          message: 'Species not found'
        });
      }

      // Check if breed name already exists for new species
      const existingBreed = await Breed.findByNameAndSpecies(name || breed.name, speciesId);
      if (existingBreed && existingBreed._id.toString() !== breed._id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Breed with this name already exists for this species'
        });
      }
    }

    // If only name is being changed, check for conflicts
    if (name && name !== breed.name && (!speciesId || speciesId === breed.speciesId.toString())) {
      const existingBreed = await Breed.findByNameAndSpecies(name, breed.speciesId);
      if (existingBreed && existingBreed._id.toString() !== breed._id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Breed with this name already exists for this species'
        });
      }
    }

    breed.name = name || breed.name;
    breed.speciesId = speciesId || breed.speciesId;
    breed.description = description || breed.description;
    breed.size = size || breed.size;
    if (temperament !== undefined) {
      breed.temperament = Array.isArray(temperament) ? temperament : (typeof temperament === 'string' ? temperament.split(',').map(t => t.trim()).filter(Boolean) : breed.temperament);
    }
    breed.groomingNeeds = groomingNeeds || breed.groomingNeeds;
    breed.exerciseNeeds = exerciseNeeds || breed.exerciseNeeds;
    breed.isActive = isActive !== undefined ? isActive : breed.isActive;
    breed.lastUpdatedBy = req.user.id;

    await breed.save();

    await breed.populate('species', 'name displayName category');
    await breed.populate('createdBy', 'name email');
    await breed.populate('lastUpdatedBy', 'name email');

    res.json({
      success: true,
      message: 'Breed updated successfully',
      data: breed
    });
  } catch (error) {
    console.error('Error updating breed:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating breed',
      error: error.message
    });
  }
});

// Soft delete breed
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const breed = await Breed.findById(req.params.id);
    if (!breed) {
      return res.status(404).json({
        success: false,
        message: 'Breed not found'
      });
    }

    await breed.softDelete(req.user.id);

    res.json({
      success: true,
      message: 'Breed deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting breed:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting breed',
      error: error.message
    });
  }
});

// Restore breed
router.patch('/:id/restore', auth, authorize('admin'), async (req, res) => {
  try {
    const breed = await Breed.findById(req.params.id);
    if (!breed) {
      return res.status(404).json({
        success: false,
        message: 'Breed not found'
      });
    }

    breed.isActive = true;
    breed.lastUpdatedBy = req.user.id;
    await breed.save();

    res.json({
      success: true,
      message: 'Breed restored successfully',
      data: breed
    });
  } catch (error) {
    console.error('Error restoring breed:', error);
    res.status(500).json({
      success: false,
      message: 'Error restoring breed',
      error: error.message
    });
  }
});

// Get breed statistics
router.get('/stats/overview', auth, authorize('admin'), async (req, res) => {
  try {
    const totalBreeds = await Breed.countDocuments();
    const activeBreeds = await Breed.countDocuments({ isActive: true });
    const inactiveBreeds = await Breed.countDocuments({ isActive: false });

    // Breeds by species
    const breedsBySpecies = await Breed.aggregate([
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
        total: totalBreeds,
        active: activeBreeds,
        inactive: inactiveBreeds,
        bySpecies: breedsBySpecies
      }
    });
  } catch (error) {
    console.error('Error fetching breed stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching breed statistics',
      error: error.message
    });
  }
});

module.exports = router;
