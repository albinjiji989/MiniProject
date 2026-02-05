const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const paymentService = require('../services/paymentService');

/**
 * User Order Controller with Razorpay Integration
 */

// Get user's orders
exports.getUserOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = { customer: req.user.id };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('items.product', 'name slug images')
      .sort({ createdAt: -1 })
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

// Get order details
exports.getOrderDetails = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      customer: req.user.id
    })
      .populate('items.product', 'name slug images pricing')
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

// Create order
exports.createOrder = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod } = req.body;

    // Get user's cart
    const cart = await Cart.findOne({ user: req.user.id })
      .populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // Verify stock availability
    for (const item of cart.items) {
      if (!item.product.canPurchase(item.quantity)) {
        return res.status(400).json({
          success: false,
          message: `${item.product.name} is out of stock`
        });
      }
    }

    // Calculate totals
    const items = cart.items.map(item => ({
      product: item.product._id,
      seller: item.product.seller,
      quantity: item.quantity,
      price: item.product.pricing.salePrice || item.product.pricing.basePrice,
      total: (item.product.pricing.salePrice || item.product.pricing.basePrice) * item.quantity
    }));

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.18; // 18% tax
    const shippingFee = subtotal >= 499 ? 0 : 50;
    const total = subtotal + tax + shippingFee;

    // Create order
    const order = new Order({
      user: req.user.id,
      items,
      shippingAddress,
      paymentMethod,
      subtotal,
      tax,
      shippingFee,
      total,
      status: 'pending'
    });

    await order.save();

    // Update product inventory
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: {
          'inventory.stock': -item.quantity,
          'inventory.reserved': item.quantity,
          'analytics.purchases': 1
        }
      });
    }

    // Clear cart
    cart.items = [];
    await cart.save();

    await order.populate('items.product', 'name slug images');

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message
    });
  }
};

// Cancel order
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      customer: req.user.id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled'
      });
    }

    order.status = 'cancelled';
    order.cancellation = {
      reason: req.body.reason || 'Customer request',
      cancelledBy: req.user.id,
      cancelledAt: new Date()
    };
    await order.save();

    // Restore inventory
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: {
          'inventory.stock': item.quantity,
          'inventory.reserved': -item.quantity
        }
      });
    }

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling order',
      error: error.message
    });
  }
};

module.exports = exports;


// Create payment order (Razorpay)
exports.createPaymentOrder = async (req, res) => {
  try {
    const { items, shippingAddress, amount } = req.body;

    console.log('Creating payment order:', { amount, userId: req.user.id });

    // Create Razorpay order
    const orderResult = await paymentService.createOrder(amount, 'INR', {
      userId: req.user.id,
      itemCount: items.length
    });

    res.json({
      success: true,
      message: 'Payment order created successfully',
      data: {
        orderId: orderResult.order.id,
        amount: orderResult.order.amount,
        currency: orderResult.order.currency,
        key: process.env.RAZORPAY_KEY_ID
      }
    });
  } catch (error) {
    console.error('Error creating payment order:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating payment order',
      error: error.message
    });
  }
};

