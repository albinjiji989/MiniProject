const express = require('express');
const router = express.Router();
const { auth } = require('../../../core/middleware/auth');

// Controllers
const productController = require('./productController');
const cartController = require('./cartController');
const orderController = require('./orderController');
const wishlistController = require('./wishlistController');
const addressController = require('./addressController');
const reviewController = require('./reviewController');

// ============== PRODUCT ROUTES ==============

// Browse products
router.get('/products', productController.getProducts);
router.get('/products/featured', productController.getFeaturedProducts);
router.get('/products/search', productController.searchProducts);
router.get('/products/:id', productController.getProductById);

// Categories
router.get('/categories', productController.getCategories);
router.get('/categories/tree', productController.getCategoryTree);

// Product filters
router.get('/filters', productController.getProductFilters);

// Product reviews (public)
router.get('/products/:productId/reviews', productController.getProductReviews);

// Product analytics
router.post('/products/:productId/track-click', productController.trackProductClick);

// ============== CART ROUTES (Protected) ==============

router.get('/cart', auth, cartController.getCart);
router.post('/cart/add', auth, cartController.addToCart);
router.put('/cart/items/:itemId', auth, cartController.updateCartItem);
router.delete('/cart/items/:itemId', auth, cartController.removeFromCart);
router.delete('/cart/clear', auth, cartController.clearCart);
router.get('/cart/summary', auth, cartController.getCartSummary);

// Coupon
router.post('/cart/coupon/apply', auth, cartController.applyCoupon);
router.delete('/cart/coupon/remove', auth, cartController.removeCoupon);

// ============== ORDER ROUTES (Protected) ==============

router.post('/orders/payment/create', auth, orderController.createPaymentOrder);
router.post('/orders/place', auth, orderController.placeOrder);
router.get('/orders', auth, orderController.getMyOrders);
router.get('/orders/:orderId', auth, orderController.getOrderById);
router.put('/orders/:orderId/cancel', auth, orderController.cancelOrder);
router.post('/orders/:orderId/return', auth, orderController.requestReturn);
router.get('/orders/:orderId/track', auth, orderController.trackOrder);

// ============== WISHLIST ROUTES (Protected) ==============

router.get('/wishlist', auth, wishlistController.getWishlist);
router.post('/wishlist/add', auth, wishlistController.addToWishlist);
router.delete('/wishlist/items/:itemId', auth, wishlistController.removeFromWishlist);
router.get('/wishlist/check/:productId', auth, wishlistController.checkWishlist);
router.post('/wishlist/items/:itemId/move-to-cart', auth, wishlistController.moveToCart);
router.delete('/wishlist/clear', auth, wishlistController.clearWishlist);

// ============== ADDRESS ROUTES (Protected) ==============

router.get('/addresses', auth, addressController.getAddresses);
router.get('/addresses/default', auth, addressController.getDefaultAddress);
router.get('/addresses/:addressId', auth, addressController.getAddressById);
router.post('/addresses', auth, addressController.addAddress);
router.put('/addresses/:addressId', auth, addressController.updateAddress);
router.delete('/addresses/:addressId', auth, addressController.deleteAddress);
router.put('/addresses/:addressId/set-default', auth, addressController.setDefaultAddress);

// ============== REVIEW ROUTES (Protected) ==============

router.post('/reviews/:productId', auth, reviewController.addReview);
router.put('/reviews/:reviewId', auth, reviewController.updateReview);
router.delete('/reviews/:reviewId', auth, reviewController.deleteReview);
router.get('/reviews/my', auth, reviewController.getMyReviews);
router.post('/reviews/:reviewId/helpful', auth, reviewController.markHelpful);
router.post('/reviews/:reviewId/not-helpful', auth, reviewController.markNotHelpful);
router.post('/reviews/:reviewId/report', auth, reviewController.reportReview);
router.post('/reviews/:reviewId/reply', auth, reviewController.addReply);

module.exports = router;
