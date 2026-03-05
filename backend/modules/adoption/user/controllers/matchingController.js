const User = require('../../../../core/models/User');
const AdoptionPet = require('../../manager/models/AdoptionPet');
// NOTE: matchingService.js is the OLD Python-only matcher - no longer used for SmartMatches
// Kept for legacy endpoints: getSmartMatches(), calculatePetMatch()
const matchingService = require('../services/matchingService');
const contentBasedMatcher = require('../services/contentBasedMatcher');
const { getMLService } = require('../services/mlService');
const { trackInteraction } = require('./trackingController');
const RecommendationLog = require('../../models/RecommendationLog');

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

/**
 * Get hybrid ML recommendations (NEW - Phase 4)
 * Combines Content-Based, SVD, XGBoost, and K-Means
 */
exports.getHybridMatches = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      topN = 10, 
      algorithm = 'hybrid' // hybrid|content|collaborative|success|clustering
    } = req.query;

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
    .lean();

    if (pets.length === 0) {
      return res.json({
        success: true,
        data: {
          recommendations: [],
          totalAvailable: 0,
          message: 'No pets currently available for adoption'
        }
      });
    }

    // Prepare user profile
    const userProfile = user.adoptionProfile;

    // Get ML service
    const mlService = getMLService();

    // Check if ML service is available
    const isMLAvailable = await mlService.isAvailable();

    if (!isMLAvailable) {
      console.warn('⚠️  ML SERVICE UNAVAILABLE - Using content-based fallback');
      
      // PROFESSIONAL CONTENT-BASED FALLBACK (NO Python dependency)
      // Uses weighted multi-criteria decision analysis with compatibility scoring
      const userDoc = { ...user.toObject(), adoptionProfile: userProfile };
      const rankedPets = contentBasedMatcher.rankPetsForUser(userDoc, pets);
      
      if (rankedPets.length === 0) {
        return res.json({
          success: true,
          data: {
            recommendations: [],
            totalAvailable: 0,
            algorithm: 'content_based',
            warning: 'No pets available for matching'
          }
        });
      }
      
      console.log(`✅ Content-based matcher returned ${rankedPets.length} pets`);
      console.log(`   Top score: ${rankedPets[0]?.match_score}/100 (${rankedPets[0]?.name})`);
      
      const recommendations = rankedPets.slice(0, parseInt(topN)).map((pet, index) => {
        const matchDetails = pet.match_details || {};
        const score = pet.match_score || 50;
        
        return {
          // Pet information
          _id: pet._id,
          petName: pet.name || 'Lovely Pet',  // Frontend expects petName
          name: pet.name || 'Lovely Pet',
          species: pet.species || 'Pet',
          breed: pet.breed || 'Unknown',
          age: pet.age,
          gender: pet.gender,
          color: pet.color,
          weight: pet.weight,
          description: pet.description || 'A lovely pet looking for a home',
          adoptionFee: pet.adoptionFee || 0,
          vaccinationStatus: pet.vaccinationStatus,
          images: pet.images || [],
          compatibilityProfile: pet.compatibilityProfile,
          temperamentTags: pet.temperamentTags || [],
          status: pet.status,
          created: pet.created,
          
          // Match scoring (content-based algorithm)
          hybridScore: score,
          match_score: score,
          matchScore: score,
          confidence: Math.min(95, 60 + (score > 85 ? 20 : score > 70 ? 10 : 0)), // Higher confidence for better matches
          
          // Algorithm breakdown
          algorithmScores: {
            content: pet.match_score,      // Content-based is active
            collaborative: 0,              // ML algorithms unavailable
            success: 0,
            clustering: 0
          },
          
          // Explanations
          explanations: [
            `Content-Based Matching: ${matchDetails.compatibility_level || 'Good Match'}`,
            ...(matchDetails.match_reasons || []).slice(0, 3)
          ],
          
          // Detailed match information
          match_details: {
            overall_score: matchDetails.overall_score,
            compatibility_level: matchDetails.compatibility_level,
            match_reasons: matchDetails.match_reasons || [],
            warnings: matchDetails.warnings || [],
            score_breakdown: matchDetails.score_breakdown || {},
            success_probability: matchDetails.success_probability || 50
          }
        };
      });

      console.log(`📤 Sending ${recommendations.length} recommendations to frontend`);
      
      // Log recommendations for production metrics (fire and forget)
      _logRecommendations(userId, recommendations, 'content_based', false).catch(() => {});
      
      return res.json({
        success: true,
        data: {
          recommendations,
          totalAvailable: pets.length,
          algorithm: 'content_based',
          algorithmName: 'Content-Based Filtering (Weighted MCDA)',
          source: 'fallback',
          warning: 'AI/ML service temporarily unavailable - using content-based matching algorithm',
          mlServiceAvailable: false
        }
      });
    }

    // Call hybrid recommender
    const result = await mlService.getHybridRecommendations(
      userId.toString(),
      userProfile,
      pets,
      parseInt(topN),
      algorithm
    );

    // Log viewing interaction for the top recommendations
    if (result.success && result.recommendations && result.recommendations.length > 0) {
      // Log top 3 pet views asynchronously (don't wait)
      result.recommendations.slice(0, 3).forEach(rec => {
        // Fire and forget - don't await
        trackInteraction({
          body: {
            petId: rec.petId,
            interactionType: 'viewed',
            metadata: { algorithm, hybridScore: rec.hybridScore }
          },
          user: { id: userId }
        }, {
          json: () => {}, // Mock response
          status: () => ({ json: () => {} })
        }).catch(err => console.error('Error tracking view:', err));
      });

      // Log recommendations for production metrics (fire and forget)
      _logRecommendations(userId, result.recommendations, result.algorithm || 'hybrid', true, result.weights).catch(() => {});
    }

    res.json({
      success: true,
      data: {
        recommendations: result.recommendations,
        totalAvailable: result.totalAvailable,
        algorithm: result.algorithm,
        source: result.source,
        warning: result.warning,
        userProfile: {
          complete: true,
          activityLevel: userProfile.activityLevel,
          homeType: userProfile.homeType
        }
      }
    });

  } catch (error) {
    console.error('Error getting hybrid matches:', error);
    
    // Emergency fallback with content-based matching
    try {
      const pets = await AdoptionPet.find({
        status: 'available',
        isActive: true,
        isDeleted: false
      })
      .populate('images')
      .lean();

      const user = await User.findById(req.user.id).select('adoptionProfile name email');
      if (!user || !user.adoptionProfile) {
        return res.status(400).json({
          success: false,
          message: 'User profile not found',
          needsProfile: true
        });
      }

      //Use content-based matcher for emergency fallback
      const userDoc = { ...user.toObject(), adoptionProfile: user.adoptionProfile };
      const rankedPets = contentBasedMatcher.rankPetsForUser(userDoc, pets);
      const recommendations = rankedPets.slice(0, parseInt(req.query.topN || 10)).map(pet => {
        const matchDetails = pet.match_details || {};
        const score = pet.match_score || 50;
        
        return {
          _id: pet._id,
          petName: pet.name || 'Lovely Pet',
          name: pet.name || 'Lovely Pet',
          species: pet.species || 'Pet',
          breed: pet.breed || 'Unknown',
          age: pet.age,
          gender: pet.gender,
          color: pet.color,
          weight: pet.weight,
          description: pet.description || 'A lovely pet',
          adoptionFee: pet.adoptionFee || 0,
          vaccinationStatus: pet.vaccinationStatus,
          images: pet.images || [],
          compatibilityProfile: pet.compatibilityProfile,
          temperamentTags: pet.temperamentTags || [],
          status: pet.status,
          created: pet.created,
          
          hybridScore: score,
          match_score: score,
          matchScore: score,
          confidence: Math.min(95, 60 + (score > 85 ? 20 : score > 70 ? 10 : 0)),
          
          algorithmScores: {
            content: pet.match_score,
            collaborative: 0,
            success: 0,
            clustering: 0
          },
          
          explanations: [
            `Content-Based Algorithm: ${matchDetails.compatibility_level || 'Match Found'}`,
            ...(matchDetails.match_reasons || []).slice(0, 2)
          ],
          
          match_details: {
            overall_score: matchDetails.overall_score,
            compatibility_level: matchDetails.compatibility_level,
            match_reasons: matchDetails.match_reasons || [],
            warnings: matchDetails.warnings || [],
            score_breakdown: matchDetails.score_breakdown || {},
            success_probability: matchDetails.success_probability || 50
          }
        };
      });

      res.json({
        success: true,
        data: {
          recommendations,
          totalAvailable: pets.length,
          algorithm: 'content_based_emergency',
          algorithmName: 'Content-Based Filtering (Emergency Fallback)',
          source: 'emergency_fallback',
          warning: 'Using emergency fallback matching - content-based algorithm',
          mlServiceAvailable: false,
          message: 'Content-based matching active (AI/ML service temporarily unavailable)'
        }
      });
    } catch (fallbackError) {
      console.error('Fallback error:', fallbackError);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
};

/**
 * Compare all ML algorithms for research (NEW - Phase 4)
 */
exports.compareAlgorithms = async (req, res) => {
  try {
    const userId = req.user.id;
    const { topN = 10 } = req.query;

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

    // Get all available pets
    const pets = await AdoptionPet.find({
      status: 'available',
      isActive: true,
      isDeleted: false
    })
    .populate('images')
    .lean();

    if (pets.length === 0) {
      return res.json({
        success: true,
        data: {
          comparison: {},
          message: 'No pets currently available for adoption'
        }
      });
    }

    // Get ML service
    const mlService = getMLService();

    // Compare algorithms
    const comparison = await mlService.compareAlgorithms(
      userId.toString(),
      user.adoptionProfile,
      pets,
      parseInt(topN)
    );

    res.json({
      success: true,
      data: comparison.data
    });

  } catch (error) {
    console.error('Error comparing algorithms:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error comparing algorithms',
      error: error.message
    });
  }
};

