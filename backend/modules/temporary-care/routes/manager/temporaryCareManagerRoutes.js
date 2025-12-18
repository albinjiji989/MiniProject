const express = require('express');
const { body } = require('express-validator');
const { auth, authorizeModule } = require('../../../../core/middleware/auth');
const { requireStoreSetup } = require('../../middleware/storeSetupCheck');
const managerController = require('../../manager/controllers/managerStoreController');
const dashboardController = require('../../manager/controllers/dashboardController');
const centerController = require('../../manager/controllers/centerController');
const managerRequestsController = require('../../manager/controllers/managerRequestsController');
const caregiverController = require('../../manager/controllers/caregiverController');
const temporaryCareController = require('../../manager/controllers/temporaryCareController');
const paymentController = require('../../manager/controllers/paymentController');

const router = express.Router();

const requireManager = [auth, authorizeModule('temporary-care'), (req, res, next) => {
  const role = req.user?.role;
  const hasRole = Array.isArray(role)
    ? (role.includes('manager') || role.includes('temporary-care_manager'))
    : (role === 'manager' || role === 'temporary-care_manager');
  if (!hasRole) {
    return res.status(403).json({ success: false, message: 'Access denied. Manager role required.' });
  }
  next();
}];

// Routes that don't require store setup (for initial setup)
router.get('/me/store', requireManager, managerController.getMyStoreInfo);
router.put(
  '/me/store',
  requireManager,
  [
    body('storeName').optional().isString().isLength({ min: 3 })
  ],
  managerController.updateMyStoreInfo
);

// All other routes require store setup
router.use(requireManager, requireStoreSetup);

// Dashboard Stats
router.get('/dashboard/stats', dashboardController.getDashboardStats);
router.get('/bookings', dashboardController.getBookings);
router.get('/facilities', dashboardController.getFacilities);
router.get('/caregivers-list', dashboardController.getCaregivers);

// Center management
router.get('/me/center', centerController.getMyCenter);
router.post(
  '/me/center',
  [
    body('name').notEmpty(),
    body('capacity.total').optional().isInt({ min: 0 })
  ],
  centerController.upsertMyCenter
);

// Requests management
router.get('/requests', managerRequestsController.listRequests);
router.put('/requests/:id/decision', [ body('decision').isIn(['approved', 'declined']) ], managerRequestsController.decideRequest);
router.post('/requests/:id/assign', [ body('caregiverId').notEmpty() ], managerRequestsController.assignRequest);

// Caregivers
router.get('/caregivers', caregiverController.listCaregivers);
router.post('/caregivers', [ body('name').notEmpty(), body('email').isEmail(), body('phone').notEmpty() ], caregiverController.createCaregiver);
router.put('/caregivers/:id', caregiverController.updateCaregiver);
router.delete('/caregivers/:id', caregiverController.deleteCaregiver);

// Temporary care management
router.get('/cares', temporaryCareController.listTemporaryCares);
router.get('/cares/:id', temporaryCareController.getTemporaryCare);
router.put('/cares/:id/status', [ body('status').isIn(['pending', 'active', 'completed', 'cancelled']) ], temporaryCareController.updateTemporaryCareStatus);
router.put('/cares/:id/reassign', [ body('caregiverId').notEmpty() ], temporaryCareController.reassignCaregiver);
router.put('/cares/:id/complete', temporaryCareController.completeCare);

// Payment management
router.get('/payments', paymentController.listPayments);
router.get('/payments/:id', paymentController.getPayment);
router.post('/payments/:id/refund', [ body('refundAmount').optional().isNumeric(), body('refundReason').optional().isString() ], paymentController.processRefund);

module.exports = router;