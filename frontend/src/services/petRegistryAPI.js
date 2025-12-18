import { api } from './api';

// Pet Registry API
const petRegistryAPI = {
  // Get all pets from registry with pagination and filters
  list: (params = {}) => api.get('/admin/pet-registry', { params }),
  
  // Get single pet from registry by petCode
  getByCode: (petCode) => api.get(`/admin/pet-registry/${petCode}`),
  
  // Update pet location and status in registry
  updateLocation: (petCode, data) => api.put(`/admin/pet-registry/${petCode}/location`, data),
  
  // Record ownership transfer in registry
  recordTransfer: (petCode, data) => api.post(`/admin/pet-registry/${petCode}/transfer`, data),
  
  // Get ownership history for a pet
  getOwnershipHistory: (petCode) => api.get(`/admin/pet-registry/${petCode}/history`),
};

export default petRegistryAPI;