const Order = require('../models/Order');
const Product = require('../models/Product');

/**
 * MANAGER: Order Fulfillment & Management
 */

/**
 * Get all orders (manager view)
 */
exports.getAllOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      paymentStatus,
      search,
      startDate,
      endDate
    } = req.query;
    
    const query = {};
    
    if (status) query.status = status;
    if (paymentStatus) query['payment.status'] = paymentStatus;
    
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'customerDetails.name': { $regex: search, $options: 'i' } },
        { 'customerDetails.phone': { $regex: search, $options: 'i' } }
      ];
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('customer', 'name email phone')
        .populate('items.product', 'name images')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit)),
      Order.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      data: orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get single order details
 */
exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findById(orderId)
      .populate('customer', 'name email phone')
      .populate('items.product', 'name images sku');
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Update order status
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, note } = req.body;
    
    const validStatuses = [
      'pending', 'confirmed', 'processing', 'packed', 'shipped',
      'out_for_delivery', 'delivered', 'cancelled', 'returned', 'refunded'
    ];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status' 
      });
    }
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    // Update status and add to history
    order.updateStatus(status, note, req.user._id);
    
    // Update timestamps based on status
    if (status === 'shipped') {
      order.shipping.shippedAt = new Date();
    } else if (status === 'delivered') {
      order.shipping.deliveredAt = new Date();
    }
    
    await order.save();
    
    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Confirm order
 */
exports.confirmOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    if (order.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only pending orders can be confirmed' 
      });
    }
    
    order.updateStatus('confirmed', 'Order confirmed by manager', req.user._id);
    await order.save();
    
    res.json({
      success: true,
      message: 'Order confirmed successfully',
      data: order
    });
  } catch (error) {
    console.error('Confirm order error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Mark order as shipped
 */
exports.shipOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { trackingNumber, carrier, estimatedDelivery } = req.body;
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    order.status = 'shipped';
    order.shipping.trackingNumber = trackingNumber;
    order.shipping.carrier = carrier;
    order.shipping.estimatedDelivery = estimatedDelivery;
    order.shipping.shippedAt = new Date();
    
    order.updateStatus('shipped', `Shipped via ${carrier}. Tracking: ${trackingNumber}`, req.user._id);
    
    await order.save();
    
    res.json({
      success: true,
      message: 'Order marked as shipped',
      data: order
    });
  } catch (error) {
    console.error('Ship order error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Mark order as delivered
 */
exports.markDelivered = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { deliveryProof } = req.body;
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    order.status = 'delivered';
    order.shipping.deliveredAt = new Date();
    if (deliveryProof) {
      order.shipping.deliveryProof = deliveryProof;
    }
    
    // Update payment status for COD
    if (order.payment.method === 'cod' && order.payment.status === 'pending') {
      order.payment.status = 'completed';
      order.payment.paidAt = new Date();
    }
    
    order.updateStatus('delivered', 'Order delivered successfully', req.user._id);
    
    await order.save();
    
    res.json({
      success: true,
      message: 'Order marked as delivered',
      data: order
    });
  } catch (error) {
    console.error('Mark delivered error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Process cancellation
 */
exports.processCancellation = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { approveRefund } = req.body;
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    if (order.status !== 'cancelled') {
      return res.status(400).json({ 
        success: false, 
        message: 'Order is not cancelled' 
      });
    }
    
    if (approveRefund && order.payment.status === 'completed') {
      order.payment.status = 'refunded';
      order.payment.refundedAt = new Date();
      order.payment.refundAmount = order.pricing.total;
      
      order.cancellation.refundStatus = 'completed';
      
      order.updateStatus('refunded', 'Refund processed', req.user._id);
    }
    
    await order.save();
    
    res.json({
      success: true,
      message: 'Cancellation processed successfully',
      data: order
    });
  } catch (error) {
    console.error('Process cancellation error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Approve/Reject return request
 */
exports.processReturn = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { action, note } = req.body; // action: 'approve' or 'reject'
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    if (!order.return.requested) {
      return res.status(400).json({ 
        success: false, 
        message: 'No return request found' 
      });
    }
    
    if (action === 'approve') {
      order.return.status = 'approved';
      order.return.approvedAt = new Date();
      order.status = 'returned';
      
      // Restore stock
      for (let item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity }
        });
      }
      
      order.updateStatus('returned', `Return approved. ${note}`, req.user._id);
    } else {
      order.return.status = 'rejected';
      order.updateStatus('delivered', `Return rejected. ${note}`, req.user._id);
    }
    
    await order.save();
    
    res.json({
      success: true,
      message: `Return ${action}d successfully`,
      data: order
    });
  } catch (error) {
    console.error('Process return error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get order statistics
 */
exports.getOrderStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }
    
    const [
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue
    ] = await Promise.all([
      Order.countDocuments(dateFilter),
      Order.countDocuments({ ...dateFilter, status: 'pending' }),
      Order.countDocuments({ ...dateFilter, status: { $in: ['confirmed', 'processing', 'packed'] } }),
      Order.countDocuments({ ...dateFilter, status: { $in: ['shipped', 'out_for_delivery'] } }),
      Order.countDocuments({ ...dateFilter, status: 'delivered' }),
      Order.countDocuments({ ...dateFilter, status: 'cancelled' }),
      Order.aggregate([
        { $match: { ...dateFilter, 'payment.status': 'completed' } },
        { $group: { _id: null, total: { $sum: '$pricing.total' } } }
      ])
    ]);
    
    res.json({
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        totalRevenue: totalRevenue[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get pending orders (need attention)
 */
exports.getPendingOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      status: { $in: ['pending', 'confirmed'] }
    })
      .populate('customer', 'name phone')
      .populate('items.product', 'name')
      .sort('createdAt')
      .limit(50);
    
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Get pending orders error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Add internal note to order
 */
exports.addInternalNote = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { note } = req.body;
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    order.internalNotes = (order.internalNotes || '') + `\n[${new Date().toISOString()}] ${req.user.name}: ${note}`;
    await order.save();
    
    res.json({
      success: true,
      message: 'Note added successfully',
      data: order
    });
  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
