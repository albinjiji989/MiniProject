/**
 * Middleware to check if manager has access to specific module
 * Usage: moduleAccess('ecommerce') or moduleAccess(['ecommerce', 'temporary-care'])
 */
const Module = require('../models/Module');

const moduleAccess = (requiredModules) => {
  return async (req, res, next) => {
    try {
      // Only apply to managers
      if (req.user.role !== 'manager') {
        return next();
      }

      // Ensure user has assignedModules populated
      if (!req.user.assignedModules || req.user.assignedModules.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'No modules assigned to this manager'
        });
      }

      // Convert to array if single module provided
      const requiredModulesArray = Array.isArray(requiredModules) 
        ? requiredModules 
        : [requiredModules];

      // Get module keys from user's assignedModules
      const userModuleKeys = req.user.assignedModules.map(module => 
        typeof module === 'object' ? module.key : module
      );

      // Check if user has at least one required module
      const hasAccess = requiredModulesArray.some(moduleKey => 
        userModuleKeys.includes(moduleKey)
      );

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: `Access denied. This feature requires one of these modules: ${requiredModulesArray.join(', ')}`,
          assignedModules: userModuleKeys
        });
      }

      // Attach storeId to request for easy filtering
      if (req.user.storeInfo && req.user.storeInfo.storeId) {
        req.storeId = req.user.storeInfo.storeId;
      }

      next();
    } catch (error) {
      console.error('Module access middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking module access',
        error: error.message
      });
    }
  };
};

module.exports = moduleAccess;
