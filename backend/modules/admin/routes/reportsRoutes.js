const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { auth, authorize } = require('../../../core/middleware/auth');

// Admin reports routes
router.get('/adoption', auth, authorize('admin'), reportsController.getAdoptionReport);
router.get('/petshop', auth, authorize('admin'), reportsController.getPetshopReport);
router.get('/ecommerce', auth, authorize('admin'), reportsController.getEcommerceReport);

module.exports = router;