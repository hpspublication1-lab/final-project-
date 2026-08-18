import React from 'react';
import type { Metadata } from 'next';
import AdminBatchesClient from './components/AdminBatchesClient';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminBatchesPage() {
  return <AdminBatchesClient />;
}
