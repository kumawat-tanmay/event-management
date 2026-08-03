import React from 'react';
import WarehousesView from '@/components/dashboard/logistics/warehouses/WarehousesView';

export const metadata = {
  title: 'Warehouse Details | Krishna Tent & Events ERP',
  description: 'View warehouse zones, racks, and details.',
};

export default function WarehouseDetailPage() {
  return <WarehousesView />;
}
