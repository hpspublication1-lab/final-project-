'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Search, Filter, BookOpen, Sparkles, CheckCircle2, XCircle, ArrowRight,
  Clock, Award, HelpCircle, Layers, Bookmark, BookmarkCheck, ChevronDown,
  ChevronUp, RotateCcw, AlertCircle, AlertTriangle, ShieldCheck, Zap
} from 'lucide-react';
import { CEE_VERIFIED_PYQ_DATA, type CeePYQuestion } from '@/lib/data/ceePastPapersData';
import { MathText } from '@/components/MathText';
import toast from 'react-hot-toast';

export default function CeeQuestionBankClient() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedExam, setSelectedExam] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'must_know'>('all');

  // Interactive state
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [flashcardSaved, setFlashcardSaved] = useState<Record<string, boolean>>({});
  const [savingCardId, setSavingCardId] = useState<string | null>(null);

  // Filter questions
  const filteredQuestions = useMemo(() => {
    return CEE_VERIFIED_PYQ_DATA.filter((q) => {
      if (selectedSubject !== 'all' && q.subject !== selectedSubject) return false;
      if (selectedYear !== 'all' && q.examYear.toString() !== selectedYear) return false;
      if (selectedExam !== 'all' && q.examName !== selectedExam) return false;
      if (priorityFilter === 'must_know' && q.highYieldPriority !== 'must_know') return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesText = q.questionText.toLowerCase().includes(query);
        const matchesChapter = q.chapterTitle.toLowerCase().includes(query);
        const matchesTopic = q.topicTitle.toLowerCase().includes(query);
        if (!matchesText && !matchesChapter && !matchesTopic) return false;
      }
      return true;
    });
  }, [selectedSubject, selectedYear, selectedExam, priorityFilter, searchQuery]);

  const handleSelectOption = (questionId: string, optionId: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    setExpandedId(questionId); // automatically open explanation on attempt
  };

  const handleToggleBookmark = (id: string) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        toast.success('Question removed from bookmarks');
      } else {
        next.add(id);
        toast.success('Question saved to bookmarks');
      }
      return next;
    });
  };

  const handleSaveToFlashcards = async (q: CeePYQuestion) => {
    if (flashcardSaved[q.id]) return;
    setSavingCardId(q.id);
    try {
      const res = await fetch('/api/flashcards/convert-mistake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          front: q.questionText,
          back: `**Correct Option: (${q.correctOption.toUpperCase()})**\n\n${q.explanation}${q.formulaLatex ? `\n\n$$${q.formulaLatex}$$` : ''}`,
          hint: `${q.subjectDisplayName} · ${q.chapterTitle} (${q.examName} ${q.examYear})`,
          topic: q.topicTitle,
        }),
      });
      if (res.ok) {
        setFlashcardSaved((prev) => ({ ...prev, [q.id]: true }));
        toast.success('Added to your SM-2 Flashcard Deck!');
      } else {
        toast.error('Could not add to flashcards');
      }
    } catch {
      toast.error('Error saving flashcard');
    } finally {
      setSavingCardId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border/80 rounded-3xl p-6 shadow-sm">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-wider">
              <span>MECEE / IOM / BPKIHS ARCHIVE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Verified CEE Previous-Year Question Bank
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl font-medium">
              Real past entrance examination questions from 2018–2024. Formatted with scientific LaTeX equations, detailed step-by-step solutions, and concept repeat frequencies.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/practice"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow-sm transition-all"
            >
              <Zap size={14} />
              <span>Full Practice Mode</span>
            </Link>
            <Link
              href="/mock-tests"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-muted/60 hover:bg-muted text-foreground font-bold text-xs border border-border transition-all"
            >
              <Award size={14} />
              <span>200-Q Mocks</span>
            </Link>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
          {/* Search bar */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by topic, keyword, or chapter (e.g., Potentiometer, Aldol, Photosynthesis)..."
              className="w-full pl-10 pr-4 py-2.5 bg-muted/30 border border-border/80 rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Subject Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-bold text-muted-foreground mr-1 shrink-0 uppercase tracking-wider">Subject:</span>
            {[
              { id: 'all', label: 'All Subjects' },
              { id: 'physics', label: 'Physics (50Q)' },
              { id: 'chemistry', label: 'Chemistry (50Q)' },
              { id: 'zoology', label: 'Zoology (40Q)' },
              { id: 'botany', label: 'Botany (40Q)' },
              { id: 'mat', label: 'Mental Agility (20Q)' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSubject(s.id)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                  selectedSubject === s.id
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-muted/40 text-muted-foreground hover:text-foreground border border-border/60'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Year & Exam Secondary Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/60 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Exam:</span>
              {['all', 'MECEE', 'IOM', 'BPKIHS'].map((ex) => (
                <button
                  key={ex}
                  onClick={() => setSelectedExam(ex)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    selectedExam === ex
                      ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-500/30'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {ex === 'all' ? 'All Boards' : ex}
                </button>
              ))}

              <span className="text-[11px] font-bold text-muted-foreground ml-2 uppercase tracking-wider">Year:</span>
              {['all', '2024', '2023', '2021', '2020', '2019'].map((yr) => (
                <button
                  key={yr}
                  onClick={() => setSelectedYear(yr)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    selectedYear === yr
                      ? 'bg-primary/15 text-primary font-bold border border-primary/30'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {yr === 'all' ? 'All Years' : yr}
                </button>
              ))}
            </div>

            {/* Must-Know Toggle */}
            <button
              onClick={() => setPriorityFilter(priorityFilter === 'all' ? 'must_know' : 'all')}
              className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                priorityFilter === 'must_know'
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/40 shadow-xs'
                  : 'bg-muted/30 text-muted-foreground border-border hover:text-foreground'
              }`}
            >
              <Sparkles size={12} />
              <span>Must-Know Repeats Only</span>
            </button>
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>Showing <strong className="text-foreground">{filteredQuestions.length}</strong> verified past exam questions</span>
          <span className="text-[11px]">CEE Marking: <strong>+1.0 / -0.25</strong></span>
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          {filteredQuestions.length === 0 ? (
            <div className="p-12 text-center bg-card border border-border rounded-3xl space-y-3">
              <AlertCircle size={36} className="text-muted-foreground mx-auto" />
              <h3 className="text-base font-bold text-foreground">No questions match your filter criteria</h3>
              <p className="text-xs text-muted-foreground">Try clearing your search query or selecting &quot;All Subjects&quot;.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSubject('all');
                  setSelectedYear('all');
                  setSelectedExam('all');
                  setPriorityFilter('all');
                }}
                className="btn-secondary text-xs inline-flex items-center gap-1.5"
              >
                <RotateCcw size={13} /> Reset Filters
              </button>
            </div>
          ) : (
            filteredQuestions.map((q, qIndex) => {
              const selectedOpt = selectedAnswers[q.id];
              const isAnswered = !!selectedOpt;
              const isExpanded = expandedId === q.id;
              const isBookmarked = bookmarkedIds.has(q.id);

              return (
                <div
                  key={q.id}
                  className="bg-card border border-border/80 hover:border-border rounded-3xl p-5 sm:p-6 shadow-xs transition-all space-y-4"
                >
                  {/* Question Top Tags */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold border border-primary/20">
                        {q.examName} {q.examYear}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold">
                        {q.subjectDisplayName} · {q.chapterTitle}
                      </span>
                      {q.highYieldPriority === 'must_know' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20 flex items-center gap-1">
                          <Sparkles size={11} /> Must-Know ({q.frequencyAppeared}x Repeated)
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold flex items-center gap-1">
                        <ShieldCheck size={11} /> Verified
                      </span>
                    </div>

                    <button
                      onClick={() => handleToggleBookmark(q.id)}
                      className={`p-2 rounded-xl transition-colors ${
                        isBookmarked
                          ? 'bg-amber-500/10 text-amber-500'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                      title="Bookmark Question"
                    >
                      {isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                    </button>
                  </div>

                  {/* Question Statement */}
                  <div className="text-sm sm:text-base font-semibold text-foreground leading-relaxed">
                    <span className="font-mono text-xs text-muted-foreground mr-2 font-bold">Q{qIndex + 1}.</span>
                    <MathText text={q.questionText} />
                  </div>

                  {/* Options Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {q.options.map((opt) => {
                      const isChosen = selectedOpt === opt.id;
                      const isCorrect = opt.id === q.correctOption;

                      let optClasses = 'bg-muted/30 border-border/80 text-foreground hover:bg-muted/60';
                      if (isAnswered) {
                        if (isCorrect) {
                          optClasses = 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold';
                        } else if (isChosen) {
                          optClasses = 'bg-red-500/15 border-red-500 text-red-700 dark:text-red-300 font-bold';
                        } else {
                          optClasses = 'opacity-50 bg-muted/20 border-border/40';
                        }
                      }

                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleSelectOption(q.id, opt.id)}
                          disabled={isAnswered}
                          className={`p-3.5 rounded-2xl border text-xs sm:text-sm text-left flex items-start gap-3 transition-all ${optClasses}`}
                        >
                          <span className="w-5 h-5 rounded-lg bg-card border border-border/60 text-muted-foreground font-black text-xs flex items-center justify-center shrink-0 uppercase">
                            {opt.id}
                          </span>
                          <span className="flex-1 font-medium">
                            <MathText text={opt.text} />
                          </span>
                          {isAnswered && isCorrect && <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />}
                          {isAnswered && isChosen && !isCorrect && <XCircle size={16} className="text-red-500 shrink-0 mt-0.5" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation Drawer */}
                  {isAnswered && (
                    <div className="pt-2 border-t border-border/60 space-y-3">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : q.id)}
                          className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                        >
                          <span>{isExpanded ? 'Hide Solution' : 'View Verified Solution'}</span>
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>

                        <span className="text-[11px] text-muted-foreground">
                          Correct Answer: <strong className="text-emerald-600 uppercase font-mono">Option ({q.correctOption})</strong>
                        </span>
                      </div>

                      {isExpanded && (
                        <div className="p-4 rounded-2xl bg-muted/30 border border-border/80 space-y-2 text-xs sm:text-sm text-foreground/90 leading-relaxed">
                          <div className="font-bold text-foreground flex items-center gap-1.5 text-xs text-primary">
                            <HelpCircle size={13} /> Step-by-Step Rationale:
                          </div>
                          <MathText text={q.explanation} />

                          {q.formulaLatex && (
                            <div className="mt-2 p-2.5 rounded-xl bg-card border border-border/60 font-mono text-xs overflow-x-auto">
                              <MathText text={q.formulaLatex} />
                            </div>
                          )}

                          {/* Quick Cognitive Action Bar */}
                          <div className="pt-2 border-t border-border/40 flex items-center justify-between flex-wrap gap-2">
                            <button
                              onClick={() => handleSaveToFlashcards(q)}
                              disabled={savingCardId === q.id || flashcardSaved[q.id]}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs border border-primary/20 transition-all cursor-pointer disabled:opacity-60"
                            >
                              <Layers size={13} />
                              <span>{flashcardSaved[q.id] ? '✓ In SM-2 Flashcard Deck' : savingCardId === q.id ? 'Saving…' : 'Add to SM-2 Flashcards'}</span>
                            </button>

                            <Link
                              href="/mistake-analyser"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs border border-amber-500/20 transition-all"
                            >
                              <AlertTriangle size={13} />
                              <span>Review in Galti Sudhar →</span>
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
