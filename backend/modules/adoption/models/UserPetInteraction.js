const mongoose = require('mongoose');

/**
 * UserPetInteraction Model
 * Tracks all user interactions with pets for collaborative filtering
 * Used by SVD algorithm to build interaction matrix
 */
const userPetInteractionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  petId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdoptionPet',
    default: null,  // null for bulk actions like "viewed_matches"
    index: true
  },
  interactionType: {
    type: String,
    enum: [
      'viewed',           // User viewed pet details (rating: 1)
      'favorited',        // User added to favorites (rating: 3)
      'applied',          // User submitted application (rating: 4)
      'adopted',          // Successful adoption (rating: 5)
      'returned',         // Pet was returned (rating: 0)
      'viewed_matches',   // User viewed match results (bulk action)
      'clicked',          // User clicked on pet card
      'shared'            // User shared pet listing
    ],
    required: true,
    index: true
  },
  matchScore: {
    type: Number,
    min: 0,
    max: 100,
    default: null  // Score from algorithm when interaction occurred
  },
  algorithmUsed: {
    type: String,
    enum: ['content', 'svd', 'xgboost', 'kmeans', 'hybrid', 'none'],
    default: 'none'
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}  // Additional context (page, source, device, etc.)
  },
  // For collaborative filtering rating conversion
  implicitRating: {
    type: Number,
    min: 0,
    max: 5,
    default: function() {
      // Auto-calculate based on interaction type
      const ratings = {
        'viewed': 1,
        'clicked': 1.5,
        'favorited': 3,
        'applied': 4,
        'adopted': 5,
        'returned': 0,
        'viewed_matches': 0.5,
        'shared': 2
      };
      return ratings[this.interactionType] || 1;
    }
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
userPetInteractionSchema.index({ userId: 1, petId: 1 });
userPetInteractionSchema.index({ userId: 1, timestamp: -1 });
userPetInteractionSchema.index({ petId: 1, timestamp: -1 });
userPetInteractionSchema.index({ interactionType: 1, timestamp: -1 });

// Static method to get user's interaction history
userPetInteractionSchema.statics.getUserHistory = async function(userId, limit = 50) {
  return this.find({ userId, petId: { $ne: null } })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('petId', 'name breed species')
    .lean();
};

// Static method to get pet's interaction stats
userPetInteractionSchema.statics.getPetStats = async function(petId) {
  const stats = await this.aggregate([
    { $match: { petId: mongoose.Types.ObjectId(petId) } },
    {
      $group: {
        _id: '$interactionType',
        count: { $sum: 1 }
      }
    }
  ]);
  
  return stats.reduce((acc, stat) => {
    acc[stat._id] = stat.count;
    return acc;
  }, {});
};

// Static method to get interaction matrix for collaborative filtering
userPetInteractionSchema.statics.getInteractionMatrix = async function() {
  return this.find({ petId: { $ne: null } })
    .select('userId petId implicitRating interactionType timestamp')
    .lean();
};

// Static method to count user interactions (for cold start detection)
userPetInteractionSchema.statics.getUserInteractionCount = async function(userId) {
  return this.countDocuments({ 
    userId, 
    petId: { $ne: null },
    interactionType: { $in: ['viewed', 'favorited', 'applied', 'adopted'] }
  });
};

const UserPetInteraction = mongoose.model('UserPetInteraction', userPetInteractionSchema);

module.exports = UserPetInteraction;
