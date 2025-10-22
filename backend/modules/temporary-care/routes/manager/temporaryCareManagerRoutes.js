const express = require('express');
const { body } = require('express-validator');
const { auth, authorizeModule } = require('../../../../core/middleware/auth');
const managerController = require('../../manager/controllers/managerStoreController');
const dashboardController = require('../../manager/controllers/dashboardController');
const centerController = require('../../manager/controllers/centerController');
const managerRequestsController = require('../../manager/controllers/managerRequestsController');
const caregiverController = require('../../manager/controllers/caregiverController');

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

// Dashboard Stats
router.get('/dashboard/stats', requireManager, dashboardController.getDashboardStats);
router.get('/bookings', requireManager, dashboardController.getBookings);
router.get('/facilities', requireManager, dashboardController.getFacilities);
router.get('/caregivers-list', requireManager, dashboardController.getCaregivers);

router.get('/me/store', requireManager, managerController.getMyStoreInfo);
router.put(
  '/me/store',
  requireManager,
  [
    body('storeName').optional().isString().isLength({ min: 3 })
  ],
  managerController.updateMyStoreInfo
);

// Center management
router.get('/me/center', requireManager, centerController.getMyCenter);
router.post(
  '/me/center',
  requireManager,
  [
    body('name').notEmpty(),
    body('capacity.total').optional().isInt({ min: 0 })
  ],
  centerController.upsertMyCenter
);

module.exports = router;

// Requests management
router.get('/requests', requireManager, managerRequestsController.listRequests);
router.put('/requests/:id/decision', requireManager, [ body('decision').isIn(['approved', 'declined']) ], managerRequestsController.decideRequest);
router.post('/requests/:id/assign', requireManager, [ body('caregiverId').notEmpty() ], managerRequestsController.assignRequest);

// Caregivers
router.get('/caregivers', requireManager, caregiverController.listCaregivers);
router.post('/caregivers', requireManager, [ body('name').notEmpty(), body('email').isEmail(), body('phone').notEmpty() ], caregiverController.createCaregiver);
router.put('/caregivers/:id', requireManager, caregiverController.updateCaregiver);
router.delete('/caregivers/:id', requireManager, caregiverController.deleteCaregiver);


