const RecommendationEngine = require('../services/recommendationEngine');
const ProductView = require('../models/ProductView');
const RecommendationLog = require('../models/RecommendationLog');

/**
 * XAI Recommendation Controller
 * Endpoints for explainable AI-based product recommendations
 */

/**
 * @route   GET /api/ecommerce/recommendations
 * @desc    Get personalized product recommendations with explanations
 * @access  Private (requires authentication)
 * @query   limit - Number of recommendations (default: 10, max: 50)
 * @query   include - Additional data to include (comma-separated: 'analytics', 'history')
 */
const getRecommendations = async (req, res) => {
  try {
    const userId = req.user._id;
    const { 
      limit = 10, 
      include = '',
      sessionId = null 
    } = req.query;
    
    const deviceType = req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'desktop';
    
    // Validate limit
    const recommendationLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 50);
    
    console.log(`🎯 Fetching ${recommendationLimit} recommendations for user ${userId}`);
    
    // Get recommendations from engine
    const recommendations = await RecommendationEngine.getRecommendations(userId, {
      limit: recommendationLimit,
      saveLog: true,
      sessionId,
      deviceType
    });
    
    // Format response
    const formattedRecommendations = recommendations.map(rec => ({
      product: {
        _id: rec.product._id,
        name: rec.product.name,
        slug: rec.product.slug,
        description: rec.product.shortDescription || rec.product.description,
        images: rec.product.images || [],
        pricing: {
          basePrice: rec.product.pricing?.basePrice,
          salePrice: rec.product.pricing?.salePrice,
          discount: rec.product.pricing?.discount
        },
        ratings: rec.product.ratings,
        category: rec.product.category,
        petType: rec.product.petType,
        breeds: rec.product.breeds,
        species: rec.product.species,
        stock: rec.product.stock,
        isFeatured: rec.product.isFeatured,
        isBestseller: rec.product.isBestseller
      },
      recommendationScore: rec.score,
      explanation: {
        primary: rec.explanation.primary,
        secondary: rec.explanation.secondary,
        confidence: rec.explanation.confidence
      },
      featureImportance: {
        petMatch: {
          contribution: rec.features.petMatch.contribution,
          details: rec.features.petMatch.details
        },
        purchaseHistory: {
          contribution: rec.features.purchaseHistory.contribution,
          details: rec.features.purchaseHistory.details
        },
        viewingHistory: {
          contribution: rec.features.viewingHistory.contribution,
          details: rec.features.viewingHistory.details
        },
        popularity: {
          contribution: rec.features.popularity.contribution,
          details: rec.features.popularity.details
        },
        priceMatch: {
          contribution: rec.features.priceMatch.contribution,
          details: rec.features.priceMatch.details
        }
      }
    }));
    
    // Build response object
    const response = {
      success: true,
      count: formattedRecommendations.length,
      recommendations: formattedRecommendations,
      meta: {
        userId,
        generatedAt: new Date().toISOString(),
        modelVersion: '1.0.0',
        explainableAI: true
      }
    };
    
    // Include additional data if requested
    const includeFields = include.split(',').map(f => f.trim());
    
    if (includeFields.includes('analytics')) {
      const analytics = await RecommendationLog.getAcceptanceRate(userId, 30);
      response.analytics = analytics;
    }
    
    if (includeFields.includes('history')) {
      const recentViews = await ProductView.getRecentViews(userId, 5);
      response.viewingHistory = recentViews.map(v => ({
        product: {
          _id: v.product._id,
          name: v.product.name,
          slug: v.product.slug
        },
        viewCount: v.viewCount,
        lastViewedAt: v.lastViewedAt
      }));
    }
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ Error fetching recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate recommendations',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/ecommerce/recommendations/:productId/track
 * @desc    Track user interaction with recommendation
 * @access  Private
 * @body    action - 'shown' | 'clicked' | 'purchased' | 'dismissed'
 * @body    sessionId - Session identifier
 */
const trackRecommendationInteraction = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;
    const { action, sessionId } = req.body;
    
    if (!action || !['shown', 'clicked', 'purchased', 'dismissed'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be one of: shown, clicked, purchased, dismissed'
      });
    }
    
    // Find the most recent recommendation log for this user and product
    const log = await RecommendationLog.findOne({
      user: userId,
      product: productId,
      sessionId: sessionId || { $exists: true }
    }).sort({ 'context.generatedAt': -1 });
    
    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Recommendation log not found'
      });
    }
    
    // Update interaction based on action
    switch (action) {
      case 'shown':
        await log.markAsShown();
        break;
      case 'clicked':
        await log.markAsClicked();
        break;
      case 'purchased':
        await log.markAsPurchased();
        break;
      case 'dismissed':
        log.interaction.dismissed = true;
        log.interaction.dismissedAt = new Date();
        await log.save();
        break;
    }
    
    res.json({
      success: true,
      message: `Recommendation interaction tracked: ${action}`
    });
    
  } catch (error) {
    console.error('Error tracking recommendation interaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track interaction',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/ecommerce/recommendations/:productId/feedback
 * @desc    Provide feedback on a recommendation
 * @access  Private
 * @body    score - 1-5 rating
 * @body    comment - Optional feedback comment
 * @body    sessionId - Session identifier
 */
const provideFeedback = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;
    const { score, comment, sessionId } = req.body;
    
    if (!score || score < 1 || score > 5) {
      return res.status(400).json({
        success: false,
        message: 'Score must be between 1 and 5'
      });
    }
    
    // Find the recommendation log
    const log = await RecommendationLog.findOne({
      user: userId,
      product: productId,
      sessionId: sessionId || { $exists: true }
    }).sort({ 'context.generatedAt': -1 });
    
    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Recommendation log not found'
      });
    }
    
    // Update feedback
    log.interaction.feedbackProvided = true;
    log.interaction.feedbackScore = score;
    log.interaction.feedbackComment = comment || '';
    await log.save();
    
    res.json({
      success: true,
      message: 'Thank you for your feedback!'
    });
    
  } catch (error) {
    console.error('Error saving feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save feedback',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/ecommerce/recommendations/analytics
 * @desc    Get recommendation analytics and performance metrics
 * @access  Private
 * @query   days - Number of days to analyze (default: 30)
 */
const getRecommendationAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;
    const { days = 30 } = req.query;
    
    const [acceptanceRate, featureImportance] = await Promise.all([
      RecommendationLog.getAcceptanceRate(userId, parseInt(days)),
      RecommendationLog.getFeatureImportance(userId, parseInt(days))
    ]);
    
    res.json({
      success: true,
      analytics: {
        acceptanceRate,
        featureImportance,
        period: `Last ${days} days`
      }
    });
    
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error.message
    });
  }
};

