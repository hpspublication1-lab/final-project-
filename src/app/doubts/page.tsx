import React from 'react';
import type { Metadata } from 'next';
import DoubtsPageClient from './components/DoubtsPageClient';

export const metadata: Metadata = {
  title: 'Doubts — Samyak CEE Mastery',
  description: 'Ask a question and get it answered by teachers.',
};

export default function DoubtsPage() {
  return <DoubtsPageClient />;
}
