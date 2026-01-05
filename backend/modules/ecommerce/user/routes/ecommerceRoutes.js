const express = require('express');
const router = express.Router();
const { auth } = require('../../../../core/middleware/auth');
const ecommerceController = require('../controllers/ecommerceController');

// BROWSING PRODUCTS (public)
router.get('/products', ecommerceController.getProducts);
router.get('/products/:id', ecommerceController.getProductDetails);

// SHOPPING CART (auth required)
router.post('/cart/add', auth, ecommerceController.addToCart);
router.get('/cart', auth, ecommerceController.getCart);
router.put('/cart/item', auth, ecommerceController.updateCartItem);
router.delete('/cart/item/:productId', auth, ecommerceController.removeFromCart);
router.delete('/cart/clear', auth, ecommerceController.clearCart);

// CHECKOUT & ORDERS (auth required)
router.post('/orders', auth, ecommerceController.createOrder);
router.get('/orders', auth, ecommerceController.getMyOrders);
router.get('/orders/:id', auth, ecommerceController.getOrderDetails);

module.exports = router;
