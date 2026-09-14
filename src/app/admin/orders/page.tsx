import React from 'react';
import type { Metadata } from 'next';
import AdminOrdersClient from './components/AdminOrdersClient';

export const metadata: Metadata = {
  title: 'Orders & Payments Processing | Samyak Tutor Admin',
  robots: { index: false, follow: false },
};

export default function AdminOrdersPage() {
  return <AdminOrdersClient />;
}
