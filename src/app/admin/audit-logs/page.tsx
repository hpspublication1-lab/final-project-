import React from 'react';
import type { Metadata } from 'next';
import AdminAuditLogsClient from './components/AdminAuditLogsClient';

export const metadata: Metadata = {
  title: 'Platform Audit Trail | Samyak Tutor Admin',
  robots: { index: false, follow: false },
};

export default function AdminAuditLogsPage() {
  return <AdminAuditLogsClient />;
}
