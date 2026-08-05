import React from 'react';
import { InvoiceDetailView } from '@/components/dashboard/finance/invoices/InvoiceDetailView';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tax Invoice Details | Krishna Tent & Events',
};

export default function InvoiceDetailPage() {
  return <InvoiceDetailView />;
}