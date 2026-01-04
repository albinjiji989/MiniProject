/**
 * Batch Routes
 * Handles all batch-related endpoints
 */

const express = require('express');
const router = express.Router();
const batchController = require('../controllers/batchController');
const { auth, authorize } = require('../../../../core/middleware/auth');

// ============= PUBLIC ROUTES (No auth required for listing) =============

// List all published batches with filters and pagination
router.get('/', batchController.listBatches);

// Get batch details
router.get('/:id', batchController.getBatchDetails);

// Get batch inventory (list pets in batch)
router.get('/:id/inventory', batchController.getBatchInventory);

// ============= USER ROUTES (Auth required) =============

// Reserve a pet from batch
router.post('/:id/reserve', auth, batchController.reservePetFromBatch);

// ============= MANAGER ROUTES (Auth + Manager authorization) =============

// Create new batch
router.post('/', auth, authorize('petshop_manager', 'admin'), batchController.createBatch);

// Update batch
router.put('/:id', auth, authorize('petshop_manager', 'admin'), batchController.updateBatch);

// Publish batch
router.post('/:id/publish', auth, authorize('petshop_manager', 'admin'), batchController.publishBatch);

// Archive batch
router.post('/:id/archive', auth, authorize('petshop_manager', 'admin'), batchController.archiveBatch);

// Confirm reservation (manager accepts a reserved pet)
router.post('/:batchId/confirm-reservation/:petId', auth, authorize('petshop_manager', 'admin'), batchController.confirmReservation);

// Release reservation (manager rejects/releases a reserved pet)
router.post('/:batchId/release-reservation/:petId', auth, authorize('petshop_manager', 'admin'), batchController.releaseReservation);

// Mark pet as sold (after payment completion)
router.post('/:batchId/mark-sold/:petId', auth, authorize('petshop_manager', 'admin'), batchController.markPetAsSold);

module.exports = router;
