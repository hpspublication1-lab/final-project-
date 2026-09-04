import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import BattleArenaPageClient from '../battle-arena/components/BattleArenaPageClient';
import PremiumGate from '@/components/PremiumGate';

export const metadata: Metadata = {
  title: '2-Player Battle Arena — Samyak CEE Mastery',
  description: 'Join real-time 1v1 competitive MCQ battles with CEE aspirants across Nepal.',
  alternates: {
    canonical: '/battle',
  },
  openGraph: {
    title: 'Samyak Battle Arena',
    description: 'Real-time 1v1 competitive MCQ matches for CEE preparation',
    url: '/battle',
    type: 'website',
    images: [
      {
        url: '/assets/images/app_logo.png',
        width: 1200,
        height: 630,
        alt: 'Samyak Battle',
      },
    ],
  },
};

export default function BattlePage() {
  return (
    <Suspense fallback={null}>
      <PremiumGate feature="Battle Arena">
        <BattleArenaPageClient />
      </PremiumGate>
    </Suspense>
  );
}
