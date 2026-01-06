const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/auth');
const controller = require('../../controllers/userPetsController');

/**
 * @route   GET /api/user/unified/all-pets
 * @desc    Get all pets owned by current user from all sources (unified endpoint)
 * @access  Private
 */
router.get('/all-pets', auth, controller.getAllUserPets);

/**
 * @route   GET /api/user/unified/pet-stats
 * @desc    Get pet statistics for current user
 * @access  Private
 */
router.get('/pet-stats', auth, controller.getUserPetStats);

module.exports = router;
