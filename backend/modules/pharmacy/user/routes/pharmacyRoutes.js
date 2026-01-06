const express = require('express');
const router = express.Router();
const { auth } = require('../../../../core/middleware/auth');
const pharmacyController = require('../controllers/pharmacyController');

// Get medicines (public)
router.get('/medicines', pharmacyController.getMedicines);

// Get medicine details (public)
router.get('/medicines/:id', pharmacyController.getMedicineDetails);

// Cart operations (authenticated)
router.get('/cart', auth, pharmacyController.getCart);
router.post('/cart/add', auth, pharmacyController.addToCart);
router.put('/cart/:medicineId', auth, pharmacyController.updateCart);
router.delete('/cart/:medicineId', auth, pharmacyController.removeFromCart);
router.delete('/cart', auth, pharmacyController.clearCart);

// Prescription operations (authenticated)
router.post('/prescriptions/upload', auth, pharmacyController.uploadPrescription);
router.get('/prescriptions', auth, pharmacyController.getPrescriptions);

// Order operations (authenticated)
router.post('/orders', auth, pharmacyController.createOrder);
router.get('/orders', auth, pharmacyController.getOrders);
router.get('/orders/:id', auth, pharmacyController.getOrderDetails);

module.exports = router;
