import React from 'react';
import { DispatchForm } from '@/components/dashboard/logistics/dispatches/DispatchForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditDispatchPage({ params }: PageProps) {
  const resolvedParams = await params;
  return <DispatchForm dispatchId={resolvedParams.id} />;
}