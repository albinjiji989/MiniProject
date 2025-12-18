const express = require('express');
const router = express.Router();
const { auth, authorizeModule } = require('../../../../core/middleware/auth');
const { body } = require('express-validator');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Import controllers
const inventoryController = require('../controllers/inventoryController')
const orderController = require('../controllers/orderController')
const reservationController = require('../../user/controllers/reservationController') // Fixed import path
const enhancedReservationController = require('../controllers/enhancedReservationController')
const dashboardController = require('../controllers/dashboardController')
const promotionController = require('../controllers/promotionController')
const petHistoryController = require('../controllers/petHistoryController')
const storeController = require('../controllers/storeController') // Added missing import
const storeNameChangeController = require('../controllers/storeNameChangeController') // Added missing import
const inventoryManagementController = require('../controllers/inventoryManagementController') // Added missing import
const handoverController = require('../controllers/handoverController') // Added handover controller
const stockController = require('../controllers/stockController') // Added stock controller
// const pricingController = require('../controllers/pricingController') // Removed pricing controller

// Manager routes - require manager role
const requireManager = [auth, authorizeModule('petshop'), (req, res, next) => {
  const role = req.user?.role
  const hasRole = Array.isArray(role)
    ? (role.includes('manager') || role.includes('petshop_manager'))
    : (role === 'manager' || role === 'petshop_manager')
  if (!hasRole) {
    return res.status(403).json({ success: false, message: 'Access denied. Manager role required.' });
  }
  next();
}];

// Lite manager guard: auth + any role containing "manager" (no module permission)
const requireManagerLite = [auth, (req, res, next) => {
  try {
    const role = req.user?.role;
    const hasManagerRole = Array.isArray(role)
      ? role.some(r => typeof r === 'string' && r.toLowerCase().includes('manager'))
      : (typeof role === 'string' && role.toLowerCase().includes('manager'));

    if (!hasManagerRole) {
      return res.status(403).json({ success: false, message: 'Manager access required' });
    }
    next();
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
}];

// Store Management
router.get('/', auth, authorizeModule('petshop'), storeController.listPetShops);
router.get('/stats', auth, authorizeModule('petshop'), storeController.getPetShopStats);
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
  storeController.createPetShop
);
router.put('/:id', auth, authorizeModule('petshop'), storeController.updatePetShop);
router.post('/:id/pets', auth, authorizeModule('petshop'), [ body('petId').notEmpty().withMessage('Pet ID is required') ], storeController.addPetToPetShop);
router.post('/:id/products', auth, authorizeModule('petshop'), [
  body('name').notEmpty().withMessage('Product name is required'),
  body('price').isNumeric().withMessage('Price must be a number'),
  body('stock').isNumeric().withMessage('Stock must be a number')
], storeController.addProduct);
router.post('/:id/services', auth, authorizeModule('petshop'), [
  body('name').notEmpty().withMessage('Service name is required'),
  body('price').isNumeric().withMessage('Price must be a number')
], storeController.addService);
router.get('/animals', auth, authorizeModule('petshop'), storeController.listAnimals);

// Manager self-service: store identity (no module guard)
router.get('/me/store', auth, storeController.getMyStoreInfo);
router.put('/me/store', auth, storeController.updateMyStoreInfo);

// Purchase Orders
router.get('/orders', auth, authorizeModule('petshop'), orderController.listPurchaseOrders);
router.post('/orders', auth, authorizeModule('petshop'), [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
], orderController.createPurchaseOrder);
router.get('/orders/:id', auth, authorizeModule('petshop'), orderController.getPurchaseOrderById);
router.put('/orders/:id', auth, authorizeModule('petshop'), orderController.updatePurchaseOrder);
router.post('/orders/:id/submit', auth, authorizeModule('petshop'), orderController.submitPurchaseOrder);
router.get('/orders/:id/invoice', auth, authorizeModule('petshop'), orderController.generatePurchaseOrderInvoice);
router.post('/orders/:id/receive', auth, authorizeModule('petshop'), orderController.receivePurchaseOrder);

// Manager: request store name change (auth only; no module guard; id stays same)
router.post('/store-name-change', auth, storeNameChangeController.createStoreNameChangeRequest);

// Inventory Management
router.get('/inventory', auth, authorizeModule('petshop'), inventoryController.listInventory);
router.post('/inventory', auth, authorizeModule('petshop'), inventoryController.createInventoryItem);
router.get('/inventory/:id', auth, authorizeModule('petshop'), inventoryController.getInventoryItemById);
router.put('/inventory/:id', auth, authorizeModule('petshop'), inventoryController.updateInventoryItem);
router.delete('/inventory/:id', auth, authorizeModule('petshop'), inventoryController.deleteInventoryItem);
router.post('/inventory/bulk', auth, authorizeModule('petshop'), inventoryController.bulkCreateInventoryItems);

