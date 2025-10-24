const PetInventoryItem = require('../models/PetInventoryItem');
const PetShop = require('../models/PetShop');
const User = require('../../../../core/models/User');
const PetReservation = require('../../user/models/PetReservation');
const { getStoreFilter } = require('../../../../core/utils/storeFilter');
const { generateStoreId } = require('../../../../core/utils/storeIdGenerator');
const logger = require('winston');

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

// Inventory management
const listInventory = async (req, res) => {
  try {
    let { page = 1, limit = 10, status } = req.query;
    const {
      q,
      gender,
      ageMin,
      ageMax,
      priceMin,
      priceMax,
      speciesId,
      breedId
    } = req.query
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
    if (speciesId) baseFilter.speciesId = speciesId
    if (breedId) baseFilter.breedId = breedId
    // Price range
    if (priceMin || priceMax) {
      baseFilter.price = {}
      if (priceMin) baseFilter.price.$gte = Number(priceMin)
      if (priceMax) baseFilter.price.$lte = Number(priceMax)
    }
    // Age range
    if (ageMin || ageMax) {
      baseFilter.age = {}
      if (ageMin) baseFilter.age.$gte = Number(ageMin)
      if (ageMax) baseFilter.age.$lte = Number(ageMax)
    }
    // Gender
    if (gender) baseFilter.gender = gender
    // Text search on name/petCode
    if (q && String(q).trim().length > 0) {
      const needle = String(q).trim()
      baseFilter.$or = [
        { name: { $regex: needle, $options: 'i' } },
        { petCode: { $regex: needle, $options: 'i' } }
      ]
    }

    // Optional debugging: enable only if DEBUG_INVENTORY_LOGS=1
    if (process.env.DEBUG_INVENTORY_LOGS === '1') {
      console.log('Inventory list filter used:', baseFilter);
    }

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
        const hasImage = Array.isArray(item.imageIds) && item.imageIds.length > 0
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
    if (req.body.imageIds !== undefined) item.imageIds = req.body.imageIds;
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
    const item = await PetInventoryItem.findById(req.params.id).populate('imageIds');
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

// Manager utility: backfill missing storeId on historical inventory
const managerBackfillInventoryStoreIds = async (req, res) => {
  try {
    // Ensure manager has a storeId
    if ((req.user?.role || '').includes('_manager') && !req.user?.storeId) {
      try {
        const userDoc = await User.findById(req.user._id)
        if (userDoc && !userDoc.storeId) {
          const moduleKey = userDoc.assignedModule || (userDoc.role?.split('_')[0]) || 'petshop'
          userDoc.storeId = await generateStoreId(moduleKey, [ { model: User, field: 'storeId' } ])
          await userDoc.save()
          req.user.storeId = userDoc.storeId
          req.user.storeName = userDoc.storeName
        }
      } catch (e) {
        console.warn('Could not auto-generate storeId during backfill:', e?.message)
      }
    }

    if (!req.user.storeId) {
      return res.status(400).json({ success: false, message: 'Manager has no storeId; cannot backfill' })
    }

    const filter = {
      isActive: true,
      createdBy: req.user._id,
      $or: [ { storeId: null }, { storeId: '' }, { storeId: { $exists: false } } ]
    }
    const update = { $set: { storeId: req.user.storeId, storeName: req.user.storeName || '' } }
    const result = await PetInventoryItem.updateMany(filter, update)
    return res.json({ success: true, message: 'Backfill completed', data: { matched: result.matchedCount ?? result.n, modified: result.modifiedCount ?? result.nModified } })
  } catch (e) {
    console.error('Backfill storeId error:', e)
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

    // Build store-aware filter with the same relaxation rules as listInventory
    const rawStoreFilter = getStoreFilter(req.user) || {}
    const isBlockingFilter = Object.prototype.hasOwnProperty.call(rawStoreFilter, '_id') && rawStoreFilter._id === null
    const isManagerNoStore = (req.user?.role || '').includes('_manager') && !req.user?.storeId
    const storeFilter = (isBlockingFilter || isManagerNoStore) ? {} : rawStoreFilter

    const baseFilter = { _id: { $in: itemIds }, isActive: true, ...storeFilter }

    // Fetch items (scoped if storeFilter is present)
    const items = await PetInventoryItem.find(baseFilter)

    const results = { published: [], skipped: [] }

    for (const item of items) {
      const hasImage = Array.isArray(item.imageIds) && item.imageIds.length > 0
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
    console.log('Getting public listing for ID:', req.params.id)
    
    const item = await PetInventoryItem.findOne({ _id: req.params.id, isActive: true })
      .populate('speciesId', 'name')
      .populate('breedId', 'name')
      .populate('storeId', 'name address')
    
    console.log('Found item:', item ? { id: item._id, status: item.status, name: item.name } : 'null')
    
    if (!item) {
      return res.status(404).json({ success: false, message: 'Pet not found' })
    }
    
    // Allow viewing of pets that are available, reserved, or sold (for transparency)
    if (!['available_for_sale', 'reserved', 'sold'].includes(item.status)) {
      return res.status(404).json({ success: false, message: 'Pet listing not available' })
    }
    
    // increment views (non-blocking) only for available pets
    if (item.status === 'available_for_sale') {
      item.views = (item.views || 0) + 1
      item.save().catch(() => {})
    }
    
    res.json({ success: true, data: { item } })
  } catch (e) {
    console.error('Get public listing error:', e)
    res.status(500).json({ success: false, message: 'Server error' })
  }
}

// Authenticated: allow user to view item if:
// - item is publicly available; OR
// - user has a reservation for this item; OR
// - user is the buyer (after purchase)
const getUserAccessibleItemById = async (req, res) => {
  try {
    const item = await PetInventoryItem.findById(req.params.id)
      .populate('speciesId', 'name displayName')
      .populate('breedId', 'name')
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' })

    if (item.isActive && item.status === 'available_for_sale') {
      return res.json({ success: true, data: { item } })
    }

    // Check reservation ownership or buyer ownership
    const hasReservation = await PetReservation.exists({ itemId: item._id, userId: req.user._id })
    const isBuyer = item.buyerId && item.buyerId.toString() === req.user._id.toString()
    if (hasReservation || isBuyer) {
      return res.json({ success: true, data: { item } })
    }

    return res.status(403).json({ success: false, message: 'You are not allowed to view this item' })
  } catch (e) {
    console.error('Get user-accessible item error:', e)
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

module.exports = {
  listInventory,
  updateInventoryItem,
  getInventoryItemById,
  deleteInventoryItem,
  managerBackfillInventoryStoreIds,
  bulkPublishInventoryItems,
  listPublicListings,
  listPublicPetShops,
  getPublicListingById,
  getUserAccessibleItemById,
  uploadInventoryHealthDoc
};