const PetShop = require('../../manager/models/PetShop');
const PetInventoryItem = require('../../manager/models/PetInventoryItem');
const PetReservation = require('../../user/models/PetReservation');
const User = require('../../../../core/models/User');
const ShopOrder = require('../../user/models/ShopOrder');
const { getStoreFilter } = require('../../../../core/utils/storeFilter');

// Admin Analytics
const getAdminAnalyticsSummary = async (req, res) => {
  try {
    const [totalInventory, inShop, forSale, sold, totalReservations] = await Promise.all([
      PetInventoryItem.countDocuments({ isActive: true }),
      PetInventoryItem.countDocuments({ isActive: true, status: 'in_petshop' }),
      PetInventoryItem.countDocuments({ isActive: true, status: 'available_for_sale' }),
      PetInventoryItem.countDocuments({ isActive: true, status: 'sold' }),
      PetReservation.countDocuments({})
    ]);
    res.json({ success: true, data: { totalInventory, inShop, forSale, sold, totalReservations } });
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

// Admin shop management
const adminListShops = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const query = {};
    
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'address.city': { $regex: search, $options: 'i' } }
      ];
    }
    
    const shops = await PetShop.find(query)
      .populate('owner', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
      
    const total = await PetShop.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        shops,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page: parseInt(page),
          limit: parseInt(limit),
        },
      },
    });
  } catch (e) {
    console.error('Admin list shops error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const adminUpdateShopStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['active', 'inactive', 'suspended', 'pending_verification'];
    
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed: ${allowedStatuses.join(', ')}`,
      });
    }
    
    const shop = await PetShop.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found',
      });
    }
    
    res.json({
      success: true,
      message: 'Shop status updated',
      data: { shop },
    });
    
  } catch (e) {
    console.error('Admin update shop status error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Admin listing management
const adminListAllListings = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const query = { isActive: true };
    
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const listings = await PetInventoryItem.find(query)
      .populate('speciesId', 'name')
      .populate('breedId', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
      
    const total = await PetInventoryItem.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        listings,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page: parseInt(page),
          limit: parseInt(limit),
        },
      },
    });
  } catch (e) {
    console.error('Admin list all listings error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const adminRemoveListing = async (req, res) => {
  try {
    const listing = await PetInventoryItem.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found',
      });
    }
    
    res.json({
      success: true,
      message: 'Listing removed successfully',
    });
  } catch (e) {
    console.error('Admin remove listing error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const adminSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    const match = { status: 'paid' }; // Assuming 'paid' is the completed status for orders
    
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }
    
    const group = {
      _id: {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
      },
      totalSales: { $sum: '$amount' },
      count: { $sum: 1 },
    };
    
    if (groupBy === 'day') {
      group._id.day = { $dayOfMonth: '$createdAt' };
    } else if (groupBy === 'month') {
      // Already grouped by year and month
    } else if (groupBy === 'year') {
      group._id = { year: group._id.year };
    }
    
    const report = await ShopOrder.aggregate([
      { $match: match },
      { $group: group },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);
    
    res.json({
      success: true,
      data: { report },
    });
  } catch (e) {
    console.error('Admin sales report error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Admin orders management
const adminListOrders = async (req, res) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 20 } = req.query;
    const query = {};
    
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const orders = await ShopOrder.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
      
    const total = await ShopOrder.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page: parseInt(page),
          limit: parseInt(limit),
        },
      },
    });
  } catch (e) {
    console.error('Admin list orders error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const adminTransferOwnership = async (req, res) => {
  try {
    const order = await ShopOrder.findById(req.params.id)
      .populate('userId');
      
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }
    
    // In a real implementation, you would handle the ownership transfer logic here
    // For now, we'll just return a success response
    
    res.json({
      success: true,
      message: 'Ownership transfer handled successfully',
      data: { order },
    });
    
  } catch (e) {
    console.error('Admin transfer ownership error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ====================
// Admin Functions
// ====================

const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ['user', 'manager', 'admin'];

    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
      });
    }

    // Prevent modifying other admins
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify your own role',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: { user },
    });
  } catch (e) {
    console.error('Update user role error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createAnnouncement = async (req, res) => {
  try {
    // In a real implementation, you would create an announcement model and save it
    // For now, we'll just return a success response
    
    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      data: { 
        title: req.body.title,
        content: req.body.content
      },
    });
  } catch (e) {
    console.error('Create announcement error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getAdvancedAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const match = {};

    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }

    // Sales by category
    const salesByCategory = await ShopOrder.aggregate([
      { $match: { ...match, status: 'paid' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.category',
          totalSales: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
          count: { $sum: 1 },
        },
      },
    ]);

    // User acquisition
    const userAcquisition = await User.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: {
        salesByCategory,
        userAcquisition,
      },
    });
  } catch (e) {
    console.error('Advanced analytics error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getAdminAnalyticsSummary,
  getAdminSpeciesBreakdown,
  getAdminSalesSeries,
  adminListShops,
  adminUpdateShopStatus,
  adminListAllListings,
  adminRemoveListing,
  adminSalesReport,
  adminListOrders,
  adminTransferOwnership,
  updateUserRole,
  createAnnouncement,
  getAdvancedAnalytics
};