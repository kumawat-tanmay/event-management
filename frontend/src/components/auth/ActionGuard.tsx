'use client';

import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';

export interface ActionGuardProps {
  children: React.ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  allowedRoles?: string[];
  fallback?: React.ReactNode;
}

/**
 * 🔒 ActionGuard
 * Dynamic permission & role guard component for UI action buttons (Create, Edit, Delete, Pay, Export, etc.).
 * Renders `children` if authorized; otherwise renders `fallback` (default: `null`).
 */
export const ActionGuard: React.FC<ActionGuardProps> = ({
  children,
  permission,
  permissions,
  requireAll = false,
  allowedRoles,
  fallback = null,
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  let isAuthorized = true;

  // 1. Permission check
  if (permission) {
    isAuthorized = hasPermission(permission);
  } else if (permissions && permissions.length > 0) {
    isAuthorized = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  }

  if (!isAuthorized) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default ActionGuard;
