const { Product, Cart, Order } = require('../../models/Ecommerce');

// PRODUCTS MANAGEMENT

// Get all products with filters
const listProducts = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 20, isPharmacy = false } = req.query;
    const skip = (page - 1) * limit;

    const query = { isActive: true };

    if (category) query.category = category;
    if (isPharmacy === 'true') query.isPharmacy = true;
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
    console.error('Error listing products:', error);
    res.status(500).json({ success: false, message: 'Error listing products', error: error.message });
  }
};

// Create product
const createProduct = async (req, res) => {
  try {
    const { name, description, category, price, costPrice, images, stock, specifications, petTypes, isPharmacy } = req.body;

    const product = new Product({
      name,
      description,
      category,
      price,
      costPrice,
      images,
      stock,
      specifications,
      petTypes,
      isPharmacy,
      storageId: req.user?.storeId || req.user?._id
    });

    await product.save();

    res.status(201).json({
      success: true,
      data: { product },
      message: 'Product created successfully'
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ success: false, message: 'Error creating product', error: error.message });
  }
};

// Get product by ID
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, data: { product } });
  } catch (error) {
    console.error('Error getting product:', error);
    res.status(500).json({ success: false, message: 'Error getting product', error: error.message });
  }
};

// Update product
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const product = await Product.findByIdAndUpdate(id, updates, { new: true });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({
      success: true,
      data: { product },
      message: 'Product updated successfully'
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ success: false, message: 'Error updating product', error: error.message });
  }
};

// Delete product
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({
      success: true,
      data: { product },
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ success: false, message: 'Error deleting product', error: error.message });
  }
};

// INVENTORY MANAGEMENT

// Update stock
const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { current, reserved, reorderLevel } = req.body;

    const product = await Product.findByIdAndUpdate(
      id,
      {
        stock: {
          current: current !== undefined ? current : undefined,
          reserved: reserved !== undefined ? reserved : undefined,
          reorderLevel: reorderLevel !== undefined ? reorderLevel : undefined
        }
      },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({
      success: true,
      data: { product },
      message: 'Stock updated successfully'
    });
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ success: false, message: 'Error updating stock', error: error.message });
  }
};

// ORDERS MANAGEMENT

// Get all orders
const listOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const query = { isActive: true };
    if (status) query.shippingStatus = status;

    const orders = await Order.find(query)
      .populate('userId', 'name email phone')
      .populate('items.productId', 'name price')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments(query);

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
    console.error('Error listing orders:', error);
    res.status(500).json({ success: false, message: 'Error listing orders', error: error.message });
  }
};

// Get order by ID
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('userId', 'name email phone')
      .populate('items.productId');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, data: { order } });
  } catch (error) {
    console.error('Error getting order:', error);
    res.status(500).json({ success: false, message: 'Error getting order', error: error.message });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { shippingStatus, paymentStatus, notes } = req.body;

    const order = await Order.findByIdAndUpdate(
      id,
      {
        shippingStatus: shippingStatus || undefined,
        paymentStatus: paymentStatus || undefined,
        $push: {
          timeline: {
            status: shippingStatus || paymentStatus,
            notes: notes || 'Status updated'
          }
        }
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({
      success: true,
      data: { order },
      message: 'Order status updated successfully'
    });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ success: false, message: 'Error updating order', error: error.message });
  }
};

// PHARMACY MANAGEMENT
module.exports = {
  // Products
  listProducts,
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
  // Inventory
  updateStock,
  // Orders
  listOrders,
  getOrderById,
  updateOrderStatus
};
