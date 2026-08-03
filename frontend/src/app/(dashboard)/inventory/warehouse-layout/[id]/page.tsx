import React from 'react';
import LayoutDetail from '@/components/dashboard/inventory/warehouse-layout/LayoutDetail';

export const metadata = {
  title: 'Warehouse Layout Detail | Krishna Tent & Events ERP',
  description: 'View warehouse storage configuration.',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LayoutDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  return <LayoutDetail id={resolvedParams.id} />;
}
