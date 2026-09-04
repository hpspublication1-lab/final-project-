import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import PracticePageClient from '../practice/components/PracticePageClient';

export const metadata: Metadata = {
  title: 'CEE MCQ Bank (15,000+ Questions) — Samyak CEE Mastery',
  description: 'Access 15,000+ high-yield medical entrance MCQs for CEE 2026. Filter by Biology, Chemistry, Physics, and MAT with comprehensive model answers.',
  alternates: {
    canonical: '/mcq-bank',
  },
  openGraph: {
    title: '15,000+ CEE MCQ Bank — Samyak CEE',
    description: 'High-yield medical entrance question bank with step-by-step solutions',
    url: '/mcq-bank',
    type: 'website',
    images: [
      {
        url: '/assets/images/app_logo.png',
        width: 1200,
        height: 630,
        alt: 'CEE MCQ Bank — Samyak CEE',
      },
    ],
  },
};

export default function McqBankPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>}>
      <PracticePageClient />
    </Suspense>
  );
}
