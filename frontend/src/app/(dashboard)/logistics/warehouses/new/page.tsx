import React from 'react';
import WarehousesView from '@/components/dashboard/logistics/warehouses/WarehousesView';

export const metadata = {
  title: 'Add Warehouse | Krishna Tent & Events ERP',
  description: 'Create a new warehouse or godown.',
};

export default function NewWarehousePage() {
  return <WarehousesView />;
}
