import React from 'react';
import { Metadata } from 'next';
import { VehiclesView } from '@/components/dashboard/hr/vehicles/VehiclesView';
import { buildMetadata } from '@/utils/seoConfig';

export const metadata: Metadata = buildMetadata({
  title: 'Vehicle Fleet',
  description: 'Manage transport vehicles, maintenance logs, and dispatch assignments.',
  url: '/hr/vehicles',
});

export default function VehiclesPage() {
  return <VehiclesView />;
}
