const PetRegistry = require('../models/PetRegistry');
const mongoose = require('mongoose');

/**
 * Get all pets owned by the current user from all sources (unified endpoint)
 * This replaces the need for 4 separate API calls on the frontend
 */
const getAllUserPets = async (req, res) => {
  try {
    const userId = req.user._id;

    // Use PetRegistry as single source of truth - it's already deduplicated by petCode
    const pets = await PetRegistry.aggregate([
      // Match all pets owned by this user
      { $match: { 
        currentOwnerId: mongoose.Types.ObjectId(userId),
        // Optionally filter out deleted pets if you have a soft delete flag
        isDeleted: { $ne: true }
      }},
      
      // Lookup species information
      { $lookup: {
        from: 'species',
        localField: 'speciesId',
        foreignField: '_id',
        as: 'speciesInfo'
      }},
      
      // Lookup breed information
      { $lookup: {
        from: 'breeds',
        localField: 'breedId',
        foreignField: '_id',
        as: 'breedInfo'
      }},
      
      // Lookup images from the images collection
      { $lookup: {
        from: 'images',
        localField: 'imageIds',
        foreignField: '_id',
        as: 'images'
      }},
      
      // Unwind species (should be one)
      { $unwind: {
        path: '$speciesInfo',
        preserveNullAndEmptyArrays: true
      }},
      
      // Unwind breed (should be one)
      { $unwind: {
        path: '$breedInfo',
        preserveNullAndEmptyArrays: true
      }},
      
      // Project final structure
      { $project: {
        _id: 1,
        petCode: 1,
        name: 1,
        gender: 1,
        age: 1,
        ageUnit: 1,
        color: 1,
        dateOfBirth: 1,
        source: 1,
        firstAddedSource: 1,
        currentStatus: 1,
        currentLocation: 1,
        
        // Add source label for display
        sourceLabel: {
          $switch: {
            branches: [
              { case: { $eq: ['$source', 'adoption'] }, then: 'Adopted Pet' },
              { case: { $eq: ['$firstAddedSource', 'adoption_center'] }, then: 'Adopted Pet' },
              { case: { $eq: ['$source', 'petshop'] }, then: 'Purchased Pet' },
              { case: { $eq: ['$firstAddedSource', 'pet_shop'] }, then: 'Purchased Pet' },
              { case: { $eq: ['$source', 'user'] }, then: 'My Pet' },
              { case: { $eq: ['$firstAddedSource', 'user_created'] }, then: 'My Pet' }
            ],
            default: 'Owned Pet'
          }
        },
        
        // Species information
        speciesId: '$speciesInfo._id',
        species: {
          _id: '$speciesInfo._id',
          name: '$speciesInfo.name',
          displayName: '$speciesInfo.displayName'
        },
        
        // Breed information
        breedId: '$breedInfo._id',
        breed: {
          _id: '$breedInfo._id',
          name: '$breedInfo.name'
        },
        
        // Images
        images: {
          $map: {
            input: '$images',
            as: 'img',
            in: {
              _id: '$$img._id',
              url: '$$img.url',
              isPrimary: '$$img.isPrimary',
              filename: '$$img.filename'
            }
          }
        },
        
        // Source references for compatibility
        sourceReferences: 1,
        
        // Timestamps
        createdAt: 1,
        updatedAt: 1
      }},
      
      // Sort by most recently updated first
      { $sort: { updatedAt: -1 } }
    ]);

    // Transform images to full URLs if needed
    const petsWithResolvedImages = pets.map(pet => {
      if (pet.images && pet.images.length > 0) {
        pet.images = pet.images.map(img => ({
          ...img,
          url: img.url && !img.url.startsWith('http') 
            ? `${process.env.BASE_URL || 'http://localhost:5000'}${img.url}` 
            : img.url
        }));
      }
      return pet;
    });

    res.json({ 
      success: true, 
      data: { 
        pets: petsWithResolvedImages,
        total: petsWithResolvedImages.length
      } 
    });

  } catch (error) {
    console.error('Error fetching all user pets:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch your pets',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get pet statistics for the current user
 */
const getUserPetStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = await PetRegistry.aggregate([
      { $match: { 
        currentOwnerId: mongoose.Types.ObjectId(userId),
        isDeleted: { $ne: true }
      }},
      
      { $facet: {
        // Total count
        total: [
          { $count: 'count' }
        ],
        
        // Count by source
        bySource: [
          { $group: {
            _id: '$source',
            count: { $sum: 1 }
          }}
        ],
        
        // Count by species
        bySpecies: [
          { $group: {
            _id: '$speciesId',
            count: { $sum: 1 }
          }},
          { $lookup: {
            from: 'species',
            localField: '_id',
            foreignField: '_id',
            as: 'speciesInfo'
          }},
          { $unwind: '$speciesInfo' },
          { $project: {
            _id: 1,
            name: '$speciesInfo.displayName',
            count: 1
          }}
        ],
        
        // Count by gender
        byGender: [
          { $group: {
            _id: '$gender',
            count: { $sum: 1 }
          }}
        ]
      }}
    ]);

    const result = stats[0];
    
    res.json({ 
      success: true, 
      data: { 
        total: result.total[0]?.count || 0,
        bySource: result.bySource,
        bySpecies: result.bySpecies,
        byGender: result.byGender
      } 
    });

  } catch (error) {
    console.error('Error fetching user pet stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch pet statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getAllUserPets,
  getUserPetStats
};
