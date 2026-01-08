const ProductReview = require('../models/ProductReview');
const Order = require('../models/Order');
const Product = require('../models/Product');

/**
 * Add product review
 */
exports.addReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const {
      orderId,
      rating,
      title,
      comment,
      images,
      videos,
      petInfo
    } = req.body;
    
    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    // Check if user already reviewed this product
    const existingReview = await ProductReview.findOne({
      product: productId,
      user: req.user._id
    });
    
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product'
      });
    }
    
    // Verify purchase if orderId provided
    let isVerifiedPurchase = false;
    if (orderId) {
      const order = await Order.findOne({
        _id: orderId,
        customer: req.user._id,
        status: 'delivered',
        'items.product': productId
      });
      
      if (order) {
        isVerifiedPurchase = true;
      }
    }
    
    // Create review
    const review = new ProductReview({
      product: productId,
      user: req.user._id,
      order: orderId,
      rating: {
        overall: rating.overall,
        quality: rating.quality,
        value: rating.value,
        packaging: rating.packaging
      },
      title,
      comment,
      images,
      videos,
      petInfo,
      isVerifiedPurchase,
      status: 'approved' // Auto-approve, or set to 'pending' for moderation
    });
    
    await review.save();
    
    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review
    });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Update review
 */
exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    
    const review = await ProductReview.findOne({
      _id: reviewId,
      user: req.user._id
    });
    
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    
    // Update allowed fields
    const { rating, title, comment, images, videos, petInfo } = req.body;
    
    if (rating) {
      review.rating = {
        overall: rating.overall || review.rating.overall,
        quality: rating.quality || review.rating.quality,
        value: rating.value || review.rating.value,
        packaging: rating.packaging || review.rating.packaging
      };
    }
    
    if (title !== undefined) review.title = title;
    if (comment !== undefined) review.comment = comment;
    if (images !== undefined) review.images = images;
    if (videos !== undefined) review.videos = videos;
    if (petInfo !== undefined) review.petInfo = petInfo;
    
    // Reset to pending if significantly changed
    review.status = 'approved'; // Or 'pending' for re-moderation
    
    await review.save();
    
    res.json({
      success: true,
      message: 'Review updated successfully',
      data: review
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Delete review
 */
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    
    const review = await ProductReview.findOne({
      _id: reviewId,
      user: req.user._id
    });
    
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    
    await review.remove();
    
    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get user's reviews
 */
exports.getMyReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [reviews, total] = await Promise.all([
      ProductReview.find({ user: req.user._id })
        .populate('product', 'name slug images')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit)),
      ProductReview.countDocuments({ user: req.user._id })
    ]);
    
    res.json({
      success: true,
      data: reviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get my reviews error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Mark review as helpful
 */
exports.markHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;
    
    const review = await ProductReview.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    
    review.markHelpful(req.user._id);
    await review.save();
    
    res.json({
      success: true,
      message: 'Marked as helpful',
      helpfulCount: review.helpful.count
    });
  } catch (error) {
    console.error('Mark helpful error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Mark review as not helpful
 */
exports.markNotHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;
    
    const review = await ProductReview.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    
    review.markNotHelpful(req.user._id);
    await review.save();
    
    res.json({
      success: true,
      message: 'Marked as not helpful',
      notHelpfulCount: review.notHelpful.count
    });
  } catch (error) {
    console.error('Mark not helpful error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Report review
 */
exports.reportReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reason } = req.body;
    
    const review = await ProductReview.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    
    // Check if user already reported
    const alreadyReported = review.reports.some(
      r => r.user.toString() === req.user._id.toString()
    );
    
    if (alreadyReported) {
      return res.status(400).json({
        success: false,
        message: 'You have already reported this review'
      });
    }
    
    review.reports.push({
      user: req.user._id,
      reason,
      createdAt: new Date()
    });
    
    // Auto-flag if multiple reports
    if (review.reports.length >= 3) {
      review.status = 'reported';
    }
    
    await review.save();
    
    res.json({
      success: true,
      message: 'Review reported successfully'
    });
  } catch (error) {
    console.error('Report review error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Add reply to review
 */
exports.addReply = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { comment } = req.body;
    
    const review = await ProductReview.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    
    review.replies.push({
      user: req.user._id,
      comment,
      createdAt: new Date()
    });
    
    await review.save();
    
    res.json({
      success: true,
      message: 'Reply added successfully',
      data: review
    });
  } catch (error) {
    console.error('Add reply error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
