const express = require('express');
const router = express.Router();
const { auth } = require('../../core/middleware/auth');
const { authorize } = require('../../core/middleware/role');

const managerProfileController = require('./managerProfileController');

// Manager Profile Routes
router.get('/profile', auth, authorize('adoption_manager', 'petshop_manager', 'ecommerce_manager', 'pharmacy_manager', 'veterinary_manager', 'temporarycare_manager'), managerProfileController.getProfile);
router.put('/store', auth, authorize('adoption_manager', 'petshop_manager', 'ecommerce_manager', 'pharmacy_manager', 'veterinary_manager', 'temporarycare_manager'), managerProfileController.updateStoreInfo);
router.post('/change-password', auth, authorize('adoption_manager', 'petshop_manager', 'ecommerce_manager', 'pharmacy_manager', 'veterinary_manager', 'temporarycare_manager'), managerProfileController.changePassword);
router.get('/dashboard/stats', auth, authorize('adoption_manager', 'petshop_manager', 'ecommerce_manager', 'pharmacy_manager', 'veterinary_manager', 'temporarycare_manager'), managerProfileController.getDashboardStats);

module.exports = router;
