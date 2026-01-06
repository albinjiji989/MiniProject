const express = require('express');
const router = express.Router();
const { auth, authorizeModule } = require('../../../../core/middleware/auth');
const ecommerceManagerController = require('../controllers/ecommerceManagerController');

// All routes require auth and ecommerce module authorization
router.use(auth);
router.use(authorizeModule('ecommerce'));

// PRODUCTS MANAGEMENT
router.get('/products', ecommerceManagerController.listProducts);
router.post('/products', ecommerceManagerController.createProduct);
router.get('/products/:id', ecommerceManagerController.getProductById);
router.put('/products/:id', ecommerceManagerController.updateProduct);
router.delete('/products/:id', ecommerceManagerController.deleteProduct);

// INVENTORY MANAGEMENT
router.put('/products/:id/stock', ecommerceManagerController.updateStock);

// ORDERS MANAGEMENT
router.get('/orders', ecommerceManagerController.listOrders);
router.get('/orders/:id', ecommerceManagerController.getOrderById);
router.put('/orders/:id/status', ecommerceManagerController.updateOrderStatus);

module.exports = router;
