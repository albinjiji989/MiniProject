const jwt = require('jsonwebtoken');
const User = require('../core/models/User');
const UserDetails = require('../models/UserDetails');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided, authorization denied' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.user.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token is not valid' 
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: 'Account is deactivated' 
      });
    }

    // Get user details for additional information
    const userDetails = await UserDetails.findOne({ userId: user._id });

    // Add role and store information to user object
    req.user = {
      ...user.toObject(),
      id: user._id.toString(), // ensure compatibility with routes expecting req.user.id
      role: user.role,
      assignedModule: userDetails ? userDetails.assignedModule : null,
      storeId: userDetails ? userDetails.storeId : null,
      storeName: userDetails ? userDetails.storeName : null,
      storeLocation: userDetails ? userDetails.storeLocation : null
    };
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Token is not valid' 
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Insufficient permissions' 
      });
    }

    next();
  };
};

const authorizeModule = (moduleName) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    // Admin can access everything
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user has access to the specific module
    const moduleManagerRole = `${moduleName}_manager`;
    const moduleWorkerRole = `${moduleName}_worker`;
    if (
      req.user.role === moduleManagerRole ||
      req.user.assignedModule === moduleName ||
      req.user.role === moduleWorkerRole
    ) {
      return next();
    }

    return res.status(403).json({ 
      success: false, 
      message: `Access denied. You don't have permission to access ${moduleName} module` 
    });
  };
};

module.exports = { auth, authorize, authorizeModule };
