import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import SubjectivePageClient from './components/SubjectivePageClient';

export const metadata: Metadata = {
  title: 'SEE Subjective Practice & AI Evaluation — Samyak Learning',
  description: 'Practice written subjective questions for Class 10 SEE exams and get instant AI grading on your handwritten answers.',
  alternates: {
    canonical: '/practice/subjective',
  },
};

export default function SubjectivePracticePage() {
  return (
    <Suspense fallback={null}>
      <SubjectivePageClient />
    </Suspense>
  );
}
