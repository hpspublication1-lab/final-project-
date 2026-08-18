import { Metadata } from 'next';
import AdminActivationCodesClient from './components/AdminActivationCodesClient';

export const metadata: Metadata = {
  title: 'Activation Codes | Admin',
  description: 'Generate and manage plan activation codes.',
};

export default function AdminActivationCodesPage() {
  return <AdminActivationCodesClient />;
}
