  const Wishlist = require('../models/Wishlist');
const Review = require('../models/Review');
const PetInventoryItem = require('../../manager/models/PetInventoryItem');

// User Functions
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
        select: 'name price images storeName',
        populate: [
          { path: 'speciesId', select: 'name' },
          { path: 'breedId', select: 'name' },
          { path: 'imageIds' } // Populate imageIds
        ]
      })
      .sort({ createdAt: -1 });

    // Manually populate the virtual 'images' field for each wishlist item
    for (const wishlistItem of wishlistItems) {
      if (wishlistItem.itemId) {
        await wishlistItem.itemId.populate('images');
        // Debug log to see what's happening with images
        console.log(`Wishlist item ${wishlistItem._id}: imageIds=${wishlistItem.itemId.imageIds?.length || 0}, images=${wishlistItem.itemId.images?.length || 0}`);
      }
    }

    res.json({
      success: true,
      data: { wishlist: wishlistItems },
    });
  } catch (e) {
    console.error('List wishlist error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

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
    // In a real implementation, you would check if the user has a completed order for this item
    // For now, we'll allow reviews for any item in the inventory
    const item = await PetInventoryItem.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    const review = new Review({
      user: userId,
      item: itemId,
      rating,
      text: comment,
      // type is not a field in the Review model
    });

    await review.save();

    res.status(201).json({
      success: true,
      data: { review },
      message: 'Review created successfully',
    });
  } catch (e) {
    console.error('Create review error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const listItemReviews = async (req, res) => {
  try {
    const { itemId, page = 1, limit = 10 } = req.query;

    const reviews = await Review.find({
      item: itemId,
    })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments({
      item: itemId,
    });

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      },
    });
  } catch (e) {
    console.error('List item reviews error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get purchased pets for the user
const getUserPurchasedPets = async (req, res) => {
  try {
    // Import required models
    const PetReservation = require('../models/PetReservation');
    const Pet = require('../../../../core/models/Pet');
    const PetRegistry = require('../../../../core/models/PetRegistry');
    const PetInventoryItem = require('../../manager/models/PetInventoryItem');
    
    console.log('Fetching purchased pets for user:', req.user._id);
    
    // Get completed reservations (purchased pets) for the current user only
    // Updated to include more statuses that indicate a completed purchase
    const reservations = await PetReservation.find({
      userId: req.user._id,
      status: { $in: ['completed', 'at_owner', 'paid', 'delivered'] }
    })
    .populate({
      path: 'itemId',
      populate: [
        { path: 'speciesId', select: 'name displayName' },
        { path: 'breedId', select: 'name' },
        { path: 'imageIds' } // Populate imageIds to ensure images virtual field can be populated
      ]
    })
    .populate('petId')
    .sort({ createdAt: -1 });
    
    console.log('Found reservations:', reservations.length);
    
    // Log actual database data for debugging
    if (reservations.length > 0) {
      const firstRes = reservations[0];
      console.log('🔍 DATABASE CHECK - First reservation itemId data:', {
        _id: firstRes.itemId?._id,
        petCode: firstRes.itemId?.petCode,
        name: firstRes.itemId?.name,
        imageIds: firstRes.itemId?.imageIds,
        imageIdsLength: firstRes.itemId?.imageIds?.length,
        imageIdsType: typeof firstRes.itemId?.imageIds,
        hasImagesVirtual: firstRes.itemId?.images !== undefined,
        imagesVirtualLength: firstRes.itemId?.images?.length
      });
    }
    
    // Manually populate images for inventory items if needed
    for (const reservation of reservations) {
      if (reservation.itemId && reservation.itemId.imageIds) {
        console.log('📸 Before populate - imageIds:', reservation.itemId.imageIds);
        // Manually populate the virtual 'images' field for the inventory item
        await reservation.itemId.populate('images');
        console.log('📸 After populate - images:', reservation.itemId.images?.length || 0, 'images');
        if (reservation.itemId.images?.length > 0) {
          console.log('📸 First image data:', {
            _id: reservation.itemId.images[0]._id,
            url: reservation.itemId.images[0].url,
            isPrimary: reservation.itemId.images[0].isPrimary,
            entityType: reservation.itemId.images[0].entityType
          });
        }
      }
    }
    
    // Get pets directly from PetRegistry that belong to this user only
    // PetRegistry stores routing info, not full pet data
    // We need to populate the actual pet data from PetInventoryItem
    const registryPets = await PetRegistry.find({
      currentOwnerId: req.user._id,
      currentLocation: 'at_owner',
      source: 'petshop'
    })
    .populate({
      path: 'petShopItemId',
      populate: [
        { path: 'speciesId', select: 'name displayName' },
        { path: 'breedId', select: 'name' },
        { path: 'imageIds' }
      ]
    });

    console.log('Found registry pets:', registryPets.length);
    
    // Manually populate images for registry pets
    for (const registryPet of registryPets) {
      if (registryPet.petShopItemId && registryPet.petShopItemId.imageIds) {
        console.log('📸 REGISTRY - Before populate - imageIds:', registryPet.petShopItemId.imageIds);
        await registryPet.petShopItemId.populate('images');
        console.log('📸 REGISTRY - After populate - images:', registryPet.petShopItemId.images?.length || 0, 'images');
        if (registryPet.petShopItemId.images?.length > 0) {
          console.log('📸 REGISTRY - First image data:', {
            _id: registryPet.petShopItemId.images[0]._id,
            url: registryPet.petShopItemId.images[0].url,
            isPrimary: registryPet.petShopItemId.images[0].isPrimary,
            entityType: registryPet.petShopItemId.images[0].entityType
          });
        }
      }
    }

    // DO NOT populate images from registry - they don't have imageIds
    // Images are stored in PetInventoryItem, not PetRegistry
    
    // Combine both sources and deduplicate
    const allPetsMap = new Map();
    
    // Add pets from reservations
    for (const r of reservations.filter(r => r.itemId)) {
      console.log('Processing reservation:', r._id, 'with item:', r.itemId?.petCode, 'status:', r.status);
      
      // Convert itemId to plain object to get all virtuals including images
      const itemData = r.itemId.toObject();
      
      console.log('📦 PETSHOP - Item data:', {
        _id: itemData._id,
        petCode: itemData.petCode,
        name: itemData.name,
        imageIds: itemData.imageIds,
        imageIdsLength: itemData.imageIds?.length,
        images: itemData.images?.length || 0,
        hasImagesArray: Array.isArray(itemData.images),
        firstImageUrl: itemData.images?.[0]?.url
      });
      
      // Extract clean image data to avoid serialization issues
      const cleanImages = (itemData.images || []).map(img => ({
        _id: img._id,
        url: img.url,
        caption: img.caption,
        isPrimary: img.isPrimary
      }));
      
      const petData = {
        _id: itemData._id,
        petCode: itemData.petCode,
        name: itemData.name || 'Pet',
        images: cleanImages, // Clean image objects
        species: itemData.speciesId ? {
          _id: itemData.speciesId._id,
          name: itemData.speciesId.name,
          displayName: itemData.speciesId.displayName
        } : null,
        breed: itemData.breedId ? {
          _id: itemData.breedId._id,
          name: itemData.breedId.name
        } : null,
        gender: itemData.gender || 'Unknown',
        age: itemData.age,
        ageUnit: itemData.ageUnit,
        color: itemData.color || 'Unknown',
        weight: itemData.weight || { value: 0, unit: 'kg' },
        currentStatus: itemData.status || 'purchased',
        source: 'petshop',
        sourceLabel: 'Purchased from Pet Shop',
        acquiredDate: r.updatedAt
      };
      
      console.log('Adding pet to map:', petData.petCode, 'with', petData.images?.length || 0, 'images');
      
      // Add to map to avoid duplicates
      allPetsMap.set(itemData.petCode || itemData._id.toString(), petData);
    }
    
    // Add pets directly from registry that aren't in reservations
    // Registry pets have petShopItemId which we already populated with full data
    for (const registryPet of registryPets) {
      // Skip if already added from reservations
      if (allPetsMap.has(registryPet.petCode)) continue;
      
      // Skip if no petShopItemId (shouldn't happen for petshop source)
      if (!registryPet.petShopItemId) {
        console.warn('Registry pet has no petShopItemId:', registryPet.petCode);
        continue;
      }
      
      console.log('Adding registry pet:', registryPet.petCode);
      
      // Convert to plain object to get virtuals
      const itemData = registryPet.petShopItemId.toObject();
      
      console.log('📦 REGISTRY - Item data:', {
        _id: itemData._id,
        petCode: itemData.petCode,
        name: itemData.name,
        imageIds: itemData.imageIds,
        imageIdsLength: itemData.imageIds?.length,
        images: itemData.images?.length || 0,
        hasImagesArray: Array.isArray(itemData.images),
        firstImageUrl: itemData.images?.[0]?.url
      });
      
      // Extract clean image data to avoid serialization issues
      const cleanImages = (itemData.images || []).map(img => ({
        _id: img._id,
        url: img.url,
        caption: img.caption,
        isPrimary: img.isPrimary
      }));
      
      const petData = {
        _id: registryPet._id,
        petCode: registryPet.petCode,
        name: itemData.name || registryPet.name || 'Pet',
        images: cleanImages, // Clean image objects
        species: itemData.speciesId ? {
          _id: itemData.speciesId._id,
          name: itemData.speciesId.name,
          displayName: itemData.speciesId.displayName
        } : null,
        breed: itemData.breedId ? {
          _id: itemData.breedId._id,
          name: itemData.breedId.name
        } : null,
        gender: itemData.gender || 'Unknown',
        age: itemData.age,
        ageUnit: itemData.ageUnit,
        color: itemData.color || 'Unknown',
        weight: itemData.weight || { value: 0, unit: 'kg' },
        currentStatus: registryPet.currentStatus || 'purchased',
        source: 'petshop',
        sourceLabel: 'Purchased from Pet Shop',
        acquiredDate: registryPet.lastTransferAt || registryPet.createdAt
      };
      
      console.log('Registry pet data:', petData.petCode, 'has', petData.images?.length || 0, 'images');
      
      allPetsMap.set(registryPet.petCode, petData);
    }
    
    // Convert map to array
    const purchasedPets = Array.from(allPetsMap.values());
    
    console.log('Returning purchased pets:', purchasedPets.length);
    if (purchasedPets.length > 0) {
      console.log('Sample purchased pet being returned:', {
        name: purchasedPets[0].name,
        petCode: purchasedPets[0].petCode,
        imagesCount: purchasedPets[0].images?.length || 0,
        hasImages: !!purchasedPets[0].images?.length,
        firstImageUrl: purchasedPets[0].images?.[0]?.url,
        species: purchasedPets[0].species?.name,
        breed: purchasedPets[0].breed?.name
      });
      console.log('🚀 ACTUAL IMAGES ARRAY BEING SENT:', JSON.stringify(purchasedPets[0].images));
    }
    
    res.json({ success: true, data: { pets: purchasedPets } });
  } catch (e) {
    console.error('Get purchased pets error:', e);
    res.status(500).json({ success: false, message: 'Failed to load purchased pets. Please try again later.' });
  }
};

const listShopReviews = async (req, res) => {
  try {
    const { shopId, page = 1, limit = 10 } = req.query;

    const reviews = await Review.find({
      petShop: shopId,
    })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments({
      petShop: shopId,
    });

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      },
    });
  } catch (e) {
    console.error('List shop reviews error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  addToWishlist,
  removeFromWishlist,
  listMyWishlist,
  createReview,
  listItemReviews,
  listShopReviews,
  getUserPurchasedPets
};