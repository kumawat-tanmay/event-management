'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import RoleGuard from '@/components/auth/RoleGuard';

/**
 * Route Permission Mapping
 * 100% Exact Mirror of SideNavBar.tsx erpNavLinks & RBAC permission system.
 * Sorted by prefix length descending so child routes match before parent routes.
 */
const routePrefixes = [
  // Calendar
  { prefix: '/calendar', permission: 'operations.view' },

  // CRM & Parties
  { prefix: '/crm/customers', permission: 'crm.view' },
  { prefix: '/crm/leads', permission: 'crm.view' },
  { prefix: '/crm/site-visits', permission: 'crm.view' },
  { prefix: '/crm', permission: 'crm.view' },

  // Sales & Bookings
  { prefix: '/operations/quotations', permission: 'quotations.view' },
  { prefix: '/operations/bookings', permission: 'bookings.view' },
  { prefix: '/operations/reservation', permission: 'bookings.view' },
  { prefix: '/sales', permission: 'bookings.view' },

  // Event Execution
  { prefix: '/events/list', permission: 'operations.view' },
  { prefix: '/events/verification', permission: 'operations.view' },
  { prefix: '/events/return', permission: 'operations.view' },
  { prefix: '/events', permission: 'operations.view' },

  // Inventory
  { prefix: '/inventory/items', permission: 'inventory.view' },
  { prefix: '/inventory/warehouse-layout', permission: 'inventory.view' },
  { prefix: '/inventory/ledger', permission: 'inventory.view' },
  { prefix: '/inventory', permission: 'inventory.view' },

  // HR & Payroll
  { prefix: '/hr/staff', permission: 'hr.view' },
  { prefix: '/hr/vehicles', permission: 'hr.view' },
  { prefix: '/hr', permission: 'hr.view' },

  // Accounts & Finance
  { prefix: '/finance/payments', permission: 'finance.view' },
  { prefix: '/finance/expenses', permission: 'finance.view' },
  { prefix: '/finance/cashbook', permission: 'finance.view' },
  { prefix: '/finance/bankbook', permission: 'finance.view' },
  { prefix: '/finance/invoices', permission: 'finance.view' },
  { prefix: '/accounts', permission: 'finance.view' },

  // Logistics & Assets
  { prefix: '/logistics/warehouses', permission: 'warehouses.view' },
  { prefix: '/logistics/dispatches', permission: 'warehouses.view' },
  { prefix: '/logistics/transfer', permission: 'warehouses.view' },
  { prefix: '/logistics', permission: 'warehouses.view' },

  // Analytics
  { prefix: '/reports', permission: 'reports.view' },

  // Settings
  { prefix: '/settings/roles', permission: 'roles.view' },
  { prefix: '/settings/users', permission: 'users.view' },
  { prefix: '/settings/company', permission: 'dashboard.view' },
  { prefix: '/settings/profile', permission: 'dashboard.view' },
  { prefix: '/settings', permission: 'users.view' },
].sort((a, b) => b.prefix.length - a.prefix.length);

export default function RoutePermissionGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Root dashboard access check
  if (pathname === '/' || pathname === '/dashboard') {
    return <RoleGuard permission="dashboard.view">{children}</RoleGuard>;
  }

  // Find the longest matching prefix for the current path
  const matchedRoute = routePrefixes.find((route) => pathname.startsWith(route.prefix));

  if (matchedRoute) {
    return <RoleGuard permission={matchedRoute.permission}>{children}</RoleGuard>;
  }

  // Default: allow access if no specific rule matched
  return <>{children}</>;
}
