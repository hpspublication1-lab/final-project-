'use client';

import React from 'react';
import Link from 'next/link';
import {
  Brain,
  Send,
  BookOpen,
  Zap,
  ArrowRight,
  Award,
  FileText,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { DashboardData } from '../types';

interface DoubtsTabProps {
  data: DashboardData;
  doubtQuestion: string;
  setDoubtQuestion: (val: string) => void;
  handleAskDoubt: (e: React.FormEvent) => void;
}

export default function DoubtsTab({
  data,
  doubtQuestion,
  setDoubtQuestion,
  handleAskDoubt,
}: DoubtsTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="space-y-5"
    >
      {/* Ask AI Saarthi Doubt Box */}
      <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-3 border-b border-border/60 pb-3">
          <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Brain size={18} />
          </span>
          <div>
            <h3 className="text-sm font-bold text-foreground tracking-tight">
              Ask a doubt
            </h3>
            <p className="text-xs text-muted-foreground">
              Step-by-step help for lectures, derivations, and exam traps
            </p>
          </div>
        </div>

        <form onSubmit={handleAskDoubt} className="space-y-3">
          <div className="relative">
            <textarea
              rows={3}
              placeholder="Type or paste your doubt here... (e.g. Why does boiling point increase with pressure? Solve a numerical problem...)"
              value={doubtQuestion}
              onChange={(e) => setDoubtQuestion(e.target.value)}
              className="w-full p-3.5 bg-muted/20 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-primary resize-none"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              Supports KaTeX formulas &amp; CDC exam rubrics
            </span>
            <button
              type="submit"
              disabled={!doubtQuestion.trim()}
              className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Send size={12} />
              <span>Ask AI Saarthi</span>
            </button>
          </div>
        </form>
      </div>

      {/* Galti Sudhar & Flashcards 2-Column Grid */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Galti Sudhar Mistake Diary */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-2xs space-y-3.5 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-sm">
                <BookOpen size={16} />
              </span>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400">
                {data.gamification?.dueFlashcardsCount
                  ? `${data.gamification.dueFlashcardsCount} Due Today`
                  : 'Auto-Logged'}
              </span>
            </div>
            <h4 className="text-sm font-bold text-foreground">
              Galti Sudhar • Error Notebook
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Every question you answered incorrectly in mock tests, quizzes, and Battle Arena is saved here for targeted revision.
            </p>
          </div>

          <Link
            href="/mistake-analyser"
            className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 font-bold text-xs text-center border border-rose-500/30 flex items-center justify-center gap-1.5 transition-all"
          >
            <span>Open Galti Sudhar Mistake Diary</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {/* SM-2 Spaced Repetition Flashcards */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-2xs space-y-3.5 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm">
                <Zap size={16} />
              </span>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                {data.gamification?.dueFlashcardsCount
                  ? `${data.gamification.dueFlashcardsCount} Cards Scheduled`
                  : 'SuperMemo SM-2'}
              </span>
            </div>
            <h4 className="text-sm font-bold text-foreground">
              Active Recall Flashcards
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              High-yield definitions, formula derivations, and past medical entrance trivia scheduled for review today.
            </p>
          </div>

          <Link
            href="/flashcards"
            className="w-full py-2.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold text-xs text-center border border-indigo-500/30 flex items-center justify-center gap-1.5 transition-all"
          >
            <span>Review Due Flashcards</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* Gamification Achievements & Mastery Badges */}
      {data.gamification?.badges && data.gamification.badges.length > 0 && (
        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <Award size={16} className="text-amber-500" />
              <h3 className="text-sm font-bold text-foreground">
                Mastery Badges &amp; Milestones
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-muted-foreground">
              {data.gamification.badges.filter((b) => b.unlocked).length} of{' '}
              {data.gamification.badges.length} Unlocked
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {data.gamification.badges.map((badge) => (
              <div
                key={badge.id}
                className={`p-3 rounded-xl border text-center flex flex-col items-center justify-between space-y-2 transition-all ${
                  badge.unlocked
                    ? 'bg-amber-500/5 border-amber-500/30'
                    : 'bg-muted/10 border-border/60 opacity-50 grayscale'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Award size={20} />
                </div>
                <div className="space-y-0.5">
                  <h5 className="text-[11px] font-bold text-foreground leading-snug">
                    {badge.title}
                  </h5>
                  <p className="text-[9px] text-muted-foreground line-clamp-2">
                    {badge.description}
                  </p>
                </div>
                <span
                  className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded-full ${
                    badge.unlocked
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {badge.unlocked ? 'Unlocked' : 'Locked'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Vision Marker (Handwritten Paper Check) */}
      <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-foreground">
              AI Subjective Paper Grader (Vision Marker)
            </h3>
          </div>
          <Link href="/vision-marker" className="text-xs font-bold text-primary hover:underline">
            Submit Paper &rarr;
          </Link>
        </div>

        {data.pendingAssignments.length > 0 ? (
          <div className="space-y-2.5">
            {data.pendingAssignments.map((ass) => (
              <div
                key={ass.id}
                className="p-3 rounded-xl bg-muted/20 border border-border/60 flex items-center justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <h5 className="text-xs font-bold text-foreground">{ass.title}</h5>
                  <span className="text-[10px] text-muted-foreground">
                    Submitted {ass.submittedAt}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-foreground font-mono">
                    {ass.obtainedMarks !== undefined
                      ? `${ass.obtainedMarks} / ${ass.totalMarks}`
                      : 'Evaluating...'}
                  </span>
                  <Link
                    href={ass.actionHref}
                    className="text-[10px] font-bold text-primary hover:underline block"
                  >
                    View Rubric
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-muted/15 border border-border/50 text-center space-y-2">
            <FileText size={22} className="mx-auto text-muted-foreground/60" />
            <p className="text-xs font-bold text-foreground">All assignments checked</p>
            <p className="text-[11px] text-muted-foreground">
              Snap a photo of your handwritten math derivations or science answers to get instant CDC rubric feedback.
            </p>
            <div className="pt-1">
              <Link
                href="/vision-marker"
                className="btn-primary text-xs font-bold py-2 px-4 rounded-xl inline-flex"
              >
                Submit Handwritten Paper
              </Link>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
