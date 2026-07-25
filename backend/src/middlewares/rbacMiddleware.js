const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ success: false, message: 'User role not defined' });
    }
    
    // Check if the user's role name matches one of the allowed roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `User role ${req.user.role} is not authorized to access this route` 
      });
    }
    next();
  };
};

const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ success: false, message: 'User role not defined' });
    }

    // Owner has all permissions implicitly
    if (req.user.role === 'Owner' || req.user.permissions?.includes('*')) {
      return next();
    }

    if (!req.user.permissions || !req.user.permissions.includes(permission)) {
      return res.status(403).json({ 
        success: false, 
        message: `User lacks required permission: ${permission}` 
      });
    }
    next();
  };
};

module.exports = { authorize, requirePermission };
