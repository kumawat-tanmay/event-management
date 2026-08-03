import { QuotationForm } from '@/components/dashboard/operations/quotations/QuotationForm';

export const metadata = {
  title: 'Edit Quotation | Krishna Events ERP',
  description: 'Edit event estimate',
};

export default function EditQuotationPage() {
  return <QuotationForm isEdit />;
}
