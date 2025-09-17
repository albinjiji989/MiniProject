const express = require('express');
const { body } = require('express-validator');
const { auth, authorizeModule } = require('../../../core/middleware/auth');
const controller = require('../controllers/veterinaryController');

const router = express.Router();

router.get('/clinics', auth, authorizeModule('veterinary'), controller.listClinics);
router.post(
  '/clinics',
  auth,
  authorizeModule('veterinary'),
  [
    body('name').notEmpty().withMessage('Clinic name is required'),
    body('address').isObject().withMessage('Address is required'),
    body('location.coordinates').isArray({ min: 2, max: 2 }).withMessage('Location coordinates must be [longitude, latitude]'),
    body('contact.phone').notEmpty().withMessage('Phone number is required'),
    body('contact.email').isEmail().withMessage('Valid email is required')
  ],
  controller.createClinic
);

module.exports = router;

