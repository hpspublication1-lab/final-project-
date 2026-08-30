import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import SeeQuestionBankClient from './components/SeeQuestionBankClient';

export const metadata: Metadata = {
  title: 'SEE Question Bank (1, 2, 3, 4 Marks) & Formula Digest — Samyak Learning',
  description: 'Complete Class 10 SEE Question Bank categorized into 1 Mark, 2 Marks, 3 Marks, and 4 Marks questions with step-by-step model solutions and downloadable formula digests.',
  alternates: {
    canonical: '/see/question-bank',
  },
};

export default function SeeQuestionBankPage() {
  return (
    <Suspense fallback={null}>
      <SeeQuestionBankClient />
    </Suspense>
  );
}
