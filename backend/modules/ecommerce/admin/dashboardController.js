const Product = require('../models/Product');
const ProductCategory = require('../models/ProductCategory');
const Order = require('../models/Order');
const ProductReview = require('../models/ProductReview');
const User = require('../../../core/models/User');

/**
 * ADMIN: Dashboard Overview
 * Admins monitor and view statistics (no product creation)
 */

/**
 * Get overall dashboard statistics
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));
    
    const [
      totalProducts,
      activeProducts,
      totalCategories,
      totalOrders,
      recentOrders,
      totalRevenue,
      pendingOrders,
      totalCustomers,
      lowStockProducts
    ] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ status: 'active' }),
      ProductCategory.countDocuments({ isActive: true }),
      Order.countDocuments({ createdAt: { $gte: startDate } }),
      Order.countDocuments({ 
        createdAt: { $gte: startDate },
        status: { $in: ['pending', 'confirmed', 'processing'] }
      }),
      Order.aggregate([
        { 
          $match: { 
            'payment.status': 'completed',
            createdAt: { $gte: startDate }
          } 
        },
        { $group: { _id: null, total: { $sum: '$pricing.total' } } }
      ]),
      Order.countDocuments({ status: 'pending' }),
      User.countDocuments({ role: 'user' }),
      Product.countDocuments({
        $expr: { $lte: ['$stock', '$lowStockThreshold'] },
        status: 'active'
      })
    ]);
    
    res.json({
      success: true,
      data: {
        products: {
          total: totalProducts,
          active: activeProducts,
          lowStock: lowStockProducts
        },
        categories: {
          total: totalCategories
        },
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          recent: recentOrders
        },
        revenue: {
          total: totalRevenue[0]?.total || 0,
          period: `${period} days`
        },
        customers: {
          total: totalCustomers
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get sales analytics
 */
