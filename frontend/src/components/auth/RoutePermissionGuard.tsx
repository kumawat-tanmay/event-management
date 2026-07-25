'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import RoleGuard from '@/components/auth/RoleGuard';

const routePrefixes = [
  { prefix: '/calendar', permission: 'operations.view' },
  { prefix: '/crm', permission: 'crm.view' },
  { prefix: '/operations/quotations', permission: 'quotations.view' },
  { prefix: '/operations/bookings', permission: 'bookings.view' },
  { prefix: '/operations/reservation', permission: 'bookings.view' },
  { prefix: '/events', permission: 'operations.view' },
  { prefix: '/inventory', permission: 'inventory.view' },
  { prefix: '/hr', permission: 'hr.view' },
  { prefix: '/accounts', permission: 'finance.view' },
  { prefix: '/fleet', permission: 'warehouses.view' },
  { prefix: '/reports', permission: 'reports.view' },
  { prefix: '/settings/roles', permission: 'roles.view' },
  { prefix: '/settings', permission: 'users.view' },
].sort((a, b) => b.prefix.length - a.prefix.length); // Sort by length descending to match most specific path first

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

  // If no specific permission matched, allow access (or could default to block, but allow is safer for random sub-pages)
  return <>{children}</>;
}
