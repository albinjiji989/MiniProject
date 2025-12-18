const TemporaryCareRequest = require('../../user/models/TemporaryCareRequest');
const TemporaryCare = require('../../models/TemporaryCare');
const TemporaryCareCenter = require('../../manager/models/TemporaryCareCenter');
const Pet = require('../../../../core/models/Pet');
const { validationResult } = require('express-validator');
const crypto = require('crypto');

// Submit a temporary care request
const submitRequest = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    }

    const { pet, storeId, startDate, endDate, careType, notes, totalAmount } = req.body;
    
    // Verify pet ownership
    const petDoc = await Pet.findOne({ _id: pet, owner: req.user._id, isActive: true });
    if (!petDoc) {
      return res.status(404).json({ success: false, message: 'Pet not found or not owned by user' });
    }
    
    // Verify store exists and is active
    const center = await TemporaryCareCenter.findOne({ storeId, isActive: true });
    if (!center) {
      return res.status(404).json({ success: false, message: 'Care center not found or not active' });
    }
    
    // Check for date conflicts
    const existingRequest = await TemporaryCareRequest.findOne({
      pet,
      $or: [
        { startDate: { $lte: new Date(startDate) }, endDate: { $gte: new Date(startDate) } },
        { startDate: { $lte: new Date(endDate) }, endDate: { $gte: new Date(endDate) } },
        { startDate: { $gte: new Date(startDate) }, endDate: { $lte: new Date(endDate) } }
      ],
      status: { $in: ['pending', 'approved', 'assigned', 'in_care'] }
    });
    
    if (existingRequest) {
      return res.status(400).json({ 
        success: false, 
        message: 'Pet already has a care request for the selected dates' 
      });
    }
    
    // Calculate amounts if not provided
    const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
    const calculatedTotalAmount = totalAmount || (days * 500); // Default ₹500 per day
    const advanceAmount = Math.round(calculatedTotalAmount * 0.5);
    const finalAmount = calculatedTotalAmount - advanceAmount;
    
    const payload = {
      userId: req.user._id,
      pet,
      storeId,
      storeName: center.name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      careType,
      notes: notes || '',
      totalAmount: calculatedTotalAmount,
      advanceAmount,
      finalAmount
    };
    
    const doc = await TemporaryCareRequest.create(payload);
    
    res.status(201).json({ 
      success: true, 
      message: 'Request submitted successfully', 
      data: { request: doc } 
    });
  } catch (e) {
    console.error('Submit temporary care request error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// List user's temporary care requests
const listRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = { userId: req.user._id };
    
    if (status) {
      filter.status = status;
    }
    
    const items = await TemporaryCareRequest.find(filter)
      .populate('pet', 'name species breed images')
      .sort({ createdAt: -1 })
      .limit(Math.min(parseInt(limit, 10), 50))
      .skip((parseInt(page, 10) - 1) * parseInt(limit, 10));
      
    const total = await TemporaryCareRequest.countDocuments(filter);
    
    res.json({ 
      success: true, 
      data: { 
        requests: items, 
        pagination: { 
          current: parseInt(page, 10), 
          pages: Math.ceil(total / parseInt(limit, 10) || 1), 
          total 
        } 
      } 
    });
  } catch (e) {
    console.error('List temporary care requests error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get user's active temporary care
const getActiveCare = async (req, res) => {
  try {
    const items = await TemporaryCare.find({ 
      'owner.userId': req.user._id,
      status: { $in: ['active', 'pending'] },
      endDate: { $gte: new Date() } 
    })
    .populate('pet', 'name species breed images')
    .populate('caregiver', 'name')
    .sort({ startDate: -1 });
    
    res.json({ success: true, data: { items } });
  } catch (e) {
    console.error('Get active care error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get user's care history
const getCareHistory = async (req, res) => {
  try {
    const items = await TemporaryCare.find({ 
      'owner.userId': req.user._id,
      status: 'completed',
      endDate: { $lt: new Date() } 
    })
    .populate('pet', 'name species breed images')
    .populate('caregiver', 'name')
    .sort({ endDate: -1 });
    
    res.json({ success: true, data: { items } });
  } catch (e) {
    console.error('Get care history error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Cancel a temporary care request
const cancelRequest = async (req, res) => {
  try {
    const { id } = req.params;
    
    const request = await TemporaryCareRequest.findOne({
      _id: id,
      userId: req.user._id,
      status: { $in: ['pending', 'approved'] }
    });
    
    if (!request) {
      return res.status(404).json({ 
        success: false, 
        message: 'Request not found or cannot be cancelled' 
      });
    }
    
    request.status = 'cancelled';
    await request.save();
    
    res.json({ 
      success: true, 
      message: 'Request cancelled successfully',
      data: { request } 
    });
  } catch (e) {
    console.error('Cancel request error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Generate OTP for drop handover
const generateDropOTP = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    }

    const { temporaryCareId } = req.body;
    
    // Find the temporary care record
    const care = await TemporaryCare.findOne({
      _id: temporaryCareId,
      'owner.userId': req.user._id,
      status: 'pending'
    });
    
    if (!care) {
      return res.status(404).json({ 
        success: false, 
        message: 'Temporary care record not found or not in pending status' 
      });
    }
    
    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes expiry
    
    // Update the care record with OTP
    care.otp.drop = {
      code: otp,
      generatedAt: now,
      expiresAt: expiresAt,
      used: false
    };
    
    await care.save();
    
    // In a real implementation, you would send this OTP via SMS/email
    // For now, we'll return it in the response (not recommended for production)
    res.json({ 
      success: true, 
      message: 'Drop OTP generated successfully',
      data: { 
        temporaryCareId,
        expiresAt 
      }
    });
  } catch (e) {
    console.error('Generate drop OTP error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Verify drop OTP
const verifyDropOTP = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    }

    const { temporaryCareId, otp } = req.body;
    
    // Find the temporary care record
    const care = await TemporaryCare.findOne({
      _id: temporaryCareId,
      'owner.userId': req.user._id,
      status: 'pending'
    });
    
    if (!care) {
      return res.status(404).json({ 
        success: false, 
        message: 'Temporary care record not found or not in pending status' 
      });
    }
    
    // Check if OTP exists and is valid
    if (!care.otp.drop || !care.otp.drop.code) {
      return res.status(400).json({ 
        success: false, 
        message: 'No drop OTP generated for this record' 
      });
    }
    
    if (care.otp.drop.used) {
      return res.status(400).json({ 
        success: false, 
        message: 'Drop OTP has already been used' 
      });
    }
    
    const now = new Date();
    if (now > care.otp.drop.expiresAt) {
      return res.status(400).json({ 
        success: false, 
        message: 'Drop OTP has expired' 
      });
    }
    
    if (care.otp.drop.code !== otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid drop OTP' 
      });
    }
    
    // Mark OTP as used and update status
    care.otp.drop.used = true;
    care.otp.drop.usedAt = now;
    care.status = 'active';
    care.handover.scheduledAt = now;
    
    await care.save();
    
    res.json({ 
      success: true, 
      message: 'Drop OTP verified successfully. Pet is now in temporary care.',
      data: { care }
    });
  } catch (e) {
    console.error('Verify drop OTP error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Generate OTP for pickup handover
const generatePickupOTP = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    }

    const { temporaryCareId } = req.body;
    
    // Find the temporary care record
    const care = await TemporaryCare.findOne({
      _id: temporaryCareId,
      'owner.userId': req.user._id,
      status: 'active'
    });
    
    if (!care) {
      return res.status(404).json({ 
        success: false, 
        message: 'Temporary care record not found or not in active status' 
      });
    }
    
    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes expiry
    
    // Update the care record with OTP
    care.otp.pickup = {
      code: otp,
      generatedAt: now,
      expiresAt: expiresAt,
      used: false
    };
    
    await care.save();
    
    res.json({ 
      success: true, 
      message: 'Pickup OTP generated successfully',
      data: { 
        temporaryCareId,
        expiresAt 
      }
    });
  } catch (e) {
    console.error('Generate pickup OTP error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Verify pickup OTP
const verifyPickupOTP = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    }

    const { temporaryCareId, otp } = req.body;
    
    // Find the temporary care record
    const care = await TemporaryCare.findOne({
      _id: temporaryCareId,
      'owner.userId': req.user._id,
      status: 'active'
    });
    
    if (!care) {
      return res.status(404).json({ 
        success: false, 
        message: 'Temporary care record not found or not in active status' 
      });
    }
    
    // Check if OTP exists and is valid
    if (!care.otp.pickup || !care.otp.pickup.code) {
      return res.status(400).json({ 
        success: false, 
        message: 'No pickup OTP generated for this record' 
      });
    }
    
    if (care.otp.pickup.used) {
      return res.status(400).json({ 
        success: false, 
        message: 'Pickup OTP has already been used' 
      });
    }
    
    const now = new Date();
    if (now > care.otp.pickup.expiresAt) {
      return res.status(400).json({ 
        success: false, 
        message: 'Pickup OTP has expired' 
      });
    }
    
    if (care.otp.pickup.code !== otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid pickup OTP' 
      });
    }
    
    // Mark OTP as used and update status
    care.otp.pickup.used = true;
    care.otp.pickup.usedAt = now;
    care.status = 'completed';
    care.handover.completedAt = now;
    
    await care.save();
    
    res.json({ 
      success: true, 
      message: 'Pickup OTP verified successfully. Pet has been returned to you.',
      data: { care }
    });
  } catch (e) {
    console.error('Verify pickup OTP error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  submitRequest,
  listRequests,
  getActiveCare,
  getCareHistory,
  cancelRequest,
  generateDropOTP,
  verifyDropOTP,
  generatePickupOTP,
  verifyPickupOTP
};