import { Metadata } from 'next';
import { InvoicesView } from '@/components/dashboard/finance/invoices/InvoicesView';
import { buildMetadata } from '@/utils/seoConfig';

export const metadata: Metadata = buildMetadata({
  title: 'Tax Invoices',
  description: 'Generate, manage, and download GST tax invoices, billing summaries, and customer receipts.',
  url: '/finance/invoices',
});

export default function InvoicesPage() {
  return <InvoicesView />;
}
