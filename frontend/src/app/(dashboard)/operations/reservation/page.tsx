import { ReservationView } from '@/components/dashboard/operations/reservation/ReservationView';

export const metadata = {
  title: 'Stock Reservations | Krishna Events ERP',
  description: 'Manage material reservations and warehouse split allocations',
};

export default function ReservationsPage() {
  return <ReservationView />;
}

