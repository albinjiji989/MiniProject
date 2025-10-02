const express = require('express');
const { body } = require('express-validator');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { auth, authorizeModule, authorize } = require('../../../core/middleware/auth');
const controller = require('../controllers/petShopController');

const router = express.Router();

// Local uploads folder for module assets
const uploadsDir = path.join(__dirname, '..', 'uploads');
try { fs.mkdirSync(uploadsDir, { recursive: true }); } catch (_) {}
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.bin';
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${Date.now()}_${base}${ext}`);
  }
});
const upload = multer({ storage });

router.get('/', auth, authorizeModule('petshop'), controller.listPetShops);
router.get('/stats', auth, authorizeModule('petshop'), controller.getPetShopStats);
router.post(
  '/',
  auth,
  authorizeModule('petshop'),
  [
    body('name').notEmpty().withMessage('Pet shop name is required'),
    body('address').isObject().withMessage('Address is required'),
    body('location.coordinates').isArray({ min: 2, max: 2 }).withMessage('Location coordinates must be [longitude, latitude]'),
    body('capacity.total').isNumeric().withMessage('Total capacity must be a number')
  ],
  controller.createPetShop
);
router.put('/:id', auth, authorizeModule('petshop'), controller.updatePetShop);
router.post('/:id/pets', auth, authorizeModule('petshop'), [ body('petId').notEmpty().withMessage('Pet ID is required') ], controller.addPetToPetShop);
router.post('/:id/products', auth, authorizeModule('petshop'), [
  body('name').notEmpty().withMessage('Product name is required'),
  body('price').isNumeric().withMessage('Price must be a number'),
  body('stock').isNumeric().withMessage('Stock must be a number')
], controller.addProduct);
router.post('/:id/services', auth, authorizeModule('petshop'), [
  body('name').notEmpty().withMessage('Service name is required'),
  body('price').isNumeric().withMessage('Price must be a number')
], controller.addService);
router.get('/animals', auth, authorizeModule('petshop'), controller.listAnimals);

// User dashboard stats (auth required but no module permission)
router.get('/user/stats', auth, controller.getUserPetShopStats);

// Purchase Orders (manager)
router.get('/orders', auth, authorizeModule('petshop'), controller.listPurchaseOrders);
router.post('/orders', auth, authorizeModule('petshop'), [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
], controller.createPurchaseOrder);
router.get('/orders/:id', auth, authorizeModule('petshop'), controller.getPurchaseOrderById);
router.put('/orders/:id', auth, authorizeModule('petshop'), controller.updatePurchaseOrder);
router.post('/orders/:id/submit', auth, authorizeModule('petshop'), controller.submitPurchaseOrder);
router.get('/orders/:id/invoice', auth, authorizeModule('petshop'), controller.generatePurchaseOrderInvoice);
router.post('/orders/:id/receive', auth, authorizeModule('petshop'), controller.receivePurchaseOrder);

// Inventory (manager)
router.get('/inventory', auth, authorizeModule('petshop'), controller.listInventory);
router.post('/inventory', auth, authorizeModule('petshop'), controller.createInventoryItem);
router.post('/inventory/bulk', auth, authorizeModule('petshop'), controller.bulkCreateInventoryItems);
router.post('/inventory/publish-bulk', auth, authorizeModule('petshop'), controller.bulkPublishInventoryItems);
router.get('/inventory/:id', auth, authorizeModule('petshop'), controller.getInventoryItemById);
router.put('/inventory/:id', auth, authorizeModule('petshop'), controller.updateInventoryItem);
router.delete('/inventory/:id', auth, authorizeModule('petshop'), controller.deleteInventoryItem);
router.post('/inventory/:id/images', auth, authorizeModule('petshop'), upload.single('file'), controller.uploadInventoryImage);
router.post('/inventory/:id/health-doc', auth, authorizeModule('petshop'), upload.single('file'), controller.uploadInventoryHealthDoc);

// Pricing Management (manager)
router.get('/pricing', auth, authorizeModule('petshop'), controller.listPricingRules);
router.post('/pricing', auth, authorizeModule('petshop'), controller.createPricingRule);
router.put('/pricing/:id', auth, authorizeModule('petshop'), controller.updatePricingRule);
router.post('/pricing/calculate', auth, authorizeModule('petshop'), controller.calculatePetPrice);

// Public listings (no auth)
router.get('/public/listings', controller.listPublicListings);
router.get('/public/listings/:id', controller.getPublicListingById);
// Public pet shops (no auth)
router.get('/public/shops', controller.listPublicPetShops);
// Public wishlist (user auth)
router.post('/public/wishlist', auth, controller.addToWishlist);
router.get('/public/wishlist', auth, controller.listMyWishlist);
router.delete('/public/wishlist/:itemId', auth, controller.removeFromWishlist);
// Public reviews
router.post('/public/reviews', auth, controller.createReview);
router.get('/public/reviews/item/:id', controller.listItemReviews);
router.get('/public/reviews/shop/:id', controller.listShopReviews);

// Public reservations (user auth, no module guard)
router.post('/public/reservations', auth, controller.createReservation);
router.post('/public/reservations/enhanced', auth, controller.createEnhancedReservation);
router.get('/public/reservations', auth, controller.listMyReservations);
router.get('/public/reservations/enhanced', auth, controller.listEnhancedReservations);
router.get('/public/reservations/track/:code', auth, controller.getReservationByCode);
router.post('/public/reservations/:id/cancel', auth, controller.cancelReservation);

// Payments - Razorpay
router.post('/payments/razorpay/order', auth, controller.createRazorpayOrder);
router.post('/payments/razorpay/verify', auth, controller.verifyRazorpaySignature);

// Centralized Pet Code Management (Admin/Manager only)
router.get('/admin/pet-codes/stats', auth, authorize('admin'), controller.getPetCodeStats);
router.post('/admin/pet-codes/generate-bulk', auth, authorize('admin'), controller.generateBulkPetCodes);
router.post('/admin/pet-codes/validate', auth, authorize(['admin', 'manager']), controller.validatePetCode);

// Admin analytics
router.get('/admin/analytics/summary', auth, authorize('admin'), controller.getAdminAnalyticsSummary);
router.get('/admin/analytics/species-breakdown', auth, authorize('admin'), controller.getAdminSpeciesBreakdown);
router.get('/admin/analytics/sales-series', auth, authorize('admin'), controller.getAdminSalesSeries);

// Admin shops & listings oversight
router.get('/admin/shops', auth, authorize('admin'), controller.adminListShops);
router.put('/admin/shops/:id/status', auth, authorize('admin'), controller.adminUpdateShopStatus);
router.get('/admin/listings', auth, authorize('admin'), controller.adminListAllListings);
router.delete('/admin/listings/:id', auth, authorize('admin'), controller.adminRemoveListing);
router.get('/admin/reports/sales', auth, authorize('admin'), controller.adminSalesReport);
// Admin orders
router.get('/admin/orders', auth, authorize('admin'), controller.adminListOrders);
router.post('/admin/orders/:id/transfer-ownership', auth, authorize('admin'), controller.adminTransferOwnership);

// Admin reservations management
router.get('/admin/reservations', auth, authorize('admin'), controller.adminListReservations);
router.put('/admin/reservations/:id/status', auth, authorize('admin'), controller.adminUpdateReservationStatus);

// Manager routes - require manager role
const requireManager = [auth, authorizeModule('petshop'), (req, res, next) => {
  if (req.user.role !== 'manager') {
    return res.status(403).json({ success: false, message: 'Access denied. Manager role required.' });
  }
  next();
}];

// Manager Dashboard
router.get('/manager/dashboard', requireManager, controller.managerDashboard);

// Manager Promotions
router.get('/manager/promotions', requireManager, controller.managerListPromotions);

router.post('/manager/promotions', requireManager, [
  body('code').notEmpty().withMessage('Promo code is required'),
  body('discountType').isIn(['percentage', 'fixed']).withMessage('Invalid discount type'),
  body('discountValue').isNumeric().withMessage('Discount value must be a number'),
  body('minOrder').optional().isNumeric(),
  body('startDate').isISO8601().withMessage('Invalid start date'),
  body('endDate').isISO8601().withMessage('Invalid end date'),
  body('maxUses').optional().isNumeric(),
  body('description').optional().isString(),
  body('applicableItems').optional().isArray(),
  body('applicableCategories').optional().isArray()
], controller.createPromotion);

router.put('/manager/promotions/:id', requireManager, [
  body('code').optional().notEmpty().withMessage('Promo code cannot be empty'),
  body('discountType').optional().isIn(['percentage', 'fixed']).withMessage('Invalid discount type'),
  body('discountValue').optional().isNumeric().withMessage('Discount value must be a number'),
  body('minOrder').optional().isNumeric(),
  body('startDate').optional().isISO8601().withMessage('Invalid start date'),
  body('endDate').optional().isISO8601().withMessage('Invalid end date'),
  body('maxUses').optional().isNumeric(),
  body('isActive').optional().isBoolean(),
  body('description').optional().isString(),
  body('applicableItems').optional().isArray(),
  body('applicableCategories').optional().isArray()
], controller.managerUpdatePromotion);

router.delete('/manager/promotions/:id', requireManager, controller.managerDeletePromotion);

// Manager Reservations
router.get('/manager/reservations', requireManager, controller.managerListReservations);
router.get('/manager/reservations/enhanced', requireManager, controller.listEnhancedReservations);
router.put('/manager/reservations/:id/status', requireManager, [
  body('status').isIn(['confirmed', 'cancelled', 'checked_in', 'checked_out', 'no_show']).withMessage('Invalid status'),
  body('notes').optional().isString()
], controller.managerUpdateReservationStatus);
router.post('/manager/reservations/:id/review', requireManager, [
  body('action').isIn(['approve', 'reject']).withMessage('Action must be approve or reject'),
  body('reviewNotes').optional().isString(),
  body('approvalReason').optional().isString()
], controller.managerReviewReservation);

// User routes
router.get('/user/addresses', auth, controller.listUserAddresses);
router.post('/user/payment-methods', auth, [
  body('type').isIn(['credit_card', 'debit_card', 'paypal']).withMessage('Invalid payment method type'),
  body('cardNumber').isCreditCard().withMessage('Invalid card number'),
  body('expiry').matches(/^(0[1-9]|1[0-2])\/([0-9]{2})$/).withMessage('Invalid expiry date (MM/YY)'),
  body('cvv').matches(/^[0-9]{3,4}$/).withMessage('Invalid CVV'),
  body('isDefault').optional().isBoolean()
], controller.addPaymentMethod);
router.post('/orders/:id/cancel', auth, controller.cancelOrder);

// Admin management routes
router.put('/admin/users/:id/role', auth, authorize('admin'), [
  body('role').isIn(['user', 'manager', 'admin']).withMessage('Invalid role')
], controller.updateUserRole);
router.post('/admin/announcements', auth, authorize('admin'), [
  body('title').notEmpty().withMessage('Title is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('isActive').optional().isBoolean(),
  body('targetRoles').optional().isArray()
], controller.createAnnouncement);
router.get('/admin/analytics/advanced', auth, authorize('admin'), controller.getAdvancedAnalytics);

// Place generic ID route at the very end to avoid capturing specific paths like '/inventory' and '/pricing'
router.get('/:id', auth, authorizeModule('petshop'), controller.getPetShopById);

module.exports = router;
