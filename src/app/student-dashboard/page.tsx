import React from 'react';
import type { Metadata } from 'next';
import DashboardPageClient from './components/DashboardPageClient';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function StudentDashboardPage() {
  return <DashboardPageClient />;
}