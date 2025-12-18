const Wishlist = require('../models/Wishlist');
const Review = require('../models/Review');
const PetInventoryItem = require('../../manager/models/PetInventoryItem');

// User Functions
const addToWishlist = async (req, res) => {
  try {
    const { itemId } = req.body;
    const userId = req.user._id;

    // Check if item exists
    const item = await PetInventoryItem.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    // Add to wishlist if not already added
    const existingWishlistItem = await Wishlist.findOne({ userId, itemId });
    if (!existingWishlistItem) {
      await Wishlist.create({ userId, itemId });
    }

    res.json({
      success: true,
      message: 'Item added to wishlist',
    });
  } catch (e) {
    console.error('Add to wishlist error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user._id;

    await Wishlist.findOneAndDelete({ userId, itemId });

    res.json({
      success: true,
      message: 'Item removed from wishlist',
    });
  } catch (e) {
    console.error('Remove from wishlist error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const listMyWishlist = async (req, res) => {
  try {
    const wishlistItems = await Wishlist.find({ userId: req.user._id })
      .populate({
        path: 'itemId',
        select: 'name price images storeName',
        populate: [
          { path: 'speciesId', select: 'name' },
          { path: 'breedId', select: 'name' },
          { path: 'imageIds' } // Populate imageIds
        ]
      })
      .sort({ createdAt: -1 });

    // Manually populate the virtual 'images' field for each wishlist item
    for (const wishlistItem of wishlistItems) {
      if (wishlistItem.itemId) {
        await wishlistItem.itemId.populate('images');
        // Debug log to see what's happening with images
        console.log(`Wishlist item ${wishlistItem._id}: imageIds=${wishlistItem.itemId.imageIds?.length || 0}, images=${wishlistItem.itemId.images?.length || 0}`);
      }
    }

    res.json({
      success: true,
      data: { wishlist: wishlistItems },
    });
  } catch (e) {
    console.error('List wishlist error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createReview = async (req, res) => {
  try {
    const { itemId, rating, comment, type = 'item' } = req.body;
    const userId = req.user._id;

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5',
      });
    }

    // Check if user has purchased the item
    // In a real implementation, you would check if the user has a completed order for this item
    // For now, we'll allow reviews for any item in the inventory
    const item = await PetInventoryItem.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found',
      });
    }

    const review = new Review({
      user: userId,
      item: itemId,
      rating,
      text: comment,
      // type is not a field in the Review model
    });

    await review.save();

    res.status(201).json({
      success: true,
      data: { review },
      message: 'Review created successfully',
    });
  } catch (e) {
    console.error('Create review error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const listItemReviews = async (req, res) => {
  try {
    const { itemId, page = 1, limit = 10 } = req.query;

    const reviews = await Review.find({
      item: itemId,
    })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments({
      item: itemId,
    });

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      },
    });
  } catch (e) {
    console.error('List item reviews error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get purchased pets for the user
const getUserPurchasedPets = async (req, res) => {
  try {
    // Import required models
    const PetReservation = require('../models/PetReservation');
    const Pet = require('../../../../core/models/Pet');
    const PetRegistry = require('../../../../core/models/PetRegistry');
    
    console.log('Fetching purchased pets for user:', req.user._id);
    
    // Get completed reservations (purchased pets) for the current user only
    // Updated to include more statuses that indicate a completed purchase
    const reservations = await PetReservation.find({
      userId: req.user._id,
      status: { $in: ['completed', 'at_owner', 'paid', 'delivered'] }
    })
    .populate({
      path: 'itemId',
      select: 'name petCode price images speciesId breedId storeId storeName gender age ageUnit color weight status',
    })
    .populate('petId')
    .sort({ createdAt: -1 });
    
    console.log('Found reservations:', reservations.length);
    
    // Manually populate images for inventory items if needed
    for (const reservation of reservations) {
      if (reservation.itemId && (!reservation.itemId.images || reservation.itemId.images.length === 0)) {
        try {
          const PetInventoryItem = require('../../manager/models/PetInventoryItem');
          const populatedItem = await PetInventoryItem.findById(reservation.itemId._id)
            .populate('imageIds');
          if (populatedItem) {
            await populatedItem.populate('images');
            reservation.itemId.images = populatedItem.images || [];
          }
        } catch (err) {
          console.warn('Failed to populate images for inventory item:', err.message);
        }
      }
    }
    
    // Get pets directly from PetRegistry that belong to this user only
    // Include pets that are paid for but not yet transferred (in case registry update failed)
    const registryPets = await PetRegistry.find({
      $and: [
        {
          $or: [
            {
              currentOwnerId: req.user._id,
              currentLocation: 'at_owner'
            },
            {
              petCode: { $in: reservations.filter(r => r.itemId).map(r => r.itemId.petCode) }
            }
          ]
        },
        {
          currentOwnerId: req.user._id
        }
      ]
    });

    console.log('Found registry pets:', registryPets.length);

    // Manually populate images for registry pets
    for (const registryPet of registryPets) {
      if (!registryPet.images || registryPet.images.length === 0) {
        try {
          await registryPet.populate('imageIds');
          await registryPet.populate('images');
        } catch (err) {
          console.warn('Failed to populate images for registry pet:', err.message);
        }
      }
    }
    
    // Combine both sources and deduplicate
    const allPetsMap = new Map();
    
    // Add pets from reservations
    for (const r of reservations.filter(r => r.itemId)) {
      console.log('Processing reservation:', r._id, 'with item:', r.itemId?.petCode, 'status:', r.status);
      
      // Try to get the actual pet from the Pet model first
      let actualPet = null;
      if (r.petId) {
        try {
          actualPet = await Pet.findById(r.petId);
          if (actualPet) {
            await actualPet.populate('imageIds');
            await actualPet.populate('images');
          }
        } catch (error) {
          console.warn(`Failed to load pet with ID ${r.petId}:`, error.message);
        }
      }
      
      // If not found, try to get from PetNew
      let newPet = null;
      if (!actualPet && r.itemId.petCode) {
        try {
          newPet = await PetNew.findOne({ petCode: r.itemId.petCode });
          if (newPet) {
            await newPet.populate('imageIds');
            await newPet.populate('images');
          }
        } catch (error) {
          console.warn(`Failed to load new pet with petCode ${r.itemId.petCode}:`, error.message);
        }
      }
      
      // If not found, try to get from PetRegistry
      let registryEntry = null;
      if (!actualPet && !newPet && r.itemId.petCode) {
        try {
          registryEntry = registryPets.find(p => p.petCode === r.itemId.petCode);
          if (!registryEntry) {
            registryEntry = await PetRegistry.findOne({ 
              petCode: r.itemId.petCode,
              currentOwnerId: req.user._id
            });
            if (registryEntry) {
              await registryEntry.populate('imageIds');
              await registryEntry.populate('images');
            }
          }
          
          // Try to get the actual pet from the main Pet collection
          if (registryEntry && registryEntry.corePetId) {
            actualPet = await Pet.findById(registryEntry.corePetId);
            if (actualPet) {
              await actualPet.populate('imageIds');
              await actualPet.populate('images');
            }
          }
        } catch (error) {
          console.warn(`Failed to load registry entry for petCode ${r.itemId.petCode}:`, error.message);
        }
      }
      
      // Get images from the best available source
      let images = [];
      if (actualPet && actualPet.images && actualPet.images.length > 0) {
        images = actualPet.images;
      } else if (newPet && newPet.images && newPet.images.length > 0) {
        images = newPet.images;
      } else if (registryEntry && registryEntry.images && registryEntry.images.length > 0) {
        images = registryEntry.images;
      } else if (r.itemId && r.itemId.images && r.itemId.images.length > 0) {
        images = r.itemId.images;
      }
      
      // Use the best available ID for the _id field
      let petId = r.itemId._id; // Default to inventory item ID
      if (actualPet) {
        petId = actualPet._id;
      } else if (newPet) {
        petId = newPet._id;
      } else if (registryEntry) {
        petId = registryEntry._id;
      }
      
      const petData = {
        _id: petId,
        petCode: r.itemId.petCode,
        name: r.itemId.name || 'Pet', // Use default name if empty
        images: images || [],
        species: r.itemId.speciesId ? {
          _id: r.itemId.speciesId._id,
          name: r.itemId.speciesId.name,
          displayName: r.itemId.speciesId.displayName
        } : null,
        breed: r.itemId.breedId ? {
          _id: r.itemId.breedId._id,
          name: r.itemId.breedId.name
        } : null,
        gender: r.itemId.gender || 'Unknown', // Use default gender if empty
        age: r.itemId.age,
        ageUnit: r.itemId.ageUnit,
        color: r.itemId.color || 'Unknown', // Use default color if empty
        weight: r.itemId.weight || { value: 0, unit: 'kg' },
        currentStatus: r.itemId.status || 'purchased', // Use actual inventory item status
        source: 'petshop',
        sourceLabel: 'Purchased from Pet Shop',
        acquiredDate: r.updatedAt
      };
      
      console.log('Adding pet to map:', petData.petCode, 'with status:', petData.currentStatus);
      
      // Add to map to avoid duplicates
      allPetsMap.set(r.itemId.petCode || r.itemId._id.toString(), petData);
    }
    
    // Add pets directly from registry that aren't in reservations
    for (const registryPet of registryPets) {
      // Skip if already added from reservations
      if (allPetsMap.has(registryPet.petCode)) continue;
      
      console.log('Adding registry pet:', registryPet.petCode, 'with status:', registryPet.currentStatus);
      
      const petData = {
        _id: registryPet._id,
        petCode: registryPet.petCode,
        name: registryPet.name || 'Pet', // Use default name if empty
        images: registryPet.images || [],
        species: registryPet.speciesId ? {
          _id: registryPet.speciesId._id,
          name: registryPet.speciesId.name,
          displayName: registryPet.speciesId.displayName
        } : null,
        breed: registryPet.breedId ? {
          _id: registryPet.breedId._id,
          name: registryPet.breedId.name
        } : null,
        gender: registryPet.gender || 'Unknown', // Use default gender if empty
        age: registryPet.age,
        ageUnit: registryPet.ageUnit,
        color: registryPet.color || 'Unknown', // Use default color if empty
        weight: registryPet.weight || { value: 0, unit: 'kg' },
        currentStatus: registryPet.currentStatus || 'purchased', // Use actual registry status
        source: 'petshop',
        sourceLabel: 'Purchased from Pet Shop',
        acquiredDate: registryPet.lastTransferAt
      };
      
      allPetsMap.set(registryPet.petCode, petData);
    }
    
    // Convert map to array
    const purchasedPets = Array.from(allPetsMap.values());
    
    console.log('Returning purchased pets:', purchasedPets.length);
    
    res.json({ success: true, data: { pets: purchasedPets } });
  } catch (e) {
    console.error('Get purchased pets error:', e);
    res.status(500).json({ success: false, message: 'Failed to load purchased pets. Please try again later.' });
  }
};

const listShopReviews = async (req, res) => {
  try {
    const { shopId, page = 1, limit = 10 } = req.query;

    const reviews = await Review.find({
      petShop: shopId,
    })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments({
      petShop: shopId,
    });

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
        },
      },
    });
  } catch (e) {
    console.error('List shop reviews error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  addToWishlist,
  removeFromWishlist,
  listMyWishlist,
  createReview,
  listItemReviews,
  listShopReviews,
  getUserPurchasedPets
};