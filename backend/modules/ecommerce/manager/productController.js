const Product = require('../models/Product');
const ProductCategory = require('../models/ProductCategory');

/**
 * MANAGER: Product Management
 * Managers create, update, and manage products
 */

/**
 * Get all products (manager view)
 */
exports.getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      category,
      search,
      sort = '-createdAt',
      lowStock
    } = req.query;
    
    const query = {};
    
    // Add manager/store filter if needed
    if (req.user.storeId) {
      query.storeId = req.user.storeId;
    }
    
    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
      query.$text = { $search: search };
    }
    if (lowStock === 'true') {
      query.$expr = { $lte: ['$stock', '$lowStockThreshold'] };
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category subcategory', 'name slug')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Product.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      data: products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get single product (manager view)
 */
exports.getProductById = async (req, res) => {
  try {
    const { productId } = req.params;
    
    const product = await Product.findById(productId)
      .populate('category subcategory', 'name slug level parent')
      .populate('relatedProducts', 'name slug images basePrice');
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    res.json({ success: true, data: product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Create new product
 */
exports.createProduct = async (req, res) => {
  try {
    const productData = req.body;
    
    // Validate category exists
    if (productData.category) {
      const category = await ProductCategory.findById(productData.category);
      if (!category) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }
    }
    
    // Add manager/store info
    if (req.user.storeId) {
      productData.storeId = req.user.storeId;
    }
    if (req.user._id) {
      productData.seller = req.user._id;
    }
    
    // Set initial status
    productData.status = productData.status || 'draft';
    
    const product = new Product(productData);
    await product.save();
    
    // Update category product count
    if (product.category) {
      await ProductCategory.findByIdAndUpdate(product.category, {
        $inc: { productCount: 1 }
      });
    }
    
    await product.populate('category subcategory', 'name slug');
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Update product
 */
exports.updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    const oldCategory = product.category;
    
    // Update fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        product[key] = req.body[key];
      }
    });
    
    await product.save();
    
    // Update category counts if category changed
    if (req.body.category && oldCategory?.toString() !== req.body.category) {
      if (oldCategory) {
        await ProductCategory.findByIdAndUpdate(oldCategory, {
          $inc: { productCount: -1 }
        });
      }
      await ProductCategory.findByIdAndUpdate(req.body.category, {
        $inc: { productCount: 1 }
      });
    }
    
    await product.populate('category subcategory', 'name slug');
    
    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Delete product
 */
exports.deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    // Update category count
    if (product.category) {
      await ProductCategory.findByIdAndUpdate(product.category, {
        $inc: { productCount: -1 }
      });
    }
    
    await product.deleteOne();
    
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Update product status (draft/active/inactive)
 */
exports.updateProductStatus = async (req, res) => {
  try {
    const { productId } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['draft', 'active', 'inactive', 'out_of_stock', 'discontinued'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status. Must be: ' + validStatuses.join(', ')
      });
    }
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    product.status = status;
    await product.save();
    
    res.json({
      success: true,
      message: `Product status updated to ${status}`,
      data: product
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Update inventory (stock)
 */
exports.updateInventory = async (req, res) => {
  try {
    const { productId } = req.params;
    const { stock, reserved, lowStockThreshold } = req.body;
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    if (stock !== undefined) product.stock = stock;
    if (reserved !== undefined) product.reserved = reserved;
    if (lowStockThreshold !== undefined) product.lowStockThreshold = lowStockThreshold;
    
    await product.save();
    
    res.json({
      success: true,
      message: 'Inventory updated successfully',
      data: {
        stock: product.stock,
        reserved: product.reserved,
        availableStock: product.availableStock,
        lowStockThreshold: product.lowStockThreshold
      }
    });
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Bulk update inventory
 */
exports.bulkUpdateInventory = async (req, res) => {
  try {
    const { updates } = req.body; // Array of { productId, stock, reserved }
    
    const bulkOps = updates.map(update => ({
      updateOne: {
        filter: { _id: update.productId },
        update: {
          stock: update.stock,
          reserved: update.reserved || 0
        }
      }
    }));
    
    const result = await Product.bulkWrite(bulkOps);
    
    res.json({
      success: true,
      message: 'Bulk inventory update completed',
      data: {
        modified: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Update product pricing
 */
exports.updatePricing = async (req, res) => {
  try {
    const { productId } = req.params;
    const { basePrice, salePrice, costPrice, compareAtPrice, discount } = req.body;
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    if (basePrice !== undefined) product.basePrice = basePrice;
    if (salePrice !== undefined) product.salePrice = salePrice;
    if (costPrice !== undefined) product.costPrice = costPrice;
    if (compareAtPrice !== undefined) product.compareAtPrice = compareAtPrice;
    if (discount !== undefined) product.discount = discount;
    
    await product.save();
    
    res.json({
      success: true,
      message: 'Pricing updated successfully',
      data: {
        basePrice: product.basePrice,
        salePrice: product.salePrice,
        finalPrice: product.finalPrice,
        discountPercentage: product.discountPercentage
      }
    });
  } catch (error) {
    console.error('Update pricing error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Add product variant
 */
exports.addVariant = async (req, res) => {
  try {
    const { productId } = req.params;
    const variant = req.body;
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    product.hasVariants = true;
    product.variants.push(variant);
    
    await product.save();
    
    res.json({
      success: true,
      message: 'Variant added successfully',
      data: product
    });
  } catch (error) {
    console.error('Add variant error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Update product variant
 */
exports.updateVariant = async (req, res) => {
  try {
    const { productId, variantId } = req.params;
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    const variant = product.variants.id(variantId);
    if (!variant) {
      return res.status(404).json({ success: false, message: 'Variant not found' });
    }
    
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        variant[key] = req.body[key];
      }
    });
    
    await product.save();
    
    res.json({
      success: true,
      message: 'Variant updated successfully',
      data: product
    });
  } catch (error) {
    console.error('Update variant error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Delete product variant
 */
exports.deleteVariant = async (req, res) => {
  try {
    const { productId, variantId } = req.params;
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    product.variants = product.variants.filter(v => v._id.toString() !== variantId);
    
    if (product.variants.length === 0) {
      product.hasVariants = false;
    }
    
    await product.save();
    
    res.json({
      success: true,
      message: 'Variant deleted successfully',
      data: product
    });
  } catch (error) {
    console.error('Delete variant error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get low stock products
 */
exports.getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.find({
      $expr: { $lte: ['$stock', '$lowStockThreshold'] },
      status: { $in: ['active', 'draft'] }
    })
      .populate('category', 'name')
      .select('name sku stock lowStockThreshold category')
      .sort('stock')
      .limit(50);
    
    res.json({ success: true, data: products });
  } catch (error) {
    console.error('Get low stock error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get product analytics
 */
exports.getProductAnalytics = async (req, res) => {
  try {
    const { productId } = req.params;
    
    const product = await Product.findById(productId)
      .select('name analytics ratings stock');
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    res.json({
      success: true,
      data: {
        product: product.name,
        analytics: product.analytics,
        ratings: product.ratings,
        stock: {
          current: product.stock,
          reserved: product.reserved,
          available: product.availableStock
        }
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
