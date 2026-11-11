import React from 'react';
import type { Metadata } from 'next';
import VerifyReceiptClient from './components/VerifyReceiptClient';

export const metadata: Metadata = {
  title: 'Official Receipt & Tax Invoice Verification Portal',
  description:
    'Instant cryptographic verification (HMAC-SHA256) of authentic fee receipts and tax invoices issued by Samyak Education & Research Academy.',
};

export default async function VerifyReceiptPage({
  searchParams,
}: {
  searchParams: Promise<{ inv?: string; code?: string }>;
}) {
  const { inv, code } = await searchParams;
  return <VerifyReceiptClient initialInvoice={inv || ''} initialCode={code || ''} />;
}
