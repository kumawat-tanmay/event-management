import { Metadata } from 'next';
import { QuotationsView } from '@/components/dashboard/operations/quotations/QuotationsView';
import { buildMetadata } from '@/utils/seoConfig';

export const metadata: Metadata = buildMetadata({
  title: 'Quotation Builder',
  description: 'Create and manage event estimates, stock availability checks, and PDF proposals.',
  url: '/operations/quotations',
});

export default function QuotationsPage() {
  return <QuotationsView />;
}
