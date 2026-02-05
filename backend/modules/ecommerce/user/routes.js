const express = require('express');
const router = express.Router();
const { auth } = require('../../../core/middleware/auth');
const productController = require('./productController');
const reviewController = require('./reviewController');
const cartController = require('./cartController');
const wishlistController = require('./wishlistController');
const orderController = require('./orderController');
const categoryController = require('../manager/categoryController');
const aiRecommendationController = require('./controllers/aiRecommendationController');

// Optional auth middleware - attaches user if token exists, but doesn't block request
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const User = require('../../../core/models/User');
      const user = await User.findById(decoded.user.id).select('-password');
      if (user && user.isActive) {
        req.user = user;
      }
    }
  } catch (error) {
    // Silently fail - user remains undefined
  }
  next();
};

// ============ CATEGORY ROUTES (PUBLIC) ============
router.get('/categories', categoryController.getAllCategories);
router.get('/categories/tree', categoryController.getCategoryTree);
router.get('/categories/:id', categoryController.getCategory);

// ============ PUBLIC PRODUCT ROUTES ============
router.get('/products', productController.browseProducts);
router.get('/products/featured', productController.getFeaturedProducts);
router.get('/products/deals', productController.getDeals);
router.get('/products/search-suggestions', productController.getSearchSuggestions);
router.get('/products/:slug', productController.getProductDetails);
router.post('/products/:productId/view', optionalAuth, aiRecommendationController.trackView);

// ============ AI/ML RECOMMENDATION ROUTES (PUBLIC) ============
router.get('/ai/recommendations', optionalAuth, aiRecommendationController.getRecommendations);
router.get('/ai/recommendations/best-sellers', aiRecommendationController.getBestSellers);
router.get('/ai/recommendations/trending', aiRecommendationController.getTrending);
router.get('/ai/recommendations/most-bought', aiRecommendationController.getMostBought);

// ============ REVIEW ROUTES ============
router.get('/products/:productId/reviews', reviewController.getProductReviews);

// Protected routes (require authentication)
router.use(auth);

router.post('/reviews', reviewController.createReview);
router.put('/reviews/:id', reviewController.updateReview);
router.delete('/reviews/:id', reviewController.deleteReview);
router.post('/reviews/:id/helpful', reviewController.markHelpful);

// ============ CART ROUTES ============
router.get('/cart', cartController.getCart);
router.post('/cart', cartController.addToCart);
router.put('/cart/:itemId', cartController.updateCartItem);
router.delete('/cart/:itemId', cartController.removeFromCart);
router.delete('/cart', cartController.clearCart);

// ============ WISHLIST ROUTES ============
router.get('/wishlist', wishlistController.getWishlist);
router.post('/wishlist', wishlistController.addToWishlist);
router.delete('/wishlist/:productId', wishlistController.removeFromWishlist);

// ============ AI/ML RECOMMENDATION TRACKING (PROTECTED) ============
router.post('/ai/recommendations/track-view', aiRecommendationController.trackView);
router.post('/ai/recommendations/track-click', aiRecommendationController.trackClick);
router.post('/ai/recommendations/track-purchase', aiRecommendationController.trackPurchase);

// ============ ORDER ROUTES ============
router.get('/orders', orderController.getUserOrders);
router.get('/orders/:id', orderController.getOrderDetails);
router.post('/orders', orderController.createOrder);
router.post('/orders/:id/cancel', orderController.cancelOrder);

// Payment routes
router.post('/orders/payment/create', orderController.createPaymentOrder);
router.post('/orders/payment/verify', orderController.verifyPaymentAndCreateOrder);
router.post('/orders/cod', orderController.createCODOrder);

module.exports = router;
