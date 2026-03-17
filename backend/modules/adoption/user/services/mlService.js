/**
 * ML Service - Node.js integration with Python AI/ML service
 * Handles communication with hybrid recommender system
 */

const axios = require('axios');

const ML_SERVICE_URL = process.env.AIML_API_URL || 'http://localhost:5001';
const ML_TIMEOUT = 90000; // 90 seconds for Render sleeping service
const RETRY_ATTEMPTS = 2;

class MLService {
  constructor() {
    this.baseURL = ML_SERVICE_URL;
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: ML_TIMEOUT,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Check if ML service is available
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    try {
      const response = await this.client.get('/api/adoption/health', { timeout: 10000 }); // 10 seconds for health check
      return response.data.success === true;
    } catch (error) {
      console.warn('ML Service unavailable:', error.message);
      return false;
    }
  }

  /**
   * Get hybrid ML recommendations
   * @param {string} userId - User ID
   * @param {object} userProfile - User adoption profile
   * @param {array} availablePets - Array of available pets
   * @param {number} topN - Number of recommendations
   * @param {string} algorithm - Algorithm to use (hybrid|content|collaborative|success|clustering)
   * @returns {Promise<object>}
   */
  async getHybridRecommendations(userId, userProfile, availablePets, topN = 10, algorithm = 'hybrid') {
    try {
      const response = await this._makeRequest('/api/adoption/ml/recommend/hybrid', {
        userId,
        userProfile,
        availablePets,
        topN,
        algorithm
      });

      if (response.success) {
        return {
          success: true,
          recommendations: response.data.recommendations,
          algorithm: response.data.algorithm,
          totalAvailable: response.data.totalAvailable,
          weights: response.data.currentWeights || null,  // live adapted weights
          source: 'ml-service'
        };
      } else {
        throw new Error(response.message || 'ML recommendation failed');
      }
    } catch (error) {
      console.error('Hybrid recommendation error:', error.message);
      
      // Fallback to content-based
      return this._fallbackToContentBased(userProfile, availablePets, topN);
    }
  }

  /**
   * Compare all algorithms for research analysis
   * @param {string} userId - User ID
   * @param {object} userProfile - User adoption profile
   * @param {array} availablePets - Array of available pets
   * @param {number} topN - Number of recommendations per algorithm
   * @returns {Promise<object>}
   */
  async compareAlgorithms(userId, userProfile, availablePets, topN = 10) {
    try {
      const response = await this._makeRequest('/api/adoption/ml/compare-algorithms', {
        userId,
        userProfile,
        availablePets,
        topN
      });

      if (response.success) {
        return {
          success: true,
          data: response.data,
          source: 'ml-service'
        };
      } else {
        throw new Error(response.message || 'Algorithm comparison failed');
      }
    } catch (error) {
      console.error('Algorithm comparison error:', error.message);
      return {
        success: false,
        error: error.message,
        source: 'ml-service'
      };
    }
  }

