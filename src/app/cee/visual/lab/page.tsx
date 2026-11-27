import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import LabClient from './LabClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Visual player lab',
  robots: { index: false, follow: false },
};

/** Preview and local development only. Production always gets a 404. */
function labEnabled(): boolean {
  if (process.env.VERCEL_ENV === 'production') return false;
  return process.env.VERCEL_ENV === 'preview' || process.env.NODE_ENV === 'development' || process.env.CEE_VISUAL_LAB === '1';
}

export default function VisualPlayerLabPage() {
  if (!labEnabled()) notFound();
  return <LabClient />;
}
