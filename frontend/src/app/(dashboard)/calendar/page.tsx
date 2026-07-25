import { EventCalendar } from '@/components/dashboard/calendar/EventCalendar';

export const metadata = {
  title: 'Event Calendar | Krishna Events ERP',
  description: 'Track and manage all your upcoming weddings, corporate events, and bookings.',
};

export default function CalendarPage() {
  return <EventCalendar />;
}
