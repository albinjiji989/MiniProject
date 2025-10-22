const PetShop = require('../../manager/models/PetShop');
const Pet = require('../../../../core/models/Pet');
const Wishlist = require('../../user/models/Wishlist');
const PetInventoryItem = require('../../manager/models/PetInventoryItem');
const PetReservation = require('../../user/models/PetReservation');
const StoreNameChangeRequest = require('../models/StoreNameChangeRequest');
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

// Admin Functions
const adminListShops = async (req, res) => {
  try {
    const { isActive, page = 1, limit = 10 } = req.query;
    const filter = {};
    
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const petShops = await PetShop.find(filter)
      .populate('createdBy', 'name email')
      .populate('staff.user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await PetShop.countDocuments(filter);
    
    res.json({ 
      success: true, 
      data: { 
        petShops, 
        pagination: { 
          current: parseInt(page), 
          pages: Math.ceil(total / limit), 
          total 
        } 
      } 
    });
  } catch (error) {
    console.error('Get pet shops error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const adminUpdateShopStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, notes } = req.body;

    const petShop = await PetShop.findByIdAndUpdate(
      id,
      { isActive, statusUpdateNotes: notes, statusUpdatedAt: new Date() },
      { new: true }
    );

    if (!petShop) {
      return res.status(404).json({ 
        success: false, 
        message: 'Pet shop not found' 
      });
    }

    res.json({
      success: true,
      data: { petShop },
      message: 'Pet shop status updated successfully'
    });
  } catch (error) {
    console.error('Update pet shop status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const adminListAllListings = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { isActive: true };
    
    if (status) filter.status = status;

    const items = await PetInventoryItem.find(filter)
      .populate('storeId', 'name')
      .populate('speciesId', 'name')
      .populate('breedId', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await PetInventoryItem.countDocuments(filter);

    res.json({
      success: true,
      data: {
        items,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Admin list all listings error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const adminRemoveListing = async (req, res) => {
  try {
    const { id } = req.params;
    
    const item = await PetInventoryItem.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ 
        success: false, 
        message: 'Listing not found' 
      });
    }

    res.json({
      success: true,
      message: 'Listing removed successfully'
    });
  } catch (error) {
    console.error('Admin remove listing error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const adminListStoreNameChangeRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = {};
    
    if (status) filter.status = status;

    const requests = await StoreNameChangeRequest.find(filter)
      .populate('userId', 'name email')
      .populate('storeId', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await StoreNameChangeRequest.countDocuments(filter);

    res.json({
      success: true,
      data: {
        requests,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (e) {
    console.error('Admin list store name change requests error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const adminDecideStoreNameChangeRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, notes } = req.body; // decision: 'approved' or 'rejected'

    const request = await StoreNameChangeRequest.findById(id);
    if (!request) {
      return res.status(404).json({ 
        success: false, 
        message: 'Request not found' 
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'Request already processed' 
      });
    }

    request.status = decision;
    request.decidedAt = new Date();
    request.decidedBy = req.user._id;
    request.reason = notes;
    await request.save();

    // If approved, update the store name
    if (decision === 'approved') {
      await User.findByIdAndUpdate(
        request.userId,
        { storeName: request.requestedStoreName }
      );
    }

    res.json({
      success: true,
      message: `Store name change request ${decision} successfully`,
      data: { request }
    });
  } catch (e) {
    console.error('Admin decide store name change request error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const adminSalesReport = async (req, res) => {
  try {
    // This would typically fetch sales report data
    // For now, we'll just return a success response
    res.json({
      success: true,
      data: { message: 'Sales report data' }
    });
  } catch (e) {
    console.error('Admin sales report error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const adminListOrders = async (req, res) => {
  try {
    // This would typically fetch order data
    // For now, we'll just return a success response
    res.json({
      success: true,
      data: { message: 'Order data' }
    });
  } catch (e) {
    console.error('Admin list orders error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const adminTransferOwnership = async (req, res) => {
  try {
    // This would typically handle ownership transfer
    // For now, we'll just return a success response
    res.json({
      success: true,
      message: 'Ownership transfer handled successfully'
    });
  } catch (e) {
    console.error('Admin transfer ownership error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const adminListReservations = async (req, res) => {
  try {
    // This would typically fetch reservation data
    // For now, we'll just return a success response
    res.json({
      success: true,
      data: { message: 'Reservation data' }
    });
  } catch (e) {
    console.error('Admin list reservations error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const adminUpdateReservationStatus = async (req, res) => {
  try {
    // This would typically update reservation status
    // For now, we'll just return a success response
    res.json({
      success: true,
      message: 'Reservation status updated successfully'
    });
  } catch (e) {
    console.error('Admin update reservation status error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  adminListShops,
  adminUpdateShopStatus,
  adminListAllListings,
  adminRemoveListing,
  adminListStoreNameChangeRequests,
  adminDecideStoreNameChangeRequest,
  adminSalesReport,
  adminListOrders,
  adminTransferOwnership,
  adminListReservations,
  adminUpdateReservationStatus
};