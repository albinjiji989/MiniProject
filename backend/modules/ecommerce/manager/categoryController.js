const ProductCategory = require('../models/ProductCategory');
const Product = require('../models/Product');

/**
 * Enhanced Category Controller for Manager
 * Supports unlimited category hierarchy
 */

// Get all categories with hierarchy
exports.getAllCategories = async (req, res) => {
  try {
    const { includeInactive, parentId } = req.query;
    
    const query = {};
    if (!includeInactive) query.isActive = true;
    if (parentId) query.parent = parentId === 'root' ? null : parentId;
    
    const categories = await ProductCategory.find(query)
      .populate('parent', 'name slug')
      .populate('ancestors', 'name slug')
      .sort({ level: 1, displayOrder: 1, name: 1 });
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
};

// Get category tree (hierarchical structure)
exports.getCategoryTree = async (req, res) => {
  try {
    const { includeInactive } = req.query;
    
    const query = { parent: null };
    if (!includeInactive) query.isActive = true;
    
    const buildTree = async (parentId = null, level = 0) => {
      const query = { parent: parentId };
      if (!includeInactive) query.isActive = true;
      
      const categories = await ProductCategory.find(query)
        .sort({ displayOrder: 1, name: 1 })
        .lean();
      
      const tree = [];
      for (const category of categories) {
        const children = await buildTree(category._id, level + 1);
        tree.push({
          ...category,
          children,
          hasChildren: children.length > 0
        });
      }
      
      return tree;
    };
    
    const tree = await buildTree();
    
    res.json({
      success: true,
      data: tree
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error building category tree',
      error: error.message
    });
  }
};

// Get single category with full path
exports.getCategory = async (req, res) => {
  try {
    const category = await ProductCategory.findById(req.params.id)
      .populate('parent', 'name slug')
      .populate('ancestors', 'name slug');
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Get children
    const children = await ProductCategory.find({ parent: category._id })
      .sort({ displayOrder: 1, name: 1 });
    
    res.json({
      success: true,
      data: {
        ...category.toObject(),
        children
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching category',
      error: error.message
    });
  }
};

// Create category
exports.createCategory = async (req, res) => {
  try {
    console.log('Creating category with data:', req.body);
    console.log('User:', req.user);
    
    const categoryData = {
      name: req.body.name,
      description: req.body.description || '',
      parent: req.body.parent || null,
      createdBy: req.user.id
    };
    
    console.log('Category data to save:', categoryData);
    
    const category = new ProductCategory(categoryData);
    await category.save();
    
    console.log('Category saved:', category);
    
    // Update parent's product count if exists
    if (category.parent) {
      await ProductCategory.findByIdAndUpdate(category.parent, {
        $inc: { productCount: 0 }
      });
    }
    
    await category.populate('parent', 'name slug');
    await category.populate('ancestors', 'name slug');
    
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating category',
      error: error.message,
      stack: error.stack
    });
  }
};

// Update category
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Prevent circular reference
    if (updates.parent) {
      const category = await ProductCategory.findById(id);
      const descendants = await category.getAllDescendants();
      const descendantIds = descendants.map(d => d._id.toString());
      
      if (descendantIds.includes(updates.parent.toString())) {
        return res.status(400).json({
          success: false,
          message: 'Cannot set a descendant as parent (circular reference)'
        });
      }
    }
    
    const category = await ProductCategory.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    )
      .populate('parent', 'name slug')
      .populate('ancestors', 'name slug');
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating category',
      error: error.message
    });
  }
};

// Delete category
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { moveProductsTo, deleteProducts } = req.query;
    
    const category = await ProductCategory.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Check for children
    const childrenCount = await ProductCategory.countDocuments({ parent: id });
    if (childrenCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with subcategories. Delete subcategories first.'
      });
    }
    
    // Handle products
    const productCount = await Product.countDocuments({ category: id });
    if (productCount > 0) {
      if (deleteProducts === 'true') {
        await Product.deleteMany({ category: id });
      } else if (moveProductsTo) {
        await Product.updateMany(
          { category: id },
          { category: moveProductsTo }
        );
      } else {
        return res.status(400).json({
          success: false,
          message: `Category has ${productCount} products. Specify moveProductsTo or deleteProducts=true`
        });
      }
    }
    
    await category.deleteOne();
    
    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting category',
      error: error.message
    });
  }
};

// Get category path (breadcrumb)
exports.getCategoryPath = async (req, res) => {
  try {
    const category = await ProductCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    const path = await category.getFullPath();
    
    res.json({
      success: true,
      data: path
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching category path',
      error: error.message
    });
  }
};

// Reorder categories
exports.reorderCategories = async (req, res) => {
  try {
    const { orders } = req.body; // [{ id, displayOrder }]
    
    const updates = orders.map(({ id, displayOrder }) =>
      ProductCategory.findByIdAndUpdate(id, { displayOrder })
    );
    
    await Promise.all(updates);
    
    res.json({
      success: true,
      message: 'Categories reordered successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error reordering categories',
      error: error.message
    });
  }
};
