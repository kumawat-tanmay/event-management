const mongoose = require('mongoose');
const Role = require('../models/Role');
const { PERMISSIONS, DEFAULT_ROLES } = require('../config/permissions');

// Roles that bypass all granular permission checks automatically
const SYSTEM_BYPASS_ROLES = [
  (DEFAULT_ROLES?.owner?.name || 'Owner').toLowerCase(),
  (DEFAULT_ROLES?.admin?.name || 'Admin').toLowerCase(),
  'super admin',
  'super_admin',
  'superadmin',
];

/**
 * Helper to check if permission list grants requiredPermission.
 * Supports exact match, ALL/wildcard ('*'), and module wildcards ('crm.*').
 */
const hasMatchingPermission = (userPermissions, requiredPermission) => {
  if (!Array.isArray(userPermissions) || userPermissions.length === 0) return false;

  // Global wildcard ('*' or 'ALL')
  if (
    userPermissions.includes(PERMISSIONS.ALL) ||
    userPermissions.includes('*') ||
    userPermissions.includes('ALL')
  ) {
    return true;
  }

  // Exact permission match
  if (userPermissions.includes(requiredPermission)) {
    return true;
  }

  // Module-level wildcard match (e.g. "crm.*" matches "crm.create")
  const moduleName = requiredPermission.split('.')[0];
  if (moduleName && userPermissions.includes(`${moduleName}.*`)) {
    return true;
  }

  return false;
};

/**
 * 🛡️ Granular Permission Verification Middleware
 * Enforces permission checks on protected routes for Krishna Event ERP.
 * Synchronized with config/permissions.js registry & MongoDB Custom Roles.
 */
const requirePermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      // 1. Ensure user is authenticated and active
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authorized' });
      }

      if (req.user.isDeleted || !req.user.isActive || req.user.status === 'Inactive') {
        return res.status(401).json({ success: false, message: 'Access denied. Account is disabled or deleted' });
      }

      const rawRole = req.user.role;
      const userRoleName = (typeof rawRole === 'string' ? rawRole : rawRole?.name || '').trim().toLowerCase();

      // 2. System roles (Owner, Admin, Super Admin) bypass all permission checks
      if (SYSTEM_BYPASS_ROLES.includes(userRoleName)) {
        return next();
      }

      // 3. Direct permissions attached to user object
      const userPermissions = req.user.permissions || [];
      if (hasMatchingPermission(userPermissions, requiredPermission)) {
        return next();
      }

      // 4. Dynamic Custom Role Lookup in Database (by ID, Name, or Populated Object)
      let roleDoc = null;
      if (typeof rawRole === 'object' && rawRole !== null && Array.isArray(rawRole.permissions)) {
        roleDoc = rawRole;
      } else if (rawRole && mongoose.Types.ObjectId.isValid(rawRole)) {
        roleDoc = await Role.findById(rawRole);
      } else if (typeof rawRole === 'string') {
        roleDoc = await Role.findOne({ 
          name: { $regex: new RegExp(`^${rawRole}$`, 'i') }, 
          isDeleted: false 
        });
      }

      // 5. Check Custom Role permissions
      if (roleDoc && Array.isArray(roleDoc.permissions)) {
        if (hasMatchingPermission(roleDoc.permissions, requiredPermission)) {
          return next();
        }
      }

      // 6. Access Denied
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. You lack the required permission: '${requiredPermission}'` 
      });

    } catch (error) {
      console.error('Permission evaluation error:', error);
      res.status(500).json({ success: false, message: 'Internal server error evaluating permissions' });
    }
  };
};

module.exports = requirePermission;
