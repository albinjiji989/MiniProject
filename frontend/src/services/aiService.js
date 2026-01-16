/**
 * AI/ML Service Integration
 * Connects to Python AI service for pet breed identification
 */

const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:5001';

class AIService {
  /**
   * Identify pet breed from image
   * @param {File} imageFile - Image file to analyze
   * @param {number} topK - Number of predictions to return
   * @returns {Promise<Object>} Breed identification results
   */
  async identifyBreed(imageFile, topK = 5) {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('top_k', topK);

      const response = await fetch(`${AI_SERVICE_URL}/api/petshop/identify-breed`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to identify breed');
      }

      return data;
    } catch (error) {
      console.error('Error identifying breed:', error);
      throw error;
    }
  }

  /**
   * Identify only species (Dog, Cat, Bird, etc.)
   * @param {File} imageFile - Image file to analyze
   * @returns {Promise<Object>} Species identification results
   */
  async identifySpecies(imageFile) {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await fetch(`${AI_SERVICE_URL}/api/petshop/identify-species`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to identify species');
      }

      return data;
    } catch (error) {
      console.error('Error identifying species:', error);
      throw error;
    }
  }

  /**
   * Get breed suggestions filtered by species
   * @param {File} imageFile - Image file to analyze
   * @param {string} species - Filter by species (optional)
   * @returns {Promise<Object>} Filtered breed suggestions
   */
  async getBreedSuggestions(imageFile, species = null) {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      if (species) {
        formData.append('species', species);
      }

      const response = await fetch(`${AI_SERVICE_URL}/api/petshop/breed-suggestions`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get breed suggestions');
      }

      return data;
    } catch (error) {
      console.error('Error getting breed suggestions:', error);
      throw error;
    }
  }

  /**
   * Identify for adoption module
   * @param {File} imageFile - Image file to analyze
   * @returns {Promise<Object>} Identification results
   */
  async identifyForAdoption(imageFile) {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await fetch(`${AI_SERVICE_URL}/api/adoption/identify`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to identify');
      }

      return data;
    } catch (error) {
      console.error('Error identifying for adoption:', error);
      throw error;
    }
  }

  /**
   * Check if AI service is available
   * @returns {Promise<boolean>} Service availability status
   */
  async checkHealth() {
    try {
      const response = await fetch(`${AI_SERVICE_URL}/health`);
      const data = await response.json();
      return data.success && data.status === 'healthy';
    } catch (error) {
      console.error('AI service health check failed:', error);
      return false;
    }
  }
}

export default new AIService();
