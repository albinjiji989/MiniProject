// Role-based authorization middleware

// Require authentication first (req.user populated by auth middleware)
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    if (roles.length === 0) return next();
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    next();
  };
};

// Module-level authorization: admin (global) or matching manager/worker assigned to module
const authorizeModule = (moduleName) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Global admin can access everything
    if (req.user.role === 'admin') return next();

    const managerRole = `${moduleName}_manager`;
    const workerRole = `${moduleName}_worker`;

    if (req.user.role === managerRole) return next();
    if (req.user.role === workerRole && (req.user.assignedModule === moduleName || req.user.assignedModules?.includes(moduleName))) return next();

    return res.status(403).json({ success: false, message: `Access denied for module ${moduleName}` });
  };
};

module.exports = { authorize, authorizeModule };


