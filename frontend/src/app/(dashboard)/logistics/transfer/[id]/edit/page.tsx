import React from 'react';
import { StockTransferForm } from '@/components/dashboard/logistics/transfer/StockTransferForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTransferPage({ params }: PageProps) {
  const resolvedParams = await params;
  return <StockTransferForm transferId={resolvedParams.id} />;
}