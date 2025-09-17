const express = require('express');
const { body } = require('express-validator');
const { auth, authorizeModule } = require('../../../core/middleware/auth');
const controller = require('../controllers/pharmacyController');

const router = express.Router();

router.get('/medications', auth, authorizeModule('pharmacy'), controller.listMedications);
router.post(
  '/medications',
  auth,
  authorizeModule('pharmacy'),
  [
    body('name').notEmpty().withMessage('Medication name is required'),
    body('category').isIn(['antibiotic', 'pain_relief', 'vitamin', 'supplement', 'vaccine', 'dewormer', 'flea_treatment', 'other']).withMessage('Invalid category'),
    body('form').isIn(['tablet', 'capsule', 'liquid', 'injection', 'topical', 'powder', 'paste']).withMessage('Invalid form'),
    body('price').isNumeric().withMessage('Price must be a number'),
    body('inventory.quantity').isNumeric().withMessage('Quantity must be a number')
  ],
  controller.createMedication
);
router.get('/medications/:id', auth, authorizeModule('pharmacy'), controller.getMedicationById);
router.put(
  '/medications/:id',
  auth,
  authorizeModule('pharmacy'),
  [
    body('name').optional().notEmpty(),
    body('price').optional().isNumeric(),
    body('inventory.quantity').optional().isNumeric()
  ],
  controller.updateMedication
);
router.delete('/medications/:id', auth, authorizeModule('pharmacy'), controller.deleteMedication);

module.exports = router;

