const express = require('express');
const router = express.Router();
const { auth } = require('../../../../core/middleware/auth');
const PetRegistryService = require('../../../../core/services/petRegistryService');
const PetRegistry = require('../../../../core/models/PetRegistry');

// Get ownership history for a specific pet
router.get('/:petCode', auth, async (req, res) => {
  try {
    const { petCode } = req.params;
    
    const history = await PetRegistryService.getOwnershipHistory(petCode);
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error fetching ownership history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching ownership history',
      error: error.message
    });
  }
});

// Get all pets owned by current user with ownership history
router.get('/my/all', auth, async (req, res) => {
  try {
    const pets = await PetRegistry.find({ 
      currentOwnerId: req.user.id 
    })
      .populate('species', 'name displayName')
      .populate('breed', 'name')
      .populate('ownershipHistory.previousOwnerId', 'name email')
      .populate('ownershipHistory.newOwnerId', 'name email')
      .populate('firstAddedBy', 'name email')
      .sort({ updatedAt: -1 });
    
    const petsWithSummary = pets.map(pet => ({
      ...pet.toObject(),
      ownershipSummary: pet.getOwnershipSummary()
    }));
    
    res.json({
      success: true,
      data: petsWithSummary
    });
  } catch (error) {
    console.error('Error fetching owned pets with history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching owned pets',
      error: error.message
    });
  }
});

module.exports = router;
