/**
 * Inventory ML Service - Node.js Integration
 * 
 * Communicates with Python AI/ML service for inventory predictions.
 * Provides caching, error handling, and fallback mechanisms.
 */

const axios = require('axios');

// Configuration
const ML_SERVICE_URL = process.env.PYTHON_ML_URL || 'http://localhost:5001';
const ML_TIMEOUT = 30000; // 30 seconds for ML operations

// Create axios instance for ML service
const mlClient = axios.create({
  baseURL: `${ML_SERVICE_URL}/api/inventory`,
  timeout: ML_TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Inventory ML Service
 */
class InventoryMLService {
  
  /**
   * Check if ML service is available
   */
  static async healthCheck() {
    try {
      const response = await mlClient.get('/health');
      return {
        success: true,
        available: true,
        data: response.data
      };
    } catch (error) {
      console.error('ML Service health check failed:', error.message);
      return {
        success: false,
        available: false,
        error: error.message
      };
    }
  }

  /**
   * Analyze a single product or variant for inventory predictions
   * 
   * @param {string} productId - MongoDB ObjectId
   * @param {Object} options - Analysis options
   * @param {string} options.variantId - Optional variant ObjectId
   * @param {number} options.leadTime - Lead time in days
   * @param {boolean} options.save - Save results to DB
   * @returns {Promise<Object>} Analysis results
   */
  static async analyzeProduct(productId, options = {}) {
    try {
      const { variantId, leadTime = 7, save = false } = options;
      
      const params = {
        lead_time: leadTime,
        save: save
      };
      
      // Add variant_id if provided
      if (variantId) {
        params.variant_id = variantId;
      }
      
      const response = await mlClient.get(`/analyze/${productId}`, {
        params: params
      });

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data
        };
      } else {
        return {
          success: false,
          error: response.data.error || 'Analysis failed'
        };
      }
    } catch (error) {
      console.error(`ML Analysis failed for product ${productId}:`, error.message);
      return {
        success: false,
        error: this._handleError(error),
        fallback: true
      };
    }
  }

  /**
   * Analyze all products in store
   * 
   * @param {string} storeId - Optional store filter
   * @param {boolean} save - Save results to DB
   * @returns {Promise<Object>} Batch analysis results
   */
  static async analyzeAllProducts(storeId = null, save = false) {
    try {
      const params = { save };
      if (storeId) params.store_id = storeId;
      
      const response = await mlClient.get('/analyze/all', { params });

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Batch ML Analysis failed:', error.message);
      return {
        success: false,
        error: this._handleError(error)
      };
    }
  }

  /**
   * Get critical items needing restock
   * 
   * @param {string} storeId - Optional store filter
   * @param {number} limit - Max items to return
   * @returns {Promise<Object>} Critical items list
   */
  static async getCriticalItems(storeId = null, limit = 20) {
    try {
      const params = { limit };
      if (storeId) params.store_id = storeId;
      
      const response = await mlClient.get('/critical-items', { params });

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Failed to get critical items:', error.message);
      return {
        success: false,
        error: this._handleError(error)
      };
    }
  }

  /**
   * Get comprehensive restock report
   * 
   * @param {string} storeId - Optional store filter
   * @returns {Promise<Object>} Restock report
   */
  static async getRestockReport(storeId = null) {
    try {
      const params = {};
      if (storeId) params.store_id = storeId;
      
      const response = await mlClient.get('/restock-report', { params });

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Failed to get restock report:', error.message);
      return {
        success: false,
        error: this._handleError(error)
      };
    }
  }

  /**
   * Get demand forecast for a product
   * 
   * @param {string} productId - MongoDB ObjectId
   * @param {number} days - Days to forecast
   * @param {string} method - Forecast method (auto, prophet, arima, linear)
   * @returns {Promise<Object>} Demand forecast
   */
  static async getDemandForecast(productId, days = 30, method = 'auto') {
    try {
      const response = await mlClient.get(`/forecast/${productId}`, {
        params: { days, method }
      });

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error(`Forecast failed for product ${productId}:`, error.message);
      return {
        success: false,
        error: this._handleError(error)
      };
    }
  }

  /**
   * Get seasonal analysis
   * 
   * @returns {Promise<Object>} Seasonal context and factors
   */
  static async getSeasonalAnalysis() {
    try {
      const response = await mlClient.get('/seasonal-analysis');

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Seasonal analysis failed:', error.message);
      return {
        success: false,
        error: this._handleError(error)
      };
    }
  }

  /**
   * Get sales velocity for a product
   * 
   * @param {string} productId - MongoDB ObjectId
   * @returns {Promise<Object>} Sales velocity metrics
   */
  static async getSalesVelocity(productId) {
    try {
      const response = await mlClient.get(`/velocity/${productId}`);

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error(`Velocity calc failed for product ${productId}:`, error.message);
      return {
        success: false,
        error: this._handleError(error)
      };
    }
  }

  /**
   * Batch analyze specific products
   * 
   * @param {string[]} productIds - Array of product IDs
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Batch results
   */
  static async batchAnalyze(productIds, options = {}) {
    try {
      const { leadTime = 7, save = false } = options;
      
      const response = await mlClient.post('/batch-analyze', {
        product_ids: productIds,
        lead_time: leadTime,
        save: save
      });

      return {
        success: true,
        data: response.data.data,
        total: response.data.total
      };
    } catch (error) {
      console.error('Batch analysis failed:', error.message);
      return {
        success: false,
        error: this._handleError(error)
      };
    }
  }

  /**
   * Handle axios errors uniformly
   */
  static _handleError(error) {
    if (error.response) {
      // Server responded with error
      return error.response.data?.error || `Server error: ${error.response.status}`;
    } else if (error.request) {
      // No response received
      return 'ML Service unavailable. Please ensure the Python AI service is running.';
    } else {
      return error.message;
    }
  }
}

module.exports = InventoryMLService;
