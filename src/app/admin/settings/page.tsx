import React from 'react';
import type { Metadata } from 'next';
import AdminSettingsClient from './components/AdminSettingsClient';

export const metadata: Metadata = {
  title: 'Platform System Settings | Samyak Tutor Admin',
  robots: { index: false, follow: false },
};

export default function AdminSettingsPage() {
  return <AdminSettingsClient />;
}
