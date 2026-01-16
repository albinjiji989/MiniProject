/**
 * ML-Powered Product Recommendation Controller
 * Integrates with Python AI/ML service for intelligent recommendations
 */

const Product = require('../models/Product');
const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';

/**
 * Train ML recommendation model with current products
 */
const trainRecommendationModel = async (req, res) => {
  try {
    console.log('🤖 Training ML Recommendation Model...');

    // Fetch all active products
    const products = await Product.find({ status: 'active' })
      .populate('category', 'name')
      .populate('breeds', 'name')
      .populate('species', 'name')
      .lean();

    if (products.length === 0) {
      return res.json({
        success: false,
        message: 'No products available to train model'
      });
    }

    // Format products for ML model
    const formattedProducts = products.map(product => ({
      id: product._id.toString(),
      name: product.name,
      description: product.description || '',
      category: product.category?.name || '',
      brand: product.attributes?.brand || '',
      petType: Array.isArray(product.petType) ? product.petType.join(' ') : product.petType || '',
      breed: product.breeds?.map(b => b.name).join(' ') || '',
      species: product.species?.map(s => s.name).join(' ') || '',
      price: product.pricing?.salePrice || product.pricing?.basePrice || 0,
      rating: product.ratings?.average || 0,
      reviewCount: product.ratings?.count || 0,
      popularity: product.analytics?.purchases || 0,
      isFeatured: product.isFeatured || false,
      isBestseller: product.isBestseller || false,
      tags: product.tags || []
    }));

    // Call Python ML service to train model
    const response = await axios.post(`${AI_SERVICE_URL}/api/recommendations/train`, {
      products: formattedProducts
    });

    if (response.data.success) {
      console.log('✅ ML Model trained successfully');
      res.json({
        success: true,
        message: 'ML recommendation model trained successfully',
        data: {
          totalProducts: products.length,
          modelInfo: response.data.model_info
        }
      });
    } else {
      throw new Error(response.data.error || 'Training failed');
    }

  } catch (error) {
    console.error('❌ Error training ML model:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to train ML model',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get ML-based recommendations for a specific breed
 */
const getMLBreedRecommendations = async (req, res) => {
  try {
    const { breed, species } = req.query;
    const { top_k = 10 } = req.query;
    const userId = req.user?._id;

    if (!breed || !species) {
      return res.status(400).json({
        success: false,
        message: 'Breed and species are required'
      });
    }

    console.log(`🤖 Getting ML recommendations for ${breed} (${species})`);

    // Get user's browsing history if authenticated
    let userHistory = [];
    if (userId) {
      // TODO: Fetch from user interaction tracking
      // For now, we'll use empty array
      userHistory = [];
    }

    // Call Python ML service
    const response = await axios.post(`${AI_SERVICE_URL}/api/recommendations/breed-recommendations`, {
      breed,
      species,
      top_k: parseInt(top_k),
      user_history: userHistory
    });

    if (!response.data.success) {
      throw new Error(response.data.error || 'ML service error');
    }

    const mlRecommendations = response.data.data.recommendations;

    // Fetch full product details
    const productIds = mlRecommendations.map(r => r.product_id);
    const products = await Product.find({
      _id: { $in: productIds },
      status: 'active'
    })
      .populate('category', 'name slug')
      .select('name slug pricing images ratings isFeatured isBestseller attributes')
      .lean();

    // Create product map for quick lookup
    const productMap = {};
    products.forEach(p => {
      productMap[p._id.toString()] = p;
    });

    // Combine ML scores with product data
    const recommendations = mlRecommendations
      .map(mlRec => {
        const product = productMap[mlRec.product_id];
        if (!product) return null;

        return {
          ...product,
          mlScore: mlRec.score,
          mlRank: mlRec.rank,
          recommendationReason: `AI recommended for ${breed}`
        };
      })
      .filter(Boolean);

    res.json({
      success: true,
      data: {
        breed,
        species,
        recommendations,
        total: recommendations.length,
        method: response.data.data.method,
        mlPowered: true
      }
    });

  } catch (error) {
    console.error('Error getting ML recommendations:', error.message);
    
    // Fallback to traditional recommendations if ML fails
    try {
      const fallbackProducts = await Product.find({
        status: 'active',
        $or: [
          { petType: species.toLowerCase() },
          { petType: 'all' }
        ]
      })
        .populate('category', 'name slug')
        .select('name slug pricing images ratings')
        .limit(parseInt(req.query.top_k || 10))
        .lean();

      res.json({
        success: true,
        data: {
          breed,
          species,
          recommendations: fallbackProducts,
          total: fallbackProducts.length,
          method: 'fallback',
          mlPowered: false,
          note: 'ML service unavailable, using fallback recommendations'
        }
      });
    } catch (fallbackError) {
      res.status(500).json({
        success: false,
        message: 'Failed to get recommendations',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

/**
 * Get similar products using ML
 */
const getMLSimilarProducts = async (req, res) => {
  try {
    const { productId } = req.params;
    const { top_k = 5 } = req.query;

    console.log(`🤖 Finding ML-based similar products for ${productId}`);

    // Call Python ML service
    const response = await axios.post(`${AI_SERVICE_URL}/api/recommendations/similar-products`, {
      product_id: productId,
      top_k: parseInt(top_k)
    });

    if (!response.data.success) {
      throw new Error(response.data.error || 'ML service error');
    }

    const similarProductIds = response.data.data.similar_products.map(p => p.product_id);

    // Fetch full product details
    const products = await Product.find({
      _id: { $in: similarProductIds },
      status: 'active'
    })
      .populate('category', 'name slug')
      .select('name slug pricing images ratings')
      .lean();

    res.json({
      success: true,
      data: {
        productId,
        similarProducts: products,
        total: products.length,
        mlPowered: true
      }
    });

  } catch (error) {
    console.error('Error getting similar products:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get similar products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get personalized recommendations based on user behavior
 */
const getPersonalizedRecommendations = async (req, res) => {
  try {
    const userId = req.user._id;
    const { top_k = 10 } = req.query;

    console.log(`🤖 Getting personalized recommendations for user ${userId}`);

    // TODO: Fetch user's actual browsing/purchase history
    // For now, using placeholder
    const userHistory = [];

    if (userHistory.length === 0) {
      return res.json({
        success: true,
        data: {
          recommendations: [],
          total: 0,
          message: 'No browsing history available yet'
        }
      });
    }

    // Call Python ML service
    const response = await axios.post(`${AI_SERVICE_URL}/api/recommendations/personalized`, {
      user_id: userId.toString(),
      user_history: userHistory,
      top_k: parseInt(top_k)
    });

    if (!response.data.success) {
      throw new Error(response.data.error || 'ML service error');
    }

    const recommendedIds = response.data.data.recommendations.map(r => r.product_id);

    // Fetch full product details
    const products = await Product.find({
      _id: { $in: recommendedIds },
      status: 'active'
    })
      .populate('category', 'name slug')
      .select('name slug pricing images ratings')
      .lean();

    res.json({
      success: true,
      data: {
        recommendations: products,
        total: products.length,
        method: 'personalized',
        mlPowered: true
      }
    });

  } catch (error) {
    console.error('Error getting personalized recommendations:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get personalized recommendations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Track user interaction for ML learning
 */
const trackUserInteraction = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, action, category, breed, price } = req.body;

    // TODO: Store interaction in database for ML training
    // For now, just acknowledge
    console.log(`📊 Tracking: User ${userId} ${action} product ${productId}`);

    res.json({
      success: true,
      message: 'Interaction tracked successfully'
    });

  } catch (error) {
    console.error('Error tracking interaction:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to track interaction'
    });
  }
};

/**
 * Get ML model status
 */
const getMLModelStatus = async (req, res) => {
  try {
    const response = await axios.get(`${AI_SERVICE_URL}/api/recommendations/model-status`);

    res.json({
      success: true,
      data: response.data.data
    });

  } catch (error) {
    res.json({
      success: false,
      message: 'ML service unavailable',
      error: error.message
    });
  }
};

module.exports = {
  trainRecommendationModel,
  getMLBreedRecommendations,
  getMLSimilarProducts,
  getPersonalizedRecommendations,
  trackUserInteraction,
  getMLModelStatus
};
