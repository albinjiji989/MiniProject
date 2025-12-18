const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/auth');
const { setPetBirthdayPreference, getPetBirthdayPreference, getUserPetsWithPreferences } = require('../../controllers/pet/petBirthdayController');

// @route   POST /api/pets/birthday-preference
// @desc    Set pet birthday preference
// @access  Private
router.post('/birthday-preference', auth, setPetBirthdayPreference);

// @route   GET /api/pets/birthday-preference/:petId
// @desc    Get pet birthday preference
// @access  Private
router.get('/birthday-preference/:petId', auth, getPetBirthdayPreference);

// @route   GET /api/pets/birthday-preferences
// @desc    Get all pet birthday preferences for current user
// @access  Private
router.get('/birthday-preferences', auth, getUserPetsWithPreferences);

module.exports = router;