import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Create axios instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Export as apiClient for compatibility
export const apiClient = api

// Helper: retrieve token from multiple possible storage keys
const TOKEN_KEYS = ['token', 'authToken', 'accessToken', 'jwt', 'jwtToken', 'access_token']
const getAuthToken = () => {
  for (const k of TOKEN_KEYS) {
    const v = localStorage.getItem(k) || sessionStorage.getItem(k)
    if (v) return v
  }
  return null
}

// Helper: clear all known token keys from both local and session storage
const clearAllAuthTokens = () => {
  try {
    for (const k of TOKEN_KEYS) {
      localStorage.removeItem(k)
      sessionStorage.removeItem(k)
    }
    // also clear any cached user object if present
    localStorage.removeItem('user')
    sessionStorage.removeItem('user')
  } catch (_) {}
}

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // Allow cookie-based auth if explicitly enabled
    const useCookies = import.meta.env.VITE_API_COOKIES === 'true'
    config.withCredentials = !!useCookies
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
      clearAllAuthTokens()
      window.location.href = '/login'
    } else if (error.response?.status === 403) {
      // Soft-block: keep user logged in but surface message via event
      const msg = error.response?.data?.message || 'Access to this action is blocked by admin.'
      try { window.dispatchEvent(new CustomEvent('auth:soft-block', { detail: { message: msg } })) } catch (_) {}
      // Do not clear token; let UI disable actions
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  // Force cookies on logout so the server can clear HttpOnly session cookie if used
  logout: () => api.post('/auth/logout', {}, { withCredentials: true }),
  firebaseLogin: (userData) => api.post('/auth/firebase-login', userData),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPasswordWithOtp: (payload) => api.post('/auth/reset-password', payload),
  getMe: () => api.get('/auth/me'),
  updateProfile: (profileData) => api.put('/profile/details', profileData),
  changePassword: (passwordData) => api.put('/profile/password', passwordData),
}

// Users API
export const usersAPI = {
  // Basic CRUD operations
  getUsers: (params) => api.get('/users', { params }),
  getUser: (id) => api.get(`/users/${id}`),
  createUser: (userData) => api.post('/users', userData),
  update: (id, userData) => api.put(`/users/${id}`, userData),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData), // Alias
  delete: (id) => api.delete(`/users/${id}`),
  deleteUser: (id) => api.delete(`/users/${id}`), // Alias
  activateUser: (id) => api.put(`/users/${id}/activate`),
  getUsersByModule: (module) => api.get(`/users/module/${module}`),
  
  // Enhanced user management for admin dashboard
  getPublicUsers: (params) => api.get('/users/public', { params }),
  getUserDetails: (id) => api.get(`/users/${id}/details`),
  toggleUserStatus: (id, status) => api.put(`/users/${id}/status`, { status }),
  deleteUserPermanent: (id) => api.delete(`/users/${id}/permanent`),
  getUserActivities: (id, params) => api.get(`/users/${id}/activities`, { params }),
  getUserPets: (id) => api.get(`/users/${id}/pets`),
  getUserStats: () => api.get('/users/stats'),
  getStats: () => api.get('/users/stats'), // Alias for AdminDashboard compatibility
  // Per-user module access (block-list only; default is allow)
  setModuleAccess: (userId, { blockedModules = [] }) =>
    api.put(`/admin/users/${userId}/module-access`, { blockedModules }),
  
  // Bulk operations
  bulkUpdateStatus: (userIds, status) => api.put('/users/bulk/status', { userIds, status }),
  bulkDelete: (userIds) => api.delete('/users/bulk/delete', { data: { userIds } }),
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
  getStats: () => api.get('/admin/pets/stats/overview'),
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
  
  // Admin Analytics
  getAdminStats: () => api.get('/adoption/admin/stats'),
  getAllAdoptions: (params) => api.get('/adoption/admin/adoptions', { params }),
  getPaymentReports: (params) => api.get('/adoption/admin/payments', { params }),
  getAnalytics: () => api.get('/adoption/admin/analytics'),
  getManagerAnalytics: () => api.get('/adoption/admin/manager-analytics'),
  getUserAnalytics: () => api.get('/adoption/admin/user-analytics'),
  getPetAnalytics: () => api.get('/adoption/admin/pet-analytics'),
}

