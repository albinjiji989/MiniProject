const PetInventoryItem = require('../models/PetInventoryItem');
const PetShop = require('../models/PetShop');
const { getStoreFilter } = require('../../../../core/utils/storeFilter');
const path = require('path');

// Inventory Management Functions
const listInventory = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      search, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      speciesId,
      breedId,
      minPrice,
      maxPrice
    } = req.query;

    const filter = { ...getStoreFilter(req.user), isActive: true };
    
    // Apply filters
    if (status) filter.status = status;
    if (speciesId) filter.speciesId = speciesId;
    if (breedId) filter.breedId = breedId;
    
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { petCode: { $regex: search, $options: 'i' } }
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const items = await PetInventoryItem.find(filter)
      .populate('speciesId', 'name')
      .populate('breedId', 'name')
      .populate('imageIds') // Populate the imageIds field
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await PetInventoryItem.countDocuments(filter);

    res.json({
      success: true,
      data: {
        items,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createInventoryItem = async (req, res) => {
  try {
    const itemData = { ...req.body, ...getStoreFilter(req.user) };
    
    // Handle images if provided (convert base64 to file and save path)
    let imageIds = [];
    if (itemData.images && Array.isArray(itemData.images) && itemData.images.length > 0) {
      try {
        const fs = require('fs').promises;
        const Image = require('../../../core/models/Image');
        
        console.log('🖼️  Processing', itemData.images.length, 'images for pet inventory creation using standardized system');
        
        // Handle images using our new standardized image upload system
        const { processEntityImages } = require('../../../../core/utils/imageUploadHandler');
        
        // Process images using our new utility
        const savedImages = await processEntityImages(
          itemData.images, 
          'PetInventoryItem', 
          null, // Will be set after item is created
          req.user.id, 
          'petshop', 
          'manager'
        );
        
        imageIds = savedImages.map(img => img._id);
      } catch (imgErr) {
        console.error('❌ Failed to save pet inventory images:', imgErr);
      }
    }
    
    // Remove images from itemData as we'll handle them separately
    delete itemData.images;
    
    const item = new PetInventoryItem(itemData);
    await item.save();
    
    // Update image documents with the correct entityId
    if (imageIds.length > 0) {
      const Image = require('../../../core/models/Image');
      await Image.updateMany(
        { _id: { $in: imageIds } },
        { entityId: item._id }
      );
      
      // Add image references to the item
      item.imageIds = imageIds;
      await item.save();
    }
    
    // Populate references for response
    await item.populate('speciesId', 'name');
    await item.populate('breedId', 'name');
    await item.populate('imageIds'); // Also populate images
    
    res.status(201).json({
      success: true,
      data: { item },
      message: 'Inventory item created successfully'
    });
  } catch (error) {
    console.error('Create inventory item error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

const getInventoryItemById = async (req, res) => {
  try {
    const item = await PetInventoryItem.findOne({ 
      _id: req.params.id, 
      ...getStoreFilter(req.user) 
    }).populate('imageIds'); // Populate images
    
    if (!item) {
      return res.status(404).json({ 
        success: false, 
        message: 'Inventory item not found' 
      });
    }
    
    res.json({ success: true, data: { item } });
  } catch (error) {
    console.error('Get inventory item error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateInventoryItem = async (req, res) => {
  try {
    const item = await PetInventoryItem.findOneAndUpdate(
      { _id: req.params.id, ...getStoreFilter(req.user) },
      req.body,
      { new: true, runValidators: true }
    ).populate('imageIds'); // Populate images
    
    if (!item) {
      return res.status(404).json({ 
        success: false, 
        message: 'Inventory item not found' 
      });
    }
    
    res.json({
      success: true,
      data: { item },
      message: 'Inventory item updated successfully'
    });
  } catch (error) {
    console.error('Update inventory item error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteInventoryItem = async (req, res) => {
  try {
    const item = await PetInventoryItem.findOneAndUpdate(
      { _id: req.params.id, ...getStoreFilter(req.user) },
      { isActive: false },
      { new: true }
    );
    
    if (!item) {
      return res.status(404).json({ 
        success: false, 
        message: 'Inventory item not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Inventory item deleted successfully'
    });
  } catch (error) {
    console.error('Delete inventory item error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Bulk create inventory items
const bulkCreateInventoryItems = async (req, res) => {
  try {
    console.log('=== BULK CREATE INVENTORY ITEMS ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Request user:', req.user?.id, req.user?.role);
    
    const itemsData = req.body.items || [];
    console.log('Received itemsData:', itemsData);
    console.log('ItemsData type:', typeof itemsData);
    console.log('Is array:', Array.isArray(itemsData));
    
    if (!Array.isArray(itemsData) || itemsData.length === 0) {
      console.log('Items array is required or empty');
      return res.status(400).json({ 
        success: false, 
        message: 'Items array is required' 
      });
    }

    // Log the incoming request for debugging
    console.log('_bulkCreateInventoryItems request:', {
      user: req.user?.id,
      userRole: req.user?.role,
      userStoreId: req.user?.storeId,
      itemsCount: itemsData.length,
      sampleItem: itemsData[0]
    });

    // Validate required fields for each item
    for (let i = 0; i < itemsData.length; i++) {
      const item = itemsData[i];
      const missingFields = [];
      
      if (!item.categoryId) missingFields.push('categoryId');
      if (!item.speciesId) missingFields.push('speciesId');
      if (!item.breedId) missingFields.push('breedId');
      
      if (missingFields.length > 0) {
        console.log(`Item ${i + 1} missing fields:`, missingFields);
        return res.status(400).json({ 
          success: false, 
          message: `Item ${i + 1} is missing required fields: ${missingFields.join(', ')}` 
        });
      }
    }

    // Add store filter to each item
    const storeFilter = getStoreFilter(req.user);
    console.log('Store filter applied:', storeFilter);
    
    // Check if store filter would block all items
    if (storeFilter._id === null) {
      console.log('Access denied - no store assigned to user');
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. No store assigned to user.' 
      });
    }
    
    const itemsWithStore = itemsData.map((item, index) => {
      console.log(`Processing item ${index}:`, item);
      
      // Ensure proper data types and include all required fields
      const processedItem = {
        ...item,
        ...storeFilter,
        createdBy: req.user.id,  // Add the required createdBy field
        categoryId: item.categoryId,
        speciesId: item.speciesId,
        breedId: item.breedId,
        unitCost: parseFloat(item.unitCost) || 0,
        price: parseFloat(item.price) || 0,
        quantity: parseInt(item.quantity) || 1,
        age: parseFloat(item.age) || 0,
        gender: item.gender || 'Unknown',
        source: item.source || 'Other',
        notes: item.notes || ''
      };
      
      // Handle arrivalDate
      if (item.arrivalDate) {
        processedItem.arrivalDate = new Date(item.arrivalDate);
      }
      
      console.log(`Processed item ${index + 1}:`, processedItem);
      return processedItem;
    });

    console.log('Items with store:', itemsWithStore);
    console.log('Items with store count:', itemsWithStore.length);
    
    const items = await PetInventoryItem.insertMany(itemsWithStore);
    console.log('Successfully created items:', items.length);
    
    res.status(201).json({
      success: true,
      data: { items },
      message: `${items.length} items created successfully`
    });
  } catch (error) {
    console.error('Bulk create inventory items error:', error);
    console.error('Error stack:', error.stack);
    
    // Provide more detailed error information
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false, 
        message: 'Validation error', 
        errors: errors 
      });
    }
    if (error.name === 'MongoError' && error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Duplicate entry error', 
        error: error.message 
      });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

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

    // Fetch items (scoped if storeFilter is present) and populate images
    const items = await PetInventoryItem.find(baseFilter).populate('imageIds');

    const results = { published: [], skipped: [] }

    for (const item of items) {
      const hasImage = Array.isArray(item.imageIds) && item.imageIds.length > 0;
      const price = Number(item.price || 0);
      if (item.status === 'available_for_sale') {
        results.skipped.push({ id: item._id, reason: 'already_published' });
        continue;
      }
      if (!price || price <= 0) {
        results.skipped.push({ id: item._id, reason: 'price_not_set' });
        continue;
      }
      if (!hasImage) {
        results.skipped.push({ id: item._id, reason: 'no_image' });
        continue;
      }
      item.status = 'available_for_sale';
      await item.save();
      results.published.push(item._id);
    }

    return res.json({ 
      success: true, 
      message: 'Bulk publish completed', 
      data: results 
    });
  } catch (e) {
    console.error('Bulk publish inventory items error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Upload inventory image
const uploadInventoryImage = async (req, res) => {
  try {
    // Derive store filter, but relax for managers missing storeId (dev-friendly)
    const rawStoreFilter = getStoreFilter(req.user) || {}
    const isBlockingFilter = Object.prototype.hasOwnProperty.call(rawStoreFilter, '_id') && rawStoreFilter._id === null
    const isManagerNoStore = (req.user?.role || '').includes('_manager') && !req.user?.storeId
    const storeFilter = (isBlockingFilter || isManagerNoStore) ? {} : rawStoreFilter

    const item = await PetInventoryItem.findOne({ _id: req.params.id, ...storeFilter });
    if (!item) return res.status(404).json({ success: false, message: 'Inventory item not found' });
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    
    // Validate file type
    const allowed = ['image/jpeg','image/png','image/webp','image/gif']
    if (!allowed.includes(req.file.mimetype)) {
      return res.status(400).json({ success: false, message: 'Only image files are allowed' })
    }
    
    // Save file to organized folder structure like adoption system
    const path = require('path')
    const fs = require('fs')
    const crypto = require('crypto')
    const extMap = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' }
    const filename = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}${extMap[req.file.mimetype] || ''}`
    const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'images', 'inventory')
    try { fs.mkdirSync(uploadDir, { recursive: true }) } catch (_) {}
    const filePath = path.join(uploadDir, filename)
    fs.writeFileSync(filePath, req.file.buffer)
    
    // Store URL path in database (not base64)
    const url = `/modules/petshop/uploads/images/inventory/${filename}`;
    
    // Create new image record
    const Image = require('../../../core/models/Image');
    const img = new Image({
      url: url,
      caption: req.body.caption || '',
      isPrimary: req.body.isPrimary === 'true',
      entityType: 'PetInventoryItem',
      entityId: item._id,
      uploadedBy: req.user._id
    });
    await img.save();
    
    // Add image reference to item
    item.imageIds.push(img._id);
    await item.save();
    
    // Re-fetch the item with populated images to ensure frontend gets updated data
    const updatedItem = await PetInventoryItem.findById(item._id).populate('imageIds');
    
    res.status(201).json({ success: true, message: 'Image uploaded', data: { image: img, item: updatedItem } });
  } catch (e) {
    console.error('Upload inventory image error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Upload inventory health document
const uploadInventoryHealthDoc = async (req, res) => {
  try {
    const item = await PetInventoryItem.findOne({ 
      _id: req.params.id, 
      ...getStoreFilter(req.user) 
    });
    
    if (!item) return res.status(404).json({ 
      success: false, 
      message: 'Inventory item not found' 
    });
    
    if (!req.file) return res.status(400).json({ 
      success: false, 
      message: 'No file uploaded' 
    });
    
    const url = `/modules/petshop/uploads/${req.file.filename}`;
    item.healthCertificateUrl = url;
    await item.save();
    
    res.status(201).json({ 
      success: true, 
      message: 'Health document uploaded', 
      data: { url, itemId: item._id } 
    });
  } catch (e) {
    console.error('Upload health doc error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  listInventory,
  createInventoryItem,
  getInventoryItemById,
  updateInventoryItem,
  deleteInventoryItem,
  bulkCreateInventoryItems,
  bulkPublishInventoryItems,
  uploadInventoryImage,
  uploadInventoryHealthDoc
};