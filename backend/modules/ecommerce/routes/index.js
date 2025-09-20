const express = require('express');
const { body } = require('express-validator');
const { auth, authorizeModule } = require('../../../core/middleware/auth');
const controller = require('../controllers/ecommerceController');

const router = express.Router();

router.get('/products', auth, authorizeModule('ecommerce'), controller.listProducts);
router.post(
  '/products',
  auth,
  authorizeModule('ecommerce'),
  [
    body('name').notEmpty().withMessage('Product name is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('category').isIn(['food', 'toys', 'accessories', 'healthcare', 'grooming', 'housing', 'training', 'other']).withMessage('Invalid category'),
    body('price').isNumeric().withMessage('Price must be a number'),
    body('inventory.quantity').isNumeric().withMessage('Quantity must be a number'),
    body('sku').notEmpty().withMessage('SKU is required')
  ],
  controller.createProduct
);
router.get('/products/:id', auth, authorizeModule('ecommerce'), async (req, res) => {
  try {
    const Product = require('../models/Product');
    const { getStoreFilter } = require('../../../utils/storeFilter');
    const filter = { _id: req.params.id, ...getStoreFilter(req.user) };
    const product = await Product.findOne(filter).populate('createdBy', 'name email');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: { product } });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
router.put('/products/:id', auth, authorizeModule('ecommerce'), async (req, res) => {
  try {
    const Product = require('../models/Product');
    const { getStoreFilter } = require('../../../utils/storeFilter');
    const filter = { _id: req.params.id, ...getStoreFilter(req.user) };
    const product = await Product.findOneAndUpdate(filter, req.body, { new: true, runValidators: true })
      .populate('createdBy', 'name email');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found or not allowed' });
    res.json({ success: true, message: 'Product updated successfully', data: { product } });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ success: false, message: 'Server error during product update' });
  }
});
router.delete('/products/:id', auth, authorizeModule('ecommerce'), async (req, res) => {
  try {
    const Product = require('../models/Product');
    const { getStoreFilter } = require('../../../utils/storeFilter');
    const filter = { _id: req.params.id, ...getStoreFilter(req.user) };
    const product = await Product.findOneAndDelete(filter);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found or not allowed' });
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ success: false, message: 'Server error during product deletion' });
  }
});
router.get('/orders', auth, authorizeModule('ecommerce'), controller.listOrders);

// Public catalog and cart (requires auth for cart)
router.get('/catalog/products', controller.publicListProducts);
router.get('/catalog/products/:id', controller.publicGetProduct);
router.get('/cart', auth, controller.getCart);
router.post('/cart', auth, [
  body('productId').notEmpty().withMessage('productId is required'),
  body('quantity').optional().isInt({ min: 1 }).withMessage('quantity must be >= 1')
], controller.addToCart);
router.put('/cart/items/:itemId', auth, [
  body('quantity').isInt({ min: 1 }).withMessage('quantity must be >= 1')
], controller.updateCartItem);
router.delete('/cart/items/:itemId', auth, controller.removeCartItem);
router.post('/checkout', auth, controller.checkout);
router.get('/my/orders', auth, controller.listMyOrders);

// Ecommerce workers management (manager or admin via authorizeModule)
router.post('/admin/workers', auth, authorizeModule('ecommerce'), controller.createWorker);
router.get('/admin/workers', auth, authorizeModule('ecommerce'), controller.listWorkers);
router.patch('/admin/workers/:id', auth, authorizeModule('ecommerce'), controller.updateWorker);
router.delete('/admin/workers/:id', auth, authorizeModule('ecommerce'), controller.deleteWorker);

// Analytics
router.get('/admin/analytics/summary', auth, authorizeModule('ecommerce'), controller.analyticsSummary);
router.get('/admin/analytics/sales-series', auth, authorizeModule('ecommerce'), controller.analyticsSalesSeries);

module.exports = router;

