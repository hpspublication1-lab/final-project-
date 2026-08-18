'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    key: 'faq-1',
    q: 'Is Samyak CEE Mastery aligned with the Nepal CEE syllabus?',
    a: 'Yes, every note, MCQ, and study resource is mapped to the current Health Sciences Entrance Examination (CEE) syllabus prescribed by Medical Education Commission. Our content team updates materials within 48 hours of any syllabus revision.',
  },
  {
    key: 'faq-2',
    q: 'How is the Battle Arena exam fair? Can students cheat?',
    a: 'Battle Arena uses server-authoritative timers and question assignment — no scores are calculated in the browser. Both players receive identical questions at the same timestamp. Tab-switching and full-screen exits are logged. Suspicious activity is flagged for admin review, not auto-penalized.',
  },
  {
    key: 'faq-3',
    q: 'Can I download notes and study offline?',
    a: 'Pro plan students can download allowed PDFs for offline reading. Video lectures and live classes are available in the Samyak Guru App. Premium PDFs use signed URLs that expire — they cannot be shared permanently.',
  },
  {
    key: 'faq-4',
    q: 'What payment methods do you accept?',
    a: 'We accept Fonepay — pay instantly by scanning a dynamic QR with any mobile-banking or wallet app that supports Fonepay. All transactions are verified server-side. We never store payment credentials. Subscriptions can be cancelled anytime from your dashboard.',
  },
  {
    key: 'faq-5',
    q: 'How does the personalized study plan work?',
    a: 'Enter your CEE exam date, daily study hours, and target score. Our engine analyzes your current accuracy, completed chapters, and weak topics to generate a day-by-day plan. The plan adapts weekly based on your practice results.',
  },
  {
    key: 'faq-6',
    q: 'Is there a mobile app available?',
    a: 'Yes, the official Samyak Guru mobile app is available with all features including live classes, video lectures, offline notes, push notifications, and battle arena. It syncs with your website account seamlessly.',
  },
  {
    key: 'faq-7',
    q: 'What is the refund policy?',
    a: 'We offer a 7-day full refund if you are not satisfied. Contact support within 7 days of purchase with your transaction ID. Refunds are processed within 3–5 business days to your original payment method.',
  },
];

export default function FAQSection() {
  const [open, setOpen] = useState<string | null>('faq-1');

  return (
    <section id="faq" className="py-16 bg-muted/30">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="text-center mb-10">
          <p className="section-label mb-2">FAQ</p>
          <h2 className="text-hero-md text-foreground">Frequently Asked Questions</h2>
        </div>

        <div className="max-w-3xl mx-auto space-y-2">
          {faqs?.map((faq) => (
            <div key={faq?.key} className="card-base overflow-hidden">
              <button
                className="w-full flex items-center justify-between gap-4 text-left py-1"
                onClick={() => setOpen(open === faq?.key ? null : faq?.key)}
                aria-expanded={open === faq?.key}
              >
                <span className="font-semibold text-sm text-foreground">{faq?.q}</span>
                <ChevronDown
                  size={16}
                  className={`text-muted-foreground shrink-0 transition-transform duration-200 ${open === faq?.key ? 'rotate-180' : ''}`}
                />
              </button>
              {open === faq?.key && (
                <div className="mt-3 pt-3 border-t border-border animate-fade-in">
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq?.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}