import React from 'react';
import type { Metadata } from 'next';
import BatchDetailClient from './components/BatchDetailClient';

export const metadata: Metadata = {
  title: 'Batch Details — Samyak CEE Mastery',
};

export default async function BatchDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <BatchDetailClient slug={slug} />;
}
