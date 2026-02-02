const Product = require('../models/Product');
const Order = require('../models/Order');
const ProductView = require('../models/ProductView');
const RecommendationLog = require('../models/RecommendationLog');
const PetRegistry = require('../../../core/models/PetRegistry');
const mongoose = require('mongoose');

/**
 * XAI Recommendation Engine Service
 * 
 * Implements Explainable AI for product recommendations
 * Features:
 * - Transparent scoring with feature importance
 * - Human-readable explanations
 * - Deterministic, rule-based logic (no black-box ML)
 * - Privacy-conscious and ethical
 */

class RecommendationEngine {
  
  /**
   * Configuration: Feature weights (must sum to 1.0)
   */
  static WEIGHTS = {
    petMatch: 0.35,        // 35% - Pet type/breed compatibility
    purchaseHistory: 0.25, // 25% - User's purchase patterns
    viewingHistory: 0.15,  // 15% - Recently viewed products
    popularity: 0.20,      // 20% - Product popularity & ratings
    priceMatch: 0.05       // 5%  - Price compatibility
  };
  
  /**
   * Time decay factors for recency
   */
  static TIME_DECAY = {
    views: 30,     // days - views older than this get less weight
    purchases: 90  // days - purchases older than this get less weight
  };
  
  /**
   * Generate personalized recommendations for a user
   * 
   * @param {ObjectId} userId - User ID
   * @param {Object} options - Options for recommendation generation
   * @param {number} options.limit - Number of recommendations (default: 10)
   * @param {boolean} options.saveLog - Whether to save recommendation logs (default: true)
   * @param {string} options.sessionId - Session ID for tracking
   * @returns {Promise<Array>} Array of recommended products with explanations
   */
  static async getRecommendations(userId, options = {}) {
    const {
      limit = 10,
      saveLog = true,
      sessionId = null,
      deviceType = 'desktop'
    } = options;
    
    try {
      console.log(`🤖 Generating XAI recommendations for user: ${userId}`);
      
      // Step 1: Gather user context
      const userContext = await this._getUserContext(userId);
      
      // Step 2: Get candidate products
      const candidates = await this._getCandidateProducts(userId, userContext);
      
      if (candidates.length === 0) {
        console.log('⚠️ No candidate products found, falling back to popular products');
        return this._getFallbackRecommendations(userId, limit, saveLog, sessionId, deviceType);
      }
      
      // Step 3: Score each product
      const scoredProducts = await Promise.all(
        candidates.map(product => this._scoreProduct(product, userId, userContext))
      );
      
      // Step 4: Sort by score and get top N
      const topRecommendations = scoredProducts
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
      
      // Step 5: Generate explanations
      const recommendationsWithExplanations = topRecommendations.map(rec => 
        this._generateExplanation(rec, userContext)
      );
      
      // Step 6: Save recommendation logs (for monitoring and improvement)
      if (saveLog) {
        await this._saveRecommendationLogs(
          userId, 
          recommendationsWithExplanations, 
          sessionId, 
          deviceType
        );
      }
      
      console.log(`✅ Generated ${recommendationsWithExplanations.length} recommendations`);
      
      return recommendationsWithExplanations;
      
    } catch (error) {
      console.error('❌ Error generating recommendations:', error);
      // Fallback to popular products on error
      return this._getFallbackRecommendations(userId, limit, saveLog, sessionId, deviceType);
    }
  }
  
  /**
   * Get user context data for recommendation scoring
   * @private
   */
  static async _getUserContext(userId) {
    const [userPets, purchaseHistory, viewingHistory] = await Promise.all([
      this._getUserPets(userId),
      this._getUserPurchaseHistory(userId),
      this._getUserViewingHistory(userId)
    ]);
    
    // Calculate user's average spending
    const averageSpent = purchaseHistory.length > 0
      ? purchaseHistory.reduce((sum, order) => sum + (order.pricing?.total || 0), 0) / purchaseHistory.length
      : 0;
    
    // Get preferred categories from purchase history
    const categoryFrequency = {};
    purchaseHistory.forEach(order => {
      order.items?.forEach(item => {
        if (item.product?.category) {
          const catId = item.product.category.toString();
          categoryFrequency[catId] = (categoryFrequency[catId] || 0) + 1;
        }
      });
    });
    
    return {
      userPets,
      purchaseHistory,
      viewingHistory,
      averageSpent,
      categoryFrequency,
      totalPurchases: purchaseHistory.length,
      totalViews: viewingHistory.length
    };
  }
  
