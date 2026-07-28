import { BookingsView } from '@/components/dashboard/operations/bookings/BookingsView';

export const metadata = {
  title: 'Event Bookings | Krishna Events ERP',
  description: 'Manage confirmed events and billing agreements',
};

export default function BookingsPage() {
  return <BookingsView />;
}

