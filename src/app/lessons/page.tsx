import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import SubjectsPageClient from '../subjects/components/SubjectsPageClient';

export const metadata: Metadata = {
  title: 'CEE Video Lessons & Chapter Modules — Samyak CEE Mastery',
  description: 'Explore high-yield video lectures, chapter notes, and concept breakdown for CEE 2026 Biology, Chemistry, Physics, and MAT.',
  alternates: {
    canonical: '/lesson',
  },
  openGraph: {
    title: 'CEE Video Lessons — Samyak CEE',
    description: 'High-yield video lessons and chapter modules for CEE aspirants',
    url: '/lesson',
    type: 'website',
    images: [
      {
        url: '/assets/images/app_logo.png',
        width: 1200,
        height: 630,
        alt: 'CEE Video Lessons — Samyak CEE',
      },
    ],
  },
};

export default function LessonPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>}>
      <SubjectsPageClient />
    </Suspense>
  );
}
