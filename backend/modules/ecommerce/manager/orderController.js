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
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { 'items.seller': req.user.id };
    
    if (status) query.status = status;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .populate('items.product', 'name images')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const count = await Order.countDocuments(query);

    res.json({
      success: true,
      data: orders,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit)
      }
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
      .populate('user', 'name email phone')
      .populate('items.product', 'name images pricing')
      .populate('shippingAddress');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if manager owns any items in this order
    const hasItems = order.items.some(
      item => item.seller?.toString() === req.user.id
    );

    if (!hasItems) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
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
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    
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

    // Check if manager owns any items in this order
    const hasItems = order.items.some(
      item => item.seller?.toString() === req.user.id
    );

    if (!hasItems) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    order.status = status;
    
    if (status === 'delivered') {
      order.deliveredAt = new Date();
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

module.exports = exports;
