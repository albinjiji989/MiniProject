const Product = require('../models/Product');
const ProductCategory = require('../models/ProductCategory');

/**
 * User Product Controller - Flipkart-style shopping experience
 */

// Browse products with advanced filters
exports.browseProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 40,
      category,
      search,
      minPrice,
      maxPrice,
      petType,
      breed,
      brand,
      rating,
      sortBy = 'popularity', // popularity, price-low, price-high, newest, discount
      inStock = 'true',
      specifications
    } = req.query;
    
    const query = { status: 'active' };
    
    // Category filter (includes all descendants)
    if (category) {
      const cat = await ProductCategory.findById(category);
      if (cat) {
        const descendants = await cat.getAllDescendants();
        const categoryIds = [cat._id, ...descendants.map(d => d._id)];
        query.category = { $in: categoryIds };
      }
    }
    
    // Search
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [search.toLowerCase()] } },
        { 'attributes.brand': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Price range
    if (minPrice || maxPrice) {
      query.$expr = {
        $and: []
      };
      const priceField = {
        $ifNull: ['$pricing.salePrice', '$pricing.basePrice']
      };
      if (minPrice) {
        query.$expr.$and.push({ $gte: [priceField, parseFloat(minPrice)] });
      }
      if (maxPrice) {
        query.$expr.$and.push({ $lte: [priceField, parseFloat(maxPrice)] });
      }
    }
    
    // Pet filters
    if (petType) {
      query.petType = { $in: [petType, 'all'] };
    }
    if (breed) {
      query.breeds = breed;
    }
    
    // Brand filter
    if (brand) {
      query['attributes.brand'] = brand;
    }
    
    // Rating filter
    if (rating) {
      query['ratings.average'] = { $gte: parseFloat(rating) };
    }
    
    // Stock filter
    if (inStock === 'true') {
      query.$or = [
        { 'inventory.trackInventory': false },
        { 'inventory.allowBackorder': true },
        { $expr: { $gt: [{ $subtract: ['$inventory.stock', '$inventory.reserved'] }, 0] } }
      ];
    }
    
    // Specifications filter
    if (specifications) {
      try {
        const specs = JSON.parse(specifications);
        Object.entries(specs).forEach(([key, value]) => {
          query[`specifications.${key}`] = value;
        });
      } catch (e) {
        // Invalid JSON, skip
      }
    }
    
    // Sorting
    let sort = {};
    switch (sortBy) {
      case 'price-low':
        sort = { 'pricing.salePrice': 1, 'pricing.basePrice': 1 };
        break;
      case 'price-high':
        sort = { 'pricing.salePrice': -1, 'pricing.basePrice': -1 };
        break;
      case 'newest':
        sort = { createdAt: -1 };
        break;
      case 'discount':
        sort = { 'pricing.discount.value': -1 };
        break;
      case 'rating':
        sort = { 'ratings.average': -1, 'ratings.count': -1 };
        break;
      case 'popularity':
      default:
        sort = { 'analytics.purchases': -1, 'analytics.views': -1 };
        break;
    }
    
    const products = await Product.find(query)
      .select('name slug images pricing ratings inventory isFeatured isBestseller isNew attributes.brand petType')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
    
    const count = await Product.countDocuments(query);
    
    // Get available filters for current results
    const availableFilters = await getAvailableFilters(query);
    
    res.json({
      success: true,
      data: products,
      filters: availableFilters,
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
      message: 'Error browsing products',
      error: error.message
    });
  }
};

// Get single product details
exports.getProductDetails = async (req, res) => {
  try {
    const { slug } = req.params;
    
    const product = await Product.findOne({ slug, status: 'active' })
      .populate('category', 'name slug path')
      .populate('categoryPath', 'name slug')
      .populate('relatedProducts', 'name slug images pricing ratings')
      .populate('breeds', 'name')
      .populate('species', 'name');
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Increment view count
    product.analytics.views += 1;
    await product.save();
    
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching product details',
      error: error.message
    });
  }
};

// Get featured products
exports.getFeaturedProducts = async (req, res) => {
  try {
    const { limit = 12 } = req.query;
    
    const products = await Product.find({
      status: 'active',
      isFeatured: true
    })
      .select('name slug images pricing ratings isBestseller isNew attributes.brand')
      .sort({ 'analytics.purchases': -1 })
      .limit(parseInt(limit))
      .lean();
    
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching featured products',
      error: error.message
    });
  }
};

// Get deals/offers
exports.getDeals = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const now = new Date();
    const products = await Product.find({
      status: 'active',
      'pricing.salePrice': { $exists: true },
      $expr: { $lt: ['$pricing.salePrice', '$pricing.basePrice'] },
      $or: [
        { 'pricing.discount.startDate': { $lte: now } },
        { 'pricing.discount.startDate': { $exists: false } }
      ],
      $or: [
        { 'pricing.discount.endDate': { $gte: now } },
        { 'pricing.discount.endDate': { $exists: false } }
      ]
    })
      .select('name slug images pricing ratings attributes.brand')
      .sort({ 'pricing.discount.value': -1 })
      .limit(parseInt(limit))
      .lean();
    
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching deals',
      error: error.message
    });
  }
};

// Search suggestions
exports.getSearchSuggestions = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] });
    }
    
    const products = await Product.find({
      status: 'active',
      name: { $regex: q, $options: 'i' }
    })
      .select('name slug images pricing')
      .limit(10)
      .lean();
    
    const categories = await ProductCategory.find({
      isActive: true,
      name: { $regex: q, $options: 'i' }
    })
      .select('name slug')
      .limit(5)
      .lean();
    
    res.json({
      success: true,
      data: {
        products,
        categories
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching suggestions',
      error: error.message
    });
  }
};

// Helper function to get available filters
async function getAvailableFilters(baseQuery) {
  try {
    const [brands, priceRange, petTypes] = await Promise.all([
      Product.distinct('attributes.brand', baseQuery),
      Product.aggregate([
        { $match: baseQuery },
        {
          $group: {
            _id: null,
            minPrice: { $min: { $ifNull: ['$pricing.salePrice', '$pricing.basePrice'] } },
            maxPrice: { $max: { $ifNull: ['$pricing.salePrice', '$pricing.basePrice'] } }
          }
        }
      ]),
      Product.distinct('petType', baseQuery)
    ]);
    
    return {
      brands: brands.filter(Boolean),
      priceRange: priceRange[0] || { minPrice: 0, maxPrice: 0 },
      petTypes: petTypes.filter(pt => pt !== 'all')
    };
  } catch (error) {
    return {
      brands: [],
      priceRange: { minPrice: 0, maxPrice: 0 },
      petTypes: []
    };
  }
}

module.exports = exports;
