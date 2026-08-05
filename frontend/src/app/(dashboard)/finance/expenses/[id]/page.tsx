import React from 'react';
import { ExpenseDetailView } from '@/components/dashboard/finance/expenses/ExpenseDetailView';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Expense Details | Krishna Tent & Events',
};

export default function ExpenseDetailPage() {
  return <ExpenseDetailView />;
}