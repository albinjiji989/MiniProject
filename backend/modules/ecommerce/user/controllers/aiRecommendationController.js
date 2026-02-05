const axios = require('axios');

const PYTHON_ML_URL = process.env.PYTHON_ML_URL || 'http://localhost:5001';

/**
 * AI/ML Powered E-commerce Recommendations Controller
 * Calls Python ML service for intelligent product recommendations
 */

// Get all AI-powered recommendations
const getRecommendations = async (req, res) => {
  try {
    const userId = req.user?._id;
    
    console.log('🤖 Fetching AI/ML recommendations for user:', userId || 'Guest');
    
    const response = await axios.get(`${PYTHON_ML_URL}/api/ecommerce/recommendations`, {
      params: { userId: userId?.toString() },
      timeout: 10000
    });
    
    if (response.data.success) {
      console.log('✅ AI/ML recommendations received successfully');
      return res.json(response.data);
    } else {
      throw new Error('ML service returned error');
    }
    
  } catch (error) {
    console.error('❌ AI/ML recommendation error:', error.message);
    
    // Return empty recommendations on error
    res.json({
      success: true,
      data: {
        best_sellers: [],
        trending: [],
        most_bought: [],
        recommended_for_you: [],
        new_arrivals: []
      },
      error: 'AI service unavailable'
    });
  }
};

// Get best sellers only
const getBestSellers = async (req, res) => {
  try {
    const limit = req.query.limit || 20;
    
    const response = await axios.get(`${PYTHON_ML_URL}/api/ecommerce/recommendations/best-sellers`, {
      params: { limit },
      timeout: 10000
    });
    
    res.json(response.data);
    
  } catch (error) {
    console.error('Best sellers error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get trending products only
const getTrending = async (req, res) => {
  try {
    const limit = req.query.limit || 20;
    
    const response = await axios.get(`${PYTHON_ML_URL}/api/ecommerce/recommendations/trending`, {
      params: { limit },
      timeout: 10000
    });
    
    res.json(response.data);
    
  } catch (error) {
    console.error('Trending error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get most bought products only
const getMostBought = async (req, res) => {
  try {
    const limit = req.query.limit || 20;
    
    const response = await axios.get(`${PYTHON_ML_URL}/api/ecommerce/recommendations/most-bought`, {
      params: { limit },
      timeout: 10000
    });
    
    res.json(response.data);
    
  } catch (error) {
    console.error('Most bought error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Track product view (for ML learning)
const trackView = async (req, res) => {
  try {
    const productId = req.params.productId || req.body.productId;
    const userId = req.user?._id; // Optional - may be undefined for guests
    
    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID required' });
    }
    
    const UserProductInteraction = require('../models/UserProductInteraction');
    
    // Track for authenticated users only
    if (userId) {
      await UserProductInteraction.findOneAndUpdate(
        { userId, productId },
        {
          $inc: { views: 1 },
          $set: { lastViewed: new Date() }
        },
        { upsert: true, new: true }
      );
    }
    
    // TODO: Track anonymous views separately for trending calculations
    
    res.json({ success: true });
  } catch (error) {
    console.error('Track view error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Track product click (for ML learning)
const trackClick = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user._id;
    
    const UserProductInteraction = require('../models/UserProductInteraction');
    
    await UserProductInteraction.findOneAndUpdate(
      { userId, productId },
      {
        $inc: { clicks: 1 },
        $set: { lastClicked: new Date() }
      },
      { upsert: true, new: true }
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Track click error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Track purchase (for ML learning)
const trackPurchase = async (req, res) => {
  try {
    const { productId, quantity, price } = req.body;
    const userId = req.user._id;
    
    const UserProductInteraction = require('../models/UserProductInteraction');
    
    await UserProductInteraction.findOneAndUpdate(
      { userId, productId },
      {
        $inc: { purchased: quantity || 1 },
        $set: { 
          lastPurchased: new Date(),
          lastPrice: price
        }
      },
      { upsert: true, new: true }
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Track purchase error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getRecommendations,
  getBestSellers,
  getTrending,
  getMostBought,
  trackView,
  trackClick,
  trackPurchase
};
