const express = require('express');
const router = express.Router();
const { auth } = require('../../core/middleware/auth');
const { authorize } = require('../../core/middleware/role');

const moduleManagementController = require('./controllers/moduleManagementController');

// Module Management Routes (Admin Only)
router.get('/modules', auth, authorize('admin'), moduleManagementController.getAllModules);
router.get('/modules/stats', auth, authorize('admin'), moduleManagementController.getManagerStatsByModule);

// Manager Management Routes (Admin Only)
router.get('/managers', auth, authorize('admin'), moduleManagementController.getAllManagers);
router.post('/managers/invite', auth, authorize('admin'), moduleManagementController.inviteManager);
router.put('/managers/:managerId/modules', auth, authorize('admin'), moduleManagementController.updateManagerModules);
router.put('/managers/:managerId/store', auth, authorize('admin'), moduleManagementController.updateManagerStore);
router.patch('/managers/:managerId/toggle-status', auth, authorize('admin'), moduleManagementController.toggleManagerStatus);
router.post('/managers/:managerId/reset-password', auth, authorize('admin'), moduleManagementController.resetManagerPassword);
router.delete('/managers/:managerId', auth, authorize('admin'), moduleManagementController.deleteManager);

// Invites
router.get('/invites/pending', auth, authorize('admin'), moduleManagementController.getPendingInvites);

module.exports = router;
