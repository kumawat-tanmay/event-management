import { CustomerForm } from '@/components/dashboard/crm/customers/CustomerForm';

export const metadata = {
  title: 'Add New Customer | Krishna Events ERP',
  description: 'Add a new retail or corporate customer',
};

export default function NewCustomerPage() {
  return <CustomerForm isEdit={false} />;
}
