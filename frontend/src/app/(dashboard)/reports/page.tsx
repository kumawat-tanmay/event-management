import { Metadata } from 'next';
import { AnalyticsView } from '@/components/dashboard/reports/AnalyticsView';
import { buildMetadata } from '@/utils/seoConfig';

export const metadata: Metadata = buildMetadata({
  title: 'ERP Reports & Analytics',
  description: 'Generate 16 comprehensive ERP reports including Profit & Loss, GST statements, and godown utilization.',
  url: '/reports',
});

export default function ReportsPage() {
  return <AnalyticsView />;
}
