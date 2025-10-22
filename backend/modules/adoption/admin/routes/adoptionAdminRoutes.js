const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const analyticsController = require('../controllers/analyticsController');
const { auth } = require('../../../../core/middleware/auth');
const { authorize } = require('../../../../core/middleware/role');

// Admin Routes - System Admin only
router.get('/stats', auth, authorize('admin'), dashboardController.getAdminStats);
router.get('/adoptions', auth, authorize('admin'), dashboardController.getAllAdoptions);
router.get('/payments', auth, authorize('admin'), dashboardController.getPaymentReports);
router.get('/analytics', auth, authorize('admin'), analyticsController.getAnalytics);
router.get('/manager-analytics', auth, authorize('admin'), analyticsController.getManagerAnalytics);
router.get('/user-analytics', auth, authorize('admin'), analyticsController.getUserAnalytics);
router.get('/pet-analytics', auth, authorize('admin'), analyticsController.getPetAnalytics);

module.exports = router;