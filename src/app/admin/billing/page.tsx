import React from 'react';
import type { Metadata } from 'next';
import AdminBillingClient from './components/AdminBillingClient';

export const metadata: Metadata = {
  title: 'Billing & Financial Reconciliation Ledger — Admin',
  description: 'Cryptographically secured corporate billing, tax reporting, and revenue reconciliation ledger.',
  robots: { index: false, follow: false },
};

export default function AdminBillingPage() {
  return <AdminBillingClient />;
}
