const express = require('express');
const router = express.Router();
const { auth } = require('../../../core/middleware/auth');
const productController = require('./productController');
const reviewController = require('./reviewController');
const cartController = require('./cartController');
const wishlistController = require('./wishlistController');
const orderController = require('./orderController');
const categoryController = require('../manager/categoryController');
const mlRecommendationController = require('./mlRecommendationController');
const recommendationController = require('./recommendationController');

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

// ============ ML RECOMMENDATION ROUTES (PUBLIC) ============
router.get('/ml/recommendations', mlRecommendationController.getMLBreedRecommendations);
router.get('/ml/similar/:productId', mlRecommendationController.getMLSimilarProducts);
router.get('/ml/model-status', mlRecommendationController.getMLModelStatus);

// ============ XAI RECOMMENDATION ROUTES (PUBLIC) ============
// Public endpoint to explain recommendation methodology
router.get('/recommendations/explain-weights', recommendationController.explainWeights);

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


// ============ XAI RECOMMENDATION ROUTES (PROTECTED) ============
// Get personalized recommendations with explanations
router.get('/recommendations', recommendationController.getRecommendations);

// Track product views for recommendation engine
router.post('/products/:productId/view', recommendationController.trackProductView);

// Track recommendation interactions
router.post('/recommendations/:productId/track', recommendationController.trackRecommendationInteraction);

// Provide feedback on recommendations
router.post('/recommendations/:productId/feedback', recommendationController.provideFeedback);

// Get recommendation analytics
router.get('/recommendations/analytics', recommendationController.getRecommendationAnalytics);
// ============ ML RECOMMENDATION ROUTES (PROTECTED) ============
router.get('/ml/personalized', mlRecommendationController.getPersonalizedRecommendations);
router.post('/ml/track-interaction', mlRecommendationController.trackUserInteraction);
router.post('/ml/train-model', mlRecommendationController.trainRecommendationModel); // Admin only in production

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
