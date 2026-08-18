import React from 'react';
import type { Metadata } from 'next';
import PaymentSuccessClient from './components/PaymentSuccessClient';

export const metadata: Metadata = {
  title: 'Payment Successful — Samyak CEE Mastery',
  robots: { index: false, follow: false },
};

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan } = await searchParams;
  return <PaymentSuccessClient plan={plan ?? ''} />;
}
