'use client';

import React from 'react';
import Link from 'next/link';
import { GraduationCap, BookOpen, Sparkles, CheckCircle2, ArrowRight, FileText, Bot, Trophy, Target, Calculator, Microscope, Globe } from 'lucide-react';

interface PortalViewProps {
  displayName: string;
  isPro: boolean;
  profile: any;
}

const seeSubjects = [
  { id: 'compulsory_science', name: 'Compulsory Science', icon: '🔬', chapters: 24, gpaTarget: 'A+', solvedSets: 14, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
  { id: 'compulsory_math', name: 'Compulsory Math', icon: '📐', chapters: 20, gpaTarget: 'A+', solvedSets: 18, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
  { id: 'optional_math', name: 'Optional Math', icon: '📊', chapters: 16, gpaTarget: 'A+', solvedSets: 12, color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
  { id: 'english', name: 'SEE English', icon: '📚', chapters: 15, gpaTarget: 'A+', solvedSets: 10, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  { id: 'social_studies', name: 'Social Studies', icon: '🌍', chapters: 18, gpaTarget: 'A+', solvedSets: 9, color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' },
];

const seeQuickActions = [
  {
    key: 'qa-subjective',
    label: 'AI Subjective Grading',
    desc: 'Upload photo of handwritten answer',
    href: '/practice/subjective',
    icon: Sparkles,
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/20',
  },
  {
    key: 'qa-model-papers',
    label: 'NEB Model Papers',
    desc: 'Full 10-Year Question Sets',
    href: '/mock-tests',
    icon: FileText,
    color: 'bg-primary/10 text-primary',
    border: 'border-primary/20',
  },
  {
    key: 'qa-subjects',
    label: 'Class 10 Subjects',
    desc: 'Chapter notes & formulas',
    href: '/subjects',
    icon: BookOpen,
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/20',
  },
  {
    key: 'qa-ai-tutor',
    label: 'SEE AI Tutor',
    desc: 'Math & Science Step-by-Step',
    href: '/ai-tutor',
    icon: Bot,
    color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    border: 'border-purple-500/20',
  },
];

export default function SeePortalView({ displayName, isPro }: PortalViewProps) {
  return (
    <div className="space-y-6">
      {/* SEE Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-500/15 via-card to-teal-500/10 border border-emerald-500/20 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 shadow-xs">
              <GraduationCap size={15} /> SEE Class 10 Board Portal
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              Session 2082 / 2083
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Target 4.0 GPA, {displayName} 🎓
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Complete NEB Class 10 syllabus with solved past question banks &amp; AI subjective evaluation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-card border border-emerald-500/30 text-xs font-bold text-emerald-600">
            <Target size={16} className="text-emerald-500" />
            <span>Target: 4.0 GPA</span>
          </div>
          <Link href="/practice/subjective" className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all">
            <span>AI Answer Evaluator</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* SEE Quick Actions */}
      <div>
        <h2 className="text-sm sm:text-base font-extrabold text-foreground mb-3 flex items-center gap-2">
          <Sparkles size={16} className="text-emerald-500" /> Class 10 Academic Launchpad
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {seeQuickActions.map((action) => (
            <Link
              key={action.key}
              href={action.href}
              className={`flex flex-col items-center text-center gap-2.5 p-4 rounded-2xl border bg-card hover:shadow-md transition-all duration-150 hover:-translate-y-0.5 ${action.border}`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${action.color}`}>
                <action.icon size={22} />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground leading-tight">{action.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{action.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Featured: SEE AI Subjective Evaluation Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-bold">
            <Sparkles size={13} /> Exclusive SEE Innovation
          </div>
          <h3 className="text-xl sm:text-2xl font-black">AI Handwritten Answer Sheet Grading</h3>
          <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
            Write your answer on paper for Science or Math, upload a quick photo, and get instant step-by-step marks, missing steps, and NEB rubric feedback!
          </p>
        </div>
        <Link
          href="/practice/subjective"
          className="px-6 py-3.5 rounded-2xl bg-white text-emerald-900 font-black text-xs sm:text-sm hover:bg-emerald-50 transition-all shadow-lg shrink-0 flex items-center gap-2"
        >
          <span>Try Subjective Evaluation</span>
          <ArrowRight size={16} />
        </Link>
      </div>

      {/* Class 10 Subjects Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
            <BookOpen size={17} className="text-emerald-500" /> Class 10 Board Subjects ({seeSubjects.length})
          </h2>
          <Link href="/subjects" className="text-xs font-bold text-emerald-600 hover:underline">
            View All Chapters →
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {seeSubjects.map((sub) => (
            <div key={sub.id} className="p-5 rounded-3xl bg-card border border-border hover:border-emerald-500/40 shadow-xs hover:shadow-md transition-all space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{sub.icon}</span>
                  <div>
                    <h3 className="text-sm font-extrabold text-foreground">{sub.name}</h3>
                    <p className="text-[11px] text-muted-foreground">{sub.chapters} Chapters · NEB Solved</p>
                  </div>
                </div>
                <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${sub.color}`}>
                  Target {sub.gpaTarget}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs text-muted-foreground">
                <span>{sub.solvedSets} Model Papers</span>
                <Link href="/subjects" className="font-bold text-emerald-600 hover:underline flex items-center gap-1">
                  Study Notes <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
