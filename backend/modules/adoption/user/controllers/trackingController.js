const UserPetInteraction = require('../../models/UserPetInteraction');
const ModelPerformance = require('../../models/ModelPerformance');
const AdoptionPet = require('../../manager/models/AdoptionPet');

/**
 * Log user interaction with a pet
 * Used for collaborative filtering
 */
exports.trackInteraction = async (req, res) => {
  try {
    const userId = req.user.id;
    const { petId, interactionType, matchScore, algorithmUsed, metadata } = req.body;

    // Validate interaction type
    const validTypes = ['viewed', 'favorited', 'applied', 'adopted', 'returned', 'viewed_matches', 'clicked', 'shared'];
    if (!validTypes.includes(interactionType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid interaction type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    // Create interaction record
    const interaction = await UserPetInteraction.create({
      userId,
      petId: petId || null,
      interactionType,
      matchScore: matchScore || null,
      algorithmUsed: algorithmUsed || 'none',
      timestamp: new Date(),
      metadata: metadata || {}
    });

    res.json({
      success: true,
      message: 'Interaction tracked successfully',
      data: interaction
    });
  } catch (error) {
    console.error('Error tracking interaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track interaction',
      error: error.message
    });
  }
};

/**
 * Get user's interaction history
 */
exports.getUserInteractionHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50 } = req.query;

    const interactions = await UserPetInteraction.getUserHistory(userId, parseInt(limit));
    
    const interactionCount = await UserPetInteraction.getUserInteractionCount(userId);

    res.json({
      success: true,
      data: {
        interactions,
        totalCount: interactionCount,
        isColdStart: interactionCount < 3  // Flag for algorithm selection
      }
    });
  } catch (error) {
    console.error('Error fetching interaction history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interaction history',
      error: error.message
    });
  }
};

/**
 * Get pet interaction statistics
 */
exports.getPetInteractionStats = async (req, res) => {
  try {
    const { petId } = req.params;

    const stats = await UserPetInteraction.getPetStats(petId);
    
    const totalInteractions = Object.values(stats).reduce((sum, count) => sum + count, 0);

    res.json({
      success: true,
      data: {
        petId,
        stats,
        totalInteractions,
        popularityScore: totalInteractions // Simple popularity metric
      }
    });
  } catch (error) {
    console.error('Error fetching pet stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pet interaction stats',
      error: error.message
    });
  }
};

/**
 * Submit user feedback after adoption (30+ days)
 */
exports.submitAdoptionFeedback = async (req, res) => {
  try {
    const userId = req.user.id;
    const { petId, feedbackScore, feedbackText } = req.body;

    // Validate feedback score
    if (feedbackScore < 1 || feedbackScore > 5) {
      return res.status(400).json({
        success: false,
        message: 'Feedback score must be between 1 and 5'
      });
    }

    // Find the pet and mark adoption as successful
    const pet = await AdoptionPet.findById(petId);
    
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    // Mark adoption as successful with feedback
    await pet.markAdoptionSuccessful(userId, feedbackScore, feedbackText);

    // Track positive interaction
    await UserPetInteraction.create({
      userId,
      petId,
      interactionType: 'adopted',
      timestamp: new Date(),
      metadata: { feedbackScore, feedbackText }
    });

    res.json({
      success: true,
      message: 'Thank you for your feedback! This helps us improve our matching system.',
      data: {
        feedbackScore,
        feedbackText
      }
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback',
      error: error.message
    });
  }
};

/**
 * Report adoption return/failure
 */
exports.reportAdoptionReturn = async (req, res) => {
  try {
    const userId = req.user.id;
    const { petId, returnReason } = req.body;

    const pet = await AdoptionPet.findById(petId);
    
    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    // Mark adoption as failed
    await pet.markAdoptionFailed(userId, returnReason);

    // Track negative interaction
    await UserPetInteraction.create({
      userId,
      petId,
      interactionType: 'returned',
      timestamp: new Date(),
      metadata: { returnReason }
    });

    res.json({
      success: true,
      message: 'Return recorded. We\'re sorry it didn\'t work out.',
      data: {
        returnReason,
        petStatus: 'available'
      }
    });
  } catch (error) {
    console.error('Error reporting return:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to report return',
      error: error.message
    });
  }
};

/**
 * Get ML model performance metrics (Admin only)
 */
exports.getModelPerformance = async (req, res) => {
  try {
    const { modelType } = req.query;

    let performanceData;
    
    if (modelType) {
      // Get specific model performance
      performanceData = await ModelPerformance.getModelHistory(modelType, 10);
    } else {
      // Get all models comparison
      performanceData = await ModelPerformance.compareAlgorithms();
    }

    res.json({
      success: true,
      data: performanceData
    });
  } catch (error) {
    console.error('Error fetching model performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch model performance',
      error: error.message
    });
  }
};

/**
 * Get training data for ML models
 */
exports.getTrainingData = async (req, res) => {
  try {
    // Get all adoption outcomes
    const trainingData = await AdoptionPet.getAdoptionsForTraining();

    // Get all user-pet interactions
    const interactions = await UserPetInteraction.getInteractionMatrix();

    res.json({
      success: true,
      data: {
        adoptions: trainingData,
        interactions,
        stats: {
          totalAdoptions: trainingData.length,
          successfulAdoptions: trainingData.filter(a => a.successfulAdoption === true).length,
          failedAdoptions: trainingData.filter(a => a.successfulAdoption === false).length,
          totalInteractions: interactions.length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching training data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch training data',
      error: error.message
    });
  }
};
