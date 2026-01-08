const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../../../../core/middleware/auth');
const userTemporaryCareController = require('../../user/controllers/userTemporaryCareController');
const paymentController = require('../../user/controllers/paymentController');
const careActivityController = require('../../user/controllers/careActivityController');
const applicationController = require('../../user/controllers/applicationController');

// New booking controller
const bookingController = require('../../user/controllers/bookingController');

const TemporaryCareCenter = require('../../manager/models/TemporaryCareCenter');
const TemporaryCare = require('../../models/TemporaryCare');
const Pet = require('../../../../core/models/Pet');

const router = express.Router();

/**
 * New Booking System Routes
 */

// Get available services
router.get('/services', auth, bookingController.getAvailableServices);

// Get user's pets for booking
router.get('/my-pets', auth, bookingController.getUserPets);

// Calculate booking price
router.post('/calculate-price', auth, bookingController.calculatePrice);

// Create new booking
router.post('/bookings', auth, [
  body('petId').notEmpty().withMessage('Pet is required'),
  body('serviceTypeId').notEmpty().withMessage('Service type is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('locationType').isIn(['facility', 'customer_home']).optional()
], bookingController.createBooking);

// Get user's bookings
router.get('/bookings', auth, bookingController.getUserBookings);

// Get single booking details
router.get('/bookings/:id', auth, bookingController.getBookingDetails);

// Cancel booking
router.post('/bookings/:id/cancel', auth, [
  body('reason').notEmpty().withMessage('Cancellation reason is required')
], bookingController.cancelBooking);

// Submit review
router.post('/bookings/:id/review', auth, [
  body('ratings.overall').isInt({ min: 1, max: 5 }).withMessage('Overall rating is required (1-5)'),
  body('comment').notEmpty().withMessage('Comment is required'),
  body('wouldRecommend').isBoolean().withMessage('Recommendation status is required')
], bookingController.submitReview);

// Verify handover OTP
router.post('/bookings/:id/verify-otp', auth, [
  body('type').isIn(['dropOff', 'pickup']).withMessage('Type must be dropOff or pickup'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
], bookingController.verifyHandoverOTP);

// Get booking timeline/activity
router.get('/bookings/:id/timeline', auth, bookingController.getBookingTimeline);

/**
 * Payment Routes
 */
const paymentService = require('../../services/paymentService');

// Create advance payment order
router.post('/payments/advance/create-order', auth, [
  body('bookingId').notEmpty().withMessage('Booking ID is required')
], paymentService.createAdvancePaymentOrder);

// Create final payment order
router.post('/payments/final/create-order', auth, [
  body('bookingId').notEmpty().withMessage('Booking ID is required')
], paymentService.createFinalPaymentOrder);

// Verify payment
router.post('/payments/verify', auth, [
  body('razorpay_order_id').notEmpty(),
  body('razorpay_payment_id').notEmpty(),
  body('razorpay_signature').notEmpty(),
  body('bookingId').notEmpty(),
  body('paymentType').isIn(['advance', 'final'])
], paymentService.verifyPayment);

// Get payment history
router.get('/payments/booking/:bookingId', auth, paymentService.getPaymentHistory);

/**
 * Legacy Routes
 */

// Temporary care requests
router.post(
  '/requests',
  auth,
  [
    body('pet').notEmpty(),
    body('storeId').notEmpty(),
    body('startDate').isISO8601(),
    body('endDate').isISO8601(),
    body('careType').isIn(['emergency', 'vacation', 'medical', 'temporary', 'foster']),
    body('totalAmount').isNumeric().optional()
  ],
  userTemporaryCareController.submitRequest
);

router.get('/requests', auth, userTemporaryCareController.listRequests);

router.get('/active-care', auth, userTemporaryCareController.getActiveCare);

router.get('/care-history', auth, userTemporaryCareController.getCareHistory);

router.put('/requests/:id/cancel', auth, userTemporaryCareController.cancelRequest);

// List available hosts (care centers)
router.get('/hosts', auth, async (req, res) => {
  try {
    const hosts = await TemporaryCareCenter.find({ isActive: true })
      .select('name description address city state capacity storeId storeName');
    res.json({ success: true, data: { hosts } });
  } catch (e) {
    console.error('List hosts error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// List user's stays (temporary care records)
router.get('/my-stays', auth, async (req, res) => {
  try {
    const stays = await TemporaryCare.find({ 'owner.userId': req.user._id })
      .populate('pet', 'name')
      .sort({ startDate: -1 });
    res.json({ success: true, data: { stays } });
  } catch (e) {
    console.error('List stays error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get pets currently in temporary care
router.get('/pets-in-care', auth, async (req, res) => {
  try {
    const cares = await TemporaryCare.find({ 
      'owner.userId': req.user._id,
      status: 'active'
    }).populate('pet');

    const petsInCare = cares.map(care => ({
      ...care.pet.toObject(),
      temporaryCareId: care._id,
      careStartDate: care.startDate,
      careEndDate: care.endDate,
      careCenter: care.storeName
    }));

    res.json({ success: true, data: { pets: petsInCare } });
  } catch (e) {
    console.error('Get pets in care error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Payments
router.post(
  '/payments/order',
  auth,
  [
    body('temporaryCareId').notEmpty(),
    body('paymentType').isIn(['advance', 'final'])
  ],
  paymentController.createPaymentOrder
);

router.post('/payments/verify', auth, paymentController.verifyPayment);

// OTP endpoints for handover
router.post(
  '/otp/generate-drop',
  auth,
  [
    body('temporaryCareId').notEmpty()
  ],
  userTemporaryCareController.generateDropOTP
);

router.post(
  '/otp/verify-drop',
  auth,
  [
    body('temporaryCareId').notEmpty(),
    body('otp').notEmpty().isLength({ min: 6, max: 6 })
  ],
  userTemporaryCareController.verifyDropOTP
);

router.post(
  '/otp/generate-pickup',
  auth,
  [
    body('temporaryCareId').notEmpty()
  ],
  userTemporaryCareController.generatePickupOTP
);

router.post(
  '/otp/verify-pickup',
  auth,
  [
    body('temporaryCareId').notEmpty(),
    body('otp').notEmpty().isLength({ min: 6, max: 6 })
  ],
  userTemporaryCareController.verifyPickupOTP
);

// Care activities
router.post(
  '/care-activities',
  auth,
  [
    body('temporaryCareId').notEmpty(),
    body('activityType').isIn(['feeding', 'bathing', 'walking', 'medication', 'playtime', 'health_check', 'other'])
  ],
  careActivityController.logCareActivity
);

router.get('/care-activities/:temporaryCareId', auth, careActivityController.getCareActivities);

// Public centers listing (active only) - No auth required for browsing
router.get('/public/centers', async (req, res) => {
  try {
    const centers = await TemporaryCareCenter.find({ isActive: true })
      .select('name description capacity storeId storeName address phone email')
      .populate('owner', 'name email phone')
      .lean();
    
    // Calculate available capacity for each center
    const centersWithCapacity = await Promise.all(centers.map(async (center) => {
      // Count active applications for this center
      const TemporaryCareApplication = require('../../models/TemporaryCareApplication');
      const activeApplications = await TemporaryCareApplication.find({
        centerId: center._id,
        status: { $in: ['approved', 'active_care'] },
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() }
      });
      
      const petsInCare = activeApplications.reduce((sum, app) => sum + (app.pets?.length || 0), 0);
      const available = (center.capacity?.total || 0) - petsInCare;
      
      return {
        ...center,
        capacity: {
          total: center.capacity?.total || 0,
          current: petsInCare,
          available: Math.max(0, available)
        }
      };
    }));
    
    res.json({ success: true, data: { centers: centersWithCapacity } });
  } catch (e) {
    console.error('List public centers error:', e);
    res.status(500).json({ success: false, message: 'Server error', error: e.message });
  }
});

/**
 * New Application Routes (Multi-Pet Support)
 */

// Submit temporary care application
router.post('/applications', auth, [
  body('pets').isArray({ min: 1 }).withMessage('At least one pet is required'),
  body('pets.*.petId').notEmpty().withMessage('Pet ID is required'),
  body('centerId').notEmpty().withMessage('Center ID is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required')
], applicationController.submitApplication);

// Calculate estimated pricing
router.post('/applications/calculate-pricing', auth, [
  body('pets').isArray({ min: 1 }).withMessage('At least one pet is required'),
  body('pets.*.petId').notEmpty().withMessage('Pet ID is required'),
  body('centerId').notEmpty().withMessage('Center ID is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required')
], applicationController.calculateEstimatedPricing);

// Get user's applications
router.get('/applications', auth, applicationController.getMyApplications);

// Get application details
router.get('/applications/:id', auth, applicationController.getApplicationDetails);

// Approve pricing set by manager
router.post('/applications/:id/approve-pricing', auth, applicationController.approvePricing);

// Reject pricing set by manager
router.post('/applications/:id/reject-pricing', auth, [
  body('reason').optional().isString()
], applicationController.rejectPricing);

// Cancel application
router.post('/applications/:id/cancel', auth, applicationController.cancelApplication);

/**
 * Application Payment Routes
 */
const applicationPaymentController = require('../../user/controllers/applicationPaymentController');

// Create payment order for application
router.post('/applications/payments/create-order', auth, [
  body('applicationId').notEmpty().withMessage('Application ID is required'),
  body('paymentType').isIn(['advance', 'final']).withMessage('Payment type must be advance or final')
], applicationPaymentController.createApplicationPaymentOrder);

// Verify payment
router.post('/applications/payments/verify', auth, [
  body('razorpay_order_id').notEmpty().withMessage('Order ID is required'),
  body('razorpay_payment_id').notEmpty().withMessage('Payment ID is required'),
  body('razorpay_signature').notEmpty().withMessage('Signature is required'),
  body('applicationId').notEmpty().withMessage('Application ID is required')
], applicationPaymentController.verifyApplicationPayment);

// Get payment history
router.get('/applications/:applicationId/payments', auth, applicationPaymentController.getApplicationPaymentHistory);

// Generate handover OTP after advance payment
router.post('/applications/handover/generate-otp', auth, [
  body('applicationId').notEmpty().withMessage('Application ID is required')
], applicationPaymentController.generateHandoverOTP);

// Verify handover OTP (can be called by manager or user)
router.post('/applications/handover/verify-otp', auth, [
  body('applicationId').notEmpty().withMessage('Application ID is required'),
  body('otp').notEmpty().withMessage('OTP is required')
], applicationPaymentController.verifyHandoverOTP);

/**
 * Application Feedback Routes
 */
const applicationFeedbackController = require('../../user/controllers/applicationFeedbackController');

// Submit feedback
router.post('/applications/:applicationId/feedback', auth, [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().isString(),
  body('serviceRating').optional().isInt({ min: 1, max: 5 }),
  body('staffRating').optional().isInt({ min: 1, max: 5 }),
  body('facilityRating').optional().isInt({ min: 1, max: 5 })
], applicationFeedbackController.submitFeedback);

// Get feedback
router.get('/applications/:applicationId/feedback', auth, applicationFeedbackController.getFeedback);

// Get details for a specific temporary care record
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const care = await TemporaryCare.findOne({
      _id: id,
      'owner.userId': req.user._id
    }).populate('pet', 'name species breed images age color description gender');
    
    if (!care) {
      return res.status(404).json({ success: false, message: 'Temporary care record not found' });
    }
    
    res.json({ success: true, data: { care } });
  } catch (e) {
    console.error('Get temporary care details error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;