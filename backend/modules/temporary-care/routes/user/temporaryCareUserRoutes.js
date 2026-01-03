const express = require('express');
const { body } = require('express-validator');
const { auth } = require('../../../../core/middleware/auth');
const userTemporaryCareController = require('../../user/controllers/userTemporaryCareController');
const paymentController = require('../../user/controllers/paymentController');
const careActivityController = require('../../user/controllers/careActivityController');
const TemporaryCareCenter = require('../../manager/models/TemporaryCareCenter');
const TemporaryCare = require('../../models/TemporaryCare');
const Pet = require('../../../../core/models/Pet');

const router = express.Router();

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