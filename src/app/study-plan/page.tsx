import React from 'react';
import type { Metadata } from 'next';
import StudyPlanAiClient from './components/StudyPlanAiClient';
import PremiumGate from '@/components/PremiumGate';

export const metadata: Metadata = {
  title: 'AI Study Plan — Samyak CEE Mastery',
  description: 'Get personalized AI-generated study plans. Optimize your CEE 2026 preparation with adaptive learning paths tailored to your pace.',
  alternates: {
    canonical: '/study-plan',
  },
  openGraph: {
    title: 'AI Study Plan',
    description: 'Personalized AI study plans for CEE medical entrance',
    url: '/study-plan',
    type: 'website',
    images: [
      {
        url: '/assets/images/app_logo.png',
        width: 1200,
        height: 630,
        alt: 'AI Study Plan — Samyak CEE Mastery',
      },
    ],
  },
};

export default function StudyPlanPage() {
  return (
    <PremiumGate feature="AI Study Plan">
      <StudyPlanAiClient />
    </PremiumGate>
  );
}
