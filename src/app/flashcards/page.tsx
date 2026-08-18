import React from 'react';
import type { Metadata } from 'next';
import FlashcardsClient from './components/FlashcardsClient';
import PremiumGate from '@/components/PremiumGate';

export const metadata: Metadata = {
  title: 'Flashcards — Samyak CEE Mastery',
  description: 'High-yield CEE flashcards with spaced repetition (SM-2). Review at scientifically optimal intervals so you never forget.',
  alternates: { canonical: '/flashcards' },
};

export default function FlashcardsPage() {
  return (
    <PremiumGate feature="Flashcards">
      <FlashcardsClient />
    </PremiumGate>
  );
}