  /**
   * Get user's pets from PetRegistry
   * @private
   */
  static async _getUserPets(userId) {
    try {
      const pets = await PetRegistry.find({
        currentOwnerId: userId,
        isDeleted: { $ne: true }
      })
      .populate('speciesId', 'name displayName')
      .populate('breedId', 'name')
      .lean();
      
      return pets.map(pet => ({
        petType: this._mapSpeciesToPetType(pet.speciesId?.name),
        species: pet.speciesId?._id,
        speciesName: pet.speciesId?.name || pet.speciesId?.displayName,
        breed: pet.breedId?._id,
        breedName: pet.breedId?.name,
        age: pet.age,
        gender: pet.gender
      }));
    } catch (error) {
      console.error('Error fetching user pets:', error);
      return [];
    }
  }
  
  /**
   * Map species name to product petType
   * @private
   */
  static _mapSpeciesToPetType(speciesName) {
    if (!speciesName) return 'all';
    
    const mapping = {
      'dog': 'dog',
      'canine': 'dog',
      'cat': 'cat',
      'feline': 'cat',
      'bird': 'bird',
      'avian': 'bird',
      'fish': 'fish',
      'aquatic': 'fish',
      'rabbit': 'rabbit',
      'hamster': 'hamster',
      'rodent': 'hamster'
    };
    
    const lowerName = speciesName.toLowerCase();
    return mapping[lowerName] || 'all';
  }
  
  /**
   * Get user's purchase history (last 90 days)
   * @private
   */
  static async _getUserPurchaseHistory(userId) {
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - this.TIME_DECAY.purchases);
      
      const orders = await Order.find({
        customer: userId,
        status: { $in: ['delivered', 'confirmed', 'processing'] },
        createdAt: { $gte: ninetyDaysAgo }
      })
      .populate({
        path: 'items.product',
        select: 'name category petType breeds species pricing tags'
      })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
      
