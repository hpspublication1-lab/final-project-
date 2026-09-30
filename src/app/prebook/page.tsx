import React from 'react';
import type { Metadata } from 'next';
import PrebookClient from './components/PrebookClient';

export const metadata: Metadata = {
  title: 'Prebook — Samyak CEE 45-Day Crash Course (NPR 300 Deposit)',
  description:
    'Reserve your seat with a refundable NPR 300 deposit. Lock the CEE 45-Day Crash Course at NPR 2,299 (regular NPR 4,990). Pay only NPR 1,999 remaining balance when classes commence. Instant 90-day AI Pro platform access included.',
  alternates: { canonical: '/prebook' },
  openGraph: {
    title: 'Prebook Samyak CEE Mastery — 45-Day Crash Course',
    description:
      'Reserve your seat for NPR 300 deposit. Total course fee NPR 2,299 (regular NPR 4,990). Pay remaining balance of NPR 1,999 when live classes commence.',
    url: '/prebook',
    type: 'website',
    images: [{ url: '/assets/images/app_logo.png', width: 1200, height: 630, alt: 'Samyak CEE Mastery Prebooking' }],
  },
  robots: { index: true, follow: true },
};

export default function PrebookPage() {
  return <PrebookClient />;
}
