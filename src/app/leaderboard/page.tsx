import React from 'react';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import LeaderboardClient from './components/LeaderboardClient';

export const metadata: Metadata = {
  title: 'Leaderboard — Samyak CEE Mastery',
  description: 'View top performers and track your rank. Compete with 40,000+ students preparing for CEE 2026 medical entrance exam.',
  alternates: {
    canonical: '/leaderboard',
  },
  openGraph: {
    title: 'Leaderboard',
    description: 'Track your rank among 40,000+ CEE aspirants',
    url: '/leaderboard',
    type: 'website',
    images: [
      {
        url: '/assets/images/app_logo.png',
        width: 1200,
        height: 630,
        alt: 'Leaderboard — Samyak CEE Mastery',
      },
    ],
  },
};

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <LeaderboardClient currentUserId={user?.id ?? null} />;
}