      return orders;
    } catch (error) {
      console.error('Error fetching purchase history:', error);
      return [];
    }
  }
  
  /**
   * Get user's viewing history (last 30 days)
   * @private
   */
  static async _getUserViewingHistory(userId) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - this.TIME_DECAY.views);
      
      const views = await ProductView.find({
        user: userId,
        lastViewedAt: { $gte: thirtyDaysAgo }
      })
      .populate('product', 'name category petType breeds species pricing tags')
      .sort({ lastViewedAt: -1 })
      .limit(50)
      .lean();
      
      return views;
    } catch (error) {
      console.error('Error fetching viewing history:', error);
      return [];
    }
  }
  
  /**
   * Get candidate products for recommendation
   * @private
   */
  static async _getCandidateProducts(userId, userContext) {
    try {
      // Build query based on user context
      const query = {
        status: 'active',
        'stock.quantity': { $gt: 0 }
      };
      
      // If user has pets, prioritize products for those pet types
      if (userContext.userPets.length > 0) {
        const petTypes = [...new Set(userContext.userPets.map(p => p.petType))];
        query.$or = [
          { petType: { $in: petTypes } },
          { petType: 'all' }
        ];
      }
      
      // Get recently purchased product IDs to avoid recommending duplicates
      const recentlyPurchasedIds = new Set();
      userContext.purchaseHistory.forEach(order => {
        order.items?.forEach(item => {
          if (item.product?._id) {
            recentlyPurchasedIds.add(item.product._id.toString());
          }
        });
      });
      
      // Exclude recently purchased products (within last 30 days)
      if (recentlyPurchasedIds.size > 0) {
        query._id = { $nin: Array.from(recentlyPurchasedIds).map(id => new mongoose.Types.ObjectId(id)) };
      }
      
      // Fetch candidates
      const products = await Product.find(query)
        .populate('category', 'name slug')
        .populate('breeds', 'name')
        .populate('species', 'name displayName')
        .limit(100) // Limit candidates for performance
        .lean();
      
      return products;
    } catch (error) {
      console.error('Error fetching candidate products:', error);
      return [];
    }
  }
  
  /**
   * Score a product for a user using XAI methodology
   * @private
   */
  static async _scoreProduct(product, userId, userContext) {
    // Calculate individual feature scores (0-100 scale)
    const petMatchScore = this._calculatePetMatchScore(product, userContext);
    const purchaseHistoryScore = this._calculatePurchaseHistoryScore(product, userContext);
    const viewingHistoryScore = this._calculateViewingHistoryScore(product, userContext);
    const popularityScore = this._calculatePopularityScore(product);
    const priceMatchScore = this._calculatePriceMatchScore(product, userContext);
    
    // Calculate weighted contributions
    const petMatchContribution = petMatchScore.score * this.WEIGHTS.petMatch;
    const purchaseHistoryContribution = purchaseHistoryScore.score * this.WEIGHTS.purchaseHistory;
    const viewingHistoryContribution = viewingHistoryScore.score * this.WEIGHTS.viewingHistory;
    const popularityContribution = popularityScore.score * this.WEIGHTS.popularity;
    const priceMatchContribution = priceMatchScore.score * this.WEIGHTS.priceMatch;
    
    // Final score (0-100)
    const finalScore = 
      petMatchContribution +
      purchaseHistoryContribution +
      viewingHistoryContribution +
      popularityContribution +
      priceMatchContribution;
    
    // Calculate percentage contribution of each feature
    const totalContribution = finalScore || 1; // Avoid division by zero
    
    return {
      product,
      score: Math.round(finalScore * 100) / 100,
      features: {
        petMatch: {
          score: petMatchScore.score,
          weight: this.WEIGHTS.petMatch,
          contribution: Math.round((petMatchContribution / totalContribution) * 100 * 100) / 100,
          details: petMatchScore.details
        },
        purchaseHistory: {
          score: purchaseHistoryScore.score,
          weight: this.WEIGHTS.purchaseHistory,
          contribution: Math.round((purchaseHistoryContribution / totalContribution) * 100 * 100) / 100,
          details: purchaseHistoryScore.details
        },
        viewingHistory: {
          score: viewingHistoryScore.score,
          weight: this.WEIGHTS.viewingHistory,
          contribution: Math.round((viewingHistoryContribution / totalContribution) * 100 * 100) / 100,
          details: viewingHistoryScore.details
        },
        popularity: {
          score: popularityScore.score,
          weight: this.WEIGHTS.popularity,
          contribution: Math.round((popularityContribution / totalContribution) * 100 * 100) / 100,
          details: popularityScore.details
        },
        priceMatch: {
          score: priceMatchScore.score,
          weight: this.WEIGHTS.priceMatch,
          contribution: Math.round((priceMatchContribution / totalContribution) * 100 * 100) / 100,
          details: priceMatchScore.details
        }
      }
    };
  }
  
  /**
   * Calculate pet match score
   * @private
   */
  static _calculatePetMatchScore(product, userContext) {
    if (userContext.userPets.length === 0) {
      return { score: 50, details: { matchLevel: 'none' } }; // Neutral score if no pets
    }
    
    let maxScore = 0;
    let bestMatch = null;
    
    // Check each user pet against product
    userContext.userPets.forEach(userPet => {
      let score = 0;
      let matchLevel = 'none';
      
      // Pet type match
      const productPetTypes = Array.isArray(product.petType) ? product.petType : [product.petType];
      const petTypeMatch = productPetTypes.includes(userPet.petType) || productPetTypes.includes('all');
      
      if (petTypeMatch) {
        score += 60; // Base score for pet type match
        matchLevel = 'partial';
        
        // Breed match (if applicable)
        if (product.breeds && product.breeds.length > 0) {
          const breedIds = product.breeds.map(b => b._id ? b._id.toString() : b.toString());
          if (userPet.breed && breedIds.includes(userPet.breed.toString())) {
            score += 40; // Exact breed match
            matchLevel = 'exact';
          }
        } else {
          // No specific breed requirement - suitable for all breeds
          score += 20;
        }
      }
      
      if (score > maxScore) {
        maxScore = score;
        bestMatch = {
          petType: userPet.petType,
          breed: userPet.breedName,
          species: userPet.speciesName,
          matchLevel
        };
      }
    });
    
    return {
      score: maxScore,
      details: bestMatch || { matchLevel: 'none' }
    };
  }
  
  /**
   * Calculate purchase history score
   * @private
   */
  static _calculatePurchaseHistoryScore(product, userContext) {
    if (userContext.purchaseHistory.length === 0) {
      return { score: 0, details: { previousPurchases: 0, similarProducts: 0, categoryAffinity: 0 } };
    }
    
    let score = 0;
    let similarProducts = 0;
    let categoryAffinity = 0;
    
    const productCategoryId = product.category?._id?.toString() || product.category?.toString();
    const productTags = new Set(product.tags || []);
    
    // Check purchase history
    userContext.purchaseHistory.forEach(order => {
      order.items?.forEach(item => {
        const purchasedProduct = item.product;
        if (!purchasedProduct) return;
        
        // Category match
        const purchasedCategoryId = purchasedProduct.category?._id?.toString() || purchasedProduct.category?.toString();
        if (purchasedCategoryId && purchasedCategoryId === productCategoryId) {
          categoryAffinity += 1;
          score += 20;
        }
        
        // Tag similarity
        const purchasedTags = new Set(purchasedProduct.tags || []);
        const commonTags = [...productTags].filter(tag => purchasedTags.has(tag));
        if (commonTags.length > 0) {
          similarProducts += 1;
          score += commonTags.length * 5;
        }
        
        // Pet type match
        const purchasedPetTypes = Array.isArray(purchasedProduct.petType) 
          ? purchasedProduct.petType 
          : [purchasedProduct.petType];
        const currentPetTypes = Array.isArray(product.petType) 
          ? product.petType 
          : [product.petType];
        
        const petTypeOverlap = purchasedPetTypes.some(pt => currentPetTypes.includes(pt));
        if (petTypeOverlap) {
          score += 10;
        }
      });
    });
    
    // Normalize score to 0-100
    const normalizedScore = Math.min(score, 100);
    
    return {
      score: normalizedScore,
      details: {
        previousPurchases: userContext.purchaseHistory.length,
        similarProducts,
        categoryAffinity
      }
    };
  }
  
  /**
   * Calculate viewing history score
   * @private
   */
  static _calculateViewingHistoryScore(product, userContext) {
    if (userContext.viewingHistory.length === 0) {
      return { score: 0, details: { viewCount: 0, recentViews: 0, viewDuration: 0 } };
    }
    
    let score = 0;
    let recentViews = 0;
    const productId = product._id.toString();
    
    // Check if user viewed this exact product
    const directView = userContext.viewingHistory.find(
      v => v.product?._id?.toString() === productId
    );
    
    if (directView) {
      score += 30; // Bonus for having viewed this product before
      recentViews += 1;
    }
    
    // Check for similar products viewed
    const productCategoryId = product.category?._id?.toString() || product.category?.toString();
    const productTags = new Set(product.tags || []);
    
    userContext.viewingHistory.forEach(view => {
      const viewedProduct = view.product;
      if (!viewedProduct || viewedProduct._id.toString() === productId) return;
      
      // Category match
      const viewedCategoryId = viewedProduct.category?._id?.toString() || viewedProduct.category?.toString();
      if (viewedCategoryId && viewedCategoryId === productCategoryId) {
        score += 15;
        recentViews += 1;
      }
      
      // Tag similarity
      const viewedTags = new Set(viewedProduct.tags || []);
      const commonTags = [...productTags].filter(tag => viewedTags.has(tag));
      if (commonTags.length > 0) {
        score += commonTags.length * 3;
      }
    });
    
    // Time decay: more recent views score higher
    const now = Date.now();
    userContext.viewingHistory.forEach(view => {
      const daysSinceView = (now - new Date(view.lastViewedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceView < 7) {
        score += 10; // Recent view bonus
      }
    });
    
    // Normalize score to 0-100
    const normalizedScore = Math.min(score, 100);
    
    return {
      score: normalizedScore,
      details: {
        viewCount: userContext.viewingHistory.length,
        recentViews,
        viewDuration: directView?.viewDuration || 0
      }
    };
  }
  
  /**
   * Calculate popularity score
   * @private
   */
  static _calculatePopularityScore(product) {
    let score = 0;
    
    // Purchase count (normalize to 0-40 points)
    const purchases = product.analytics?.purchases || 0;
    score += Math.min(purchases / 10, 40);
    
    // Rating (0-30 points)
    const rating = product.ratings?.average || 0;
    score += (rating / 5) * 30;
    
    // Review count (0-20 points)
    const reviewCount = product.ratings?.count || 0;
    score += Math.min(reviewCount / 5, 20);
    
    // Featured/Bestseller bonus (0-10 points)
    if (product.isFeatured) score += 5;
    if (product.isBestseller) score += 5;
    
    return {
      score: Math.min(score, 100),
      details: {
        purchases,
        rating,
        reviewCount,
        trendingScore: product.isFeatured || product.isBestseller ? 1 : 0
      }
    };
  }
  
  /**
   * Calculate price match score
   * @private
   */
  static _calculatePriceMatchScore(product, userContext) {
    const productPrice = product.pricing?.salePrice || product.pricing?.basePrice || 0;
    
    if (userContext.averageSpent === 0 || productPrice === 0) {
      return { 
        score: 50, 
        details: { 
          priceRange: 'unknown', 
          averageSpent: 0, 
          priceCompatibility: 'medium' 
        } 
      };
    }
    
    // Calculate price compatibility
    const priceDiff = Math.abs(productPrice - userContext.averageSpent);
    const priceRatio = priceDiff / userContext.averageSpent;
    
    let score = 100;
    let compatibility = 'high';
    let priceRange = 'matching';
    
    if (priceRatio > 0.5) {
      // Price is significantly different from user's average
      score = 30;
      compatibility = 'low';
      priceRange = productPrice > userContext.averageSpent ? 'above_average' : 'below_average';
    } else if (priceRatio > 0.25) {
      // Price is moderately different
      score = 60;
      compatibility = 'medium';
      priceRange = productPrice > userContext.averageSpent ? 'slightly_above' : 'slightly_below';
    } else {
      // Price matches user's typical spending
      score = 100;
      compatibility = 'high';
      priceRange = 'matching';
    }
    
    return {
      score,
      details: {
        priceRange,
        averageSpent: Math.round(userContext.averageSpent * 100) / 100,
        priceCompatibility: compatibility
      }
    };
  }
  
  /**
   * Generate human-readable explanation for recommendation
   * @private
   */
  static _generateExplanation(recommendation, userContext) {
    const { product, features, score } = recommendation;
    
    // Sort features by contribution to find primary reasons
    const sortedFeatures = Object.entries(features)
      .sort((a, b) => b[1].contribution - a[1].contribution);
    
    const topFeature = sortedFeatures[0];
    const topFeatureName = topFeature[0];
    const topFeatureData = topFeature[1];
    
    let primaryExplanation = '';
    const secondaryReasons = [];
    
    // Generate primary explanation based on top contributing feature
    switch (topFeatureName) {
      case 'petMatch':
        if (topFeatureData.details.matchLevel === 'exact') {
          primaryExplanation = `Perfect match for your ${topFeatureData.details.breed}`;
        } else if (topFeatureData.details.matchLevel === 'partial') {
          primaryExplanation = `Great for your ${topFeatureData.details.petType}`;
        } else {
          primaryExplanation = 'Suitable for various pet types';
        }
        break;
        
      case 'purchaseHistory':
        if (topFeatureData.details.categoryAffinity > 0) {
          primaryExplanation = 'Based on your previous purchases';
        } else {
          primaryExplanation = 'Similar to products you\'ve bought';
        }
        break;
        
      case 'viewingHistory':
        primaryExplanation = 'Based on products you\'ve viewed';
        break;
        
      case 'popularity':
        if (product.isBestseller) {
          primaryExplanation = 'Bestseller - loved by pet owners';
        } else if (topFeatureData.details.rating >= 4.5) {
          primaryExplanation = `Highly rated (${topFeatureData.details.rating}★)`;
        } else {
          primaryExplanation = 'Popular among pet owners';
        }
        break;
        
      case 'priceMatch':
        primaryExplanation = 'Matches your typical spending';
        break;
        
      default:
        primaryExplanation = 'Recommended for you';
    }
    
    // Generate secondary reasons
    sortedFeatures.slice(1, 4).forEach(([featureName, featureData]) => {
      if (featureData.contribution < 5) return; // Skip very low contributors
      
      switch (featureName) {
        case 'petMatch':
          if (featureData.details.matchLevel !== 'none') {
            secondaryReasons.push(`Compatible with ${featureData.details.petType}s`);
          }
          break;
          
        case 'purchaseHistory':
          if (featureData.details.categoryAffinity > 0) {
            secondaryReasons.push('In your favorite category');
          }
          break;
          
        case 'viewingHistory':
          if (featureData.details.recentViews > 0) {
            secondaryReasons.push('Similar to recently viewed');
          }
          break;
          
        case 'popularity':
          if (featureData.details.rating >= 4.0) {
            secondaryReasons.push(`${featureData.details.rating}★ rating`);
          }
          if (featureData.details.reviewCount >= 10) {
            secondaryReasons.push(`${featureData.details.reviewCount} reviews`);
          }
          break;
          
        case 'priceMatch':
          if (featureData.details.priceCompatibility === 'high') {
            secondaryReasons.push('Great value for money');
          }
          break;
      }
    });
    
    // Determine confidence level
    let confidence = 'medium';
    if (score >= 80) confidence = 'very_high';
    else if (score >= 60) confidence = 'high';
    else if (score < 40) confidence = 'low';
    
    return {
      ...recommendation,
      explanation: {
        primary: primaryExplanation,
        secondary: secondaryReasons,
        confidence
      }
    };
  }
  
  /**
   * Save recommendation logs to database
   * @private
   */
  static async _saveRecommendationLogs(userId, recommendations, sessionId, deviceType) {
    try {
      const logs = recommendations.map(rec => ({
        user: userId,
        product: rec.product._id,
        score: rec.score,
        features: rec.features,
        explanation: rec.explanation,
        context: {
          recommendationType: 'personalized',
          basedOn: this._getBasedOnList(rec.features),
          generatedAt: new Date(),
          modelVersion: '1.0.0'
        },
        sessionId,
        deviceType,
        userConsent: true,
        canUseForTraining: true
      }));
      
      await RecommendationLog.insertMany(logs);
      console.log(`✅ Saved ${logs.length} recommendation logs`);
    } catch (error) {
      console.error('Error saving recommendation logs:', error);
    }
  }
  
  /**
   * Get list of features that contributed to recommendation
   * @private
   */
  static _getBasedOnList(features) {
    const basedOn = [];
    
    if (features.petMatch.contribution > 10) basedOn.push('pet_profile');
    if (features.purchaseHistory.contribution > 10) basedOn.push('purchase_history');
    if (features.viewingHistory.contribution > 10) basedOn.push('recent_views');
    if (features.popularity.contribution > 10) basedOn.push('popularity');
    if (features.priceMatch.contribution > 10) basedOn.push('price_preference');
    
    return basedOn.length > 0 ? basedOn : ['general'];
  }
  
  /**
   * Fallback recommendations (popular products)
   * @private
   */
  static async _getFallbackRecommendations(userId, limit, saveLog, sessionId, deviceType) {
    try {
      console.log('📊 Generating fallback recommendations (popular products)');
      
      const popularProducts = await Product.find({
        status: 'active',
        'stock.quantity': { $gt: 0 }
      })
      .sort({ 
        'analytics.purchases': -1, 
        'ratings.average': -1 
      })
      .limit(limit)
      .populate('category', 'name slug')
      .populate('breeds', 'name')
      .populate('species', 'name displayName')
      .lean();
      
      const recommendations = popularProducts.map(product => {
        const popularityScore = this._calculatePopularityScore(product);
        
        return {
          product,
          score: popularityScore.score,
          features: {
            petMatch: { score: 0, weight: this.WEIGHTS.petMatch, contribution: 0, details: { matchLevel: 'none' } },
            purchaseHistory: { score: 0, weight: this.WEIGHTS.purchaseHistory, contribution: 0, details: {} },
            viewingHistory: { score: 0, weight: this.WEIGHTS.viewingHistory, contribution: 0, details: {} },
            popularity: { 
              score: popularityScore.score, 
              weight: this.WEIGHTS.popularity, 
              contribution: 100, 
              details: popularityScore.details 
            },
            priceMatch: { score: 0, weight: this.WEIGHTS.priceMatch, contribution: 0, details: {} }
          },
          explanation: {
            primary: 'Popular among all pet owners',
            secondary: [
              popularityScore.details.rating >= 4.0 ? `${popularityScore.details.rating}★ rating` : null,
              popularityScore.details.reviewCount >= 10 ? `${popularityScore.details.reviewCount} reviews` : null,
              product.isBestseller ? 'Bestseller' : null
            ].filter(Boolean),
            confidence: 'medium'
          }
        };
      });
      
      // Save fallback recommendation logs
      if (saveLog) {
        const logs = recommendations.map(rec => ({
          user: userId,
          product: rec.product._id,
          score: rec.score,
          features: rec.features,
          explanation: rec.explanation,
          context: {
            recommendationType: 'fallback',
            basedOn: ['popularity'],
            generatedAt: new Date(),
            modelVersion: '1.0.0'
          },
          sessionId,
          deviceType,
          userConsent: true,
          canUseForTraining: true
        }));
        
        await RecommendationLog.insertMany(logs);
      }
      
      return recommendations;
      
    } catch (error) {
      console.error('Error generating fallback recommendations:', error);
      return [];
    }
  }
}

module.exports = RecommendationEngine;
