import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
// Derive backend origin (scheme+host+port) from API_URL
// e.g., http://localhost:5000/api -> http://localhost:5000
export const API_ORIGIN = (() => {
  try {
    const u = new URL(API_URL)
    // Remove trailing '/api' if present
    const origin = `${u.protocol}//${u.host}`
    return origin
  } catch {
    return 'http://localhost:5000'
  }
})()

// Helper to resolve media URLs that backend returns as relative paths
// Example: '/modules/petshop/uploads/file.jpg' -> 'http://localhost:5000/modules/petshop/uploads/file.jpg'
export const resolveMediaUrl = (pathOrUrl) => {
  if (!pathOrUrl) return '/placeholder-pet.svg'
  try {
    // If it's already absolute, keep it
    const u = new URL(pathOrUrl)
    return u.href
  } catch {
    // Treat as relative to backend origin
    return `${API_ORIGIN}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`
  }
}

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
  getRegistryPet: (id) => api.get(`/pets/registry/${id}`),
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
  // User pets
  getMyPets: () => api.get('/pets/my-pets'),
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

  // User adopted pets
  getMyAdoptedPets: () => api.get('/adoption/user/my-adopted-pets'),
  getMyAdoptedPet: (id) => api.get(`/adoption/user/my-adopted-pets/${id}`),
  addMedicalHistoryToAdoptedPet: (id, medicalData) => api.put(`/adoption/user/my-adopted-pets/${id}/medical-history`, medicalData),
  getMedicalHistoryOfAdoptedPet: (id) => api.get(`/adoption/user/my-adopted-pets/${id}/medical-history`),

  // User purchased pets
  getMyPurchasedPets: () => api.get('/petshop/user/my-purchased-pets'),

  // New REST alias endpoints (spec compliant)
  // Pets (public/user)
  // Use user router mounts
  listPets: (params) => api.get('/adoption/user/public/pets', { params }),
  getPet: (id) => api.get(`/adoption/user/public/pets/${id}`),
  searchPets: (params) => api.get('/adoption/user/public/pets', { params }), // same as list with filters
  // Pets (manager)
  managerCreatePet: (payload) => api.post('/adoption/manager/pets', payload),

  // Requests (applications)
  submitRequest: (payload) => api.post('/adoption/user/applications', payload),
  listMyRequests: () => api.get('/adoption/user/applications/my'),
  getMyRequest: (id) => api.get(`/adoption/user/applications/${id}`),
  cancelMyRequest: (id) => api.put(`/adoption/user/applications/${id}/cancel`),
  managerListRequests: (params) => api.get('/adoption/manager/applications', { params }),
  managerPatchRequest: (id, { status, notes, reason }) => api.patch(`/adoption/manager/applications/${id}`, { status, notes, reason }),

  // Payments (user)
  createPaymentOrder: (applicationId) => api.post('/adoption/user/payments/create-order', { applicationId }),
  verifyPayment: (payload) => api.post('/adoption/user/payments/verify', payload),

  // Documents (applicant uploads)
  uploadApplicantDocument: (file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/adoption/user/applications/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },

  // Certificates
  generateCertificate: (applicationId, agreementFile) => api.post('/adoption/manager/certificates', { applicationId, agreementFile }),
  getCertificate: (applicationId) => api.get(`/adoption/manager/certificates/${applicationId}`),
  // Add user certificate streaming endpoint
  getUserCertificate: (applicationId) => api.get(`/adoption/user/certificates/${applicationId}/file`, { responseType: 'blob' }),
  
  // Manager Store Setup
  getMyStore: () => api.get('/adoption/manager/me/store'),
  updateMyStore: (payload) => api.put('/adoption/manager/me/store', payload),
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
  // Manager: Reservations
  listReservations: (params) => api.get('/petshop/manager/reservations/enhanced', { params }),
  // Public listings (mounted under /petshop/user/... on backend)
  listPublicListings: (params) => api.get('/petshop/user/public/listings', { params }),
  getPublicListing: (id) => api.get(`/petshop/user/public/listings/${id}`),
  // Add the missing method for user-accessible items
  getUserAccessibleItem: (id) => api.get(`/petshop/user/listings/${id}`),
