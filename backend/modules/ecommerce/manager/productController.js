const Product = require('../models/Product');
const ProductCategory = require('../models/ProductCategory');
const multer = require('multer');
const path = require('path');

/**
 * Enhanced Product Controller for Manager
 * Amazon/Flipkart style product management
 */

// Get all products with filters
exports.getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      category,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      minPrice,
      maxPrice,
      inStock
    } = req.query;
    
    const query = { seller: req.user.id };
    
    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
      query.$text = { $search: search };
    }
    if (minPrice || maxPrice) {
      query['pricing.basePrice'] = {};
      if (minPrice) query['pricing.basePrice'].$gte = parseFloat(minPrice);
      if (maxPrice) query['pricing.basePrice'].$lte = parseFloat(maxPrice);
    }
    if (inStock === 'true') {
      query['inventory.stock'] = { $gt: 0 };
    }
    
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    
    const products = await Product.find(query)
      .populate('category', 'name slug path')
      .populate('categoryPath', 'name slug')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
    
    const count = await Product.countDocuments(query);
    
    res.json({
      success: true,
      data: products,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
};

// Get single product
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug path specificationTemplate')
      .populate('categoryPath', 'name slug')
      .populate('relatedProducts', 'name slug images pricing');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Check if user owns this product
    if (product.seller.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    });
  }
};

// Create product (Step 1: Basic Info)
exports.createProduct = async (req, res) => {
  try {
    // Generate unique slug
    let slug = req.body.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    // Ensure slug is unique by adding timestamp
    slug = `${slug}-${Date.now()}`;
    
    const productData = {
      name: req.body.name,
      slug: slug,
      description: req.body.description || 'Product description',
      shortDescription: req.body.shortDescription || '',
      tags: req.body.tags || [],
      seller: req.user.id,
      storeId: req.user.storeId,
      storeName: req.user.storeName || req.user.name,
      status: 'draft',
      // Set default values for required fields
      pricing: {
        basePrice: 0,
        tax: { percentage: 18, inclusive: false }
      },
      inventory: {
        stock: 0,
        trackInventory: true
      },
      petType: ['all']
    };
    
    // Add category if provided
    if (req.body.category) {
      const category = await ProductCategory.findById(req.body.category);
      if (category) {
        productData.category = req.body.category;
        productData.categoryPath = [...category.ancestors, category._id];
      }
    }
    
    const product = new Product(productData);
    await product.save();
    
    if (product.category) {
      await product.populate('category', 'name slug path specificationTemplate');
    }
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating product',
      error: error.message,
      details: error.stack
    });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    console.log('Updating product:', id);
    console.log('Updates:', JSON.stringify(updates, null, 2));
    
    // Check ownership
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    if (product.seller.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Update category path if category changed
    if (updates.category) {
      const currentCategoryId = product.category ? product.category.toString() : null;
      if (updates.category !== currentCategoryId) {
        const category = await ProductCategory.findById(updates.category);
        if (category) {
          updates.categoryPath = [...category.ancestors, category._id];
        }
      }
    }
    
    // Use $set to update only provided fields
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: false } // Disable validators for partial updates
    )
      .populate('category', 'name slug path specificationTemplate')
      .populate('categoryPath', 'name slug');
    
    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    if (product.seller.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    await product.deleteOne();
    
    // Update category product count
    await ProductCategory.findByIdAndUpdate(product.category, {
      $inc: { productCount: -1 }
    });
    
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: error.message
    });
  }
};

// Bulk update products
exports.bulkUpdateProducts = async (req, res) => {
  try {
    const { productIds, updates } = req.body;
    
    // Verify ownership
    const products = await Product.find({
      _id: { $in: productIds },
      seller: req.user.id
    });
    
    if (products.length !== productIds.length) {
      return res.status(403).json({
        success: false,
        message: 'Some products not found or access denied'
      });
    }
    
    await Product.updateMany(
      { _id: { $in: productIds } },
      updates
    );
    
    res.json({
      success: true,
      message: `${productIds.length} products updated successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error bulk updating products',
      error: error.message
    });
  }
};

// Update product status
exports.updateProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const product = await Product.findOne({ _id: id, seller: req.user.id });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    product.status = status;
    if (status === 'active' && !product.publishedAt) {
      product.publishedAt = new Date();
    }
    
    await product.save();
    
    res.json({
      success: true,
      message: 'Product status updated successfully',
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating product status',
      error: error.message
    });
  }
};

// Update inventory
exports.updateInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock, lowStockThreshold, allowBackorder } = req.body;
    
    const product = await Product.findOne({ _id: id, seller: req.user.id });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    if (stock !== undefined) product.inventory.stock = stock;
    if (lowStockThreshold !== undefined) product.inventory.lowStockThreshold = lowStockThreshold;
    if (allowBackorder !== undefined) product.inventory.allowBackorder = allowBackorder;
    
    await product.save();
    
    res.json({
      success: true,
      message: 'Inventory updated successfully',
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating inventory',
      error: error.message
    });
  }
};

// Get product analytics
exports.getProductAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findOne({ _id: id, seller: req.user.id });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        analytics: product.analytics,
        ratings: product.ratings,
        inventory: {
          stock: product.inventory.stock,
          reserved: product.inventory.reserved,
          available: product.availableStock
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics',
      error: error.message
    });
  }
};

// Duplicate product
exports.duplicateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findOne({ _id: id, seller: req.user.id });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    const duplicate = new Product({
      ...product.toObject(),
      _id: undefined,
      name: `${product.name} (Copy)`,
      slug: `${product.slug}-copy-${Date.now()}`,
      status: 'draft',
      inventory: {
        ...product.inventory.toObject(),
        sku: undefined,
        stock: 0
      },
      analytics: {
        views: 0,
        clicks: 0,
        purchases: 0,
        revenue: 0,
        wishlistCount: 0
      },
      ratings: {
        average: 0,
        count: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      },
      publishedAt: undefined,
      createdAt: undefined,
      updatedAt: undefined
    });
    
    await duplicate.save();
    
    res.status(201).json({
      success: true,
      message: 'Product duplicated successfully',
      data: duplicate
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error duplicating product',
      error: error.message
    });
  }
};
