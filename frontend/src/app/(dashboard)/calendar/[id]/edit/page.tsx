import { CalendarForm } from '@/components/dashboard/calendar/CalendarForm';

export const metadata = {
  title: 'Edit Event | Krishna Events ERP',
  description: 'Update event details',
};

export default function EditEventPage() {
  return <CalendarForm isEdit={true} />;
}
