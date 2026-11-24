import React from 'react';
import type { Metadata } from 'next';
import ReviewQueueClient from './components/ReviewQueueClient';

export const metadata: Metadata = {
  title: 'Academic Review Queue & Publication | Samyak Guru Admin',
  description: 'Multi-gate academic, scientific, visual, and accessibility review queue for CEE Visual Lessons.',
  robots: { index: false, follow: false },
};

export default function AdminReviewQueuePage() {
  return <ReviewQueueClient />;
}
