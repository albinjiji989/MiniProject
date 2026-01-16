/**
 * AI-Powered Pet Identification & Product Recommendation Controller
 * Industry-level integration: Petshop → Inventory → Ecommerce
 */

const PetBatch = require('../../manager/models/PetBatch');
const Species = require('../../../../core/models/Species');
const Breed = require('../../../../core/models/Breed');
const Product = require('../../../ecommerce/models/Product');

/**
 * Complete AI workflow:
 * 1. Identify pet breed using AI
 * 2. Check if pet is available in petshop inventory
 * 3. Find related products in ecommerce for that breed
 * 4. Return comprehensive recommendation data
 */
const getAIRecommendations = async (req, res) => {
  try {
    const { species, breed } = req.query;

    console.log('🤖 AI Recommendation Request:', { species, breed });

    if (!species || !breed) {
      return res.status(400).json({
        success: false,
        message: 'Species and breed are required'
      });
    }

    // Step 1: Find species and breed in database
    const { speciesDoc, breedDoc } = await findSpeciesAndBreed(species, breed);

    if (!speciesDoc) {
      return res.json({
        success: true,
        data: {
          petAvailable: false,
          productsAvailable: false,
          message: `Species "${species}" not found in our system`
        }
      });
    }

    // Step 2: Check petshop inventory
    const inventoryData = await checkPetshopInventory(speciesDoc, breedDoc);

    // Step 3: Find related products in ecommerce
    const productData = await findRelatedProducts(speciesDoc, breedDoc);

    // Step 4: Build comprehensive response
    const response = {
      success: true,
      data: {
        // Pet Information
        identifiedPet: {
          species: {
            id: speciesDoc._id,
            name: speciesDoc.name,
            displayName: speciesDoc.displayName
          },
          breed: breedDoc ? {
            id: breedDoc._id,
            name: breedDoc.name
          } : null
        },

        // Petshop Inventory Status
        petshopInventory: {
          available: inventoryData.available,
          totalStock: inventoryData.totalStock,
          batches: inventoryData.batches,
          message: inventoryData.message
        },

        // Ecommerce Products
        ecommerceProducts: {
          available: productData.available,
          totalProducts: productData.totalProducts,
          categories: productData.categories,
          featuredProducts: productData.featuredProducts,
          message: productData.message
        },

        // Smart Recommendations
        recommendations: {
          viewPetshop: inventoryData.available,
          viewProducts: productData.available,
          suggestedCategories: productData.suggestedCategories,
          navigationUrl: productData.navigationUrl
        }
      }
    };

    console.log('✅ AI Recommendations generated successfully');
    res.json(response);

  } catch (error) {
    console.error('❌ Error generating AI recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate recommendations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Find species and breed with flexible matching
 */
async function findSpeciesAndBreed(speciesName, breedName) {
  // Find species with flexible matching
  let speciesDoc = await Species.findOne({
    $or: [
      { name: new RegExp(`^${speciesName}$`, 'i') },
      { displayName: new RegExp(`^${speciesName}$`, 'i') }
    ]
  });

  // Fallback: partial match
  if (!speciesDoc) {
    speciesDoc = await Species.findOne({
      $or: [
        { name: new RegExp(speciesName, 'i') },
        { displayName: new RegExp(speciesName, 'i') }
      ]
    });
  }

  if (!speciesDoc) {
    return { speciesDoc: null, breedDoc: null };
  }

  // Find breed with flexible matching
  let breedDoc = await Breed.findOne({
    speciesId: speciesDoc._id,
    name: new RegExp(`^${breedName}$`, 'i')
  });

  // Fallback: partial match
  if (!breedDoc) {
    breedDoc = await Breed.findOne({
      speciesId: speciesDoc._id,
      name: new RegExp(breedName, 'i')
    });
  }

  return { speciesDoc, breedDoc };
}

/**
 * Check petshop inventory for the identified pet
 */
async function checkPetshopInventory(speciesDoc, breedDoc) {
  if (!breedDoc) {
    return {
      available: false,
      totalStock: 0,
      batches: [],
      message: 'Breed not found in petshop inventory'
    };
  }

  const batches = await PetBatch.find({
    speciesId: speciesDoc._id,
    breedId: breedDoc._id,
    status: 'published',
    'availability.available': { $gt: 0 }
  })
    .populate('speciesId', 'name displayName')
    .populate('breedId', 'name')
    .select('ageRange price availability images description')
    .sort({ createdAt: -1 })
    .limit(5);

  const totalStock = batches.reduce((sum, batch) => {
    return sum + (batch.availability?.available || 0);
  }, 0);

  return {
    available: totalStock > 0,
    totalStock,
    batches: batches.map(batch => ({
      id: batch._id,
      ageRange: batch.ageRange,
      price: batch.price,
      availability: batch.availability,
      images: batch.images,
      description: batch.description
    })),
    message: totalStock > 0 
      ? `${totalStock} ${breedDoc.name}(s) available in petshop`
      : `${breedDoc.name} is currently out of stock`
  };
}

/**
 * Find related products in ecommerce for the identified pet
 */
async function findRelatedProducts(speciesDoc, breedDoc) {
  const speciesName = speciesDoc.displayName || speciesDoc.name;
  const petType = speciesName.toLowerCase();

  // Build query for products
  const productQuery = {
    status: 'active',
    $or: [
      { petType: petType },
      { petType: 'all' }
    ]
  };

  // If breed is identified, prioritize breed-specific products
  if (breedDoc) {
    productQuery.$or.push({ breeds: breedDoc._id });
  }

  // Add species filter
  if (speciesDoc) {
    productQuery.$or.push({ species: speciesDoc._id });
  }

  // Find products
  const products = await Product.find(productQuery)
    .populate('category', 'name slug path')
    .select('name slug pricing images category petType ratings isFeatured')
    .sort({ isFeatured: -1, 'ratings.average': -1 })
    .limit(20);

  // Get unique categories
  const categoryMap = new Map();
  products.forEach(product => {
    if (product.category) {
      categoryMap.set(
        product.category._id.toString(),
        {
          id: product.category._id,
          name: product.category.name,
          slug: product.category.slug,
          path: product.category.path,
          productCount: (categoryMap.get(product.category._id.toString())?.productCount || 0) + 1
        }
      );
    }
  });

  const categories = Array.from(categoryMap.values())
    .sort((a, b) => b.productCount - a.productCount);

  // Get featured products (top 6)
  const featuredProducts = products.slice(0, 6).map(product => ({
    id: product._id,
    name: product.name,
    slug: product.slug,
    price: product.pricing.salePrice || product.pricing.basePrice,
    originalPrice: product.pricing.basePrice,
    image: product.images?.[0]?.url,
    rating: product.ratings.average,
    category: product.category?.name,
    isFeatured: product.isFeatured
  }));

  // Build navigation URL
  const navigationUrl = `/User/ecommerce?petType=${petType}${breedDoc ? `&breed=${breedDoc._id}` : ''}`;

  // Suggest top categories
  const suggestedCategories = categories.slice(0, 5).map(cat => ({
    name: cat.name,
    url: `/User/ecommerce?category=${cat.slug}&petType=${petType}`,
    productCount: cat.productCount
  }));

  return {
    available: products.length > 0,
    totalProducts: products.length,
    categories,
    featuredProducts,
    suggestedCategories,
    navigationUrl,
    message: products.length > 0
      ? `Found ${products.length} products for ${speciesName}${breedDoc ? ` (${breedDoc.name})` : ''}`
      : `No products found for ${speciesName}`
  };
}

/**
 * Get product recommendations by breed ID
 * Used when user selects a specific breed
 */
const getProductsByBreed = async (req, res) => {
  try {
    const { breedId } = req.params;
    const { limit = 20, category, minPrice, maxPrice, sort = 'featured' } = req.query;

    const breed = await Breed.findById(breedId).populate('speciesId');
    if (!breed) {
      return res.status(404).json({
        success: false,
        message: 'Breed not found'
      });
    }

    // Build query
    const query = {
      status: 'active',
      $or: [
        { breeds: breedId },
        { species: breed.speciesId._id },
        { petType: breed.speciesId.name.toLowerCase() },
        { petType: 'all' }
      ]
    };

    // Add filters
    if (category) {
      query.category = category;
    }

    if (minPrice || maxPrice) {
      query['pricing.salePrice'] = {};
      if (minPrice) query['pricing.salePrice'].$gte = parseFloat(minPrice);
      if (maxPrice) query['pricing.salePrice'].$lte = parseFloat(maxPrice);
    }

    // Build sort
    let sortOption = {};
    switch (sort) {
      case 'price-low':
        sortOption = { 'pricing.salePrice': 1 };
        break;
      case 'price-high':
        sortOption = { 'pricing.salePrice': -1 };
        break;
      case 'rating':
        sortOption = { 'ratings.average': -1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      default:
        sortOption = { isFeatured: -1, 'ratings.average': -1 };
    }

    const products = await Product.find(query)
      .populate('category', 'name slug')
      .select('name slug pricing images category ratings isFeatured')
      .sort(sortOption)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        breed: {
          id: breed._id,
          name: breed.name,
          species: breed.speciesId.displayName || breed.speciesId.name
        },
        products: products.map(p => ({
          id: p._id,
          name: p.name,
          slug: p.slug,
          price: p.pricing.salePrice || p.pricing.basePrice,
          originalPrice: p.pricing.basePrice,
          discount: p.discountPercentage,
          image: p.images?.[0]?.url,
          rating: p.ratings.average,
          reviewCount: p.ratings.count,
          category: p.category?.name,
          isFeatured: p.isFeatured
        })),
        total: products.length
      }
    });

  } catch (error) {
    console.error('Error getting products by breed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get product recommendations by species
 */
const getProductsBySpecies = async (req, res) => {
  try {
    const { speciesId } = req.params;
    const { limit = 20, category, featured = false } = req.query;

    const species = await Species.findById(speciesId);
    if (!species) {
      return res.status(404).json({
        success: false,
        message: 'Species not found'
      });
    }

    const petType = (species.displayName || species.name).toLowerCase();

    const query = {
      status: 'active',
      $or: [
        { species: speciesId },
        { petType: petType },
        { petType: 'all' }
      ]
    };

    if (category) {
      query.category = category;
    }

    if (featured === 'true') {
      query.isFeatured = true;
    }

    const products = await Product.find(query)
      .populate('category', 'name slug')
      .select('name slug pricing images category ratings isFeatured')
      .sort({ isFeatured: -1, 'ratings.average': -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        species: {
          id: species._id,
          name: species.name,
          displayName: species.displayName
        },
        products: products.map(p => ({
          id: p._id,
          name: p.name,
          slug: p.slug,
          price: p.pricing.salePrice || p.pricing.basePrice,
          originalPrice: p.pricing.basePrice,
          image: p.images?.[0]?.url,
          rating: p.ratings.average,
          category: p.category?.name
        })),
        total: products.length
      }
    });

  } catch (error) {
    console.error('Error getting products by species:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getAIRecommendations,
  getProductsByBreed,
  getProductsBySpecies
};
