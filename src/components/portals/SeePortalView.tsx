'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import CoursePortalHeader from '@/components/portals/CoursePortalHeader';
import {
  Play,
  BookOpen,
  HelpCircle,
  FileText,
  Clock,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  Target,
  Award,
  Calendar,
  Layers,
  ChevronRight,
  TrendingUp,
  Bookmark,
  GraduationCap,
  Eye,
  Download,
  Star,
  Check,
} from 'lucide-react';
import SeePracticeSessionModal from '@/components/see/SeePracticeSessionModal';
import SeePdfViewerModal from '@/components/see/SeePdfViewerModal';
import { SEE_QUESTION_BANK, SEE_SUBJECT_HIERARCHY, SeeQuestion } from '@/lib/data/seeQuestionBankData';
import { SEE_DIGEST_LIST, SeeDigestItem } from '@/lib/data/seeDigestData';

interface SeePortalViewProps {
  displayName: string;
  isEnrolled: boolean;
  isPro: boolean;
  profile?: any;
  onOpenCourseSelector?: () => void;
}

const STORAGE_MISTAKES_KEY = 'samyak_see_student_mistakes_v1';
const STORAGE_TODAY_PLAN_KEY = 'samyak_see_today_plan_v1';
const STORAGE_STREAK_KEY = 'samyak_see_student_streak_v1';

