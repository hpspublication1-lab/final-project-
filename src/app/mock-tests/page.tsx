import React from 'react';
import type { Metadata } from 'next';
import MockTestsPageClient from './components/MockTestsPageClient';
import PremiumGate from '@/components/PremiumGate';

export const metadata: Metadata = {
  title: 'Mock Tests — Samyak CEE Mastery',
  description: 'Take full-length mock tests simulating real CEE 2026 exam. Get detailed analysis and improve your score with our comprehensive test series.',
  alternates: {
    canonical: '/mock-tests',
  },
  openGraph: {
    title: 'Mock Tests',
    description: 'Full-length CEE mock tests with detailed performance analysis',
    url: '/mock-tests',
    type: 'website',
    images: [
      {
        url: '/assets/images/app_logo.png',
        width: 1200,
        height: 630,
        alt: 'Mock Tests — Samyak CEE Mastery',
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
