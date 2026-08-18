import { Metadata } from 'next';
import AdminPrebookingsClient from './components/AdminPrebookingsClient';

export const metadata: Metadata = {
  title: 'Presale / Prebookings | Admin',
  description: 'Crash-course prebooking (presale) leads and payments.',
};

export default function AdminPrebookingsPage() {
  return <AdminPrebookingsClient />;
}
