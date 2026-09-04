import React from 'react';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import LeaderboardClient from '../leaderboard/components/LeaderboardClient';

export const metadata: Metadata = {
  title: 'ELO Rankings & Leaderboard — Samyak CEE Mastery',
  description: 'View top ELO rankings, track global student positions, and compete for top medical entrance ranks.',
  alternates: {
    canonical: '/rankings',
  },
  openGraph: {
    title: 'Samyak CEE ELO Rankings',
    description: 'Track your ELO rank among 40,000+ CEE aspirants',
    url: '/rankings',
    type: 'website',
    images: [
      {
        url: '/assets/images/app_logo.png',
        width: 1200,
        height: 630,
        alt: 'Samyak CEE ELO Rankings',
      },
    ],
  },
};

export default async function RankingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <LeaderboardClient currentUserId={user?.id ?? null} />;
}
