import React from 'react';
import type { Metadata } from 'next';
import LeadMagnetLandingClient from './components/LeadMagnetLandingClient';

export const metadata: Metadata = {
  title: '500 FREE CEE Biology MCQs With Explanations — Samyak Power Pack',
  description:
    'Download the official 500 High-Yield CEE Biology MCQs with detailed conceptual explanations, trap option warnings, and chapter weightage breakdown. 100% Free for Nepal CEE 2026 aspirants.',
  alternates: {
    canonical: '/free-cee-biology-mcqs',
  },
  openGraph: {
    title: 'FREE CEE BIOLOGY POWER PACK (500 MCQs + Explanations)',
    description:
      'Test yourself before you spend a single rupee on your preparation. 500 High-Yield CEE Biology MCQs mapped to the latest MEC syllabus.',
    url: 'https://samyakcee.com/free-cee-biology-mcqs',
    type: 'website',
  },
};

export default function FreeCeeBiologyPage() {
  return <LeadMagnetLandingClient />;
}
