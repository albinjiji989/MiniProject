const mongoose = require('mongoose');

const userSearchHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  searchQuery: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  searchCount: {
    type: Number,
    default: 1
  },
  lastSearched: {
    type: Date,
    default: Date.now
  },
  // Products clicked from this search
  clickedProducts: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EcommerceProduct'
    },
    clickedAt: Date
  }],
  // Search metadata
  filters: mongoose.Schema.Types.Mixed,
  resultsCount: Number
}, {
  timestamps: true
});

userSearchHistorySchema.index({ userId: 1, searchQuery: 1 }, { unique: true });
userSearchHistorySchema.index({ userId: 1, lastSearched: -1 });

// Record a search
userSearchHistorySchema.statics.recordSearch = async function(userId, searchQuery, metadata = {}) {
  return await this.findOneAndUpdate(
    { userId, searchQuery: searchQuery.toLowerCase() },
    {
      $inc: { searchCount: 1 },
      $set: { 
        lastSearched: new Date(),
        ...(metadata.resultsCount && { resultsCount: metadata.resultsCount }),
        ...(metadata.filters && { filters: metadata.filters })
      }
    },
    { upsert: true, new: true }
  );
};

// Get trending searches (across all users)
userSearchHistorySchema.statics.getTrendingSearches = async function(limit = 10, days = 7) {
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - days);
  
  return await this.aggregate([
    {
      $match: {
        lastSearched: { $gte: dateThreshold }
      }
    },
    {
      $group: {
        _id: '$searchQuery',
        totalSearches: { $sum: '$searchCount' },
        uniqueUsers: { $addToSet: '$userId' }
      }
    },
    {
      $project: {
        searchQuery: '$_id',
        totalSearches: 1,
        uniqueUserCount: { $size: '$uniqueUsers' }
      }
    },
    {
      $sort: { totalSearches: -1 }
    },
    {
      $limit: limit
    }
  ]);
};

module.exports = mongoose.model('UserSearchHistory', userSearchHistorySchema);
