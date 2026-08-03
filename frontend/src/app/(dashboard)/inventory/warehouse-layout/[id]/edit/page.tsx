import React from 'react';
import LayoutForm from '@/components/dashboard/inventory/warehouse-layout/LayoutForm';

export const metadata = {
  title: 'Edit Warehouse Layout | Krishna Tent & Events ERP',
  description: 'Edit warehouse storage zones and racks configurations.',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LayoutFormPage({ params }: PageProps) {
  const resolvedParams = await params;
  return <LayoutForm id={resolvedParams.id} />;
}
