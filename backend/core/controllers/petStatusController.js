const PetStatusService = require('../services/petStatusService');
const PetRegistry = require('../models/PetRegistry');

/**
 * Admit a pet to hospital
 * @route PUT /api/pets/:petCode/hospital/admit
 * @access Private (Veterinary/Hospital staff)
 */
const admitToHospital = async (req, res) => {
  try {
    const { petCode } = req.params;
    const { reason, notes } = req.body;
    
    // Verify pet exists
    const pet = await PetRegistry.findOne({ petCode });
    if (!pet) {
      return res.status(404).json({ 
        success: false, 
        message: 'Pet not found' 
      });
    }
    
    // Admit to hospital
    const updatedPet = await PetStatusService.admitToHospital(petCode, {
      reason,
      performedBy: req.user._id,
      notes
    });
    
    res.json({
      success: true,
      message: 'Pet admitted to hospital successfully',
      data: updatedPet
    });
  } catch (error) {
    console.error('Admit to hospital error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error' 
    });
  }
};

/**
 * Discharge a pet from hospital
 * @route PUT /api/pets/:petCode/hospital/discharge
 * @access Private (Veterinary/Hospital staff)
 */
const dischargeFromHospital = async (req, res) => {
  try {
    const { petCode } = req.params;
    const { ownerId, reason, notes } = req.body;
    
    // Verify pet exists
    const pet = await PetRegistry.findOne({ petCode });
    if (!pet) {
      return res.status(404).json({ 
        success: false, 
        message: 'Pet not found' 
      });
    }
    
    // Discharge from hospital
    const updatedPet = await PetStatusService.dischargeFromHospital(petCode, {
      ownerId,
      reason,
      performedBy: req.user._id,
      notes
    });
    
    res.json({
      success: true,
      message: 'Pet discharged from hospital successfully',
      data: updatedPet
    });
  } catch (error) {
    console.error('Discharge from hospital error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error' 
    });
  }
};

/**
 * Place a pet in temporary care
 * @route PUT /api/pets/:petCode/temporary-care/start
 * @access Private
 */
const placeInTemporaryCare = async (req, res) => {
  try {
    const { petCode } = req.params;
    const { reason, caretakerId, notes } = req.body;
    
    // Verify pet exists
    const pet = await PetRegistry.findOne({ petCode });
    if (!pet) {
      return res.status(404).json({ 
        success: false, 
        message: 'Pet not found' 
      });
    }
    
    // Place in temporary care
    const updatedPet = await PetStatusService.placeInTemporaryCare(petCode, {
      reason,
      caretakerId,
      performedBy: req.user._id,
      notes
    });
    
    res.json({
      success: true,
      message: 'Pet placed in temporary care successfully',
      data: updatedPet
    });
  } catch (error) {
    console.error('Place in temporary care error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error' 
    });
  }
};

/**
 * End temporary care for a pet
 * @route PUT /api/pets/:petCode/temporary-care/end
 * @access Private
 */
const endTemporaryCare = async (req, res) => {
  try {
    const { petCode } = req.params;
    const { ownerId, reason, notes } = req.body;
    
    // Verify pet exists
    const pet = await PetRegistry.findOne({ petCode });
    if (!pet) {
      return res.status(404).json({ 
        success: false, 
        message: 'Pet not found' 
      });
    }
    
    // End temporary care
    const updatedPet = await PetStatusService.endTemporaryCare(petCode, {
      ownerId,
      reason,
      performedBy: req.user._id,
      notes
    });
    
    res.json({
      success: true,
      message: 'Temporary care ended successfully',
      data: updatedPet
    });
  } catch (error) {
    console.error('End temporary care error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error' 
    });
  }
};

/**
 * Mark a pet as deceased
 * @route PUT /api/pets/:petCode/deceased
 * @access Private
 */
const markAsDeceased = async (req, res) => {
  try {
    const { petCode } = req.params;
    const { reason, notes } = req.body;
    
    // Verify pet exists
    const pet = await PetRegistry.findOne({ petCode });
    if (!pet) {
      return res.status(404).json({ 
        success: false, 
        message: 'Pet not found' 
      });
    }
    
    // Mark as deceased
    const updatedPet = await PetStatusService.markAsDeceased(petCode, {
      reason,
      performedBy: req.user._id,
      notes
    });
    
    res.json({
      success: true,
      message: 'Pet marked as deceased',
      data: updatedPet
    });
  } catch (error) {
    console.error('Mark as deceased error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error' 
    });
  }
};

/**
 * Get pet status history
 * @route GET /api/pets/:petCode/status-history
 * @access Private
 */
const getStatusHistory = async (req, res) => {
  try {
    const { petCode } = req.params;
    
    // Get pet with populated ownership history
    const pet = await PetRegistry.findOne({ petCode })
      .populate('ownershipHistory.previousOwnerId', 'name email')
      .populate('ownershipHistory.newOwnerId', 'name email')
      .populate('ownershipHistory.performedBy', 'name role');
    
    if (!pet) {
      return res.status(404).json({ 
        success: false, 
        message: 'Pet not found' 
      });
    }
    
    res.json({
      success: true,
      data: {
        currentLocation: pet.currentLocation,
        currentStatus: pet.currentStatus,
        firstAddedSource: pet.firstAddedSource,
        ownershipHistory: pet.ownershipHistory
      }
    });
  } catch (error) {
    console.error('Get status history error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error' 
    });
  }
};

module.exports = {
  admitToHospital,
  dischargeFromHospital,
  placeInTemporaryCare,
  endTemporaryCare,
  markAsDeceased,
  getStatusHistory
};