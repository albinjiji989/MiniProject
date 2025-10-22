const PetReservation = require('../../user/models/PetReservation');
const PetInventoryItem = require('../models/PetInventoryItem');
const { getStoreFilter } = require('../../../../core/utils/storeFilter');

// ===== ENHANCED RESERVATION MANAGEMENT =====

// Create enhanced reservation with detailed info
const createEnhancedReservation = async (req, res) => {
  try {
    const { itemId, contactInfo, visitDetails, reservationType, notes } = req.body;
    
    if (!itemId) {
      return res.status(400).json({ success: false, message: 'itemId is required' });
    }
    
    const item = await PetInventoryItem.findOne({ _id: itemId, isActive: true });
    if (!item || item.status !== 'available_for_sale') {
      return res.status(400).json({ 
        success: false, 
        message: 'Pet not available for reservation' 
      });
    }
    
    // Check if user already has pending reservation for this item
    const existingReservation = await PetReservation.findOne({
      itemId,
      userId: req.user._id,
      status: { $in: ['pending', 'manager_review', 'approved', 'payment_pending'] }
    });
    
    if (existingReservation) {
      return res.status(400).json({ 
        success: false, 
        message: 'You already have an active reservation for this pet' 
      });
    }
    
    const reservationData = {
      itemId,
      userId: req.user._id,
      reservationType: reservationType || 'online_booking',
      contactInfo: {
        phone: contactInfo?.phone || req.user.phone,
        email: contactInfo?.email || req.user.email,
        preferredContactMethod: contactInfo?.preferredContactMethod || 'both'
      },
      visitDetails: visitDetails || {},
      paymentInfo: {
        amount: item.price
      },
      notes: notes || '',
      status: reservationType === 'offline_verification' ? 'manager_review' : 'pending'
    };
    
    const reservation = new PetReservation(reservationData);
    await reservation.save();
    
    // Populate the response
    await reservation.populate([
      { path: 'itemId', select: 'name petCode price images' },
      { path: 'userId', select: 'name email' }
    ]);
    
    res.status(201).json({ 
      success: true, 
      message: 'Reservation created successfully', 
      data: { reservation } 
    });
  } catch (e) {
    console.error('Create enhanced reservation error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// List reservations with enhanced filtering
const listEnhancedReservations = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      reservationType, 
      dateFrom, 
      dateTo 
    } = req.query;
    
    let filter = {};
    
    // Apply role-based filtering
    if (req.user.role === 'manager') {
      // Manager sees only reservations for their store's items
      const storeFilter = getStoreFilter(req.user);
      const storeItems = await PetInventoryItem.find(storeFilter, '_id');
      filter.itemId = { $in: storeItems.map(item => item._id) };
    } else if (req.user.role !== 'admin') {
      // Regular users see only their own reservations
      filter.userId = req.user._id;
    }
    
    // Apply additional filters
    if (status) filter.status = status;
    if (reservationType) filter.reservationType = reservationType;
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }
    
    const reservations = await PetReservation.find(filter)
      .populate([
        { path: 'itemId', select: 'name petCode price images' },
        { path: 'userId', select: 'name email phone' },
        { path: 'managerReview.reviewedBy', select: 'name' }
      ])
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
      
    const total = await PetReservation.countDocuments(filter);
    
    res.json({ 
      success: true, 
      data: { 
        reservations, 
        pagination: { 
          current: parseInt(page), 
          pages: Math.ceil(total / limit), 
          total 
        } 
      } 
    });
  } catch (e) {
    console.error('List enhanced reservations error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get reservation by code for payment gateway
const getReservationByCode = async (req, res) => {
  try {
    const { code } = req.params;
    
    const reservation = await PetReservation.findOne({ 
      $or: [
        { _id: code },
        { reservationCode: code }
      ]
    })
    .populate('userId', 'name email')
    .populate('itemId', 'name petCode price images speciesId breedId storeId storeName');
    
    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }
    
    // Only allow user to see their own reservation or public access for payment
    if (req.user && reservation.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    res.json({
      success: true,
      data: { reservation }
    });
    
  } catch (err) {
    console.error('Get reservation by code error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  createEnhancedReservation,
  listEnhancedReservations,
  getReservationByCode
};