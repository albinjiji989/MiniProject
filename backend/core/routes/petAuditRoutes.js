const express = require('express');
const router = express.Router();
const { 
  getPetAuditTrail,
  getPetAuditSummary,
  getUserAuditEntries,
  logPetMovement
} = require('../controllers/petAuditController');

const { auth, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Get audit trail for a specific pet
router.get('/pet/:petCode/trail', getPetAuditTrail);

// Get audit summary for a specific pet
router.get('/pet/:petCode/summary', getPetAuditSummary);

// Get all audit entries for the current user
router.get('/user/entries', getUserAuditEntries);

// Log a custom pet movement (admin/manager only)
router.post('/log', authorize('admin', 'manager'), logPetMovement);

module.exports = router;