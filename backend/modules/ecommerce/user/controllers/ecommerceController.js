const { Product, Cart, Order } = require('../../models/Ecommerce');

// BROWSING PRODUCTS

// Get all products (public)
const getProducts = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 12, isPharmacy = false, petType } = req.query;
    const skip = (page - 1) * limit;

    const query = { isActive: true };

    if (category) query.category = category;
    if (isPharmacy === 'true') query.isPharmacy = true;
    if (petType) query.petTypes = { $in: [petType] };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting products:', error);
    res.status(500).json({ success: false, message: 'Error fetching products', error: error.message });
  }
};

// Get product details
const getProductDetails = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Get similar products
    const similar = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
      isActive: true
    }).limit(5);

    res.json({
      success: true,
      data: {
        product,
        similarProducts: similar
      }
    });
  } catch (error) {
    console.error('Error getting product details:', error);
    res.status(500).json({ success: false, message: 'Error fetching product', error: error.message });
  }
};

// SHOPPING CART

// Add to cart
const addToCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, quantity = 1 } = req.body;

    // Verify product exists and has stock
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.stock.current < quantity) {
      return res.status(400).json({ success: false, message: 'Insufficient stock' });
    }

    // Get or create cart
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    // Check if product already in cart
    const existingItem = cart.items.find(item => item.productId.toString() === productId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        productId,
        quantity,
        price: product.price
      });
    }

    await cart.save();
    await cart.populate('items.productId', 'name price images');

    res.json({
      success: true,
      data: { cart },
      message: 'Product added to cart'
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ success: false, message: 'Error adding to cart', error: error.message });
  }
};

// Get cart
const getCart = async (req, res) => {
  try {
    const userId = req.user._id;

    const cart = await Cart.findOne({ userId }).populate('items.productId', 'name price images stock');

    if (!cart) {
      return res.json({
        success: true,
        data: { cart: { items: [] } }
      });
    }

    res.json({ success: true, data: { cart } });
  } catch (error) {
    console.error('Error getting cart:', error);
    res.status(500).json({ success: false, message: 'Error fetching cart', error: error.message });
  }
};

// Update cart item quantity
const updateCartItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, quantity } = req.body;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const item = cart.items.find(item => item.productId.toString() === productId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not in cart' });
    }

    if (quantity <= 0) {
      cart.items = cart.items.filter(item => item.productId.toString() !== productId);
    } else {
      item.quantity = quantity;
    }

    await cart.save();
    await cart.populate('items.productId');

    res.json({ success: true, data: { cart }, message: 'Cart updated' });
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({ success: false, message: 'Error updating cart', error: error.message });
  }
};

// Remove from cart
const removeFromCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    cart.items = cart.items.filter(item => item.productId.toString() !== productId);
    await cart.save();

    res.json({ success: true, data: { cart }, message: 'Item removed from cart' });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ success: false, message: 'Error removing from cart', error: error.message });
  }
};

// Clear cart
const clearCart = async (req, res) => {
  try {
    const userId = req.user._id;

    await Cart.findOneAndUpdate({ userId }, { items: [] });

    res.json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ success: false, message: 'Error clearing cart', error: error.message });
  }
};

// CHECKOUT & ORDERS

// Create order from cart
const createOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { shippingAddress, billingAddress, shippingMethod = 'delivery', paymentMethod = 'razorpay', notes } = req.body;

    // Get cart
    const cart = await Cart.findOne({ userId }).populate('items.productId');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const cartItem of cart.items) {
      const product = cartItem.productId;
      const itemTotal = product.price * cartItem.quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: product._id,
        quantity: cartItem.quantity,
        unitPrice: product.price,
        totalPrice: itemTotal
      });

      // Update stock
      product.stock.current -= cartItem.quantity;
      product.stock.reserved += cartItem.quantity;
      await product.save();
    }

    // Calculate tax and shipping
    const tax = subtotal * 0.18; // 18% GST
    const shippingCost = shippingMethod === 'pickup' ? 0 : 50;
    const totalAmount = subtotal + tax + shippingCost;

    // Create order
    const order = new Order({
      orderNumber: `ORD-${Date.now()}`,
      userId,
      items: orderItems,
      subtotal,
      tax,
      shippingCost,
      totalAmount,
      shippingAddress,
      billingAddress,
      shippingMethod,
      paymentMethod,
      notes,
      timeline: [
        {
          status: 'pending',
          notes: 'Order created'
        }
      ]
    });

    await order.save();

    // Clear cart
    await Cart.findOneAndUpdate({ userId }, { items: [] });

    res.status(201).json({
      success: true,
      data: { order },
      message: 'Order created successfully'
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, message: 'Error creating order', error: error.message });
  }
};

// Get user's orders
const getMyOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ userId, isActive: true })
      .populate('items.productId', 'name price images')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments({ userId, isActive: true });

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, message: 'Error fetching orders', error: error.message });
  }
};

// Get order details
const getOrderDetails = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.productId');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    res.json({ success: true, data: { order } });
  } catch (error) {
    console.error('Error getting order details:', error);
    res.status(500).json({ success: false, message: 'Error fetching order', error: error.message });
  }
};

module.exports = {
  // Browsing
  getProducts,
  getProductDetails,
  // Cart
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  // Orders
  createOrder,
  getMyOrders,
  getOrderDetails
};
