const PurchaseOrder = require('../models/PurchaseOrder');
const petshopBlockchainService = require('../../core/services/petshopBlockchainService');
const PetInventoryItem = require('../models/PetInventoryItem');
const User = require('../../../core/models/User');
const { getStoreFilter } = require('../../../core/utils/storeFilter');
const { generateStoreId } = require('../../../core/utils/storeIdGenerator');
const logger = require('winston');
const { validationResult } = require('express-validator');

// Log controller actions with user context and operation details
const logAction = (req, action, data = {}) => {
  const userInfo = req.user ? `${req.user._id} (${req.user.role})` : 'unauthenticated';
  logger.info({
    action,
    user: userInfo,
    ...data,
    timestamp: new Date().toISOString()
  });
};

// Purchase Orders
const createPurchaseOrder = async (req, res) => {
  logAction(req, 'create_purchase_order', { 
    items: req.body.items?.length || 0,
    total: req.body.total
  });
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });

    const orderNumber = await PurchaseOrder.generateOrderNumber();
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    const subtotal = items.reduce((sum, it) => sum + (Number(it.quantity || 0) * Number(it.unitCost || 0)), 0);
    const tax = Number(req.body.tax || 0);
    const total = subtotal + tax;

    const po = await PurchaseOrder.create({
      orderNumber,
      storeId: req.user.storeId,
      storeName: req.user.storeName,
      createdBy: req.user._id,
      status: 'draft',
      items,
      subtotal,
      tax,
      total,
      notes: req.body.notes || ''
    });
    // Blockchain logging: order_created event
    try {
      await petshopBlockchainService.addBlock('order_created', {
        orderId: po._id,
        orderNumber: po.orderNumber,
        createdBy: req.user._id,
        storeId: req.user.storeId || null,
        total: po.total,
        timestamp: new Date(),
      });
    } catch (err) {
      console.warn('Blockchain logging failed for order_created:', err.message);
    }
    res.status(201).json({ success: true, message: 'Purchase order created', data: { order: po } });
  } catch (e) {
    console.error('Create purchase order error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const listPurchaseOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const storeFilter = getStoreFilter(req.user);
    const filter = { ...storeFilter };
    if (status) filter.status = status;
    const orders = await PurchaseOrder.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    const total = await PurchaseOrder.countDocuments(filter);
    res.json({ success: true, data: { orders, pagination: { current: parseInt(page), pages: Math.ceil(total / limit), total } } });
  } catch (e) {
    console.error('List purchase orders error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getPurchaseOrderById = async (req, res) => {
  try {
    const po = await PurchaseOrder.findOne({ _id: req.params.id, ...getStoreFilter(req.user) });
    if (!po) return res.status(404).json({ success: false, message: 'Purchase order not found' });
    res.json({ success: true, data: { order: po } });
  } catch (e) {
    console.error('Get purchase order error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updatePurchaseOrder = async (req, res) => {
  try {
    const po = await PurchaseOrder.findOne({ _id: req.params.id, ...getStoreFilter(req.user) });
    if (!po) return res.status(404).json({ success: false, message: 'Purchase order not found' });
    if (po.status !== 'draft') return res.status(400).json({ success: false, message: 'Only draft orders can be updated' });

    const items = Array.isArray(req.body.items) ? req.body.items : po.items;
    const subtotal = items.reduce((sum, it) => sum + (Number(it.quantity || 0) * Number(it.unitCost || 0)), 0);
    const tax = Number(req.body.tax ?? po.tax ?? 0);
    const total = subtotal + tax;

    po.items = items;
    po.subtotal = subtotal;
    po.tax = tax;
    po.total = total;
    po.notes = req.body.notes ?? po.notes;
    await po.save();
    // Blockchain logging: order_updated event
    try {
      await petshopBlockchainService.addBlock('order_updated', {
        orderId: po._id,
        updatedBy: req.user._id,
        storeId: req.user.storeId || null,
        total: po.total,
        updateFields: Object.keys(req.body),
        timestamp: new Date(),
      });
    } catch (err) {
      console.warn('Blockchain logging failed for order_updated:', err.message);
    }
    res.json({ success: true, message: 'Purchase order updated', data: { order: po } });
  } catch (e) {
    console.error('Update purchase order error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const submitPurchaseOrder = async (req, res) => {
  try {
    const po = await PurchaseOrder.findOne({ _id: req.params.id, ...getStoreFilter(req.user) });
    if (!po) return res.status(404).json({ success: false, message: 'Purchase order not found' });
    if (po.status !== 'draft') return res.status(400).json({ success: false, message: 'Only draft orders can be submitted' });
    po.status = 'submitted';
    await po.save();
    // Blockchain logging: order_submitted event
    try {
      await petshopBlockchainService.addBlock('order_submitted', {
        orderId: po._id,
        submittedBy: req.user._id,
        storeId: req.user.storeId || null,
        total: po.total,
        timestamp: new Date(),
      });
    } catch (err) {
      console.warn('Blockchain logging failed for order_submitted:', err.message);
    }
    res.json({ success: true, message: 'Purchase order submitted', data: { order: po } });
  } catch (e) {
    console.error('Submit purchase order error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const generatePurchaseOrderInvoice = async (req, res) => {
  try {
    const po = await PurchaseOrder.findOne({ _id: req.params.id, ...getStoreFilter(req.user) });
    if (!po) return res.status(404).json({ success: false, message: 'Purchase order not found' });
    // Return raw PO data; frontend will format/print as invoice
    res.json({ success: true, data: { order: po } });
  } catch (e) {
    console.error('Invoice error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Receive items: create inventory entries for each quantity in items
const receivePurchaseOrder = async (req, res) => {
  try {
    const po = await PurchaseOrder.findOne({ _id: req.params.id, ...getStoreFilter(req.user) });
    if (!po) return res.status(404).json({ success: false, message: 'Purchase order not found' });
    if (!['submitted', 'draft'].includes(po.status)) return res.status(400).json({ success: false, message: 'Only submitted/draft orders can be received' });

    const created = [];
    for (const item of po.items) {
      const qty = Number(item.quantity || 0);
      for (let i = 0; i < qty; i++) {
        const inv = await PetInventoryItem.create({
          storeId: po.storeId,
          storeName: po.storeName,
          createdBy: req.user._id,
          categoryId: item.categoryId,
          speciesId: item.speciesId,
          breedId: item.breedId,
          gender: item.gender || 'Unknown',
          age: item.age || 0,
          ageUnit: item.ageUnit || 'months',
          unitCost: item.unitCost || 0,
          status: 'in_petshop',
          purchaseOrderId: po._id,
          notes: item.notes || ''
        });
        created.push(inv);
      }
      item.receivedCount = qty;
    }

    po.status = 'received';
    await po.save();
    // Blockchain logging: order_received event
    try {
      await petshopBlockchainService.addBlock('order_received', {
        orderId: po._id,
        receivedBy: req.user._id,
        storeId: req.user.storeId || null,
        receivedCount: created.length,
        timestamp: new Date(),
      });
    } catch (err) {
      console.warn('Blockchain logging failed for order_received:', err.message);
    }
    res.json({ success: true, message: 'Items received into inventory', data: { received: created.length } });
  } catch (e) {
    console.error('Receive PO error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  createPurchaseOrder,
  listPurchaseOrders,
  getPurchaseOrderById,
  updatePurchaseOrder,
  submitPurchaseOrder,
  generatePurchaseOrderInvoice,
  receivePurchaseOrder
};