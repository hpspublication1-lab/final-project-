import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import QuestionBankRouterClient from './components/QuestionBankRouterClient';

export const metadata: Metadata = {
  title: 'Question Bank (SEE Class 10 & CEE Medical) — Samyak Learning',
  description: 'Comprehensive question repositories for SEE Board Exam (1, 2, 3, 4 Marks with model solutions) and CEE Medical Entrance Exam (15,000+ topic-wise MCQs).',
  alternates: {
    canonical: '/question-bank',
  },
};

export default function QuestionBankGlobalPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <QuestionBankRouterClient />
    </Suspense>
  );
}
