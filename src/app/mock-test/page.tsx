import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import MockTestsPageClient from '../mock-tests/components/MockTestsPageClient';
import PremiumGate from '@/components/PremiumGate';

export const metadata: Metadata = {
  title: 'CEE Full-Length Mock Test Series — Samyak CEE Mastery',
  description: 'Take full-length 200-mark CEE mock tests with negative marking simulation, real-time rank predictor, and deep topic analytics.',
  alternates: {
    canonical: '/mock-test',
  },
  openGraph: {
    title: 'CEE Mock Tests — Samyak CEE',
    description: 'Full-length 200-mark medical entrance simulations with negative marking',
    url: '/mock-test',
    type: 'website',
    images: [
      {
        url: '/assets/images/app_logo.png',
        width: 1200,
        height: 630,
        alt: 'CEE Mock Tests — Samyak CEE',
      },
    ],
  },
};

export default function MockTestPage() {
  return (
    <PremiumGate feature="Mock Tests">
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>}>
        <MockTestsPageClient />
      </Suspense>
    </PremiumGate>
  );
}
