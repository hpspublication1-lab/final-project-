import React from 'react';
import type { Metadata } from 'next';
import BatchesPageClient from './components/BatchesPageClient';

export const metadata: Metadata = {
  title: 'Batches — Samyak CEE Mastery',
  description: 'Structured CEE preparation batches with live classes, video lectures, notes, and mock tests bundled into one curriculum.',
};

export default function BatchesPage() {
  return <BatchesPageClient />;
}