exports.getSalesAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    
    const matchQuery = { 'payment.status': 'completed' };
    
    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }
    
    // Group by format
    let dateFormat;
    if (groupBy === 'day') {
      dateFormat = '%Y-%m-%d';
    } else if (groupBy === 'month') {
      dateFormat = '%Y-%m';
    } else {
      dateFormat = '%Y-%W'; // week
    }
    
    const salesData = await Order.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$pricing.total' },
          avgOrderValue: { $avg: '$pricing.total' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      success: true,
      data: salesData
    });
  } catch (error) {
    console.error('Get sales analytics error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get top selling products
 */
exports.getTopSellingProducts = async (req, res) => {
  try {
    const { limit = 10, period = '30' } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));
    
    const topProducts = await Product.find({
      'analytics.purchases': { $gt: 0 }
    })
      .sort('-analytics.purchases -analytics.revenue')
      .limit(parseInt(limit))
      .select('name slug images analytics basePrice salePrice')
      .populate('category', 'name');
    
    res.json({
      success: true,
      data: topProducts
    });
  } catch (error) {
    console.error('Get top selling products error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get category performance
 */
exports.getCategoryPerformance = async (req, res) => {
  try {
    const categories = await ProductCategory.find({ level: 0, isActive: true })
      .select('name productCount');
    
    const categoryStats = await Promise.all(
      categories.map(async (category) => {
        const products = await Product.find({ 
          category: category._id,
          status: 'active'
        });
        
        const totalRevenue = products.reduce((sum, p) => sum + (p.analytics.revenue || 0), 0);
        const totalPurchases = products.reduce((sum, p) => sum + (p.analytics.purchases || 0), 0);
        
        return {
          category: category.name,
          productCount: category.productCount,
          totalRevenue,
          totalPurchases,
          avgRevenuePerProduct: category.productCount > 0 ? totalRevenue / category.productCount : 0
        };
      })
    );
    
    res.json({
      success: true,
      data: categoryStats.sort((a, b) => b.totalRevenue - a.totalRevenue)
    });
  } catch (error) {
    console.error('Get category performance error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get inventory report
 */
exports.getInventoryReport = async (req, res) => {
  try {
    const { status, lowStock } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (lowStock === 'true') {
      query.$expr = { $lte: ['$stock', '$lowStockThreshold'] };
    }
    
    const products = await Product.find(query)
      .select('name sku stock reserved lowStockThreshold category status')
      .populate('category', 'name')
      .sort('stock');
    
    const summary = {
      totalProducts: products.length,
      lowStockItems: products.filter(p => p.stock <= p.lowStockThreshold).length,
      outOfStock: products.filter(p => p.stock === 0).length,
      totalValue: products.reduce((sum, p) => sum + (p.stock * (p.costPrice || 0)), 0)
    };
    
    res.json({
      success: true,
      data: {
        summary,
        products
      }
    });
  } catch (error) {
    console.error('Get inventory report error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get order fulfillment metrics
 */
exports.getOrderFulfillmentMetrics = async (req, res) => {
  try {
    const { period = '30' } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));
    
    const orders = await Order.find({
      createdAt: { $gte: startDate }
    }).select('status createdAt shipping.shippedAt shipping.deliveredAt');
    
    // Calculate metrics
    const totalOrders = orders.length;
    const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
    const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
    
    // Average fulfillment time (order to delivery)
    const deliveredWithDates = orders.filter(o => 
      o.status === 'delivered' && o.shipping.deliveredAt
    );
    
    const avgFulfillmentTime = deliveredWithDates.length > 0
      ? deliveredWithDates.reduce((sum, order) => {
          const time = order.shipping.deliveredAt - order.createdAt;
          return sum + time;
        }, 0) / deliveredWithDates.length / (1000 * 60 * 60 * 24) // Convert to days
      : 0;
    
    // Average shipping time (shipped to delivered)
    const shippedWithDates = orders.filter(o =>
      o.status === 'delivered' && o.shipping.shippedAt && o.shipping.deliveredAt
    );
    
    const avgShippingTime = shippedWithDates.length > 0
      ? shippedWithDates.reduce((sum, order) => {
          const time = order.shipping.deliveredAt - order.shipping.shippedAt;
          return sum + time;
        }, 0) / shippedWithDates.length / (1000 * 60 * 60 * 24)
      : 0;
    
    res.json({
      success: true,
      data: {
        totalOrders,
        deliveredOrders,
        cancelledOrders,
        fulfillmentRate: totalOrders > 0 ? (deliveredOrders / totalOrders * 100).toFixed(2) : 0,
        cancellationRate: totalOrders > 0 ? (cancelledOrders / totalOrders * 100).toFixed(2) : 0,
        avgFulfillmentTime: avgFulfillmentTime.toFixed(2) + ' days',
        avgShippingTime: avgShippingTime.toFixed(2) + ' days'
      }
    });
  } catch (error) {
    console.error('Get fulfillment metrics error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get customer insights
 */
exports.getCustomerInsights = async (req, res) => {
  try {
    const { period = '30' } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));
    
    const [
      topCustomers,
      newCustomers,
      repeatCustomers
    ] = await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: '$customer',
            totalOrders: { $sum: 1 },
            totalSpent: { $sum: '$pricing.total' }
          }
        },
        { $sort: { totalSpent: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'customer'
          }
        },
        { $unwind: '$customer' },
        {
          $project: {
            name: '$customer.name',
            email: '$customer.email',
            totalOrders: 1,
            totalSpent: 1
          }
        }
      ]),
      User.countDocuments({
        role: 'user',
        createdAt: { $gte: startDate }
      }),
      Order.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: '$customer', orderCount: { $sum: 1 } } },
        { $match: { orderCount: { $gt: 1 } } },
        { $count: 'repeatCustomers' }
      ])
    ]);
    
    res.json({
      success: true,
      data: {
        topCustomers,
        newCustomers,
        repeatCustomers: repeatCustomers[0]?.repeatCustomers || 0
      }
    });
  } catch (error) {
    console.error('Get customer insights error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get review statistics
 */
exports.getReviewStats = async (req, res) => {
  try {
    const [
      totalReviews,
      avgRating,
      ratingDistribution,
      recentReviews,
      reportedReviews
    ] = await Promise.all([
      ProductReview.countDocuments({ status: 'approved' }),
      ProductReview.aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: null, avgRating: { $avg: '$rating.overall' } } }
      ]),
      ProductReview.aggregate([
        { $match: { status: 'approved' } },
        {
          $group: {
            _id: '$rating.overall',
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: -1 } }
      ]),
      ProductReview.find({ status: 'approved' })
        .sort('-createdAt')
        .limit(10)
        .populate('user', 'name')
        .populate('product', 'name images'),
      ProductReview.countDocuments({ status: 'reported' })
    ]);
    
    res.json({
      success: true,
      data: {
        totalReviews,
        avgRating: avgRating[0]?.avgRating || 0,
        ratingDistribution,
        recentReviews,
        reportedReviews
      }
    });
  } catch (error) {
    console.error('Get review stats error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get reported content (reviews, etc.)
 */
exports.getReportedContent = async (req, res) => {
  try {
    const reportedReviews = await ProductReview.find({ 
      status: 'reported'
    })
      .populate('user', 'name email')
      .populate('product', 'name')
      .sort('-createdAt');
    
    res.json({
      success: true,
      data: {
        reviews: reportedReviews
      }
    });
  } catch (error) {
    console.error('Get reported content error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Export sales report
 */
exports.exportSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;
    
    const matchQuery = { 'payment.status': 'completed' };
    
    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }
    
    const orders = await Order.find(matchQuery)
      .populate('customer', 'name email phone')
      .populate('items.product', 'name sku')
      .sort('-createdAt');
    
    const reportData = orders.map(order => ({
      orderNumber: order.orderNumber,
      date: order.createdAt,
      customer: order.customerDetails.name,
      email: order.customerDetails.email,
      items: order.items.length,
      subtotal: order.pricing.subtotal,
      discount: order.pricing.discount,
      tax: order.pricing.tax,
      shipping: order.pricing.shipping,
      total: order.pricing.total,
      paymentMethod: order.payment.method,
      status: order.status
    }));
    
    res.json({
      success: true,
      data: reportData,
      summary: {
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, o) => sum + o.pricing.total, 0),
        avgOrderValue: orders.length > 0 
          ? orders.reduce((sum, o) => sum + o.pricing.total, 0) / orders.length 
          : 0
      }
    });
  } catch (error) {
    console.error('Export sales report error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
