import React from 'react';
import { ExpenseForm } from '@/components/dashboard/finance/expenses/ExpenseForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Log Operational Expense | Krishna Tent & Events',
};

export default function NewExpensePage() {
  return <ExpenseForm />;
}
