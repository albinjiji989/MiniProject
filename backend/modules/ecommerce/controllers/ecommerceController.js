const { validationResult } = require('express-validator');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const User = require('../../../core/models/User');
const UserDetails = require('../../../models/UserDetails');
const { getStoreFilter } = require('../../../utils/storeFilter');

// GET /api/ecommerce/products
const listProducts = async (req, res) => {
  try {
    const { category, isActive, page = 1, limit = 10 } = req.query;
    const filter = { ...getStoreFilter(req.user) };
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const products = await Product.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/ecommerce/products
const createProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    }

    const productData = {
      ...req.body,
      createdBy: req.user._id,
      storeId: req.user.storeId,
      storeName: req.user.storeName
    };
    const product = new Product(productData);
    await product.save();
    await product.populate('createdBy', 'name email');

    res.status(201).json({ success: true, message: 'Product created successfully', data: { product } });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ success: false, message: 'Server error during product creation' });
  }
};

// GET /api/ecommerce/orders
const listOrders = async (req, res) => {
  try {
    const { status, paymentStatus, page = 1, limit = 10 } = req.query;
    const filter = { ...getStoreFilter(req.user) };
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    const orders = await Order.find(filter)
      .populate('items.product', 'name price images')
      .populate('processedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  listProducts,
  createProduct,
  listOrders,
  // public listing
  async publicListProducts(req, res) {
    try {
      const { category, q, page = 1, limit = 12 } = req.query;
      const filter = {};
      if (category) filter.category = category;
      if (q) filter.name = { $regex: q, $options: 'i' };
      const products = await Product.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
      const total = await Product.countDocuments(filter);
      res.json({ success: true, data: { products, pagination: { current: parseInt(page), pages: Math.ceil(total / limit), total } } });
    } catch (e) {
      console.error('Public list products error:', e);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },
  async publicGetProduct(req, res) {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
      res.json({ success: true, data: { product } });
    } catch (e) {
      console.error('Public get product error:', e);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },
  async listMyOrders(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const orders = await Order.find({ processedBy: req.user.id })
        .populate('items.product', 'name price images')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
      const total = await Order.countDocuments({ processedBy: req.user.id });
      res.json({ success: true, data: { orders, pagination: { current: parseInt(page), pages: Math.ceil(total / limit), total } } });
    } catch (e) {
      console.error('List my orders error:', e);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },
  async analyticsSummary(req, res) {
    try {
      const storeFilter = req.user.storeId ? { storeId: req.user.storeId } : {};
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [totalProducts, totalOrders, monthOrders, revenueAgg] = await Promise.all([
        Product.countDocuments(storeFilter),
        Order.countDocuments(storeFilter),
        Order.countDocuments({ ...storeFilter, createdAt: { $gte: startOfMonth } }),
        Order.aggregate([
          { $match: storeFilter },
          { $group: { _id: null, revenue: { $sum: '$totalAmount' } } }
        ])
      ]);

      const totalRevenue = revenueAgg?.[0]?.revenue || 0;
      res.json({ success: true, data: { totalProducts, totalOrders, totalRevenue, monthOrders } });
    } catch (e) {
      console.error('Analytics summary error:', e);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },
  async analyticsSalesSeries(req, res) {
    try {
      const storeFilter = req.user.storeId ? { storeId: req.user.storeId } : {};
      const days = parseInt(req.query.days || '14');
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const series = await Order.aggregate([
        { $match: { ...storeFilter, createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, total: { $sum: '$totalAmount' }, orders: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]);
      res.json({ success: true, data: { series } });
    } catch (e) {
      console.error('Analytics series error:', e);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },
  // Workers Management (for ecommerce admins)
  async createWorker(req, res) {
    try {
      if (!(req.user.role === 'ecommerce_admin' || req.user.role === 'super_admin')) {
        return res.status(403).json({ success: false, message: 'Only ecommerce admins can create workers' });
      }
      const { name, email, phone, password } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
      }
      const existing = await User.findOne({ email });
      if (existing) return res.status(400).json({ success: false, message: 'Email already in use' });
      const user = new User({ name, email, phone, password, role: 'ecommerce_worker', assignedModule: 'ecommerce', isActive: true });
      await user.save();
      await UserDetails.findOneAndUpdate(
        { userId: user._id },
        {
          userId: user._id,
          assignedModule: 'ecommerce',
          storeId: req.user.storeId,
          storeName: req.user.storeName,
          storeLocation: req.user.storeLocation
        },
        { upsert: true, new: true }
      );
      res.status(201).json({ success: true, message: 'Worker created', data: { userId: user._id } });
    } catch (e) {
      console.error('Create worker error:', e);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },
  async listWorkers(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const details = await UserDetails.find({ assignedModule: 'ecommerce', storeId: req.user.storeId }).select('userId');
      const userIds = details.map(d => d.userId);
      const workers = await User.find({ _id: { $in: userIds }, role: 'ecommerce_worker' })
        .select('-password')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });
      const total = await User.countDocuments({ _id: { $in: userIds }, role: 'ecommerce_worker' });
      res.json({ success: true, data: { workers, pagination: { current: parseInt(page), pages: Math.ceil(total / limit), total } } });
    } catch (e) {
      console.error('List workers error:', e);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },
  async updateWorker(req, res) {
    try {
      if (!(req.user.role === 'ecommerce_admin' || req.user.role === 'super_admin')) {
        return res.status(403).json({ success: false, message: 'Only ecommerce admins can update workers' });
      }
      const { name, phone, isActive } = req.body;
      const user = await User.findById(req.params.id);
      if (!user || user.role !== 'ecommerce_worker') return res.status(404).json({ success: false, message: 'Worker not found' });
      if (typeof name === 'string') user.name = name;
      if (typeof phone === 'string') user.phone = phone;
      if (typeof isActive === 'boolean') user.isActive = isActive;
      await user.save();
      res.json({ success: true, message: 'Worker updated' });
    } catch (e) {
      console.error('Update worker error:', e);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },
  async deleteWorker(req, res) {
    try {
      if (!(req.user.role === 'ecommerce_admin' || req.user.role === 'super_admin')) {
        return res.status(403).json({ success: false, message: 'Only ecommerce admins can remove workers' });
      }
      const user = await User.findById(req.params.id);
      if (!user || user.role !== 'ecommerce_worker') return res.status(404).json({ success: false, message: 'Worker not found' });
      user.isActive = false;
      await user.save();
      res.json({ success: true, message: 'Worker deactivated' });
    } catch (e) {
      console.error('Delete worker error:', e);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },
  // cart
  async getCart(req, res) {
    try {
      const cart = await Cart.findOne({ user: req.user.id }).populate('items.product', 'name price images sku');
      res.json({ success: true, data: { cart: cart || { user: req.user.id, items: [] } } });
    } catch (e) {
      console.error('Get cart error:', e);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },
  async addToCart(req, res) {
    try {
      const { productId, quantity = 1 } = req.body;
      const product = await Product.findById(productId);
      if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
      if (quantity < 1) return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });

      let cart = await Cart.findOne({ user: req.user.id });
      if (!cart) cart = new Cart({ user: req.user.id, items: [] });

      const existing = cart.items.find(i => String(i.product) === String(product._id));
      if (existing) {
        existing.quantity += quantity;
      } else {
        cart.items.push({ product: product._id, quantity, priceAtAdd: product.price, storeId: product.storeId, storeName: product.storeName });
      }
      await cart.save();
      await cart.populate('items.product', 'name price images sku');
      res.json({ success: true, message: 'Added to cart', data: { cart } });
    } catch (e) {
      console.error('Add to cart error:', e);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },
  async updateCartItem(req, res) {
    try {
      const { itemId } = req.params;
      const { quantity } = req.body;
      const cart = await Cart.findOne({ user: req.user.id });
      if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });
      const item = cart.items.id(itemId);
      if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
      if (quantity < 1) return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
      item.quantity = quantity;
      await cart.save();
      await cart.populate('items.product', 'name price images sku');
      res.json({ success: true, message: 'Cart updated', data: { cart } });
    } catch (e) {
      console.error('Update cart item error:', e);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },
  async removeCartItem(req, res) {
    try {
      const { itemId } = req.params;
      const cart = await Cart.findOne({ user: req.user.id });
      if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });
      const item = cart.items.id(itemId);
      if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
      item.deleteOne();
      await cart.save();
      await cart.populate('items.product', 'name price images sku');
      res.json({ success: true, message: 'Item removed', data: { cart } });
    } catch (e) {
      console.error('Remove cart item error:', e);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },
  async checkout(req, res) {
    try {
      const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
      if (!cart || cart.items.length === 0) return res.status(400).json({ success: false, message: 'Cart is empty' });
      // Split by storeId to ensure multi-tenant orders
      const byStore = cart.items.reduce((acc, item) => {
        const key = item.storeId || 'global';
        acc[key] = acc[key] || [];
        acc[key].push(item);
        return acc;
      }, {});

      const created = [];
      for (const [storeId, items] of Object.entries(byStore)) {
        const totalAmount = items.reduce((sum, it) => sum + (it.quantity * (it.product.price || it.priceAtAdd)), 0);
        const order = new Order({
          items: items.map(it => ({ product: it.product._id, quantity: it.quantity, price: it.product.price || it.priceAtAdd })),
          totalAmount,
          storeId: storeId === 'global' ? undefined : storeId,
          storeName: items[0]?.storeName
        });
        await order.save();
        created.push(order);
      }

      // Clear cart after creating orders
      cart.items = [];
      await cart.save();

      res.json({ success: true, message: 'Order placed', data: { orders: created } });
    } catch (e) {
      console.error('Checkout error:', e);
      res.status(500).json({ success: false, message: 'Server error during checkout' });
    }
  }
};


