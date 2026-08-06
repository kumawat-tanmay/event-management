import { Metadata } from 'next';
import { ReservationView } from '@/components/dashboard/operations/reservation/ReservationView';
import { buildMetadata } from '@/utils/seoConfig';

export const metadata: Metadata = buildMetadata({
  title: 'Material Reservation',
  description: 'Manage multi-warehouse stock reservations, auto-split algorithm, and stock locking.',
  url: '/operations/reservation',
});

export default function ReservationsPage() {
  return <ReservationView />;
}