  /**
   * Train collaborative filtering model
   * @param {array} interactions - User-pet interactions
   * @returns {Promise<object>}
   */
  async trainCollaborativeFilter(interactions) {
    try {
      const response = await this._makeRequest('/api/adoption/ml/collaborative/train', {
        interactions
      });

      return {
        success: response.success,
        metrics: response.data,
        message: response.message
      };
    } catch (error) {
      console.error('CF training error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Train success predictor model
   * @param {array} adoptions - Adoption records with outcomes
   * @returns {Promise<object>}
   */
  async trainSuccessPredictor(adoptions) {
    try {
      const response = await this._makeRequest('/api/adoption/ml/success-predictor/train', {
        adoptions
      });

      return {
        success: response.success,
        metrics: response.data,
        message: response.message
      };
    } catch (error) {
      console.error('XGB training error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Train K-Means clustering model
   * @param {array} pets - Pets with compatibility profiles
   * @param {number} k - Number of clusters (optional)
   * @returns {Promise<object>}
   */
  async trainPetClustering(pets, k = null) {
    try {
      const payload = { pets };
      if (k) payload.k = k;

      const response = await this._makeRequest('/api/adoption/ml/clustering/train', payload);

      return {
        success: response.success,
        metrics: response.data,
        message: response.message
      };
    } catch (error) {
      console.error('K-Means training error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get ML model statistics
   * @returns {Promise<object>}
   */
  async getModelStats() {
    try {
      const response = await this.client.get('/api/adoption/ml/models/stats');

      if (response.data.success) {
        return {
          success: true,
          stats: response.data.data
        };
      } else {
        throw new Error(response.data.message || 'Failed to get model stats');
      }
    } catch (error) {
      console.error('Get model stats error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Assign pet to personality cluster
   * @param {object} petProfile - Pet compatibility profile
   * @returns {Promise<object>}
   */
  async assignPetCluster(petProfile) {
    try {
      const response = await this._makeRequest('/api/adoption/ml/pet/cluster', {
        petProfile
      });

      if (response.success) {
        return {
          success: true,
          cluster: response.data
        };
      } else {
        throw new Error(response.message || 'Failed to assign cluster');
      }
    } catch (error) {
      console.error('Pet clustering error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get cluster information
   * @returns {Promise<object>}
   */
  async getClusterInfo() {
    try {
      const response = await this.client.get('/api/adoption/ml/clusters/info');

      if (response.data.success) {
        return {
          success: true,
          clusters: response.data.data
        };
      } else {
        throw new Error(response.data.message || 'Failed to get cluster info');
      }
    } catch (error) {
      console.error('Get cluster info error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Make HTTP request with retry logic
   * @private
   */
  async _makeRequest(endpoint, data, attempt = 1) {
    try {
      const response = await this.client.post(endpoint, data);
      return response.data;
    } catch (error) {
      if (attempt < RETRY_ATTEMPTS && this._isRetryableError(error)) {
        console.warn(`Request failed (attempt ${attempt}/${RETRY_ATTEMPTS}), retrying...`);
        await this._delay(1000 * attempt); // Exponential backoff
        return this._makeRequest(endpoint, data, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Check if error is retryable
   * @private
   */
  _isRetryableError(error) {
    if (!error.response) return true; // Network errors
    const status = error.response.status;
    return status === 429 || status >= 500; // Rate limit or server errors
  }

  /**
   * Delay helper
   * @private
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Fallback to LOCAL content-based matching (NO Python dependency)
   * Uses Node.js contentBasedMatcher instead of calling Python again
   * @private
   */
  async _fallbackToContentBased(userProfile, availablePets, topN) {
    console.log('⚠️ ML hybrid failed - Falling back to LOCAL content-based matcher (no Python)');

    try {
      // Use LOCAL Node.js content-based matcher (NOT Python)
      const contentBasedMatcher = require('./contentBasedMatcher');
      const userDoc = { adoptionProfile: userProfile };
      const rankedPets = contentBasedMatcher.rankPetsForUser(userDoc, availablePets);

      if (rankedPets && rankedPets.length > 0) {
        const matches = rankedPets.slice(0, topN).map(pet => ({
          petId: pet._id,
          petName: pet.name || 'Lovely Pet',
          name: pet.name || 'Lovely Pet',
          species: pet.species || 'Pet',
          breed: pet.breed || 'Unknown',
          age: pet.age,
          gender: pet.gender,
          images: pet.images || [],
          temperamentTags: pet.temperamentTags || [],
          hybridScore: pet.match_score || 50,
          match_score: pet.match_score || 50,
          confidence: 65,
          algorithmScores: {
            content: pet.match_score || 50,
            collaborative: 0,
            success: 0,
            clustering: 0
          },
          weights: { content: 1.0 },
          explanations: ['Content-based matching (local fallback)'],
          match_details: pet.match_details || {},
          algorithmUsed: 'content',
          isColdStart: true,
          fallback: true
        }));

        console.log(`✅ Local content-based fallback returned ${matches.length} matches`);

        return {
          success: true,
          recommendations: matches,
          algorithm: 'content',
          totalAvailable: availablePets.length,
          source: 'local_fallback',
          warning: 'ML service unavailable, using local content-based matching'
        };
      }
    } catch (fallbackError) {
      console.error('❌ Local fallback also failed:', fallbackError.message);
    }

    // Last resort: return empty
    return {
      success: false,
      recommendations: [],
      error: 'Both ML service and local fallback failed',
      source: 'error'
    };
  }

  /**
   * FIX #7: Send application feedback to Flask to nudge hybrid weights.
   * @param {Array} feedbackData - [{algorithmScores:{...}, wasApplied:bool}]
   */
  async updateWeights(feedbackData) {
    try {
      const response = await this._makeRequest('/api/adoption/ml/update-weights', { feedbackData });
      if (response.success) {
        console.log('Hybrid weights updated:', response.newWeights);
      }
      return response;
    } catch (error) {
      console.warn('Weight update skipped (Flask unavailable):', error.message);
      return { success: false };
    }
  }

  /**
   * Get current hybrid algorithm weights from Flask (live, possibly adapted).
   * @returns {Promise<{content, collaborative, success, clustering}|null>}
   */
  async getWeights() {
    try {
      const response = await this.client.get('/api/adoption/ml/weights', { timeout: 30000 }); // 30 seconds for weights
      if (response.data.success) {
        return response.data.weights;
      }
      return null;
    } catch (error) {
      return null; // Non-critical — UI falls back to hardcoded defaults
    }
  }
}

// Singleton instance
let mlServiceInstance = null;

/**
 * Get ML Service singleton instance
 * @returns {MLService}
 */
function getMLService() {
  if (!mlServiceInstance) {
    mlServiceInstance = new MLService();
  }
  return mlServiceInstance;
}

module.exports = {
  MLService,
  getMLService
};
