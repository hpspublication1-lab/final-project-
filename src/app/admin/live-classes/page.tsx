import { Metadata } from 'next';
import AdminLiveClassesClient from './components/AdminLiveClassesClient';

export const metadata: Metadata = {
  title: 'Live Classes | Admin',
  description: 'Schedule and control Bunny.net live streaming classes.',
};

export default function AdminLiveClassesPage() {
  return <AdminLiveClassesClient />;
}
