import { CustomerForm } from '@/components/dashboard/crm/customers/CustomerForm';

export const metadata = {
  title: 'Edit Customer | Krishna Events ERP',
  description: 'Update customer details',
};

export default function EditCustomerPage() {
  return <CustomerForm isEdit={true} />;
}
