import React from 'react';
import type { Metadata } from 'next';
import AdminNotificationsClient from './components/AdminNotificationsClient';

export const metadata: Metadata = {
  title: 'Notification Dispatcher | Samyak Tutor Admin',
  robots: { index: false, follow: false },
};

export default function AdminNotificationsPage() {
  return <AdminNotificationsClient />;
}
