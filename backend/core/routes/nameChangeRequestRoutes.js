const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const nameChangeRequestController = require('../controllers/nameChangeRequestController');

// User routes
router.post('/request', auth, nameChangeRequestController.createNameChangeRequest);
router.get('/my-requests', auth, nameChangeRequestController.getMyRequests);
router.get('/request/:requestId', auth, nameChangeRequestController.getRequestById);

// Admin routes
router.get('/admin/all', auth, authorize('admin', 'super_admin'), nameChangeRequestController.getAllRequests);
router.put('/admin/approve/:requestId', auth, authorize('admin', 'super_admin'), nameChangeRequestController.approveRequest);
router.put('/admin/reject/:requestId', auth, authorize('admin', 'super_admin'), nameChangeRequestController.rejectRequest);

module.exports = router;
