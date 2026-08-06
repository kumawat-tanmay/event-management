import { Metadata } from 'next';
import { DispatchesView } from '@/components/dashboard/logistics/dispatches/DispatchesView';
import { buildMetadata } from '@/utils/seoConfig';

export const metadata: Metadata = buildMetadata({
  title: 'Dispatch & Vehicle Loading',
  description: 'Manage vehicle loading slips, gate passes, driver assignments, and event site dispatches.',
  url: '/logistics/dispatches',
});

export default function DispatchesPage() {
  return <DispatchesView />;
}
