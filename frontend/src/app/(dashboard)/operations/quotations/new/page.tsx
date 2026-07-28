import { OperationForm } from '@/components/dashboard/operations/quotations/OperationForm';

export const metadata = {
  title: 'Create Quotation | Krishna Events ERP',
  description: 'Draft a new event estimate',
};

export default function NewQuotationPage() {
  return <OperationForm mode="quotation" />;
}
