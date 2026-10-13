'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PublicNav from '@/components/PublicNav';
import HomepageFooter from '@/app/components/HomepageFooter';
import StudentGroupOfferCard from '@/components/courses/StudentGroupOfferCard';
import {
  STUDENT_GROUPS_LIST,
  StudentGroupId,
  getStudentGroupOffer,
} from '@/lib/courses/studentGroupOffers';
import {
  BookOpen,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  GraduationCap,
  Stethoscope,
  Zap,
  ArrowRight,
  Filter,
  AlertTriangle,
  Lock,
} from 'lucide-react';

export default function FreeResourcesPage() {
  const [activeGroupId, setActiveGroupId] = useState<StudentGroupId>('class_10_see');
  const [filterMode, setFilterMode] = useState<'all' | 'single'>('single');

  const activeOffer = getStudentGroupOffer(activeGroupId) || STUDENT_GROUPS_LIST[0];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <PublicNav />

      <main className="flex-1 pt-28 sm:pt-36 pb-20">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 space-y-12">
          
          {/* ── Page Header ─────────────────────────────────────────────── */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-wider">
              <BookOpen size={14} />
              <span>Reviewed Academic Resources</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight">
              Free Offer Menu by Student Group
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed">
              Every free resource is aligned to your specific curriculum, reviewed by a responsible subject teacher,
              and crafted without generic question banks.
            </p>
          </div>

          {/* ── Pedagogical Standard Notice ─────────────────────────────── */}
          <div className="max-w-4xl mx-auto p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-300">
            <div className="flex items-start gap-2.5">
              <ShieldCheck size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Content Integrity Guarantee:</span> Resources are launched only for subjects with reviewed content and a responsible teacher. A single generic question bank is never presented as suitable across different streams, entrance exams, or Lok Sewa posts.
              </div>
            </div>
            <span className="shrink-0 px-2.5 py-1 rounded-lg bg-amber-500/20 font-mono text-[10px] uppercase font-bold">
              Stream-Isolated
            </span>
          </div>

          {/* ── Student Group Filter Tabs ────────────────────────────────── */}
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Filter size={13} />
                <span>Select Your Student Group</span>
              </span>
              <button
                onClick={() => setFilterMode(filterMode === 'single' ? 'all' : 'single')}
                className="text-xs font-semibold text-primary hover:underline"
              >
                {filterMode === 'single' ? 'View All Groups at Once' : 'Switch to Focused View'}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {STUDENT_GROUPS_LIST.map((group) => {
                const isActive = activeGroupId === group.id && filterMode === 'single';
                return (
                  <button
                    key={group.id}
                    onClick={() => {
                      setActiveGroupId(group.id);
                      setFilterMode('single');
                    }}
                    className={`px-3 py-3 rounded-2xl border text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-1 ${
                      isActive
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'bg-card text-muted-foreground border-border/80 hover:text-foreground hover:bg-muted/70'
                    }`}
                  >
                    <span>{group.shortName}</span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded-sm ${isActive ? 'bg-black/20 text-white' : 'text-muted-foreground'}`}>
                      {group.targetExam.includes('MEC') ? 'MECEE' : group.targetExam.includes('IOE') ? 'IOE CBT' : group.targetExam.includes('PSC') ? 'PSC Nepal' : 'NEB Board'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Main Offer Display ───────────────────────────────────────── */}
          <div className="max-w-4xl mx-auto space-y-8">
            {filterMode === 'single' ? (
              <StudentGroupOfferCard offer={activeOffer} />
            ) : (
              STUDENT_GROUPS_LIST.map((offer) => (
                <StudentGroupOfferCard key={offer.id} offer={offer} />
              ))
            )}
          </div>

          {/* ── Direct Gate Shortcut ─────────────────────────────────────── */}
          <div className="max-w-4xl mx-auto p-6 sm:p-8 rounded-3xl bg-muted/40 border border-border/80 text-center space-y-4">
            <h3 className="text-xl font-bold text-foreground">Want to configure your student dashboard track?</h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
              You can jump to the Learning Track Gate anytime to switch between CEE, IOE, Lok Sewa, Class 11, Class 12, or SEE.
            </p>
            <Link
              href="/gate"
              className="btn-primary text-xs font-bold py-3 px-6 rounded-xl inline-flex items-center gap-2 shadow-sm"
            >
              <span>Open Learning Track Gate</span>
              <ArrowRight size={14} />
            </Link>
          </div>

        </div>
      </main>

      <HomepageFooter />
    </div>
  );
}
