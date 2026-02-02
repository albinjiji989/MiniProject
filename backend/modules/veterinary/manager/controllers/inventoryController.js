const VeterinaryInventory = require('../../models/VeterinaryInventory');
const VeterinaryInventoryTransaction = require('../../models/VeterinaryInventoryTransaction');

// Get all inventory items
exports.getInventoryItems = async (req, res) => {
  try {
    const { category, status, search, page = 1, limit = 50 } = req.query;
    const storeId = req.user.storeId;

    const filter = { storeId, isActive: true };
    
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { itemName: { $regex: search, $options: 'i' } },
        { itemCode: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [items, total] = await Promise.all([
      VeterinaryInventory.find(filter)
        .sort({ itemName: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('createdBy', 'name')
        .populate('updatedBy', 'name'),
      VeterinaryInventory.countDocuments(filter)
    ]);

    // Get alerts
    const lowStockCount = await VeterinaryInventory.countDocuments({ 
      storeId, 
      isActive: true, 
      lowStockAlert: true 
    });
    const expiryAlertCount = await VeterinaryInventory.countDocuments({ 
      storeId, 
      isActive: true, 
      expiryAlert: true 
    });

    res.json({
      success: true,
      data: {
        items,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit))
        },
        alerts: {
          lowStock: lowStockCount,
          expiringSoon: expiryAlertCount
        }
      }
    });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch inventory' });
  }
};

// Get single inventory item
exports.getInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const storeId = req.user.storeId;

    const item = await VeterinaryInventory.findOne({ _id: id, storeId })
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('lastRestockedBy', 'name email');

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    // Get recent transactions
    const transactions = await VeterinaryInventoryTransaction.find({ 
      inventoryItem: id, 
      storeId 
    })
      .sort({ transactionDate: -1 })
      .limit(10)
      .populate('performedBy', 'name');

    res.json({
      success: true,
      data: { item, transactions }
    });
  } catch (error) {
    console.error('Get inventory item error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch item' });
  }
};

// Create inventory item
exports.createInventoryItem = async (req, res) => {
  try {
    const storeId = req.user.storeId;
    const storeName = req.user.storeName;

    const item = new VeterinaryInventory({
      ...req.body,
      storeId,
      storeName,
      createdBy: req.user.id
    });

    await item.save();

    // Create initial transaction if quantity > 0
    if (item.quantity > 0) {
      await VeterinaryInventoryTransaction.create({
        inventoryItem: item._id,
        itemName: item.itemName,
        transactionType: 'purchase',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalAmount: item.totalValue,
        stockBefore: 0,
        stockAfter: item.quantity,
        referenceType: 'manual',
        notes: 'Initial stock',
        storeId,
        performedBy: req.user.id
      });
    }

    res.status(201).json({
      success: true,
      message: 'Inventory item created successfully',
      data: item
    });
  } catch (error) {
    console.error('Create inventory error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create item' });
  }
};

// Update inventory item
exports.updateInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const storeId = req.user.storeId;

    const item = await VeterinaryInventory.findOne({ _id: id, storeId });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    // Don't allow direct quantity updates (use adjust stock instead)
    delete req.body.quantity;
    delete req.body.totalValue;

    Object.assign(item, req.body);
    item.updatedBy = req.user.id;
    await item.save();

    res.json({
      success: true,
      message: 'Item updated successfully',
      data: item
    });
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({ success: false, message: 'Failed to update item' });
  }
};

