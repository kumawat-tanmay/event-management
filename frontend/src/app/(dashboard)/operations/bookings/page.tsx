import { Metadata } from 'next';
import { BookingsView } from '@/components/dashboard/operations/bookings/BookingsView';
import { buildMetadata } from '@/utils/seoConfig';

export const metadata: Metadata = buildMetadata({
  title: 'Event Bookings',
  description: 'Manage confirmed events, billing agreements, advance payments, and execution schedules.',
  url: '/operations/bookings',
});

export default function BookingsPage() {
  return <BookingsView />;
}

