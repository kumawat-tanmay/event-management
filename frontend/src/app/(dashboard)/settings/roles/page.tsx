import React from 'react';
import RolesView from '@/components/dashboard/settings/RolesView';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Roles & Permissions - ERP Settings',
};

export default function RolesPage() {
  return <RolesView />;
}
