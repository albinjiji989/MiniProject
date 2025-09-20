const UserDetails = require('../models/UserDetails');

/**
 * Middleware to extract store information for module managers
 * Adds storeId, storeName, and storeLocation to req.user
 */
const storeAuth = async (req, res, next) => {
  try {
    // Only apply to module managers
    if (!req.user || !req.user.role || !req.user.role.includes('_manager')) {
      return next();
    }

    // Get user details with store information
    const userDetails = await UserDetails.findOne({ userId: req.user.id });
    
    if (userDetails) {
      req.user.storeId = userDetails.storeId;
      req.user.storeName = userDetails.storeName;
      req.user.storeLocation = userDetails.storeLocation;
      req.user.assignedModule = userDetails.assignedModule;
    }

    next();
  } catch (error) {
    console.error('Store auth middleware error:', error);
    next();
  }
};

module.exports = storeAuth;


