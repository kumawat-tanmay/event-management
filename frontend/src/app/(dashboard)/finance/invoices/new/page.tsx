import React, { Suspense } from 'react';
import { InvoiceBuilder } from '@/components/dashboard/finance/invoices/InvoiceBuilder';
import { Metadata } from 'next';
import { Loader2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Generate Tax Invoice | Krishna Tent & Events',
};

export default function NewInvoicePage() {
  return (
    <Suspense fallback={
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <InvoiceBuilder />
    </Suspense>
  );
}