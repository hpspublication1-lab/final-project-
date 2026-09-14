import React from 'react';
import type { Metadata } from 'next';
import AdminReportsClient from './components/AdminReportsClient';

export const metadata: Metadata = {
  title: 'Operational Reports & Analytics | Samyak Tutor Admin',
  robots: { index: false, follow: false },
};

export default function AdminReportsPage() {
  return <AdminReportsClient />;
}
