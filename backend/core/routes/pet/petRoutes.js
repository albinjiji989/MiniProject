const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { auth } = require('../../../core/middleware/auth');
const petController = require('../../controllers/petController');

// Pet routes
router.get('/my-pets', auth, petController.getOwnedPets);
router.post('/', auth, petController.createPet);
router.get('/', auth, petController.getPets);
router.get('/:id', auth, petController.getPetById);
router.put('/:id', auth, petController.updatePet);
router.delete('/:id', auth, petController.deletePet);

// Medical history routes
router.put('/:id/medical-history', auth, [
  body('condition').notEmpty().withMessage('Condition is required'),
  body('treatment').notEmpty().withMessage('Treatment is required'),
  body('veterinarian').notEmpty().withMessage('Veterinarian is required')
], petController.addMedicalHistory);

// Vaccination routes
router.put('/:id/vaccination', auth, [
  body('vaccineName').notEmpty().withMessage('Vaccine name is required'),
  body('dateGiven').isISO8601().withMessage('Date given must be a valid date'),
  body('veterinarian').notEmpty().withMessage('Veterinarian is required')
], petController.addVaccinationRecord);

// Ownership history routes
router.put('/:id/owners', auth, [
  body('ownerType').optional().isIn(['public_user', 'petshop', 'adoption_center', 'rescue', 'temporary_care', 'veterinary', 'pharmacy', 'pet_shop', 'other']).withMessage('Invalid ownerType'),
  body('ownerId').optional().isMongoId().withMessage('ownerId must be a valid id'),
  body('ownerName').optional().isString(),
  body('startDate').optional().isISO8601().withMessage('startDate must be a valid date'),
  body('notes').optional().isString()
], petController.addOwnershipHistory);

// Medication routes
router.put('/:id/medications', auth, [
  body('medicationName').notEmpty().withMessage('Medication name is required'),
  body('dosage').optional().isString(),
  body('frequency').optional().isString(),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('prescribedBy').optional().isString(),
  body('notes').optional().isString()
], petController.addMedicationRecord);

// History routes
router.get('/:id/history', auth, petController.getPetHistory);

// Search routes
router.get('/search/nearby', auth, petController.searchNearbyPets);

// Changelog routes
router.get('/:id/changelog', auth, petController.getPetChangelog);

// Registry routes
router.get('/registry/:petCode/history', auth, petController.getRegistryHistory);

module.exports = router;