/**
 * @route   POST /api/ecommerce/products/:productId/view
 * @desc    Track product view
 * @access  Private
 * @body    source - Where the view came from
 * @body    viewDuration - Time spent viewing (seconds)
 * @body    sessionId - Session identifier
 */
const trackProductView = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;
    const { source = 'direct', viewDuration = 0, sessionId } = req.body;
    
    const deviceType = req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'desktop';
    
    await ProductView.recordView(userId, productId, {
      source,
      viewDuration,
      deviceType,
      sessionId
    });
    
    res.json({
      success: true,
      message: 'Product view tracked'
    });
    
  } catch (error) {
    console.error('Error tracking product view:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track view',
      error: error.message
    });
  }
};

/**
 * @route   GET /api/ecommerce/recommendations/explain-weights
 * @desc    Get explanation of recommendation weights and methodology
 * @access  Public
 */
const explainWeights = async (req, res) => {
  try {
    res.json({
      success: true,
      methodology: {
        name: 'Explainable AI (XAI) Recommendation System',
        description: 'Transparent, rule-based recommendation engine with human-readable explanations',
        version: '1.0.0',
        features: {
          petMatch: {
            weight: 0.35,
            weightPercentage: '35%',
            description: 'Compatibility with your pet\'s type, breed, and species',
            scoringCriteria: [
              'Exact breed match: 100 points',
              'Pet type match: 60 points',
              'Species compatibility: +20 points',
              'No match: 50 points (neutral)'
            ]
          },
          purchaseHistory: {
            weight: 0.25,
            weightPercentage: '25%',
            description: 'Based on your previous purchases and buying patterns',
            scoringCriteria: [
              'Category affinity: +20 points per matching purchase',
              'Tag similarity: +5 points per common tag',
              'Pet type overlap: +10 points',
              'Normalized to 0-100 scale'
            ]
          },
          viewingHistory: {
            weight: 0.15,
            weightPercentage: '15%',
            description: 'Products you\'ve recently viewed or shown interest in',
            scoringCriteria: [
              'Direct product view: +30 points',
              'Same category view: +15 points',
              'Tag similarity: +3 points per tag',
              'Recent view bonus (< 7 days): +10 points'
            ]
          },
          popularity: {
            weight: 0.20,
            weightPercentage: '20%',
            description: 'Overall product popularity, ratings, and reviews',
            scoringCriteria: [
              'Purchase count: up to 40 points (normalized)',
              'Rating: up to 30 points (5★ = 30 points)',
              'Review count: up to 20 points',
              'Featured/Bestseller: +5-10 points'
            ]
          },
          priceMatch: {
            weight: 0.05,
            weightPercentage: '5%',
            description: 'Compatibility with your typical spending range',
            scoringCriteria: [
              'Perfect match: 100 points',
              'Within 25%: 60 points',
              'Within 50%: 30 points',
              'Beyond 50%: Lower score'
            ]
          }
        },
        ethicalPrinciples: [
          'Transparency: All scores and reasoning are visible',
          'Explainability: Every recommendation includes human-readable reasons',
          'Fairness: No discriminatory factors used',
          'Privacy: User data stays within the system',
          'User Control: Users can see why products are recommended'
        ],
        confidenceLevels: {
          very_high: 'Score >= 80 - Strong match across multiple factors',
          high: 'Score >= 60 - Good match with clear reasons',
          medium: 'Score >= 40 - Moderate match',
          low: 'Score < 40 - Weak match, consider fallback recommendations'
        }
      }
    });
  } catch (error) {
    console.error('Error explaining weights:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch weight explanation',
      error: error.message
    });
  }
};

module.exports = {
  getRecommendations,
  trackRecommendationInteraction,
  provideFeedback,
  getRecommendationAnalytics,
  trackProductView,
  explainWeights
};
