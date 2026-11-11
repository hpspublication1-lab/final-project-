import React from 'react';
import type { Metadata } from 'next';
import ProgressPageClient from './components/ProgressPageClient';

export const metadata: Metadata = {
  title: 'My Progress & Learning Intelligence — Samyak Tutor',
  description: 'Detailed study analytics, chapter mastery diagnostic, and personalized target score predictions on Samyak Tutor.',
  robots: { index: false, follow: false },
};

export default function ProgressPage() {
  return <ProgressPageClient />;
}
