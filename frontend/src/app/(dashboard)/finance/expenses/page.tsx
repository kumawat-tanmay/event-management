import { Metadata } from 'next';
import { ExpensesView } from '@/components/dashboard/finance/expenses/ExpensesView';
import { buildMetadata } from '@/utils/seoConfig';

export const metadata: Metadata = buildMetadata({
  title: 'Expense Tracking',
  description: 'Track event-wise and category-wise operational expenses, labor costs, and transport outlays.',
  url: '/finance/expenses',
});

export default function ExpensesPage() {
  return <ExpensesView />;
}
