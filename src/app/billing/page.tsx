import React from 'react';
import type { Metadata } from 'next';
import BillingSectionClient from './components/BillingSectionClient';

export const metadata: Metadata = {
  title: 'Billing & Secured Payment Ledger',
  description: 'Immutable, cryptographically signed invoice and payment records.',
  robots: { index: false, follow: false },
};

export default function BillingPage() {
  return <BillingSectionClient />;
}