/**
 * Get ML model statistics (NEW - Phase 4)
 */
exports.getMLStats = async (req, res) => {
  try {
    const mlService = getMLService();
    const stats = await mlService.getModelStats();

    res.json({
      success: true,
      data: stats.stats || {}
    });

  } catch (error) {
    console.error('Error getting ML stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error getting ML statistics',
      error: error.message
    });
  }
};

/**
 * Get production metrics for ML recommendations (NEW)
 * Shows recommendation→application→adoption conversion funnel
 */
exports.getProductionMetrics = async (req, res) => {
  try {
    const { daysBack = 30 } = req.query;
    const metrics = await RecommendationLog.getProductionMetrics(parseInt(daysBack));
    
    res.json({
      success: true,
      data: {
        ...metrics,
        period: `Last ${daysBack} days`,
        description: {
          applicationRate: 'Percentage of recommended pets that users applied for',
          adoptionRate: 'Percentage of recommended pets that led to successful adoptions',
          avgRankWhenApplied: 'Average position of applied pets in recommendation list (lower = better)'
        }
      }
    });
  } catch (error) {
    console.error('Error getting production metrics:', error);
    res.status(500).json({ success: false, message: 'Error getting production metrics' });
  }
};

/**
 * Helper: Log recommendations to RecommendationLog for production metrics tracking.
 * Called asynchronously (fire-and-forget) after recommendations are served.
 */
