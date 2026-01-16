const Order = require('../models/Order');
const Product = require('../models/Product');

/**
 * Manager Order Controller
 */

// Get all orders for manager's store
exports.getAllOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'shippingAddress.fullName': { $regex: search, $options: 'i' } }
      ];
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    
    const orders = await Order.find(query)
      .populate('customer', 'name email phone')
      .populate('items.product', 'name images')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const count = await Order.countDocuments(query);

    // Get statistics
    const stats = await Order.aggregate([
      { $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$pricing.total' },
        pendingOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        confirmedOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
        },
        shippedOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'shipped'] }, 1, 0] }
        },
        deliveredOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
        }
      }}
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit)
      },
      stats: stats[0] || {}
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
};

// Get single order
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('items.product', 'name images pricing')
      .populate('shippingAddress');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order',
      error: error.message
    });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const validStatuses = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const order = await Order.findById(id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update status
    order.status = status;
    order.statusHistory.push({
      status,
      note: note || `Order status updated to ${status}`,
      updatedBy: req.user.id,
      timestamp: new Date()
    });
    
    // Update shipping dates
    if (status === 'shipped' && !order.shipping.shippedAt) {
      order.shipping.shippedAt = new Date();
    }
    if (status === 'delivered' && !order.shipping.deliveredAt) {
      order.shipping.deliveredAt = new Date();
    }

    await order.save();

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order status',
      error: error.message
    });
  }
};

// Get dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const sellerId = req.user.id;

    // Total products
    const totalProducts = await Product.countDocuments({ seller: sellerId });

    // Active products
    const activeProducts = await Product.countDocuments({ 
      seller: sellerId, 
      status: 'active' 
    });

    // Total orders
    const totalOrders = await Order.countDocuments({ 
      'items.seller': sellerId 
    });

    // Pending orders
    const pendingOrders = await Order.countDocuments({ 
      'items.seller': sellerId,
      status: 'pending'
    });

    // Total revenue
    const revenueData = await Order.aggregate([
      { $match: { 'items.seller': sellerId, status: 'delivered' } },
      { $unwind: '$items' },
      { $match: { 'items.seller': sellerId } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$items.total' }
        }
      }
    ]);

    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    // Average rating
    const products = await Product.find({ seller: sellerId });
    const totalRating = products.reduce((sum, p) => sum + (p.ratings?.average || 0), 0);
    const averageRating = products.length > 0 ? totalRating / products.length : 0;

    res.json({
      success: true,
      data: {
        totalProducts,
        activeProducts,
        totalOrders,
        pendingOrders,
        totalRevenue,
        averageRating
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats',
      error: error.message
    });
  }
};

// Add tracking information
exports.addTrackingInfo = async (req, res) => {
  try {
    const { id } = req.params;
    const { carrier, trackingNumber, estimatedDelivery } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.shipping.carrier = carrier;
    order.shipping.trackingNumber = trackingNumber;
    if (estimatedDelivery) {
      order.shipping.estimatedDelivery = new Date(estimatedDelivery);
    }

    await order.save();

    res.json({
      success: true,
      message: 'Tracking information added successfully',
      data: order
    });
  } catch (error) {
    console.error('Error adding tracking info:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding tracking information',
      error: error.message
    });
  }
};

module.exports = exports;
