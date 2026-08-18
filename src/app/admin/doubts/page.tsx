import React from 'react';
import type { Metadata } from 'next';
import AdminDoubtsClient from './components/AdminDoubtsClient';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminDoubtsPage() {
  return <AdminDoubtsClient />;
}
