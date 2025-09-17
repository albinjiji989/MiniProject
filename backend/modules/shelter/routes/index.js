const express = require('express');
const { body } = require('express-validator');
const { auth, authorizeModule } = require('../../../core/middleware/auth');
const controller = require('../controllers/shelterController');

const router = express.Router();

router.get('/', auth, authorizeModule('shelter'), controller.listShelters);
router.get('/:id', auth, authorizeModule('shelter'), controller.getShelterById);
router.post(
  '/',
  auth,
  authorizeModule('shelter'),
  [
    body('name').notEmpty().withMessage('Shelter name is required'),
    body('address').isObject().withMessage('Address is required'),
    body('location.coordinates').isArray({ min: 2, max: 2 }).withMessage('Location coordinates must be [longitude, latitude]'),
    body('capacity.total').isNumeric().withMessage('Total capacity must be a number')
  ],
  controller.createShelter
);
router.put('/:id', auth, authorizeModule('shelter'), controller.updateShelter);
router.post('/:id/pets', auth, authorizeModule('shelter'), [ body('petId').notEmpty().withMessage('Pet ID is required') ], controller.addPetToShelter);
router.get('/stats', auth, authorizeModule('shelter'), controller.getShelterStats);
router.get('/animals', auth, authorizeModule('shelter'), controller.listAnimals);

module.exports = router;

