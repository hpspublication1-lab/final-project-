'use client';

import React from 'react';
import Link from 'next/link';
import {
  Play,
  ArrowRight,
  BarChart2,
  Award,
  Trophy,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { DashboardData } from '../types';

interface TestsTabProps {
  data: DashboardData;
  isSee: boolean;
}

export default function TestsTab({ data, isSee }: TestsTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="space-y-5"
    >
      {/* Active Full Mock Test Hero */}
      <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-indigo-800 text-white rounded-2xl sm:rounded-3xl p-6 sm:p-7 shadow-xs border border-indigo-700/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-indigo-500/20 to-transparent pointer-events-none" />
        <div className="space-y-2 max-w-xl relative z-10">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white border border-white/20">
            {isSee ? '36-Set Board Model Papers' : 'CEE Standard 200Q CBT'}
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {isSee
              ? 'SEE Class 10 Model Examination 2082'
              : 'CEE Full-Length Grand Mock Test #08'}
          </h3>
          <p className="text-xs text-white/80 leading-relaxed">
            {isSee
              ? '3 Hours • CDC Curriculum Standard • Step-by-step scoring with handwritten OCR check'
              : '200 Questions • 3 Hours • -0.25 Negative Marking • Percentile Ranking across all Nepal peers'}
          </p>
        </div>

        <Link
          href="/mock-tests"
          className="px-6 py-3 bg-white text-indigo-950 font-black text-xs rounded-xl hover:bg-white/95 shadow-md transition-all flex items-center gap-2 shrink-0 self-start md:self-auto relative z-10"
        >
          <Play size={14} fill="currentColor" />
          <span>Start Timed Exam</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* Test Performance Breakdown & Past Attempts */}
      <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <BarChart2 size={16} className="text-primary" />
            <h3 className="text-sm font-bold text-foreground tracking-tight">Recent mock results</h3>
          </div>
          <Link href="/mock-tests" className="text-xs font-bold text-primary hover:underline">
            All Mock Sets &rarr;
          </Link>
        </div>

        {data.recentTestPerformance.length > 0 ? (
          <div className="space-y-3">
            {data.recentTestPerformance.map((test) => (
              <div
                key={test.id}
                className="p-4 rounded-xl bg-muted/20 border border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-primary/40 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h5 className="text-xs sm:text-sm font-bold text-foreground">
                      {test.title}
                    </h5>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.2 rounded font-mono ${
                        test.percentage >= 75
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : test.percentage >= 50
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400'
                      }`}
                    >
                      {test.percentage}% Accuracy
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    Attempted on {test.date}
                  </span>
                </div>

                <div className="flex items-center gap-4 self-start sm:self-auto">
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-foreground font-mono">
                      {test.score} / {test.totalMarks}
                    </span>
                    <span className="text-[10px] text-muted-foreground block font-mono">
                      Score
                    </span>
                  </div>

                  <Link
                    href={test.reviewHref}
                    className="px-3.5 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs transition-colors"
                  >
                    Review Mistakes
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-muted/10 border border-border/50 rounded-xl space-y-2">
            <Award size={26} className="mx-auto text-muted-foreground/60" />
            <h4 className="text-xs font-bold text-foreground">No mock tests attempted yet</h4>
            <p className="text-[11px] text-muted-foreground">
              Take your first timed mock exam to generate rank predictions and error diagnosis.
            </p>
            <div className="pt-1">
              <Link href="/mock-tests" className="btn-primary text-xs font-bold py-2 px-4 rounded-xl inline-flex">
                Take First Mock Test
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Rank Predictor CTA */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Trophy size={18} />
          </span>
          <div>
            <h4 className="text-xs font-bold text-foreground">
              Nepal CEE / SEE Rank Predictor
            </h4>
            <p className="text-[11px] text-muted-foreground">
              Simulate your merit standing and scholarship probability based on mock accuracy.
            </p>
          </div>
        </div>
        <Link
          href="/rank-predictor"
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs shrink-0 self-start sm:self-auto"
        >
          <span>Calculate My Rank</span>
          <ArrowRight size={13} />
        </Link>
      </div>
    </motion.div>
  );
}
