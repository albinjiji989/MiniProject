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
      { path: 'itemId', select: 'name petCode price images', populate: [{ path: 'imageIds' }] },
      { path: 'userId', select: 'name email' }
    ]);
    
    // Manually populate the virtual 'images' field
    if (reservation.itemId) {
      await reservation.itemId.populate('images');
    }
    
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
    console.log('Manager user info:', { userId: req.user._id, role: req.user.role, storeId: req.user.storeId });
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
    // Check if user is a manager (could be 'manager' or 'petshop_manager')
    const isManager = req.user.role && (req.user.role === 'manager' || req.user.role.includes('_manager'));
    console.log('User role check:', { userRole: req.user.role, isManager });
    
    if (isManager) {
      // Manager sees only reservations for their store's items
      const storeFilter = getStoreFilter(req.user);
      console.log('Store filter for manager:', storeFilter);
      const storeItems = await PetInventoryItem.find(storeFilter, '_id storeId name petCode');
      console.log('Store items found:', storeItems.map(item => ({ id: item._id, storeId: item.storeId, name: item.name, petCode: item.petCode })));
      filter.itemId = { $in: storeItems.map(item => item._id) };
      console.log('Reservation filter:', filter);
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
        { path: 'itemId', select: 'name petCode price images storeId', populate: [{ path: 'imageIds' }] },
        { path: 'userId', select: 'name email phone' },
        { path: 'managerReview.reviewedBy', select: 'name' }
      ])
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
      
    // Debug log to see what reservations are being returned
    console.log('Reservations found:', reservations.map(r => ({
      id: r._id,
      reservationCode: r.reservationCode,
      pet: r.itemId ? { id: r.itemId._id, name: r.itemId.name, petCode: r.itemId.petCode, storeId: r.itemId.storeId } : null,
      user: r.userId ? { id: r.userId._id, name: r.userId.name } : null,
      status: r.status
    })));
      
    // Manually populate the virtual 'images' field for each item
    for (const reservation of reservations) {
      if (reservation.itemId) {
        await reservation.itemId.populate('images');
        console.log('Populated item for reservation:', {
          reservationId: reservation._id,
          itemId: reservation.itemId._id,
          itemName: reservation.itemId.name,
          itemImages: reservation.itemId.images?.length || 0
        });
      }
    }
    
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
    .populate('itemId', 'name petCode price images speciesId breedId storeId storeName', null, { populate: [{ path: 'imageIds' }] });
    
    // Manually populate the virtual 'images' field
    if (reservation && reservation.itemId) {
      await reservation.itemId.populate('images');
    }
    
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

// Get reservation by ID for managers
const getReservationById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const reservation = await PetReservation.findById(id)
      .populate('userId', 'name email phone')
      .populate('itemId', 'name petCode price images speciesId breedId storeId storeName', null, { populate: [{ path: 'imageIds' }] });
    
    // Manually populate the virtual 'images' field
    if (reservation && reservation.itemId) {
      await reservation.itemId.populate('images');
    }
    
    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }

    // Only allow manager to see reservations for their store
    const storeFilter = getStoreFilter(req.user);
    if (reservation.itemId && reservation.itemId.storeId.toString() !== storeFilter.storeId.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({
      success: true,
      data: { reservation }
    });

  } catch (err) {
    console.error('Get reservation by ID error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Manager approves/initiates payment for a reservation
const approvePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    
    // Find the reservation
    const reservation = await PetReservation.findById(id)
      .populate('userId', 'name email phone')
      .populate('itemId', 'name petCode price images speciesId breedId storeId storeName', null, { populate: [{ path: 'imageIds' }] });
    
    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }
    
    // Only allow manager to approve reservations for their store
    const storeFilter = getStoreFilter(req.user);
    if (reservation.itemId && reservation.itemId.storeId.toString() !== storeFilter.storeId.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    // Check if reservation is in correct status for payment approval
    if (reservation.status !== 'going_to_buy') {
      return res.status(400).json({ 
        success: false, 
        message: `Reservation must be in 'going_to_buy' status to approve payment. Current status: ${reservation.status}` 
      });
    }
    
    // Update reservation status to allow payment
    reservation.status = 'payment_pending';
    reservation._statusChangeNote = `Payment approved by manager: ${notes || 'No notes provided'}`;
    reservation._updatedBy = req.user._id;
    
    await reservation.save();
    
    res.json({
      success: true,
      message: 'Payment approved successfully. User can now proceed to payment.',
      data: { reservation }
    });

  } catch (err) {
    console.error('Approve payment error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  createEnhancedReservation,
  listEnhancedReservations,
  getReservationByCode,
  getReservationById,
  approvePayment
};