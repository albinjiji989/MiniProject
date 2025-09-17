const express = require('express');
const { body } = require('express-validator');
const { auth, authorizeModule } = require('../../../core/middleware/auth');
const controller = require('../controllers/temporaryCareController');

const router = express.Router();

router.get('/', auth, authorizeModule('temporary_care'), controller.listTemporaryCares);
router.post(
  '/',
  auth,
  authorizeModule('temporary_care'),
  [
    body('pet').notEmpty().withMessage('Pet ID is required'),
    body('owner.name').notEmpty().withMessage('Owner name is required'),
    body('owner.email').isEmail().withMessage('Valid email is required'),
    body('owner.phone').notEmpty().withMessage('Phone number is required'),
    body('caregiver').notEmpty().withMessage('Caregiver ID is required'),
    body('startDate').isISO8601().withMessage('Start date must be a valid date'),
    body('endDate').isISO8601().withMessage('End date must be a valid date'),
    body('careType').isIn(['emergency', 'vacation', 'medical', 'temporary', 'foster']).withMessage('Invalid care type')
  ],
  controller.createTemporaryCare
);
router.get('/stats', auth, authorizeModule('temporary_care'), controller.getTemporaryCareStats);
router.get('/caregivers', auth, authorizeModule('temporary_care'), controller.listCaregivers);
router.post(
  '/caregivers',
  auth,
  authorizeModule('temporary_care'),
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').notEmpty().withMessage('Phone is required'),
  ],
  controller.createCaregiver
);
router.put(
  '/caregivers/:id',
  auth,
  authorizeModule('temporary_care'),
  controller.updateCaregiver
);
router.delete(
  '/caregivers/:id',
  auth,
  authorizeModule('temporary_care'),
  controller.deleteCaregiver
);

module.exports = router;

