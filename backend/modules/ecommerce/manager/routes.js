const express = require('express');
const router = express.Router();
const { auth } = require('../../../core/middleware/auth');
const { authorize } = require('../../../core/middleware/role');

// Controllers
const categoryController = require('./categoryController');
const productController = require('./productController');
const orderController = require('./orderController');

// ============== CATEGORY MANAGEMENT ==============

router.get('/categories', auth, authorize('ecommerce_manager', 'admin'), categoryController.getAllCategories);
router.get('/categories/tree', auth, authorize('ecommerce_manager', 'admin'), categoryController.getCategoryTree);
router.get('/categories/:categoryId', auth, authorize('ecommerce_manager', 'admin'), categoryController.getCategoryById);
router.post('/categories', auth, authorize('ecommerce_manager'), categoryController.createCategory);
router.put('/categories/:categoryId', auth, authorize('ecommerce_manager'), categoryController.updateCategory);
router.delete('/categories/:categoryId', auth, authorize('ecommerce_manager'), categoryController.deleteCategory);
router.patch('/categories/:categoryId/toggle-active', auth, authorize('ecommerce_manager'), categoryController.toggleActiveStatus);
router.get('/categories/:categoryId/stats', auth, authorize('ecommerce_manager', 'admin'), categoryController.getCategoryStats);
router.post('/categories/reorder', auth, authorize('ecommerce_manager'), categoryController.reorderCategories);

// ============== PRODUCT MANAGEMENT ==============

router.get('/products', auth, authorize('ecommerce_manager', 'admin'), productController.getAllProducts);
router.get('/products/low-stock', auth, authorize('ecommerce_manager'), productController.getLowStockProducts);
router.get('/products/:productId', auth, authorize('ecommerce_manager', 'admin'), productController.getProductById);
router.post('/products', auth, authorize('ecommerce_manager'), productController.createProduct);
router.put('/products/:productId', auth, authorize('ecommerce_manager'), productController.updateProduct);
router.delete('/products/:productId', auth, authorize('ecommerce_manager'), productController.deleteProduct);
router.patch('/products/:productId/status', auth, authorize('ecommerce_manager'), productController.updateProductStatus);
router.patch('/products/:productId/inventory', auth, authorize('ecommerce_manager'), productController.updateInventory);
router.post('/products/inventory/bulk', auth, authorize('ecommerce_manager'), productController.bulkUpdateInventory);
router.patch('/products/:productId/pricing', auth, authorize('ecommerce_manager'), productController.updatePricing);
router.get('/products/:productId/analytics', auth, authorize('ecommerce_manager', 'admin'), productController.getProductAnalytics);

// Product Images
router.post('/products/:productId/images', auth, authorize('ecommerce_manager'), productController.uploadProductImages);
router.get('/products/:productId/images', auth, authorize('ecommerce_manager', 'admin'), productController.getProductImages);
router.delete('/products/:productId/images/:imageId', auth, authorize('ecommerce_manager'), productController.deleteProductImage);
router.patch('/products/:productId/images/:imageId/primary', auth, authorize('ecommerce_manager'), productController.setPrimaryImage);

// Product Variants
router.post('/products/:productId/variants', auth, authorize('ecommerce_manager'), productController.addVariant);
router.put('/products/:productId/variants/:variantId', auth, authorize('ecommerce_manager'), productController.updateVariant);
router.delete('/products/:productId/variants/:variantId', auth, authorize('ecommerce_manager'), productController.deleteVariant);

// ============== ORDER MANAGEMENT ==============

router.get('/orders', auth, authorize('ecommerce_manager', 'admin'), orderController.getAllOrders);
router.get('/orders/pending', auth, authorize('ecommerce_manager'), orderController.getPendingOrders);
router.get('/orders/stats', auth, authorize('ecommerce_manager', 'admin'), orderController.getOrderStats);
router.get('/orders/:orderId', auth, authorize('ecommerce_manager', 'admin'), orderController.getOrderById);
router.patch('/orders/:orderId/status', auth, authorize('ecommerce_manager'), orderController.updateOrderStatus);
router.post('/orders/:orderId/confirm', auth, authorize('ecommerce_manager'), orderController.confirmOrder);
router.post('/orders/:orderId/ship', auth, authorize('ecommerce_manager'), orderController.shipOrder);
router.post('/orders/:orderId/deliver', auth, authorize('ecommerce_manager'), orderController.markDelivered);
router.post('/orders/:orderId/cancellation/process', auth, authorize('ecommerce_manager'), orderController.processCancellation);
router.post('/orders/:orderId/return/process', auth, authorize('ecommerce_manager'), orderController.processReturn);
router.post('/orders/:orderId/notes', auth, authorize('ecommerce_manager'), orderController.addInternalNote);

module.exports = router;
