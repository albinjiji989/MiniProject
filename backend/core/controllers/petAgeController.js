const PetAgeService = require('../services/PetAgeService');

/**
 * Pet Age Controller
 * Handles HTTP requests for pet age functionality
 */

// Create age tracker for a pet
const createAgeTracker = async (req, res) => {
  try {
    const { petCode, initialAgeValue, initialAgeUnit, birthDate } = req.body;
    
    if (!petCode || initialAgeValue === undefined || !initialAgeUnit) {
      return res.status(400).json({ 
        success: false, 
        message: 'petCode, initialAgeValue, and initialAgeUnit are required' 
      });
    }

    const ageTracker = await PetAgeService.createAgeTracker({
      petCode,
      initialAgeValue,
      initialAgeUnit,
      birthDate: birthDate ? new Date(birthDate) : null
    });

    res.status(201).json({
      success: true,
      data: ageTracker,
      message: 'Age tracker created successfully'
    });
  } catch (error) {
    console.error('Create age tracker error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to create age tracker' 
    });
  }
};

// Get current age for a pet
const getCurrentAge = async (req, res) => {
  try {
    const { petCode } = req.params;
    
    if (!petCode) {
      return res.status(400).json({ 
        success: false, 
        message: 'Pet code is required' 
      });
    }

    const ageInfo = await PetAgeService.getCurrentAge(petCode);

    res.json({
      success: true,
      data: ageInfo
    });
  } catch (error) {
    console.error('Get current age error:', error);
    res.status(404).json({ 
      success: false, 
      message: error.message || 'Failed to get current age' 
    });
  }
};

// Update age tracker
const updateAgeTracker = async (req, res) => {
  try {
    const { petCode } = req.params;
    const updateData = req.body;
    
    if (!petCode) {
      return res.status(400).json({ 
        success: false, 
        message: 'Pet code is required' 
      });
    }

    const updatedTracker = await PetAgeService.updateAgeTracker(petCode, updateData);

    res.json({
      success: true,
      data: updatedTracker,
      message: 'Age tracker updated successfully'
    });
  } catch (error) {
    console.error('Update age tracker error:', error);
    res.status(404).json({ 
      success: false, 
      message: error.message || 'Failed to update age tracker' 
    });
  }
};

// Update all pet ages (admin only)
const updateAllAges = async (req, res) => {
  try {
    const updatedTrackers = await PetAgeService.updateAllAges();

    res.json({
      success: true,
      data: { updatedCount: updatedTrackers.length },
      message: `Updated ages for ${updatedTrackers.length} pets`
    });
  } catch (error) {
    console.error('Update all ages error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to update all pet ages' 
    });
  }
};

// Delete age tracker
const deleteAgeTracker = async (req, res) => {
  try {
    const { petCode } = req.params;
    
    if (!petCode) {
      return res.status(400).json({ 
        success: false, 
        message: 'Pet code is required' 
      });
    }

    const deleted = await PetAgeService.deleteAgeTracker(petCode);
    
    if (deleted) {
      res.json({
        success: true,
        message: 'Age tracker deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Age tracker not found'
      });
    }
  } catch (error) {
    console.error('Delete age tracker error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to delete age tracker' 
    });
  }
};

// Get pets by age range
const getPetsByAgeRange = async (req, res) => {
  try {
    const { minAge, maxAge, unit } = req.query;
    
    if (!minAge || !maxAge || !unit) {
      return res.status(400).json({ 
        success: false, 
        message: 'minAge, maxAge, and unit are required' 
      });
    }

    const pets = await PetAgeService.getPetsByAgeRange(
      Number(minAge), 
      Number(maxAge), 
      unit
    );

    res.json({
      success: true,
      data: pets,
      count: pets.length
    });
  } catch (error) {
    console.error('Get pets by age range error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to get pets by age range' 
    });
  }
};

// Get age statistics
const getAgeStatistics = async (req, res) => {
  try {
    const stats = await PetAgeService.getAgeStatistics();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get age statistics error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to get age statistics' 
    });
  }
};

module.exports = {
  createAgeTracker,
  getCurrentAge,
  updateAgeTracker,
  updateAllAges,
  deleteAgeTracker,
  getPetsByAgeRange,
  getAgeStatistics
};