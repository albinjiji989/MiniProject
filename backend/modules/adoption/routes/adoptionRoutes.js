const express = require('express');
const router = express.Router();
const adoptionController = require('../controllers/adoptionController');
const managerController = require('../controllers/managerController');
const userController = require('../controllers/userController');
const certificateController = require('../controllers/certificateController');
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
router.get('/pets', userController.getAvailablePets);
router.get('/pets/:id', userController.getPetDetails);
router.get('/pets/search', userController.searchPets);

// REST aliases per specification
// POST /adoption/pets → Add pet for adoption (Manager)
router.post('/pets', auth, authorize('adoption_manager'), managerController.createPet);
// GET /adoption/pets → Get list of available pets (User)
router.get('/pets', userController.getAvailablePets);
// GET /adoption/pets/:id → Get single pet details
router.get('/pets/:id', userController.getPetDetails);

// Adoption Applications
router.post('/applications', auth, userController.submitApplication);
router.get('/applications/my', auth, userController.getUserApplications);
router.get('/applications/:id', auth, userController.getUserApplicationById);
router.put('/applications/:id/cancel', auth, userController.cancelApplication);
// User Document Upload (image/pdf)
router.post('/applications/upload', auth, upload.single('file'), userController.uploadDocument);

// REST alias: POST /adoption/requests → User submits adoption request
router.post('/requests', auth, userController.submitApplication);
// REST alias: GET /adoption/requests → Manager views all requests
router.get('/requests', auth, authorize('adoption_manager'), managerController.getManagerApplications);
// REST alias: GET /adoption/requests/:userId → User views their requests (if same user) or manager can view
router.get('/requests/:userId', auth, async (req, res, next) => {
  try {
    if (req.params.userId === req.user.id) {
      return userController.getUserApplications(req, res, next);
    }
    // Otherwise require manager/admin
    const roleAuth = require('../../../core/middleware/role').authorize;
    return roleAuth('adoption_manager')(req, res, () => managerController.getManagerApplications(req, res, next));
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});
// REST alias: PATCH /adoption/requests/:id → Manager approves/rejects request
router.patch('/requests/:id', auth, authorize('adoption_manager'), managerController.patchApplicationStatus);

// Manager Applications
// Manager: list applications (supports page, limit, status, fields, lean)
router.get('/manager/applications', auth, authorize('adoption_manager'), managerController.getManagerApplications);
// Manager: get single application details
router.get('/manager/applications/:id', auth, authorize('adoption_manager'), managerController.getApplicationById);
router.post('/manager/applications/:id/handover/schedule', auth, authorize('adoption_manager'), managerController.scheduleHandover);
router.patch('/manager/applications/:id/handover', auth, authorize('adoption_manager'), managerController.updateHandover);
router.post('/manager/applications/:id/handover/complete', auth, authorize('adoption_manager'), managerController.completeHandover);

// User Handover Routes
router.get('/user/applications/:id/handover', auth, async (req, res) => {
  try {
    const AdoptionRequest = require('../models/AdoptionRequest');
    const app = await AdoptionRequest.findOne({ _id: req.params.id, userId: req.user.id, isActive: true }).select('handover status contractURL');
    if (!app) return res.status(404).json({ success: false, error: 'Application not found' });
    return res.json({ success: true, data: { handover: app.handover || {}, status: app.status, contractURL: app.contractURL || null } });
  } catch (e) { return res.status(500).json({ success: false, error: e.message }); }
});
router.post('/user/applications/:id/handover/confirm', auth, async (req, res) => {
  try {
    const AdoptionRequest = require('../models/AdoptionRequest');
    const app = await AdoptionRequest.findOne({ _id: req.params.id, userId: req.user.id, isActive: true });
    if (!app) return res.status(404).json({ success: false, error: 'Application not found' });
    app.handover = app.handover || {};
    app.handover.confirmedByUserAt = new Date();
    await app.save();
    return res.json({ success: true, message: 'Handover confirmed by user' });
  } catch (e) { return res.status(500).json({ success: false, error: e.message }); }
});

// Payment Routes
router.post('/payments/create-order', auth, userController.createUserPaymentOrder);
router.post('/payments/verify', auth, userController.verifyUserPayment);

// User Dashboard
router.get('/my-adopted-pets', auth, userController.getUserAdoptedPets);
router.get('/my-adopted-pets/:id', auth, userController.getUserAdoptedPetDetails);

// Public Routes (no auth required)
router.get('/public/pets', userController.getPublicPets);
router.get('/public/pets/:id', userController.getPublicPetDetails);

// Certificates
// POST /adoption/certificates → Generate adoption certificate (Manager)
router.post('/certificates', auth, authorize('adoption_manager'), certificateController.generateCertificate);
// GET /adoption/certificates/:applicationId → Download/view certificate (Owner or Manager)
router.get('/certificates/:applicationId', auth, certificateController.getCertificateByApplication);
// GET /adoption/certificates/:applicationId/file → Stream file via backend (Owner or Manager)
router.get('/certificates/:applicationId/file', auth, certificateController.streamCertificateFile);

// Manager Contracts (used prior to certificate):
// GET existing contract URL
router.get('/manager/contracts/:applicationId', auth, authorize('adoption_manager'), managerController.getContract);
// POST generate new contract
router.post('/manager/contracts/generate/:applicationId', auth, authorize('adoption_manager'), managerController.generateContract);

module.exports = router;
