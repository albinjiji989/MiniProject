const PetStock = require('../../manager/models/PetStock');
const PetInventoryItem = require('../../manager/models/PetInventoryItem');
const PetCodeGenerator = require('../../../../core/utils/petCodeGenerator');

// List all available pet stocks for users
// Each stock entry represents ONE batch with male & female counts
const listPublicStocks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      speciesId,
      breedId,
      minPrice,
      maxPrice
    } = req.query;

    // Filter: active stocks that are either released OR don't have the field set (legacy stocks)
    const filter = { 
      isActive: true,
      $or: [
        { isReleased: true },
        { isReleased: { $exists: false } }
      ]
    };

    // Apply filters
    if (speciesId) filter.speciesId = speciesId;
    if (breedId) filter.breedId = breedId;

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Get all stocks
    const stocks = await PetStock.find(filter)
      .populate('speciesId', 'name displayName')
      .populate('breedId', 'name')
      .populate('maleImageIds')
      .populate('femaleImageIds')
      .sort({ createdAt: -1 });

    // Also get standalone inventory items (not linked to stocks)
    // These are pets added directly to inventory without creating stock first
    const inventoryFilter = {
      isActive: true,
      status: { $in: ['available_for_sale', 'in_petshop'] },
      $or: [
        { stockId: { $exists: false } },
        { stockId: null }
      ]
    };

    // Apply same filters to inventory items
    if (speciesId) inventoryFilter.speciesId = speciesId;
    if (breedId) inventoryFilter.breedId = breedId;
    if (minPrice || maxPrice) {
      inventoryFilter.price = {};
      if (minPrice) inventoryFilter.price.$gte = Number(minPrice);
      if (maxPrice) inventoryFilter.price.$lte = Number(maxPrice);
    }

    const standaloneItems = await PetInventoryItem.find(inventoryFilter)
      .populate('speciesId', 'name displayName')
      .populate('breedId', 'name')
      .populate('imageIds')
      .sort({ createdAt: -1 });

    // Group standalone items by species, breed, store to create virtual "stocks"
    const standaloneStockMap = new Map();
    
    for (const item of standaloneItems) {
      const speciesKey = item.speciesId?._id?.toString() || '';
      const breedKey = item.breedId?._id?.toString() || '';
      const storeKey = item.storeId?.toString() || '';
      const key = `${storeKey}_${speciesKey}_${breedKey}_${item.age}_${item.ageUnit}`;

      if (!standaloneStockMap.has(key)) {
        standaloneStockMap.set(key, {
          items: [],
          maleItems: [],
          femaleItems: []
        });
      }

      const group = standaloneStockMap.get(key);
      group.items.push(item);
      
      if (item.gender === 'Male') {
        group.maleItems.push(item);
      } else if (item.gender === 'Female') {
        group.femaleItems.push(item);
      }
    }

    // Convert standalone item groups to stock-like objects
    const virtualStocks = Array.from(standaloneStockMap.values()).map(group => {
      const firstItem = group.items[0];
      const maleImages = group.maleItems.length > 0 && group.maleItems[0].imageIds ? group.maleItems[0].imageIds : [];
      const femaleImages = group.femaleItems.length > 0 && group.femaleItems[0].imageIds ? group.femaleItems[0].imageIds : [];
      const combinedImages = maleImages.length > 0 ? maleImages : (femaleImages.length > 0 ? femaleImages : firstItem.imageIds || []);

      return {
        _id: `virtual_${firstItem._id}`,
        stockId: null,
        name: firstItem.name,
        category: firstItem.tags && firstItem.tags.length > 0 ? firstItem.tags[0] : '',
        speciesId: firstItem.speciesId?._id || firstItem.speciesId,
        species: firstItem.speciesId,
        breedId: firstItem.breedId?._id || firstItem.breedId,
        breed: firstItem.breedId,
        age: firstItem.age,
        ageUnit: firstItem.ageUnit,
        color: firstItem.color,
        size: firstItem.size,
        price: firstItem.price,
        discountPrice: firstItem.discountPrice,
        storeId: firstItem.storeId,
        storeName: firstItem.storeName,
        maleCount: group.maleItems.length,
        femaleCount: group.femaleItems.length,
        availableCount: group.items.length,
        counts: {
          total: group.items.length,
          male: group.maleItems.length,
          female: group.femaleItems.length,
          unknown: group.items.length - group.maleItems.length - group.femaleItems.length
        },
        images: combinedImages,
        maleImages: maleImages,
        femaleImages: femaleImages,
        tags: firstItem.tags || [],
        createdAt: firstItem.createdAt,
        updatedAt: firstItem.updatedAt,
        isVirtualStock: true // Mark as virtual stock created from inventory items
      };
    });

    // Combine real stocks and virtual stocks from standalone inventory
    const allStocks = [...stocks, ...virtualStocks];

    // Transform stocks for user display
    // Each stock IS a batch containing pets of same category/species/breed/age
    // Only gender differs within a batch (male/female counts)
    const transformedStocks = await Promise.all(
      allStocks.map(async (stock) => {
        // Skip virtual stocks transformation as they're already in the right format
        if (stock.isVirtualStock) {
          return stock;
        }
        
        // Get category from tags (first tag is typically the category)
        const category = stock.tags && stock.tags.length > 0 ? stock.tags[0] : '';

        // Query actual available inventory items for this stock
        // This excludes already purchased, reserved, or sold pets
        const availableInventory = await PetInventoryItem.find({
          stockId: stock._id,
          status: { $in: ['available', 'available_for_sale'] }
        });

        const actualMaleCount = availableInventory.filter(item => item.gender === 'Male').length;
        const actualFemaleCount = availableInventory.filter(item => item.gender === 'Female').length;
        const actualAvailableCount = actualMaleCount + actualFemaleCount;

        if (actualAvailableCount <= 0) {
          // Skip stocks with no available pets
          return null;
        }

        // Combine images for display (prefer male images, then female)
        const combinedImages = (stock.maleImageIds && stock.maleImageIds.length > 0)
          ? stock.maleImageIds
          : (stock.femaleImageIds || []);

        return {
          _id: stock._id,
          stockId: stock._id,
          name: stock.name,
          category,
          speciesId: stock.speciesId?._id || stock.speciesId,
          species: stock.speciesId,
          breedId: stock.breedId?._id || stock.breedId,
          breed: stock.breedId,
          age: stock.age,
          ageUnit: stock.ageUnit,
          color: stock.color,
          size: stock.size,
          price: stock.price,
          discountPrice: stock.discountPrice,
          storeId: stock.storeId,
          storeName: stock.storeName,
          maleCount: actualMaleCount,  // Actual available count (excluding purchased/reserved)
          femaleCount: actualFemaleCount,  // Actual available count (excluding purchased/reserved)
          availableCount: actualAvailableCount,  // Total available (excluding purchased/reserved)
          totalMaleCount: stock.maleCount || 0,  // Original total inventory
          totalFemaleCount: stock.femaleCount || 0,  // Original total inventory
          // Batch-style counts object so UI can render gender distribution once
          counts: {
            total: actualAvailableCount,
            male: actualMaleCount,
            female: actualFemaleCount,
            unknown: 0
          },
          // Images
          images: combinedImages,
          maleImages: stock.maleImageIds || [],
          femaleImages: stock.femaleImageIds || [],
          tags: stock.tags,
          createdAt: stock.createdAt,
          updatedAt: stock.updatedAt,
          isBatch: true // Mark as batch (one stock = one batch)
        };
      })
    );

    const filteredStocks = transformedStocks.filter(Boolean); // remove nulls / empty stocks

    // Paginate results
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedStocks = filteredStocks.slice(startIndex, endIndex);

    const total = filteredStocks.length;

    res.json({
      success: true,
      data: {
        batches: paginatedStocks, // For dashboards using batch-style cards
        stocks: paginatedStocks,  // Backward compatibility
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get public stocks error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get stock details by ID for users (supports gender-specific IDs like "stockId_male" or "stockId_female")
const getPublicStockById = async (req, res) => {
  try {
    let stockId = req.params.id;
    let requestedGender = null;

    // Check if ID contains gender suffix
    if (stockId.endsWith('_male')) {
      requestedGender = 'male';
      stockId = stockId.replace('_male', '');
    } else if (stockId.endsWith('_female')) {
      requestedGender = 'female';
      stockId = stockId.replace('_female', '');
    }

    const stock = await PetStock.findOne({
      _id: stockId,
      isActive: true,
      $or: [
        { isReleased: true },
        { isReleased: { $exists: false } }
      ]
    }).populate('speciesId', 'name displayName')
      .populate('breedId', 'name')
      .populate('maleImageIds')
      .populate('femaleImageIds');

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: 'Stock not found'
      });
    }

    // Calculate real available counts from inventory items (excluding reserved/sold pets)
    const PetInventoryItem = require('../../manager/models/PetInventoryItem');
    const availableInventory = await PetInventoryItem.find({
      stockId: stockId,
      status: { $in: ['available', 'available_for_sale'] }
    });

    const actualMaleCount = availableInventory.filter(item => item.gender === 'Male').length;
    const actualFemaleCount = availableInventory.filter(item => item.gender === 'Female').length;
    const actualAvailableCount = actualMaleCount + actualFemaleCount;

    // Get category from tags (first tag is typically the category)
    const category = stock.tags && stock.tags.length > 0 ? stock.tags[0] : '';

    // Base stock data
    const baseStockData = {
      stockId: stock._id,
      name: stock.name,
      category: category,
      speciesId: stock.speciesId?._id || stock.speciesId,
      species: stock.speciesId,
      breedId: stock.breedId?._id || stock.breedId,
      breed: stock.breedId,
      age: stock.age,
      ageUnit: stock.ageUnit,
      color: stock.color,
      size: stock.size,
      price: stock.price,
      discountPrice: stock.discountPrice,
      storeId: stock.storeId,
      storeName: stock.storeName,
      tags: stock.tags,
      createdAt: stock.createdAt,
      updatedAt: stock.updatedAt
    };

    // If gender is specified, return only that gender's data
    if (requestedGender === 'male') {
      const transformedStock = {
        ...baseStockData,
        _id: `${stock._id}_male`,
        gender: 'male',
        availableCount: actualMaleCount,
        totalCount: stock.maleCount,
        images: stock.maleImageIds || [],
        maleImages: stock.maleImageIds || [],
        femaleImages: []
      };
      return res.json({ success: true, data: { batch: transformedStock, stock: transformedStock } });
    } else if (requestedGender === 'female') {
      const transformedStock = {
        ...baseStockData,
        _id: `${stock._id}_female`,
        gender: 'female',
        availableCount: actualFemaleCount,
        totalCount: stock.femaleCount,
        images: stock.femaleImageIds || [],
        maleImages: [],
        femaleImages: stock.femaleImageIds || []
      };
      return res.json({ success: true, data: { batch: transformedStock, stock: transformedStock } });
    }

    // If no gender specified, return combined data (backward compatibility)
    const transformedStock = {
      ...baseStockData,
      _id: stock._id,
      maleCount: actualMaleCount,
      femaleCount: actualFemaleCount,
      totalMaleCount: stock.maleCount,
      totalFemaleCount: stock.femaleCount,
      availableCount: actualAvailableCount,
      maleImages: stock.maleImageIds || [],
      femaleImages: stock.femaleImageIds || [],
      images: (stock.maleImageIds && stock.maleImageIds.length > 0)
        ? stock.maleImageIds
        : (stock.femaleImageIds || [])
    };

    res.json({ success: true, data: { batch: transformedStock, stock: transformedStock } });
  } catch (error) {
    console.error('Get public stock error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Reserve pets from stock (creates reservation request for manager approval)
const reservePetsFromStock = async (req, res) => {
  try {
    const { 
      stockId, 
      maleCount = 0, 
      femaleCount = 0, 
      contactInfo = {},
      visitDetails = {},
      notes = ''
    } = req.body;
    const userId = req.user._id;

    // Validate request
    if (maleCount === 0 && femaleCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'Must reserve at least one pet'
      });
    }

    // Find the stock
    const stock = await PetStock.findById(stockId)
      .populate('speciesId', 'name displayName')
      .populate('breedId', 'name');

    if (!stock) {
      return res.status(404).json({
        success: false,
        message: 'Stock not found'
      });
    }

    // Check availability
    if (maleCount > stock.maleCount || femaleCount > stock.femaleCount) {
      return res.status(400).json({
        success: false,
        message: 'Not enough pets available in stock'
      });
    }

    // Calculate total amount
    const totalPets = maleCount + femaleCount;
    const totalAmount = totalPets * stock.price;

    // Create a temporary PetInventoryItem to represent this stock purchase request
    // This will be used as itemId for the reservation
    const tempInventoryItem = new PetInventoryItem({
      name: `${stock.name} (Stock Purchase)`,
      petCode: `STOCK-${Date.now()}`,
      speciesId: stock.speciesId,
      breedId: stock.breedId,
      gender: maleCount > 0 && femaleCount > 0 ? 'Mixed' : (maleCount > 0 ? 'Male' : 'Female'),
      age: stock.age,
      ageUnit: stock.ageUnit,
      color: stock.color,
      size: stock.size,
      price: totalAmount,
      storeId: stock.storeId,
      storeName: stock.storeName,
      status: 'reserved',
      imageIds: stock.maleImageIds?.length > 0 ? stock.maleImageIds : stock.femaleImageIds,
      tags: ['stock-purchase', `stock:${stockId}`, `male:${maleCount}`, `female:${femaleCount}`]
    });

    await tempInventoryItem.save();

    // Create reservation request (requires manager approval)
    const PetReservation = require('../models/PetReservation');
    
    const reservation = new PetReservation({
      itemId: tempInventoryItem._id,
      userId: userId,
      status: 'manager_review', // Requires manager approval
      reservationType: 'reservation',
      contactInfo: {
        phone: contactInfo.phone || req.user.phone || '',
        email: contactInfo.email || req.user.email || '',
        preferredContactMethod: contactInfo.preferredContactMethod || 'both'
      },
      visitDetails: visitDetails.preferredDate ? {
        preferredDate: visitDetails.preferredDate,
        preferredTime: visitDetails.preferredTime || 'morning',
        visitPurpose: 'final_purchase'
      } : undefined,
      paymentInfo: {
        amount: totalAmount
      },
      notes: notes || `Stock purchase request: ${maleCount} male, ${femaleCount} female ${stock.name}`,
      timeline: [{
        status: 'manager_review',
        timestamp: new Date(),
        updatedBy: userId,
        notes: `Purchase request submitted for ${totalPets} pets from stock`
      }]
    });

    await reservation.save();

    // Populate for response
    await reservation.populate([
      { path: 'itemId', populate: [{ path: 'imageIds' }, { path: 'speciesId' }, { path: 'breedId' }] },
      { path: 'userId', select: 'name email phone' }
    ]);

    res.status(201).json({
      success: true,
      data: {
        reservation,
        message: `Purchase request submitted for ${totalPets} pets. Manager will review your request within 1-2 business days.`
      }
    });
  } catch (error) {
    console.error('Reserve pets from stock error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = {
  listPublicStocks,
  getPublicStockById,
  reservePetsFromStock
};