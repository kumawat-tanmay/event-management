'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import RoleGuard from '@/components/auth/RoleGuard';

/**
 * Route Permission Mapping
 * Synchronized directly with SideNavBar.tsx erpNavLinks & RBAC permission system.
 * Sorted by prefix length descending to match most specific path first.
 */
const routePrefixes = [
  // Dashboard & Utilities
  { prefix: '/calendar', permission: 'operations.view' },
  { prefix: '/chat', permission: 'dashboard.view' },
  
  // CRM & Parties
  { prefix: '/crm', permission: 'crm.view' },
  
  // Sales & Bookings
  { prefix: '/operations/quotations', permission: 'quotations.view' },
  { prefix: '/operations/bookings', permission: 'bookings.view' },
  { prefix: '/operations/reservation', permission: 'bookings.view' },
  
  // Event Execution
  { prefix: '/events', permission: 'operations.view' },
  
  // Inventory
  { prefix: '/inventory', permission: 'inventory.view' },
  
  // HR & Payroll
  { prefix: '/hr', permission: 'hr.view' },
  
  // Accounts & Finance
  { prefix: '/finance', permission: 'finance.view' },
  { prefix: '/accounts', permission: 'finance.view' },
  
  // Logistics & Warehouses
  { prefix: '/logistics', permission: 'warehouses.view' },
  { prefix: '/warehouses', permission: 'warehouses.view' },
  
  // Purchases
  { prefix: '/purchases', permission: 'purchases.view' },
  
  // Analytics & Reports
  { prefix: '/reports', permission: 'reports.view' },
  
  // Settings & System Management
  { prefix: '/settings/roles', permission: 'roles.view' },
  { prefix: '/settings/users', permission: 'users.view' },
  { prefix: '/settings/profile', permission: 'dashboard.view' },
  { prefix: '/settings/company', permission: 'dashboard.view' },
  { prefix: '/settings/preferences', permission: 'dashboard.view' },
  { prefix: '/settings', permission: 'users.view' },
].sort((a, b) => b.prefix.length - a.prefix.length);

export default function RoutePermissionGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // If we're exactly at root dashboard, check dashboard.view
  if (pathname === '/' || pathname === '/dashboard') {
    return <RoleGuard permission="dashboard.view">{children}</RoleGuard>;
  }

  // Find the longest matching prefix for the current path
  const matchedRoute = routePrefixes.find(route => pathname.startsWith(route.prefix));

  if (matchedRoute) {
    return <RoleGuard permission={matchedRoute.permission}>{children}</RoleGuard>;
  }

  // Default: allow access if no specific rule matched
  return <>{children}</>;
}
