import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import PracticePageClient from '../practice/components/PracticePageClient';

export const metadata: Metadata = {
  title: 'Daily CEE Quizzes & Speed Drills — Samyak CEE Mastery',
  description: 'Test your speed and concept retention with daily chapter-wise CEE quizzes and timed speed drills.',
  alternates: {
    canonical: '/quiz',
  },
  openGraph: {
    title: 'CEE Daily Quizzes — Samyak CEE',
    description: 'Timed speed drills and concept retention quizzes for CEE aspirants',
    url: '/quiz',
    type: 'website',
    images: [
      {
        url: '/assets/images/app_logo.png',
        width: 1200,
        height: 630,
        alt: 'Daily CEE Quizzes — Samyak CEE',
      },
    ],
  },
};

export default function QuizPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>}>
      <PracticePageClient />
    </Suspense>
  );
}
