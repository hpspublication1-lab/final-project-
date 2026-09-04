import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import BattleArenaPageClient from '../battle-arena/components/BattleArenaPageClient';
import PremiumGate from '@/components/PremiumGate';

export const metadata: Metadata = {
  title: 'Friends & Opponents — Samyak CEE Mastery',
  description: 'Connect with friends, send match invitations, track online presence, and challenge rivals in the Arena.',
  alternates: {
    canonical: '/friends',
  },
  openGraph: {
    title: 'Samyak CEE Friends Network',
    description: 'Connect and battle with friends on Samyak CEE Arena',
    url: '/friends',
    type: 'website',
    images: [
      {
        url: '/assets/images/app_logo.png',
        width: 1200,
        height: 630,
        alt: 'Samyak Friends Network',
      },
    ],
  },
};

export default function FriendsPage() {
  return (
    <Suspense fallback={null}>
      <PremiumGate feature="Battle Arena">
        <BattleArenaPageClient />
      </PremiumGate>
    </Suspense>
  );
}
