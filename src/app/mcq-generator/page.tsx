import React from 'react';
import type { Metadata } from 'next';
import McqGeneratorClient from './components/McqGeneratorClient';
import PremiumGate from '@/components/PremiumGate';

export const metadata: Metadata = {
  title: 'AI MCQ Generator — Samyak CEE Mastery',
  description: 'Generate unlimited MCQs using AI. Create custom question sets for targeted CEE exam preparation and skill assessment.',
  alternates: {
    canonical: '/mcq-generator',
  },
  openGraph: {
    title: 'AI MCQ Generator',
    description: 'AI-powered unlimited MCQ generation for CEE preparation',
    url: '/mcq-generator',
    type: 'website',
    images: [
      {
        url: '/assets/images/app_logo.png',
        width: 1200,
        height: 630,
        alt: 'AI MCQ Generator — Samyak CEE Mastery',
      },
    ],
  },
};

export default function McqGeneratorPage() {
  return (
    <PremiumGate feature="MCQ Generator">
      <McqGeneratorClient />
    </PremiumGate>
  );
}
