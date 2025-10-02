const { validationResult } = require('express-validator');
const crypto = require('crypto');
const PetShop = require('../models/PetShop');
const Pet = require('../../../core/models/Pet');
const PetDetails = require('../../../core/models/PetDetails');
const User = require('../../../core/models/User');
const Review = require('../../../core/models/Review');
const Announcement = require('../../../core/models/Announcement');
const Promotion = require('../../../core/models/Promotion');
const ShopOrder = require('../models/ShopOrder');
const PurchaseOrder = require('../models/PurchaseOrder');
const PetInventoryItem = require('../models/PetInventoryItem');
const PetReservation = require('../models/PetReservation');
const PetPricing = require('../models/PetPricing');
const Wishlist = require('../models/Wishlist');
const logger = require('winston');
const { getStoreFilter } = require('../../../utils/storeFilter');
const { generateStoreId, MODULE_PREFIX } = require('../../../utils/storeIdGenerator');

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

// ===== STORE IDENTITY (Manager self-service) =====
// GET: Return current user's store identity (manager dashboards use this)
const getMyStoreInfo = async (req, res) => {
  try {
    const payload = {
      userId: req.user._id,
      role: req.user.role,
      assignedModule: req.user.assignedModule || null,
      storeId: req.user.storeId || null,
      storeName: req.user.storeName || ''
    }
    return res.json({ success: true, data: payload })
  } catch (e) {
    console.error('Get my store info error:', e)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// PUT: Update store name; if storeId missing, generate one based on module
const updateMyStoreInfo = async (req, res) => {
  try {
    const User = require('../../../core/models/User')
    const { storeName } = req.body
    const user = await User.findById(req.user._id)
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })

    // Generate storeId if missing
    if (!user.storeId) {
      const moduleKey = user.assignedModule || (user.role?.split('_')[0]) || 'petshop'
      try {
        user.storeId = await generateStoreId(moduleKey, [
          { model: User, field: 'storeId' },
        ])
      } catch (genErr) {
        console.warn('StoreId generation failed, defaulting module=petshop:', genErr?.message)
        user.storeId = await generateStoreId('petshop', [ { model: User, field: 'storeId' } ])
      }
    }

    if (typeof storeName === 'string') {
      user.storeName = storeName.trim()
    }
    await user.save()

    return res.json({ success: true, message: 'Store info updated', data: { storeId: user.storeId, storeName: user.storeName } })
  } catch (e) {
    console.error('Update my store info error:', e)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// Bulk publish priced inventory items (manager)
const bulkPublishInventoryItems = async (req, res) => {
  try {
    const { itemIds } = req.body
    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({ success: false, message: 'itemIds array is required' })
    }

    // Fetch items belonging to this store only
    const items = await PetInventoryItem.find({
      _id: { $in: itemIds },
      ...getStoreFilter(req.user),
      isActive: true
    })

    const results = { published: [], skipped: [] }

    for (const item of items) {
      const hasImage = Array.isArray(item.images) && item.images.length > 0
      const price = Number(item.price || 0)
      if (item.status === 'available_for_sale') {
        results.skipped.push({ id: item._id, reason: 'already_published' })
        continue
      }
      if (!price || price <= 0) {
        results.skipped.push({ id: item._id, reason: 'price_not_set' })
        continue
      }
      if (!hasImage) {
        results.skipped.push({ id: item._id, reason: 'no_image' })
        continue
      }
      item.status = 'available_for_sale'
      await item.save()
      results.published.push(item._id)
    }

    return res.json({ success: true, message: 'Bulk publish completed', data: results })
  } catch (e) {
    console.error('Bulk publish inventory items error:', e)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

const listPetShops = async (req, res) => {
  try {
    const { isActive, page = 1, limit = 10 } = req.query;
    const filter = { ...getStoreFilter(req.user) };

// Admin: Orders list and manual ownership transfer
const adminListOrders = async (req, res) => {
  try {
    const { status, storeId } = req.query
    const filter = {}
    if (status) filter.status = status
    if (storeId) filter.storeId = storeId
    const orders = await ShopOrder.find(filter).sort({ createdAt: -1 })
    res.json({ success: true, data: { orders } })
  } catch (e) {
    console.error('Admin list orders error:', e)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

const adminTransferOwnership = async (req, res) => {
  try {
    const order = await ShopOrder.findById(req.params.id)
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' })
    const firstItem = order.items?.[0]
    if (!firstItem?.itemId) return res.status(400).json({ success: false, message: 'Order has no linked item' })
    const item = await PetInventoryItem.findById(firstItem.itemId)
    if (!item) return res.status(404).json({ success: false, message: 'Inventory item not found' })
    if (!order.userId) return res.status(400).json({ success: false, message: 'Order has no userId' })
    if (!(item.speciesId && item.breedId)) return res.status(400).json({ success: false, message: 'Item missing species/breed' })

    const pd = await PetDetails.create({
      speciesId: item.speciesId,
      breedId: item.breedId,
      name: item.name || 'Pet',
      description: item.description || '',
      color: item.color || 'Unknown',
      ageRange: { min: 0, max: 0 },
      weightRange: { min: 0, max: 0, unit: 'kg' },
      typicalLifespan: { min: 0, max: 0, unit: 'years' },
      vaccinationRequirements: [],
      careInstructions: {},
      temperament: [],
      specialNeeds: [],
      createdBy: order.userId,
    })

    const pet = new Pet({
      name: item.name || 'Pet',
      species: item.speciesId,
      breed: item.breedId,
      petDetails: pd._id,
      owner: order.userId,
      gender: item.gender || 'Unknown',
      color: item.color || 'Unknown',
      images: (item.images || []).map(img => ({ url: img.url, caption: img.caption || '', isPrimary: !!img.isPrimary })),
      storeId: item.storeId,
      storeName: item.storeName,
      tags: ['petshop'],
      description: item.description || '',
      createdBy: order.userId,
    })
    await pet.save()
    order.ownershipTransferred = true
    await order.save()
    res.json({ success: true, message: 'Ownership transferred', data: { orderId: order._id, petId: pet._id } })
  } catch (e) {
    console.error('Admin transfer ownership error:', e)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// Health document upload (sets healthCertificateUrl)
const uploadInventoryHealthDoc = async (req, res) => {
  try {
    const item = await PetInventoryItem.findOne({ _id: req.params.id, ...getStoreFilter(req.user) });
    if (!item) return res.status(404).json({ success: false, message: 'Inventory item not found' });
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const url = `/modules/petshop/uploads/${req.file.filename}`;
    item.healthCertificateUrl = url;
    await item.save();
    res.status(201).json({ success: true, message: 'Health document uploaded', data: { url, itemId: item._id } });
  } catch (e) {
    console.error('Upload health doc error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getInventoryItemById = async (req, res) => {
  try {
    const item = await PetInventoryItem.findOne({ _id: req.params.id, ...getStoreFilter(req.user) });
    if (!item) return res.status(404).json({ success: false, message: 'Inventory item not found' });
    res.json({ success: true, data: { item } });
  } catch (e) {
    console.error('Get inventory item error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const petShops = await PetShop.find(filter)
      .populate('createdBy', 'name email')
      .populate('staff.user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await PetShop.countDocuments(filter);
    res.json({ success: true, data: { petShops, pagination: { current: parseInt(page), pages: Math.ceil(total / limit), total } } });
  } catch (error) {
    console.error('Get pet shops error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Admin Analytics
const getAdminAnalyticsSummary = async (req, res) => {
  try {
    const [totalInventory, inShop, forSale, sold, totalReservations] = await Promise.all([
      PetInventoryItem.countDocuments({ isActive: true }),
      PetInventoryItem.countDocuments({ isActive: true, status: 'in_petshop' }),
      PetInventoryItem.countDocuments({ isActive: true, status: 'available_for_sale' }),
      PetInventoryItem.countDocuments({ isActive: true, status: 'sold' }),
      PetReservation.countDocuments({})
    ])
    res.json({ success: true, data: { totalInventory, inShop, forSale, sold, totalReservations } })
  } catch (e) {
    console.error('PetShop admin summary error:', e)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

const getAdminSpeciesBreakdown = async (req, res) => {
  try {
    const breakdown = await PetInventoryItem.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: { speciesId: '$speciesId', status: '$status' }, count: { $sum: 1 } } },
      { $group: { _id: '$_id.speciesId', counts: { $push: { status: '$_id.status', count: '$count' } }, total: { $sum: '$count' } } },
      { $project: { speciesId: '$_id', counts: 1, total: 1, _id: 0 } },
      { $sort: { total: -1 } }
    ])
    res.json({ success: true, data: breakdown })
  } catch (e) {
    console.error('PetShop admin species breakdown error:', e)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

const getAdminSalesSeries = async (req, res) => {
  try {
    const days = Number(req.query.days || 14)
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const series = await PetInventoryItem.aggregate([
      { $match: { isActive: true, status: 'sold', soldAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$soldAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ])
    res.json({ success: true, data: series })
  } catch (e) {
    console.error('PetShop admin sales series error:', e)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

const getPetShopById = async (req, res) => {
  try {
    const petShop = await PetShop.findOne({ _id: req.params.id, ...getStoreFilter(req.user) })
      .populate('createdBy', 'name email')
      .populate('staff.user', 'name email role')
      .populate('pets', 'name species breed age gender images');
    if (!petShop) return res.status(404).json({ success: false, message: 'Pet shop not found' });
    res.json({ success: true, data: { petShop } });
  } catch (error) {
    console.error('Get pet shop error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createPetShop = async (req, res) => {
  logAction(req, 'create_petshop', { 
    name: req.body.name,
    owner: req.body.ownerId 
  });
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });

    const petShopData = {
      ...req.body,
      createdBy: req.user._id,
      storeId: req.user.storeId,
      storeName: req.user.storeName,
      capacity: { ...req.body.capacity, current: 0, available: req.body.capacity.total }
    };
    const petShop = new PetShop(petShopData);
    await petShop.save();
    await petShop.populate('createdBy', 'name email');
    res.status(201).json({ success: true, message: 'Pet shop created successfully', data: { petShop } });
  } catch (error) {
    console.error('Create pet shop error:', error);
    res.status(500).json({ success: false, message: 'Server error during pet shop creation' });
  }
};

const updatePetShop = async (req, res) => {
  logAction(req, 'update_petshop', { 
    petshopId: req.params.id,
    updates: Object.keys(req.body)
  });
  try {
    const petShop = await PetShop.findOne({ _id: req.params.id, ...getStoreFilter(req.user) });
    if (!petShop) return res.status(404).json({ success: false, message: 'Pet shop not found' });

    const updatedPetShop = await PetShop.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('createdBy', 'name email');
    res.json({ success: true, message: 'Pet shop updated successfully', data: { petShop: updatedPetShop } });
  } catch (error) {
    console.error('Update pet shop error:', error);
    res.status(500).json({ success: false, message: 'Server error during pet shop update' });
  }
};

const addPetToPetShop = async (req, res) => {
  logAction(req, 'add_pet_to_petshop', { 
    petshopId: req.params.id,
    petId: req.body.petId
  });
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });

    const { petId } = req.body;
    const petShop = await PetShop.findById(req.params.id);
    if (!petShop) return res.status(404).json({ success: false, message: 'Pet shop not found' });

    if (petShop.capacity.current >= petShop.capacity.total) {
      return res.status(400).json({ success: false, message: 'Pet shop is at full capacity' });
    }

    const pet = await Pet.findById(petId);
    if (!pet) return res.status(404).json({ success: false, message: 'Pet not found' });

    petShop.pets.push(petId);
    petShop.capacity.current += 1;
    petShop.capacity.available = petShop.capacity.total - petShop.capacity.current;
    await petShop.save();

    pet.currentStatus = 'in_petshop';
    pet.lastUpdatedBy = req.user._id;
    await pet.save();

    res.json({ success: true, message: 'Pet added to pet shop successfully', data: { petShop } });
  } catch (error) {
    console.error('Add pet to pet shop error:', error);
    res.status(500).json({ success: false, message: 'Server error during pet addition' });
  }
};

const addProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });

    const petShop = await PetShop.findById(req.params.id);
    if (!petShop) return res.status(404).json({ success: false, message: 'Pet shop not found' });

    petShop.products.push(req.body);
    await petShop.save();

    res.json({ success: true, message: 'Product added successfully', data: { petShop } });
  } catch (error) {
    console.error('Add product error:', error);
    res.status(500).json({ success: false, message: 'Server error during product addition' });
  }
};

const addService = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });

    const petShop = await PetShop.findById(req.params.id);
    if (!petShop) return res.status(404).json({ success: false, message: 'Pet shop not found' });

    petShop.services.push(req.body);
    await petShop.save();

    res.json({ success: true, message: 'Service added successfully', data: { petShop } });
  } catch (error) {
    console.error('Add service error:', error);
    res.status(500).json({ success: false, message: 'Server error during service addition' });
  }
};

const getPetShopStats = async (req, res) => {
  try {
    const storeFilter = getStoreFilter(req.user);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalAnimals, availableForSale, staffMembers, totalProducts, totalServices] = await Promise.all([
      Pet.countDocuments({ ...storeFilter, currentStatus: 'in_petshop' }),
      Pet.countDocuments({ ...storeFilter, currentStatus: 'available_for_sale' }),
      PetShop.aggregate([
        { $match: storeFilter },
        { $unwind: '$staff' },
        { $count: 'count' }
      ]).then(r => r[0]?.count || 0),
      PetShop.aggregate([
        { $match: storeFilter },
        { $project: { productCount: { $size: '$products' } } },
        { $group: { _id: null, total: { $sum: '$productCount' } } }
      ]).then(r => r[0]?.total || 0),
      PetShop.aggregate([
        { $match: storeFilter },
        { $project: { serviceCount: { $size: '$services' } } },
        { $group: { _id: null, total: { $sum: '$serviceCount' } } }
      ]).then(r => r[0]?.total || 0)
    ]);

    res.json({ success: true, data: { totalAnimals, availableForSale, staffMembers, totalProducts, totalServices } });
  } catch (e) {
    console.error('Pet shop stats error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// User dashboard stats (no module permission required)
const getUserPetShopStats = async (req, res) => {
  try {
    // Get user-focused stats that are relevant for pet shopping
    const [
      totalPetShops, 
      availableForSale, 
      myReservations,
      myWishlistItems
    ] = await Promise.all([
      PetShop.countDocuments({ isActive: true }),
      PetInventoryItem.countDocuments({ isActive: true, status: 'available_for_sale' }),
      PetReservation.countDocuments({ userId: req.user._id }),
      Wishlist.countDocuments({ userId: req.user._id })
    ]);

    res.json({ 
      success: true, 
      data: { 
        totalPetShops, 
        availableForSale, 
        myReservations,
        myWishlistItems
      } 
    });
  } catch (e) {
    console.error('User pet shop stats error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const listAnimals = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const storeFilter = getStoreFilter(req.user);
    const animals = await Pet.find({ ...storeFilter, currentStatus: { $in: ['in_petshop', 'available_for_sale'] } })
      .populate('currentOwner', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    const total = await Pet.countDocuments({ ...storeFilter, currentStatus: { $in: ['in_petshop', 'available_for_sale'] } });
    res.json({ success: true, data: { animals, pagination: { current: parseInt(page), pages: Math.ceil(total / limit), total } } });
  } catch (e) {
    console.error('List animals error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
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
    res.json({ success: true, message: 'Items received into inventory', data: { received: created.length } });
  } catch (e) {
    console.error('Receive PO error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Inventory management
const listInventory = async (req, res) => {
  try {
    let { page = 1, limit = 10, status } = req.query;
    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    // Derive store filter, but relax for managers missing storeId (dev-friendly)
    const storeFilter = getStoreFilter(req.user) || {};
    let baseFilter = { ...storeFilter, isActive: true };

    // If filter would block everything (e.g., {_id: null}) or manager has no storeId, relax it
    const isBlockingFilter = Object.prototype.hasOwnProperty.call(baseFilter, '_id') && baseFilter._id === null;
    const isManagerNoStore = (req.user?.role || '').includes('_manager') && !req.user?.storeId;
    if (isBlockingFilter || isManagerNoStore) {
      baseFilter = { isActive: true };
    }

    if (status) baseFilter.status = status;

    // Basic logging to help diagnose
    console.log('Inventory list filter used:', baseFilter);

    const query = PetInventoryItem.find(baseFilter)
      .populate('speciesId', 'name displayName')
      .populate('breedId', 'name')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const [items, total] = await Promise.all([
      query.exec(),
      PetInventoryItem.countDocuments(baseFilter)
    ]);

    res.json({ 
      success: true, 
      data: { 
        items, 
        pagination: { current: page, pages: Math.ceil(total / limit || 1), total } 
      } 
    });
  } catch (e) {
    console.error('List inventory error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateInventoryItem = async (req, res) => {
  try {
    const item = await PetInventoryItem.findOne({ _id: req.params.id, ...getStoreFilter(req.user) });
    if (!item) return res.status(404).json({ success: false, message: 'Inventory item not found' });
    if (req.body.price !== undefined) item.price = req.body.price;
    if (req.body.status) {
      // Guard publishing to site
      if (req.body.status === 'available_for_sale') {
        const effectivePrice = req.body.price !== undefined ? Number(req.body.price) : Number(item.price || 0)
        const hasImage = Array.isArray(item.images) && item.images.length > 0
        if (!effectivePrice || effectivePrice <= 0) {
          return res.status(400).json({ success: false, message: 'Price must be set before releasing to site' })
        }
        if (!hasImage) {
          return res.status(400).json({ success: false, message: 'At least one image is required to release to site' })
        }
      }
      item.status = req.body.status;
      if (req.body.status === 'sold') item.soldAt = new Date();
    }
    if (req.body.buyerId !== undefined) item.buyerId = req.body.buyerId;
    if (req.body.name !== undefined) item.name = req.body.name;
    if (req.body.images !== undefined) item.images = req.body.images;
    // Health & SEO
    if (req.body.healthCertificateUrl !== undefined) item.healthCertificateUrl = req.body.healthCertificateUrl;
    if (req.body.vaccinations !== undefined) item.vaccinations = req.body.vaccinations;
    if (req.body.slug !== undefined) item.slug = req.body.slug;
    if (req.body.metaTitle !== undefined) item.metaTitle = req.body.metaTitle;
    if (req.body.metaDescription !== undefined) item.metaDescription = req.body.metaDescription;
    if (req.body.metaKeywords !== undefined) item.metaKeywords = Array.isArray(req.body.metaKeywords) ? req.body.metaKeywords : String(req.body.metaKeywords || '').split(',').map(s => s.trim()).filter(Boolean);
    await item.save();
    res.json({ success: true, message: 'Inventory item updated', data: { item } });
  } catch (e) {
    console.error('Update inventory item error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getInventoryItemById = async (req, res) => {
  try {
    const item = await PetInventoryItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Inventory item not found' });
    }
    res.json({ success: true, data: { item } });
  } catch (e) {
    console.error('Get inventory item error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteInventoryItem = async (req, res) => {
  try {
    const item = await PetInventoryItem.findOne({ _id: req.params.id, ...getStoreFilter(req.user) });
    if (!item) return res.status(404).json({ success: false, message: 'Inventory item not found' });
    item.isActive = false;
    await item.save();
    res.json({ success: true, message: 'Inventory item archived' });
  } catch (e) {
    console.error('Delete inventory item error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Public listings (no auth)
const listPublicListings = async (req, res) => {
  try {
    const { page = 1, limit = 12, speciesId, breedId, minPrice, maxPrice } = req.query;
    const filter = { isActive: true, status: 'available_for_sale' };
    if (speciesId) filter.speciesId = speciesId;
    if (breedId) filter.breedId = breedId;
    if (minPrice || maxPrice) filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
    const items = await PetInventoryItem.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    const total = await PetInventoryItem.countDocuments(filter);
    res.json({ success: true, data: { items, pagination: { current: parseInt(page), pages: Math.ceil(total / limit), total } } });
  } catch (e) {
    console.error('Public listings error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Public pet shops (no auth required)
const listPublicPetShops = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const filter = { isActive: true };
    
    const petShops = await PetShop.find(filter)
      .select('name address capacity createdAt')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await PetShop.countDocuments(filter);
    res.json({ 
      success: true, 
      data: { 
        petShops, 
        pagination: { 
          current: parseInt(page), 
          pages: Math.ceil(total / limit), 
          total 
        } 
      } 
    });
  } catch (e) {
    console.error('Public pet shops error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getPublicListingById = async (req, res) => {
  try {
    const item = await PetInventoryItem.findOne({ _id: req.params.id, isActive: true })
    if (!item || item.status !== 'available_for_sale') return res.status(404).json({ success: false, message: 'Listing not found' })
    // increment views (non-blocking)
    item.views = (item.views || 0) + 1
    item.save().catch(() => {})
    res.json({ success: true, data: { item } })
  } catch (e) {
    console.error('Get public listing error:', e)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// Image upload handler (multer provides req.file)
const uploadInventoryImage = async (req, res) => {
  try {
    const item = await PetInventoryItem.findOne({ _id: req.params.id, ...getStoreFilter(req.user) });
    if (!item) return res.status(404).json({ success: false, message: 'Inventory item not found' });
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const url = `/modules/petshop/uploads/${req.file.filename}`;
    const img = { url, caption: req.body.caption || '', isPrimary: req.body.isPrimary === 'true' };
    if (img.isPrimary) {
      item.images.forEach(i => i.isPrimary = false);
    }
    item.images.push(img);
    await item.save();
    res.status(201).json({ success: true, message: 'Image uploaded', data: { image: img, itemId: item._id } });
  } catch (e) {
    console.error('Upload inventory image error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Health document upload handler (multer provides req.file)
const uploadInventoryHealthDoc = async (req, res) => {
  try {
    const item = await PetInventoryItem.findOne({ _id: req.params.id, ...getStoreFilter(req.user) });
    if (!item) return res.status(404).json({ success: false, message: 'Inventory item not found' });
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    
    // Save the health document URL
    const healthDocUrl = `/modules/petshop/health-docs/${req.file.filename}`;
    item.healthCertificateUrl = healthDocUrl;
    
    await item.save();
    
    res.status(201).json({ 
      success: true, 
      message: 'Health document uploaded successfully',
      data: { 
        healthCertificateUrl: healthDocUrl,
        itemId: item._id
      }
    });
    
  } catch (e) {
    console.error('Upload health document error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Razorpay integration
const createRazorpayOrder = async (req, res) => {
  logAction(req, 'create_razorpay_order', { 
    amount: req.body.amount,
    currency: req.body.currency
  });
  try {
    const { amount, currency = 'INR', receipt, itemId } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ success: false, message: 'Amount is required (in paise)' });
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) return res.status(500).json({ success: false, message: 'Razorpay keys not configured' });

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ amount, currency, receipt: receipt || `rcpt_${Date.now()}` })
    });
    const data = await response.json();
    if (!response.ok) {
      console.error('Razorpay create order error:', data);
      return res.status(502).json({ success: false, message: 'Razorpay error', error: data });
    }
    // Optionally attach item details to order
    let orderDoc = null;
    let items = [];
    let storeId, storeName;
    if (itemId) {
      const item = await PetInventoryItem.findById(itemId);
      if (item) {
        items = [{ itemId: item._id, name: item.name || '', price: Math.round(Number(item.price || 0)), imageUrl: item.images?.[0]?.url }];
        storeId = item.storeId;
        storeName = item.storeName;
      }
    }
    orderDoc = await ShopOrder.create({
      userId: req.user?._id,
      storeId,
      storeName,
      items,
      amount,
      currency,
      status: 'created',
      razorpay: { orderId: data.id },
      notes: ''
    })

    res.status(201).json({ success: true, data, keyId, orderId: orderDoc._id });
  } catch (e) {
    console.error('Create Razorpay order error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const verifyRazorpaySignature = async (req, res) => {
  logAction(req, 'verify_razorpay_signature', { 
    orderId: req.body.razorpay_order_id,
    paymentId: req.body.razorpay_payment_id
  });
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing Razorpay fields' });
    }
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto.createHmac('sha256', keySecret).update(payload).digest('hex');
    const valid = expected === razorpay_signature;
    if (valid) {
      // Update ShopOrder and mark item as sold if exists
      const order = await ShopOrder.findOne({ 'razorpay.orderId': razorpay_order_id });
      if (order) {
        order.status = 'paid';
        order.razorpay.paymentId = razorpay_payment_id;
        order.razorpay.signature = razorpay_signature;
        await order.save();
        // If linked to an inventory item, mark as sold
        const firstItem = order.items?.[0];
        if (firstItem?.itemId) {
          const item = await PetInventoryItem.findById(firstItem.itemId);
          if (item && item.status !== 'sold') {
            item.status = 'sold';
            item.soldAt = new Date();
            if (req.user?._id) item.buyerId = req.user._id;
            await item.save();
          }
          // Ownership transfer (best-effort): create PetDetails + Pet for buyer
          try {
            if (req.user?._id && item?.speciesId && item?.breedId) {
              const pd = await PetDetails.create({
                speciesId: item.speciesId,
                breedId: item.breedId,
                name: item.name || 'Pet',
                description: item.description || '',
                color: item.color || 'Unknown',
                ageRange: { min: 0, max: 0 },
                weightRange: { min: 0, max: 0, unit: 'kg' },
                typicalLifespan: { min: 0, max: 0, unit: 'years' },
                vaccinationRequirements: [],
                careInstructions: {},
                temperament: [],
                specialNeeds: [],
                createdBy: req.user._id,
              })

              const pet = new Pet({
                name: item.name || 'Pet',
                species: item.speciesId,
                breed: item.breedId,
                petDetails: pd._id,
                owner: req.user._id,
                gender: item.gender || 'Unknown',
                color: item.color || 'Unknown',
                images: (item.images || []).map(img => ({ url: img.url, caption: img.caption || '', isPrimary: !!img.isPrimary })),
                storeId: item.storeId,
                storeName: item.storeName,
                tags: ['petshop'],
                description: item.description || '',
                createdBy: req.user._id,
              })
              await pet.save()
              order.ownershipTransferred = true
              await order.save()
            }
          } catch (ex) {
            console.error('Ownership transfer error:', ex)
          }
        }
      }
    }
    res.json({ success: valid, data: { valid } });
  } catch (e) {
    console.error('Verify Razorpay signature error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Reservations (user auth required)
const createReservation = async (req, res) => {
  logAction(req, 'create_reservation', { 
    petId: req.body.petId,
    startDate: req.body.startDate,
    endDate: req.body.endDate
  });
  try {
    const { itemId, notes } = req.body
    if (!itemId) return res.status(400).json({ success: false, message: 'itemId is required' })
    const item = await PetInventoryItem.findOne({ _id: itemId, isActive: true })
    if (!item || item.status !== 'available_for_sale') {
      return res.status(400).json({ success: false, message: 'Item not available for reservation' })
    }
    const reservation = await PetReservation.create({ itemId, userId: req.user._id, notes: notes || '' })
    res.status(201).json({ success: true, message: 'Reservation created', data: { reservation } })
  } catch (e) {
    console.error('Create reservation error:', e)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

const listMyReservations = async (req, res) => {
  try {
    const reservations = await PetReservation.find({ userId: req.user._id }).sort({ createdAt: -1 })
    res.json({ success: true, data: { reservations } })
  } catch (e) {
    console.error('List reservations error:', e)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

const cancelReservation = async (req, res) => {
  try {
    const r = await PetReservation.findOne({ _id: req.params.id, userId: req.user._id })
    if (!r) return res.status(404).json({ success: false, message: 'Reservation not found' })
    if (r.status !== 'pending') return res.status(400).json({ success: false, message: 'Only pending reservations can be cancelled' })
    r.status = 'cancelled'
    await r.save()
    res.json({ success: true, message: 'Reservation cancelled', data: { reservation: r } })
  } catch (e) {
    console.error('Cancel reservation error:', e)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// Admin reservations management
const adminListReservations = async (req, res) => {
  try {
    const { status, userId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (userId) filter.userId = userId;
    const reservations = await PetReservation.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: { reservations } });
  } catch (e) {
    console.error('Admin list reservations error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const adminUpdateReservationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'cancelled', 'approved', 'completed'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Allowed: ${allowed.join(', ')}` });
    }
    const r = await PetReservation.findById(req.params.id);
    if (!r) return res.status(404).json({ success: false, message: 'Reservation not found' });
    r.status = status;
    await r.save();
    res.json({ success: true, message: 'Reservation status updated', data: { reservation: r } });
  } catch (e) {
    console.error('Admin update reservation status error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Manager reservation management
const managerListReservations = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { ...getStoreFilter(req.user) };
    
    // Only show reservations for items in the manager's store
    const storeItems = await PetInventoryItem.find(filter, '_id');
    filter.itemId = { $in: storeItems.map(item => item._id) };
    
    if (status) filter.status = status;
    
    const reservations = await PetReservation.find(filter)
      .populate('userId', 'name email')
      .populate('itemId', 'name price')
      .sort({ createdAt: -1 });
      
    res.json({ success: true, data: { reservations } });
  } catch (e) {
    console.error('Manager list reservations error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const managerUpdateReservationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['approved', 'completed', 'cancelled'];
    
    if (!allowed.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid status. Allowed: ${allowed.join(', ')}` 
      });
    }
    
    // Find the reservation and verify the item belongs to manager's store
    const reservation = await PetReservation.findById(req.params.id)
      .populate('itemId');
      
    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }
    
    const storeFilter = getStoreFilter(req.user);
    const item = await PetInventoryItem.findOne({
      _id: reservation.itemId,
      ...storeFilter
    });
    
    if (!item) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update this reservation' 
      });
    }
    
    reservation.status = status;
    await reservation.save();
    
    res.json({ 
      success: true, 
      message: 'Reservation status updated', 
      data: { reservation } 
    });
    
  } catch (e) {
    console.error('Manager update reservation status error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Admin shop management
const adminListShops = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const query = {};
    
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'address.city': { $regex: search, $options: 'i' } },
        { 'owner.name': { $regex: search, $options: 'i' } },
      ];
    }
    
    const options = {
      page: parseInt(page, 10),
      limit: Math.min(parseInt(limit, 10), 50),
      sort: { createdAt: -1 },
      populate: 'owner',
    };
    
    const shops = await PetShop.paginate(query, options);
    
    res.json({
      success: true,
      data: {
        shops: shops.docs,
        pagination: {
          total: shops.totalDocs,
          pages: shops.totalPages,
          page: shops.page,
          limit: shops.limit,
        },
      },
    });
  } catch (e) {
    console.error('Admin list shops error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const adminUpdateShopStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['active', 'inactive', 'suspended', 'pending_verification'];
    
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed: ${allowedStatuses.join(', ')}`,
      });
    }
    
    const shop = await PetShop.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found',
      });
    }
    
    res.json({
      success: true,
      message: 'Shop status updated',
      data: { shop },
    });
    
  } catch (e) {
    console.error('Admin update shop status error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Admin listing management
const adminListAllListings = async (req, res) => {
  try {
    const { status, type, search, page = 1, limit = 20 } = req.query;
    const query = {};
    
    if (status) query.status = status;
    if (type) query.type = type;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'shop.name': { $regex: search, $options: 'i' } },
      ];
    }
    
    const options = {
      page: parseInt(page, 10),
      limit: Math.min(parseInt(limit, 10), 50),
      sort: { createdAt: -1 },
      populate: ['shop', 'species', 'breed'],
    };
    
    const listings = await PetInventoryItem.paginate(query, options);
    
    res.json({
      success: true,
      data: {
        listings: listings.docs,
        pagination: {
          total: listings.totalDocs,
          pages: listings.totalPages,
          page: listings.page,
          limit: listings.limit,
        },
      },
    });
  } catch (e) {
    console.error('Admin list all listings error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const adminRemoveListing = async (req, res) => {
  try {
    const listing = await PetInventoryItem.findByIdAndDelete(req.params.id);
    
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found',
      });
    }
    
    res.json({
      success: true,
      message: 'Listing removed successfully',
    });
  } catch (e) {
    console.error('Admin remove listing error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const adminSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    const match = {};
    
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }
    
    const group = {
      _id: {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
      },
      totalSales: { $sum: '$amount' },
      count: { $sum: 1 },
    };
    
    if (groupBy === 'day') {
      group._id.day = { $dayOfMonth: '$createdAt' };
    } else if (groupBy === 'month') {
      // Already grouped by year and month
    } else if (groupBy === 'year') {
      group._id = { year: group._id.year };
    }
    
    const report = await ShopOrder.aggregate([
      { $match: { status: 'completed', ...match } },
      { $group: group },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);
    
    res.json({
      success: true,
      data: { report },
    });
  } catch (e) {
    console.error('Admin sales report error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Admin orders management
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
    
    const options = {
      page: parseInt(page, 10),
      limit: Math.min(parseInt(limit, 10), 50),
      sort: { createdAt: -1 },
      populate: [
        { path: 'userId', select: 'name email' },
        { path: 'items.itemId', select: 'name price' },
      ],
    };
    
    const orders = await ShopOrder.paginate(query, options);
    
    res.json({
      success: true,
      data: {
        orders: orders.docs,
        pagination: {
          total: orders.totalDocs,
          pages: orders.totalPages,
          page: orders.page,
          limit: orders.limit,
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
      .populate('items.itemId')
      .populate('userId');
      
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }
    
    if (order.ownershipTransferred) {
      return res.status(400).json({
        success: false,
        message: 'Ownership already transferred for this order',
      });
    }
    
    // Process each item in the order
    for (const item of order.items) {
      if (item.itemId?.type === 'pet') {
        const pd = await PetDetails.create({
          speciesId: item.itemId.species,
          breedId: item.itemId.breed,
          name: item.itemId.name || 'Pet',
          description: item.itemId.description || '',
          color: item.itemId.color || 'Unknown',
          ageRange: item.itemId.ageRange || { min: 0, max: 0 },
          weightRange: item.itemId.weightRange || { min: 0, max: 0, unit: 'kg' },
          vaccinationRequirements: item.itemId.vaccinationRequirements || [],
          careInstructions: item.itemId.careInstructions || {},
          temperament: item.itemId.temperament || [],
          specialNeeds: item.itemId.specialNeeds || [],
          createdBy: order.userId._id,
        });

        const pet = new Pet({
          name: item.itemId.name || 'Pet',
          species: item.itemId.species,
          breed: item.itemId.breed,
          petDetails: pd._id,
          owner: order.userId._id,
          gender: item.itemId.gender || 'Unknown',
          color: item.itemId.color || 'Unknown',
          images: item.itemId.images || [],
          storeId: item.itemId.storeId,
          storeName: item.itemId.storeName,
          tags: ['petshop'],
          description: item.itemId.description || '',
          createdBy: order.userId._id,
        });
        
        await pet.save();
      }
    }
    
    // Mark order as transferred
    order.ownershipTransferred = true;
    order.ownershipTransferredAt = new Date();
    await order.save();
    
    res.json({
      success: true,
      message: 'Ownership transferred successfully',
      data: { order },
    });
    
  } catch (e) {
    console.error('Admin transfer ownership error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Wishlist management
const addToWishlist = async (req, res) => {
  try {
    const { itemId } = req.body;
    const userId = req.user._id;

    // Check if item exists
    const item = await PetInventoryItem.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    // Add to wishlist if not already added
    const existingWishlistItem = await Wishlist.findOne({ userId, itemId });
    if (!existingWishlistItem) {
      await Wishlist.create({ userId, itemId });
    }

    res.json({
      success: true,
      message: 'Item added to wishlist',
    });
  } catch (e) {
    console.error('Add to wishlist error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user._id;

    await Wishlist.findOneAndDelete({ userId, itemId });

    res.json({
      success: true,
      message: 'Item removed from wishlist',
    });
  } catch (e) {
    console.error('Remove from wishlist error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const listMyWishlist = async (req, res) => {
  try {
    const wishlistItems = await Wishlist.find({ userId: req.user._id })
      .populate({
        path: 'itemId',
        select: 'name price images storeName'
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { wishlist: wishlistItems },
    });
  } catch (e) {
    console.error('List wishlist error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Review management
const createReview = async (req, res) => {
  try {
    const { itemId, rating, comment, type = 'item' } = req.body;
    const userId = req.user._id;

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
    }

    // Check if user has purchased the item
    const hasPurchased = await ShopOrder.exists({
      userId,
      'items.itemId': itemId,
      status: 'completed',
    });

    if (!hasPurchased) {
      return res.status(403).json({
        success: false,
        message: 'You must purchase the item before reviewing',
      });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({
      userId,
      itemId,
      type,
    });

    let review;
    if (existingReview) {
      // Update existing review
      review = await Review.findByIdAndUpdate(
        existingReview._id,
        { rating, comment },
        { new: true }
      );
    } else {
      // Create new review
      review = new Review({
        userId,
        itemId,
        type,
        rating,
        comment,
      });
      await review.save();
    }

    // Update item's average rating
    await updateItemRating(itemId, type);

    res.json({
      success: true,
      message: 'Review submitted successfully',
      data: { review },
    });
  } catch (e) {
    console.error('Create review error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const listItemReviews = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const options = {
      page: parseInt(page, 10),
      limit: Math.min(parseInt(limit, 10), 50),
      sort: { createdAt: -1 },
      populate: {
        path: 'userId',
        select: 'name avatar',
      },
    };

    const reviews = await Review.paginate(
      { itemId, type: 'item' },
      options
    );

    res.json({
      success: true,
      data: {
        reviews: reviews.docs,
        pagination: {
          total: reviews.totalDocs,
          pages: reviews.totalPages,
          page: reviews.page,
          limit: reviews.limit,
        },
      },
    });
  } catch (e) {
    console.error('List item reviews error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const listShopReviews = async (req, res) => {
  try {
    const { shopId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const options = {
      page: parseInt(page, 10),
      limit: Math.min(parseInt(limit, 10), 50),
      sort: { createdAt: -1 },
      populate: [
        { path: 'userId', select: 'name avatar' },
        { path: 'itemId', select: 'name images' },
      ],
    };

    const reviews = await Review.paginate(
      { shopId, type: 'shop' },
      options
    );

    res.json({
      success: true,
      data: {
        reviews: reviews.docs,
        pagination: {
          total: reviews.totalDocs,
          pages: reviews.totalPages,
          page: reviews.page,
          limit: reviews.limit,
        },
      },
    });
  } catch (e) {
    console.error('List shop reviews error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Helper function to update item's average rating
const updateItemRating = async (itemId, type) => {
  const result = await Review.aggregate([
    { $match: { itemId, type } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  if (result.length > 0) {
    const { averageRating, reviewCount } = result[0];
    const model = type === 'item' ? PetInventoryItem : PetShop;
    await model.findByIdAndUpdate(itemId, {
      rating: parseFloat(averageRating.toFixed(1)),
      reviewCount,
    });
  }
};

// ====================
// Manager Functions
// ====================

const managerDashboard = async (req, res) => {
  logAction(req, 'view_manager_dashboard');
  try {
    // Get the pet shop managed by the current user
    const petShop = await PetShop.findOne({ owner: req.user._id });
    
    if (!petShop) {
      return res.status(404).json({ 
        success: false, 
        message: 'No pet shop found for this manager' 
      });
    }
    
    // Get today's date
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    
    // Get today's reservations
    const todaysReservations = await Reservation.find({
      shop: petShop._id,
      startDate: { $lte: endOfDay },
      endDate: { $gte: startOfDay },
      status: { $in: ['confirmed', 'checked_in'] }
    })
    .populate('user', 'name email phone')
    .populate('pet', 'name species breed');
    
    // Get recent orders
    const recentOrders = await Order.find({ shop: petShop._id })
      .sort('-createdAt')
      .limit(5)
      .populate('user', 'name email')
      .populate('items.itemId', 'name price');
    
    // Get inventory status
    const inventoryStatus = await InventoryItem.aggregate([
      { $match: { shop: petShop._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get revenue data for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const revenueData = await Order.aggregate([
      {
        $match: {
          shop: petShop._id,
          status: 'completed',
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: '$total' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Prepare dashboard data
    const dashboardData = {
      shop: {
        id: petShop._id,
        name: petShop.name,
        status: petShop.status
      },
      stats: {
        totalReservations: await Reservation.countDocuments({ shop: petShop._id }),
        activeReservations: await Reservation.countDocuments({ 
          shop: petShop._id, 
          status: { $in: ['confirmed', 'checked_in'] } 
        }),
        totalOrders: await Order.countDocuments({ shop: petShop._id }),
        totalRevenue: await Order.aggregate([
          { $match: { shop: petShop._id, status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$total' } } }
        ]).then(result => result[0]?.total || 0),
        inventoryStatus: inventoryStatus.reduce((acc, curr) => ({
          ...acc,
          [curr._id]: curr.count
        }), {})
      },
      todaysReservations,
      recentOrders,
      revenueData
    };
    
    res.status(200).json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Manager dashboard error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

// @desc    Create a new promotion
// @route   POST /api/v1/petshops/manager/promotions
// @access  Private/Manager
const createPromotion = async (req, res) => {
  logAction(req, 'create_promotion', { 
    code: req.body.code,
    discountType: req.body.discountType,
    discountValue: req.body.discountValue
  });
  
  try {
    // Get the pet shop managed by the current user
    const petShop = await PetShop.findOne({ owner: req.user._id });
    
    if (!petShop) {
      return res.status(404).json({ 
        success: false, 
        message: 'No pet shop found for this manager' 
      });
    }

    const { 
      code, 
      description = '',
      discountType, 
      discountValue, 
      minOrder = 0, 
      startDate, 
      endDate,
      maxUses = null,
      applicableItems = [],
      applicableCategories = []
    } = req.body;

    // Check if promotion code already exists
    const existingPromotion = await Promotion.findOne({ 
      code: { $regex: new RegExp(`^${code}$`, 'i') },
      shop: petShop._id
    });

    if (existingPromotion) {
      return res.status(400).json({
        success: false,
        message: 'Promotion code already exists'
      });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (start < now) {
      return res.status(400).json({
        success: false,
        message: 'Start date cannot be in the past'
      });
    }

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    // Create promotion
    const promotion = new Promotion({
      code: code.toUpperCase(),
      description,
      discountType,
      discountValue,
      minOrder,
      startDate: start,
      endDate: end,
      maxUses,
      shop: petShop._id,
      createdBy: req.user._id,
      applicableItems,
      applicableCategories
    });

    await promotion.save();

    // Populate the createdBy field for the response
    await promotion.populate('createdBy', 'name email').execPopulate();

    res.status(201).json({
      success: true,
      message: 'Promotion created successfully',
      data: { promotion }
    });
  } catch (error) {
    console.error('Create promotion error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Promotion code already exists'
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

// @desc    Get all promotions for manager's pet shop
// @route   GET /api/v1/petshops/manager/promotions
// @access  Private/Manager
const managerListPromotions = async (req, res) => {
  logAction(req, 'list_promotions');
  
  try {
    // Get the pet shop managed by the current user
    const petShop = await PetShop.findOne({ owner: req.user._id });
    
    if (!petShop) {
      return res.status(404).json({ 
        success: false, 
        message: 'No pet shop found for this manager' 
      });
    }
    
    // Query parameters
    const { status, activeOnly = 'true', sortBy = '-createdAt', limit = 10, page = 1 } = req.query;
    
    // Build query
    const query = { shop: petShop._id };
    
    // Filter by status if provided
    if (status) {
      query.status = status;
    }
    
    // Filter active promotions only
    if (activeOnly === 'true') {
      const now = new Date();
      query.startDate = { $lte: now };
      query.endDate = { $gte: now };
      query.isActive = true;
    }
    
    // Execute query with pagination
    const promotions = await Promotion.find(query)
      .sort(sortBy)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('createdBy', 'name email')
      .populate('applicableItems', 'name price')
      .populate('applicableCategories', 'name');
    
    // Get total count for pagination
    const total = await Promotion.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: promotions.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: promotions
    });
    
  } catch (error) {
    console.error('List promotions error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

// @desc    Update a promotion
// @route   PUT /api/v1/petshops/manager/promotions/:id
// @access  Private/Manager
const managerUpdatePromotion = async (req, res) => {
  logAction(req, 'update_promotion', { promotionId: req.params.id });
  
  try {
    // Get the pet shop managed by the current user
    const petShop = await PetShop.findOne({ owner: req.user._id });
    
    if (!petShop) {
      return res.status(404).json({ 
        success: false, 
        message: 'No pet shop found for this manager' 
      });
    }
    
    // Find the promotion
    let promotion = await Promotion.findOne({
      _id: req.params.id,
      shop: petShop._id
    });
    
    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found'
      });
    }
    
    // Prevent updating certain fields if promotion is active and in use
    if (promotion.isActive && promotion.currentUses > 0) {
      const restrictedFields = ['code', 'discountType', 'discountValue', 'minOrder'];
      const hasRestrictedUpdate = Object.keys(req.body).some(field => 
        restrictedFields.includes(field)
      );
      
      if (hasRestrictedUpdate) {
        return res.status(400).json({
          success: false,
          message: 'Cannot update code, discount type, discount value, or minimum order for an active promotion with existing uses'
        });
      }
    }
    
    // Update promotion
    const updates = Object.keys(req.body);
    const allowedUpdates = [
      'code', 'description', 'discountType', 'discountValue', 'minOrder',
      'startDate', 'endDate', 'maxUses', 'isActive', 'applicableItems',
      'applicableCategories'
    ];
    
    const isValidOperation = updates.every(update => 
      allowedUpdates.includes(update)
    );
    
    if (!isValidOperation) {
      return res.status(400).json({
        success: false,
        message: 'Invalid updates!'
      });
    }
    
    // Apply updates
    updates.forEach(update => {
      if (update === 'code' && req.body[update]) {
        promotion[update] = req.body[update].toUpperCase();
      } else if (update === 'startDate' || update === 'endDate') {
        promotion[update] = new Date(req.body[update]);
      } else if (update === 'applicableItems' || update === 'applicableCategories') {
        // Ensure we're not duplicating items
        const existingIds = new Set(promotion[update].map(id => id.toString()));
        const newItems = req.body[update].filter(id => !existingIds.has(id));
        promotion[update] = [...promotion[update], ...newItems];
      } else if (req.body[update] !== undefined) {
        promotion[update] = req.body[update];
      }
    });
    
    // Validate dates
    if (updates.includes('startDate') || updates.includes('endDate')) {
      if (promotion.startDate >= promotion.endDate) {
        return res.status(400).json({
          success: false,
          message: 'End date must be after start date'
        });
      }
    }
    
    await promotion.save();
    
    // Populate fields for response
    await promotion.populate('createdBy', 'name email')
      .populate('applicableItems', 'name price')
      .populate('applicableCategories', 'name')
      .execPopulate();
    
    res.status(200).json({
      success: true,
      message: 'Promotion updated successfully',
      data: { promotion }
    });
    
  } catch (error) {
    console.error('Update promotion error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Promotion code already exists'
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

// @desc    Delete a promotion
// @route   DELETE /api/v1/petshops/manager/promotions/:id
// @access  Private/Manager
const managerDeletePromotion = async (req, res) => {
  logAction(req, 'delete_promotion', { promotionId: req.params.id });
  
  try {
    // Get the pet shop managed by the current user
    const petShop = await PetShop.findOne({ owner: req.user._id });
    
    if (!petShop) {
      return res.status(404).json({ 
        success: false, 
        message: 'No pet shop found for this manager' 
      });
    }
    
    // Find and delete the promotion
    const promotion = await Promotion.findOneAndDelete({
      _id: req.params.id,
      shop: petShop._id
    });
    
    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Promotion not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Promotion deleted successfully',
      data: {}
    });
    
  } catch (error) {
    console.error('Delete promotion error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
};

// ====================
// User Functions
// ====================

const listUserAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('addresses');
    res.json({
      success: true,
      data: { addresses: user.addresses },
    });
  } catch (e) {
    console.error('List addresses error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const addPaymentMethod = async (req, res) => {
  try {
    const { type, cardNumber, expiry, cvv, isDefault } = req.body;
    
    // In a real app, use a payment processor like Stripe
    const paymentMethod = {
      type,
      last4: cardNumber.slice(-4),
      expiry,
      isDefault,
      createdAt: new Date(),
    };

    await User.findByIdAndUpdate(req.user._id, {
      $push: { paymentMethods: paymentMethod },
    });

    res.status(201).json({
      success: true,
      message: 'Payment method added successfully',
    });
  } catch (e) {
    console.error('Add payment method error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const order = await ShopOrder.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Only allow cancellation for pending/processing orders
    if (!['pending', 'processing'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage',
      });
    }

    order.status = 'cancelled';
    order.cancelledAt = new Date();
    await order.save();

    // Add to order history
    await OrderHistory.create({
      order: order._id,
      status: 'cancelled',
      changedBy: req.user._id,
      notes: 'Cancelled by user',
    });

    res.json({
      success: true,
      message: 'Order cancelled successfully',
    });
  } catch (e) {
    console.error('Cancel order error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ====================
// Admin Functions
// ====================

const updateUserRole = async (req, res) => {
  logAction(req, 'update_user_role', { 
    userId: req.params.id,
    newRole: req.body.role,
    updatedBy: req.user._id
  });
  try {
    const { role } = req.body;
    const validRoles = ['user', 'manager', 'admin'];

    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
      });
    }

    // Prevent modifying other admins
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify your own role',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: { user },
    });
  } catch (e) {
    console.error('Update user role error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createAnnouncement = async (req, res) => {
  logAction(req, 'create_announcement', { 
    title: req.body.title,
    targetRoles: req.body.targetRoles || []
  });
  try {
    const { title, content, isActive, targetRoles } = req.body;

    const announcement = new Announcement({
      title,
      content,
      isActive: isActive !== false, // Default to true
      targetRoles: targetRoles || ['user', 'manager', 'admin'],
      createdBy: req.user._id,
    });

    await announcement.save();

    // In a real app, you might want to notify users via WebSocket
    // or push notifications here

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      data: { announcement },
    });
  } catch (e) {
    console.error('Create announcement error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getAdvancedAnalytics = async (req, res) => {
  logAction(req, 'view_advanced_analytics');
  try {
    const { startDate, endDate } = req.query;
    const match = {};

    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }

    // Sales by category
    const salesByCategory = await ShopOrder.aggregate([
      { $match: { ...match, status: 'completed' } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'petinventoryitems',
          localField: 'items.itemId',
          foreignField: '_id',
          as: 'item',
        },
      },
      { $unwind: '$item' },
      {
        $group: {
          _id: '$item.category',
          totalSales: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
          count: { $sum: 1 },
        },
      },
    ]);

    // User acquisition
    const userAcquisition = await User.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Top performing products
    const topProducts = await ShopOrder.aggregate([
      { $match: { ...match, status: 'completed' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.itemId',
          name: { $first: '$items.name' },
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      success: true,
      data: {
        salesByCategory,
        userAcquisition,
        topProducts,
      },
    });
  } catch (e) {
    console.error('Advanced analytics error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ===== PRICING MANAGEMENT =====

// Create pricing rule for category/species/breed combination
const createPricingRule = async (req, res) => {
  logAction(req, 'create_pricing_rule', { 
    categoryId: req.body.categoryId,
    speciesId: req.body.speciesId,
    breedId: req.body.breedId
  });
  try {
    const pricingData = {
      ...req.body,
      storeId: req.user.storeId,
      storeName: req.user.storeName,
      createdBy: req.user._id
    };
    
    const pricing = new PetPricing(pricingData);
    await pricing.save();
    
    res.status(201).json({ 
      success: true, 
      message: 'Pricing rule created successfully', 
      data: { pricing } 
    });
  } catch (e) {
    console.error('Create pricing rule error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// List pricing rules for manager's store
const listPricingRules = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const filter = { ...getStoreFilter(req.user), isActive: true };
    
    const pricingRules = await PetPricing.find(filter)
      .populate('categoryId', 'name')
      .populate('speciesId', 'name')
      .populate('breedId', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
      
    const total = await PetPricing.countDocuments(filter);
    
    res.json({ 
      success: true, 
      data: { 
        pricingRules, 
        pagination: { 
          current: parseInt(page), 
          pages: Math.ceil(total / limit), 
          total 
        } 
      } 
    });
  } catch (e) {
    console.error('List pricing rules error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update pricing rule
const updatePricingRule = async (req, res) => {
  try {
    const pricingRule = await PetPricing.findOne({ 
      _id: req.params.id, 
      ...getStoreFilter(req.user) 
    });
    
    if (!pricingRule) {
      return res.status(404).json({ success: false, message: 'Pricing rule not found' });
    }
    
    Object.assign(pricingRule, req.body);
    await pricingRule.save();
    
    res.json({ 
      success: true, 
      message: 'Pricing rule updated successfully', 
      data: { pricing: pricingRule } 
    });
  } catch (e) {
    console.error('Update pricing rule error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Calculate price for pet based on attributes
const calculatePetPrice = async (req, res) => {
  try {
    const { categoryId, speciesId, breedId, petAttributes } = req.body;
    
    const pricingRule = await PetPricing.findOne({
      categoryId,
      speciesId,
      breedId,
      ...getStoreFilter(req.user),
      isActive: true
    });
    
    if (!pricingRule) {
      return res.status(404).json({ 
        success: false, 
        message: 'No pricing rule found for this pet combination' 
      });
    }
    
    const calculatedPrice = pricingRule.calculatePrice(petAttributes);
    
    res.json({ 
      success: true, 
      data: { 
        calculatedPrice,
        basePrice: pricingRule.basePrice,
        pricingRuleId: pricingRule._id
      } 
    });
  } catch (e) {
    console.error('Calculate pet price error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ===== ENHANCED INVENTORY MANAGEMENT =====

// Create inventory item with auto-pricing
const createInventoryItem = async (req, res) => {
  logAction(req, 'create_inventory_item', { 
    categoryId: req.body.categoryId,
    speciesId: req.body.speciesId,
    breedId: req.body.breedId
  });
  try {
    const qty = Math.max(1, Number(req.body.quantity || 1))

    // Build base item payload (per-document quantity should be 1 to keep unique pet identity)
    const baseData = {
      ...req.body,
      quantity: 1,
      storeId: req.user.storeId,
      storeName: req.user.storeName,
      createdBy: req.user._id
    }

    if (qty === 1) {
      const item = new PetInventoryItem(baseData)
      if (!item.price || item.price === 0) {
        await item.calculatePriceFromRules()
      }
      await item.save()
      return res.status(201).json({ success: true, message: 'Pet added to inventory successfully', data: { item } })
    }

    // quantity > 1: create multiple items
    const docs = []
    for (let i = 0; i < qty; i++) {
      const temp = new PetInventoryItem(baseData)
      // Calculate price from rules if not set
      // eslint-disable-next-line no-await-in-loop
      if (!temp.price || temp.price === 0) await temp.calculatePriceFromRules()
      // Push plain object for insertMany
      docs.push(temp.toObject())
    }

    const created = await PetInventoryItem.insertMany(docs)
    return res.status(201).json({ success: true, message: `${created.length} pets added to inventory successfully`, data: { items: created } })
  } catch (e) {
    console.error('Create inventory item error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Bulk create inventory items from purchase order
const bulkCreateInventoryItems = async (req, res) => {
  try {
    const { items } = req.body; // Array of pet data
    
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Items array is required' 
      });
    }
    
    const createdItems = [];
    
    for (const itemData of items) {
      const item = new PetInventoryItem({
        ...itemData,
        storeId: req.user.storeId,
        storeName: req.user.storeName,
        createdBy: req.user._id
      });
      
      // Calculate price from rules
      await item.calculatePriceFromRules();
      await item.save();
      
      createdItems.push(item);
    }
    
    res.status(201).json({ 
      success: true, 
      message: `${createdItems.length} pets added to inventory successfully`, 
      data: { items: createdItems } 
    });
  } catch (e) {
    console.error('Bulk create inventory error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ===== ENHANCED RESERVATION MANAGEMENT =====

// Create enhanced reservation with detailed info
const createEnhancedReservation = async (req, res) => {
  logAction(req, 'create_enhanced_reservation', { 
    itemId: req.body.itemId,
    reservationType: req.body.reservationType
  });
  try {
    const { itemId, contactInfo, visitDetails, reservationType, notes } = req.body;
    
    if (!itemId) {
      return res.status(400).json({ success: false, message: 'itemId is required' });
    }
    
    const item = await PetInventoryItem.findOne({ _id: itemId, isActive: true });
    if (!item || item.status !== 'available_for_sale') {
      return res.status(400).json({ 
        success: false, 
        message: 'Pet not available for reservation' 
      });
    }
    
    // Check if user already has pending reservation for this item
    const existingReservation = await PetReservation.findOne({
      itemId,
      userId: req.user._id,
      status: { $in: ['pending', 'manager_review', 'approved', 'payment_pending'] }
    });
    
    if (existingReservation) {
      return res.status(400).json({ 
        success: false, 
        message: 'You already have an active reservation for this pet' 
      });
    }
    
    const reservationData = {
      itemId,
      userId: req.user._id,
      reservationType: reservationType || 'online_booking',
      contactInfo: {
        phone: contactInfo?.phone || req.user.phone,
        email: contactInfo?.email || req.user.email,
        preferredContactMethod: contactInfo?.preferredContactMethod || 'both'
      },
      visitDetails: visitDetails || {},
      paymentInfo: {
        amount: item.price
      },
      notes: notes || '',
      status: reservationType === 'offline_verification' ? 'manager_review' : 'pending'
    };
    
    const reservation = new PetReservation(reservationData);
    await reservation.save();
    
    // Populate the response
    await reservation.populate([
      { path: 'itemId', select: 'name petCode price images' },
      { path: 'userId', select: 'name email' }
    ]);
    
    res.status(201).json({ 
      success: true, 
      message: 'Reservation created successfully', 
      data: { reservation } 
    });
  } catch (e) {
    console.error('Create enhanced reservation error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Manager review and approve/reject reservation
const managerReviewReservation = async (req, res) => {
  logAction(req, 'manager_review_reservation', { 
    reservationId: req.params.id,
    action: req.body.action
  });
  try {
    const { action, reviewNotes, approvalReason } = req.body;
    
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Action must be either "approve" or "reject"' 
      });
    }
    
    const reservation = await PetReservation.findById(req.params.id)
      .populate('itemId');
      
    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }
    
    // Verify the item belongs to manager's store
    const storeFilter = getStoreFilter(req.user);
    const item = await PetInventoryItem.findOne({
      _id: reservation.itemId,
      ...storeFilter
    });
    
    if (!item) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to review this reservation' 
      });
    }
    
    // Update reservation
    reservation.managerReview = {
      reviewedBy: req.user._id,
      reviewedAt: new Date(),
      reviewNotes: reviewNotes || '',
      approvalReason: approvalReason || ''
    };
    
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    await reservation.updateStatus(newStatus, req.user._id, reviewNotes);
    
    res.json({ 
      success: true, 
      message: `Reservation ${action}d successfully`, 
      data: { reservation } 
    });
  } catch (e) {
    console.error('Manager review reservation error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get reservation by code (for tracking)
const getReservationByCode = async (req, res) => {
  try {
    const { code } = req.params;
    
    const reservation = await PetReservation.findOne({ reservationCode: code })
      .populate([
        { path: 'itemId', select: 'name petCode price images speciesId breedId' },
        { path: 'userId', select: 'name email phone' },
        { path: 'managerReview.reviewedBy', select: 'name' }
      ]);
      
    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }
    
    // Check if user is authorized to view this reservation
    const isOwner = reservation.userId._id.toString() === req.user._id.toString();
    const isManager = req.user.role === 'manager' || req.user.role === 'admin';
    
    if (!isOwner && !isManager) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to view this reservation' 
      });
    }
    
    res.json({ success: true, data: { reservation } });
  } catch (e) {
    console.error('Get reservation by code error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// List reservations with enhanced filtering
const listEnhancedReservations = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      reservationType, 
      dateFrom, 
      dateTo 
    } = req.query;
    
    let filter = {};
    
    // Apply role-based filtering
    if (req.user.role === 'manager') {
      // Manager sees only reservations for their store's items
      const storeFilter = getStoreFilter(req.user);
      const storeItems = await PetInventoryItem.find(storeFilter, '_id');
      filter.itemId = { $in: storeItems.map(item => item._id) };
    } else if (req.user.role !== 'admin') {
      // Regular users see only their own reservations
      filter.userId = req.user._id;
    }
    
    // Apply additional filters
    if (status) filter.status = status;
    if (reservationType) filter.reservationType = reservationType;
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }
    
    const reservations = await PetReservation.find(filter)
      .populate([
        { path: 'itemId', select: 'name petCode price images' },
        { path: 'userId', select: 'name email phone' },
        { path: 'managerReview.reviewedBy', select: 'name' }
      ])
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
      
    const total = await PetReservation.countDocuments(filter);
    
    res.json({ 
      success: true, 
      data: { 
        reservations, 
        pagination: { 
          current: parseInt(page), 
          pages: Math.ceil(total / limit), 
          total 
        } 
      } 
    });
  } catch (e) {
    console.error('List enhanced reservations error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ===== CENTRALIZED PET CODE MANAGEMENT =====

// Get pet code usage statistics
const getPetCodeStats = async (req, res) => {
  try {
    const PetCodeGenerator = require('../../../utils/petCodeGenerator')
    const stats = await PetCodeGenerator.getUsageStats()
    
    res.json({ 
      success: true, 
      data: { stats } 
    })
  } catch (err) {
    console.error('Get pet code stats error:', err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// Generate bulk pet codes for testing/import
const generateBulkPetCodes = async (req, res) => {
  try {
    const { count = 10 } = req.body
    
    if (count > 100) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot generate more than 100 codes at once' 
      })
    }
    
    const PetCodeGenerator = require('../../../utils/petCodeGenerator')
    const codes = await PetCodeGenerator.generateBulkPetCodes(count)
    
    res.json({ 
      success: true, 
      data: { codes, count: codes.length } 
    })
  } catch (err) {
    console.error('Generate bulk pet codes error:', err)
    res.status(500).json({ 
      success: false, 
      message: err.message || 'Server error' 
    })
  }
}

// Validate pet code format
const validatePetCode = async (req, res) => {
  try {
    const { code } = req.body
    
    if (!code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Pet code is required' 
      })
    }
    
    const PetCodeGenerator = require('../../../utils/petCodeGenerator')
    const isValid = PetCodeGenerator.validatePetCodeFormat(code)
    const exists = await PetCodeGenerator.checkCodeExists(code)
    
    res.json({ 
      success: true, 
      data: { 
        code,
        isValidFormat: isValid,
        exists,
        available: isValid && !exists
      } 
    })
  } catch (err) {
    console.error('Validate pet code error:', err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

module.exports = {
  // Core Pet Shop Functions
  listPetShops,
  getPetShopById,
  createPetShop,
  updatePetShop,
  addPetToPetShop,
  addProduct,
  addService,
  getPetShopStats,
  getUserPetShopStats,
  listAnimals,
  
  // Purchase Order Management
  createPurchaseOrder,
  listPurchaseOrders,
  getPurchaseOrderById,
  updatePurchaseOrder,
  submitPurchaseOrder,
  generatePurchaseOrderInvoice,
  receivePurchaseOrder,
  
  // Inventory Management
  listInventory,
  updateInventoryItem,
  deleteInventoryItem,
  getInventoryItemById,
  createInventoryItem,
  bulkCreateInventoryItems,
  bulkPublishInventoryItems,
  listPublicListings,
  listPublicPetShops,
  getPublicListingById,
  uploadInventoryImage,
  uploadInventoryHealthDoc,
  
  // Pricing Management
  createPricingRule,
  listPricingRules,
  updatePricingRule,
  calculatePetPrice,
  
  // Reservation Management
  createReservation,
  createEnhancedReservation,
  listMyReservations,
  listEnhancedReservations,
  cancelReservation,
  managerReviewReservation,
  getReservationByCode,
  
  // Admin Functions
  getAdminAnalyticsSummary,
  getAdminSpeciesBreakdown,
  getAdminSalesSeries,
  adminListShops,
  adminUpdateShopStatus,
  adminListAllListings,
  adminRemoveListing,
  adminSalesReport,
  adminListReservations,
  adminUpdateReservationStatus,
  adminListOrders,
  adminTransferOwnership,
  updateUserRole,
  createAnnouncement,
  getAdvancedAnalytics,
  
  // Manager Functions
  managerListReservations,
  managerUpdateReservationStatus,
  managerDashboard,
  createPromotion,
  managerListPromotions,
  managerUpdatePromotion,
  managerDeletePromotion,
  
  // User Functions
  addToWishlist,
  removeFromWishlist,
  listMyWishlist,
  createReview,
  listItemReviews,
  listShopReviews,
  listUserAddresses,
  addPaymentMethod,
  cancelOrder,
  
  // Payment Functions
  createRazorpayOrder,
  verifyRazorpaySignature,
  
  // Centralized Pet Code Management
  getPetCodeStats,
  generateBulkPetCodes,
  validatePetCode
};
