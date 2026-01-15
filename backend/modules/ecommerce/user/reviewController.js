const ProductReview = require('../models/ProductReview');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { uploadReviewImages, deleteImages } = require('../../../config/cloudinary');

/**
 * Create product review with images
 */
exports.createReview = [
  uploadReviewImages.array('images', 5), // Max 5 images per review
  async (req, res) => {
    try {
      const { productId, rating, title, comment } = req.body;

      // Verify user purchased the product
      const hasPurchased = await Order.exists({
        user: req.user.id,
        'items.product': productId,
        status: 'delivered'
      });

      if (!hasPurchased) {
        return res.status(403).json({
          success: false,
          message: 'You can only review products you have purchased'
        });
      }

      // Check if user already reviewed
      const existingReview = await ProductReview.findOne({
        product: productId,
        user: req.user.id
      });

      if (existingReview) {
        return res.status(400).json({
          success: false,
          message: 'You have already reviewed this product'
        });
      }

      // Format uploaded images
      const images = req.files ? req.files.map(file => ({
        url: file.path,
        publicId: file.filename
      })) : [];

      // Create review
      const review = new ProductReview({
        product: productId,
        user: req.user.id,
        rating: parseInt(rating),
        title,
        comment,
        images,
        isVerifiedPurchase: true
      });

      await review.save();

      // Update product rating
      const product = await Product.findById(productId);
      if (product) {
        product.updateRating(parseInt(rating));
        await product.save();
      }

      await review.populate('user', 'name profileImage');

      res.status(201).json({
        success: true,
        message: 'Review submitted successfully',
        data: review
      });
    } catch (error) {
      console.error('Error creating review:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating review',
        error: error.message
      });
    }
  }
];

/**
 * Get product reviews
 */
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, rating, sortBy = 'helpful' } = req.query;

    const query = { product: productId };
    if (rating) query.rating = parseInt(rating);

    let sort = {};
    switch (sortBy) {
      case 'recent':
        sort = { createdAt: -1 };
        break;
      case 'helpful':
        sort = { helpfulCount: -1, createdAt: -1 };
        break;
      case 'rating-high':
        sort = { rating: -1, createdAt: -1 };
        break;
      case 'rating-low':
        sort = { rating: 1, createdAt: -1 };
        break;
      default:
        sort = { helpfulCount: -1 };
    }

    const reviews = await ProductReview.find(query)
      .populate('user', 'name profileImage')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const count = await ProductReview.countDocuments(query);

    // Get rating distribution
    const distribution = await ProductReview.aggregate([
      { $match: { product: productId } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      }
    ]);

    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    distribution.forEach(d => {
      ratingDistribution[d._id] = d.count;
    });

    res.json({
      success: true,
      data: reviews,
      ratingDistribution,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
};

/**
 * Update review
 */
exports.updateReview = [
  uploadReviewImages.array('newImages', 5),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { rating, title, comment, removeImageIds } = req.body;

      const review = await ProductReview.findOne({
        _id: id,
        user: req.user.id
      });

      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found'
        });
      }

      // Update fields
      if (rating) review.rating = parseInt(rating);
      if (title) review.title = title;
      if (comment) review.comment = comment;

      // Remove images
      if (removeImageIds && removeImageIds.length > 0) {
        const publicIds = removeImageIds.map(id => 
          review.images.find(img => img._id.toString() === id)?.publicId
        ).filter(Boolean);
        
        if (publicIds.length > 0) {
          await deleteImages(publicIds);
        }
        
        review.images = review.images.filter(
          img => !removeImageIds.includes(img._id.toString())
        );
      }

      // Add new images
      if (req.files && req.files.length > 0) {
        const newImages = req.files.map(file => ({
          url: file.path,
          publicId: file.filename
        }));
        review.images.push(...newImages);
      }

      await review.save();

      // Update product rating if rating changed
      if (rating) {
        const product = await Product.findById(review.product);
        if (product) {
          // Recalculate rating
          const allReviews = await ProductReview.find({ product: product._id });
          const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
          product.ratings.average = totalRating / allReviews.length;
          product.ratings.count = allReviews.length;
          
          // Update distribution
          product.ratings.distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
          allReviews.forEach(r => {
            product.ratings.distribution[r.rating]++;
          });
          
          await product.save();
        }
      }

      await review.populate('user', 'name profileImage');

      res.json({
        success: true,
        message: 'Review updated successfully',
        data: review
      });
    } catch (error) {
      console.error('Error updating review:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating review',
        error: error.message
      });
    }
  }
];

/**
 * Delete review
 */
exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await ProductReview.findOne({
      _id: id,
      user: req.user.id
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Delete images from Cloudinary
    if (review.images && review.images.length > 0) {
      const publicIds = review.images.map(img => img.publicId);
      await deleteImages(publicIds);
    }

    await review.deleteOne();

    // Update product rating
    const product = await Product.findById(review.product);
    if (product) {
      const allReviews = await ProductReview.find({ product: product._id });
      
      if (allReviews.length === 0) {
        product.ratings = {
          average: 0,
          count: 0,
          distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        };
      } else {
        const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
        product.ratings.average = totalRating / allReviews.length;
        product.ratings.count = allReviews.length;
        
        product.ratings.distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        allReviews.forEach(r => {
          product.ratings.distribution[r.rating]++;
        });
      }
      
      await product.save();
    }

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting review',
      error: error.message
    });
  }
};

/**
 * Mark review as helpful
 */
exports.markHelpful = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await ProductReview.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user already marked as helpful
    if (review.helpfulBy.includes(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'You have already marked this review as helpful'
      });
    }

    review.helpfulCount += 1;
    review.helpfulBy.push(req.user.id);
    await review.save();

    res.json({
      success: true,
      message: 'Marked as helpful',
      data: { helpfulCount: review.helpfulCount }
    });
  } catch (error) {
    console.error('Error marking review as helpful:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking review as helpful',
      error: error.message
    });
  }
};

module.exports = exports;
