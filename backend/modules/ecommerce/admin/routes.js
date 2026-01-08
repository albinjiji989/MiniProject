const express = require('express');
const router = express.Router();
const { auth } = require('../../../core/middleware/auth');
const { authorize } = require('../../../core/middleware/role');

// Controllers
const dashboardController = require('./dashboardController');

// ============== ADMIN DASHBOARD & MONITORING ==============
// Admins can only VIEW and MONITOR - no product creation

router.get('/dashboard/stats', auth, authorize('admin'), dashboardController.getDashboardStats);
router.get('/analytics/sales', auth, authorize('admin'), dashboardController.getSalesAnalytics);
router.get('/analytics/top-products', auth, authorize('admin'), dashboardController.getTopSellingProducts);
router.get('/analytics/categories', auth, authorize('admin'), dashboardController.getCategoryPerformance);
router.get('/reports/inventory', auth, authorize('admin'), dashboardController.getInventoryReport);
router.get('/reports/fulfillment', auth, authorize('admin'), dashboardController.getOrderFulfillmentMetrics);
router.get('/analytics/customers', auth, authorize('admin'), dashboardController.getCustomerInsights);
router.get('/analytics/reviews', auth, authorize('admin'), dashboardController.getReviewStats);
router.get('/reports/reported-content', auth, authorize('admin'), dashboardController.getReportedContent);
router.get('/reports/sales/export', auth, authorize('admin'), dashboardController.exportSalesReport);

module.exports = router;
