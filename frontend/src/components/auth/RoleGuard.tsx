'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export type ERPRole = 'owner' | 'admin' | 'manager' | 'store_manager' | 'accountant' | 'supervisor' | 'driver' | 'staff' | string;

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: ERPRole[];
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
}

/**
 * 🛡️ RoleGuard
 * Restricts access based on user role or granular permissions in Krishna Event ERP.
 */
const RoleGuard: React.FC<RoleGuardProps> = ({ 
  children, 
  allowedRoles, 
  permission, 
  permissions, 
  requireAll = false 
}) => {
  const { user, isInitialized } = useAuth();
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  if (!isInitialized) return null;

  const userRoleRaw = user?.role;
  const userRoleStr = (typeof userRoleRaw === 'object' && userRoleRaw !== null && 'name' in userRoleRaw) 
    ? (userRoleRaw as {name: string}).name 
    : (typeof userRoleRaw === 'string' ? userRoleRaw : 'staff');
  
  const normalizedUserRole = userRoleStr.toLowerCase();

  let isAuthorized = true;

  // 1. Role Check
  if (allowedRoles && allowedRoles.length > 0) {
    if (!user || !allowedRoles.some(r => r.toLowerCase() === normalizedUserRole)) {
      isAuthorized = false;
    }
  }

  // 2. Permission Check
  if (isAuthorized && user) {
    if (permission) {
      isAuthorized = hasPermission(permission);
    } else if (permissions && permissions.length > 0) {
      isAuthorized = requireAll 
        ? hasAllPermissions(permissions) 
        : hasAnyPermission(permissions);
    }
  }

  if (!user || !isAuthorized) {
    return (
      <section
        className="h-full min-h-[70vh] w-full flex flex-col items-center justify-center bg-transparent p-6 text-center"
        aria-labelledby="access-denied-title"
      >
        <div className="max-w-md w-full bg-card rounded-2xl shadow-sm border border-border/50 p-8 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
            <ShieldAlert 
              className="w-8 h-8 text-destructive" 
              aria-hidden="true"
            />
          </div>
          
          <h1 
            id="access-denied-title"
            className="text-2xl font-semibold text-foreground mb-3"
          >
            Access Denied
          </h1>
          
          <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
            You don't have the required permissions to view this section of the Krishna Event ERP. 
            If you believe this is an error, please contact your administrator.
          </p>

          <Link
            href="/"
            className="w-full inline-flex items-center justify-center h-10 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Return to Dashboard"
          >
            Return to Dashboard
          </Link>
        </div>
      </section>
    );
  }

  return <>{children}</>;
};

export default RoleGuard;
