const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../../../../core/middleware/auth');
const pharmacyManagerController = require('../controllers/pharmacyManagerController');

// Get medicines (manager view)
router.get('/medicines', auth, authorize('pharmacy_manager'), pharmacyManagerController.getMedicines);

// Create/update medicine
router.post('/medicines', auth, authorize('pharmacy_manager'), pharmacyManagerController.createOrUpdateMedicine);
router.put('/medicines/:medicineId', auth, authorize('pharmacy_manager'), pharmacyManagerController.createOrUpdateMedicine);

// Delete medicine
router.delete('/medicines/:medicineId', auth, authorize('pharmacy_manager'), pharmacyManagerController.deleteMedicine);

// Prescription management
router.get('/prescriptions/pending', auth, authorize('pharmacy_manager'), pharmacyManagerController.getPendingPrescriptions);
router.put('/prescriptions/:prescriptionId/approve', auth, authorize('pharmacy_manager'), pharmacyManagerController.approvePrescription);
router.put('/prescriptions/:prescriptionId/reject', auth, authorize('pharmacy_manager'), pharmacyManagerController.rejectPrescription);

// Order management
router.get('/orders', auth, authorize('pharmacy_manager'), pharmacyManagerController.getOrders);
router.put('/orders/:orderId/status', auth, authorize('pharmacy_manager'), pharmacyManagerController.updateOrderStatus);

// Reports
router.get('/reports', auth, authorize('pharmacy_manager'), pharmacyManagerController.getReports);

module.exports = router;
