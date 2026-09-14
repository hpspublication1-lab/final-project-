import React from 'react';
import type { Metadata } from 'next';
import AdminResourcesClient from './components/AdminResourcesClient';

export const metadata: Metadata = {
  title: 'PDF & Handout Resources Management | Samyak Tutor Admin',
  robots: { index: false, follow: false },
};

export default function AdminResourcesPage() {
  return <AdminResourcesClient />;
}
