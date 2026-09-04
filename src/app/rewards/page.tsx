import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import BattleArenaPageClient from '../battle-arena/components/BattleArenaPageClient';
import PremiumGate from '@/components/PremiumGate';

export const metadata: Metadata = {
  title: 'Rewards, Badges & XP — Samyak CEE Mastery',
  description: 'Earn battle XP, unlock achievement badges, level up your student identity, and showcase your rank.',
  alternates: {
    canonical: '/rewards',
  },
  openGraph: {
    title: 'Samyak Arena Rewards & Badges',
    description: 'Unlock achievements and earn XP on Samyak CEE Arena',
    url: '/rewards',
    type: 'website',
    images: [
      {
        url: '/assets/images/app_logo.png',
        width: 1200,
        height: 630,
        alt: 'Samyak Arena Rewards',
      },
    ],
  },
};

export default function RewardsPage() {
  return (
    <Suspense fallback={null}>
      <PremiumGate feature="Battle Arena">
        <BattleArenaPageClient />
      </PremiumGate>
    </Suspense>
  );
}
