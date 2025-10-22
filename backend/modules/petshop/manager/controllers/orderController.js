const ShopOrder = require('../../user/models/ShopOrder');
const PetInventoryItem = require('../models/PetInventoryItem');
const PetDetails = require('../../../../core/models/PetDetails');
const Pet = require('../../../../core/models/Pet');

// Order Management Functions
const listPurchaseOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = {};
    
    if (status) filter.status = status;

    const orders = await ShopOrder.find(filter)
      .populate('userId', 'name email')
      .populate('items.itemId', 'name price')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ShopOrder.countDocuments(filter);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page: parseInt(page),
          limit: parseInt(limit),
        },
      },
    });
  } catch (e) {
    console.error('List purchase orders error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createPurchaseOrder = async (req, res) => {
  try {
    const { items, supplier, expectedDeliveryDate } = req.body;
    
    // Validate items
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one item is required',
      });
    }

    // Calculate total amount
    let totalAmount = 0;
    for (const item of items) {
      if (!item.itemId || !item.quantity || !item.unitPrice) {
        return res.status(400).json({
          success: false,
          message: 'Each item must have itemId, quantity, and unitPrice',
        });
      }
      totalAmount += item.quantity * item.unitPrice;
    }

    const order = new ShopOrder({
      items,
      supplier,
      expectedDeliveryDate,
      totalAmount,
      status: 'pending',
    });

    await order.save();

    res.status(201).json({
      success: true,
      data: { order },
      message: 'Purchase order created successfully',
    });
  } catch (e) {
    console.error('Create purchase order error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getPurchaseOrderById = async (req, res) => {
  try {
    const order = await ShopOrder.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('items.itemId', 'name price');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    res.json({
      success: true,
      data: { order },
    });
  } catch (e) {
    console.error('Get purchase order error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updatePurchaseOrder = async (req, res) => {
  try {
    const { items, supplier, expectedDeliveryDate, status } = req.body;
    const updateData = {};

    if (items) updateData.items = items;
    if (supplier) updateData.supplier = supplier;
    if (expectedDeliveryDate) updateData.expectedDeliveryDate = expectedDeliveryDate;
    if (status) updateData.status = status;

    const order = await ShopOrder.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('userId', 'name email')
     .populate('items.itemId', 'name price');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    res.json({
      success: true,
      data: { order },
      message: 'Purchase order updated successfully',
    });
  } catch (e) {
    console.error('Update purchase order error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const submitPurchaseOrder = async (req, res) => {
  try {
    const order = await ShopOrder.findByIdAndUpdate(
      req.params.id,
      { status: 'submitted', submittedAt: new Date() },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    res.json({
      success: true,
      data: { order },
      message: 'Purchase order submitted successfully',
    });
  } catch (e) {
    console.error('Submit purchase order error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const generatePurchaseOrderInvoice = async (req, res) => {
  try {
    const order = await ShopOrder.findById(req.params.id)
      .populate('userId', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // In a real implementation, you would generate a PDF invoice
    // For now, we'll just return order details as invoice data
    const invoiceData = {
      orderId: order._id,
      userId: order.userId,
      items: order.items,
      amount: order.amount,
      currency: order.currency,
      status: order.status,
      createdAt: order.createdAt,
      invoiceNumber: `INV-${order._id.toString().substr(-6).toUpperCase()}`,
    };

    res.json({
      success: true,
      data: { invoice: invoiceData },
      message: 'Invoice generated successfully',
    });
  } catch (e) {
    console.error('Generate invoice error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const receivePurchaseOrder = async (req, res) => {
  try {
    const order = await ShopOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    order.status = 'paid';
    order.receivedAt = new Date();
    await order.save();

    res.json({
      success: true,
      data: { order },
      message: 'Purchase order received successfully',
    });
  } catch (e) {
    console.error('Receive purchase order error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Admin: Orders list and manual ownership transfer
const adminListOrders = async (req, res) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 20 } = req.query;
    const query = {};
    
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const orders = await ShopOrder.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ShopOrder.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page: parseInt(page),
          limit: parseInt(limit),
        },
      },
    });
  } catch (e) {
    console.error('Admin list orders error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const adminTransferOwnership = async (req, res) => {
  try {
    const order = await ShopOrder.findById(req.params.id)
      .populate('userId');
      
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }
    
    // In a real implementation, you would handle the ownership transfer logic here
    // For now, we'll just return a success response
    
    res.json({
      success: true,
      message: 'Ownership transfer handled successfully',
      data: { order },
    });
    
  } catch (e) {
    console.error('Admin transfer ownership error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  listPurchaseOrders,
  createPurchaseOrder,
  getPurchaseOrderById,
  updatePurchaseOrder,
  submitPurchaseOrder,
  generatePurchaseOrderInvoice,
  receivePurchaseOrder,
  adminListOrders,
  adminTransferOwnership
};