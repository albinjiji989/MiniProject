import { api } from './api';

// Pet Categories API
const petCategoriesAPI = {
  list: (params = {}) => api.get('/admin/pet-categories', { params }),
  getActive: () => api.get('/admin/pet-categories/active'),
  create: (data) => api.post('/admin/pet-categories', data),
  update: (id, data) => api.put(`/admin/pet-categories/${id}`, data),
  delete: (id) => api.delete(`/admin/pet-categories/${id}`),
  restore: (id) => api.patch(`/admin/pet-categories/${id}/restore`),
};

// Species API
const speciesAPI = {
  list: (params = {}) => api.get('/admin/species', { params }),
  getAll: (params = {}) => api.get('/admin/species', { params }), // Alias for list
  getById: (id) => api.get(`/admin/species/${id}`),
  getActive: () => api.get('/admin/species/active'),
  create: (data) => api.post('/admin/species', data),
  update: (id, data) => api.put(`/admin/species/${id}`, data),
  delete: (id) => api.delete(`/admin/species/${id}`),
  restore: (id) => api.patch(`/admin/species/${id}/restore`),
  getStats: () => api.get('/admin/species/stats/overview')
};

// Breeds API
const breedsAPI = {
  list: (params = {}) => api.get('/admin/breeds', { params }),
  getAll: (params = {}) => api.get('/admin/breeds', { params }), // Alias for list
  getById: (id) => api.get(`/admin/breeds/${id}`),
  getActive: () => api.get('/admin/breeds/active'),
  getBySpecies: (speciesId) => api.get(`/admin/breeds/species/${speciesId}`),
  create: (data) => api.post('/admin/breeds', data),
  update: (id, data) => api.put(`/admin/breeds/${id}`, data),
  delete: (id) => api.delete(`/admin/breeds/${id}`),
  restore: (id) => api.patch(`/admin/breeds/${id}/restore`),
  getStats: () => api.get('/admin/breeds/stats/overview')
};

// Pet Details API
const petDetailsAPI = {
  list: (params = {}) => api.get('/admin/pet-details', { params }),
  getById: (id) => api.get(`/admin/pet-details/${id}`),
  getActive: () => api.get('/admin/pet-details/active'),
  getBySpecies: (speciesId) => api.get(`/admin/pet-details/species/${speciesId}`),
  getBySpeciesAndBreed: (speciesId, breedId) => api.get(`/admin/pet-details/species/${speciesId}/breed/${breedId}`),
  create: (data) => api.post('/admin/pet-details', data),
  update: (id, data) => api.put(`/admin/pet-details/${id}`, data),
  delete: (id) => api.delete(`/admin/pet-details/${id}`),
  restore: (id) => api.patch(`/admin/pet-details/${id}/restore`),
  getStats: () => api.get('/admin/pet-details/stats/overview')
};

// Custom Breed Requests API
const customBreedRequestsAPI = {
  list: (params = {}) => api.get('/admin/custom-breed-requests', { params }),
  getAll: (params = {}) => api.get('/admin/custom-breed-requests', { params }), // Alias for list
  getById: (id) => api.get(`/admin/custom-breed-requests/${id}`),
  getPending: () => api.get('/admin/custom-breed-requests/pending'),
  approve: (id, data) => api.patch(`/admin/custom-breed-requests/${id}/approve`, data),
  reject: (id, data) => api.patch(`/admin/custom-breed-requests/${id}/reject`, data),
  markUnderReview: (id) => api.patch(`/admin/custom-breed-requests/${id}/review`),
  setPriority: (id, data) => api.patch(`/admin/custom-breed-requests/${id}/priority`, data),
  getStats: () => api.get('/admin/custom-breed-requests/stats/overview')
};

// Admin Pets API
const petsAPI = {
  list: (params = {}) => api.get('/admin/pets', { params }),
  getAll: (params = {}) => api.get('/admin/pets', { params }), // Alias for list
  getById: (id) => api.get(`/admin/pets/${id}`),
  create: (data) => api.post('/admin/pets', data),
  update: (id, data) => api.put(`/admin/pets/${id}`, data),
  delete: (id) => api.delete(`/admin/pets/${id}`),
  restore: (id) => api.patch(`/admin/pets/${id}/restore`),
  importCSV: (formData) => api.post('/admin/pets/import-csv', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  export: () => api.get('/admin/pets/export-csv', {
    responseType: 'blob'
  }),
  downloadTemplate: () => api.get('/admin/pets/template-csv', {
    responseType: 'blob'
  }),
  getStats: () => api.get('/admin/pets/stats/overview')
};

// Medical Records API
const medicalRecordsAPI = {
  list: (params = {}) => api.get('/admin/medical-records', { params }),
  getById: (id) => api.get(`/admin/medical-records/${id}`),
  getByPet: (petId) => api.get(`/admin/medical-records/pet/${petId}`),
  getUpcoming: () => api.get('/admin/medical-records/upcoming'),
  getOverdue: () => api.get('/admin/medical-records/overdue'),
  create: (data) => api.post('/admin/medical-records', data),
  update: (id, data) => api.put(`/admin/medical-records/${id}`, data),
  delete: (id) => api.delete(`/admin/medical-records/${id}`),
  restore: (id) => api.patch(`/admin/medical-records/${id}/restore`),
  getStats: () => api.get('/admin/medical-records/stats/overview')
};

// Ownership History API
const ownershipHistoryAPI = {
  list: (params = {}) => api.get('/admin/ownership-history', { params }),
  getById: (id) => api.get(`/admin/ownership-history/${id}`),
  getByPet: (petId) => api.get(`/admin/ownership-history/pet/${petId}`),
  getByOwner: (ownerId) => api.get(`/admin/ownership-history/owner/${ownerId}`),
  getPending: () => api.get('/admin/ownership-history/pending'),
  create: (data) => api.post('/admin/ownership-history', data),
  update: (id, data) => api.put(`/admin/ownership-history/${id}`, data),
  delete: (id) => api.delete(`/admin/ownership-history/${id}`),
  restore: (id) => api.patch(`/admin/ownership-history/${id}/restore`),
  getStats: () => api.get('/admin/ownership-history/stats/overview')
};

// User Pets API
const userPetsAPI = {
  list: (params = {}) => api.get('/user/pets', { params }),
  getById: (id) => api.get(`/user/pets/${id}`),
  getSpeciesAndBreeds: () => api.get('/user/pets/species-breeds'),
  getCategories: () => api.get('/user/pets/categories'),
  getSpeciesActive: (categoryName) => api.get('/user/pets/species', { params: { category: categoryName } }),
  getBreedsBySpecies: (speciesId) => api.get(`/user/pets/breeds/${speciesId}`),
  getPetDetailsBySpeciesAndBreed: (speciesId, breedId) => api.get(`/user/pets/pet-details/${speciesId}/${breedId}`),
  create: (data) => api.post('/user/pets', data),
  update: (id, data) => api.put(`/user/pets/${id}`, data),
  delete: (id) => api.delete(`/user/pets/${id}`),
  addMedicalRecord: (id, data) => api.post(`/user/pets/${id}/medical`, data),
  addVaccination: (id, data) => api.post(`/user/pets/${id}/vaccination`, data),
  submitCustomRequest: (data) => api.post('/user/pets/custom-request', data),
  getMyCustomRequests: () => api.get('/user/pets/custom-requests/my')
};

export {
  petCategoriesAPI,
  speciesAPI,
  breedsAPI,
  petDetailsAPI,
  customBreedRequestsAPI,
  petsAPI,
  medicalRecordsAPI,
  ownershipHistoryAPI,
  userPetsAPI
};
