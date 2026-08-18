import React from 'react';
import type { Metadata } from 'next';
import PrebookClient from './components/PrebookClient';

export const metadata: Metadata = {
  title: 'Prebook — Samyak CEE Mastery 45-Day Crash Course (Rs 300)',
  description:
    'Prebook the Samyak CEE Mastery 45-day crash course for just Rs 300. Live classes by top MBBS rank-holders, 1-on-1 mentorship, and Nepal\'s most advanced CEE prep app. Pay only Rs 2299 (was Rs 2999). Limited 7-week launch offer.',
  alternates: { canonical: '/prebook' },
  openGraph: {
    title: 'Prebook Samyak CEE Mastery — 45-Day Crash Course',
    description:
      'Reserve your seat for Rs 300. Top MBBS rank-holder classes + Nepal\'s most advanced CEE app. Pay only Rs 2299 instead of Rs 2999.',
    url: '/prebook',
    type: 'website',
    images: [{ url: '/assets/images/app_logo.png', width: 1200, height: 630, alt: 'Samyak CEE Mastery Prebooking' }],
  },
  robots: { index: true, follow: true },
};

export default function PrebookPage() {
  return <PrebookClient />;
}
