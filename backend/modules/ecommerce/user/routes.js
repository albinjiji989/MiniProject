const express = require('express');
const router = express.Router();
const { auth } = require('../../../core/middleware/auth');
const productController = require('./productController');
const reviewController = require('./reviewController');
const cartController = require('./cartController');
const wishlistController = require('./wishlistController');
const orderController = require('./orderController');
const categoryController = require('../manager/categoryController');

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

// ============ ORDER ROUTES ============
router.get('/orders', orderController.getUserOrders);
router.get('/orders/:id', orderController.getOrderDetails);
router.post('/orders', orderController.createOrder);
router.post('/orders/:id/cancel', orderController.cancelOrder);

module.exports = router;
