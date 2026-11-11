import React from 'react';
import type { Metadata } from 'next';
import PublicReceiptClient from './components/PublicReceiptClient';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ invoiceNumber: string }>;
}): Promise<Metadata> {
  const { invoiceNumber } = await params;
  return {
    title: `Tax Invoice ${decodeURIComponent(invoiceNumber)}`,
    description: `Official Tax Invoice & Fee Receipt issued by Samyak Education & Research Academy.`,
    robots: { index: false, follow: false },
  };
}

export default async function PublicReceiptPage({
  params,
}: {
  params: Promise<{ invoiceNumber: string }>;
}) {
  const { invoiceNumber } = await params;
  return <PublicReceiptClient invoiceNumber={decodeURIComponent(invoiceNumber)} />;
}