// Verify payment and create order
exports.verifyPaymentAndCreateOrder = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      items,
      shippingAddress,
      paymentMethod,
      amount
    } = req.body;

    console.log('Verifying payment:', { razorpay_order_id, razorpay_payment_id });

    // Verify payment signature
    const isValid = paymentService.verifyPayment(
      razorpay_signature,
      razorpay_order_id,
      razorpay_payment_id
    );

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Verify stock availability
    for (const item of items) {
      const product = await Product.findById(item.product._id || item.product);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.product.name || item.product}`
        });
      }

      const availableStock = product.inventory.stock - (product.inventory.reserved || 0);
      if (product.inventory.trackInventory && !product.inventory.allowBackorder && availableStock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `${product.name} is out of stock`
        });
      }
    }

    // Calculate totals
    const orderItems = items.map(item => ({
      product: item.product._id || item.product,
      quantity: item.quantity,
      price: item.price,
      total: item.total,
      tax: 0,
      discount: 0
    }));

    const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.18; // 18% GST
    const shippingFee = subtotal >= 500 ? 0 : 50;
    const total = subtotal + tax + shippingFee;

    // Create order
    const order = new Order({
      customer: req.user.id,
      orderNumber: `ORD${Date.now()}`,
      items: orderItems,
      shippingAddress: {
        fullName: shippingAddress.name || req.user.name,
        phone: shippingAddress.phone || req.user.phone,
        addressLine1: shippingAddress.street,
        city: shippingAddress.city,
        state: shippingAddress.state,
        pincode: shippingAddress.pincode,
        country: shippingAddress.country || 'India'
      },
      pricing: {
        subtotal,
        tax,
        shipping: shippingFee,
        total
      },
      payment: {
        method: 'online',
        status: 'completed',
        transactionId: razorpay_payment_id,
        razorpay: {
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          signature: razorpay_signature
        },
        paidAt: new Date()
      },
      status: 'confirmed',
      statusHistory: [
        {
          status: 'pending',
          note: 'Order placed',
          timestamp: new Date()
        },
        {
          status: 'confirmed',
          note: 'Payment confirmed',
          timestamp: new Date()
        }
      ]
    });

    await order.save();

    // Update product inventory and analytics
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product._id || item.product, {
        $inc: {
          'inventory.stock': -item.quantity,
          'analytics.purchases': 1,
          'analytics.revenue': item.total
        }
      });
      
      // Track purchase for AI/ML recommendations
      try {
        const UserProductInteraction = require('./models/UserProductInteraction');
        await UserProductInteraction.findOneAndUpdate(
          { userId: req.user.id, productId: item.product._id || item.product },
          {
            $inc: { purchased: item.quantity },
            $set: { 
              lastPurchased: new Date(),
              lastPrice: item.price
            }
          },
          { upsert: true, new: true }
        );
      } catch (trackError) {
        console.error('Failed to track purchase for ML:', trackError);
        // Don't fail the order if tracking fails
      }
    }

    // Clear cart if not buy now
    if (!req.body.isBuyNow) {
      await Cart.findOneAndUpdate(
        { user: req.user.id },
        { $set: { items: [] } }
      );
    }

    await order.populate('items.product', 'name slug images pricing');

    res.json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    console.error('Error verifying payment and creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing order',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Create COD order
exports.createCODOrder = async (req, res) => {
  try {
    const { items, shippingAddress } = req.body;

    console.log('Creating COD order:', { userId: req.user.id, itemCount: items.length });

    // Verify stock availability
    for (const item of items) {
      const product = await Product.findById(item.product._id || item.product);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found`
        });
      }

      const availableStock = product.inventory.stock - (product.inventory.reserved || 0);
      if (product.inventory.trackInventory && !product.inventory.allowBackorder && availableStock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `${product.name} is out of stock`
        });
      }
    }

    // Calculate totals
    const orderItems = items.map(item => ({
      product: item.product._id || item.product,
      quantity: item.quantity,
      price: item.price,
      total: item.total,
      tax: 0,
      discount: 0
    }));

    const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.18; // 18% GST
    const shippingFee = subtotal >= 500 ? 0 : 50;
    const total = subtotal + tax + shippingFee;

    // Create order
    const order = new Order({
      customer: req.user.id,
      orderNumber: `ORD${Date.now()}`,
      items: orderItems,
      shippingAddress: {
        fullName: shippingAddress.name || req.user.name,
        phone: shippingAddress.phone || req.user.phone,
        addressLine1: shippingAddress.street,
        city: shippingAddress.city,
        state: shippingAddress.state,
        pincode: shippingAddress.pincode,
        country: shippingAddress.country || 'India'
      },
      pricing: {
        subtotal,
        tax,
        shipping: shippingFee,
        total
      },
      payment: {
        method: 'cod',
        status: 'pending'
      },
      status: 'confirmed',
      statusHistory: [
        {
          status: 'pending',
          note: 'Order placed',
          timestamp: new Date()
        },
        {
          status: 'confirmed',
          note: 'Order confirmed - COD',
          timestamp: new Date()
        }
      ]
    });

    await order.save();

    // Update product inventory
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product._id || item.product, {
        $inc: {
          'inventory.stock': -item.quantity,
          'inventory.reserved': item.quantity,
          'analytics.purchases': 1
        }
      });
      
      // Track purchase for AI/ML recommendations
      try {
        const UserProductInteraction = require('./models/UserProductInteraction');
        await UserProductInteraction.findOneAndUpdate(
          { userId: req.user.id, productId: item.product._id || item.product },
          {
            $inc: { purchased: item.quantity },
            $set: { 
              lastPurchased: new Date(),
              lastPrice: item.price
            }
          },
          { upsert: true, new: true }
        );
      } catch (trackError) {
        console.error('Failed to track purchase for ML:', trackError);
        // Don't fail the order if tracking fails
      }
    }

    // Clear cart if not buy now
    if (!req.body.isBuyNow) {
      await Cart.findOneAndUpdate(
        { user: req.user.id },
        { $set: { items: [] } }
      );
    }

    await order.populate('items.product', 'name slug images pricing');

    res.json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    console.error('Error creating COD order:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
