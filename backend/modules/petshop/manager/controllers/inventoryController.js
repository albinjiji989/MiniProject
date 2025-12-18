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
    
    // By default, exclude removed_from_sale items unless specifically requested
    if (status !== 'removed_from_sale') {
      filter.status = { $ne: 'removed_from_sale' };
    }
    
    // Apply filters
    if (status) {
      // If status is specifically requested, override the default exclusion
      filter.status = status;
    }
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
      .populate('speciesId', 'name displayName')
      .populate('breedId', 'name')
      .populate('imageIds') // Populate the imageIds field
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Manually populate the virtual 'images' field for each item
    for (const item of items) {
      await item.populate('images');
    }

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

// List reserved pets
const listReservedPets = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      speciesId,
      breedId,
      minPrice,
      maxPrice
    } = req.query;

    // Filter for reserved pets in the manager's store
    const filter = { ...getStoreFilter(req.user), isActive: true, status: 'reserved' };
    
    // Apply additional filters
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
      .populate('speciesId', 'name displayName')
      .populate('breedId', 'name')
      .populate('imageIds')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Manually populate the virtual 'images' field for each item
    for (const item of items) {
      await item.populate('images');
    }

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
    console.error('Get reserved pets error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createInventoryItem = async (req, res) => {
  try {
    // Use UnifiedPetService to create pet shop pet and register in PetRegistry
    const UnifiedPetService = require('../../../../core/services/UnifiedPetService');
    
    // Add createdBy field from authenticated user
    const itemData = { 
      ...req.body, 
      ...getStoreFilter(req.user),
      createdBy: req.user.id  // Explicitly set createdBy from authenticated user
    };
    
    // Handle optional color field
    if (itemData.color !== undefined) {
      itemData.color = itemData.color || ''; // Ensure empty string for null/undefined
    }
    
    // Handle images if provided (convert base64 to file and save path)
    let imageIds = [];
    if (itemData.images && Array.isArray(itemData.images) && itemData.images.length > 0) {
      try {
        const fs = require('fs').promises;
        const Image = require('../../../core/models/Image');
        
        console.log('🖼️  Processing', itemData.images.length, 'images for pet inventory creation using standardized system');
        
        // Handle images using our new standardized image upload system
        const { processEntityImages } = require('../../../../core/utils/imageUploadHandler');
        
        // Create a more specific directory for pet images
        // Process images using our new utility
        const savedImages = await processEntityImages(
          itemData.images, 
          'PetInventoryItem', 
          null, // Will be set after item is created
          req.user.id, 
          'petshop/manager/pets',  // More specific path for pet images
          'manager'
        );
        
        imageIds = savedImages.map(img => img._id);
        console.log('🖼️  Successfully processed images, got imageIds:', imageIds);
        
        // Add imageIds to itemData
        itemData.imageIds = imageIds;
      } catch (imgErr) {
        console.error('❌ Failed to save pet inventory images:', imgErr);
      }
    }
    
    // Remove images from itemData as we'll handle them separately
    delete itemData.images;
    
    // Create pet shop pet using unified service
    const result = await UnifiedPetService.createPetShopPet(itemData, req.user);
    
    // Update image documents with the correct entityId
    if (imageIds.length > 0) {
      const Image = require('../../../core/models/Image');
      await Image.updateMany(
        { _id: { $in: imageIds } },
        { entityId: result.petShopPet._id }
      );
      
      // Add image references to the item
      result.petShopPet.imageIds = imageIds;
      await result.petShopPet.save();
      console.log('🖼️  Updated image documents with entityId:', result.petShopPet._id);
    }
    
    // Populate references for response
    await result.petShopPet.populate('speciesId', 'name displayName');
    await result.petShopPet.populate('breedId', 'name');
    await result.petShopPet.populate('imageIds'); // Also populate images
    
    // Manually populate the virtual 'images' field
    await result.petShopPet.populate('images');
    console.log('🖼️  Final item with images:', result.petShopPet.images);
    
    res.status(201).json({
      success: true,
      data: { 
        item: result.petShopPet,
        registryEntry: result.registryEntry 
      },
      message: 'Inventory item created successfully and registered in central registry'
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
    }).populate('imageIds').populate('speciesId', 'name displayName').populate('breedId', 'name');
    
    if (!item) {
      return res.status(404).json({ 
        success: false, 
        message: 'Inventory item not found' 
      });
    }
    
    // Manually populate the virtual 'images' field to ensure it's available
    await item.populate('images');
    
    res.json({ success: true, data: { item } });
  } catch (error) {
    console.error('Get inventory item error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateInventoryItem = async (req, res) => {
  try {
    // First, find the item to check its current status
    const existingItem = await PetInventoryItem.findOne({ _id: req.params.id, ...getStoreFilter(req.user) });
    
    if (!existingItem) {
      return res.status(404).json({ 
        success: false, 
        message: 'Inventory item not found' 
      });
    }
    
    // If the pet is already sold, we can't modify it
    if (existingItem.status === 'sold') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot modify a sold pet' 
      });
    }
    
    // When updating a pet, if a name is provided and the pet is being marked as sold,
    // this indicates a customer is naming their pet during purchase
    const updateData = { ...req.body };
    
    // If the pet is being marked as sold and a name is provided, 
    // this is when the customer gives the pet its name
    if (updateData.status === 'sold' && updateData.name) {
      console.log(`Customer is naming pet ${req.params.id} as "${updateData.name}" during purchase`);
    }
    
    // Ensure color is handled properly (optional field)
    if (updateData.color !== undefined) {
      updateData.color = updateData.color || ''; // Ensure empty string for null/undefined
    }
    
    const item = await PetInventoryItem.findOneAndUpdate(
      { _id: req.params.id, ...getStoreFilter(req.user) },
      updateData,
      { new: true, runValidators: true }
    ).populate('imageIds'); // Populate images
    
    // Also populate the virtual 'images' field
    await item.populate('images');
    await item.populate('speciesId', 'name displayName');
    await item.populate('breedId', 'name');
    
    // Update the pet registry if status or location changes
    try {
      const UnifiedPetService = require('../../../../core/services/UnifiedPetService');
      
      // Determine new status and location based on update
      let newStatus = item.status;
      let newLocation = 'at_petshop'; // Default location
      
      if (newStatus === 'sold') {
        newLocation = 'sold_to_user';
      } else if (newStatus === 'available_for_sale') {
        newStatus = 'available';
        newLocation = 'at_petshop';
      } else if (newStatus === 'removed_from_sale') {
        newStatus = 'in_petshop';
        newLocation = 'at_petshop';
      }
      
      // Update registry entry
      await UnifiedPetService.updatePetLocationAndStatus(
        item.petCode, 
        newLocation, 
        newStatus, 
        req.user
      );
      
      console.log(`✅ Updated PetRegistry for pet ${item.petCode}: status=${newStatus}, location=${newLocation}`);
    } catch (registryErr) {
      console.warn(`⚠️  Failed to update PetRegistry for pet ${item.petCode}:`, registryErr.message);
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
    // For released pets, we don't actually delete them but mark them as removed from sale
    const item = await PetInventoryItem.findOne({ _id: req.params.id, ...getStoreFilter(req.user) });
    
    if (!item) {
      return res.status(404).json({ 
        success: false, 
        message: 'Inventory item not found' 
      });
    }
    
    // If the pet is already sold, we can't modify it
    if (item.status === 'sold') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot modify a sold pet' 
      });
    }
    
    // Update the pet status to indicate it's removed from sale
    item.status = 'removed_from_sale';
    item.isActive = false;
    await item.save();
    
    // Update the pet registry to reflect the status change
    try {
      const UnifiedPetService = require('../../../../core/services/UnifiedPetService');
      
      // Update registry entry to reflect removal from sale
      await UnifiedPetService.updatePetLocationAndStatus(
        item.petCode, 
        'at_petshop', 
        'in_petshop', 
        req.user
      );
      
      console.log(`✅ Updated PetRegistry for pet ${item.petCode}: status=in_petshop, location=at_petshop`);
    } catch (registryErr) {
      console.warn(`⚠️  Failed to update PetRegistry for pet ${item.petCode}:`, registryErr.message);
    }
    
    res.json({
      success: true,
      message: 'Inventory item removed from sale successfully'
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
    
    const itemsWithStore = [];
    for (let i = 0; i < itemsData.length; i++) {
      const item = itemsData[i];
      console.log(`Processing item ${i}:`, item);
      
      // Process images for this item if they exist
      let imageIds = [];
      if (item.images && Array.isArray(item.images) && item.images.length > 0) {
        try {
          const { processEntityImages } = require('../../../../core/utils/imageUploadHandler');
          const Image = require('../../../core/models/Image');
          
          const savedImages = await processEntityImages(
            item.images,
            'PetInventoryItem',
            null, // Will be set after item is created
            req.user.id,
            'petshop/manager/pets',
            'manager'
          );
          
          imageIds = savedImages.map(img => img._id);
          console.log(`🖼️  Processed images for item ${i}, got imageIds:`, imageIds);
        } catch (imgErr) {
          console.error(`Error processing images for item ${i}:`, imgErr);
        }
      }
      
      // Remove images from item data
      delete item.images;
      
      // Ensure proper data types and include all required fields
      const processedItem = {
        ...item,
        ...storeFilter,
        createdBy: req.user.id,
        name: item.name || 'Unnamed Pet', // Provide default name if not specified
        categoryId: item.categoryId,
        speciesId: item.speciesId,
        breedId: item.breedId,
        unitCost: parseFloat(item.unitCost) || 0,
        price: parseFloat(item.price) || 0,
        quantity: 1, // Each pet is a single item
        age: parseFloat(item.age) || 0,
        gender: item.gender || 'Unknown',
        color: item.color || '',
        source: item.source || 'Other',
        notes: item.notes || '',
        size: item.size || 'medium'
      };
      
      // Handle arrivalDate
      if (item.arrivalDate) {
        processedItem.arrivalDate = new Date(item.arrivalDate);
      }
      
      // Add imageIds to processed item
      if (imageIds.length > 0) {
        processedItem.imageIds = imageIds;
      }
      
      console.log(`Processed item ${i + 1}:`, processedItem);
      itemsWithStore.push(processedItem);
    }

    console.log('Items with store:', itemsWithStore);
    console.log('Items with store count:', itemsWithStore.length);
    
    // Create items one by one to properly handle images and registry registration
    const createdItems = [];
    for (let i = 0; i < itemsWithStore.length; i++) {
      try {
        const itemData = itemsWithStore[i];
        const item = new PetInventoryItem(itemData);
        await item.save();
        
        // Update image documents with the correct entityId
        if (itemData.imageIds && itemData.imageIds.length > 0) {
          const Image = require('../../../core/models/Image');
          await Image.updateMany(
            { _id: { $in: itemData.imageIds } },
            { entityId: item._id }
          );
          console.log(`🖼️  Updated image documents for item ${i} with entityId:`, item._id);
        }
        
        // Register the pet in the centralized PetRegistry
        try {
          const PetRegistryService = require('../../../../core/services/petRegistryService');
          const Species = require('../../../core/models/Species');
          const Breed = require('../../../core/models/Breed');
          
          // Get species and breed details for registry
          const speciesDoc = await Species.findById(itemData.speciesId);
          const breedDoc = await Breed.findById(itemData.breedId);
          
          // Populate images to include in registry
          await item.populate('images');
          
          // Pass imageIds (references) instead of full image objects
          const itemImageIds = item.imageIds || [];
          
          console.log(`📋 Registering PetInventoryItem ${i} in PetRegistry:`, {
            petCode: item.petCode,
            name: item.name,
            imageIdsCount: itemImageIds.length,
            imageIds: itemImageIds
          });
          
          // Create registry entry with source tracking and image references
          const registryDoc = await PetRegistryService.upsertAndSetState({
            petCode: item.petCode,
            name: item.name,
            species: speciesDoc?._id,
            breed: breedDoc?._id,
            images: itemImageIds, // Pass Image model IDs
            source: 'petshop',
            petShopItemId: item._id,
            actorUserId: req.user.id,
            firstAddedSource: 'pet_shop',
            firstAddedBy: req.user.id
          }, {
            currentLocation: 'at_petshop',
            currentStatus: item.status === 'available_for_sale' ? 'available' : 'in_petshop',
            lastTransferAt: new Date()
          });
          
          console.log(`✅ PetRegistry registered for PetInventoryItem ${i}:`, {
            _id: registryDoc._id,
            petCode: registryDoc.petCode,
            imageIds: registryDoc.imageIds,
            imageIdsCount: registryDoc.imageIds?.length || 0
          });
        } catch (regErr) {
          console.warn(`❌ PetRegistry registration failed for item ${i} (pet shop inventory item create):`, regErr?.message || regErr);
          console.error(regErr);
        }
        
        // Populate references
        await item.populate('speciesId', 'name displayName');
        await item.populate('breedId', 'name');
        await item.populate('imageIds');
        
        // Also populate the virtual 'images' field with error handling
        try {
          await item.populate('images');
          console.log(`🖼️  Final item ${i} with images:`, item.images);
        } catch (populateErr) {
          console.warn(`⚠️  Could not populate virtual 'images' field for item ${i}:`, populateErr.message);
          // This is not critical, continue with the item
        }
        
        createdItems.push(item);
      } catch (itemErr) {
        console.error(`Error creating item ${i}:`, itemErr);
        throw new Error(`Failed to create item ${i + 1}: ${itemErr.message}`);
      }
    }
    
    console.log('Successfully created items:', createdItems.length);
    
    res.status(201).json({
      success: true,
      data: { items: createdItems },
      message: `${createdItems.length} items created successfully`
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

// Bulk create stock items
const bulkCreateStockItems = async (req, res) => {
  try {
    console.log('=== BULK CREATE STOCK ITEMS ===');
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
    
    const itemsWithStore = [];
    for (let i = 0; i < itemsData.length; i++) {
      const item = itemsData[i];
      console.log(`Processing item ${i}:`, item);
      
      // Process male images for this item if they exist
      let maleImageIds = [];
      if (item.maleImages && Array.isArray(item.maleImages) && item.maleImages.length > 0) {
        try {
          const { processEntityImages } = require('../../../../core/utils/imageUploadHandler');
          
          const savedImages = await processEntityImages(
            item.maleImages,
            'PetStock',
            null, // Will be set after item is created
            req.user.id,
            'petshop/manager/stocks/male',
            'manager'
          );
          
          maleImageIds = savedImages.map(img => img._id);
          console.log(`🖼️  Processed male images for item ${i}, got imageIds:`, maleImageIds);
        } catch (imgErr) {
          console.error(`Error processing male images for item ${i}:`, imgErr);
        }
      }
      
      // Process female images for this item if they exist
      let femaleImageIds = [];
      if (item.femaleImages && Array.isArray(item.femaleImages) && item.femaleImages.length > 0) {
        try {
          const { processEntityImages } = require('../../../../core/utils/imageUploadHandler');
          
          const savedImages = await processEntityImages(
            item.femaleImages,
            'PetStock',
            null, // Will be set after item is created
            req.user.id,
            'petshop/manager/stocks/female',
            'manager'
          );
          
          femaleImageIds = savedImages.map(img => img._id);
          console.log(`🖼️  Processed female images for item ${i}, got imageIds:`, femaleImageIds);
        } catch (imgErr) {
          console.error(`Error processing female images for item ${i}:`, imgErr);
        }
      }
      
      // Remove images from item data
      delete item.maleImages;
      delete item.femaleImages;
      
      // Ensure proper data types and include all required fields
      const processedItem = {
        ...item,
        ...storeFilter,
        createdBy: req.user.id,
        name: item.name || 'Unnamed Pet Stock',
        speciesId: item.speciesId,
        breedId: item.breedId,
        price: parseFloat(item.price) || 0,
        maleCount: parseInt(item.maleCount) || 0,
        femaleCount: parseInt(item.femaleCount) || 0,
        age: parseFloat(item.age) || 0,
        ageUnit: item.ageUnit || 'months',
        color: item.color || '',
        size: item.size || 'medium'
      };
      
      // Add imageIds to processed item
      if (maleImageIds.length > 0) {
        processedItem.maleImageIds = maleImageIds;
      }
      
      if (femaleImageIds.length > 0) {
        processedItem.femaleImageIds = femaleImageIds;
      }
      
      console.log(`Processed item ${i + 1}:`, processedItem);
      itemsWithStore.push(processedItem);
    }

    console.log('Items with store:', itemsWithStore);
    console.log('Items with store count:', itemsWithStore.length);
    
    // Create items using insertMany for better performance
    const createdItems = await PetStock.insertMany(itemsWithStore);
    
    // Update image documents with the correct entityId for all items
    const allImageIds = [];
    const imageUpdates = [];
    
    for (let i = 0; i < createdItems.length; i++) {
      const createdItem = createdItems[i];
      const originalItem = itemsWithStore[i];
      
      if (originalItem.maleImageIds && originalItem.maleImageIds.length > 0) {
        originalItem.maleImageIds.forEach(id => {
          imageUpdates.push({
            updateOne: {
              filter: { _id: id },
              update: { entityId: createdItem._id }
            }
          });
        });
      }
      
      if (originalItem.femaleImageIds && originalItem.femaleImageIds.length > 0) {
        originalItem.femaleImageIds.forEach(id => {
          imageUpdates.push({
            updateOne: {
              filter: { _id: id },
              update: { entityId: createdItem._id }
            }
          });
        });
      }
    }
    
    // Perform bulk image updates
    if (imageUpdates.length > 0) {
      const Image = require('../../../core/models/Image');
      await Image.bulkWrite(imageUpdates);
      console.log(`🖼️  Updated ${imageUpdates.length} image documents with entityIds`);
    }
    
    // Populate references for response
    for (let i = 0; i < createdItems.length; i++) {
      await createdItems[i].populate('speciesId', 'name displayName');
      await createdItems[i].populate('breedId', 'name');
      await createdItems[i].populate('maleImageIds');
      await createdItems[i].populate('femaleImageIds');
    }
    
    console.log('Successfully created stock items:', createdItems.length);
    
    res.status(201).json({
      success: true,
      data: { items: createdItems },
      message: `${createdItems.length} stock items created successfully`
    });
  } catch (error) {
    console.error('Bulk create stock items error:', error);
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

// Get inventory data for ML analysis
const getInventoryForML = async (req, res) => {
  try {
    const { 
      status = 'available_for_sale',
      limit = 100
    } = req.query;

    const filter = { ...getStoreFilter(req.user), isActive: true };
    
    // Apply status filter
    if (status) filter.status = status;

    const items = await PetInventoryItem.find(filter)
      .populate('speciesId', 'name displayName')
      .populate('breedId', 'name')
      .limit(limit * 1);

    // Transform data for ML service
    const mlData = items.map(item => ({
      pet_id: item._id,
      name: item.name,
      species: item.speciesId?.name || 'Unknown',
      breed: item.breedId?.name || 'Unknown',
      age: item.age || 0,
      size: item.size || 'medium',
      gender: item.gender || 'Unknown',
      color: item.color || '',
      status: item.status,
      price: item.price || 0,
      date_added: item.createdAt,
      last_updated: item.updatedAt,
      is_available: item.isAvailable || false
    }));

    res.json({
      success: true,
      data: {
        items: mlData,
        count: mlData.length
      }
    });
  } catch (error) {
    console.error('Get inventory for ML error:', error);
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
    
    // Use the standardized image upload handler for consistent file handling
    const { processEntityImages } = require('../../../../core/utils/imageUploadHandler');
    const Image = require('../../../../core/models/Image');
    
    // Create a more specific directory for pet images: uploads/petshop/manager/pets
    const savedImages = await processEntityImages(
      [{ url: `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}` }], 
      'PetInventoryItem', 
      item._id, 
      req.user._id, 
      'petshop/manager/pets',  // More specific path for pet images
      'manager'
    );
    
    if (savedImages.length === 0) {
      throw new Error('Failed to save image');
    }
    
    const savedImage = savedImages[0];
    
    // Add image reference to item
    item.imageIds.push(savedImage._id);
    await item.save();
    
    // Re-fetch the item with populated images to ensure frontend gets updated data
    const updatedItem = await PetInventoryItem.findById(item._id).populate('imageIds');
    // Also populate the virtual 'images' field with error handling
    try {
      await updatedItem.populate('images');
    } catch (populateErr) {
      console.warn('⚠️  Could not populate virtual "images" field:', populateErr.message);
      // Continue without the virtual field if population fails
    }
    await updatedItem.populate('speciesId', 'name displayName');
    await updatedItem.populate('breedId', 'name');
    
    res.status(201).json({ success: true, message: 'Image uploaded', data: { image: savedImage, item: updatedItem } });
  } catch (e) {
    console.error('Upload inventory image error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Remove inventory image
const removeInventoryImage = async (req, res) => {
  try {
    const { id, imageId } = req.params;
    
    // Derive store filter
    const rawStoreFilter = getStoreFilter(req.user) || {};
    const isBlockingFilter = Object.prototype.hasOwnProperty.call(rawStoreFilter, '_id') && rawStoreFilter._id === null;
    const isManagerNoStore = (req.user?.role || '').includes('_manager') && !req.user?.storeId;
    const storeFilter = (isBlockingFilter || isManagerNoStore) ? {} : rawStoreFilter;

    // Find the inventory item
    const item = await PetInventoryItem.findOne({ _id: id, ...storeFilter });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Inventory item not found' });
    }
    
    // Check if the image exists in the item's imageIds
    const imageIndex = item.imageIds.findIndex(imgId => imgId.toString() === imageId);
    if (imageIndex === -1) {
      return res.status(404).json({ success: false, message: 'Image not found in inventory item' });
    }
    
    // Remove the image reference from the item
    item.imageIds.splice(imageIndex, 1);
    await item.save();
    
    // Also delete the actual image document from the database
    const Image = require('../../../../core/models/Image');
    await Image.findByIdAndDelete(imageId);
    
    // Re-fetch the item with populated images to ensure frontend gets updated data
    const updatedItem = await PetInventoryItem.findById(item._id).populate('imageIds');
    // Also populate the virtual 'images' field
    await updatedItem.populate('images');
    await updatedItem.populate('speciesId', 'name displayName');
    await updatedItem.populate('breedId', 'name');
    
    res.json({ success: true, message: 'Image removed successfully', data: { item: updatedItem } });
  } catch (e) {
    console.error('Remove inventory image error:', e);
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
    
    // Upload to Cloudinary instead of local storage
    const cloudinary = require('cloudinary').v2;
    
    // Convert buffer to base64 for Cloudinary upload
    const base64Data = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    
    // Generate a unique filename
    const crypto = require('crypto');
    const uniqueId = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    const safeName = (req.file.originalname || 'health-document').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${safeName}-${timestamp}-${uniqueId}`;
    
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(base64Data, {
      folder: 'petshop/manager/health-docs',
      public_id: filename,
      overwrite: false,
      resource_type: req.file.mimetype.startsWith('image/') ? 'image' : 'raw'
    });
    
    const url = result.secure_url;
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
  listReservedPets,
  createInventoryItem,
  getInventoryItemById,
  updateInventoryItem,
  deleteInventoryItem,
  bulkCreateInventoryItems,
  bulkCreateStockItems,
  bulkPublishInventoryItems,
  uploadInventoryImage,
  removeInventoryImage,
  uploadInventoryHealthDoc,
  getInventoryForML  // Add the new function to exports
};