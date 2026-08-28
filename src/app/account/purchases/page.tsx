import React from 'react';
import PurchasesClient from './components/PurchasesClient';

export const metadata = {
  title: 'My Purchases & Enrollments — Samyak Guru',
  description: 'View your enrolled courses, payment receipts, and order history.',
};

export default function PurchasesPage() {
  return <PurchasesClient />;
}
