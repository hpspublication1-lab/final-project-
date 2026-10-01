import React from 'react';
import type { Metadata } from 'next';
import BatchesPageClient from './components/BatchesPageClient';

export const metadata: Metadata = {
  title: 'SEE Batches & Video Lectures — Samyak Guru',
  description: 'Structured SEE Class 10 preparation batches with bilingual video lectures, model question solutions, and chapter notes.',
};

export default function BatchesPage() {
  return <BatchesPageClient />;
}
