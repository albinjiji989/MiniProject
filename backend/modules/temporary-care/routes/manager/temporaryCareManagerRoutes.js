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
const applicationManagerController = require('../../manager/controllers/applicationManagerController');

// New booking controller
const bookingController = require('../../manager/controllers/bookingController');

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

/**
 * New Booking Management Routes
 */

// Get all bookings for manager's facility
router.get('/bookings-new', requireManager, bookingController.getAllBookings);

// Get today's schedule
router.get('/schedule/today', requireManager, bookingController.getTodaySchedule);

// Get dashboard statistics
router.get('/dashboard-stats', requireManager, bookingController.getDashboardStats);

// Get booking details
router.get('/bookings-new/:id', requireManager, bookingController.getBookingDetails);

// Assign staff to booking
router.post('/bookings-new/:id/assign-staff', requireManager, [
  body('staffId').notEmpty().withMessage('Staff ID is required'),
  body('role').isIn(['primary', 'backup']).optional()
], bookingController.assignStaff);

// Add activity log
router.post('/bookings-new/:id/activity', requireManager, [
  body('activityType').isIn(['feeding', 'bathing', 'walking', 'medication', 'playtime', 'health_check', 'emergency', 'other']).withMessage('Valid activity type is required'),
  body('notes').notEmpty().withMessage('Notes are required')
], bookingController.addActivity);

// Drop-off management
router.post('/bookings-new/:id/dropoff/generate-otp', requireManager, bookingController.generateDropOffOTP);
router.post('/bookings-new/:id/dropoff/verify', requireManager, [
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
], bookingController.verifyDropOffOTP);

// Pickup management
router.post('/bookings-new/:id/pickup/generate-otp', requireManager, bookingController.generatePickupOTP);
router.post('/bookings-new/:id/pickup/verify', requireManager, [
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
], bookingController.verifyPickupOTP);

// Get available staff
router.get('/staff/available', requireManager, bookingController.getAvailableStaff);

/**
 * Legacy Routes
 */

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

// Inboard pets (pets currently in care)
router.get('/inboard-pets', dashboardController.getInboardPets);
router.get('/inboard-pets/:petCode', dashboardController.getInboardPetDetails);

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

/**
 * New Application Management Routes (Multi-Pet Support)
 */

// Get all applications
router.get('/applications', applicationManagerController.getApplications);

// Get application details
router.get('/applications/:id', applicationManagerController.getApplicationDetails);

// Set pricing for application
router.post('/applications/:id/pricing', [
  body('petPricing').isArray({ min: 1 }).withMessage('Pet pricing is required'),
  body('petPricing.*.petId').notEmpty().withMessage('Pet ID is required'),
  body('petPricing.*.totalAmount').isNumeric().withMessage('Total amount is required')
], applicationManagerController.setPricing);

// Verify capacity
router.get('/applications/:id/verify-capacity', applicationManagerController.verifyCapacity);

// Approve or reject application
router.post('/applications/:id/approve-reject', [
  body('action').isIn(['approve', 'reject']).withMessage('Action must be approve or reject'),
  body('reason').optional().isString()
], applicationManagerController.approveOrRejectApplication);

// Assign kennels
router.post('/applications/:id/assign-kennels', [
  body('assignments').isArray({ min: 1 }).withMessage('At least one assignment is required'),
  body('assignments.*.petId').notEmpty().withMessage('Pet ID is required'),
  body('assignments.*.kennelId').notEmpty().withMessage('Kennel ID is required')
], applicationManagerController.assignKennels);

// Record check-in condition
router.post('/applications/:id/check-in', [
  body('petId').notEmpty().withMessage('Pet ID is required'),
  body('condition.description').notEmpty().withMessage('Condition description is required'),
  body('condition.healthStatus').isIn(['healthy', 'minor_issues', 'needs_attention']).withMessage('Valid health status is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
], applicationManagerController.recordCheckInCondition);

// Add daily care log
router.post('/applications/:id/care-logs', [
  body('date').isISO8601().withMessage('Valid date is required'),
  body('petId').notEmpty().withMessage('Pet ID is required'),
  body('activities').isArray({ min: 1 }).withMessage('At least one activity is required')
], applicationManagerController.addDailyCareLog);

// Record emergency
router.post('/applications/:id/emergency', [
  body('severity').isIn(['low', 'medium', 'high', 'critical']).withMessage('Valid severity is required'),
  body('description').notEmpty().withMessage('Description is required')
], applicationManagerController.recordEmergency);

// Generate final bill
router.post('/applications/:id/final-bill', applicationManagerController.generateFinalBill);

// Record check-out
router.post('/applications/:id/check-out', [
  body('petId').notEmpty().withMessage('Pet ID is required'),
  body('condition.description').notEmpty().withMessage('Condition description is required'),
  body('condition.healthStatus').isIn(['healthy', 'minor_issues', 'needs_attention']).withMessage('Valid health status is required'),
  body('otp').optional().isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
], applicationManagerController.recordCheckOut);

// Dashboard stats
router.get('/applications/dashboard/stats', applicationManagerController.getDashboardStats);

module.exports = router;