const express = require('express');
const router = express.Router();
const { auth } = require('../../../core/middleware/auth');
const centralizedPetController = require('../../controllers/centralizedPetController');

// Centralized pets routes
router.get('/', auth, centralizedPetController.getAllCentralizedPets);
router.get('/search/:searchTerm', auth, centralizedPetController.searchCentralizedPets);
router.get('/stats/overview', auth, centralizedPetController.getCentralizedPetStats);
router.get('/recent/:limit?', auth, centralizedPetController.getRecentPets);

// Pet name management
router.put('/:petCode/set-name', auth, centralizedPetController.setPetName);
router.put('/:petCode/admin-change-name', auth, centralizedPetController.adminChangePetName);

// Must be last (catches :petCode param)
router.get('/:petCode', auth, centralizedPetController.getCentralizedPet);

module.exports = router;