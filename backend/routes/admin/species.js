const express = require('express');
const router = express.Router();
const Species = require('../../core/models/Species');
const { auth, authorize } = require('../../middleware/auth');

// Get all species
router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', isActive = true, category } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } }
      ];
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (category) {
      query.category = category;
    }

    const species = await Species.find(query)
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email')
      .sort({ displayName: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Species.countDocuments(query);

    res.json({
      success: true,
      data: species,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching species:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching species',
      error: error.message
    });
  }
});

// Get active species (for dropdowns)
router.get('/active', auth, async (req, res) => {
  try {
    const species = await Species.findActive();
    res.json({
      success: true,
      data: species
    });
  } catch (error) {
    console.error('Error fetching active species:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching active species',
      error: error.message
    });
  }
});

// Get species by ID
router.get('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const species = await Species.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email');

    if (!species) {
      return res.status(404).json({
        success: false,
        message: 'Species not found'
      });
    }

    res.json({
      success: true,
      data: species
    });
  } catch (error) {
    console.error('Error fetching species:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching species',
      error: error.message
    });
  }
});

// Create new species
router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { name, displayName, description, icon, category } = req.body;

    // Check if species already exists
    const existingSpecies = await Species.findByName(name);
    if (existingSpecies) {
      return res.status(400).json({
        success: false,
        message: 'Species with this name already exists'
      });
    }

    const species = new Species({
      name,
      displayName,
      description,
      icon,
      category,
      createdBy: req.user.id
    });

    await species.save();

    await species.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Species created successfully',
      data: species
    });
  } catch (error) {
    console.error('Error creating species:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating species',
      error: error.message
    });
  }
});

// Update species
router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { name, displayName, description, icon, isActive, category } = req.body;

    const species = await Species.findById(req.params.id);
    if (!species) {
      return res.status(404).json({
        success: false,
        message: 'Species not found'
      });
    }

    // Check if name is being changed and if it conflicts
    if (name && name !== species.name) {
      const existingSpecies = await Species.findByName(name);
      if (existingSpecies && existingSpecies._id.toString() !== species._id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Species with this name already exists'
        });
      }
    }

    species.name = name || species.name;
    species.displayName = displayName || species.displayName;
    species.description = description || species.description;
    species.icon = icon || species.icon;
    species.category = category || species.category;
    species.isActive = isActive !== undefined ? isActive : species.isActive;
    species.lastUpdatedBy = req.user.id;

    await species.save();

    await species.populate('createdBy', 'name email');
    await species.populate('lastUpdatedBy', 'name email');

    res.json({
      success: true,
      message: 'Species updated successfully',
      data: species
    });
  } catch (error) {
    console.error('Error updating species:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating species',
      error: error.message
    });
  }
});

// Soft delete species
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const species = await Species.findById(req.params.id);
    if (!species) {
      return res.status(404).json({
        success: false,
        message: 'Species not found'
      });
    }

    await species.softDelete(req.user.id);

    res.json({
      success: true,
      message: 'Species deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting species:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting species',
      error: error.message
    });
  }
});

// Restore species
router.patch('/:id/restore', auth, authorize('admin'), async (req, res) => {
  try {
    const species = await Species.findById(req.params.id);
    if (!species) {
      return res.status(404).json({
        success: false,
        message: 'Species not found'
      });
    }

    species.isActive = true;
    species.lastUpdatedBy = req.user.id;
    await species.save();

    res.json({
      success: true,
      message: 'Species restored successfully',
      data: species
    });
  } catch (error) {
    console.error('Error restoring species:', error);
    res.status(500).json({
      success: false,
      message: 'Error restoring species',
      error: error.message
    });
  }
});

// Get species statistics
router.get('/stats/overview', auth, authorize('admin'), async (req, res) => {
  try {
    const totalSpecies = await Species.countDocuments();
    const activeSpecies = await Species.countDocuments({ isActive: true });
    const inactiveSpecies = await Species.countDocuments({ isActive: false });

    res.json({
      success: true,
      data: {
        total: totalSpecies,
        active: activeSpecies,
        inactive: inactiveSpecies
      }
    });
  } catch (error) {
    console.error('Error fetching species stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching species statistics',
      error: error.message
    });
  }
});

module.exports = router;
