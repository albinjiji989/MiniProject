// Thin adapter: reuse existing module route
const express = require('express');
const { body } = require('express-validator');
const { auth, authorizeModule } = require('../../../middleware/auth');
const controller = require('../controllers/adoptionController');

const router = express.Router();

router.get('/', auth, authorizeModule('adoption'), controller.listAdoptions);
router.get('/:id', auth, authorizeModule('adoption'), controller.getAdoptionById);
router.post(
  '/',
  auth,
  authorizeModule('adoption'),
  [
    body('pet').notEmpty().withMessage('Pet ID is required'),
    body('adopter.name').notEmpty().withMessage('Adopter name is required'),
    body('adopter.email').isEmail().withMessage('Valid email is required'),
    body('adopter.phone').notEmpty().withMessage('Phone number is required')
  ],
  controller.createAdoption
);
router.put(
  '/:id/status',
  auth,
  authorizeModule('adoption'),
  [
    body('status').isIn(['pending', 'under_review', 'approved', 'rejected', 'completed', 'cancelled']).withMessage('Invalid status'),
    body('reviewNotes').optional().isString()
  ],
  controller.updateAdoptionStatus
);
router.delete('/:id', auth, authorizeModule('adoption'), async (req, res) => {
  try {
    const Adoption = require('../models/Adoption');
    const { getStoreFilter } = require('../../../utils/storeFilter');
    const filter = { _id: req.params.id, ...getStoreFilter(req.user) };
    const deleted = await Adoption.findOneAndDelete(filter);
    if (!deleted) return res.status(404).json({ success: false, message: 'Adoption application not found or not allowed' });
    res.json({ success: true, message: 'Adoption application deleted successfully' });
  } catch (error) {
    console.error('Delete adoption error:', error);
    res.status(500).json({ success: false, message: 'Server error during deletion' });
  }
});

module.exports = router;

