import { CustomerDetailView } from '@/components/dashboard/crm/customers/CustomerDetailView';

export const metadata = {
  title: 'Customer Details | Krishna Events ERP',
  description: 'View customer profile and booking history',
};

export default function CustomerDetailPage() {
  return <CustomerDetailView />;
}
