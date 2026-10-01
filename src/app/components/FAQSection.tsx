'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    key: 'faq-1',
    q: 'Is Samyak SEE aligned with the official Nepal CDC Curriculum?',
    a: 'Yes, 100%. Every chapter, model question, and marking rubric is strictly mapped to the current Curriculum Development Centre (CDC) syllabus for Grade 10, covering both English and Nepali medium schools.',
  },
  {
    key: 'faq-2',
    q: 'Is Samyak CEE aligned with the Medical Education Commission (MEC) exam?',
    a: 'Yes. Our 15,000+ MCQs, sub-chapter notes, and 200-question timed mock exams follow the exact MECEE blueprint for MBBS, BDS, B.Sc Nursing and allied health sciences, including negative marking (-0.25) and subject-wise weighting.',
  },
  {
    key: 'faq-3',
    q: 'How do the daily live classes work?',
    a: 'Live classes take place in interactive virtual classrooms powered by 100ms. Students can ask questions via live chat or microphone. All classes are automatically recorded in high-definition and available within minutes for anytime revision.',
  },
  {
    key: 'faq-4',
    q: 'How does Fonepay payment work?',
    a: 'During checkout, a dynamic Fonepay QR code is generated instantly. You can scan and pay directly using any of 50+ Nepali mobile banking apps (NIC Asia, Nabil, Global IME, Sanima, Prabhu, etc.). Your access is activated automatically the moment the transaction completes.',
  },
  {
    key: 'faq-5',
    q: 'Can I study on my mobile phone or tablet?',
    a: 'Yes! Samyak Guru is 100% responsive across mobile, tablet, and desktop browsers, and also supports our progressive web app (PWA) to attend live classes, solve timed mock tests, and access notes.',
  },
  {
    key: 'faq-6',
    q: 'What is your refund policy?',
    a: 'We offer a 7-day 100% money-back guarantee for full course enrollments if less than 10% of the lessons have been watched and fewer than 2 full mock exams have been submitted. Prebooking tokens (Rs 300) are also 100% refundable prior to batch commencement.',
  },
];

export default function FAQSection() {
  const [open, setOpen] = useState<string | null>('faq-1');

  return (
    <section id="faq" className="py-20 bg-muted/20 border-t border-border/60">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-wider">
            <span>Frequently Asked Questions</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Have Questions? We Have Answers.
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            Everything you need to know about our batches, curriculum alignment, and enrollment process.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-3">
          {FAQS.map((faq) => {
            const isOpen = open === faq.key;
            return (
              <div
                key={faq.key}
                className="bg-card border border-border/80 rounded-2xl overflow-hidden transition-all shadow-xs"
              >
                <button
                  onClick={() => setOpen(isOpen ? null : faq.key)}
                  className="w-full flex items-center justify-between gap-4 text-left p-5 font-bold text-sm sm:text-base text-foreground hover:text-primary transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-muted-foreground transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-primary' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/40 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