// ML Data Endpoint
router.get('/inventory/ml/data', auth, authorizeModule('petshop'), inventoryController.getInventoryForML);

// Inventory Image Upload
router.post('/inventory/:id/images', auth, authorizeModule('petshop'), upload.single('file'), inventoryController.uploadInventoryImage);
// Inventory Image Removal
router.delete('/inventory/:id/images/:imageId', auth, authorizeModule('petshop'), inventoryController.removeInventoryImage);

// Bulk Publish Inventory Items
router.post('/inventory/publish-bulk', auth, authorizeModule('petshop'), inventoryManagementController.bulkPublishInventoryItems);

// Bulk Create Stock Items
router.post('/stocks/bulk', auth, authorizeModule('petshop'), inventoryController.bulkCreateStockItems);

// Reserved Pets Management
router.get('/inventory/reserved', auth, authorizeModule('petshop'), inventoryController.listReservedPets);

// Pricing Management
// router.post('/pricing', auth, authorizeModule('petshop'), pricingController.createPricingRule);
// router.get('/pricing', auth, authorizeModule('petshop'), pricingController.listPricingRules);
// router.put('/pricing/:id', auth, authorizeModule('petshop'), pricingController.updatePricingRule);
// router.post('/pricing/calculate', auth, authorizeModule('petshop'), pricingController.calculatePetPrice);

// Manager Dashboard
router.get('/dashboard/stats', auth, authorizeModule('petshop'), dashboardController.getManagerDashboardStats);
router.get('/dashboard/orders', auth, authorizeModule('petshop'), dashboardController.getManagerOrders);
router.get('/dashboard/sales-report', auth, authorizeModule('petshop'), dashboardController.getSalesReport);
router.get('/dashboard/invoice/:reservationId', auth, authorizeModule('petshop'), dashboardController.generateInvoice);

// Manager Promotions
router.post('/promotions', auth, authorizeModule('petshop'), promotionController.createPromotion);
router.get('/promotions', auth, authorizeModule('petshop'), promotionController.managerListPromotions);
router.put('/promotions/:id', auth, authorizeModule('petshop'), promotionController.managerUpdatePromotion);
router.delete('/promotions/:id', auth, authorizeModule('petshop'), promotionController.managerDeletePromotion);

// Manager Reservations
router.post('/reservations/enhanced', auth, authorizeModule('petshop'), enhancedReservationController.createEnhancedReservation);
router.get('/reservations/enhanced', auth, authorizeModule('petshop'), enhancedReservationController.listEnhancedReservations);
router.get('/reservations/code/:code', auth, authorizeModule('petshop'), enhancedReservationController.getReservationByCode);
router.put('/reservations/:id/status', auth, authorizeModule('petshop'), reservationController.managerUpdateReservationStatus);
router.post('/reservations/:id/review', auth, authorizeModule('petshop'), reservationController.managerReviewReservation);

// Manager Handover Functions
router.post('/reservations/:id/handover/schedule', auth, authorizeModule('petshop'), handoverController.scheduleHandover);
router.post('/reservations/:id/handover/complete', auth, authorizeModule('petshop'), handoverController.completeHandover);
router.post('/reservations/:id/handover/regenerate-otp', auth, authorizeModule('petshop'), handoverController.regenerateHandoverOTP);

// Manager Pet History
router.get('/pet-history/:petId', auth, authorizeModule('petshop'), petHistoryController.getPetHistory);

// Get reservation by ID for managers
router.get('/reservations/:id', auth, authorizeModule('petshop'), enhancedReservationController.getReservationById);

// Manager approves payment for reservation
router.post('/reservations/:id/approve-payment', auth, authorizeModule('petshop'), enhancedReservationController.approvePayment);

// Stock Management Routes
router.get('/stocks', auth, authorizeModule('petshop'), stockController.listStocks);
router.post('/stocks', auth, authorizeModule('petshop'), stockController.createStock);
router.get('/stocks/:id', auth, authorizeModule('petshop'), stockController.getStockById);
router.put('/stocks/:id', auth, authorizeModule('petshop'), stockController.updateStock);
router.delete('/stocks/:id', auth, authorizeModule('petshop'), stockController.deleteStock);
router.post('/stocks/generate-pets', auth, authorizeModule('petshop'), stockController.generatePetsFromStock);

// Stock Image Management Routes
router.post('/stocks/:id/images', auth, authorizeModule('petshop'), upload.single('file'), stockController.uploadStockImages);
router.delete('/stocks/:stockId/images/:imageId', auth, authorizeModule('petshop'), stockController.removeStockImage);

module.exports = router;