import { OperationForm } from '@/components/dashboard/operations/quotations/OperationForm';

export const metadata = {
  title: 'Create Booking | Krishna Events ERP',
  description: 'Create a new event booking',
};

export default function NewBookingPage() {
  return <OperationForm mode="booking" />;
}
