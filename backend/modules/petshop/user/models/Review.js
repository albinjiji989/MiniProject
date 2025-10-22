const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    required: [true, 'Please add a title for the review'],
    maxlength: 100
  },
  text: {
    type: String,
    required: [true, 'Please add some text']
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: [true, 'Please add a rating between 1 and 5']
  },
  photos: [{
    url: String,
    publicId: String,
    isPrimary: Boolean
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  petShop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PetShop'
  },
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PetInventoryItem'
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PetShopOrder'
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  isVerifiedPurchase: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'pending'
  },
  adminComments: String,
  helpfulCount: {
    type: Number,
    default: 0
  },
  reply: {
    text: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    date: Date
  },
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Prevent user from submitting more than one review per pet shop or item
reviewSchema.index({ petShop: 1, user: 1 }, { unique: true });
reviewSchema.index({ item: 1, user: 1 }, { unique: true });

// Static method to get average rating for a pet shop
reviewSchema.statics.getAverageRating = async function(petShopId) {
  const obj = await this.aggregate([
    {
      $match: { petShop: petShopId, status: 'approved' }
    },
    {
      $group: {
        _id: '$petShop',
        averageRating: { $avg: '$rating' },
        numReviews: { $sum: 1 }
      }
    }
  ]);

  try {
    await this.model('PetShop').findByIdAndUpdate(petShopId, {
      rating: obj[0]?.averageRating || 0,
      numReviews: obj[0]?.numReviews || 0
    });
  } catch (err) {
    console.error(err);
  }
};

// Call getAverageRating after save
reviewSchema.post('save', function() {
  if (this.petShop) {
    this.constructor.getAverageRating(this.petShop);
  }
});

// Call getAverageRating after remove
reviewSchema.post('remove', function() {
  if (this.petShop) {
    this.constructor.getAverageRating(this.petShop);
  }
});

// Method to check if user has already reviewed
reviewSchema.statics.hasUserReviewed = async function(userId, petShopId) {
  const review = await this.findOne({
    user: userId,
    petShop: petShopId
  });
  
  return review ? true : false;
};

// Method to mark review as helpful
reviewSchema.methods.markHelpful = async function(userId) {
  if (this.helpfulUsers.includes(userId)) {
    // User already marked as helpful, remove
    this.helpfulUsers = this.helpfulUsers.filter(id => id.toString() !== userId.toString());
    this.helpfulCount -= 1;
  } else {
    // Add user to helpful users
    this.helpfulUsers.push(userId);
    this.helpfulCount += 1;
  }
  
  await this.save();
  return this.helpfulCount;
};

// Virtual for user's name (handles anonymous reviews)
reviewSchema.virtual('reviewerName').get(function() {
  if (this.isAnonymous) {
    return 'Anonymous';
  }
  return this.user?.name || 'Deleted User';
});

// Virtual for user's avatar (handles anonymous reviews)
reviewSchema.virtual('reviewerAvatar').get(function() {
  if (this.isAnonymous) {
    return null;
  }
  return this.user?.avatar;
});

// Text index for search
reviewSchema.index({
  title: 'text',
  text: 'text'
});

module.exports = mongoose.model('Review', reviewSchema);