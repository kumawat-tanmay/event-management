import React from 'react';
import { DashboardLayout } from '@/components/dashboard/layout/DashboardLayout';
import AuthGuard from '@/components/auth/AuthGuard';
import RoutePermissionGuard from '@/components/auth/RoutePermissionGuard';

export default function DashboardGroupRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <DashboardLayout>
        <RoutePermissionGuard>
          {children}
        </RoutePermissionGuard>
      </DashboardLayout>
    </AuthGuard>
  );
}
