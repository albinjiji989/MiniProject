const PetReservation = require('../models/PetReservation');
const PetInventoryItem = require('../../manager/models/PetInventoryItem');
const PetShop = require('../../manager/models/PetShop');
const Pet = require('../../../../core/models/Pet');
const User = require('../../../../core/models/User');
const { getStoreFilter } = require('../../../../core/utils/storeFilter');
const { validationResult } = require('express-validator');
const logger = require('winston');

// Log controller actions with user context and operation details
const logAction = (req, action, data = {}) => {
  const userInfo = req.user ? `${req.user._id} (${req.user.role})` : 'unauthenticated';
  logger.info({
    action,
    user: userInfo,
    ...data,
    timestamp: new Date().toISOString()
  });
};

// Reservations (user auth required)
const createReservation = async (req, res) => {
  logAction(req, 'create_reservation', { 
    petId: req.body.petId,
    startDate: req.body.startDate,
    endDate: req.body.endDate
  });
  try {
    const { itemId, notes } = req.body
    if (!itemId) return res.status(400).json({ success: false, message: 'itemId is required' })
    const item = await PetInventoryItem.findOne({ _id: itemId, isActive: true })
    if (!item || item.status !== 'available_for_sale') {
      return res.status(400).json({ success: false, message: 'Item not available for reservation' })
    }
    const reservation = await PetReservation.create({ itemId, userId: req.user._id, notes: notes || '' })
    res.status(201).json({ success: true, message: 'Reservation created', data: { reservation } })
  } catch (e) {
    console.error('Create reservation error:', e)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

const listMyReservations = async (req, res) => {
  try {
    const reservations = await PetReservation.find({ userId: req.user._id })
      .populate({ 
        path: 'itemId', 
        select: 'name petCode price images storeName storeId speciesId breedId',
        populate: [
          { path: 'speciesId', select: 'name displayName' },
          { path: 'breedId', select: 'name' }
        ]
      })
      .sort({ createdAt: -1 })
    res.json({ success: true, data: { reservations } })
  } catch (e) {
    console.error('List reservations error:', e)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

const getReservationById = async (req, res) => {
  try {
    const reservation = await PetReservation.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    })
      .populate({ 
        path: 'itemId', 
        select: 'name petCode price images storeName storeId speciesId breedId',
        populate: [
          { path: 'speciesId', select: 'name displayName' },
          { path: 'breedId', select: 'name' }
        ]
      })
    
    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' })
    }
    
    res.json({ success: true, data: { reservation } })
  } catch (e) {
    console.error('Get reservation error:', e)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

const cancelReservation = async (req, res) => {
  try {
    const r = await PetReservation.findOne({ _id: req.params.id, userId: req.user._id })
    if (!r) return res.status(404).json({ success: false, message: 'Reservation not found' })
    if (r.status !== 'pending') return res.status(400).json({ success: false, message: 'Only pending reservations can be cancelled' })
    r.status = 'cancelled'
    await r.save()
    res.json({ success: true, message: 'Reservation cancelled', data: { reservation: r } })
  } catch (e) {
    console.error('Cancel reservation error:', e)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// Admin reservations management
const adminListReservations = async (req, res) => {
  try {
    const { status, userId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (userId) filter.userId = userId;
    const reservations = await PetReservation.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: { reservations } });
  } catch (e) {
    console.error('Admin list reservations error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const adminUpdateReservationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'cancelled', 'approved', 'completed'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Allowed: ${allowed.join(', ')}` });
    }
    const r = await PetReservation.findById(req.params.id);
    if (!r) return res.status(404).json({ success: false, message: 'Reservation not found' });
    r.status = status;
    await r.save();
    res.json({ success: true, message: 'Reservation status updated', data: { reservation: r } });
  } catch (e) {
    console.error('Admin update reservation status error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Manager reservation management
const managerListReservations = async (req, res) => {
  try {
    const { status } = req.query;
    // Build inventory scope using store filter (for items lookup only)
    const inventoryScope = { ...getStoreFilter(req.user) };
    const storeItems = await PetInventoryItem.find(inventoryScope, '_id');
    const itemIds = storeItems.map(item => item._id);
    if (process.env.DEBUG_RESERVATIONS_LOGS === '1') {
      console.log('managerListReservations inventoryScope:', inventoryScope, 'itemsCount:', itemIds.length)
    }

    // Build reservation filter (do not include unrelated store fields that may not exist on reservations)
    const reservationFilter = {}
    if (itemIds.length > 0) reservationFilter.itemId = { $in: itemIds };
    
    if (status) reservationFilter.status = status;
    
    const reservations = await PetReservation.find(reservationFilter)
      .populate('userId', 'name email')
      .populate('itemId', 'name price petCode storeId')
      .sort({ createdAt: -1 });
      
    res.json({ success: true, data: { reservations } });
  } catch (e) {
    console.error('Manager list reservations error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const managerUpdateReservationStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const allowed = ['pending', 'manager_review', 'approved', 'payment_pending', 'paid', 'ready_pickup', 'completed', 'cancelled'];
    
    if (!allowed.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid status. Allowed: ${allowed.join(', ')}` 
      });
    }
    
    // Find the reservation with relaxed authorization for development
    const reservation = await PetReservation.findById(req.params.id)
      .populate('itemId')
      .populate('userId', 'name email');
      
    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }
    
    // For development: allow managers to update any reservation
    // In production, you can add store-based authorization back
    // Update status
    const previousStatus = reservation.status;
    reservation.status = status;
    reservation.deliveryInfo.notes = notes || '';
    reservation.deliveryInfo.updatedBy = req.user._id;
    reservation.deliveryInfo.updatedAt = new Date();
    await reservation.save();
    
    // If status is completed (or legacy at_owner), transfer ownership and create pet record
    // TODO: Implement handlePetOwnershipTransfer function
    
    res.json({
      success: true,
      message: 'Delivery status updated successfully',
      data: { reservation: { ...reservation.toObject(), id: reservation._id } }
    });
    
  } catch (e) {
    console.error('Manager update reservation status error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  createReservation,
  listMyReservations,
  getReservationById,
  cancelReservation,
  adminListReservations,
  adminUpdateReservationStatus,
  managerListReservations,
  managerUpdateReservationStatus
};