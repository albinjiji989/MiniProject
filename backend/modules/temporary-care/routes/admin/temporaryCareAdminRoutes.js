const express = require('express');
const { body } = require('express-validator');
const { authenticate, auth } = require('../../../../core/middleware/auth');
const { authorize } = require('../../../../core/middleware/role');
const TemporaryCareCenter = require('../../manager/models/TemporaryCareCenter');
const analyticsController = require('../controllers/analyticsController');

// New Controllers
const serviceTypeController = require('../controllers/serviceTypeController');
const staffController = require('../controllers/staffController');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

// Use consistent auth middleware
const authMiddleware = authenticate || auth;
const roleMiddleware = (role) => authorize ? authorize([role]) : authorize(role);

/**
 * Service Type Management Routes
 */
router.get('/service-types', authMiddleware, roleMiddleware('admin'), serviceTypeController.getAllServiceTypes);
router.get('/service-types/stats', authMiddleware, roleMiddleware('admin'), serviceTypeController.getServiceTypeStats);
router.get('/service-types/:id', authMiddleware, roleMiddleware('admin'), serviceTypeController.getServiceType);
router.post('/service-types', authMiddleware, roleMiddleware('admin'), serviceTypeController.createServiceType);
router.put('/service-types/:id', authMiddleware, roleMiddleware('admin'), serviceTypeController.updateServiceType);
router.patch('/service-types/:id/toggle-status', authMiddleware, roleMiddleware('admin'), serviceTypeController.toggleServiceTypeStatus);
router.delete('/service-types/:id', authMiddleware, roleMiddleware('admin'), serviceTypeController.deleteServiceType);

/**
 * Staff Management Routes
 */
router.get('/staff', authMiddleware, roleMiddleware('admin'), staffController.getAllStaff);
router.get('/staff/stats', authMiddleware, roleMiddleware('admin'), staffController.getStaffStats);
router.get('/staff/performance', authMiddleware, roleMiddleware('admin'), staffController.getStaffPerformance);
router.get('/staff/:id', authMiddleware, roleMiddleware('admin'), staffController.getStaff);
router.post('/staff', authMiddleware, roleMiddleware('admin'), staffController.createStaff);
router.put('/staff/:id', authMiddleware, roleMiddleware('admin'), staffController.updateStaff);
router.patch('/staff/:id/status', authMiddleware, roleMiddleware('admin'), staffController.updateStaffStatus);
router.patch('/staff/:id/documents/:documentId/verify', authMiddleware, roleMiddleware('admin'), staffController.verifyDocument);
router.delete('/staff/:id', authMiddleware, roleMiddleware('admin'), staffController.deleteStaff);

/**
 * Booking Management Routes
 */
router.get('/bookings', authMiddleware, roleMiddleware('admin'), bookingController.getAllBookings);
router.get('/bookings/stats', authMiddleware, roleMiddleware('admin'), bookingController.getBookingStats);
router.get('/bookings/:id', authMiddleware, roleMiddleware('admin'), bookingController.getBooking);
router.patch('/bookings/:id/status', authMiddleware, roleMiddleware('admin'), bookingController.updateBookingStatus);
router.post('/bookings/:id/assign-caregiver', authMiddleware, roleMiddleware('admin'), bookingController.assignCaregiver);
router.delete('/bookings/:id/remove-caregiver', authMiddleware, roleMiddleware('admin'), bookingController.removeCaregiver);
router.post('/bookings/:id/activity-log', authMiddleware, roleMiddleware('admin'), bookingController.addActivityLog);
router.post('/bookings/:id/cancel', authMiddleware, roleMiddleware('admin'), bookingController.cancelBooking);
router.post('/bookings/:id/generate-otp', authMiddleware, roleMiddleware('admin'), bookingController.generateHandoverOTP);

/**
 * Legacy Center Management Routes
 */
router.get('/centers', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const centers = await TemporaryCareCenter.find().sort({ createdAt: -1 });
    res.json({ success: true, data: { centers } });
  } catch (e) {
    console.error('Admin list centers error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/centers/:id/status', authMiddleware, roleMiddleware('admin'), [ body('isActive').isBoolean() ], async (req, res) => {
  try {
    const center = await TemporaryCareCenter.findById(req.params.id);
    if (!center) return res.status(404).json({ success: false, message: 'Center not found' });
    center.isActive = !!req.body.isActive;
    await center.save();
    res.json({ success: true, message: 'Status updated', data: { center } });
  } catch (e) {
    console.error('Admin update center status error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Analytics and monitoring
router.get('/stats', authMiddleware, roleMiddleware('admin'), analyticsController.getStats);
router.get('/reports/revenue', authMiddleware, roleMiddleware('admin'), analyticsController.getRevenueReport);
router.get('/reports/care-types', authMiddleware, roleMiddleware('admin'), analyticsController.getCareTypeDistribution);

module.exports = router;


