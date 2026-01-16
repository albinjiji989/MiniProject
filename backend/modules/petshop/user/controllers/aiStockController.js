/**
 * AI Stock Availability Controller
 * Check stock availability based on AI-identified breed and species
 */

const PetBatch = require('../../manager/models/PetBatch');
const Species = require('../../../../core/models/Species');
const Breed = require('../../../../core/models/Breed');

/**
 * Check if a specific breed is available in stock
 * Used after AI breed identification
 */
const checkBreedAvailability = async (req, res) => {
  try {
    const { species, breed } = req.query;

    console.log('🔍 AI Stock Check Request:', { species, breed });

    if (!species || !breed) {
      return res.status(400).json({
        success: false,
        message: 'Species and breed are required'
      });
    }

    // First, let's see what species are actually in the database
    const allSpecies = await Species.find({});
    console.log('📋 All species in database:', allSpecies.map(s => ({ id: s._id, name: s.name, displayName: s.displayName })));

    // Find species ID with VERY flexible matching
    let speciesDoc = null;

    // Strategy 1: Exact match
    speciesDoc = await Species.findOne({
      $or: [
        { name: new RegExp(`^${species}$`, 'i') },
        { displayName: new RegExp(`^${species}$`, 'i') }
      ]
    });

    // Strategy 2: Contains match
    if (!speciesDoc) {
      speciesDoc = await Species.findOne({
        $or: [
          { name: new RegExp(species, 'i') },
          { displayName: new RegExp(species, 'i') }
        ]
      });
    }

    // Strategy 3: Common name mappings
    if (!speciesDoc) {
      const speciesMap = {
        'dog': ['canine', 'canis', 'dogs'],
        'cat': ['feline', 'felis', 'cats'],
        'bird': ['avian', 'aves', 'birds'],
        'rabbit': ['bunny', 'rabbits'],
        'fish': ['aquatic', 'fishes']
      };

      const searchTerms = speciesMap[species.toLowerCase()] || [];
      for (const term of searchTerms) {
        speciesDoc = await Species.findOne({
          $or: [
            { name: new RegExp(term, 'i') },
            { displayName: new RegExp(term, 'i') }
          ]
        });
        if (speciesDoc) {
          console.log(`✅ Found species using mapping: ${term} -> ${speciesDoc.name}`);
          break;
        }
      }
    }

    console.log('📊 Species found:', speciesDoc ? { id: speciesDoc._id, name: speciesDoc.name, displayName: speciesDoc.displayName } : '❌ NOT FOUND');

    if (!speciesDoc) {
      return res.json({
        success: true,
        data: {
          available: false,
          totalStock: 0,
          batches: [],
          message: `Species "${species}" not found. Available species: ${allSpecies.map(s => s.displayName || s.name).join(', ')}`
        }
      });
    }

    // Find breed ID (flexible matching with multiple strategies)
    let breedDoc = null;

    // Get all breeds for this species for debugging
    const allBreedsForSpecies = await Breed.find({ speciesId: speciesDoc._id });
    console.log('📋 All breeds in database for', speciesDoc.name + ':', allBreedsForSpecies.map(b => b.name).join(', '));
    console.log('🔍 Searching for breed:', breed);

    // Strategy 1: Exact match (case-insensitive)
    breedDoc = await Breed.findOne({
      speciesId: speciesDoc._id,
      name: new RegExp(`^${breed}$`, 'i')
    });
    if (breedDoc) console.log('✅ Strategy 1 (Exact): Found -', breedDoc.name);

    // Strategy 2: Contains match (if exact fails)
    if (!breedDoc) {
      breedDoc = await Breed.findOne({
        speciesId: speciesDoc._id,
        name: new RegExp(breed, 'i')
      });
      if (breedDoc) console.log('✅ Strategy 2 (Contains): Found -', breedDoc.name);
    }

    // Strategy 3: Partial word match (e.g., "German Shepherd" matches "German")
    if (!breedDoc) {
      const breedWords = breed.split(' ');
      for (const word of breedWords) {
        if (word.length > 3) { // Only match words longer than 3 characters
          breedDoc = await Breed.findOne({
            speciesId: speciesDoc._id,
            name: new RegExp(word, 'i')
          });
          if (breedDoc) {
            console.log(`✅ Strategy 3 (Partial word "${word}"): Found -`, breedDoc.name);
            break;
          }
        }
      }
    }

    // Strategy 4: Reverse match (database name contains AI breed name)
    if (!breedDoc) {
      const allBreeds = await Breed.find({ speciesId: speciesDoc._id });
      breedDoc = allBreeds.find(b => {
        const dbName = b.name.toLowerCase();
        const aiName = breed.toLowerCase();
        return dbName.includes(aiName) || aiName.includes(dbName);
      });
      if (breedDoc) console.log('✅ Strategy 4 (Reverse): Found -', breedDoc.name);
    }

    console.log('🐕 Breed found:', breedDoc ? { id: breedDoc._id, name: breedDoc.name } : '❌ NOT FOUND');

    if (!breedDoc) {
      // Try to find similar breeds for suggestions
      const similarBreeds = await Breed.find({
        speciesId: speciesDoc._id
      }).limit(5);

      if (similarBreeds.length > 0) {
        return res.json({
          success: true,
          data: {
            available: false,
            totalStock: 0,
            batches: [],
            message: `Exact breed "${breed}" not found. Available breeds: ${similarBreeds.map(b => b.name).join(', ')}`,
            suggestions: similarBreeds.map(b => ({
              id: b._id,
              name: b.name
            })),
            searchedBreed: breed,
            searchedSpecies: species
          }
        });
      }

      return res.json({
        success: true,
        data: {
          available: false,
          totalStock: 0,
          batches: [],
          message: `Breed "${breed}" not available in our petshop. Please add this breed to inventory first.`,
          searchedBreed: breed,
          searchedSpecies: species
        }
      });
    }

    // Find available batches
    const batches = await PetBatch.find({
      speciesId: speciesDoc._id,
      breedId: breedDoc._id,
      status: 'published',
      'availability.available': { $gt: 0 }
    })
      .populate('speciesId', 'name displayName')
      .populate('breedId', 'name')
      .sort({ createdAt: -1 });

    console.log('📦 Batches found:', batches.length);
    console.log('📦 Batch details:', batches.map(b => ({
      id: b._id,
      available: b.availability?.available,
      status: b.status
    })));

    // Calculate total available stock
    const totalStock = batches.reduce((sum, batch) => {
      return sum + (batch.availability?.available || 0);
    }, 0);

    console.log('✅ Total stock:', totalStock);

    if (totalStock === 0) {
      return res.json({
        success: true,
        data: {
          available: false,
          totalStock: 0,
          batches: [],
          message: `${breed} is currently out of stock. Please check back later.`
        }
      });
    }

    // Format batch information
    const batchInfo = batches.map(batch => ({
      id: batch._id,
      species: batch.speciesId,
      breed: batch.breedId,
      ageRange: batch.ageRange,
      price: batch.price,
      availability: batch.availability,
      images: batch.images,
      description: batch.description
    }));

    res.json({
      success: true,
      data: {
        available: true,
        totalStock,
        batches: batchInfo,
        message: `Great news! We have ${totalStock} ${breed}(s) available in stock.`,
        species: {
          id: speciesDoc._id,
          name: speciesDoc.name,
          displayName: speciesDoc.displayName
        },
        breed: {
          id: breedDoc._id,
          name: breedDoc.name
        }
      }
    });

  } catch (error) {
    console.error('Error checking breed availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check stock availability',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get detailed stock information for a specific breed
 * Includes pricing, age ranges, and images
 */
const getBreedStockDetails = async (req, res) => {
  try {
    const { breedId, speciesId } = req.params;

    const batches = await PetBatch.find({
      speciesId,
      breedId,
      status: 'published',
      'availability.available': { $gt: 0 }
    })
      .populate('speciesId', 'name displayName')
      .populate('breedId', 'name')
      .populate('images')
      .sort({ 'price.min': 1 });

    if (batches.length === 0) {
      return res.json({
        success: true,
        data: {
          available: false,
          batches: [],
          message: 'No stock available for this breed'
        }
      });
    }

    // Calculate statistics
    const stats = {
      totalAvailable: batches.reduce((sum, b) => sum + b.availability.available, 0),
      priceRange: {
        min: Math.min(...batches.map(b => b.price.min)),
        max: Math.max(...batches.map(b => b.price.max))
      },
      ageRange: {
        min: Math.min(...batches.map(b => b.ageRange.min)),
        max: Math.max(...batches.map(b => b.ageRange.max)),
        unit: batches[0].ageRange.unit
      }
    };

    res.json({
      success: true,
      data: {
        available: true,
        batches,
        stats,
        message: `${stats.totalAvailable} pets available`
      }
    });

  } catch (error) {
    console.error('Error getting breed stock details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stock details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Search for breeds by AI-identified name (fuzzy matching)
 * Helps when AI returns slightly different breed names
 */
const searchBreedsByName = async (req, res) => {
  try {
    const { query, speciesId } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Build search criteria
    const searchCriteria = {
      name: new RegExp(query, 'i')
    };

    if (speciesId) {
      searchCriteria.speciesId = speciesId;
    }

    // Find matching breeds
    const breeds = await Breed.find(searchCriteria)
      .populate('speciesId', 'name displayName')
      .limit(10);

    // For each breed, check stock availability
    const breedsWithStock = await Promise.all(
      breeds.map(async (breed) => {
        const stockCount = await PetBatch.countDocuments({
          breedId: breed._id,
          status: 'published',
          'availability.available': { $gt: 0 }
        });

        const totalAvailable = await PetBatch.aggregate([
          {
            $match: {
              breedId: breed._id,
              status: 'published',
              'availability.available': { $gt: 0 }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$availability.available' }
            }
          }
        ]);

        return {
          id: breed._id,
          name: breed.name,
          species: breed.speciesId,
          inStock: stockCount > 0,
          availableCount: totalAvailable[0]?.total || 0
        };
      })
    );

    res.json({
      success: true,
      data: {
        breeds: breedsWithStock,
        total: breedsWithStock.length
      }
    });

  } catch (error) {
    console.error('Error searching breeds:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search breeds',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Debug endpoint - List all breeds in database
 * Helps identify what breeds are available
 */
const listAllBreeds = async (req, res) => {
  try {
    const { speciesName } = req.query;

    let query = {};

    if (speciesName) {
      const speciesDoc = await Species.findOne({
        $or: [
          { name: new RegExp(speciesName, 'i') },
          { displayName: new RegExp(speciesName, 'i') }
        ]
      });

      if (speciesDoc) {
        query.speciesId = speciesDoc._id;
      }
    }

    const breeds = await Breed.find(query)
      .populate('speciesId', 'name displayName')
      .sort({ name: 1 });

    // Group by species
    const groupedBreeds = {};
    breeds.forEach(breed => {
      const speciesName = breed.speciesId?.displayName || breed.speciesId?.name || 'Unknown';
      if (!groupedBreeds[speciesName]) {
        groupedBreeds[speciesName] = [];
      }
      groupedBreeds[speciesName].push({
        id: breed._id,
        name: breed.name
      });
    });

    res.json({
      success: true,
      data: {
        total: breeds.length,
        bySpecies: groupedBreeds,
        allBreeds: breeds.map(b => ({
          id: b._id,
          name: b.name,
          species: b.speciesId?.displayName || b.speciesId?.name
        }))
      }
    });

  } catch (error) {
    console.error('Error listing breeds:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list breeds',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Debug endpoint - Show all batches with breed names
 * Helps see what's actually in stock
 */
const debugBatches = async (req, res) => {
  try {
    const batches = await PetBatch.find({ status: 'published' })
      .populate('speciesId', 'name displayName')
      .populate('breedId', 'name')
      .select('speciesId breedId availability status')
      .limit(50);

    const formatted = batches.map(b => ({
      batchId: b._id,
      species: b.speciesId?.displayName || b.speciesId?.name,
      breed: b.breedId?.name,
      available: b.availability?.available || 0,
      status: b.status
    }));

    console.log('📦 DEBUG: Found', batches.length, 'published batches');
    console.log('📦 DEBUG: Batches:', formatted);

    res.json({
      success: true,
      data: {
        total: batches.length,
        batches: formatted
      }
    });

  } catch (error) {
    console.error('Error listing batches:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list batches',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  checkBreedAvailability,
  getBreedStockDetails,
  searchBreedsByName,
  listAllBreeds,
  debugBatches
};
