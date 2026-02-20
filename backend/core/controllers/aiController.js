/**
 * AI Controller - Handles AI/ML requests
 * Routes requests to Python Railway service
 */

const pythonAIService = require('../../services/pythonAIService');

/**
 * Health check for Python AI service
 */
exports.checkAIHealth = async (req, res) => {
  try {
    const health = await pythonAIService.healthCheck();
    res.json({
      success: true,
      message: 'Python AI Service is healthy',
      data: health
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Python AI Service is unavailable',
      error: error.message
    });
  }
};

/**
 * Identify pet breed from image
 * POST /api/ai/identify-breed
 * Body: multipart/form-data with 'image' file
 */
exports.identifyBreed = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const topK = parseInt(req.body.top_k) || 5;
    const uploadToCloudinary = req.body.upload_to_cloudinary === 'true';

    const result = await pythonAIService.identifyBreed(
      req.file.buffer,
      req.file.originalname,
      topK,
      uploadToCloudinary
    );

    res.json(result);
  } catch (error) {
    console.error('Breed identification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to identify breed',
      error: error.message
    });
  }
};

/**
 * Identify pet species from image
 * POST /api/ai/identify-species
 * Body: multipart/form-data with 'image' file
 */
exports.identifySpecies = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const result = await pythonAIService.identifySpecies(
      req.file.buffer,
      req.file.originalname
    );

    res.json(result);
  } catch (error) {
    console.error('Species identification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to identify species',
      error: error.message
    });
  }
};

/**
 * Identify pet for adoption
 * POST /api/ai/identify-adoption
 * Body: multipart/form-data with 'image' file
 */
exports.identifyForAdoption = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const result = await pythonAIService.identifyForAdoption(
      req.file.buffer,
      req.file.originalname
    );

    res.json(result);
  } catch (error) {
    console.error('Adoption identification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to identify pet',
      error: error.message
    });
  }
};

/**
 * Get adoption recommendations
 * GET /api/ai/adoption-recommendations/:userId
 */
exports.getAdoptionRecommendations = async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const result = await pythonAIService.getAdoptionRecommendations(userId, limit);

    res.json(result);
  } catch (error) {
    console.error('Adoption recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recommendations',
      error: error.message
    });
  }
};

/**
 * Get inventory prediction
 * GET /api/ai/inventory/:productId
 */
exports.getInventoryPrediction = async (req, res) => {
  try {
    const { productId } = req.params;

    const result = await pythonAIService.getInventoryPrediction(productId);

    res.json(result);
  } catch (error) {
    console.error('Inventory prediction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get inventory prediction',
      error: error.message
    });
  }
};

/**
 * Get all inventory predictions
 * GET /api/ai/inventory
 */
exports.getAllInventoryPredictions = async (req, res) => {
  try {
    const result = await pythonAIService.getAllInventoryPredictions();

    res.json(result);
  } catch (error) {
    console.error('All inventory predictions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get inventory predictions',
      error: error.message
    });
  }
};

/**
 * Get critical inventory items
 * GET /api/ai/inventory/critical
 */
exports.getCriticalInventory = async (req, res) => {
  try {
    const result = await pythonAIService.getCriticalInventory();

    res.json(result);
  } catch (error) {
    console.error('Critical inventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get critical inventory',
      error: error.message
    });
  }
};

/**
 * Get e-commerce recommendations
 * GET /api/ai/ecommerce-recommendations/:userId
 */
exports.getEcommerceRecommendations = async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const result = await pythonAIService.getEcommerceRecommendations(userId, limit);

    res.json(result);
  } catch (error) {
    console.error('E-commerce recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recommendations',
      error: error.message
    });
  }
};