// Public shops (user-facing; no auth required but under /user prefix)
  listPublicShops: (params) => api.get('/petshop/user/public/shops', { params }),
  // User dashboard stats
  getUserStats: () => api.get('/petshop/user/stats'),
  createReservation: (payload) => api.post('/petshop/user/public/reservations', payload),
  createPurchaseReservation: (payload) => api.post('/petshop/user/public/reservations/purchase', payload),
  listMyReservations: () => api.get('/petshop/user/public/reservations'),
  getReservationById: (id) => api.get(`/petshop/user/public/reservations/${id}`),
  cancelReservation: (id) => api.post(`/petshop/user/public/reservations/${id}/cancel`),
  // Payments - Razorpay
  createRazorpayOrder: (payload) => api.post('/petshop/user/payments/razorpay/order', payload),
  verifyRazorpay: (payload) => api.post('/petshop/user/payments/razorpay/verify', payload),
  // Wishlist
  addToWishlist: (itemId) => api.post('/petshop/user/public/wishlist', { itemId }),
  listMyWishlist: () => api.get('/petshop/user/public/wishlist'),
  removeFromWishlist: (itemId) => api.delete(`/petshop/user/public/wishlist/${itemId}`),
  // Reviews (mounted under user/public)
  createReview: (payload) => api.post('/petshop/user/public/reviews', payload),
  getItemReviews: (itemId) => api.get(`/petshop/user/public/reviews/item/${itemId}`),
  getShopReviews: (shopId) => api.get(`/petshop/user/public/reviews/shop/${shopId}`),
  // Manager Store Setup
  getMyStore: () => api.get('/petshop/manager/me/store'),
  updateMyStore: (payload) => api.put('/petshop/manager/me/store', payload),
  // Manager: Store name change
  requestStoreNameChange: (requestedStoreName, reason='') => api.post('/petshop/manager/store-name-change', { requestedStoreName, reason }),
  // User decision routes
  confirmPurchaseDecision: (reservationId, payload) => api.post(`/petshop/user/reservations/${reservationId}/confirm-purchase`, payload),
  // Handover functions
  scheduleHandover: (reservationId, data) => api.post(`/petshop/user/payments/handover/${reservationId}/schedule`, data),
  completeHandover: (reservationId, data) => api.post(`/petshop/user/payments/handover/${reservationId}/complete`, data),
  regenerateHandoverOTP: (reservationId) => api.post(`/petshop/user/payments/handover/${reservationId}/regenerate-otp`),
  // User purchased pets
  getMyPurchasedPets: () => api.get('/petshop/user/my-purchased-pets'),
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
  // Add missing methods for EcommerceDashboard
  listProducts: (params) => api.get('/ecommerce/catalog/products', { params }),
  listOrders: (params) => api.get('/ecommerce/orders', { params }),
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
  // Store name change requests
  listStoreNameChangeRequests: (params) => api.get('/petshop/admin/store-name-change-requests', { params }),
  decideStoreNameChangeRequest: (id, decision, reason='') => api.put(`/petshop/admin/store-name-change-requests/${id}/decision`, { decision, reason }),
}

