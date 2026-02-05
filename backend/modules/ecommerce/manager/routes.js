const express = require('express');
const router = express.Router();
const { auth, authorizeModule } = require('../../../core/middleware/auth');
const categoryController = require('./categoryController');
const productController = require('./productController');
const orderController = require('./orderController');
const imageController = require('./imageController');
const inventoryController = require('./inventoryController');

// Middleware: All routes require authentication and ecommerce module access
router.use(auth);
router.use(authorizeModule('ecommerce'));

// Additional authorization check for manager/admin/ecommerce_manager
const requireManager = (req, res, next) => {
  const role = req.user?.role;
  const hasRole = Array.isArray(role)
    ? (role.includes('manager') || role.includes('admin') || role.includes('ecommerce_manager'))
    : (role === 'manager' || role === 'admin' || role === 'ecommerce_manager');
  if (!hasRole) {
    return res.status(403).json({ success: false, message: 'Ecommerce manager access required' });
  }
  next();
};

router.use(requireManager);

// ============ IMAGE UPLOAD ROUTES ============
router.post('/images/upload', imageController.uploadProductImages);
router.delete('/images/delete', imageController.deleteProductImage);
router.put('/images/reorder', imageController.reorderProductImages);

// ============ CATEGORY ROUTES ============
router.get('/categories', categoryController.getAllCategories);
router.get('/categories/tree', categoryController.getCategoryTree);
router.get('/categories/:id', categoryController.getCategory);
router.get('/categories/:id/path', categoryController.getCategoryPath);
router.post('/categories', categoryController.createCategory);
router.put('/categories/:id', categoryController.updateCategory);
router.delete('/categories/:id', categoryController.deleteCategory);
router.post('/categories/reorder', categoryController.reorderCategories);

// ============ PRODUCT ROUTES ============
router.get('/products', productController.getAllProducts);
router.get('/products/:id', productController.getProduct);
router.post('/products', productController.createProduct);
router.put('/products/:id', productController.updateProduct);
router.delete('/products/:id', productController.deleteProduct);
router.post('/products/bulk-update', productController.bulkUpdateProducts);
router.patch('/products/:id/status', productController.updateProductStatus);
router.patch('/products/:id/inventory', productController.updateInventory);
router.get('/products/:id/analytics', productController.getProductAnalytics);
router.post('/products/:id/duplicate', productController.duplicateProduct);

// ============ ORDER ROUTES ============
router.get('/orders', orderController.getAllOrders);
router.get('/orders/:id', orderController.getOrder);
router.patch('/orders/:id/status', orderController.updateOrderStatus);
router.get('/dashboard/stats', orderController.getDashboardStats);
router.patch('/orders/:id/tracking', orderController.addTrackingInfo);

// ============ INVENTORY AI/ML PREDICTION ROUTES ============
router.get('/inventory/health', inventoryController.checkMLHealth);
router.get('/inventory/dashboard', inventoryController.getInventoryDashboard);
router.get('/inventory/predictions', inventoryController.getAllPredictions);
router.get('/inventory/critical', inventoryController.getCriticalItems);
router.get('/inventory/restock-report', inventoryController.getRestockReport);
router.get('/inventory/seasonal', inventoryController.getSeasonalAnalysis);
router.get('/inventory/predict/:productId', inventoryController.getProductPrediction);
router.get('/inventory/forecast/:productId', inventoryController.getDemandForecast);
router.get('/inventory/velocity/:productId', inventoryController.getSalesVelocity);

module.exports = router;
