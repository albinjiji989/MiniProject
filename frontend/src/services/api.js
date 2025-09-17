import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPasswordWithOtp: (payload) => api.post('/auth/reset-password', payload),
  getMe: () => api.get('/auth/me'),
  updateProfile: (profileData) => api.put('/profile/details', profileData),
  changePassword: (passwordData) => api.put('/profile/password', passwordData),
}

// Users API
export const usersAPI = {
  getUsers: (params) => api.get('/users', { params }),
  getUser: (id) => api.get(`/users/${id}`),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
  activateUser: (id) => api.put(`/users/${id}/activate`),
  getUsersByModule: (module) => api.get(`/users/module/${module}`),
}

// Pets API
export const petsAPI = {
  getPets: (params) => api.get('/pets', { params }),
  getPet: (id) => api.get(`/pets/${id}`),
  createPet: (petData) => api.post('/pets', petData),
  updatePet: (id, petData) => api.put(`/pets/${id}`, petData),
  deletePet: (id) => api.delete(`/pets/${id}`),
  addMedicalHistory: (id, medicalData) => api.put(`/pets/${id}/medical-history`, medicalData),
  addVaccination: (id, vaccinationData) => api.put(`/pets/${id}/vaccination`, vaccinationData),
  addOwnership: (id, ownerData) => api.put(`/pets/${id}/owners`, ownerData),
  addMedication: (id, medicationData) => api.put(`/pets/${id}/medications`, medicationData),
  getHistory: (id) => api.get(`/pets/${id}/history`),
  searchNearby: (params) => api.get('/pets/search/nearby', { params }),
  getChangeLog: (id) => api.get(`/pets/${id}/changelog`),
}

// Adoption API
export const adoptionAPI = {
  getAdoptions: (params) => api.get('/adoption', { params }),
  getAdoption: (id) => api.get(`/adoption/${id}`),
  createAdoption: (adoptionData) => api.post('/adoption', adoptionData),
  updateStatus: (id, statusData) => api.put(`/adoption/${id}/status`, statusData),
  completeAdoption: (id, completionData) => api.put(`/adoption/${id}/complete`, completionData),
  addFollowUp: (id, followUpData) => api.post(`/adoption/${id}/follow-up`, followUpData),
  getStats: () => api.get('/adoption/stats/overview'),
}

// Shelter API
export const shelterAPI = {
  getStats: () => api.get('/shelter/stats'),
  listAnimals: (params) => api.get('/shelter/animals', { params }),
  listShelters: (params) => api.get('/shelter', { params }),
  getShelter: (id) => api.get(`/shelter/${id}`),
  createShelter: (shelterData) => api.post('/shelter', shelterData),
  updateShelter: (id, shelterData) => api.put(`/shelter/${id}`, shelterData),
  addPet: (id, petData) => api.post(`/shelter/${id}/pets`, petData),
}

// Rescue API
export const rescueAPI = {
  getRescues: (params) => api.get('/rescue', { params }),
  getRescue: (id) => api.get(`/rescue/${id}`),
  createRescue: (rescueData) => api.post('/rescue', rescueData),
  assignRescue: (id, assignmentData) => api.put(`/rescue/${id}/assign`, assignmentData),
}

// E-commerce API
export const ecommerceAPI = {
  getProducts: (params) => api.get('/ecommerce/products', { params }),
  getProduct: (id) => api.get(`/ecommerce/products/${id}`),
  createProduct: (productData) => api.post('/ecommerce/products', productData),
  updateProduct: (id, productData) => api.put(`/ecommerce/products/${id}`, productData),
  deleteProduct: (id) => api.delete(`/ecommerce/products/${id}`),
  getOrders: (params) => api.get('/ecommerce/orders', { params }),
  getOrder: (id) => api.get(`/ecommerce/orders/${id}`),
  updateOrderStatus: (id, statusData) => api.put(`/ecommerce/orders/${id}/status`, statusData),
  getAnalyticsSummary: () => api.get('/ecommerce/admin/analytics/summary'),
  getSalesSeries: (days = 14) => api.get('/ecommerce/admin/analytics/sales-series', { params: { days } }),
}

