const express = require('express');
const router = express.Router();
const PetRegistry = require('../../models/PetRegistry');
const { auth, authorize } = require('../../middleware/auth');

/**
 * @desc    Get all pets from registry with pagination and filters
 * @route   GET /api/admin/pet-registry
 * @access  Private/Admin
 */
router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    // Build filter object
    let filter = {};
    
    // Search term filter
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { petCode: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // Source filter
    if (req.query.source) {
      filter.source = req.query.source;
    }
    
    // Location filter
    if (req.query.location) {
      filter.currentLocation = req.query.location;
    }
    
    // Status filter
    if (req.query.status) {
      filter.currentStatus = req.query.status;
    }
    
    // Deleted filter
    if (req.query.isDeleted !== undefined) {
      filter.isDeleted = req.query.isDeleted === 'true';
    } else {
      filter.isDeleted = false;
    }

    // Get total count for pagination
    const total = await PetRegistry.countDocuments(filter);
    
    // Get pets with pagination
    const pets = await PetRegistry.find(filter)
      .populate('species', 'name displayName')
      .populate('breed', 'name')
      .populate('currentOwnerId', 'name email')
      .populate('firstAddedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: pets,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (err) {
    console.error('Error fetching pets from registry:', err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

/**
 * @desc    Get single pet from registry by petCode
 * @route   GET /api/admin/pet-registry/:petCode
 * @access  Private/Admin
 */
router.get('/:petCode', auth, authorize('admin'), async (req, res) => {
  try {
    const petCode = req.params.petCode;
    
    // Get full pet details from registry
    const fullPetData = await PetRegistry.getFullPetDetails(petCode);
    
    res.status(200).json({
      success: true,
      data: fullPetData
    });
  } catch (err) {
    console.error('Error fetching pet from registry:', err);
    if (err.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'Pet not found in registry'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

/**
 * @desc    Update pet location and status in registry
 * @route   PUT /api/admin/pet-registry/:petCode/location
 * @access  Private/Admin
 */
router.put('/:petCode/location', auth, authorize('admin'), async (req, res) => {
  try {
    const { currentLocation, currentStatus } = req.body;
    const petCode = req.params.petCode;
    
    // First find the registry entry by petCode
    const registryEntry = await PetRegistry.findOne({ petCode });
    if (!registryEntry) {
      return res.status(404).json({
        success: false,
        error: 'Pet not found in registry'
      });
    }

    // Update the pet registry entry using findByIdAndUpdate
    const updatedPet = await PetRegistry.findByIdAndUpdate(
      registryEntry._id,
      { 
        currentLocation,
        currentStatus,
        lastSeenAt: new Date()
      },
      { new: true }
    ).populate('species', 'name displayName')
     .populate('breed', 'name')
     .populate('currentOwnerId', 'name email');

    if (!updatedPet) {
      return res.status(404).json({
        success: false,
        error: 'Pet not found in registry'
      });
    }

    res.status(200).json({
      success: true,
      data: updatedPet
    });
  } catch (err) {
    console.error('Error updating pet location:', err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

/**
 * @desc    Record ownership transfer in registry
 * @route   POST /api/admin/pet-registry/:petCode/transfer
 * @access  Private/Admin
 */
router.post('/:petCode/transfer', auth, authorize('admin'), async (req, res) => {
  try {
    const {
      previousOwnerId,
      newOwnerId,
      transferType,
      transferPrice,
      transferReason,
      source,
      notes
    } = req.body;
    
    const petCode = req.params.petCode;
    
    // Find the pet registry entry
    const registryPet = await PetRegistry.findOne({ petCode });
    
    if (!registryPet) {
      return res.status(404).json({
        success: false,
        error: 'Pet not found in registry'
      });
    }

    // Record the ownership transfer
    registryPet.recordOwnershipTransfer({
      previousOwnerId,
      newOwnerId,
      transferType,
      transferPrice,
      transferReason,
      source,
      notes,
      performedBy: req.user._id
    });

    // Save the updated registry entry
    await registryPet.save();

    res.status(200).json({
      success: true,
      data: registryPet
    });
  } catch (err) {
    console.error('Error recording pet transfer:', err);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

/**
 * @desc    Get ownership history for a pet
 * @route   GET /api/admin/pet-registry/:petCode/history
 * @access  Private/Admin
 */
router.get('/:petCode/history', auth, authorize('admin'), async (req, res) => {
  try {
    const petCode = req.params.petCode;
    
    const ownershipHistory = await PetRegistry.getOwnershipHistory(petCode);
    
    res.status(200).json({
      success: true,
      data: ownershipHistory
    });
  } catch (err) {
    console.error('Error fetching pet ownership history:', err);
    if (err.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'Pet not found in registry'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

module.exports = router;