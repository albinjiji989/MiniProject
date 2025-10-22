const express = require('express');
const router = express.Router();
const { auth } = require('../../../core/middleware/auth');
const centralizedPetController = require('../../controllers/centralizedPetController');

// Centralized pets routes
router.get('/', auth, centralizedPetController.getAllCentralizedPets);
router.get('/:petCode', auth, centralizedPetController.getCentralizedPet);
router.get('/search/:searchTerm', auth, centralizedPetController.searchCentralizedPets);
router.get('/stats/overview', auth, centralizedPetController.getCentralizedPetStats);
router.get('/recent/:limit?', auth, centralizedPetController.getRecentPets);

module.exports = router;