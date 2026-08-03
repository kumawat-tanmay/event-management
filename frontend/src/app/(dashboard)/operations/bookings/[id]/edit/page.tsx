import { BookingForm } from '@/components/dashboard/operations/bookings/BookingForm';

export const metadata = {
  title: 'Edit Booking | Krishna Events ERP',
  description: 'Edit event booking details',
};

export default function EditBookingPage() {
  return <BookingForm isEdit />;
}
