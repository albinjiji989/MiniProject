const mongoose = require('mongoose');

/**
 * Product Review Model
 */
const reviewSchema = new mongoose.Schema({
  // Product & User
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  
  // Ratings (1-5 stars)
  rating: {
    overall: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    quality: {
      type: Number,
      min: 1,
      max: 5
    },
    value: {
      type: Number,
      min: 1,
      max: 5
    },
    packaging: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  
  // Review Content
  title: {
    type: String,
    trim: true,
    maxlength: 200
  },
  
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  
  // Media
  images: [{
    url: String,
    caption: String
  }],
  
  videos: [{
    url: String,
    thumbnail: String
  }],
  
  // Verification
  isVerifiedPurchase: {
    type: Boolean,
    default: false
  },
  
  // Interaction
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
  
  notHelpful: {
    count: {
      type: Number,
      default: 0
    },
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  
  // Replies/Comments
  replies: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    comment: String,
    isSeller: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Status & Moderation
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'reported'],
    default: 'approved',
    index: true
  },
  
  moderationNote: String,
  
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  moderatedAt: Date,
  
  // Reporting
  reports: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Seller Response
  sellerResponse: {
    comment: String,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: Date
  },
  
  // Pet Information (optional)
  petInfo: {
    petType: String,
    breed: String,
    age: String,
    usageDuration: String
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes
reviewSchema.index({ product: 1, user: 1 }, { unique: true });
reviewSchema.index({ product: 1, status: 1, createdAt: -1 });
reviewSchema.index({ user: 1, createdAt: -1 });
reviewSchema.index({ 'rating.overall': 1 });
reviewSchema.index({ isVerifiedPurchase: 1 });

// Methods
reviewSchema.methods.markHelpful = function(userId) {
  if (!this.helpful.users.includes(userId)) {
    this.helpful.users.push(userId);
    this.helpful.count += 1;
    
    // Remove from not helpful if exists
    const notHelpfulIndex = this.notHelpful.users.indexOf(userId);
    if (notHelpfulIndex > -1) {
      this.notHelpful.users.splice(notHelpfulIndex, 1);
      this.notHelpful.count -= 1;
    }
  }
};

reviewSchema.methods.markNotHelpful = function(userId) {
  if (!this.notHelpful.users.includes(userId)) {
    this.notHelpful.users.push(userId);
    this.notHelpful.count += 1;
    
    // Remove from helpful if exists
    const helpfulIndex = this.helpful.users.indexOf(userId);
    if (helpfulIndex > -1) {
      this.helpful.users.splice(helpfulIndex, 1);
      this.helpful.count -= 1;
    }
  }
};

// Static method to update product rating
reviewSchema.statics.updateProductRating = async function(productId) {
  const Product = mongoose.model('Product');
  
  const stats = await this.aggregate([
    { 
      $match: { 
        product: mongoose.Types.ObjectId(productId),
        status: 'approved'
      } 
    },
    {
      $group: {
        _id: '$product',
        averageRating: { $avg: '$rating.overall' },
        totalReviews: { $sum: 1 },
        rating5: { $sum: { $cond: [{ $eq: ['$rating.overall', 5] }, 1, 0] } },
        rating4: { $sum: { $cond: [{ $eq: ['$rating.overall', 4] }, 1, 0] } },
        rating3: { $sum: { $cond: [{ $eq: ['$rating.overall', 3] }, 1, 0] } },
        rating2: { $sum: { $cond: [{ $eq: ['$rating.overall', 2] }, 1, 0] } },
        rating1: { $sum: { $cond: [{ $eq: ['$rating.overall', 1] }, 1, 0] } }
      }
    }
  ]);
  
  if (stats.length > 0) {
    const { averageRating, totalReviews, rating5, rating4, rating3, rating2, rating1 } = stats[0];
    
    await Product.findByIdAndUpdate(productId, {
      'ratings.average': averageRating,
      'ratings.count': totalReviews,
      'ratings.distribution': {
        5: rating5,
        4: rating4,
        3: rating3,
        2: rating2,
        1: rating1
      }
    });
  }
};

// Update product rating after save
reviewSchema.post('save', async function() {
  await this.constructor.updateProductRating(this.product);
});

// Update product rating after remove
reviewSchema.post('remove', async function() {
  await this.constructor.updateProductRating(this.product);
});

module.exports = mongoose.model('ProductReview', reviewSchema);
