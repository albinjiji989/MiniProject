const express = require('express');
const router = express.Router();
const { 
  createAgeTracker,
  getCurrentAge,
  updateAgeTracker,
  updateAllAges,
  deleteAgeTracker,
  getPetsByAgeRange,
  getAgeStatistics
} = require('../controllers/petAgeController');

const { auth, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Create age tracker for a pet
router.post('/', createAgeTracker);

// Get current age for a specific pet
router.get('/:petCode/current', getCurrentAge);

// Update age tracker for a pet
router.put('/:petCode', updateAgeTracker);

// Delete age tracker for a pet
router.delete('/:petCode', deleteAgeTracker);

// Get pets by age range
router.get('/range', getPetsByAgeRange);

// Get age statistics
router.get('/statistics', getAgeStatistics);

// Update all pet ages (admin/manager only)
router.post('/update-all', authorize('admin', 'manager'), updateAllAges);

module.exports = router;