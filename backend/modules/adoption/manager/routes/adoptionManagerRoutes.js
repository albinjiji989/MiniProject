const express = require('express');
const router = express.Router();
const petManagementController = require('../controllers/petManagementController');
const applicationManagementController = require('../controllers/applicationManagementController');
const paymentController = require('../controllers/paymentController');
const certificateController = require('../controllers/certificateController');
const reportingController = require('../controllers/reportingController');
const storeController = require('../controllers/storeController');
const { auth } = require('../../../../core/middleware/auth');
const { authorize } = require('../../../../core/middleware/role');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Manager Store Setup Routes
router.get('/me/store', auth, authorize('adoption_manager'), storeController.getMyStoreInfo);
router.put('/me/store', auth, authorize('adoption_manager'), storeController.updateMyStoreInfo);

// Manager Routes - Adoption Manager only
router.get('/pets', auth, authorize('adoption_manager'), petManagementController.getManagerPets);
router.get('/pets/:id', auth, authorize('adoption_manager'), petManagementController.getPetById);
router.put('/pets/:id', auth, authorize('adoption_manager'), petManagementController.updatePet);
router.get('/pets/:id/media', auth, authorize('adoption_manager'), petManagementController.getPetMedia);
router.get('/reports', auth, authorize('adoption_manager'), reportingController.getManagerReports);

// Manager Upload Routes - Adoption Manager only
router.post('/pets/upload', auth, authorize('adoption_manager'), upload.single('file'), petManagementController.uploadPetPhoto);
router.post('/pets/upload-document', auth, authorize('adoption_manager'), upload.single('file'), petManagementController.uploadPetDocument);

// REST aliases per specification
// POST /adoption/pets → Add pet for adoption (Manager)
router.post('/pets', auth, authorize('adoption_manager'), petManagementController.createPet);
// DELETE /adoption/pets/:id → Delete pet (Manager) - Hard delete by default
router.delete('/pets/:id', auth, authorize('adoption_manager'), petManagementController.deletePet);
// Soft delete endpoint
router.delete('/pets/:id/soft', auth, authorize('adoption_manager'), petManagementController.softDeletePet);
// Bulk delete pets
router.post('/pets/bulk-delete', auth, authorize('adoption_manager'), petManagementController.bulkDeletePets);
// GET /adoption/pets → Get list of available pets (User)

// Adoption Applications
router.get('/applications', auth, authorize('adoption_manager'), applicationManagementController.getManagerApplications);
router.get('/applications/:id', auth, authorize('adoption_manager'), applicationManagementController.getApplicationById);
router.patch('/applications/:id', auth, authorize('adoption_manager'), applicationManagementController.patchApplicationStatus);
// Simplified handover routes - only schedule and complete
router.post('/applications/:id/handover/schedule', auth, authorize('adoption_manager'), applicationManagementController.scheduleHandover);
router.post('/applications/:id/handover/complete', auth, authorize('adoption_manager'), applicationManagementController.completeHandover);
router.post('/applications/:id/handover/regenerate-otp', auth, authorize('adoption_manager'), applicationManagementController.regenerateHandoverOTP);

// Payment Routes
router.post('/payments/create-order', auth, authorize('adoption_manager'), paymentController.createPaymentOrder);
router.post('/payments/verify', auth, authorize('adoption_manager'), paymentController.verifyPayment);

// Contracts
router.get('/contracts/:applicationId', auth, authorize('adoption_manager'), paymentController.getContract);
router.post('/contracts/generate/:applicationId', auth, authorize('adoption_manager'), paymentController.generateContract);

// Certificates
router.post('/certificates', auth, authorize('adoption_manager'), certificateController.generateCertificate);
router.get('/certificates/:applicationId', auth, authorize('adoption_manager'), certificateController.getCertificateByApplication);
router.get('/certificates/:applicationId/file', auth, authorize('adoption_manager'), certificateController.streamCertificateFile);

module.exports = router;