import React from 'react';
import type { Metadata } from 'next';
import AdminDashboardClient from '../components/AdminDashboardClient';

export const metadata: Metadata = {
  title: 'Admin Command Center — Samyak Guru',
  robots: { index: false, follow: false },
};

export default function AdminDashboardAliasPage() {
  return <AdminDashboardClient />;
}
