import React from 'react';
import type { Metadata } from 'next';
import FAQPageClient from './components/FAQPageClient';
import { getFullFAQSchema } from '@/lib/seo/structuredData';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions (FAQ) — Samyak Guru Platform',
  description:
    'Find answers to all your questions about CEE 2026 syllabus, SEE Class 10 preparation, IELTS AI speaking, offline access, subscription renewals, installment payments, and refund policies on Samyak Guru.',
  alternates: {
    canonical: '/faq',
  },
  openGraph: {
    title: 'Frequently Asked Questions (FAQ) — Samyak Guru',
    description:
      'Answers to 20+ top questions on syllabus alignment, AI paper grading, offline study, Fonepay payments, and 7-day money-back guarantee.',
    url: 'https://samyakcee.com/faq',
    type: 'website',
  },
};

export default function FAQPage() {
  const faqSchema = getFullFAQSchema();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
        }}
      />
      <FAQPageClient />
    </>
  );
}
