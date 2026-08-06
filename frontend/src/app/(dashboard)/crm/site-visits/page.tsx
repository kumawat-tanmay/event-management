import { Metadata } from 'next';
import { SiteVisitsView } from '@/components/dashboard/crm/site-visits/SiteVisitsView';
import { buildMetadata } from '@/utils/seoConfig';

export const metadata: Metadata = buildMetadata({
  title: 'Site Visits Scheduler',
  description: 'Schedule and track venue site inspections, measurements, and customer meetings.',
  url: '/crm/site-visits',
});

export default function SiteVisitsPage() {
  return <SiteVisitsView />;
}
