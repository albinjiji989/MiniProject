const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { auth } = require('../../../core/middleware/auth');
const coreController = require('../../controllers/coreController');

// System logs routes
router.get('/logs', auth, coreController.getSystemLogs);
router.put('/logs/:id/resolve', [
  auth,
  body('resolution').notEmpty().withMessage('Resolution is required')
], coreController.resolveSystemLog);

// System config routes
router.get('/config', auth, coreController.getSystemConfig);
router.post('/config', [
  auth,
  body('key').notEmpty().withMessage('Key is required'),
  body('value').notEmpty().withMessage('Value is required'),
  body('type').isIn(['string', 'number', 'boolean', 'object', 'array']).withMessage('Invalid type'),
  body('category').isIn(['general', 'email', 'payment', 'storage', 'security', 'notification', 'api']).withMessage('Invalid category'),
  body('description').notEmpty().withMessage('Description is required')
], coreController.createSystemConfig);
router.put('/config/:id', [
  auth,
  body('value').notEmpty().withMessage('Value is required')
], coreController.updateSystemConfig);

// System stats and health routes
router.get('/stats', auth, coreController.getSystemStats);
router.get('/health', coreController.getSystemHealth);

module.exports = router;