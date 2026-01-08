const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Address = require('../models/Address');
const Coupon = require('../models/Coupon');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

/**
 * Create Razorpay order for online payment
 */
exports.createPaymentOrder = async (req, res) => {
  try {
    const { addressId } = req.body;
    
    // Get cart
    const cart = await Cart.findOne({ user: req.user._id, isActive: true })
      .populate('items.product');
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }
    
    // Validate address
    const address = await Address.findOne({ _id: addressId, user: req.user._id });
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }
    
    // Validate stock for all items
    for (let item of cart.items) {
      if (!item.product.canPurchase(item.quantity)) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.product.name}`,
          product: item.product.name
        });
      }
    }
    
    // Calculate final amount (convert to paise)
    const amount = Math.round(cart.summary.total * 100);
    
    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `order_${Date.now()}_${req.user._id}`,
      notes: {
        userId: req.user._id.toString(),
        addressId: addressId.toString()
      }
    });
    
    res.json({
      success: true,
      data: {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID
      }
    });
  } catch (error) {
    console.error('Create payment order error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Place order (for both COD and Online payment)
 */
exports.placeOrder = async (req, res) => {
  try {
    const {
      addressId,
      paymentMethod,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      customerNote
    } = req.body;
    
    // Validate payment method
    if (!['cod', 'online'].includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: 'Invalid payment method' });
    }
    
    // Get cart
    const cart = await Cart.findOne({ user: req.user._id, isActive: true })
      .populate('items.product');
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }
    
    // Validate address
    const address = await Address.findOne({ _id: addressId, user: req.user._id });
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }
    
    // Verify payment signature for online payment
    if (paymentMethod === 'online') {
      const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');
      
      if (generatedSignature !== razorpaySignature) {
        return res.status(400).json({ success: false, message: 'Payment verification failed' });
      }
    }
    
    // Validate stock for all items
    for (let item of cart.items) {
      if (!item.product.canPurchase(item.quantity)) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.product.name}`,
          product: item.product.name
        });
      }
    }
    
    // Prepare order items
    const orderItems = cart.items.map(item => ({
      product: item.product._id,
      productSnapshot: {
        name: item.product.name,
        image: item.product.images[0]?.url,
        sku: item.product.sku
      },
      variant: item.variant,
      quantity: item.quantity,
      price: item.price,
      discount: item.discount,
      tax: 0, // Calculate tax if needed
      total: item.total,
      status: 'pending'
    }));
    
    // Create order
    const order = new Order({
      customer: req.user._id,
      customerDetails: {
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone
      },
      items: orderItems,
      pricing: {
        subtotal: cart.summary.subtotal,
        discount: cart.summary.discount,
        couponDiscount: cart.appliedCoupon?.discountAmount || 0,
        tax: cart.summary.tax,
        shipping: cart.summary.shipping,
        total: cart.summary.total
      },
      coupon: cart.appliedCoupon ? {
        code: cart.appliedCoupon.code,
        discount: cart.appliedCoupon.discountAmount,
        couponId: cart.appliedCoupon.couponId
      } : undefined,
      shippingAddress: {
        fullName: address.fullName,
        phone: address.phone,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2,
        landmark: address.landmark,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        country: address.country,
        addressType: address.addressType
      },
      payment: {
        method: paymentMethod,
        status: paymentMethod === 'online' ? 'completed' : 'pending',
        razorpay: paymentMethod === 'online' ? {
          orderId: razorpayOrderId,
          paymentId: razorpayPaymentId,
          signature: razorpaySignature
        } : undefined,
        paidAt: paymentMethod === 'online' ? new Date() : undefined
      },
      customerNote,
      status: 'pending',
      statusHistory: [{
        status: 'pending',
        note: 'Order placed successfully',
        timestamp: new Date()
      }],
      source: 'web'
    });
    
    await order.save();
    
    // Update product stock and analytics
    for (let item of cart.items) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: {
          stock: -item.quantity,
          reserved: -item.quantity,
          'analytics.purchases': 1,
          'analytics.revenue': item.total
        }
      });
    }
    
    // Update coupon usage if applied
    if (cart.appliedCoupon) {
      const coupon = await Coupon.findById(cart.appliedCoupon.couponId);
      if (coupon) {
        coupon.incrementUsage(req.user._id);
        await coupon.save();
      }
    }
    
    // Mark address as used
    await address.markAsUsed();
    
    // Clear cart
    cart.items = [];
    cart.appliedCoupon = undefined;
    cart.summary = {
      subtotal: 0,
      discount: 0,
      tax: 0,
      shipping: 0,
      total: 0
    };
    await cart.save();
    
    // Populate order for response
    await order.populate('items.product', 'name slug images');
    
    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: order
    });
  } catch (error) {
    console.error('Place order error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get user's orders
 */
exports.getMyOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const query = { customer: req.user._id };
    
    if (status) {
      query.status = status;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('items.product', 'name slug images')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
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
    
    const order = await Order.findOne({
      _id: orderId,
      customer: req.user._id
    }).populate('items.product', 'name slug images');
    
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
 * Cancel order
 */
exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    
    const order = await Order.findOne({
      _id: orderId,
      customer: req.user._id
    });
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    // Check if order can be cancelled
    if (['delivered', 'cancelled', 'returned'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled in current status'
      });
    }
    
    // Update order status
    order.status = 'cancelled';
    order.cancellation = {
      reason,
      cancelledBy: req.user._id,
      cancelledAt: new Date(),
      refundStatus: order.payment.status === 'completed' ? 'pending' : 'not_required'
    };
    
    order.statusHistory.push({
      status: 'cancelled',
      note: `Order cancelled by customer. Reason: ${reason}`,
      updatedBy: req.user._id,
      timestamp: new Date()
    });
    
    // Restore product stock
    for (let item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { 
          stock: item.quantity,
          'analytics.purchases': -1
        }
      });
    }
    
    await order.save();
    
    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Request return
 */
exports.requestReturn = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    
    const order = await Order.findOne({
      _id: orderId,
      customer: req.user._id
    });
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    if (order.status !== 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Only delivered orders can be returned'
      });
    }
    
    // Check if return window is still open (7 days from delivery)
    const returnWindow = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
    if (Date.now() - order.shipping.deliveredAt.getTime() > returnWindow) {
      return res.status(400).json({
        success: false,
        message: 'Return window has expired (7 days from delivery)'
      });
    }
    
    order.return = {
      requested: true,
      reason,
      requestedAt: new Date(),
      status: 'requested'
    };
    
    order.statusHistory.push({
      status: 'return_requested',
      note: `Return requested by customer. Reason: ${reason}`,
      updatedBy: req.user._id,
      timestamp: new Date()
    });
    
    await order.save();
    
    res.json({
      success: true,
      message: 'Return request submitted successfully',
      data: order
    });
  } catch (error) {
    console.error('Request return error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Track order
 */
exports.trackOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findOne({
      _id: orderId,
      customer: req.user._id
    }).select('orderNumber status statusHistory shipping');
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    res.json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        status: order.status,
        trackingNumber: order.shipping.trackingNumber,
        carrier: order.shipping.carrier,
        estimatedDelivery: order.shipping.estimatedDelivery,
        timeline: order.statusHistory
      }
    });
  } catch (error) {
    console.error('Track order error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