// Adjust stock (add/remove)
exports.adjustStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, transactionType, reason, notes, unitPrice } = req.body;
    const storeId = req.user.storeId;

    if (!quantity || quantity === 0) {
      return res.status(400).json({ success: false, message: 'Quantity is required' });
    }

    const item = await VeterinaryInventory.findOne({ _id: id, storeId });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const stockBefore = item.quantity;
    const adjustedQuantity = parseInt(quantity);
    
    // Calculate new stock based on transaction type
    let stockAfter;
    if (['purchase', 'return'].includes(transactionType)) {
      stockAfter = stockBefore + Math.abs(adjustedQuantity);
    } else if (['sale', 'adjustment', 'expired', 'damaged'].includes(transactionType)) {
      stockAfter = stockBefore - Math.abs(adjustedQuantity);
    } else {
      stockAfter = stockBefore + adjustedQuantity;
    }

    if (stockAfter < 0) {
      return res.status(400).json({ success: false, message: 'Insufficient stock' });
    }

    // Update item
    item.quantity = stockAfter;
    if (transactionType === 'purchase') {
      item.lastRestockedAt = new Date();
      item.lastRestockedBy = req.user.id;
    }
    await item.save();

    // Create transaction
    const transaction = await VeterinaryInventoryTransaction.create({
      inventoryItem: item._id,
      itemName: item.itemName,
      transactionType,
      quantity: Math.abs(adjustedQuantity),
      unitPrice: unitPrice || item.unitPrice,
      totalAmount: Math.abs(adjustedQuantity) * (unitPrice || item.unitPrice),
      stockBefore,
      stockAfter,
      referenceType: 'manual',
      reason,
      notes,
      storeId,
      performedBy: req.user.id
    });

    res.json({
      success: true,
      message: 'Stock adjusted successfully',
      data: { item, transaction }
    });
  } catch (error) {
    console.error('Adjust stock error:', error);
    res.status(500).json({ success: false, message: 'Failed to adjust stock' });
  }
};

// Delete inventory item
exports.deleteInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const storeId = req.user.storeId;

    const item = await VeterinaryInventory.findOne({ _id: id, storeId });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    item.isActive = false;
    item.updatedBy = req.user.id;
    await item.save();

    res.json({
      success: true,
      message: 'Item deleted successfully'
    });
  } catch (error) {
    console.error('Delete inventory error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete item' });
  }
};

// Get inventory alerts
exports.getInventoryAlerts = async (req, res) => {
  try {
    const storeId = req.user.storeId;

    const [lowStockItems, expiringItems] = await Promise.all([
      VeterinaryInventory.find({ 
        storeId, 
        isActive: true, 
        lowStockAlert: true 
      }).sort({ quantity: 1 }).limit(20),
      VeterinaryInventory.find({ 
        storeId, 
        isActive: true, 
        expiryAlert: true,
        expiryDate: { $exists: true }
      }).sort({ expiryDate: 1 }).limit(20)
    ]);

    res.json({
      success: true,
      data: {
        lowStock: lowStockItems,
        expiringSoon: expiringItems
      }
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch alerts' });
  }
};

// Get inventory transactions
exports.getInventoryTransactions = async (req, res) => {
  try {
    const { itemId, type, startDate, endDate, page = 1, limit = 50 } = req.query;
    const storeId = req.user.storeId;

    const filter = { storeId };
    
    if (itemId) filter.inventoryItem = itemId;
    if (type) filter.transactionType = type;
    if (startDate || endDate) {
      filter.transactionDate = {};
      if (startDate) filter.transactionDate.$gte = new Date(startDate);
      if (endDate) filter.transactionDate.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [transactions, total] = await Promise.all([
      VeterinaryInventoryTransaction.find(filter)
        .sort({ transactionDate: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('inventoryItem', 'itemName itemCode')
        .populate('performedBy', 'name'),
      VeterinaryInventoryTransaction.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch transactions' });
  }
};

// Get inventory statistics
exports.getInventoryStats = async (req, res) => {
  try {
    const storeId = req.user.storeId;

    const [
      totalItems,
      totalValue,
      lowStockCount,
      outOfStockCount,
      expiringCount,
      categoryStats
    ] = await Promise.all([
      VeterinaryInventory.countDocuments({ storeId, isActive: true }),
      VeterinaryInventory.aggregate([
        { $match: { storeId, isActive: true } },
        { $group: { _id: null, total: { $sum: '$totalValue' } } }
      ]),
      VeterinaryInventory.countDocuments({ storeId, isActive: true, status: 'low_stock' }),
      VeterinaryInventory.countDocuments({ storeId, isActive: true, status: 'out_of_stock' }),
      VeterinaryInventory.countDocuments({ storeId, isActive: true, expiryAlert: true }),
      VeterinaryInventory.aggregate([
        { $match: { storeId, isActive: true } },
        { $group: { 
          _id: '$category', 
          count: { $sum: 1 },
          totalValue: { $sum: '$totalValue' }
        }}
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalItems,
        totalValue: totalValue[0]?.total || 0,
        lowStockCount,
        outOfStockCount,
        expiringCount,
        categoryStats
      }
    });
  } catch (error) {
    console.error('Get inventory stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
  }
};