// Ecommerce Public + Cart API
export const shopAPI = {
  listProducts: (params) => api.get('/ecommerce/catalog/products', { params }),
  getCart: () => api.get('/ecommerce/cart'),
  addToCart: (productId, quantity = 1) => api.post('/ecommerce/cart', { productId, quantity }),
  updateCartItem: (itemId, quantity) => api.put(`/ecommerce/cart/items/${itemId}`, { quantity }),
  removeCartItem: (itemId) => api.delete(`/ecommerce/cart/items/${itemId}`),
  checkout: () => api.post('/ecommerce/checkout'),
}


// Donation API removed

// Ecommerce Admin: workers management
export const ecommerceAdminAPI = {
  listWorkers: (params) => api.get('/ecommerce/admin/workers', { params }),
  createWorker: (payload) => api.post('/ecommerce/admin/workers', payload),
  updateWorker: (id, payload) => api.patch(`/ecommerce/admin/workers/${id}`, payload),
  deleteWorker: (id) => api.delete(`/ecommerce/admin/workers/${id}`),
}

// Pharmacy API
export const pharmacyAPI = {
  getMedications: (params) => api.get('/pharmacy/medications', { params }),
  getMedication: (id) => api.get(`/pharmacy/medications/${id}`),
  createMedication: (medicationData) => api.post('/pharmacy/medications', medicationData),
  updateMedication: (id, medicationData) => api.put(`/pharmacy/medications/${id}`, medicationData),
  deleteMedication: (id) => api.delete(`/pharmacy/medications/${id}`),
  getPrescriptions: (params) => api.get('/pharmacy/prescriptions', { params }),
  getPrescription: (id) => api.get(`/pharmacy/prescriptions/${id}`),
  createPrescription: (prescriptionData) => api.post('/pharmacy/prescriptions', prescriptionData),
  dispensePrescription: (id, dispenseData) => api.put(`/pharmacy/prescriptions/${id}/dispense`, dispenseData),
}

// Boarding API removed

// Temporary Care API
export const temporaryCareAPI = {
  getStats: () => api.get('/temporary-care/stats'),
  listCareRequests: (params) => api.get('/temporary-care', { params }),
  listCaregivers: (params) => api.get('/temporary-care/caregivers', { params }),
  createCareRequest: (careData) => api.post('/temporary-care', careData),
  getTemporaryCares: (params) => api.get('/temporary-care', { params }),
  getTemporaryCare: (id) => api.get(`/temporary-care/${id}`),
  createTemporaryCare: (temporaryCareData) => api.post('/temporary-care', temporaryCareData),
  updateTemporaryCare: (id, temporaryCareData) => api.put(`/temporary-care/${id}`, temporaryCareData),
  getCaregivers: (params) => api.get('/temporary-care/caregivers', { params }),
  createCaregiver: (caregiverData) => api.post('/temporary-care/caregivers', caregiverData),
  updateCaregiver: (id, caregiverData) => api.put(`/temporary-care/caregivers/${id}`, caregiverData),
}

// Veterinary API
export const veterinaryAPI = {
  getClinics: (params) => api.get('/veterinary/clinics', { params }),
  getClinic: (id) => api.get(`/veterinary/clinics/${id}`),
  createClinic: (clinicData) => api.post('/veterinary/clinics', clinicData),
  updateClinic: (id, clinicData) => api.put(`/veterinary/clinics/${id}`, clinicData),
  getAppointments: (params) => api.get('/veterinary/appointments', { params }),
  getAppointment: (id) => api.get(`/veterinary/appointments/${id}`),
  createAppointment: (appointmentData) => api.post('/veterinary/appointments', appointmentData),
  updateAppointment: (id, appointmentData) => api.put(`/veterinary/appointments/${id}`, appointmentData),
  getMedicalRecords: (params) => api.get('/veterinary/medical-records', { params }),
  getMedicalRecord: (id) => api.get(`/veterinary/medical-records/${id}`),
  createMedicalRecord: (medicalRecordData) => api.post('/veterinary/medical-records', medicalRecordData),
  updateMedicalRecord: (id, medicalRecordData) => api.put(`/veterinary/medical-records/${id}`, medicalRecordData),
}

// Export api as named export as well
export { api }

export default api
