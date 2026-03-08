const mongoose = require('mongoose');

/**
 * RecommendationLog Model
 * 
 * Tracks which pets were recommended to which user and whether they acted on them.
 * Used for production metrics: recommendation → application → adoption conversion funnel.
 * 
 * This enables measuring real-world effectiveness of the ML algorithms:
 * - Click-through rate (recommended → viewed)
 * - Application rate (recommended → applied)
 * - Adoption rate (recommended → adopted)
 * - Algorithm comparison (which algorithm drives more adoptions?)
 */
const recommendationLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Snapshot of what was recommended
  recommendations: [{
    petId: { type: mongoose.Schema.Types.ObjectId, ref: 'AdoptionPet', required: true },
    rank: { type: Number, required: true }, // 1 = top match
    hybridScore: { type: Number, default: 0 },
    algorithmScores: {
      content: { type: Number, default: 0 },
      collaborative: { type: Number, default: 0 },
      success: { type: Number, default: 0 },
      clustering: { type: Number, default: 0 }
    },
    // Track user actions on this recommendation
    applied: { type: Boolean, default: false },
    appliedAt: { type: Date },
    adopted: { type: Boolean, default: false },
    adoptedAt: { type: Date }
  }],

  // Which algorithm produced these recommendations
  algorithm: {
    type: String,
    enum: ['hybrid', 'content', 'content_based', 'content_based_fallback', 'content_based_emergency', 'collaborative', 'success', 'clustering'],
    default: 'hybrid'
  },

  // A/B source label for comparing ML vs fallback sessions
  abSource: {
    type: String,
    default: 'unknown'
  },
  
  // Algorithm weights at the time (for tracking drift)
  weights: {
    content: { type: Number, default: 0 },
    svd: { type: Number, default: 0 },
    xgboost: { type: Number, default: 0 },
    kmeans: { type: Number, default: 0 }
  },

  // Was ML service available?
  mlServiceAvailable: { type: Boolean, default: true },
  
  // Conversion metrics (updated as user acts)
  conversions: {
    totalRecommended: { type: Number, default: 0 },
    totalApplied: { type: Number, default: 0 },
    totalAdopted: { type: Number, default: 0 },
    applicationRate: { type: Number, default: 0 },   // applied / recommended
    adoptionRate: { type: Number, default: 0 }        // adopted / recommended
  }
}, {
  timestamps: true
});

// Indexes for querying
recommendationLogSchema.index({ userId: 1, createdAt: -1 });
recommendationLogSchema.index({ 'recommendations.petId': 1 });
recommendationLogSchema.index({ createdAt: -1 });

/**
 * Check if a pet was recently recommended to a user (within last 30 days).
 * Returns the log entry and recommendation details if found.
 */
recommendationLogSchema.statics.wasRecommended = async function(userId, petId) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  const log = await this.findOne({
    userId,
    'recommendations.petId': petId,
    createdAt: { $gte: thirtyDaysAgo }
  }).sort({ createdAt: -1 });

  if (!log) return null;

  const rec = log.recommendations.find(r => r.petId.toString() === petId.toString());
  return {
    logId: log._id,
    rank: rec?.rank,
    hybridScore: rec?.hybridScore,
    algorithm: log.algorithm,
    recommendedAt: log.createdAt
  };
};

/**
 * Mark a recommended pet as "applied" when user submits an application
 */
recommendationLogSchema.statics.markApplied = async function(userId, petId) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  const result = await this.findOneAndUpdate(
    {
      userId,
      'recommendations.petId': petId,
      createdAt: { $gte: thirtyDaysAgo }
    },
    {
      $set: {
        'recommendations.$.applied': true,
        'recommendations.$.appliedAt': new Date()
      },
      $inc: { 'conversions.totalApplied': 1 }
    },
    { sort: { createdAt: -1 }, new: true }
  );

  // Recalculate rates
  if (result) {
    result.conversions.applicationRate = 
      result.conversions.totalRecommended > 0 
        ? (result.conversions.totalApplied / result.conversions.totalRecommended) * 100 
        : 0;
    await result.save();
  }

  return result;
};

/**
 * Mark a recommended pet as "adopted" when adoption completes
 */
recommendationLogSchema.statics.markAdopted = async function(userId, petId) {
  const result = await this.findOneAndUpdate(
    {
      userId,
      'recommendations.petId': petId
    },
    {
      $set: {
        'recommendations.$.adopted': true,
        'recommendations.$.adoptedAt': new Date()
      },
      $inc: { 'conversions.totalAdopted': 1 }
    },
    { sort: { createdAt: -1 }, new: true }
  );

  if (result) {
    result.conversions.adoptionRate = 
      result.conversions.totalRecommended > 0
        ? (result.conversions.totalAdopted / result.conversions.totalRecommended) * 100
        : 0;
    await result.save();
  }

  return result;
};

/**
 * Get aggregate production metrics across all recommendations
 */
recommendationLogSchema.statics.getProductionMetrics = async function(daysBack = 30) {
  const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
  
  const metrics = await this.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $unwind: '$recommendations' },
    {
      $group: {
        _id: null,
        totalRecommendations: { $sum: 1 },
        totalApplied: { $sum: { $cond: ['$recommendations.applied', 1, 0] } },
        totalAdopted: { $sum: { $cond: ['$recommendations.adopted', 1, 0] } },
        avgHybridScore: { $avg: '$recommendations.hybridScore' },
        avgRankWhenApplied: {
          $avg: {
            $cond: ['$recommendations.applied', '$recommendations.rank', null]
          }
        },
        uniqueSessions: { $addToSet: '$_id' }
      }
    },
    {
      $project: {
        _id: 0,
        totalRecommendations: 1,
        totalApplied: 1,
        totalAdopted: 1,
        avgHybridScore: { $round: ['$avgHybridScore', 1] },
        avgRankWhenApplied: { $round: ['$avgRankWhenApplied', 1] },
        applicationRate: {
          $round: [
            { $multiply: [{ $divide: ['$totalApplied', { $max: ['$totalRecommendations', 1] }] }, 100] },
            1
          ]
        },
        adoptionRate: {
          $round: [
            { $multiply: [{ $divide: ['$totalAdopted', { $max: ['$totalRecommendations', 1] }] }, 100] },
            1
          ]
        },
        totalSessions: { $size: '$uniqueSessions' }
      }
    }
  ]);

  // Per-algorithm breakdown
  const byAlgorithm = await this.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: '$algorithm',
        sessions: { $sum: 1 },
        totalApplied: { $sum: '$conversions.totalApplied' },
        totalAdopted: { $sum: '$conversions.totalAdopted' },
        totalRecommended: { $sum: '$conversions.totalRecommended' }
      }
    }
  ]);

  return {
    overall: metrics[0] || {
      totalRecommendations: 0, totalApplied: 0, totalAdopted: 0,
      applicationRate: 0, adoptionRate: 0, totalSessions: 0
    },
    byAlgorithm: byAlgorithm.reduce((acc, item) => {
      acc[item._id] = {
        sessions: item.sessions,
        totalApplied: item.totalApplied,
        totalAdopted: item.totalAdopted,
        applicationRate: item.totalRecommended > 0
          ? ((item.totalApplied / item.totalRecommended) * 100).toFixed(1)
          : 0
      };
      return acc;
    }, {})
  };
};

const RecommendationLog = mongoose.model('RecommendationLog', recommendationLogSchema);

module.exports = RecommendationLog;