// PetShop API
export const petShopAPI = {
  getStats: () => api.get('/petshop/stats'),
  listAnimals: (params) => api.get('/petshop/animals', { params }),
  listPetShops: (params) => api.get('/petshop', { params }),
  getPetShop: (id) => api.get(`/petshop/${id}`),
  createPetShop: (petShopData) => api.post('/petshop', petShopData),
  updatePetShop: (id, petShopData) => api.put(`/petshop/${id}`, petShopData),
  addPetToPetShop: (id, petData) => api.post(`/petshop/${id}/pets`, petData),
  addProduct: (id, productData) => api.post(`/petshop/${id}/products`, productData),
  addService: (id, serviceData) => api.post(`/petshop/${id}/services`, serviceData),
  // Manager: Purchase Orders
  listOrders: (params) => api.get('/petshop/orders', { params }),
  createOrder: (payload) => api.post('/petshop/orders', payload),
  getOrder: (id) => api.get(`/petshop/orders/${id}`),
  updateOrder: (id, payload) => api.put(`/petshop/orders/${id}`, payload),
  submitOrder: (id) => api.post(`/petshop/orders/${id}/submit`),
  receiveOrder: (id) => api.post(`/petshop/orders/${id}/receive`),
  getInvoice: (id) => api.get(`/petshop/orders/${id}/invoice`),
  // Manager: Inventory
  listInventory: (params) => api.get('/petshop/inventory', { params }),
  getInventoryItem: (id) => api.get(`/petshop/inventory/${id}`),
  updateInventoryItem: (id, payload) => api.put(`/petshop/inventory/${id}`, payload),
  deleteInventoryItem: (id) => api.delete(`/petshop/inventory/${id}`),
  uploadInventoryImage: (id, file, { caption = '', isPrimary = false } = {}) => {
    const form = new FormData()
    form.append('file', file)
    form.append('caption', caption)
    form.append('isPrimary', String(isPrimary))
    return api.post(`/petshop/inventory/${id}/images`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  // Public listings
  listPublicListings: (params) => api.get('/petshop/public/listings', { params }),
  getPublicListing: (id) => api.get(`/petshop/public/listings/${id}`),
  createReservation: (payload) => api.post('/petshop/public/reservations', payload),
  listReservations: () => api.get('/petshop/public/reservations'),
  cancelReservation: (id) => api.post(`/petshop/public/reservations/${id}/cancel`),
  // Payments - Razorpay
  createRazorpayOrder: (payload) => api.post('/petshop/payments/razorpay/order', payload),
  verifyRazorpay: (payload) => api.post('/petshop/payments/razorpay/verify', payload),
  // Wishlist
  addToWishlist: (itemId) => api.post('/petshop/public/wishlist', { itemId }),
  listMyWishlist: () => api.get('/petshop/public/wishlist'),
  removeFromWishlist: (itemId) => api.delete(`/petshop/public/wishlist/${itemId}`),
  // Reviews
  createReview: (payload) => api.post('/petshop/public/reviews', payload),
  getItemReviews: (itemId) => api.get(`/petshop/public/reviews/item/${itemId}`),
  getShopReviews: (shopId) => api.get(`/petshop/public/reviews/shop/${shopId}`),
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

// PetShop Admin API
export const petShopAdminAPI = {
  getSummary: () => api.get('/petshop/admin/analytics/summary'),
  getSpeciesBreakdown: () => api.get('/petshop/admin/analytics/species-breakdown'),
  getSalesSeries: (days = 14) => api.get('/petshop/admin/analytics/sales-series', { params: { days } }),
  listReservations: (params) => api.get('/petshop/admin/reservations', { params }),
  updateReservationStatus: (id, status) => api.put(`/petshop/admin/reservations/${id}/status`, { status }),
  // New admin oversight
  listShops: (params) => api.get('/petshop/admin/shops', { params }),
  updateShopStatus: (id, payload) => api.put(`/petshop/admin/shops/${id}/status`, payload),
  listAllListings: (params) => api.get('/petshop/admin/listings', { params }),
  removeListing: (id) => api.delete(`/petshop/admin/listings/${id}`),
  getSalesReport: (params) => api.get('/petshop/admin/reports/sales', { params }),
  // Orders auditing
  listOrders: (params) => api.get('/petshop/admin/orders', { params }),
  transferOwnership: (orderId) => api.post(`/petshop/admin/orders/${orderId}/transfer-ownership`),
}

// PetShop Manager API (reservations)
export const petShopManagerAPI = {
  listReservations: (params) => api.get('/petshop/manager/reservations', { params }),
  updateReservationStatus: (id, status) => api.put(`/petshop/manager/reservations/${id}/status`, { status }),
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

// Pet System APIs
export * from './petSystemAPI'

// Modules API
export const modulesAPI = {
  list: () => api.get('/modules'),
  getAll: () => api.get('/modules'), // Alias for compatibility
  listAdmin: () => api.get('/modules/admin'),
  create: (payload) => api.post('/modules', payload),
  update: (id, payload) => api.patch(`/modules/${id}`, payload),
  updateStatus: (id, { status, message }) => api.patch(`/modules/${id}/status`, { status, message }),
  remove: (id) => api.delete(`/modules/${id}`),
  delete: (id) => api.delete(`/modules/${id}`), // Alias for compatibility
  reorder: (modules) => api.patch('/modules/reorder', { modules })
}

// Roles API
export const rolesAPI = {
  list: () => api.get('/roles'),
  get: (id) => api.get(`/roles/${id}`),
  create: (roleData) => api.post('/roles', roleData),
  update: (id, roleData) => api.put(`/roles/${id}`, roleData),
  delete: (id) => api.delete(`/roles/${id}`),
  getPermissions: (id) => api.get(`/roles/${id}/permissions`),
  updatePermissions: (id, permissions) => api.put(`/roles/${id}/permissions`, { permissions }),
}

// Permissions API
export const permissionsAPI = {
  list: () => api.get('/permissions'),
  get: (id) => api.get(`/permissions/${id}`),
  create: (permissionData) => api.post('/permissions', permissionData),
  update: (id, permissionData) => api.put(`/permissions/${id}`, permissionData),
  delete: (id) => api.delete(`/permissions/${id}`),
}

// System Logs API
export const systemLogsAPI = {
  list: (params) => api.get('/core/logs', { params }),
  resolve: (id, resolution) => api.put(`/core/logs/${id}/resolve`, { resolution })
}

// Managers API (unified)
export const managersAPI = {
  list: () => api.get('/admin/managers'),
  create: (payload) => api.post('/admin/managers', payload),
  update: (id, payload) => api.put(`/admin/managers/${id}`, payload),
  remove: (id) => api.delete(`/admin/managers/${id}`),
  invite: (payload) => api.post('/admin/invite-module-manager', payload),
  verify: (payload) => api.post('/admin/verify-module-manager', payload)
}

// Species API
export const speciesAPI = {
  list: () => api.get('/admin/species'),
  create: (speciesData) => api.post('/admin/species', speciesData),
  update: (id, speciesData) => api.put(`/admin/species/${id}`, speciesData),
  delete: (id) => api.delete(`/admin/species/${id}`),
  getStats: () => api.get('/admin/species/stats/overview'),
}

// Breeds API
export const breedsAPI = {
  list: () => api.get('/admin/breeds'),
  create: (breedData) => api.post('/admin/breeds', breedData),
  update: (id, breedData) => api.put(`/admin/breeds/${id}`, breedData),
  delete: (id) => api.delete(`/admin/breeds/${id}`),
  getStats: () => api.get('/admin/breeds/stats/overview'),
}

// Custom Breed Requests API
export const customBreedRequestsAPI = {
  list: () => api.get('/admin/custom-breed-requests'),
  create: (requestData) => api.post('/admin/custom-breed-requests', requestData),
  update: (id, requestData) => api.put(`/admin/custom-breed-requests/${id}`, requestData),
  delete: (id) => api.delete(`/admin/custom-breed-requests/${id}`),
  approve: (id) => api.put(`/admin/custom-breed-requests/${id}/approve`),
  reject: (id) => api.put(`/admin/custom-breed-requests/${id}/reject`),
  getStats: () => api.get('/admin/custom-breed-requests/stats/overview'),
}
