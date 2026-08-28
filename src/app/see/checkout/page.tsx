import React, { Suspense } from 'react';
import SeeCheckoutClient from './components/SeeCheckoutClient';

export const metadata = {
  title: 'Enroll in SEE Class 10 Board Master Batch — Samyak Guru',
  description: 'Instant eSewa, Khalti, IME Pay & Fonepay payment checkout for SEE Class 10 Board Exam preparation.',
};

export default function SeeCheckoutPage() {
  return (
    <Suspense fallback={null}>
      <SeeCheckoutClient />
    </Suspense>
  );
}
