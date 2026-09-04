import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import BattleArenaPageClient from '../battle-arena/components/BattleArenaPageClient';
import PremiumGate from '@/components/PremiumGate';

export const metadata: Metadata = {
  title: 'Arena — Samyak CEE Mastery',
  description: 'Compete in real-time 2-player MCQ battles. Test your knowledge against other students and climb the leaderboard.',
  alternates: {
    canonical: '/arena',
  },
  openGraph: {
    title: 'Samyak Arena',
    description: 'Real-time competitive MCQ battles for CEE preparation',
    url: '/arena',
    type: 'website',
    images: [
      {
        url: '/assets/images/app_logo.png',
        width: 1200,
        height: 630,
        alt: 'Samyak Arena',
      },
    ],
  },
};

export default function ArenaPage() {
  return (
    <Suspense fallback={null}>
      <PremiumGate feature="Battle Arena">
        <BattleArenaPageClient />
      </PremiumGate>
    </Suspense>
  );
}
