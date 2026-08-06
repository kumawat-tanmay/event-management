import { Metadata } from 'next';
import UsersListView from '@/components/dashboard/settings/UsersListView';
import { buildMetadata } from '@/utils/seoConfig';

export const metadata: Metadata = buildMetadata({
  title: 'User Management',
  description: 'Invite new users, assign roles, manage active team accounts, and monitor user statuses.',
  url: '/settings/users',
});

export default function UsersPage() {
    return <UsersListView />;
}
