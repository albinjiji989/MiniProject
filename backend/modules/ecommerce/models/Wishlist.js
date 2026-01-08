const mongoose = require('mongoose');

/**
 * Wishlist Model
 */
const wishlistItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  variant: {
    type: mongoose.Schema.Types.ObjectId
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  notes: String
}, { _id: true });

const wishlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  
  items: [wishlistItemSchema],
  
  // Settings
  isPublic: {
    type: Boolean,
    default: false
  },
  
  name: {
    type: String,
    default: 'My Wishlist'
  },
  
  // Metadata
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Update lastUpdated on save
wishlistSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Methods
wishlistSchema.methods.addItem = function(productId, variantId = null, priority = 'medium') {
  const exists = this.items.find(item => 
    item.product.toString() === productId.toString() &&
    (variantId ? item.variant?.toString() === variantId.toString() : !item.variant)
  );
  
  if (!exists) {
    this.items.push({
      product: productId,
      variant: variantId,
      priority,
      addedAt: new Date()
    });
  }
};

wishlistSchema.methods.removeItem = function(productId, variantId = null) {
  this.items = this.items.filter(item =>
    !(item.product.toString() === productId.toString() &&
      (variantId ? item.variant?.toString() === variantId.toString() : !item.variant))
  );
};

wishlistSchema.methods.hasItem = function(productId, variantId = null) {
  return this.items.some(item =>
    item.product.toString() === productId.toString() &&
    (variantId ? item.variant?.toString() === variantId.toString() : !item.variant)
  );
};

module.exports = mongoose.model('Wishlist', wishlistSchema);
