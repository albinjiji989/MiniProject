const mongoose = require('mongoose');

/**
 * Product View Tracking Model
 * Tracks user product views for recommendation engine
 */
const productViewSchema = new mongoose.Schema({
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
  
  // View details
  viewCount: {
    type: Number,
    default: 1
  },
  lastViewedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Context tracking
  viewDuration: {
    type: Number, // seconds spent viewing
    default: 0
  },
  source: {
    type: String,
    enum: ['search', 'category', 'recommendation', 'related', 'direct', 'other'],
    default: 'direct'
  },
  
  // Device and session
  deviceType: {
    type: String,
    enum: ['desktop', 'mobile', 'tablet'],
    default: 'desktop'
  },
  sessionId: String
}, {
  timestamps: true
});

// Compound indexes for efficient queries
productViewSchema.index({ user: 1, product: 1 }, { unique: true });
productViewSchema.index({ user: 1, lastViewedAt: -1 });
productViewSchema.index({ product: 1, lastViewedAt: -1 });

// Static method to record a view
productViewSchema.statics.recordView = async function(userId, productId, viewData = {}) {
  const view = await this.findOneAndUpdate(
    { user: userId, product: productId },
    {
      $inc: { viewCount: 1 },
      $set: {
        lastViewedAt: new Date(),
        source: viewData.source || 'direct',
        deviceType: viewData.deviceType || 'desktop',
        sessionId: viewData.sessionId,
        viewDuration: viewData.viewDuration || 0
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  
  // Update product analytics
  await mongoose.model('Product').findByIdAndUpdate(productId, {
    $inc: { 'analytics.views': 1 }
  });
  
  return view;
};

// Static method to get recent views for a user
productViewSchema.statics.getRecentViews = async function(userId, limit = 10) {
  return this.find({ user: userId })
    .sort({ lastViewedAt: -1 })
    .limit(limit)
    .populate('product', 'name slug pricing images petType breeds species')
    .lean();
};

module.exports = mongoose.model('ProductView', productViewSchema);
