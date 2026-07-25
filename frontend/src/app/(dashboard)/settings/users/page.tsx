import UsersListView from '@/components/dashboard/settings/UsersListView';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'User Management | Krishna Tent & Events',
  description: 'Manage users and invitations for Krishna Tent & Events ERP',
};

export default function UsersPage() {
  return <UsersListView />;
}
