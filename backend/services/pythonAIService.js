/**
 * Python AI/ML Service Integration
 * Connects Node.js backend to Python Railway service
 */

const axios = require('axios');
const FormData = require('form-data');

class PythonAIService {
  constructor() {
    this.baseURL = process.env.PYTHON_AI_SERVICE_URL || 'http://localhost:8000';
    this.timeout = 120000; // 2 minutes for ML processing
  }

  /**
   * Health check for Python service
   */
  async healthCheck() {
    try {
      const response = await axios.get(`${this.baseURL}/health`, {
        timeout: 5000
      });
      return response.data;
    } catch (error) {
      console.error('Python AI Service health check failed:', error.message);
      throw new Error('Python AI Service is unavailable');
    }
  }

  /**
   * Identify pet breed for petshop module
   * @param {Buffer} imageBuffer - Image file buffer
   * @param {string} filename - Original filename
   * @param {number} topK - Number of predictions (default: 5)
   * @param {boolean} uploadToCloudinary - Upload to Cloudinary (default: false)
   */
  async identifyBreed(imageBuffer, filename, topK = 5, uploadToCloudinary = false) {
    try {
      const formData = new FormData();
      formData.append('image', imageBuffer, filename);
      formData.append('top_k', topK.toString());
      formData.append('upload_to_cloudinary', uploadToCloudinary.toString());

      const response = await axios.post(
        `${this.baseURL}/api/petshop/identify-breed`,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: this.timeout,
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      );

      return response.data;
    } catch (error) {
      console.error('Breed identification failed:', error.message);
      throw new Error(error.response?.data?.error || 'Failed to identify breed');
    }
  }

  /**
   * Identify only species (Dog, Cat, Bird, etc.)
   * @param {Buffer} imageBuffer - Image file buffer
   * @param {string} filename - Original filename
   */
  async identifySpecies(imageBuffer, filename) {
    try {
      const formData = new FormData();
      formData.append('image', imageBuffer, filename);

      const response = await axios.post(
        `${this.baseURL}/api/petshop/identify-species`,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: this.timeout
        }
      );

      return response.data;
    } catch (error) {
      console.error('Species identification failed:', error.message);
      throw new Error(error.response?.data?.error || 'Failed to identify species');
    }
  }

  /**
   * Identify species and breed for adoption module
   * @param {Buffer} imageBuffer - Image file buffer
   * @param {string} filename - Original filename
   */
  async identifyForAdoption(imageBuffer, filename) {
    try {
      const formData = new FormData();
      formData.append('image', imageBuffer, filename);

      const response = await axios.post(
        `${this.baseURL}/api/adoption/identify`,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: this.timeout
        }
      );

      return response.data;
    } catch (error) {
      console.error('Adoption identification failed:', error.message);
      throw new Error(error.response?.data?.error || 'Failed to identify pet');
    }
  }

  /**
   * Get breed suggestions filtered by species
   * @param {Buffer} imageBuffer - Image file buffer
   * @param {string} filename - Original filename
   * @param {string} species - Filter by species (optional)
   */
  async getBreedSuggestions(imageBuffer, filename, species = null) {
    try {
      const formData = new FormData();
      formData.append('image', imageBuffer, filename);
      if (species) {
        formData.append('species', species);
      }

      const response = await axios.post(
        `${this.baseURL}/api/petshop/breed-suggestions`,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: this.timeout
        }
      );

      return response.data;
    } catch (error) {
      console.error('Breed suggestions failed:', error.message);
      throw new Error(error.response?.data?.error || 'Failed to get breed suggestions');
    }
  }

  /**
   * Get AI recommendations for adoption matching
   * @param {string} userId - User ID
   * @param {number} limit - Number of recommendations
   */
  async getAdoptionRecommendations(userId, limit = 10) {
    try {
      const response = await axios.get(
        `${this.baseURL}/api/recommendations/adoption/${userId}`,
        {
          params: { limit },
          timeout: this.timeout
        }
      );

      return response.data;
    } catch (error) {
      console.error('Adoption recommendations failed:', error.message);
      throw new Error(error.response?.data?.error || 'Failed to get recommendations');
    }
  }

  /**
   * Get inventory predictions and restock recommendations
   * @param {string} productId - Product ID
   */
  async getInventoryPrediction(productId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/api/inventory/analyze/${productId}`,
        { timeout: this.timeout }
      );

      return response.data;
    } catch (error) {
      console.error('Inventory prediction failed:', error.message);
      throw new Error(error.response?.data?.error || 'Failed to get inventory prediction');
    }
  }

  /**
   * Get all inventory predictions
   */
  async getAllInventoryPredictions() {
    try {
      const response = await axios.get(
        `${this.baseURL}/api/inventory/analyze/all`,
        { timeout: this.timeout }
      );

      return response.data;
    } catch (error) {
      console.error('All inventory predictions failed:', error.message);
      throw new Error(error.response?.data?.error || 'Failed to get inventory predictions');
    }
  }

  /**
   * Get critical inventory items
   */
  async getCriticalInventory() {
    try {
      const response = await axios.get(
        `${this.baseURL}/api/inventory/critical-items`,
        { timeout: this.timeout }
      );

      return response.data;
    } catch (error) {
      console.error('Critical inventory check failed:', error.message);
      throw new Error(error.response?.data?.error || 'Failed to get critical inventory');
    }
  }

  /**
   * Get e-commerce product recommendations
   * @param {string} userId - User ID
   * @param {number} limit - Number of recommendations
   */
  async getEcommerceRecommendations(userId, limit = 10) {
    try {
      const response = await axios.get(
        `${this.baseURL}/api/ecommerce/recommendations/${userId}`,
        {
          params: { limit },
          timeout: this.timeout
        }
      );

      return response.data;
    } catch (error) {
      console.error('E-commerce recommendations failed:', error.message);
      throw new Error(error.response?.data?.error || 'Failed to get recommendations');
    }
  }
}

// Export singleton instance
module.exports = new PythonAIService();
