import { Metadata } from 'next';
import { CustomersView } from '@/components/dashboard/crm/customers/CustomersView';
import { buildMetadata } from '@/utils/seoConfig';

export const metadata: Metadata = buildMetadata({
  title: 'Customer Directory',
  description: 'Manage retail and corporate customer directories, credit limits, and contact ledgers.',
  url: '/crm/customers',
});

export default function CustomersPage() {
  return <CustomersView />;
}
