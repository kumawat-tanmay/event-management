import { QuotationForm } from '@/components/dashboard/operations/quotations/QuotationForm';

export const metadata = {
  title: 'Create Quotation | Krishna Events ERP',
  description: 'Draft a new event estimate',
};

export default function NewQuotationPage() {
  return <QuotationForm />;
}
