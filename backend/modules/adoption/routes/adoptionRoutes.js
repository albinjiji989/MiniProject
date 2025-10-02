const express = require('express');
const router = express.Router();
const adoptionController = require('../controllers/adoptionController');
const managerController = require('../controllers/managerController');
const userController = require('../controllers/userController');
const { auth } = require('../../../core/middleware/auth');
const { authorize } = require('../../../core/middleware/role');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Admin Routes - System Admin only
router.get('/admin/stats', auth, authorize('admin'), adoptionController.getAdminStats);
router.get('/admin/adoptions', auth, authorize('admin'), adoptionController.getAllAdoptions);
router.get('/admin/payments', auth, authorize('admin'), adoptionController.getPaymentReports);
router.get('/admin/analytics', auth, authorize('admin'), adoptionController.getAnalytics);
router.get('/admin/manager-analytics', auth, authorize('admin'), adoptionController.getManagerAnalytics);
router.get('/admin/user-analytics', auth, authorize('admin'), adoptionController.getUserAnalytics);
router.get('/admin/pet-analytics', auth, authorize('admin'), adoptionController.getPetAnalytics);

// Manager Routes - Adoption Manager only
// Pet Management
router.get('/manager/pets', auth, authorize('adoption_manager'), managerController.getManagerPets);
router.get('/manager/pets/new-code', auth, authorize('adoption_manager'), managerController.getNewPetCode);
router.post('/manager/pets', auth, authorize('adoption_manager'), managerController.createPet);
router.get('/manager/pets/:id', auth, authorize('adoption_manager'), managerController.getPetById);
router.put('/manager/pets/:id', auth, authorize('adoption_manager'), managerController.updatePet);
router.delete('/manager/pets/:id', auth, authorize('adoption_manager'), managerController.deletePet);
// CSV Import for incoming animals
router.post('/manager/pets/import', auth, authorize('adoption_manager'), upload.single('file'), managerController.importPetsCSV);

// Application Management
router.get('/manager/applications', auth, authorize('adoption_manager'), managerController.getManagerApplications);
router.get('/manager/applications/:id', auth, authorize('adoption_manager'), managerController.getApplicationById);
router.put('/manager/applications/:id/approve', auth, authorize('adoption_manager'), managerController.approveApplication);
router.put('/manager/applications/:id/reject', auth, authorize('adoption_manager'), managerController.rejectApplication);

// Payment Management
router.post('/manager/payments/create-order', auth, authorize('adoption_manager'), managerController.createPaymentOrder);
router.post('/manager/payments/verify', auth, authorize('adoption_manager'), managerController.verifyPayment);

// Contract Management
router.post('/manager/contracts/generate/:applicationId', auth, authorize('adoption_manager'), managerController.generateContract);
router.get('/manager/contracts/:applicationId', auth, authorize('adoption_manager'), managerController.getContract);

// Manager Reports
router.get('/manager/reports', auth, authorize('adoption_manager'), managerController.getManagerReports);

// User Routes - Public users
// Browse Pets
router.get('/pets', userController.getAvailablePets);
router.get('/pets/:id', userController.getPetDetails);
router.get('/pets/search', userController.searchPets);

// Adoption Applications
router.post('/applications', auth, userController.submitApplication);
router.get('/applications/my', auth, userController.getUserApplications);
router.get('/applications/:id', auth, userController.getUserApplicationById);
router.put('/applications/:id/cancel', auth, userController.cancelApplication);

// Payment Routes
router.post('/payments/create-order', auth, userController.createUserPaymentOrder);
router.post('/payments/verify', auth, userController.verifyUserPayment);

// User Dashboard
router.get('/my-adopted-pets', auth, userController.getUserAdoptedPets);
router.get('/my-adopted-pets/:id', auth, userController.getUserAdoptedPetDetails);

// Public Routes (no auth required)
router.get('/public/pets', userController.getPublicPets);
router.get('/public/pets/:id', userController.getPublicPetDetails);

module.exports = router;
