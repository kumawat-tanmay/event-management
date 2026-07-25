import { LeadForm } from '@/components/dashboard/crm/leads/LeadForm';

export const metadata = {
  title: 'Edit Lead | Krishna Events ERP',
  description: 'Update inquiry details',
};

export default function EditLeadPage() {
  return <LeadForm isEdit={true} />;
}
