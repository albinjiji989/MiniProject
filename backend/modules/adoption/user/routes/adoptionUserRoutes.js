const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const paymentController = require('../controllers/paymentController');
const petController = require('../controllers/petController');
const certificateController = require('../controllers/certificateController'); // Add this import
const { auth } = require('../../../../core/middleware/auth');
const { authorize } = require('../../../../core/middleware/role');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Optional auth middleware - attaches user if token exists, but doesn't require it
const optionalAuth = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (token) {
    try {
      const jwt = require('jsonwebtoken');
      const User = require('../../../../core/models/User');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Fetch user from database to ensure they exist and are active
      const user = await User.findById(decoded.user.id).select('-password');
      
      if (user && user.isActive) {
        req.user = {
          id: user._id.toString(),
          email: user.email,
          role: user.role
        };
        console.log('✅ optionalAuth - User authenticated:', req.user);
      } else {
        console.log('⚠️ optionalAuth - User not found or inactive');
      }
    } catch (error) {
      // Token invalid or expired, continue without user
      console.log('⚠️ optionalAuth - Token error:', error.message);
    }
  } else {
    console.log('ℹ️ optionalAuth - No token provided');
  }
  next();
};

// Public Routes (no auth required, but user info attached if available)
router.get('/public/pets', petController.getPublicPets);
router.get('/public/pets/:id', optionalAuth, petController.getPublicPetDetails);

// User Routes - Authenticated users only
router.get('/pets', auth, applicationController.getAvailablePets);
router.get('/pets/:id', auth, applicationController.getPetDetails);
router.get('/pets/:id/for-application', auth, applicationController.getUserApplicationPetDetails);
router.get('/pets/search', auth, applicationController.searchPets);

// Adoption Applications
router.post('/applications', auth, applicationController.submitApplication);
router.get('/applications/my', auth, applicationController.getUserApplications);
router.get('/applications/:id', auth, applicationController.getUserApplicationById);
router.put('/applications/:id/cancel', auth, applicationController.cancelApplication);
// User Document Upload (image/pdf)
router.post('/applications/upload', auth, upload.single('file'), applicationController.uploadDocument);

// Payment Routes
router.post('/payments/create-order', auth, paymentController.createUserPaymentOrder);
router.post('/payments/verify', auth, paymentController.verifyUserPayment);

// Certificates - Add this route
router.get('/certificates/:applicationId/file', auth, certificateController.streamCertificateFile);

// User Dashboard
router.get('/my-adopted-pets', auth, petController.getUserAdoptedPets);
router.get('/my-adopted-pets/:id', auth, petController.getUserAdoptedPetDetails);

// Medical History for Adopted Pets
router.put('/my-adopted-pets/:id/medical-history', auth, petController.addMedicalHistory);
router.get('/my-adopted-pets/:id/medical-history', auth, petController.getMedicalHistory);

// User Handover Routes
router.get('/applications/:id/handover', auth, petController.getUserHandoverDetails);

module.exports = router;