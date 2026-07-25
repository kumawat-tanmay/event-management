import { LeadForm } from '@/components/dashboard/crm/leads/LeadForm';

export const metadata = {
  title: 'Add New Lead | Krishna Events ERP',
  description: 'Capture a new inquiry',
};

export default function NewLeadPage() {
  return <LeadForm isEdit={false} />;
}
