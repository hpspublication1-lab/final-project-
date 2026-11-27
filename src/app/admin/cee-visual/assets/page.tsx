import type { Metadata } from 'next';
import AssetsClient from './AssetsClient';

export const metadata: Metadata = {
  title: 'CEE visuals | Samyak Guru Admin',
  robots: { index: false, follow: false },
};

export default function AdminCeeAssetsPage() {
  return <AssetsClient />;
}
