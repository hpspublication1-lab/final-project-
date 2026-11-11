import { Metadata } from 'next';
import AdminAutonomousClient from './components/AdminAutonomousClient';

export const metadata: Metadata = {
  title: 'Autonomous Operations AI | Admin',
  description: 'Master command center for 10,000 bulk cryptographic codes, autonomous syllabus research, and student reminder daemons.',
};

export default function AdminAutonomousPage() {
  return <AdminAutonomousClient />;
}
