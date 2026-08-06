import { Metadata } from 'next';
import { LeadsView } from '@/components/dashboard/crm/leads/LeadsView';
import { buildMetadata } from '@/utils/seoConfig';

export const metadata: Metadata = buildMetadata({
  title: 'Leads Management',
  description: 'Track sales inquiries, lead conversion pipelines, and customer proposals.',
  url: '/crm/leads',
});

export default function LeadsPage() {
  return <LeadsView />;
}
