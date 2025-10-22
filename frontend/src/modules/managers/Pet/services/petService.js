import axios from 'axios';

const API_BASE_URL = '/api/pets';

class PetService {
  // Get all pets
  static async getPets(params = {}) {
    try {
      const response = await axios.get(API_BASE_URL, { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch pets');
    }
  }

  // Get pet by ID
  static async getPetById(id) {
    try {
      const response = await axios.get(`${API_BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch pet');
    }
  }

  // Create a new pet
  static async createPet(petData) {
    try {
      const response = await axios.post(API_BASE_URL, petData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create pet');
    }
  }

  // Update pet
  static async updatePet(id, petData) {
    try {
      const response = await axios.put(`${API_BASE_URL}/${id}`, petData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update pet');
    }
  }

  // Delete pet
  static async deletePet(id) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete pet');
    }
  }

  // Get owned pets
  static async getOwnedPets() {
    try {
      const response = await axios.get(`${API_BASE_URL}/my-pets`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch owned pets');
    }
  }

  // Add medical history
  static async addMedicalHistory(petId, medicalData) {
    try {
      const response = await axios.put(`${API_BASE_URL}/${petId}/medical-history`, medicalData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to add medical history');
    }
  }

  // Add vaccination record
  static async addVaccinationRecord(petId, vaccinationData) {
    try {
      const response = await axios.put(`${API_BASE_URL}/${petId}/vaccination`, vaccinationData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to add vaccination record');
    }
  }

  // Add ownership history
  static async addOwnershipHistory(petId, ownershipData) {
    try {
      const response = await axios.put(`${API_BASE_URL}/${petId}/owners`, ownershipData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to add ownership history');
    }
  }

  // Add medication record
  static async addMedicationRecord(petId, medicationData) {
    try {
      const response = await axios.put(`${API_BASE_URL}/${petId}/medications`, medicationData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to add medication record');
    }
  }

  // Get pet history
  static async getPetHistory(petId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/${petId}/history`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch pet history');
    }
  }

  // Search nearby pets
  static async searchNearbyPets(params) {
    try {
      const response = await axios.get(`${API_BASE_URL}/search/nearby`, { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to search nearby pets');
    }
  }

  // Get pet changelog
  static async getPetChangelog(petId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/${petId}/changelog`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch pet changelog');
    }
  }

  // Get registry history
  static async getRegistryHistory(petCode) {
    try {
      const response = await axios.get(`${API_BASE_URL}/registry/${petCode}/history`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch registry history');
    }
  }
}

export default PetService;