import React from 'react';
import type { Metadata } from 'next';
import AiTutorClient from './components/AiTutorClient';
import PremiumGate from '@/components/PremiumGate';

export const metadata: Metadata = {
  title: 'AI Tutor — Samyak CEE Mastery',
  description: 'Chat with AI tutor for instant doubt clearing. Get personalized explanations and guidance for any CEE topic anytime.',
  alternates: {
    canonical: '/ai-tutor',
  },
  openGraph: {
    title: 'AI Tutor',
    description: '24/7 AI-powered doubt clearing for CEE preparation',
    url: '/ai-tutor',
    type: 'website',
    images: [
      {
        url: '/assets/images/app_logo.png',
        width: 1200,
        height: 630,
        alt: 'AI Tutor — Samyak CEE Mastery',
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
