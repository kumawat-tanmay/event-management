import React from 'react';
import { PaymentForm } from '@/components/dashboard/finance/payments/PaymentForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Record Payment | Krishna Tent & Events',
};

export default function NewPaymentPage() {
  return <PaymentForm />;
}

