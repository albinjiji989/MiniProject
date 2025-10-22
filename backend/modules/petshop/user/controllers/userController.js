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
  listShopReviews
};