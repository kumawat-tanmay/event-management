import { Metadata } from 'next';
import { EventCalendar } from '@/components/dashboard/calendar/EventCalendar';
import { buildMetadata } from '@/utils/seoConfig';

export const metadata: Metadata = buildMetadata({
  title: 'Event Calendar',
  description: 'Track and manage all your upcoming weddings, corporate events, and bookings on an interactive calendar.',
  url: '/calendar',
});

export default function CalendarPage() {
  return <EventCalendar />;
}
