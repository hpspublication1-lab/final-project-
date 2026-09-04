import React from 'react';
import type { Metadata } from 'next';
import AdminLeadsClient from './components/AdminLeadsClient';

export const metadata: Metadata = {
  title: 'Lead Management & Behavioral CRM — Admin Panel',
  robots: { index: false, follow: false },
};

export default function AdminLeadsPage() {
  return <AdminLeadsClient />;
}
