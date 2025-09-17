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

// Module-level authorization: super_admin or matching admin/worker assigned to module
const authorizeModule = (moduleName) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (req.user.role === 'super_admin') return next();

    const adminRole = `${moduleName}_admin`;
    const workerRole = `${moduleName}_worker`;

    if (req.user.role === adminRole) return next();
    if (req.user.role === workerRole && (req.user.assignedModule === moduleName || req.user.assignedModules?.includes(moduleName))) return next();

    return res.status(403).json({ success: false, message: `Access denied for module ${moduleName}` });
  };
};

module.exports = { authorize, authorizeModule };


