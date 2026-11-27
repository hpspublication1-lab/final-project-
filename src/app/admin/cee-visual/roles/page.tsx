import type { Metadata } from 'next';
import RolesClient from './RolesClient';

export const metadata: Metadata = {
  title: 'CEE content roles | Samyak Guru Admin',
  robots: { index: false, follow: false },
};

export default function AdminCeeRolesPage() {
  return <RolesClient />;
}
