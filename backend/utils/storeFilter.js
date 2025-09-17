/**
 * Utility functions for store-based data filtering
 */

/**
 * Get store filter for database queries
 * @param {Object} user - Authenticated user object
 * @returns {Object} - MongoDB filter object
 */
const getStoreFilter = (user) => {
  // Super admin can see all data
  if (user.role === 'super_admin') {
    return {};
  }

  // Module admins can only see their store's data
  if (user.role && user.role.includes('_admin') && user.storeId) {
    return { storeId: user.storeId };
  }

  // Public users can only see their own data
  if (user.role === 'public_user') {
    return { userId: user.id };
  }

  // Default: no access
  return { _id: null }; // This will return no results
};

/**
 * Add store information to data before sending to client
 * @param {Object} data - Data object to enhance
 * @param {Object} user - Authenticated user object
 * @returns {Object} - Enhanced data object
 */
const addStoreInfo = (data, user) => {
  if (user.storeId) {
    return {
      ...data,
      storeId: user.storeId,
      storeName: user.storeName,
      storeLocation: user.storeLocation
    };
  }
  return data;
};

/**
 * Validate store access for a specific resource
 * @param {Object} resource - Resource to check
 * @param {Object} user - Authenticated user object
 * @returns {boolean} - Whether user has access
 */
const hasStoreAccess = (resource, user) => {
  // Super admin has access to everything
  if (user.role === 'super_admin') {
    return true;
  }

  // Module admins can only access their store's resources
  if (user.role && user.role.includes('_admin')) {
    return resource.storeId === user.storeId;
  }

  // Public users can only access their own resources
  if (user.role === 'public_user') {
    return resource.userId === user.id;
  }

  return false;
};

module.exports = {
  getStoreFilter,
  addStoreInfo,
  hasStoreAccess
};


