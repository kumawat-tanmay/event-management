import { OperationForm } from '@/components/dashboard/operations/quotations/OperationForm';

export const metadata = {
  title: 'Edit Booking | Krishna Events ERP',
  description: 'Edit event booking details',
};

export default function EditBookingPage() {
  return <OperationForm mode="booking" isEdit />;
}
