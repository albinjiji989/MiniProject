const PetAuditService = require('../services/PetAuditService');

/**
 * Pet Audit Controller
 * Handles HTTP requests for pet audit functionality
 */

// Get audit trail for a specific pet
const getPetAuditTrail = async (req, res) => {
  try {
    const { petCode } = req.params;
    
    if (!petCode) {
      return res.status(400).json({ 
        success: false, 
        message: 'Pet code is required' 
      });
    }
    
    const auditTrail = await PetAuditService.getPetAuditTrail(petCode);
    
    res.json({
      success: true,
      data: auditTrail
    });
  } catch (error) {
    console.error('Get pet audit trail error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to retrieve audit trail' 
    });
  }
};

// Get audit summary for a specific pet
const getPetAuditSummary = async (req, res) => {
  try {
    const { petCode } = req.params;
    
    if (!petCode) {
      return res.status(400).json({ 
        success: false, 
        message: 'Pet code is required' 
      });
    }
    
    const auditSummary = await PetAuditService.getPetAuditSummary(petCode);
    
    res.json({
      success: true,
      data: auditSummary
    });
  } catch (error) {
    console.error('Get pet audit summary error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to retrieve audit summary' 
    });
  }
};

// Get all audit entries for the current user
const getUserAuditEntries = async (req, res) => {
  try {
    const auditEntries = await PetAuditService.getUserAuditEntries(req.user._id);
    
    res.json({
      success: true,
      data: auditEntries
    });
  } catch (error) {
    console.error('Get user audit entries error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to retrieve user audit entries' 
    });
  }
};

// Log a custom pet movement (for manual logging)
const logPetMovement = async (req, res) => {
  try {
    const {
      petCode,
      action,
      module,
      fromLocation,
      toLocation,
      details,
      notes
    } = req.body;
    
    if (!petCode || !action) {
      return res.status(400).json({ 
        success: false, 
        message: 'Pet code and action are required' 
      });
    }
    
    const auditEntry = await PetAuditService.logPetMovement({
      petCode,
      action,
      module: module || req.user.role, // Default to user role if not provided
      fromLocation,
      toLocation,
      performedBy: req.user._id,
      details: details || {},
      notes: notes || ''
    });
    
    res.status(201).json({
      success: true,
      data: auditEntry,
      message: 'Pet movement logged successfully'
    });
  } catch (error) {
    console.error('Log pet movement error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to log pet movement' 
    });
  }
};

module.exports = {
  getPetAuditTrail,
  getPetAuditSummary,
  getUserAuditEntries,
  logPetMovement
};