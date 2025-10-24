const PetReservation = require('../../user/models/PetReservation');
const PetShop = require('../models/PetShop');
const PetInventoryItem = require('../models/PetInventoryItem');
const ShopOrder = require('../../user/models/ShopOrder');
const { getStoreFilter } = require('../../../../core/utils/storeFilter');
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

// Manager Dashboard Functions
const getManagerDashboardStats = async (req, res) => {
  try {
    const storeFilter = getStoreFilter(req.user);
    
    // Get basic stats
    const [totalReservations, paidOrders, totalRevenue, pendingDeliveries] = await Promise.all([
      PetReservation.countDocuments({ ...storeFilter }),
      PetReservation.countDocuments({ ...storeFilter, status: { $in: ['paid', 'delivered', 'at_owner'] } }),
      PetReservation.aggregate([
        { $match: { ...storeFilter, status: { $in: ['paid', 'delivered', 'at_owner'] } } },
        { $group: { _id: null, total: { $sum: '$paymentDetails.amount' } } }
      ]),
      PetReservation.countDocuments({ ...storeFilter, status: 'ready_pickup' })
    ]);
    
    // Get gender statistics for inventory items
    const genderStats = await PetInventoryItem.aggregate([
      { $match: { ...storeFilter } },
      {
        $group: {
          _id: '$gender',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Format gender stats
    const genderData = {};
    genderStats.forEach(stat => {
      genderData[stat._id || 'Unknown'] = stat.count;
    });
    
    res.json({
      success: true,
      data: {
        totalReservations,
        paidOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        pendingDeliveries,
        genderStats: genderData
      }
    });
  } catch (err) {
    console.error('Manager dashboard stats error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getManagerOrders = async (req, res) => {
  try {
    const storeFilter = getStoreFilter(req.user);
    const { page = 1, limit = 20, status } = req.query;
    
    const query = { ...storeFilter };
    if (status) query.status = status;
    
    const orders = await PetReservation.find(query)
      .populate('itemId', 'name petCode price images', null, { populate: [{ path: 'imageIds' }] })
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
      
    // Manually populate the virtual 'images' field for each item
    for (const order of orders) {
      if (order.itemId) {
        await order.itemId.populate('images');
      }
    }
    
    const total = await PetReservation.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });
  } catch (err) {
    console.error('Manager orders error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getSalesReport = async (req, res) => {
  try {
    const storeFilter = getStoreFilter(req.user);
    const { startDate, endDate, groupBy = 'day' } = req.query;
    
    const matchStage = {
      ...storeFilter,
      status: { $in: ['paid', 'delivered', 'at_owner'] },
      'paymentDetails.paidAt': {
        $gte: new Date(startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
        $lte: new Date(endDate || new Date())
      }
    };
    
    const groupStage = {
      _id: {
        $dateToString: {
          format: groupBy === 'month' ? '%Y-%m' : '%Y-%m-%d',
          date: '$paymentDetails.paidAt'
        }
      },
      totalSales: { $sum: '$paymentDetails.amount' },
      orderCount: { $sum: 1 },
      avgOrderValue: { $avg: '$paymentDetails.amount' }
    };
    
    const salesData = await PetReservation.aggregate([
      { $match: matchStage },
      { $group: groupStage },
      { $sort: { '_id': 1 } }
    ]);
    
    res.json({
      success: true,
      data: { salesData }
    });
  } catch (err) {
    console.error('Sales report error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const generateInvoice = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const storeFilter = getStoreFilter(req.user);
    
    const reservation = await PetReservation.findOne({
      _id: reservationId,
      ...storeFilter
    })
    .populate('itemId', 'name petCode price images speciesId breedId', null, { populate: [{ path: 'imageIds' }] })
    .populate('userId', 'name email phone address')
    .populate('itemId.speciesId', 'name')
    .populate('itemId.breedId', 'name');
    
    // Manually populate the virtual 'images' field
    if (reservation && reservation.itemId) {
      await reservation.itemId.populate('images');
    }
    
    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }
    
    const invoiceData = {
      invoiceNumber: `INV-${reservation.reservationCode || reservation._id.slice(-6)}`,
      date: new Date(),
      customer: {
        name: reservation.userId.name,
        email: reservation.userId.email,
        phone: reservation.userId.phone
      },
      pet: {
        name: reservation.itemId.name,
        code: reservation.itemId.petCode,
        species: reservation.itemId.speciesId?.name,
        breed: reservation.itemId.breedId?.name
      },
      payment: {
        amount: reservation.paymentDetails.amount,
        method: 'Razorpay',
        transactionId: reservation.paymentDetails.paymentId,
        paidAt: reservation.paymentDetails.paidAt
      },
      delivery: {
        method: reservation.paymentDetails.deliveryMethod,
        address: reservation.paymentDetails.deliveryAddress
      }
    };
    
    res.json({
      success: true,
      data: { invoice: invoiceData }
    });
  } catch (err) {
    console.error('Generate invoice error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const managerDashboard = async (req, res) => {
  logAction(req, 'view_manager_dashboard');
  try {
    // Get the pet shop managed by the current user
    const petShop = await PetShop.findOne({ owner: req.user._id });
    
    if (!petShop) {
      return res.status(404).json({ 
        success: false, 
        message: 'No pet shop found for this manager' 
      });
    }
    
    // Get today's date
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    
    // Get today's reservations
    const todaysReservations = await PetReservation.find({
      itemId: { $in: petShop.pets },
      status: { $in: ['approved', 'paid', 'ready_pickup', 'delivered', 'at_owner'] }
    })
    .populate('userId', 'name email phone')
    .populate('itemId', 'name speciesId breedId');
    
    // Get recent orders
    const recentOrders = await ShopOrder.find({ storeId: petShop.storeId })
      .sort('-createdAt')
      .limit(5)
      .populate('userId', 'name email');
    
    // Get inventory status
    const inventoryStatus = await PetInventoryItem.aggregate([
      { $match: { storeId: petShop.storeId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get revenue data for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const revenueData = await ShopOrder.aggregate([
      {
        $match: {
          storeId: petShop.storeId,
          status: 'paid',
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Prepare dashboard data
    const dashboardData = {
      shop: {
        id: petShop._id,
        name: petShop.name,
        status: petShop.status
      },
      stats: {
        totalReservations: await PetReservation.countDocuments({ itemId: { $in: petShop.pets } }),
        activeReservations: await PetReservation.countDocuments({ 
          itemId: { $in: petShop.pets }, 
          status: { $in: ['approved', 'paid', 'ready_pickup', 'delivered', 'at_owner'] } 
        }),
        totalOrders: await ShopOrder.countDocuments({ storeId: petShop.storeId }),
        totalRevenue: await ShopOrder.aggregate([
          { $match: { storeId: petShop.storeId, status: 'paid' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]).then(result => result[0]?.total || 0),
        inventoryStatus: inventoryStatus.reduce((acc, curr) => ({
          ...acc,
          [curr._id]: curr.count
        }), {})
      },
      todaysReservations,
      recentOrders,
      revenueData
    };
    
    res.status(200).json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Manager dashboard error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

module.exports = {
  getManagerDashboardStats,
  getManagerOrders,
  getSalesReport,
  generateInvoice,
  managerDashboard
};