export default function SeePortalView({
  displayName,
  isEnrolled,
  isPro,
  profile,
  onOpenCourseSelector,
}: SeePortalViewProps) {
  // Practice Session Modal
  const [practiceSession, setPracticeSession] = useState<{
    questions: SeeQuestion[];
    title: string;
  } | null>(null);

  // PDF Viewer Modal
  const [selectedPdf, setSelectedPdf] = useState<SeeDigestItem | null>(null);

  // Mistakes tracker
  const [studentMistakes, setStudentMistakes] = useState<SeeQuestion[]>([]);

  // Streak Counter
  const [streakDays, setStreakDays] = useState<number>(3);
  const [practiceXp, setPracticeXp] = useState<number>(140);

  // Today's Plan Checklist
  const [todayPlan, setTodayPlan] = useState<{
    lessonWatched: boolean;
    formulaRevised: boolean;
    questionsSolved: boolean;
    testCompleted: boolean;
  }>({
    lessonWatched: true,
    formulaRevised: true,
    questionsSolved: true,
    testCompleted: false,
  });

  useEffect(() => {
    try {
      const savedMistakes = localStorage.getItem(STORAGE_MISTAKES_KEY);
      if (savedMistakes) setStudentMistakes(JSON.parse(savedMistakes));

      const savedPlan = localStorage.getItem(STORAGE_TODAY_PLAN_KEY);
      if (savedPlan) setTodayPlan(JSON.parse(savedPlan));

      const savedStreak = localStorage.getItem(STORAGE_STREAK_KEY);
      if (savedStreak) setStreakDays(Number(savedStreak));
    } catch (e) {
      console.warn('Failed to load local state:', e);
    }
  }, []);

  const togglePlanTask = (key: keyof typeof todayPlan) => {
    setTodayPlan((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(STORAGE_TODAY_PLAN_KEY, JSON.stringify(next));
      } catch (e) {
        console.error('Plan save error:', e);
      }
      return next;
    });
  };

  const recordMistake = (q: SeeQuestion) => {
    setStudentMistakes((prev) => {
      if (prev.some((item) => item.id === q.id)) return prev;
      const next = [q, ...prev];
      try {
        localStorage.setItem(STORAGE_MISTAKES_KEY, JSON.stringify(next));
      } catch (e) {
        console.error('Mistake save error:', e);
      }
      return next;
    });
  };

  // Start Quick Practice by Mark or Subject
  const startPracticeByMark = (marks: number, label: string) => {
    const matched = SEE_QUESTION_BANK.filter((q) => q.marks === marks);
    const questionsToUse = matched.length > 0 ? matched : SEE_QUESTION_BANK.slice(0, 10);
    setPracticeSession({
      questions: questionsToUse,
      title: `🎯 Practice: ${label} (${marks} Mark${marks > 1 ? 's' : ''})`,
    });
  };

  const startSubjectDrill = (subjectId: string, subjectName: string) => {
    const matched = SEE_QUESTION_BANK.filter((q) => q.subject === subjectId);
    setPracticeSession({
      questions: matched.length > 0 ? matched : SEE_QUESTION_BANK.slice(0, 10),
      title: `🎯 Subject Practice Drill: ${subjectName}`,
    });
  };

  const startWeaknessPractice = () => {
    const questionsToUse =
      studentMistakes.length > 0
        ? studentMistakes
        : SEE_QUESTION_BANK.filter((q) => q.chapter.includes('Force') || q.chapter.includes('Electricity'));
    setPracticeSession({
      questions: questionsToUse.slice(0, 10),
      title: '🔥 Targeted Weakness Fixer Session',
    });
  };

  const completedCount = Object.values(todayPlan).filter(Boolean).length;
  const planProgressPct = Math.round((completedCount / 4) * 100);

  return (
    <div className="space-y-7">
      
      {/* 1. Header Portal Bar */}
      <CoursePortalHeader
        displayName={displayName}
        isEnrolled={isEnrolled}
        isPro={isPro}
        onOpenCourseSelector={onOpenCourseSelector}
      />

      {/* 2. EXAM COUNTDOWN & PREPARATION HERO WITH STREAK */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        
        {/* Background decorative ring */}
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        <div className="space-y-3 z-10 max-w-xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 font-mono">
              🎯 YOUR SEE 2083 PREPARATION
            </span>
            <span className="text-xs text-emerald-100 font-bold flex items-center gap-1 font-mono">
              <Clock size={13} /> 120 Days Remaining
            </span>
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-mono flex items-center gap-1 shadow-xs">
              <Flame size={12} className="fill-slate-950" /> {streakDays} Day Streak
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Ready to master your next chapter, {displayName || 'Scholar'}?
          </h1>

          <div className="flex items-center gap-3 pt-1">
            <div className="flex-1 max-w-xs h-3 rounded-full bg-black/20 overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-amber-300 to-emerald-300 rounded-full transition-all duration-500"
                style={{ width: '64%' }}
              />
            </div>
            <span className="text-xs font-black font-mono text-emerald-200">
              64% Prepared
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 z-10 w-full sm:w-auto">
          <Link
            href="/lecture-videos"
            className="px-6 py-3.5 rounded-2xl bg-white hover:bg-emerald-50 text-emerald-950 font-black text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Play size={16} className="fill-emerald-950 text-emerald-950" />
            <span>CONTINUE STUDYING →</span>
          </Link>
        </div>
      </div>

      {/* 3. ⚡ "WHAT SHOULD I DO NOW?" (Intelligent Recommendation Engine) */}
      <div className="p-6 rounded-3xl bg-card border-2 border-emerald-500/30 shadow-md space-y-4 relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center font-bold">
              <Zap size={20} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase font-mono tracking-wider text-emerald-600 block">
                ⚡ INTELLIGENT RECOMMENDATION
              </span>
              <h3 className="text-base font-black text-foreground">
                Your Next Task to Boost Your Marks
              </h3>
            </div>
          </div>

          <span className="text-[11px] font-mono font-bold px-3 py-1 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
            Priority: Physics Numerical Drill
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-muted/40 border border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-500/10 px-2.5 py-0.5 rounded-md font-mono">
                Needs Practice
              </span>
              <span className="text-xs text-foreground font-black">
                Science › Force &amp; Gravitation › Newton's Law
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Master 10 high-yield 3-mark &amp; 4-mark numerical calculations with step-by-step NEB model steps.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <button
              onClick={() => startPracticeByMark(3, 'Force & Gravity Numerical Drill')}
              className="flex-1 md:flex-none px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Sparkles size={14} />
              <span>START NOW (⏱ 12 Mins)</span>
            </button>

            <button
              onClick={() => {
                const doc = SEE_DIGEST_LIST.find((d) => d.id === 'digest-sci-01') || SEE_DIGEST_LIST[0];
                setSelectedPdf(doc);
              }}
              className="px-4 py-2.5 rounded-xl bg-card border border-border hover:bg-muted text-foreground text-xs font-bold transition-colors"
            >
              📖 Revise Formula First
            </button>
          </div>
        </div>
      </div>

      {/* 4. 4-BUTTON CENTRAL LEARNING HUB */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground font-mono">
          🚀 Core 4-Step Learning Engine (LEARN → REVISE → PRACTICE → TEST)
        </h3>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* 1. LEARN */}
          <Link
            href="/lecture-videos"
            className="p-6 rounded-3xl bg-card border border-border hover:border-blue-500 hover:shadow-lg transition-all flex flex-col justify-between space-y-4 group shadow-xs"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play size={24} />
              </div>
              <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600">
                STEP 1
              </span>
            </div>
            <div>
              <h4 className="text-base font-black text-foreground group-hover:text-blue-600 transition-colors">
                📚 LEARN
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Watch Bunny HD video lessons &amp; teacher concept explanations.
              </p>
            </div>
            <div className="text-xs font-bold text-blue-600 flex items-center gap-1">
              <span>Watch Lectures →</span>
            </div>
          </Link>

          {/* 2. REVISE */}
          <Link
            href="/see/question-bank"
            className="p-6 rounded-3xl bg-card border border-border hover:border-amber-500 hover:shadow-lg transition-all flex flex-col justify-between space-y-4 group shadow-xs"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText size={24} />
              </div>
              <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600">
                STEP 2
              </span>
            </div>
            <div>
              <h4 className="text-base font-black text-foreground group-hover:text-amber-600 transition-colors">
                📖 REVISE
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Formula sheets, theorem proofs, and 1-day revision digests.
              </p>
            </div>
            <div className="text-xs font-bold text-amber-600 flex items-center gap-1">
              <span>Open Digests →</span>
            </div>
          </Link>

          {/* 3. PRACTICE */}
          <Link
            href="/see/question-bank"
            className="p-6 rounded-3xl bg-card border border-border hover:border-emerald-500 hover:shadow-lg transition-all flex flex-col justify-between space-y-4 group shadow-xs"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <HelpCircle size={24} />
              </div>
              <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600">
                STEP 3
              </span>
            </div>
            <div>
              <h4 className="text-base font-black text-foreground group-hover:text-emerald-600 transition-colors">
                🧠 PRACTICE
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                4-Tier Question Bank (1 to 10 marks) with step solutions.
              </p>
            </div>
            <div className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <span>Solve Questions →</span>
            </div>
          </Link>

          {/* 4. TEST */}
          <Link
            href="/mock-tests"
            className="p-6 rounded-3xl bg-card border border-border hover:border-purple-500 hover:shadow-lg transition-all flex flex-col justify-between space-y-4 group shadow-xs"
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Award size={24} />
              </div>
              <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600">
                STEP 4
              </span>
            </div>
            <div>
              <h4 className="text-base font-black text-foreground group-hover:text-purple-600 transition-colors">
                📝 TEST
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Full-length 75 &amp; 100 mark timed board mock exams.
              </p>
            </div>
            <div className="text-xs font-bold text-purple-600 flex items-center gap-1">
              <span>Take Mock Test →</span>
            </div>
          </Link>

        </div>
      </div>

      {/* 5. SUBJECT MASTERY MATRIX */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-2">
            <Star size={14} className="text-amber-500" />
            <span>Subject Mastery Matrix (SEE Class 10 Core)</span>
          </h3>
          <Link href="/see/question-bank" className="text-xs font-bold text-emerald-600 hover:underline">
            All Subjects →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {SEE_SUBJECT_HIERARCHY.map((subj) => (
            <button
              key={subj.id}
              onClick={() => startSubjectDrill(subj.id, subj.name)}
              className="p-4 rounded-3xl bg-card border border-border hover:border-emerald-500 hover:shadow-md transition-all text-left flex flex-col justify-between space-y-3 group shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{subj.icon}</span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono">
                  {subj.chapters.length} Units
                </span>
              </div>
              <div>
                <p className="text-xs font-black text-foreground group-hover:text-emerald-600 transition-colors leading-snug truncate">
                  {subj.name}
                </p>
                <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 mt-1">
                  Start Drill →
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 6. MAIN CONTENT 2-COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        
        {/* LEFT COLUMN (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* 🎯 PRACTICE BY MARKS LAUNCHER */}
          <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm sm:text-base font-black text-foreground flex items-center gap-2">
                  <Target size={18} className="text-emerald-500" />
                  <span>🎯 Quick Practice by Marks (द्रुत अभ्यास)</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Target specific question formats tested in the NEB SEE Board examination.
                </p>
              </div>

              <Link
                href="/see/question-bank"
                className="text-xs font-bold text-emerald-600 hover:underline"
              >
                View Full Bank →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { mark: 1, label: '① Very Short', desc: 'Definitions & Laws', color: 'border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 text-blue-600' },
                { mark: 2, label: '② Short Answer', desc: 'Scientific Reasons', color: 'border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-600' },
                { mark: 3, label: '③ Problem Solving', desc: 'Numericals & Steps', color: 'border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 text-amber-600' },
                { mark: 4, label: '④ Long & HOTS', desc: 'Theorems & Proofs', color: 'border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 text-purple-600' },
              ].map((tier) => (
                <button
                  key={tier.mark}
                  onClick={() => startPracticeByMark(tier.mark, tier.label)}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between space-y-2 transition-all hover:scale-102 active:scale-98 ${tier.color}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black">{tier.label}</span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/40 dark:bg-black/20">
                      {tier.mark} Mark{tier.mark > 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-foreground leading-tight">
                    {tier.desc}
                  </p>
                  <span className="text-[10px] font-bold mt-1">Start Drill →</span>
                </button>
              ))}
            </div>
          </div>

          {/* ❌ MY MISTAKES (FIX WEAKNESS WIDGET) */}
          <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center font-bold">
                  <Flame size={18} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-foreground">
                    ❌ My Mistakes &amp; Weak Topics Tracker
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {studentMistakes.length} question{studentMistakes.length === 1 ? '' : 's'} flagged for revision before finals.
                  </p>
                </div>
              </div>

              <button
                onClick={startWeaknessPractice}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 shrink-0"
              >
                <Flame size={14} />
                <span>🔥 FIX MY WEAKNESS NOW</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-muted/40 border border-border flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-muted-foreground">
                  Most repeated mistake: <strong>Cramer's Rule determinant sign inversion</strong> &amp; <strong>g-variation formulas</strong>.
                </span>
              </div>
              <span className="text-[11px] font-bold text-red-600 shrink-0">Reviewing Active</span>
            </div>
          </div>

          {/* 🏫 MY BATCH STREAMLINED CARD */}
          <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                  <GraduationCap size={18} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider font-mono text-blue-600 block">
                    ACTIVE COHORT
                  </span>
                  <h3 className="text-sm sm:text-base font-black text-foreground">
                    SEE 2026 Batch — English &amp; Nepali Medium
                  </h3>
                </div>
              </div>

              <Link
                href="/batches"
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                All Batches →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                href="/batches/see-2026-english-medium"
                className="p-4 rounded-2xl bg-muted/40 border border-border hover:border-emerald-500 transition-all flex items-center justify-between group"
              >
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-mono">
                    🇬🇧 Library ID: 379737
                  </span>
                  <p className="text-xs font-black text-foreground group-hover:text-emerald-600">
                    SEE English Medium Lectures
                  </p>
                </div>
                <ChevronRight size={16} className="text-muted-foreground group-hover:text-emerald-600" />
              </Link>

              <Link
                href="/batches/see-2026-nepali-medium"
                className="p-4 rounded-2xl bg-muted/40 border border-border hover:border-emerald-500 transition-all flex items-center justify-between group"
              >
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 font-mono">
                    🇳🇵 Library ID: 367785
                  </span>
                  <p className="text-xs font-black text-foreground group-hover:text-amber-600">
                    SEE नेपाली माध्यम भिडियो कक्षा
                  </p>
                </div>
                <ChevronRight size={16} className="text-muted-foreground group-hover:text-amber-600" />
              </Link>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Daily Plan & Performance (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* 📅 "TODAY'S PLAN" CHECKLIST */}
          <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-emerald-500" />
                <h3 className="text-sm font-black text-foreground">📅 Today's Plan</h3>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                {completedCount}/4 Done ({planProgressPct}%)
              </span>
            </div>

            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${planProgressPct}%` }}
              />
            </div>

            <div className="space-y-2 text-xs pt-1">
              {[
                { key: 'lessonWatched' as const, label: 'Watch 1 Science / Math Lesson' },
                { key: 'formulaRevised' as const, label: 'Revise 1 Formula Sheet Digest' },
                { key: 'questionsSolved' as const, label: 'Solve 10 Practice Questions' },
                { key: 'testCompleted' as const, label: 'Complete 1 Mini Subject Test' },
              ].map((task) => (
                <button
                  key={task.key}
                  onClick={() => togglePlanTask(task.key)}
                  className="w-full p-2.5 rounded-xl hover:bg-muted/60 transition-colors flex items-center justify-between text-left border border-border/50"
                >
                  <span
                    className={`font-medium ${
                      todayPlan[task.key] ? 'line-through text-muted-foreground' : 'text-foreground font-bold'
                    }`}
                  >
                    {task.label}
                  </span>
                  <CheckCircle2
                    size={16}
                    className={`shrink-0 ml-2 ${
                      todayPlan[task.key] ? 'text-emerald-500' : 'text-muted-foreground/40'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* 📊 PERFORMANCE SUMMARY */}
          <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-500" />
              <span>Subject Performance</span>
            </h3>

            <div className="space-y-3 text-xs">
              {[
                { subj: 'Science & Tech', pct: 78, color: 'bg-emerald-500' },
                { subj: 'Compulsory Math', pct: 62, color: 'bg-amber-500' },
                { subj: 'Optional Math', pct: 54, color: 'bg-red-500' },
                { subj: 'English Language', pct: 88, color: 'bg-teal-500' },
                { subj: 'Social Studies', pct: 74, color: 'bg-blue-500' },
              ].map((s, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground">{s.subj}</span>
                    <span className="font-mono font-bold text-muted-foreground">{s.pct}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${s.color}`}
                      style={{ width: `${s.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* INTERACTIVE PRACTICE MODAL */}
      {practiceSession && (
        <SeePracticeSessionModal
          questions={practiceSession.questions}
          sessionTitle={practiceSession.title}
          onClose={() => setPracticeSession(null)}
          onRecordMistake={recordMistake}
        />
      )}

      {/* PDF VIEWER MODAL */}
      {selectedPdf && (
        <SeePdfViewerModal
          digest={selectedPdf}
          onClose={() => setSelectedPdf(null)}
          userName={displayName}
        />
      )}

    </div>
  );
}
