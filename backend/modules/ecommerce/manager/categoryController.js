const ProductCategory = require('../models/ProductCategory');
const Product = require('../models/Product');

/**
 * MANAGER: Category Management
 * Managers can create and manage product categories
 */

/**
 * Get all categories (manager view with inactive)
 */
exports.getAllCategories = async (req, res) => {
  try {
    const { level, parent, search } = req.query;
    
    const query = {};
    
    if (level !== undefined) {
      query.level = parseInt(level);
    }
    
    if (parent) {
      query.parent = parent === 'null' ? null : parent;
    }
    
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    const categories = await ProductCategory.find(query)
      .populate('parent', 'name slug level')
      .sort('level displayOrder name')
      .lean();
    
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get category hierarchy tree (all levels)
 */
exports.getCategoryTree = async (req, res) => {
  try {
    // Get all categories
    const allCategories = await ProductCategory.find({})
      .sort('level displayOrder name')
      .lean();
    
    // Build tree structure
    const buildTree = (parentId = null, currentLevel = 0) => {
      return allCategories
        .filter(cat => {
          if (parentId === null) {
            return cat.parent === null || cat.parent === undefined;
          }
          return cat.parent && cat.parent.toString() === parentId.toString();
        })
        .map(cat => ({
          ...cat,
          children: buildTree(cat._id, currentLevel + 1)
        }));
    };
    
    const tree = buildTree();
    
    res.json({ success: true, data: tree });
  } catch (error) {
    console.error('Get category tree error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get single category with breadcrumb
 */
exports.getCategoryById = async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    const category = await ProductCategory.findById(categoryId)
      .populate('parent');
    
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    
    // Build breadcrumb
    const breadcrumb = [];
    let current = category;
    
    while (current) {
      breadcrumb.unshift({
        _id: current._id,
        name: current.name,
        slug: current.slug,
        level: current.level
      });
      
      if (current.parent && current.parent._id) {
        current = await ProductCategory.findById(current.parent._id).populate('parent');
      } else {
        current = null;
      }
    }
    
    res.json({ 
      success: true, 
      data: {
        ...category.toObject(),
        breadcrumb
      }
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Create new category
 * Examples:
 * - Level 0: Food, Toys, Grooming (parent: null)
 * - Level 1: Dog Food, Cat Food (parent: Food)
 * - Level 2: Pedigree, Royal Canin (parent: Dog Food)
 */
exports.createCategory = async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      parent,
      image,
      icon,
      displayOrder,
      metaTitle,
      metaDescription,
      metaKeywords,
      isActive
    } = req.body;
    
    // Determine level based on parent
    let level = 0;
    if (parent) {
      const parentCategory = await ProductCategory.findById(parent);
      if (!parentCategory) {
        return res.status(404).json({ success: false, message: 'Parent category not found' });
      }
      level = parentCategory.level + 1;
    }
    
    // Check if slug already exists
    if (slug) {
      const existing = await ProductCategory.findOne({ slug });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Slug already exists' });
      }
    }
    
    const category = new ProductCategory({
      name,
      slug,
      description,
      parent: parent || null,
      level,
      image,
      icon,
      displayOrder: displayOrder || 0,
      metaTitle,
      metaDescription,
      metaKeywords,
      isActive: isActive !== undefined ? isActive : true,
      productCount: 0
    });
    
    await category.save();
    
    await category.populate('parent', 'name slug level');
    
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Update category
 */
exports.updateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    const category = await ProductCategory.findById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    
    // Check if changing parent (level will change)
    if (req.body.parent !== undefined && req.body.parent !== category.parent) {
      if (req.body.parent) {
        const newParent = await ProductCategory.findById(req.body.parent);
        if (!newParent) {
          return res.status(404).json({ success: false, message: 'Parent category not found' });
        }
        category.level = newParent.level + 1;
      } else {
        category.level = 0;
      }
    }
    
    // Update allowed fields
    const allowedUpdates = [
      'name', 'slug', 'description', 'parent', 'image', 'icon',
      'displayOrder', 'metaTitle', 'metaDescription', 'metaKeywords', 'isActive'
    ];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        category[field] = req.body[field];
      }
    });
    
    await category.save();
    
    await category.populate('parent', 'name slug level');
    
    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Delete category (only if no products and no child categories)
 */
exports.deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    const category = await ProductCategory.findById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    
    // Check if has products
    const productCount = await Product.countDocuments({ 
      $or: [
        { category: categoryId },
        { subcategory: categoryId }
      ]
    });
    
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category with ${productCount} products. Please move or delete products first.`
      });
    }
    
    // Check if has child categories
    const childCount = await ProductCategory.countDocuments({ parent: categoryId });
    if (childCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category with ${childCount} subcategories. Please delete subcategories first.`
      });
    }
    
    await category.deleteOne();
    
    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Toggle category active status
 */
exports.toggleActiveStatus = async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    const category = await ProductCategory.findById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    
    category.isActive = !category.isActive;
    await category.save();
    
    res.json({
      success: true,
      message: `Category ${category.isActive ? 'activated' : 'deactivated'} successfully`,
      data: category
    });
  } catch (error) {
    console.error('Toggle active status error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get category statistics
 */
exports.getCategoryStats = async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    const category = await ProductCategory.findById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    
    // Get all descendant categories
    const getDescendants = async (catId) => {
      const children = await ProductCategory.find({ parent: catId });
      let descendants = [...children];
      
      for (let child of children) {
        const childDescendants = await getDescendants(child._id);
        descendants = [...descendants, ...childDescendants];
      }
      
      return descendants;
    };
    
    const descendants = await getDescendants(categoryId);
    const descendantIds = descendants.map(d => d._id);
    
    // Count products in this category and all descendants
    const productCount = await Product.countDocuments({
      $or: [
        { category: categoryId },
        { subcategory: categoryId },
        { category: { $in: descendantIds } },
        { subcategory: { $in: descendantIds } }
      ],
      status: 'active'
    });
    
    // Get subcategories count
    const subcategoryCount = await ProductCategory.countDocuments({ parent: categoryId });
    
    res.json({
      success: true,
      data: {
        category: category.name,
        level: category.level,
        directProducts: category.productCount,
        totalProducts: productCount,
        subcategories: subcategoryCount,
        allDescendants: descendants.length
      }
    });
  } catch (error) {
    console.error('Get category stats error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Reorder categories (change displayOrder)
 */
exports.reorderCategories = async (req, res) => {
  try {
    const { categories } = req.body; // Array of { id, displayOrder }
    
    const bulkOps = categories.map(cat => ({
      updateOne: {
        filter: { _id: cat.id },
        update: { displayOrder: cat.displayOrder }
      }
    }));
    
    await ProductCategory.bulkWrite(bulkOps);
    
    res.json({
      success: true,
      message: 'Categories reordered successfully'
    });
  } catch (error) {
    console.error('Reorder categories error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
