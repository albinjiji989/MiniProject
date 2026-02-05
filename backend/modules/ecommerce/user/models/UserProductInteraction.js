const mongoose = require('mongoose');

const userProductInteractionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EcommerceProduct',
    required: true,
    index: true
  },
  
  // Interaction types
  views: {
    type: Number,
    default: 0
  },
  clicks: {
    type: Number,
    default: 0
  },
  addedToCart: {
    type: Number,
    default: 0
  },
  purchased: {
    type: Number,
    default: 0
  },
  searchCount: {
    type: Number,
    default: 0
  },
  
  // Timestamps for interactions
  lastViewed: Date,
  lastClicked: Date,
  lastAddedToCart: Date,
  lastPurchased: Date,
  lastSearched: Date,
  
  // Engagement metrics
  totalTimeSpent: {
    type: Number,
    default: 0 // in seconds
  },
  
  // User rating/feedback
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  
  // Context when interaction happened
  interactionContext: [{
    type: {
      type: String,
      enum: ['view', 'click', 'cart', 'purchase', 'search', 'rating']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    metadata: mongoose.Schema.Types.Mixed
  }]
}, {
  timestamps: true
});

// Compound index for efficient querying
userProductInteractionSchema.index({ userId: 1, productId: 1 }, { unique: true });
userProductInteractionSchema.index({ userId: 1, lastViewed: -1 });
userProductInteractionSchema.index({ userId: 1, purchased: -1 });

// Static method to record interaction
userProductInteractionSchema.statics.recordInteraction = async function(userId, productId, interactionType, metadata = {}) {
  const update = {
    $inc: {},
    $set: {},
    $push: {
      interactionContext: {
        type: interactionType,
        timestamp: new Date(),
        metadata
      }
    }
  };
  
  // Increment counter based on type
  switch(interactionType) {
    case 'view':
      update.$inc.views = 1;
      update.$set.lastViewed = new Date();
      break;
    case 'click':
      update.$inc.clicks = 1;
      update.$set.lastClicked = new Date();
      break;
    case 'cart':
      update.$inc.addedToCart = 1;
      update.$set.lastAddedToCart = new Date();
      break;
    case 'purchase':
      update.$inc.purchased = 1;
      update.$set.lastPurchased = new Date();
      break;
    case 'search':
      update.$inc.searchCount = 1;
      update.$set.lastSearched = new Date();
      break;
    case 'rating':
      update.$set.rating = metadata.rating;
      break;
  }
  
  return await this.findOneAndUpdate(
    { userId, productId },
    update,
    { upsert: true, new: true }
  );
};

// Get user's interaction history
userProductInteractionSchema.statics.getUserHistory = async function(userId, options = {}) {
  const { limit = 50, minViews = 0 } = options;
  
  return await this.find({
    userId,
    views: { $gte: minViews }
  })
    .sort({ lastViewed: -1 })
    .limit(limit)
    .populate('productId');
};

// Get popular products (across all users)
userProductInteractionSchema.statics.getPopularProducts = async function(options = {}) {
  const { limit = 10, timeWindow = 30 } = options; // timeWindow in days
  
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - timeWindow);
  
  return await this.aggregate([
    {
      $match: {
        lastViewed: { $gte: dateThreshold }
      }
    },
    {
      $group: {
        _id: '$productId',
        totalViews: { $sum: '$views' },
        totalPurchases: { $sum: '$purchased' },
        totalClicks: { $sum: '$clicks' },
        uniqueUsers: { $addToSet: '$userId' },
        avgRating: { $avg: '$rating' }
      }
    },
    {
      $addFields: {
        popularityScore: {
          $add: [
            { $multiply: ['$totalViews', 1] },
            { $multiply: ['$totalClicks', 2] },
            { $multiply: ['$totalPurchases', 10] },
            { $multiply: [{ $size: '$uniqueUsers' }, 3] }
          ]
        }
      }
    },
    {
      $sort: { popularityScore: -1 }
    },
    {
      $limit: limit
    }
  ]);
};

module.exports = mongoose.model('UserProductInteraction', userProductInteractionSchema);
