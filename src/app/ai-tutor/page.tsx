import React from 'react';
import type { Metadata } from 'next';
import AiTutorClient from './components/AiTutorClient';
import PremiumGate from '@/components/PremiumGate';

export const metadata: Metadata = {
  title: 'Samyak AI Tutor — Intelligent Learning Assistant',
  description: '24/7 AI-powered personal tutor on Samyak Tutor. Instant doubt clearance, question scanner, mistake analysis, and conceptual drills across SEE and CEE.',
  alternates: {
    canonical: '/ai-tutor',
  },
  openGraph: {
    title: 'Samyak AI Tutor',
    description: '24/7 AI-powered doubt clearing, question scanner, and mistake diagnostics on Samyak Tutor.',
    url: '/ai-tutor',
    type: 'website',
    images: [
      {
        url: '/assets/images/app_logo.png',
        width: 1200,
        height: 630,
        alt: 'Samyak AI Tutor',
      },
    ],
  },
};

export default function AiTutorPage() {
  return (
    <PremiumGate feature="AI Tutor">
      <AiTutorClient />
    </PremiumGate>
  );
}
