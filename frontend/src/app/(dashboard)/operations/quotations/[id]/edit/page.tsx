import { OperationForm } from '@/components/dashboard/operations/quotations/OperationForm';

export const metadata = {
  title: 'Edit Quotation | Krishna Events ERP',
  description: 'Edit event estimate',
};

export default function EditQuotationPage() {
  return <OperationForm mode="quotation" isEdit />;
}
