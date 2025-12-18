const PetInventoryItem = require('../../manager/models/PetInventoryItem');
const PetShop = require('../../manager/models/PetShop');
const PetReservation = require('../models/PetReservation');
const Wishlist = require('../models/Wishlist');
const Review = require('../models/Review');
const ShopOrder = require('../models/ShopOrder');
const PetStock = require('../../manager/models/PetStock');

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
      .populate('imageIds') // Populate images
      .populate('speciesId', 'name')
      .populate('breedId', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    // Manually populate the virtual 'images' field for each item
    for (const item of items) {
      await item.populate('images');
      // Debug log to see what's happening with images
      console.log(`Pet ${item._id}: imageIds=${item.imageIds?.length || 0}, images=${item.images?.length || 0}`);
    }
    
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
      .populate('imageIds') // Populate images
    
    console.log('Found item:', item ? { id: item._id, status: item.status, name: item.name } : 'null')
    
    if (!item) {
      return res.status(404).json({ success: false, message: 'Pet not found' })
    }
    
    // Manually populate the virtual 'images' field
    await item.populate('images');
    
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
      .populate('imageIds') // Populate images
      
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' })

    // Manually populate the virtual 'images' field
    await item.populate('images');
    
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
      status: 'paid',
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
    
    const reviews = await Review.find({ itemId, type: 'item' })
      .populate('userId', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
      
    const total = await Review.countDocuments({ itemId, type: 'item' });

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page: parseInt(page),
          limit: parseInt(limit),
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
    
    const reviews = await Review.find({ shopId, type: 'shop' })
      .populate('userId', 'name avatar')
      .populate('itemId', 'name images', null, { populate: [{ path: 'imageIds' }] })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
      
    // Manually populate the virtual 'images' field for each item
    for (const review of reviews) {
      if (review.itemId) {
        await review.itemId.populate('images');
      }
    }
    
    const total = await Review.countDocuments({ shopId, type: 'shop' });

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page: parseInt(page),
          limit: parseInt(limit),
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
      numReviews: reviewCount,
    });
  }
};

// Create a purchase reservation
const createPurchaseReservation = async (req, res) => {
  try {
    const { itemId, contactInfo, reservationType, visitDetails, deliveryAddress, notes } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!itemId) {
      return res.status(400).json({
        success: false,
        message: 'itemId is required',
      });
    }

    // Check if item exists and is available
    const item = await PetInventoryItem.findById(itemId);
    console.log('Item found for reservation:', { itemId, item: item ? { id: item._id, storeId: item.storeId, name: item.name } : null });
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    // Check if item is available for purchase
    if (item.status !== 'available_for_sale') {
      return res.status(400).json({
        success: false,
        message: 'Item is not available for purchase',
      });
    }

    // Format reservation data to match schema
    const reservationData = {
      userId,
      itemId,
      // Simplified reservation type
      reservationType: 'reservation',
      status: 'pending',
      contactInfo: {
        phone: contactInfo?.phone,
        email: contactInfo?.email,
        preferredContactMethod: contactInfo?.preferredContactMethod || 'both'
      },
      notes: notes || visitDetails?.notes,
      timeline: [{
        status: 'pending',
        timestamp: new Date(),
        updatedBy: userId,
        notes: 'Reservation created by user'
      }]
    };
    
    console.log('Reservation type mapping:', { 
      frontendType: reservationType, 
      backendType: reservationData.reservationType 
    }); // Debug log

    // Add visit details if provided
    if (visitDetails) {
      reservationData.visitDetails = {
        preferredDate: visitDetails.preferredDate ? new Date(visitDetails.preferredDate) : undefined,
        preferredTime: visitDetails.preferredTime,
        visitPurpose: 'final_purchase'
      };
    }

    // Add delivery address if provided
    if (deliveryAddress) {
      reservationData.deliveryInfo = {
        method: 'delivery',
        address: {
          street: deliveryAddress.street,
          city: deliveryAddress.city,
          state: deliveryAddress.state,
          zipCode: deliveryAddress.zipCode,
          phone: deliveryAddress.phone
        }
      };
    }

    // Create reservation
    const reservation = new PetReservation(reservationData);
    console.log('Creating reservation with data:', reservationData); // Debug log

    await reservation.save();
    console.log('Saved reservation:', reservation); // Debug log
    console.log('Reservation code after save:', reservation.reservationCode); // Debug log

    // Update item status to reserved
    item.status = 'reserved';
    await item.save();

    // Populate item and user info for response
    await reservation.populate('itemId', 'name price images petCode storeId', null, { populate: [{ path: 'imageIds' }] });
    await reservation.populate('userId', 'name email');
    
    // Manually populate the virtual 'images' field
    if (reservation.itemId) {
      await reservation.itemId.populate('images');
    }
    
    // Send notification to pet shop manager
    // In a real implementation, this would send an email/SMS to the manager
    console.log(`New reservation created for pet ${item.name} (${item.petCode}) by user ${req.user.name}`);
    
    // Send notification to user
    console.log(`Confirmation sent to user ${req.user.name} for reservation of pet ${item.name} (${item.petCode})`);

    res.status(201).json({
      success: true,
      data: { reservation },
      message: 'Reservation created successfully. The pet shop manager will review your reservation within 1-2 business days. You will receive an email notification with further instructions based on your communication preferences.',
    });
  } catch (e) {
    console.error('Create purchase reservation error:', e);
    res.status(500).json({ success: false, message: 'Server error: ' + e.message });
  }
};

module.exports = {
  listPublicListings,
  listPublicPetShops,
  getPublicListingById,
  getUserAccessibleItemById,
  addToWishlist,
  removeFromWishlist,
  listMyWishlist,
  createReview,
  listItemReviews,
  listShopReviews,
  createPurchaseReservation
};