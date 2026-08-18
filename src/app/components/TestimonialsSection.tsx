import React from 'react';
import { Star, TrendingUp } from 'lucide-react';

const testimonials = [
  {
    key: 'test-1',
    name: 'Sushila Karki',
    college: 'KIST Medical College, Lalitpur',
    subject: 'CEE MBBS 1st Year (Rank 147)',
    sectorBadge: 'CEE Medical',
    initial: 'S',
    color: 'bg-primary/20 text-primary',
    rating: 5,
    percentile: 94,
    quote: 'The weak-topic detection feature literally told me exactly which chapters of Cell Biology I was weak in. I revised those 3 chapters and jumped from 68% to 91% accuracy in just two weeks.',
    beforeRank: 1842,
    afterRank: 147,
  },
  {
    key: 'test-2',
    name: 'Aayush Adhikari',
    college: 'St. Xavier\'s +2 Science, Kathmandu',
    subject: 'SEE 2081 — 4.0 GPA Topper',
    sectorBadge: 'SEE Class 10',
    initial: 'A',
    color: 'bg-bio/20 text-bio',
    rating: 5,
    percentile: 99,
    quote: 'Pradeep Sir\'s Science & Opt Math video lectures made hard topics so simple. I solved all model papers on Samyak and secured A+ in every single subject!',
    beforeRank: null,
    afterRank: '4.0 GPA',
  },
  {
    key: 'test-3',
    name: 'Pooja Superior',
    college: 'University of Sydney Aspirant',
    subject: 'IELTS Band 8.5 Overall',
    sectorBadge: 'English & IELTS',
    initial: 'P',
    color: 'bg-amber-500/20 text-amber-600',
    rating: 5,
    percentile: 98,
    quote: 'The AI Speaking Feedback gave me instant score reports on my pronunciation and fluency. I practiced daily for 3 weeks and got Band 8.5 on my first IELTS attempt!',
    beforeRank: null,
    afterRank: 'Band 8.5',
  },
  {
    key: 'test-4',
    name: 'Rohan Gurung',
    college: 'Upwork Freelance Developer',
    subject: 'Python & AI Prompts Graduate',
    sectorBadge: 'Digital & AI',
    initial: 'R',
    color: 'bg-purple-500/20 text-purple-600',
    rating: 5,
    percentile: 95,
    quote: 'I had zero coding experience. Nabin Sir\'s Python Zero to Hero course taught me real projects. I set up my Upwork gig and landed my first $300 client project within a month!',
    beforeRank: null,
    afterRank: '$300 Earned',
  },
];

export default function TestimonialsSection() {
  return (
    <section id="success" className="py-16 bg-background">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="text-center mb-10">
          <p className="section-label mb-2">Student Success</p>
          <h2 className="text-hero-md text-foreground">Real Results from Real Students</h2>
          <p className="text-muted-foreground mt-2">
            These are actual CEE students who used Samyak CEE Mastery
          </p>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-4 gap-5">
          {testimonials?.map((t) => (
            <div key={t?.key} className="card-base card-hover flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${t?.color} flex items-center justify-center font-bold text-lg`}>
                    {t?.initial}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{t?.name}</p>
                    <p className="text-xs text-muted-foreground">{t?.subject}</p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: t?.rating })?.map((_, i) => (
                    <Star key={`star-${t?.key}-${i}`} size={12} className="text-ma fill-ma" />
                  ))}
                </div>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed flex-1 italic">
                &ldquo;{t?.quote}&rdquo;
              </p>

              <div className="flex items-center gap-2 bg-success-light rounded-xl px-3 py-2">
                <TrendingUp size={14} className="text-success shrink-0" />
                <div className="text-xs">
                  {t?.beforeRank ? (
                    <span className="text-foreground font-medium">
                      Rank <span className="text-error line-through" suppressHydrationWarning>{t?.beforeRank?.toLocaleString()}</span>
                      {' → '}
                      <span className="text-success font-bold">{t?.afterRank}</span>
                    </span>
                  ) : (
                    <span className="text-success font-bold">First attempt — Rank {t?.afterRank}</span>
                  )}
                </div>
                <span className="ml-auto text-xs font-bold text-success">{t?.percentile}th %ile</span>
              </div>

              <p className="text-xs text-muted-foreground">{t?.college}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}