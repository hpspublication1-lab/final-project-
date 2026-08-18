import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import PracticePageClient from './components/PracticePageClient';

export const metadata: Metadata = {
  title: 'MCQ Practice — Samyak CEE Mastery',
  description: 'Practice 15,000+ MCQs with detailed explanations. Improve accuracy and master all topics for CEE 2026 medical entrance exam.',
  alternates: {
    canonical: '/practice',
  },
  openGraph: {
    title: 'MCQ Practice',
    description: 'Master medical entrance with 15,000+ practice questions',
    url: '/practice',
    type: 'website',
    images: [
      {
        url: '/assets/images/app_logo.png',
        width: 1200,
        height: 630,
        alt: 'MCQ Practice — Samyak CEE Mastery',
      },
    ],
  },
};

export default function PracticePage() {
  return (
    <Suspense fallback={null}>
      <PracticePageClient />
    </Suspense>
  );
}
