/**
 * Utility functions for store management
 */

/**
 * Check if user needs to set up their store name
 * @param {Object} user - User object from AuthContext
 * @returns {boolean} - True if user needs to set up store name
 */
export const needsStoreSetup = (user) => {
  // Check if user is a manager
  const isManager = user?.role?.includes('manager') || 
                   user?.role === 'adoption_manager' || 
                   user?.role === 'petshop_manager' || 
                   user?.role === 'temporary-care_manager' || 
                   user?.role === 'veterinary_manager';
  
  // If user is a manager and has storeId but no storeName, they need setup
  return isManager && user?.storeId && !user?.storeName;
};

/**
 * Get module key from user role
 * @param {Object} user - User object from AuthContext
 * @returns {string} - Module key
 */
export const getModuleKey = (user) => {
  if (!user?.role) return 'adoption';
  
  const role = user.role.toLowerCase();
  
  if (role.includes('adoption')) return 'adoption';
  if (role.includes('petshop')) return 'petshop';
  if (role.includes('temporary-care') || role.includes('temporary_care')) return 'temporary-care';
  if (role.includes('veterinary')) return 'veterinary';
  
  // Default fallback
  return 'adoption';
};

/**
 * Get user's store information
 * @param {Object} user - User object from AuthContext
 * @returns {Object} - Store information
 */
export const getStoreInfo = (user) => {
  return {
    storeId: user?.storeId || null,
    storeName: user?.storeName || null,
    needsSetup: needsStoreSetup(user),
    moduleKey: getModuleKey(user)
  };
};

export default {
  needsStoreSetup,
  getModuleKey,
  getStoreInfo
};