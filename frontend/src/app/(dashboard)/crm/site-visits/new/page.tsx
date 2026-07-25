import { SiteVisitForm } from '@/components/dashboard/crm/site-visits/SiteVisitForm';

export const metadata = {
  title: 'Schedule Site Visit | Krishna Events ERP',
  description: 'Assign a supervisor for venue inspection',
};

export default function NewSiteVisitPage() {
  return <SiteVisitForm isEdit={false} />;
}
