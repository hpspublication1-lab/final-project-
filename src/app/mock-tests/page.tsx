import React from 'react';
import type { Metadata } from 'next';
import MockTestsPageClient from './components/MockTestsPageClient';
import PremiumGate from '@/components/PremiumGate';

export const metadata: Metadata = {
  title: 'Tests & Assessments — Samyak Tutor',
  description: 'Take full-length mock tests, chapter assessments, and timed exam simulations on Samyak Tutor. Instant scoring, percentile ranks, and step-by-step solutions.',
  alternates: {
    canonical: '/mock-tests',
  },
  openGraph: {
    title: 'Tests & Assessments — Samyak Tutor',
    description: 'Full-length mock tests and chapter assessments with detailed performance analysis on Samyak Tutor.',
    url: '/mock-tests',
    type: 'website',
    images: [
      {
        url: '/assets/images/app_logo.png',
        width: 1200,
        height: 630,
        alt: 'Tests & Assessments — Samyak Tutor',
      },
    ],
  },
};

export default function MockTestsPage() {
  return (
    <PremiumGate feature="Mock Tests">
      <MockTestsPageClient />
    </PremiumGate>
  );
}
