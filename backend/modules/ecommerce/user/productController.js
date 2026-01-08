const Product = require('../models/Product');
const ProductCategory = require('../models/ProductCategory');
const ProductReview = require('../models/ProductReview');

/**
 * Get all products with filtering, sorting, and pagination
 */
exports.getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sort = '-createdAt',
      category,
      subcategory,
      petType,
      ageGroup,
      breed,
      minPrice,
      maxPrice,
      rating,
      brand,
      inStock,
      isFeatured,
      search,
      tags
    } = req.query;

    // Build query
    const query = { status: 'active' };

    if (category) query.category = category;
    if (subcategory) query.subcategory = subcategory;
    if (petType) query.petType = petType;
    if (ageGroup) query.ageGroup = ageGroup;
    if (breed) query.breed = { $in: Array.isArray(breed) ? breed : [breed] };
    if (brand) query.brand = brand;
    if (isFeatured === 'true') query.isFeatured = true;
    
    // Price range
    if (minPrice || maxPrice) {
      query.basePrice = {};
      if (minPrice) query.basePrice.$gte = parseFloat(minPrice);
      if (maxPrice) query.basePrice.$lte = parseFloat(maxPrice);
    }
    
    // Rating filter
    if (rating) {
      query['ratings.average'] = { $gte: parseFloat(rating) };
    }
    
    // Stock filter
    if (inStock === 'true') {
      query.stock = { $gt: 0 };
    }
    
    // Search
    if (search) {
      query.$text = { $search: search };
    }
    
    // Tags
    if (tags) {
      query.tags = { $in: Array.isArray(tags) ? tags : [tags] };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with pagination
    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category subcategory', 'name slug')
        .select('-__v')
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
        totalProducts: total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get single product by ID or slug
 */
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Try to find by ID first, then by slug
    let product = await Product.findById(id)
      .populate('category subcategory', 'name slug description')
      .populate('relatedProducts', 'name slug images basePrice salePrice ratings');
    
    if (!product) {
      product = await Product.findOne({ slug: id, status: 'active' })
        .populate('category subcategory', 'name slug description')
        .populate('relatedProducts', 'name slug images basePrice salePrice ratings');
    }
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    // Increment view count
    product.analytics.views += 1;
    await product.save();
    
    res.json({ success: true, data: product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get all categories with hierarchy
 */
exports.getCategories = async (req, res) => {
  try {
    const { level, parent, includeInactive } = req.query;
    
    const query = {};
    
    if (!includeInactive) {
      query.isActive = true;
    }
    
    if (level !== undefined) {
      query.level = parseInt(level);
    }
    
    if (parent) {
      query.parent = parent === 'null' ? null : parent;
    }
    
    const categories = await ProductCategory.find(query)
      .populate('parent', 'name slug')
      .sort('displayOrder name')
      .lean();
    
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get category tree structure
 */
exports.getCategoryTree = async (req, res) => {
  try {
    const rootCategories = await ProductCategory.find({ level: 0, isActive: true })
      .sort('displayOrder name')
      .lean();
    
    // Populate children recursively
    for (let category of rootCategories) {
      category.children = await ProductCategory.find({ parent: category._id, isActive: true })
        .sort('displayOrder name')
        .lean();
      
      for (let child of category.children) {
        child.children = await ProductCategory.find({ parent: child._id, isActive: true })
          .sort('displayOrder name')
          .lean();
      }
    }
    
    res.json({ success: true, data: rootCategories });
  } catch (error) {
    console.error('Get category tree error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get featured/bestseller products
 */
exports.getFeaturedProducts = async (req, res) => {
  try {
    const { type = 'featured', limit = 10 } = req.query;
    
    const query = { status: 'active' };
    
    if (type === 'featured') {
      query.isFeatured = true;
    } else if (type === 'bestseller') {
      query.isBestseller = true;
    } else if (type === 'new') {
      query.isNew = true;
    }
    
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .select('name slug images basePrice salePrice ratings discount')
      .sort('-createdAt')
      .limit(parseInt(limit))
      .lean();
    
    res.json({ success: true, data: products });
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Search products with autocomplete
 */
exports.searchProducts = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.json({ success: true, data: [] });
    }
    
    const products = await Product.find({
      status: 'active',
      $text: { $search: q }
    })
      .select('name slug images basePrice salePrice category')
      .populate('category', 'name')
      .limit(parseInt(limit))
      .lean();
    
    res.json({ success: true, data: products });
  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get product reviews
 */
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, rating, verified, sort = '-createdAt' } = req.query;
    
    const query = { 
      product: productId,
      status: 'approved'
    };
    
    if (rating) {
      query['rating.overall'] = parseInt(rating);
    }
    
    if (verified === 'true') {
      query.isVerifiedPurchase = true;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [reviews, total] = await Promise.all([
      ProductReview.find(query)
        .populate('user', 'name')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      ProductReview.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      data: reviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Get filters/facets for products
 */
exports.getProductFilters = async (req, res) => {
  try {
    const { category, petType } = req.query;
    
    const matchQuery = { status: 'active' };
    if (category) matchQuery.category = category;
    if (petType) matchQuery.petType = petType;
    
    const [
      brands,
      petTypes,
      ageGroups,
      priceRange
    ] = await Promise.all([
      Product.distinct('brand', matchQuery),
      Product.distinct('petType', matchQuery),
      Product.distinct('ageGroup', matchQuery),
      Product.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: null,
            minPrice: { $min: '$basePrice' },
            maxPrice: { $max: '$basePrice' }
          }
        }
      ])
    ]);
    
    res.json({
      success: true,
      filters: {
        brands: brands.filter(Boolean),
        petTypes: petTypes.filter(Boolean),
        ageGroups: ageGroups.filter(Boolean),
        priceRange: priceRange[0] || { minPrice: 0, maxPrice: 10000 }
      }
    });
  } catch (error) {
    console.error('Get filters error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

/**
 * Track product click (for analytics)
 */
exports.trackProductClick = async (req, res) => {
  try {
    const { productId } = req.params;
    
    await Product.findByIdAndUpdate(productId, {
      $inc: { 'analytics.clicks': 1 }
    });
    
    res.json({ success: true, message: 'Click tracked' });
  } catch (error) {
    console.error('Track click error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
