const mongoose = require('mongoose');

/**
 * Booking Review Model
 * Customer reviews for temporary care bookings
 */
const reviewSchema = new mongoose.Schema({
  // References
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CareBooking',
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  petId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet',
    required: true
  },
  
  // Ratings (1-5 stars)
  ratings: {
    overall: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    care_quality: {
      type: Number,
      min: 1,
      max: 5
    },
    communication: {
      type: Number,
      min: 1,
      max: 5
    },
    cleanliness: {
      type: Number,
      min: 1,
      max: 5
    },
    value_for_money: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  
  // Review Content
  title: {
    type: String,
    trim: true,
    maxlength: 100
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  
  // Staff Rating
  staffRatings: [{
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String
  }],
  
  // Pros and Cons
  pros: [{
    type: String
  }],
  cons: [{
    type: String
  }],
  
  // Media
  images: [{
    url: String,
    caption: String
  }],
  
  // Recommendations
  wouldRecommend: {
    type: Boolean,
    required: true
  },
  
  // Response
  response: {
    comment: String,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: Date
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'pending',
    index: true
  },
  
  isVerified: {
    type: Boolean,
    default: true // Verified if user actually used the service
  },
  
  // Moderation
  flagged: {
    isFlagged: {
      type: Boolean,
      default: false
    },
    reason: String,
    flaggedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    flaggedAt: Date
  },
  
  // Helpfulness
  helpful: {
    count: {
      type: Number,
      default: 0
    },
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  
  // Store reference
  storeId: {
    type: String,
    index: true
  },
  
  metadata: {
    type: Object,
    default: {}
  }
}, { 
  timestamps: true 
});

// Indexes
reviewSchema.index({ 'ratings.overall': -1 });
reviewSchema.index({ status: 1, 'ratings.overall': -1 });
reviewSchema.index({ userId: 1, createdAt: -1 });
reviewSchema.index({ storeId: 1, status: 1 });

// Calculate average of all ratings
reviewSchema.methods.calculateAverageRating = function() {
  const ratings = this.ratings;
  const scores = [
    ratings.overall,
    ratings.care_quality,
    ratings.communication,
    ratings.cleanliness,
    ratings.value_for_money
  ].filter(r => r !== undefined && r !== null);
  
  return scores.length > 0 
    ? scores.reduce((a, b) => a + b, 0) / scores.length 
    : ratings.overall;
};

module.exports = mongoose.model('CareReview', reviewSchema);
