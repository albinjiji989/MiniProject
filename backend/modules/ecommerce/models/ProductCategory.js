const mongoose = require('mongoose');

/**
 * Product Category Model - Unlimited Hierarchical category structure
 * Supports: Category → Subcategory → Sub-subcategory → ... (unlimited depth)
 * Example: Toys → Dog Toys → Balls → Rubber Balls
 */
const productCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: false, // Generated automatically in pre-save
    unique: true,
    lowercase: true
  },
  description: String,
  
  // Unlimited Hierarchical structure
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductCategory',
    default: null,
    index: true
  },
  ancestors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductCategory'
  }], // Full path from root to parent
  level: {
    type: Number,
    default: 0 // 0: root, 1+: any depth
  },
  path: String, // e.g., "toys/dog-toys/balls"
  
  // Display
  image: String,
  icon: String,
  banner: String,
  displayOrder: {
    type: Number,
    default: 0
  },
  color: String, // For UI theming
  
  // Category Specifications Template
  // Defines what specs products in this category should have
  specificationTemplate: [{
    name: String, // e.g., "Breed", "Size", "Material"
    type: {
      type: String,
      enum: ['text', 'number', 'select', 'multiselect', 'boolean'],
      default: 'text'
    },
    options: [String], // For select/multiselect
    required: Boolean,
    unit: String // e.g., "kg", "cm"
  }],
  
  // Filters available for this category
  availableFilters: [{
    name: String,
    type: String,
    values: [String]
  }],
  
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
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  // Stats
  productCount: {
    type: Number,
    default: 0
  },
  
  // Manager who created this
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
productCategorySchema.index({ slug: 1 });
productCategorySchema.index({ parent: 1, isActive: 1 });
productCategorySchema.index({ level: 1, isActive: 1 });
productCategorySchema.index({ path: 1 });
productCategorySchema.index({ ancestors: 1 });

// Virtual for children
productCategorySchema.virtual('children', {
  ref: 'ProductCategory',
  localField: '_id',
  foreignField: 'parent'
});

// Methods
productCategorySchema.methods.getFullPath = async function() {
  if (this.ancestors.length === 0) return [this];
  
  const ancestors = await this.model('ProductCategory')
    .find({ _id: { $in: this.ancestors } })
    .sort({ level: 1 });
  
  return [...ancestors, this];
};

productCategorySchema.methods.getAllDescendants = async function() {
  return await this.model('ProductCategory').find({
    ancestors: this._id
  });
};

// Pre-save middleware
productCategorySchema.pre('save', async function(next) {
  try {
    // Auto-generate slug
    if (!this.slug && this.name) {
      let baseSlug = this.name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      
      // Ensure unique slug
      let slug = baseSlug;
      let counter = 1;
      while (await this.model('ProductCategory').findOne({ slug, _id: { $ne: this._id } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      this.slug = slug;
    }
    
    // Update ancestors and level
    if (this.parent) {
      const parent = await this.model('ProductCategory').findById(this.parent);
      if (parent) {
        this.ancestors = [...(parent.ancestors || []), parent._id];
        this.level = (parent.level || 0) + 1;
        
        // Build path
        const parentPath = parent.path || parent.slug;
        this.path = `${parentPath}/${this.slug}`;
      }
    } else {
      this.ancestors = [];
      this.level = 0;
      this.path = this.slug;
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('ProductCategory', productCategorySchema);
