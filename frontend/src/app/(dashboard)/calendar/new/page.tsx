import { CalendarForm } from '@/components/dashboard/calendar/CalendarForm';

export const metadata = {
  title: 'Schedule New Event | Krishna Events ERP',
  description: 'Add a new event to your calendar',
};

export default function NewEventPage() {
  return <CalendarForm isEdit={false} />;
}
