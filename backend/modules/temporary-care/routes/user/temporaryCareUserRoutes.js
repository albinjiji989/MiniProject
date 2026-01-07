const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../../../../core/middleware/auth');
const userTemporaryCareController = require('../../user/controllers/userTemporaryCareController');
const paymentController = require('../../user/controllers/paymentController');
const careActivityController = require('../../user/controllers/careActivityController');

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

// Public centers listing (active only)
router.get('/public/centers', async (req, res) => {
  try {
    const centers = await TemporaryCareCenter.find({ isActive: true }).select('name capacity storeId storeName address');
    res.json({ success: true, data: { centers } });
  } catch (e) {
    console.error('List public centers error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

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