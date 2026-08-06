import { Metadata } from 'next';
import { PaymentsView } from '@/components/dashboard/finance/payments/PaymentsView';
import { buildMetadata } from '@/utils/seoConfig';

export const metadata: Metadata = buildMetadata({
  title: 'Payment Ledgers',
  description: 'Record customer advances, vendor settlements, cashbook entries, and bulk payment allocations.',
  url: '/finance/payments',
});

export default function PaymentsPage() {
  return <PaymentsView />;
}
