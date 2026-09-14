import React from 'react';
import type { Metadata } from 'next';
import AdminAnnouncementsClient from './components/AdminAnnouncementsClient';

export const metadata: Metadata = {
  title: 'Announcements Broadcast | Samyak Tutor Admin',
  robots: { index: false, follow: false },
};

export default function AdminAnnouncementsPage() {
  return <AdminAnnouncementsClient />;
}
