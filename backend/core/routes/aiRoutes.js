/**
 * AI Routes - Python Railway Service Integration
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const aiController = require('../controllers/aiController');

// Configure multer for memory storage (no disk writes)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
  }
});

// Health check
router.get('/health', aiController.checkAIHealth);

// Image identification endpoints
router.post('/identify-breed', upload.single('image'), aiController.identifyBreed);
router.post('/identify-species', upload.single('image'), aiController.identifySpecies);
router.post('/identify-adoption', upload.single('image'), aiController.identifyForAdoption);

// Recommendation endpoints
router.get('/adoption-recommendations/:userId', aiController.getAdoptionRecommendations);
router.get('/ecommerce-recommendations/:userId', aiController.getEcommerceRecommendations);

// Inventory prediction endpoints
router.get('/inventory/critical', aiController.getCriticalInventory);
router.get('/inventory/:productId', aiController.getInventoryPrediction);
router.get('/inventory', aiController.getAllInventoryPredictions);

module.exports = router;
