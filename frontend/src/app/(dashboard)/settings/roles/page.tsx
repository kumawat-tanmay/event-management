import React from 'react';
import { Metadata } from 'next';
import RolesView from '@/components/dashboard/settings/RolesView';
import { buildMetadata } from '@/utils/seoConfig';

export const metadata: Metadata = buildMetadata({
  title: 'Roles & Permissions',
  description: 'Manage RBAC system roles, granular module permissions, and access controls.',
  url: '/settings/roles',
});

export default function RolesPage() {
  return <RolesView />;
}
