'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  HelpCircle,
  BookOpen,
  CheckCircle2,
  Sparkles,
  Search,
  Filter,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Award,
  Zap,
  Target
} from 'lucide-react';
import { SEE_QUESTION_BANK, SeeQuestion, SEE_SUBJECT_HIERARCHY } from '@/lib/data/seeQuestionBankData';

export default function SeeMarksPracticeTab() {
  const [selectedSubject, setSelectedSubject] = useState<string>('science');
  const [selectedMarks, setSelectedMarks] = useState<number | 'all'>('all');
  const [selectedChapter, setSelectedChapter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const subjectHierarchy = SEE_SUBJECT_HIERARCHY.find((s) => s.id === selectedSubject) || SEE_SUBJECT_HIERARCHY[0];

  const filteredQuestions = SEE_QUESTION_BANK.filter((q) => {
    if (q.subject !== selectedSubject) return false;
    if (selectedMarks !== 'all' && q.marks !== selectedMarks) return false;
    if (selectedChapter !== 'all' && q.chapter !== selectedChapter) return false;
    if (searchQuery.trim()) {
      const qLower = q.question.toLowerCase();
      const qNep = (q.questionNepali || '').toLowerCase();
      const query = searchQuery.toLowerCase();
      if (!qLower.includes(query) && !qNep.includes(query)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-black">
            <Award size={14} /> NEB 4-TIER MARK WEIGHTAGE FRAMEWORK
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-foreground">
            1, 2, 3 &amp; 4 Marks Chapter-Wise Practice
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Every question categorized by exact board examination group with step-by-step marking rubrics, given formulas, and examiner tips.
          </p>
        </div>

        <Link
          href="/see/question-bank"
          className="px-6 py-3.5 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all shrink-0"
        >
          <BookOpen size={16} />
          <span>Open Full Interactive Question Bank</span>
        </Link>
      </div>

      {/* 4 Mark Tier Quick Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { mark: 1, group: 'Group A', title: '1 Mark: Definitions & Laws', desc: 'SI units, laws, 1-line conceptual answers', color: 'border-blue-500/30 bg-blue-500/5 text-blue-600' },
          { mark: 2, group: 'Group B', title: '2 Marks: Give Reasons & Differences', desc: 'Scientific causes, differences between terms', color: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-600' },
          { mark: 3, group: 'Group C', title: '3 Marks: Problem Solving & Numericals', desc: 'Multi-step equations, chemical equations', color: 'border-amber-500/30 bg-amber-500/5 text-amber-600' },
          { mark: 4, group: 'Group D', title: '4 Marks: Proofs & HOTS Long Questions', desc: 'Geometry theorems, Cramer rule, derivations', color: 'border-purple-500/30 bg-purple-500/5 text-purple-600' },
        ].map((tier) => (
          <button
            key={tier.mark}
            onClick={() => setSelectedMarks(selectedMarks === tier.mark ? 'all' : tier.mark)}
            className={`p-5 rounded-3xl border text-left transition-all ${tier.color} ${
              selectedMarks === tier.mark ? 'ring-2 ring-primary shadow-md scale-[1.02]' : 'hover:opacity-90'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-black">{tier.group}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-card border border-border">
                {tier.mark} MARK{tier.mark > 1 ? 'S' : ''}
              </span>
            </div>
            <h4 className="text-xs sm:text-sm font-black text-foreground mb-1">{tier.title}</h4>
            <p className="text-[11px] text-muted-foreground">{tier.desc}</p>
          </button>
        ))}
      </div>

      {/* Controls Bar: Subject, Chapter, Search */}
      <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Subject Dropdown */}
          <select
            value={selectedSubject}
            onChange={(e) => {
              setSelectedSubject(e.target.value);
              setSelectedChapter('all');
            }}
            className="px-3.5 py-2 rounded-xl bg-muted border border-border text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="science">🔬 Compulsory Science</option>
            <option value="math">📐 Compulsory Math</option>
            <option value="opt_math">📊 Optional Math</option>
            <option value="english">📚 English</option>
            <option value="nepali">🇳🇵 Nepali</option>
            <option value="social">🌍 Social</option>
          </select>

          {/* Chapter Filter */}
          <select
            value={selectedChapter}
            onChange={(e) => setSelectedChapter(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-muted border border-border text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary max-w-xs"
          >
            <option value="all">All Chapters</option>
            {subjectHierarchy.chapters.map((chap) => (
              <option key={chap.name} value={chap.name}>
                {chap.name}
              </option>
            ))}
          </select>

          {/* Marks Filter */}
          <select
            value={selectedMarks}
            onChange={(e) => setSelectedMarks(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="px-3.5 py-2 rounded-xl bg-muted border border-border text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Marks (1-4 Marks)</option>
            <option value={1}>1 Mark (Group A)</option>
            <option value={2}>2 Marks (Group B)</option>
            <option value={3}>3 Marks (Group C)</option>
            <option value={4}>4 Marks (Group D)</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-muted border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {filteredQuestions.map((q) => {
          const isExpanded = expandedId === q.id;

          return (
            <div
              key={q.id}
              className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-3 transition-all hover:border-border/80"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-foreground font-mono">{q.group}</span>
                  <span>•</span>
                  <span className="px-2.5 py-0.5 rounded-md font-mono font-black text-[11px] bg-primary/10 text-primary">
                    {q.marks} MARK{q.marks > 1 ? 'S' : ''}
                  </span>
                  <span>•</span>
                  <span className="text-muted-foreground">{q.chapter}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-muted-foreground font-semibold">
                    {q.year}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-sm sm:text-base font-black text-foreground leading-snug">
                  {q.question}
                </h4>
                {q.questionNepali && (
                  <p className="text-xs text-muted-foreground italic bg-muted/20 p-2.5 rounded-xl">
                    {q.questionNepali}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <Link
                  href="/practice/subjective"
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <Sparkles size={13} />
                  <span>Check handwritten answer with AI</span>
                </Link>

                <button
                  onClick={() => toggleExpand(q.id)}
                  className="px-4 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-black text-xs flex items-center gap-1.5 transition-colors"
                >
                  <span>{isExpanded ? 'Hide Solution' : 'View Step Solution & Marking Rubric'}</span>
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>

              {/* Expandable Verified Solution */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-border space-y-3 bg-muted/20 p-4 rounded-2xl animate-fadeIn">
                  <div>
                    <span className="text-[11px] font-black uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mb-1">
                      <CheckCircle2 size={13} /> Verified Step-by-Step Model Solution
                    </span>
                    <pre className="text-xs text-foreground whitespace-pre-wrap font-sans leading-relaxed bg-card p-3 rounded-xl border border-border">
                      {q.solution}
                    </pre>
                  </div>

                  {/* Marking Scheme */}
                  {q.markingScheme && q.markingScheme.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block">
                        Official Marking Breakdown:
                      </span>
                      {q.markingScheme.map((ms, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs bg-card px-3 py-1.5 rounded-lg border border-border/60"
                        >
                          <span className="text-muted-foreground">{ms.step}</span>
                          <span className="font-mono font-black text-primary">+{ms.marks} Mark</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Common Trap */}
                  {q.commonMistakes && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-foreground space-y-0.5">
                      <span className="font-bold text-amber-700 dark:text-amber-400">
                        ⚠️ Student Mistake Watch:
                      </span>
                      <p className="text-muted-foreground">{q.commonMistakes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
