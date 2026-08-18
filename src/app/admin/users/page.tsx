import { Metadata } from 'next';
import AdminUsersClient from './components/AdminUsersClient';

export const metadata: Metadata = {
  title: 'Students & Subscribers | Admin',
  description: 'All students, subscribers, presale users, and activity.',
};

export default function AdminUsersPage() {
  return <AdminUsersClient />;
}
