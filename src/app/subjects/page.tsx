import React from 'react';
import type { Metadata } from 'next';
import SubjectsPageClient from './components/SubjectsPageClient';

export const metadata: Metadata = {
  title: 'Subjects & Curriculum — Samyak Guru',
  description: 'Explore chapter-wise video lessons, high-yield revision notes, and practice question banks for SEE Class 10 and CEE Medical Entrance.',
  alternates: {
    canonical: '/subjects',
  },
  openGraph: {
    title: 'Subjects & Curriculum — Samyak Guru',
    description: 'Comprehensive subject curriculum for SEE Class 10 and CEE Medical Entrance',
    url: '/subjects',
    type: 'website',
    images: [
      {
        url: '/assets/images/app_logo.png',
        width: 1200,
        height: 630,
        alt: 'Subjects & Curriculum — Samyak Guru',
      },
    ],
  },
};

export default function SubjectsPage() {
  return <SubjectsPageClient />;
}
