const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../../../core/middleware/auth');
const modulesController = require('../../controllers/modulesController');

// Module routes
router.get('/', modulesController.getAllModules);
router.get('/admin', auth, authorize('admin'), modulesController.getAdminModules);
router.post('/', auth, authorize('admin'), (req, res) => {
  return res.status(403).json({ success: false, message: 'Creating new modules is disabled. Admin can only manage existing modules.' });
});
router.patch('/:id', auth, authorize('admin'), modulesController.updateModule);
router.patch('/:id/status', auth, authorize('admin'), modulesController.updateModuleStatus);
router.patch('/:id/hide', auth, authorize('admin'), modulesController.hideModule);
router.patch('/:id/restore', auth, authorize('admin'), modulesController.restoreModule);
router.delete('/:id', auth, authorize('admin'), (req, res) => {
  return res.status(403).json({ success: false, message: 'Deleting modules is disabled. Admin can only update existing modules.' });
});
router.patch('/reorder', auth, authorize('admin'), modulesController.reorderModules);

module.exports = router;