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
    
    // Update pet status to reserved
    await PetInventoryItem.findByIdAndUpdate(itemId, { status: 'reserved' });
    
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
          { path: 'breedId', select: 'name' },
          { path: 'imageIds' } // Populate imageIds to ensure images virtual field can be populated
        ]
      })
      .sort({ createdAt: -1 })
    
    // Manually populate the virtual 'images' field for each item
    for (const reservation of reservations) {
      if (reservation.itemId) {
        await reservation.itemId.populate('images');
      }
    }
    
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
          { path: 'breedId', select: 'name' },
          { path: 'imageIds' } // Populate imageIds to ensure images virtual field can be populated
        ]
      })
    
    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' })
    }
    
    // Manually populate the virtual 'images' field for the item
    if (reservation.itemId) {
      await reservation.itemId.populate('images');
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
    
    // Allow cancellation of various reservation statuses
    const cancellableStatuses = ['pending', 'manager_review', 'approved', 'going_to_buy', 'payment_pending']
    if (!cancellableStatuses.includes(r.status)) {
      return res.status(400).json({ success: false, message: 'Only pending, under review, approved, or payment pending reservations can be cancelled' })
    }
    
    r.status = 'cancelled'
    
    // Also update the pet's status back to available_for_sale
    await PetInventoryItem.findByIdAndUpdate(r.itemId, { status: 'available_for_sale' });
    
    await r.save()
    
    // Log the cancellation in the timeline
    r.timeline.push({
      status: 'cancelled',
      timestamp: new Date(),
      updatedBy: req.user._id,
      notes: 'Reservation cancelled by user'
    });
    
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
    
    // If status is being changed to cancelled, also update the pet's status
    if (status === 'cancelled' && r.status !== 'cancelled') {
      await PetInventoryItem.findByIdAndUpdate(r.itemId, { status: 'available_for_sale' });
    }
    
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
      .populate('itemId', 'name price petCode storeId', null, { populate: [{ path: 'imageIds' }] })
      .sort({ createdAt: -1 });
      
    // Manually populate the virtual 'images' field for each item
    for (const reservation of reservations) {
      if (reservation.itemId) {
        await reservation.itemId.populate('images');
      }
    }
    
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
      .populate('itemId', null, null, { populate: [{ path: 'imageIds' }] })
      .populate('userId', 'name email');
      
    // Manually populate the virtual 'images' field
    if (reservation && reservation.itemId) {
      await reservation.itemId.populate('images');
    }
    
    // For development: allow managers to update any reservation
    // In production, you can add store-based authorization back
    // Update status
    const previousStatus = reservation.status;
    
    // If status is being changed to cancelled, also update the pet's status
    if (status === 'cancelled' && reservation.status !== 'cancelled') {
      await PetInventoryItem.findByIdAndUpdate(reservation.itemId, { status: 'available_for_sale' });
    }
    
    reservation.status = status;
    reservation.deliveryInfo.notes = notes || '';
    reservation.deliveryInfo.updatedBy = req.user._id;
    reservation.deliveryInfo.updatedAt = new Date();
    await reservation.save();
    
    // If status is completed (or legacy at_owner), transfer ownership and create pet record
    if (status === 'completed' || status === 'at_owner') {
      await handlePetOwnershipTransfer(reservation, req.user._id);
    }
    
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

// Helper function to transfer pet ownership when reservation is completed
const handlePetOwnershipTransfer = async (reservation, userId) => {
  try {
    // Get the inventory item with proper population
    const inventoryItem = await PetInventoryItem.findById(reservation.itemId)
      .populate('speciesId', 'name displayName')
      .populate('breedId', 'name')
      .populate('imageIds'); // Populate imageIds to ensure images virtual field can be populated
    
    // Manually populate the virtual 'images' field
    if (inventoryItem) {
      await inventoryItem.populate('images');
    }
    
    console.log('Inventory item found:', inventoryItem?.name, 'ImageIds:', inventoryItem?.imageIds, 'Images:', inventoryItem?.images);
    if (!inventoryItem) {
      throw new Error('Inventory item not found');
    }

    // Create a new pet record for the user
    const petData = {
      name: inventoryItem.name,
      species: inventoryItem.speciesId,
      breed: inventoryItem.breedId,
      age: inventoryItem.age,
      ageUnit: inventoryItem.ageUnit,
      gender: inventoryItem.gender,
      color: inventoryItem.color,
      description: inventoryItem.description,
      images: inventoryItem.images || [], // Ensure images are properly included
      ownerId: reservation.userId,
      petCode: inventoryItem.petCode,
      source: 'petshop_purchase',
      currentStatus: 'available',
      status: 'available',
      createdBy: userId || reservation.userId // Use the provided userId or default to the reservation user
    };

    const newPet = new Pet(petData);
    await newPet.save();

    // Update inventory item status to sold
    inventoryItem.status = 'sold';
    inventoryItem.soldTo = reservation.userId;
    inventoryItem.soldAt = new Date();
    await inventoryItem.save();

    // Update reservation with pet reference
    reservation.petId = newPet._id;
    await reservation.save();

    // Update PetRegistry to reflect new ownership
    const PetRegistry = require('../../../core/models/PetRegistry');
    console.log('Updating PetRegistry for petCode:', inventoryItem.petCode, 'ImageIds:', inventoryItem.imageIds, 'Images:', inventoryItem.images);
    await PetRegistry.findOneAndUpdate(
      { petCode: inventoryItem.petCode },
      {
        $set: {
          name: inventoryItem.name,
          species: inventoryItem.speciesId,
          breed: inventoryItem.breedId,
          imageIds: inventoryItem.imageIds || [], // Ensure imageIds are properly included
          gender: inventoryItem.gender,
          age: inventoryItem.age,
          ageUnit: inventoryItem.ageUnit,
          color: inventoryItem.color,
          currentOwnerId: reservation.userId,
          currentStatus: 'owned',
          currentLocation: 'at_owner',
          lastTransferAt: new Date()
        },
        $push: {
          ownershipHistory: {
            previousOwnerId: null,
            newOwnerId: reservation.userId,
            transferType: 'purchase',
            transferDate: new Date(),
            transferPrice: reservation.paymentInfo?.amount || 0,
            transferReason: 'Pet shop purchase',
            source: 'petshop',
            performedBy: userId
          }
        }
      },
      { new: true, upsert: true }
    );

    return newPet;
  } catch (error) {
    console.error('Error in handlePetOwnershipTransfer:', error);
    throw error;
  }
};

// Manager review reservation (approve/reject)
const managerReviewReservation = async (req, res) => {
  try {
    const { action, reviewNotes, approvalReason } = req.body;
    
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid action. Must be either approve or reject' 
      });
    }
    
    // Find the reservation
    const reservation = await PetReservation.findById(req.params.id)
      .populate('itemId', null, null, { populate: [{ path: 'imageIds' }] })
      .populate('userId', 'name email');
      
    // Manually populate the virtual 'images' field
    if (reservation && reservation.itemId) {
      await reservation.itemId.populate('images');
    }
    
    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }
    
    // Check if reservation is in a reviewable state
    if (!['pending', 'manager_review'].includes(reservation.status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Reservation is not in a reviewable state' 
      });
    }
    
    // Update reservation based on action
    if (action === 'approve') {
      reservation.status = 'approved';
      reservation.managerReview = {
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
        reviewNotes: reviewNotes || '',
        approvalReason: approvalReason || ''
      };
    } else {
      reservation.status = 'rejected';
      reservation.managerReview = {
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
        reviewNotes: reviewNotes || ''
      };
      
      // If rejected, update the pet's status back to available_for_sale
      await PetInventoryItem.findByIdAndUpdate(reservation.itemId, { status: 'available_for_sale' });
    }
    
    // Add to timeline
    reservation.timeline.push({
      status: reservation.status,
      timestamp: new Date(),
      updatedBy: req.user._id,
      notes: reviewNotes || ''
    });
    
    await reservation.save();
    
    res.json({
      success: true,
      message: `Reservation ${action}d successfully`,
      data: { reservation }
    });
    
  } catch (e) {
    console.error('Manager review reservation error:', e);
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
  managerUpdateReservationStatus,
  managerReviewReservation
};