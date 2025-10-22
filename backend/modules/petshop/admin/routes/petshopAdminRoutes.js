const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../../../../core/middleware/auth');
const { body } = require('express-validator');

// Import admin controllers
const adminController = require('../controllers/adminController');
const analyticsController = require('../controllers/adminFunctionsController');
const storeManagementController = require('../controllers/storeManagementController');

// Admin Routes - System Admin only
router.get('/shops', auth, authorize('admin'), storeManagementController.adminListShops);
router.put('/shops/:id/status', auth, authorize('admin'), storeManagementController.adminUpdateShopStatus);
router.get('/listings', auth, authorize('admin'), storeManagementController.adminListAllListings);
router.delete('/listings/:id', auth, authorize('admin'), storeManagementController.adminRemoveListing);
router.get('/store-name-requests', auth, authorize('admin'), storeManagementController.adminListStoreNameChangeRequests);
router.put('/store-name-requests/:id', auth, authorize('admin'), storeManagementController.adminDecideStoreNameChangeRequest);
router.get('/analytics', auth, authorize('admin'), analyticsController.getAdvancedAnalytics);
router.get('/analytics/summary', auth, authorize('admin'), analyticsController.getAdminAnalyticsSummary);
router.get('/analytics/species-breakdown', auth, authorize('admin'), analyticsController.getAdminSpeciesBreakdown);
router.get('/analytics/sales-series', auth, authorize('admin'), analyticsController.getAdminSalesSeries);

module.exports = router;