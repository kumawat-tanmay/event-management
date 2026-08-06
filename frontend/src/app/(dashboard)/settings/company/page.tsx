import { Metadata } from 'next';
import { CompanyProfileView } from '@/components/dashboard/settings/CompanyProfileView';
import { buildMetadata } from '@/utils/seoConfig';

export const metadata: Metadata = buildMetadata({
  title: 'Company Settings',
  description: 'Manage company branding, GSTIN, business address, and default ERP preferences.',
  url: '/settings/company',
});

export default function CompanySettingsPage() {
  return <CompanyProfileView />;
}
