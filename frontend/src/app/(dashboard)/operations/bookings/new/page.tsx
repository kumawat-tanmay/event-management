import { BookingForm } from '@/components/dashboard/operations/bookings/BookingForm';

export const metadata = {
  title: 'Create Booking | Krishna Events ERP',
  description: 'Create a new event booking',
};

export default function NewBookingPage() {
  return <BookingForm />;
}
