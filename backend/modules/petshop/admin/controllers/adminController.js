const PetShop = require('../../manager/models/PetShop');
const PetInventoryItem = require('../../manager/models/PetInventoryItem');
const StoreNameChangeRequest = require('../models/StoreNameChangeRequest');
const User = require('../../../../core/models/User');
const PetReservation = require('../../user/models/PetReservation');

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
      .populate('requestedBy', 'name email')
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
    request.reviewedAt = new Date();
    request.reviewedBy = req.user._id;
    request.reviewNotes = notes;
    await request.save();

    // If approved, update the store name
    if (decision === 'approved') {
      await User.findByIdAndUpdate(
        request.requestedBy,
        { storeName: request.requestedName }
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

const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      data: { user },
      message: 'User role updated successfully'
    });
  } catch (e) {
    console.error('Update user role error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createAnnouncement = async (req, res) => {
  try {
    // This would typically use a shared Announcement model
    // For now, we'll just return a success response
    res.json({
      success: true,
      message: 'Announcement created successfully'
    });
  } catch (e) {
    console.error('Create announcement error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getAdvancedAnalytics = async (req, res) => {
  try {
    // This would typically fetch advanced analytics data
    // For now, we'll just return a success response
    res.json({
      success: true,
      data: { message: 'Advanced analytics data' }
    });
  } catch (e) {
    console.error('Get advanced analytics error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Admin Analytics Functions
const getAdminAnalyticsSummary = async (req, res) => {
  try {
    const [
      totalInventory,
      inShop,
      forSale,
      sold,
      totalReservations
    ] = await Promise.all([
      PetInventoryItem.countDocuments({ isActive: true }),
      PetInventoryItem.countDocuments({ isActive: true, status: 'in_petshop' }),
      PetInventoryItem.countDocuments({ isActive: true, status: 'available_for_sale' }),
      PetInventoryItem.countDocuments({ isActive: true, status: 'sold' }),
      PetReservation.countDocuments({})
    ]);
    
    res.json({ 
      success: true, 
      data: { 
        totalInventory, 
        inShop, 
        forSale, 
        sold, 
        totalReservations 
      } 
    });
  } catch (e) {
    console.error('PetShop admin summary error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getAdminSpeciesBreakdown = async (req, res) => {
  try {
    const breakdown = await PetInventoryItem.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: { speciesId: '$speciesId', status: '$status' }, count: { $sum: 1 } } },
      { $group: { _id: '$_id.speciesId', counts: { $push: { status: '$_id.status', count: '$count' } }, total: { $sum: '$count' } } },
      { $project: { speciesId: '$_id', counts: 1, total: 1, _id: 0 } },
      { $sort: { total: -1 } }
    ]);
    
    res.json({ success: true, data: breakdown });
  } catch (e) {
    console.error('PetShop admin species breakdown error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getAdminSalesSeries = async (req, res) => {
  try {
    const days = Number(req.query.days || 14);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const series = await PetInventoryItem.aggregate([
      { $match: { isActive: true, status: 'sold', soldAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$soldAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({ success: true, data: series });
  } catch (e) {
    console.error('PetShop admin sales series error:', e);
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
  updateUserRole,
  createAnnouncement,
  getAdvancedAnalytics,
  getAdminAnalyticsSummary,
  getAdminSpeciesBreakdown,
  getAdminSalesSeries
};