import React from 'react';
import type { Metadata } from 'next';
import DashboardPageClient from './components/DashboardPageClient';

export const metadata: Metadata = {
  title: 'Student Academic Dashboard — Samyak CEE',
  description: 'Track your CEE mock test scores, subject mastery, All-Nepal merit rank projections, and daily practice targets.',
  robots: { index: false, follow: false },
};

export default function StudentDashboardPage() {
  return <DashboardPageClient />;
}