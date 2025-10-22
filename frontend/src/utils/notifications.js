// Utility functions for handling notifications and user feedback

export const showSuccessMessage = (message) => {
  // In a real implementation, this would integrate with a notification system
  console.log('SUCCESS:', message)
  // Example: toast.success(message) if using react-toastify
  alert(`Success: ${message}`)
}

export const showErrorMessage = (message) => {
  console.log('ERROR:', message)
  // Example: toast.error(message) if using react-toastify
  alert(`Error: ${message}`)
}

export const showInfoMessage = (message) => {
  console.log('INFO:', message)
  // Example: toast.info(message) if using react-toastify
  alert(`Info: ${message}`)
}

export const showWarningMessage = (message) => {
  console.log('WARNING:', message)
  // Example: toast.warn(message) if using react-toastify
  alert(`Warning: ${message}`)
}

// Handle API errors consistently
export const handleApiError = (error, defaultMessage = 'An error occurred') => {
  let message = defaultMessage
  
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response
    if (data && data.message) {
      message = data.message
    } else if (status === 400) {
      message = 'Bad request. Please check your input.'
    } else if (status === 401) {
      message = 'Unauthorized. Please log in again.'
    } else if (status === 403) {
      message = 'Access forbidden. You do not have permission.'
    } else if (status === 404) {
      message = 'Resource not found.'
    } else if (status >= 500) {
      message = 'Server error. Please try again later.'
    }
  } else if (error.request) {
    // Request was made but no response received
    message = 'Network error. Please check your connection.'
  } else {
    // Something else happened
    message = error.message || defaultMessage
  }
  
  showErrorMessage(message)
  return message
}

// Format currency
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// Format date
export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

// Format date and time
export const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Format age
export const formatAge = (age, ageUnit) => {
  if (!age) return 'Age not specified'
  if (ageUnit === 'months' && age >= 12) {
    const years = Math.floor(age / 12)
    const months = age % 12
    return `${years} yr${years > 1 ? 's' : ''}${months > 0 ? ` ${months} mo` : ''}`
  }
  return `${age} ${ageUnit || 'yr'}${age > 1 && ageUnit ? (ageUnit.endsWith('s') ? '' : 's') : ''}`
}

// Validate email
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

// Validate phone number (Indian format)
export const validatePhone = (phone) => {
  const re = /^[6-9]\d{9}$/
  return re.test(phone)
}

// Debounce function for search inputs
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}