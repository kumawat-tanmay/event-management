import { SiteVisitForm } from '@/components/dashboard/crm/site-visits/SiteVisitForm';

export const metadata = {
  title: 'Edit Site Visit | Krishna Events ERP',
  description: 'Update venue inspection details',
};

export default function EditSiteVisitPage() {
  return <SiteVisitForm isEdit={true} />;
}