async function _logRecommendations(userId, recommendations, algorithm, mlAvailable, weights = {}) {
  try {
    if (!recommendations || recommendations.length === 0) return;

    const recEntries = recommendations.map((rec, index) => ({
      petId: rec._id || rec.petId,
      rank: index + 1,
      hybridScore: rec.hybridScore || rec.match_score || 0,
      algorithmScores: {
        content: rec.algorithmScores?.content || 0,
        collaborative: rec.algorithmScores?.collaborative || 0,
        success: rec.algorithmScores?.success || 0,
        clustering: rec.algorithmScores?.clustering || 0
      }
    }));

    await RecommendationLog.create({
      userId,
      recommendations: recEntries,
      algorithm: algorithm || 'hybrid',
      weights: {
        content: weights?.content || 0,
        svd: weights?.svd || 0,
        xgboost: weights?.xgboost || 0,
        kmeans: weights?.kmeans || 0
      },
      mlServiceAvailable: mlAvailable,
      conversions: {
        totalRecommended: recEntries.length,
        totalApplied: 0,
        totalAdopted: 0,
        applicationRate: 0,
        adoptionRate: 0
      }
    });

    console.log(`📊 Logged ${recEntries.length} recommendations for user ${userId} (${algorithm})`);
  } catch (err) {
    console.error('Failed to log recommendations:', err?.message);
  }
}


