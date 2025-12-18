const TemporaryCare = require('../../models/TemporaryCare');
const { validationResult } = require('express-validator');
const { sendCareActivityNotification } = require('../../services/notificationService');
const Pet = require('../../../../core/models/Pet');

// Log a care activity
const logCareActivity = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    }

    const { temporaryCareId, activityType, notes, media } = req.body;
    
    // Verify temporary care exists and is active
    const care = await TemporaryCare.findOne({
      _id: temporaryCareId,
      caregiver: req.user._id,
      status: 'active'
    }).populate('pet', 'name');
    
    if (!care) {
      return res.status(404).json({ 
        success: false, 
        message: 'Active temporary care record not found' 
      });
    }
    
    // Create care activity
    const activity = {
      activityType,
      notes: notes || '',
      caregiver: req.user._id,
      media: media || []
    };
    
    care.careActivities.push(activity);
    await care.save();
    
    // Send notification to pet owner
    if (care.owner.userId) {
      // Populate pet details for notification
      const pet = await Pet.findById(care.pet).select('name');
      if (pet) {
        care.pet = pet;
      }
      
      await sendCareActivityNotification(care.owner.userId, activity, care);
    }
    
    res.json({ 
      success: true, 
      message: 'Care activity logged successfully',
      data: { activity: care.careActivities[care.careActivities.length - 1] } 
    });
  } catch (e) {
    console.error('Log care activity error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get care activities for a temporary care record
const getCareActivities = async (req, res) => {
  try {
    const { temporaryCareId } = req.params;
    
    // Verify temporary care exists and user has access
    const care = await TemporaryCare.findOne({
      _id: temporaryCareId,
      $or: [
        { 'owner.userId': req.user._id },
        { caregiver: req.user._id }
      ]
    });
    
    if (!care) {
      return res.status(404).json({ 
        success: false, 
        message: 'Temporary care record not found' 
      });
    }
    
    res.json({ 
      success: true, 
      data: { activities: care.careActivities } 
    });
  } catch (e) {
    console.error('Get care activities error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  logCareActivity,
  getCareActivities
};