import React from 'react';
import type { Metadata } from 'next';
import StaffDashboardClient from './components/StaffDashboardClient';

export const metadata: Metadata = {
  title: 'Staff Dashboard — Samyak CEE Mastery',
  robots: { index: false, follow: false },
};

export default function StaffPage() {
  return <StaffDashboardClient />;
}
