const express = require('express');
const router = express.Router();
const { auth } = require('../../../../core/middleware/auth');
const { body } = require('express-validator');

// Import user controllers
const publicController = require('../controllers/publicController');
const userController = require('../controllers/userController');
const reservationController = require('../controllers/reservationController');
const paymentController = require('../controllers/paymentController');
const userAddressController = require('../controllers/userAddressController');
const storeController = require('../../manager/controllers/storeController');
const enhancedReservationController = require('../../manager/controllers/enhancedReservationController');
const petHistoryController = require('../controllers/petHistoryController');

// User dashboard stats (auth required but no module permission)
router.get('/stats', auth, storeController.getUserPetShopStats);

// Public listings (no auth)
router.get('/public/listings', publicController.listPublicListings);
router.get('/public/listings/:id', publicController.getPublicListingById);
// Authenticated listing access (user can view if they have reservation/bought it)
router.get('/user/listings/:id', auth, publicController.getUserAccessibleItemById);
// Public pet shops (no auth)
router.get('/public/shops', publicController.listPublicPetShops);
// Public wishlist (user auth)
router.post('/public/wishlist', auth, userController.addToWishlist);
router.get('/public/wishlist', auth, userController.listMyWishlist);
router.delete('/public/wishlist/:itemId', auth, userController.removeFromWishlist);

router.post('/public/reviews', auth, userController.createReview);
router.get('/public/reviews/item/:id', publicController.listItemReviews);
router.get('/public/reviews/shop/:id', publicController.listShopReviews);

// Public reservations (user auth, no module guard)
router.post('/public/reservations', auth, reservationController.createReservation);
router.post('/public/reservations/purchase', auth, publicController.createPurchaseReservation);
router.get('/public/reservations', auth, reservationController.listMyReservations);
router.get('/public/reservations/:id', auth, reservationController.getReservationById);
router.get('/public/reservations/track/:code', auth, enhancedReservationController.getReservationByCode);
router.post('/public/reservations/:id/cancel', auth, reservationController.cancelReservation);
router.post('/reservations/:id/confirm-purchase', auth, paymentController.confirmPurchaseDecision);

// Payment routes
router.post('/payments/razorpay/order', auth, paymentController.createRazorpayOrder);
router.post('/payments/razorpay/verify', auth, paymentController.verifyRazorpaySignature);

// New pickup routes
router.post('/pickup/:reservationId/schedule', auth, paymentController.schedulePickup);
router.post('/pickup/:reservationId/verify-otp', auth, paymentController.verifyPickupOTP);
router.get('/pickup/:reservationId/details', auth, paymentController.getPickupDetails);

// User routes
router.get('/addresses', auth, userAddressController.listUserAddresses);
router.post('/payment-methods', auth, [
  body('type').isIn(['credit_card', 'debit_card', 'paypal']).withMessage('Invalid payment method type'),
  body('cardNumber').isCreditCard().withMessage('Invalid card number'),
  body('expiry').matches(/^(0[1-9]|1[0-2])\/([0-9]{2})$/).withMessage('Invalid expiry date (MM/YY)'),
  body('cvv').matches(/^[0-9]{3,4}$/).withMessage('Invalid CVV'),
  body('isDefault').optional().isBoolean()
], userAddressController.addPaymentMethod);

// Pet History (for users to view their owned pets' history)
router.get('/pets/:petId/history', auth, petHistoryController.getPetHistory);

module.exports = router;