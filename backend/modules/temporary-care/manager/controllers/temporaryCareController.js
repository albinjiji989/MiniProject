const TemporaryCare = require('../../models/TemporaryCare');
const TemporaryCareRequest = require('../../user/models/TemporaryCareRequest');
const Caregiver = require('../models/Caregiver');
const { validationResult } = require('express-validator');
const { sendStatusUpdateNotification } = require('../../services/notificationService');
const Pet = require('../../../../core/models/Pet');

// List all temporary care records for the manager's store
const listTemporaryCares = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    if (!req.user.storeId) {
      return res.status(400).json({ success: false, message: 'Manager has no storeId' });
    }
    
    const filter = { storeId: req.user.storeId };
    
    if (status) {
      filter.status = status;
    }
    
    const items = await TemporaryCare.find(filter)
      .populate('pet', 'name species breed images')
      .populate('owner.userId', 'name email')
      .populate('caregiver', 'name')
      .sort({ createdAt: -1 })
      .limit(Math.min(parseInt(limit, 10), 50))
      .skip((parseInt(page, 10) - 1) * parseInt(limit, 10));
      
    const total = await TemporaryCare.countDocuments(filter);
    
    res.json({ 
      success: true, 
      data: { 
        cares: items, 
        pagination: { 
          current: parseInt(page, 10), 
          pages: Math.ceil(total / parseInt(limit, 10) || 1), 
          total 
        } 
      } 
    });
  } catch (e) {
    console.error('List temporary cares error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get details of a specific temporary care record
const getTemporaryCare = async (req, res) => {
  try {
    const { id } = req.params;
    
    const care = await TemporaryCare.findOne({
      _id: id,
      storeId: req.user.storeId
    })
    .populate('pet', 'name species breed images')
    .populate('owner.userId', 'name email')
    .populate('caregiver', 'name');
    
    if (!care) {
      return res.status(404).json({ success: false, message: 'Temporary care record not found' });
    }
    
    res.json({ success: true, data: { care } });
  } catch (e) {
    console.error('Get temporary care error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update a temporary care record status
const updateTemporaryCareStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    }
    
    const { id } = req.params;
    const { status, notes } = req.body;
    
    const care = await TemporaryCare.findOne({
      _id: id,
      storeId: req.user.storeId
    }).populate('pet', 'name');
    
    if (!care) {
      return res.status(404).json({ success: false, message: 'Temporary care record not found' });
    }
    
    // Validate status
    if (!['pending', 'active', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    
    // Store previous status for notification
    const previousStatus = care.status;
    
    care.status = status;
    
    // Add notes if provided
    if (notes) {
      care.notes = notes;
    }
    
    // If status is completed, set completedAt
    if (status === 'completed') {
      care.handover.completedAt = new Date();
    }
    
    await care.save();
    
    // Send status update notification
    if (care.owner.userId && previousStatus !== status) {
      // Populate pet details for notification
      const pet = await Pet.findById(care.pet).select('name');
      if (pet) {
        care.pet = pet;
      }
      
      await sendStatusUpdateNotification(care.owner.userId, care, previousStatus);
    }
    
    res.json({ 
      success: true, 
      message: 'Temporary care status updated',
      data: { care } 
    });
  } catch (e) {
    console.error('Update temporary care status error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Assign a different caregiver to a temporary care record
const reassignCaregiver = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    }
    
    const { id } = req.params;
    const { caregiverId } = req.body;
    
    const care = await TemporaryCare.findOne({
      _id: id,
      storeId: req.user.storeId
    });
    
    if (!care) {
      return res.status(404).json({ success: false, message: 'Temporary care record not found' });
    }
    
    const caregiver = await Caregiver.findById(caregiverId);
    if (!caregiver) {
      return res.status(404).json({ success: false, message: 'Caregiver not found' });
    }
    
    if (caregiver.storeId !== req.user.storeId) {
      return res.status(403).json({ success: false, message: 'Caregiver not from your store' });
    }
    
    // Update caregiver
    care.caregiver = caregiverId;
    await care.save();
    
    // Update caregiver status
    try {
      caregiver.status = 'busy';
      await caregiver.save();
    } catch (_) {}
    
    res.json({ 
      success: true, 
      message: 'Caregiver reassigned successfully',
      data: { care } 
    });
  } catch (e) {
    console.error('Reassign caregiver error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Complete a temporary care record
const completeCare = async (req, res) => {
  try {
    const { id } = req.params;
    const { handoverNotes } = req.body;
    
    const care = await TemporaryCare.findOne({
      _id: id,
      storeId: req.user.storeId
    }).populate('pet', 'name');
    
    if (!care) {
      return res.status(404).json({ success: false, message: 'Temporary care record not found' });
    }
    
    // Store previous status for notification
    const previousStatus = care.status;
    
    care.status = 'completed';
    care.handover.completedAt = new Date();
    care.handover.notes = handoverNotes || '';
    
    await care.save();
    
    // Send status update notification
    if (care.owner.userId && previousStatus !== 'completed') {
      // Populate pet details for notification
      const pet = await Pet.findById(care.pet).select('name');
      if (pet) {
        care.pet = pet;
      }
      
      await sendStatusUpdateNotification(care.owner.userId, care, previousStatus);
    }
    
    res.json({ 
      success: true, 
      message: 'Temporary care completed',
      data: { care } 
    });
  } catch (e) {
    console.error('Complete care error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  listTemporaryCares,
  getTemporaryCare,
  updateTemporaryCareStatus,
  reassignCaregiver,
  completeCare
};