import React from 'react';
import type { Metadata } from 'next';
import MistakeAnalyserClient from './components/MistakeAnalyserClient';
import PremiumGate from '@/components/PremiumGate';

export const metadata: Metadata = {
  title: 'Mistake Analyser — Samyak CEE Mastery',
  description: 'Analyze your mistakes and weak topics. Get AI-powered insights to focus on areas needing improvement for CEE 2026 exam.',
  alternates: {
    canonical: '/mistake-analyser',
  },
  openGraph: {
    title: 'Mistake Analyser',
    description: 'AI-powered mistake analysis for targeted CEE preparation',
    url: '/mistake-analyser',
    type: 'website',
    images: [
      {
        url: '/assets/images/app_logo.png',
        width: 1200,
        height: 630,
        alt: 'Mistake Analyser — Samyak CEE Mastery',
      },
    ],
  },
};

export default function MistakeAnalyserPage() {
  return (
    <PremiumGate feature="Mistake Analyser">
      <MistakeAnalyserClient />
    </PremiumGate>
  );
}
