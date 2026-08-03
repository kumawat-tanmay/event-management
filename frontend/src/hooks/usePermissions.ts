'use client';

import { useAuth } from '@/hooks/useAuth';
import { useMemo, useCallback } from 'react';

/**
 * Custom hook to check user permissions in the frontend UI.
 */
export const usePermissions = () => {
  const { user, isInitialized } = useAuth();
  const loading = !isInitialized;

  const permissionsList = useMemo(() => {
    if (user?.permissions && Array.isArray(user.permissions)) {
      return user.permissions;
    }
    return [];
  }, [user]);

  /**
   * Check if the current user has a specific permission.
   * System roles (Owner, Admin) bypass all checks — mirrors backend requirePermission.js.
   * Super Admins typically have the '*' permission which also bypasses all checks.
   * Module wildcard permissions (e.g., 'crm.*') are also supported.
   * 
   * @param permission - The specific permission string to check (e.g., 'users.create')
   * @returns boolean - True if allowed, false otherwise
   */
  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;

    // 1. System role bypass (mirrors backend SYSTEM_BYPASS_ROLES)
    const roleName = (typeof user.role === 'object' && user.role !== null && 'name' in user.role)
      ? (user.role as { name: string }).name
      : user.role;
    const normalizedRole = (roleName || '').toString().toLowerCase().trim();
    if (['owner', 'admin', 'super admin', 'superadmin', 'super_admin'].includes(normalizedRole)) {
      return true;
    }

    // 2. Permission array checks
    if (permissionsList.length === 0) return false;

    // Check for super admin wildcard
    if (permissionsList.includes('*')) {
      return true;
    }

    // Exact match
    if (permissionsList.includes(permission)) {
      return true;
    }

    // Module wildcard match (e.g., if checking 'users.create', check if 'users.*' exists)
    const [moduleName] = permission.split('.');
    if (permissionsList.includes(`${moduleName}.*`)) {
      return true;
    }

    return false;
  }, [user, permissionsList]);

  /**
   * Check if user has ALL of the specified permissions.
   */
  const hasAllPermissions = useCallback((permissions: string[]): boolean => {
    return permissions.every((perm) => hasPermission(perm));
  }, [hasPermission]);

  /**
   * Check if user has ANY of the specified permissions.
   */
  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    return permissions.some((perm) => hasPermission(perm));
  }, [hasPermission]);

  return {
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
  };
};
