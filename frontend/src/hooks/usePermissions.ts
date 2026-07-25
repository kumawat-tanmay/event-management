'use client';

import { useAuth } from '@/hooks/useAuth';
import { useMemo } from 'react';

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
   * Super Admins (or Owners) typically have the '*' permission which bypasses all checks.
   * Module wildcard permissions (e.g., 'crm.*') are also supported.
   * 
   * @param permission - The specific permission string to check (e.g., 'users.create')
   * @returns boolean - True if allowed, false otherwise
   */
  const hasPermission = (permission: string): boolean => {
    if (!user || permissionsList.length === 0) return false;

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
  };

  /**
   * Check if user has ALL of the specified permissions.
   */
  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every((perm) => hasPermission(perm));
  };

  /**
   * Check if user has ANY of the specified permissions.
   */
  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some((perm) => hasPermission(perm));
  };

  return {
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
  };
};
