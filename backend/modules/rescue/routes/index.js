const express = require('express');
const { body } = require('express-validator');
const { auth, authorizeModule } = require('../../../core/middleware/auth');
const controller = require('../controllers/rescueController');

const router = express.Router();

router.get('/', auth, authorizeModule('rescue'), controller.listRescues);
router.post(
  '/',
  auth,
  authorizeModule('rescue'),
  [
    body('location.coordinates').isArray({ min: 2, max: 2 }).withMessage('Location coordinates must be [longitude, latitude]'),
    body('situation').isIn(['abandoned', 'injured', 'lost', 'abused', 'stray', 'emergency', 'other']).withMessage('Invalid situation'),
    body('pet').notEmpty().withMessage('Pet ID is required'),
    body('description').notEmpty().withMessage('Description is required')
  ],
  controller.createRescue
);

module.exports = router;