// PetShop Manager API (reservations)
export const petShopManagerAPI = {
  // Dashboard
  getStats: () => api.get('/petshop/stats'),
  getDashboardStats: () => api.get('/petshop/manager/dashboard/stats'),
  getOrders: (params) => api.get('/petshop/manager/orders', { params }),
  getSalesReport: (params) => api.get('/petshop/manager/sales-report', { params }),
  // Reservations
  listReservations: (params) => api.get('/petshop/manager/reservations/enhanced', { params }),
  updateReservationStatus: (id, status, notes) => api.put(`/petshop/manager/reservations/${id}/status`, { status, notes }),
  updateDeliveryStatus: (id, status, deliveryNotes) => api.put(`/petshop/manager/reservations/${id}/delivery`, { status, deliveryNotes, actualDate: new Date().toISOString() }),
  generateInvoice: (id) => api.get(`/petshop/manager/reservations/${id}/invoice`),
  // Reservations
  getReservationById: (id) => api.get(`/petshop/manager/reservations/${id}`),
  listReservations: (params) => api.get('/petshop/manager/reservations/enhanced', { params }),
  updateReservationStatus: (id, status, notes) => api.put(`/petshop/manager/reservations/${id}/status`, { status, notes }),
  updateDeliveryStatus: (id, status, deliveryNotes) => api.put(`/petshop/manager/reservations/${id}/delivery`, { status, deliveryNotes, actualDate: new Date().toISOString() }),
  generateInvoice: (id) => api.get(`/petshop/manager/reservations/${id}/invoice`),
  // Handover with OTP
  scheduleHandover: (id, data) => api.post(`/petshop/manager/reservations/${id}/handover/schedule`, data),
  completeHandover: (id, data) => api.post(`/petshop/manager/reservations/${id}/handover/complete`, data),
  regenerateHandoverOTP: (id) => api.post(`/petshop/manager/reservations/${id}/handover/regenerate-otp`),
  generateHandoverOTP: (id) => api.post(`/petshop/manager/reservations/${id}/handover/generate-otp`),
  verifyHandoverOTP: (id, otp) => api.post(`/petshop/manager/reservations/${id}/handover/verify-otp`, { otp }),
  // Payment approval
  approvePayment: (id, data) => api.post(`/petshop/manager/reservations/${id}/approve-payment`, data),
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
  // Manager store setup
  getMyStore: () => api.get('/temporary-care/manager/me/store'),
  updateMyStore: (payload) => api.put('/temporary-care/manager/me/store', payload),
  // Dashboard
  managerGetDashboardStats: () => api.get('/temporary-care/manager/dashboard/stats'),
  managerGetBookings: (params) => api.get('/temporary-care/manager/bookings', { params }),
  managerGetFacilities: (params) => api.get('/temporary-care/manager/facilities', { params }),
  managerGetCaregivers: (params) => api.get('/temporary-care/manager/caregivers-list', { params }),
  // Manager center
  getMyCenter: () => api.get('/temporary-care/manager/me/center'),
  saveMyCenter: (payload) => api.post('/temporary-care/manager/me/center', payload),
  // Manager requests
  managerListRequests: (params) => api.get('/temporary-care/manager/requests', { params }),
  managerDecideRequest: (id, decision) => api.put(`/temporary-care/manager/requests/${id}/decision`, { decision }),
  managerAssignRequest: (id, caregiverId) => api.post(`/temporary-care/manager/requests/${id}/assign`, { caregiverId }),
  // Manager caregivers
  listCaregivers: (params) => api.get('/temporary-care/caregivers', { params }),
  createCaregiver: (caregiverData) => api.post('/temporary-care/caregivers', caregiverData),
  updateCaregiver: (id, caregiverData) => api.put(`/temporary-care/caregivers/${id}`, caregiverData),
  // Manager care records
  getTemporaryCares: (params) => api.get('/temporary-care', { params }),
  createTemporaryCare: (temporaryCareData) => api.post('/temporary-care', temporaryCareData),
  getStats: () => api.get('/temporary-care/stats'),
  // User requests
  submitRequest: (payload) => api.post('/temporary-care/user/requests', payload),
  listMyRequests: () => api.get('/temporary-care/user/requests'),
  listMyActiveCare: () => api.get('/temporary-care/user/my-active-care'),
  listPublicCenters: () => api.get('/temporary-care/user/public/centers'),
  // Add missing methods for TemporaryCareDashboard
  listHosts: () => api.get('/temporary-care/user/public/centers'),
  listMyStays: () => api.get('/temporary-care/user/my-active-care'),
}

