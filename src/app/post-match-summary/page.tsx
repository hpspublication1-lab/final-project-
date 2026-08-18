import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import PostMatchSummaryClient from './components/PostMatchSummaryClient';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function PostMatchSummaryPage() {
  return (
    <Suspense fallback={null}>
      <PostMatchSummaryClient />
    </Suspense>
  );
}
