import React from 'react';
import { Metadata } from 'next';
import WarehousesView from '@/components/dashboard/logistics/warehouses/WarehousesView';
import { buildMetadata } from '@/utils/seoConfig';

export const metadata: Metadata = buildMetadata({
  title: 'Godowns & Warehouses',
  description: 'Manage multiple godown locations, zones, racks, and available warehouse inventory.',
  url: '/logistics/warehouses',
});

export default function WarehousesPage() {
  return <WarehousesView />;
}