// Veterinary API
export const veterinaryAPI = {
  // Public appointments (for users)
  getAppointments: (params) => api.get('/veterinary/user/appointments', { params }),
  getAppointmentById: (id) => api.get(`/veterinary/user/appointments/${id}`),
  bookAppointment: (payload) => api.post('/veterinary/user/appointments/book', payload),
  cancelAppointment: (id) => api.post(`/veterinary/user/appointments/${id}/cancel`),
  // Manager store setup
  managerGetMyStore: () => api.get('/veterinary/manager/me/store'),
  managerUpdateMyStore: (payload) => api.put('/veterinary/manager/me/store', payload),
  // Manager dashboard
  managerGetDashboardStats: () => api.get('/veterinary/manager/dashboard/stats'),
  // Manager appointments
  managerGetAppointments: (params) => api.get('/veterinary/manager/appointments', { params }),
  managerGetAppointmentById: (id) => api.get(`/veterinary/manager/appointments/${id}`),
  managerCreateAppointment: (payload) => api.post('/veterinary/manager/appointments', payload),
  managerUpdateAppointment: (id, payload) => api.put(`/veterinary/manager/appointments/${id}`, payload),
  managerDeleteAppointment: (id) => api.delete(`/veterinary/manager/appointments/${id}`),
  managerGetAvailableTimeSlots: (date) => api.get('/veterinary/manager/appointments/slots/available', { params: { date } }),
  // Manager medical records
  managerGetMedicalRecords: (params) => api.get('/veterinary/manager/records', { params }),
  managerCreateMedicalRecord: (payload) => api.post('/veterinary/manager/medical-records', payload),
  managerGetMedicalRecordsByPet: (petId) => api.get(`/veterinary/manager/medical-records/pet/${petId}`),
  managerGetMedicalRecordById: (id) => api.get(`/veterinary/manager/medical-records/${id}`),
  managerUpdateMedicalRecord: (id, payload) => api.put(`/veterinary/manager/medical-records/${id}`, payload),
  managerDeleteMedicalRecord: (id) => api.delete(`/veterinary/manager/medical-records/${id}`),
  // Manager services
  managerGetServices: (params) => api.get('/veterinary/manager/services', { params }),
  managerCreateService: (payload) => api.post('/veterinary/manager/services', payload),
  managerUpdateService: (id, payload) => api.put(`/veterinary/manager/services/${id}`, payload),
  managerDeleteService: (id) => api.delete(`/veterinary/manager/services/${id}`),
  managerToggleService: (id) => api.patch(`/veterinary/manager/services/${id}/toggle`),
  // Manager staff
  managerListStaff: () => api.get('/veterinary/manager/staff'),
  managerCreateStaff: (payload) => api.post('/veterinary/manager/staff', payload),
  managerUpdateStaff: (id, payload) => api.put(`/veterinary/manager/staff/${id}`, payload),
  managerDeleteStaff: (id) => api.delete(`/veterinary/manager/staff/${id}`),
  // Manager patients
  managerGetPatients: (params) => api.get('/veterinary/manager/patients', { params }),
  managerGetPatientById: (id) => api.get(`/veterinary/manager/patients/${id}`),
  // User medical records
  userListMedicalRecordsForPet: (petId) => api.get(`/veterinary/user/pets/${petId}/medical-records`),
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
  // Soft delete (hide from users)
  hide: (id) => api.patch(`/modules/${id}/hide`),
  restore: (id) => api.patch(`/modules/${id}/restore`),
  // Deprecated hard delete endpoints (map to hide for safety)
  remove: (id) => api.patch(`/modules/${id}/hide`),
  delete: (id) => api.patch(`/modules/${id}/hide`), // Alias for compatibility
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

export const userPetsAPI = {
  list: (params = {}) => api.get('/user/pets', { params }),
  get: (id) => api.get(`/user/pets/${id}`),
  getById: (id) => api.get(`/user/pets/${id}`),
  getSpeciesAndBreeds: () => api.get('/user/pets/species-breeds'),
  getSpeciesBreedsActive: () => api.get('/user/pets/species-breeds'),
  getCategories: () => api.get('/user/pets/categories'),
  getSpeciesActive: (categoryName) => api.get('/user/pets/species', { params: { category: categoryName } }),
  getBreedsBySpecies: (speciesId) => api.get(`/user/pets/breeds/${speciesId}`),
  getPetDetailsBySpeciesAndBreed: (speciesId, breedId) => api.get(`/user/pets/pet-details/${speciesId}/${breedId}`),
  create: (data) => {
    console.log('📤 Sending pet creation request:', JSON.stringify(data, null, 2));
    return api.post('/user/pets', data)
      .then(response => {
        console.log('✅ Pet creation response received:', response);
        return response;
      })
      .catch(error => {
        console.error('❌ Pet creation error:', error);
        throw error;
      });
  },
  update: (id, data) => api.put(`/user/pets/${id}`, data),
  delete: (id) => api.delete(`/user/pets/${id}`),
  addMedicalRecord: (id, data) => api.post(`/user/pets/${id}/medical`, data),
  addVaccination: (id, data) => api.post(`/user/pets/${id}/vaccination`, data),
  getMedicalHistory: (id) => api.get(`/user/pets/${id}/medical-history`),
  getOwnershipHistory: (id) => api.get(`/user/pets/${id}/history`),
  submitCustomRequest: (data) => api.post('/user/pets/custom-request', data),
  getMyCustomRequests: () => api.get('/user/pets/custom-requests/my')
};
