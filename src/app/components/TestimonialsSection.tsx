'use client';

import React from 'react';
import { Star, ShieldCheck, CheckCircle2, Award, Quote } from 'lucide-react';
import { SUPPORT_CONFIG } from '@/lib/config/support';

interface StudentReview {
  key: string;
  name: string;
  meritRank: string;
  achievement: string;
  badge: string;
  badgeStyle: string;
  monogram: string;
  quote: string;
  highlightMetric: string;
  cohort: string;
}

const REVIEWS: StudentReview[] = [
  {
    key: 'rev-1',
    name: 'Sushila Karki',
    meritRank: 'CEE Merit Rank #48',
    achievement: 'MBBS Seat · IOM Maharajgunj',
    badge: 'CEE Medical Top 50',
    badgeStyle: 'bg-primary/10 text-primary border-primary/20',
    monogram: 'SK',
    quote: 'The weak-topic detection feature pinpointed the exact sub-chapters of Cardiovascular Physiology where I was losing marks. Practicing strictly under the -0.25 negative marking CBT simulation brought my score up from 142 to 174.',
    highlightMetric: '+32 Marks in 200Q CBT',
    cohort: '2026 Medical Batch',
  },
  {
    key: 'rev-2',
    name: 'Aayush Adhikari',
    meritRank: 'SEE Board GPA 3.95',
    achievement: 'CDC Distinction Holder',
    badge: 'Class 10 Board Topper',
    badgeStyle: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    monogram: 'AA',
    quote: 'The 10-year solved CDC past papers and marking rubrics taught me exactly how board examiners allocate step marks. The daily model derivations helped me secure A+ in both Science and Opt Mathematics.',
    highlightMetric: 'GPA 3.95 Distinction',
    cohort: 'SEE 2081/2082 Batch',
  },
  {
    key: 'rev-3',
    name: 'Bikash Thapa',
    meritRank: 'CEE Merit Rank #82',
    achievement: 'MBBS Seat · BPKIHS Dharan',
    badge: 'BPKIHS Scholar',
    badgeStyle: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    monogram: 'BT',
    quote: 'The server-side examination timer and offline-sync gave me authentic exam hall discipline. Doing weekly 200Q full-length mocks eliminated my exam anxiety completely before the official MEC exam.',
    highlightMetric: '168/200 Final Score',
    cohort: '2026 Medical Batch',
  },
  {
    key: 'rev-4',
    name: 'Pooja Shrestha',
    meritRank: 'IOE Pulchowk Rank #114',
    achievement: 'B.E. Computer Engineering',
    badge: 'TU Pulchowk Campus',
    badgeStyle: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    monogram: 'PS',
    quote: 'The 140-mark engineering entrance mock sets accurately mirrored Pulchowk’s CBT pattern. High-yield physics numerical tricks and calculus short methods were instrumental in my rank.',
    highlightMetric: '118/140 Pulchowk CBT',
    cohort: 'IOE Engineering Batch',
  },
];

export default function TestimonialsSection() {
  return (
    <section id="success" aria-label="Student Success Stories" className="py-20 sm:py-28 bg-muted/20 border-t border-border/60">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 space-y-14">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-wider">
            <Award size={14} />
            <span>Proven Student Results</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Trusted by Top Rankers Across Nepal
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed font-medium">
            Verified study workflows and merit achievements from aspirants preparing for CEE Medical, SEE Board, and IOE Engineering.
          </p>
        </div>

        {/* Review Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {REVIEWS.map((rev) => (
            <div
              key={rev.key}
              className="bg-card border border-border/80 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-5 hover:border-primary/40 hover:shadow-lg transition-all group"
            >
              <div className="space-y-4">
                {/* Header Profile */}
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full border ${rev.badgeStyle}`}>
                    {rev.badge}
                  </span>
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={13} className="fill-current" />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs shrink-0">
                    {rev.monogram}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                      {rev.name}
                    </h3>
                    <p className="text-[11px] font-semibold text-primary">{rev.meritRank}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">{rev.achievement}</p>
                  </div>
                </div>

                <div className="relative">
                  <Quote size={20} className="text-muted-foreground/20 absolute -top-1 -left-1" />
                  <p className="text-xs text-muted-foreground leading-relaxed pl-5 font-normal">
                    &quot;{rev.quote}&quot;
                  </p>
                </div>
              </div>

              {/* Bottom Metric Pill */}
              <div className="pt-3 border-t border-border/60 flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={13} />
                  <span>{rev.highlightMetric}</span>
                </span>
                <span className="text-[10px] text-muted-foreground">{rev.cohort}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Institutional Campus & Support Footprint */}
        <div className="p-6 rounded-2xl bg-card border border-border/80 max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-foreground flex items-center justify-center sm:justify-start gap-2">
              <ShieldCheck size={16} className="text-primary" />
              <span>Samyak Education &amp; Assessment Center</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Old Baneshwor, Kathmandu, Nepal · Official Phone: {SUPPORT_CONFIG.phoneDisplay}
            </p>
          </div>
          <a
            href={SUPPORT_CONFIG.social.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 rounded-xl bg-muted/60 hover:bg-muted border border-border text-xs font-bold text-foreground transition-all shrink-0"
          >
            Visit Official Community
          </a>
        </div>

      </div>
    </section>
  );
}