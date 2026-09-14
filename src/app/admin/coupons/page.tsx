import { Metadata } from 'next';
import AdminActivationCodesClient from '@/app/admin/activation-codes/components/AdminActivationCodesClient';

export const metadata: Metadata = {
  title: 'Coupons & Activation Codes | Samyak Tutor Admin',
  robots: { index: false, follow: false },
};

export default function AdminCouponsPage() {
  return <AdminActivationCodesClient />;
}
