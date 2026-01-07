const mongoose = require('mongoose');

/**
 * Product Category Model - Hierarchical category structure
 */
const productCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: String,
  
  // Hierarchical structure
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductCategory',
    default: null
  },
  level: {
    type: Number,
    default: 0 // 0: root, 1: subcategory, 2: sub-subcategory
  },
  
  // Display
  image: String,
  icon: String,
  displayOrder: {
    type: Number,
    default: 0
  },
  
  // SEO
  metaTitle: String,
  metaDescription: String,
  metaKeywords: [String],
  
  // Status
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  // Stats
  productCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Indexes
productCategorySchema.index({ slug: 1 });
productCategorySchema.index({ parent: 1, isActive: 1 });

module.exports = mongoose.model('ProductCategory', productCategorySchema);
