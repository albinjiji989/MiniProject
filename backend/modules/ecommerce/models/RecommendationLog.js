const mongoose = require('mongoose');

/**
 * Recommendation Log Model
 * Stores AI recommendation explanations and tracking data
 * Demonstrates Explainable AI (XAI) principles
 */
const recommendationLogSchema = new mongoose.Schema({
  // User and Product
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  
  // Recommendation Score (0-100)
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  
  // Feature Contributions - Transparent scoring breakdown
  features: {
    petMatch: {
      score: { type: Number, default: 0 },
      weight: { type: Number, default: 0 },
      contribution: { type: Number, default: 0 }, // percentage contribution to final score
      details: {
        petType: { type: String },
        breed: { type: String },
        species: { type: String },
        matchLevel: { type: String, enum: ['exact', 'partial', 'none'], default: 'none' }
      }
    },
    purchaseHistory: {
      score: { type: Number, default: 0 },
      weight: { type: Number, default: 0 },
      contribution: { type: Number, default: 0 },
      details: {
        previousPurchases: { type: Number, default: 0 },
        similarProducts: { type: Number, default: 0 },
        categoryAffinity: { type: Number, default: 0 }
      }
    },
    viewingHistory: {
      score: { type: Number, default: 0 },
      weight: { type: Number, default: 0 },
      contribution: { type: Number, default: 0 },
      details: {
        viewCount: { type: Number, default: 0 },
        recentViews: { type: Number, default: 0 },
        viewDuration: { type: Number, default: 0 }
      }
    },
    popularity: {
      score: { type: Number, default: 0 },
      weight: { type: Number, default: 0 },
      contribution: { type: Number, default: 0 },
      details: {
        purchases: { type: Number, default: 0 },
        rating: { type: Number, default: 0 },
        reviewCount: { type: Number, default: 0 },
        trendingScore: { type: Number, default: 0 }
      }
    },
    priceMatch: {
      score: { type: Number, default: 0 },
      weight: { type: Number, default: 0 },
      contribution: { type: Number, default: 0 },
      details: {
        priceRange: { type: String },
        averageSpent: { type: Number, default: 0 },
        priceCompatibility: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' }
      }
    }
  },
  
  // Human-Readable Explanation
  explanation: {
    primary: {
      type: String,
      required: true
    }, // Main reason (e.g., "Perfect for your Golden Retriever")
    secondary: [String], // Additional reasons (e.g., ["Top-rated product", "Popular in your area"])
    confidence: {
      type: String,
      enum: ['very_high', 'high', 'medium', 'low'],
      default: 'medium'
    }
  },
  
  // Recommendation Context
  context: {
    recommendationType: {
      type: String,
      enum: ['personalized', 'popular', 'similar', 'trending', 'fallback'],
      default: 'personalized'
    },
    basedOn: [String], // e.g., ["pet_profile", "purchase_history", "recent_views"]
    generatedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    modelVersion: {
      type: String,
      default: '1.0.0'
    }
  },
  
  // User Interaction Tracking (for model improvement)
  interaction: {
    shown: {
      type: Boolean,
      default: false
    },
    shownAt: Date,
    clicked: {
      type: Boolean,
      default: false
    },
    clickedAt: Date,
    purchased: {
      type: Boolean,
      default: false
    },
    purchasedAt: Date,
    dismissed: {
      type: Boolean,
      default: false
    },
    dismissedAt: Date,
    feedbackProvided: {
      type: Boolean,
      default: false
    },
    feedbackScore: {
      type: Number,
      min: 1,
      max: 5
    },
    feedbackComment: String
  },
  
  // A/B Testing and Experiments
  experimentId: String,
  experimentVariant: String,
  
  // Session tracking
  sessionId: String,
  deviceType: {
    type: String,
    enum: ['desktop', 'mobile', 'tablet']
  },
  
  // Privacy and Ethics
  userConsent: {
    type: Boolean,
    default: true
  },
  canUseForTraining: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for performance
recommendationLogSchema.index({ user: 1, 'context.generatedAt': -1 });
recommendationLogSchema.index({ product: 1, score: -1 });
recommendationLogSchema.index({ 'interaction.clicked': 1, 'interaction.clickedAt': -1 });
recommendationLogSchema.index({ 'interaction.purchased': 1, 'interaction.purchasedAt': -1 });
recommendationLogSchema.index({ 'context.recommendationType': 1 });
recommendationLogSchema.index({ sessionId: 1 });

// Static methods for analytics

/**
 * Track recommendation shown to user
 */
recommendationLogSchema.methods.markAsShown = function() {
  this.interaction.shown = true;
  this.interaction.shownAt = new Date();
  return this.save();
};

/**
 * Track user clicked on recommendation
 */
recommendationLogSchema.methods.markAsClicked = function() {
  this.interaction.clicked = true;
  this.interaction.clickedAt = new Date();
  return this.save();
};

/**
 * Track user purchased recommended product
 */
recommendationLogSchema.methods.markAsPurchased = function() {
  this.interaction.purchased = true;
  this.interaction.purchasedAt = new Date();
  return this.save();
};

/**
 * Get recommendation acceptance rate for a user
 */
recommendationLogSchema.statics.getAcceptanceRate = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const stats = await this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        'interaction.shown': true,
        'context.generatedAt': { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        clicked: { $sum: { $cond: ['$interaction.clicked', 1, 0] } },
        purchased: { $sum: { $cond: ['$interaction.purchased', 1, 0] } }
      }
    }
  ]);
  
  if (stats.length === 0) {
    return { total: 0, clickRate: 0, purchaseRate: 0 };
  }
  
  const { total, clicked, purchased } = stats[0];
  return {
    total,
    clicked,
    purchased,
    clickRate: (clicked / total * 100).toFixed(2),
    purchaseRate: (purchased / total * 100).toFixed(2)
  };
};

/**
 * Get feature importance across all recommendations
 */
recommendationLogSchema.statics.getFeatureImportance = async function(userId = null, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const matchQuery = {
    'context.generatedAt': { $gte: startDate }
  };
  
  if (userId) {
    matchQuery.user = new mongoose.Types.ObjectId(userId);
  }
  
  const stats = await this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        avgPetMatchContribution: { $avg: '$features.petMatch.contribution' },
        avgPurchaseHistoryContribution: { $avg: '$features.purchaseHistory.contribution' },
        avgViewingHistoryContribution: { $avg: '$features.viewingHistory.contribution' },
        avgPopularityContribution: { $avg: '$features.popularity.contribution' },
        avgPriceMatchContribution: { $avg: '$features.priceMatch.contribution' }
      }
    }
  ]);
  
  if (stats.length === 0) {
    return null;
  }
  
  return stats[0];
};

module.exports = mongoose.model('RecommendationLog', recommendationLogSchema);
