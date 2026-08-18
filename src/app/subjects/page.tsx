import React from 'react';
import type { Metadata } from 'next';
import SubjectsPageClient from './components/SubjectsPageClient';

export const metadata: Metadata = {
  title: 'Medical Subjects — Samyak CEE Mastery',
  description: 'Explore all medical subjects for CEE 2026. Biology, Chemistry, Physics, and English with chapter-wise notes and MCQ practice.',
  alternates: {
    canonical: '/subjects',
  },
  openGraph: {
    title: 'Medical Subjects',
    description: 'Complete subject coverage for CEE medical entrance exam',
    url: '/subjects',
    type: 'website',
    images: [
      {
        url: '/assets/images/app_logo.png',
        width: 1200,
        height: 630,
        alt: 'Medical Subjects — Samyak CEE Mastery',
      },
    ],
  },
};

export default function SubjectsPage() {
  return <SubjectsPageClient />;
}
