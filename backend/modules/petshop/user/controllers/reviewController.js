const Review = require('./Review');
const PetInventoryItem = require('../../manager/models/PetInventoryItem');
const PetShop = require('../../manager/models/PetShop');
const ShopOrder = require('./ShopOrder');

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
    // If Review model doesn't support paginate or itemId-based schema, return empty list gracefully
    if (typeof Review.paginate !== 'function') {
      return res.json({
        success: true,
        data: { reviews: [], pagination: { total: 0, pages: 0, page: parseInt(page, 10), limit: parseInt(limit, 10) } }
      });
    }

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
    if (typeof Review.paginate !== 'function') {
      return res.json({
        success: true,
        data: { reviews: [], pagination: { total: 0, pages: 0, page: parseInt(page, 10), limit: parseInt(limit, 10) } }
      });
    }

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

module.exports = {
  createReview,
  listItemReviews,
  listShopReviews,
  updateItemRating
};