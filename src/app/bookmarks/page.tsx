import React from 'react';
import type { Metadata } from 'next';
import BookmarksPageClient from './components/BookmarksPageClient';

export const metadata: Metadata = {
  title: 'Bookmarked Questions — Samyak CEE Mastery',
  description: 'Review the MCQs you saved. Revisit tricky questions, check explanations, and master your weak spots.',
  alternates: { canonical: '/bookmarks' },
  robots: { index: false, follow: false },
};

export default function BookmarksPage() {
  return <BookmarksPageClient />;
}
