import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import DashboardPageClient from './components/DashboardPageClient';
import DashboardSkeleton from './components/DashboardSkeleton';

export const metadata: Metadata = {
  title: 'Student Dashboard — Samyak',
  description: 'Track mock scores, subject mastery, rank, and today’s study plan in one workspace.',
  robots: { index: false, follow: false },
};

export default function StudentDashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardPageClient />
    </Suspense>
  );
}