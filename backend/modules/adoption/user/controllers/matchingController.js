const User = require('../../../../core/models/User');
const AdoptionPet = require('../../manager/models/AdoptionPet');
const matchingService = require('../services/matchingService');

/**
 * Update user's adoption profile
 */
exports.updateAdoptionProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profileData = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update adoption profile
    user.adoptionProfile = {
      ...user.adoptionProfile,
      ...profileData,
      profileComplete: true,
      profileCompletedAt: new Date()
    };

    await user.save();

    res.json({
      success: true,
      message: 'Adoption profile updated successfully',
      data: { adoptionProfile: user.adoptionProfile }
    });
  } catch (error) {
    console.error('Error updating adoption profile:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get user's adoption profile
 */
exports.getAdoptionProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select('adoptionProfile');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      data: { adoptionProfile: user.adoptionProfile || {} }
    });
  } catch (error) {
    console.error('Error fetching adoption profile:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get smart matches for current user
 */
exports.getSmartMatches = async (req, res) => {
  try {
    const userId = req.user.id;
    const { topN = 5, includeAll = false } = req.query;

    // Get user profile
    const user = await User.findById(userId).select('adoptionProfile name email');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if profile is complete
    if (!user.adoptionProfile?.profileComplete) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your adoption profile first',
        needsProfile: true
      });
    }

    // Get all available pets
    const pets = await AdoptionPet.find({
      status: 'available',
      isActive: true,
      isDeleted: false
    })
    .populate('images')
    .populate('documents')
    .lean();

    if (pets.length === 0) {
      return res.json({
        success: true,
        data: {
          matches: [],
          totalAvailable: 0,
          message: 'No pets currently available for adoption'
        }
      });
    }

    // Prepare user profile for AI
    const userProfile = {
      _id: user._id,
      name: user.name,
      email: user.email,
      adoptionProfile: user.adoptionProfile
    };

    // Call AI matching service
    let matchResult;
    if (includeAll === 'true' || includeAll === true) {
      matchResult = await matchingService.rankPets(userProfile, pets);
    } else {
      matchResult = await matchingService.getTopMatches(userProfile, pets, parseInt(topN));
    }

    res.json({
      success: true,
      data: {
        matches: matchResult.data.topMatches || matchResult.data.rankedPets || [],
        totalAvailable: pets.length,
        userProfile: {
          complete: true,
          activityLevel: user.adoptionProfile.activityLevel,
          homeType: user.adoptionProfile.homeType
        }
      }
    });
  } catch (error) {
    console.error('Error getting smart matches:', error);
    
    // Fallback: return pets without matching if AI service is down
    try {
      const pets = await AdoptionPet.find({
        status: 'available',
        isActive: true,
        isDeleted: false
      })
      .populate('images')
      .limit(parseInt(req.query.topN) || 5)
      .lean();

      res.json({
        success: true,
        data: {
          matches: pets,
          totalAvailable: pets.length,
          aiServiceDown: true,
          message: 'Showing available pets (AI matching temporarily unavailable)'
        }
      });
    } catch (fallbackError) {
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
};

/**
 * Calculate match score for a specific pet
 */
exports.calculatePetMatch = async (req, res) => {
  try {
    const userId = req.user.id;
    const { petId } = req.params;

    // Get user profile
    const user = await User.findById(userId).select('adoptionProfile name email');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.adoptionProfile?.profileComplete) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your adoption profile first',
        needsProfile: true
      });
    }

    // Get pet
    const pet = await AdoptionPet.findById(petId)
      .populate('imageIds')
      .lean();

    if (!pet) {
      return res.status(404).json({ success: false, message: 'Pet not found' });
    }

    // Prepare profiles
    const userProfile = {
      _id: user._id,
      name: user.name,
      adoptionProfile: user.adoptionProfile
    };

    // Call AI matching service
    const matchResult = await matchingService.calculateMatch(userProfile, pet);

    res.json({
      success: true,
      data: {
        pet,
        matchScore: matchResult.data.overall_score,
        matchDetails: matchResult.data
      }
    });
  } catch (error) {
    console.error('Error calculating pet match:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get profile completion status
 */
exports.getProfileStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select('adoptionProfile');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const profile = user.adoptionProfile || {};
    const requiredFields = [
      'homeType',
      'activityLevel',
      'experienceLevel',
      'hasChildren',
      'hasOtherPets'
    ];

    const completedFields = requiredFields.filter(field => profile[field] !== null && profile[field] !== undefined);
    const completionPercentage = (completedFields.length / requiredFields.length) * 100;

    res.json({
      success: true,
      data: {
        isComplete: profile.profileComplete || false,
        completionPercentage: Math.round(completionPercentage),
        completedFields: completedFields.length,
        totalFields: requiredFields.length,
        missingFields: requiredFields.filter(f => !completedFields.includes(f))
      }
    });
  } catch (error) {
    console.error('Error getting profile status:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
