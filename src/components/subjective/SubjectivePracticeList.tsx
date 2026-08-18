'use client';

import React, { useState } from 'react';
import { SubjectiveQuestion, SubjectiveFilterOptions } from './types';
import { Search, Filter, BookOpen, Clock, Award, CheckCircle, ChevronDown, ChevronUp, Sparkles, FileText } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

interface SubjectivePracticeListProps {
  questions: SubjectiveQuestion[];
  onSelectQuestion: (question: SubjectiveQuestion) => void;
  isLoading?: boolean;
}

export default function SubjectivePracticeList({
  questions,
  onSelectQuestion,
  isLoading = false,
}: SubjectivePracticeListProps) {
  const { t, language, setLanguage } = useLanguage();
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedMarks, setSelectedMarks] = useState<'all' | '2' | '4' | '5'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedSolutionId, setExpandedSolutionId] = useState<string | null>(null);

  const subjects = ['all', 'Compulsory Science', 'Compulsory Mathematics', 'Optional Mathematics', 'English', 'Social Studies'];

  const filteredQuestions = questions.filter((q) => {
    const matchesSubject = selectedSubject === 'all' || q.subject.toLowerCase() === selectedSubject.toLowerCase();
    const matchesMarks = selectedMarks === 'all' || q.marks.toString() === selectedMarks;
    const matchesSearch =
      q.question_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.chapter.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesMarks && matchesSearch;
  });

  const getMarksBadgeStyle = (marks: number) => {
    switch (marks) {
      case 2:
        return 'bg-bio-light text-bio border-bio/20';
      case 4:
        return 'bg-primary/10 text-primary border-primary/20';
      case 5:
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-3 border border-primary/20">
              <Sparkles size={14} /> SEE Board Exam Written Practice
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {t('subjective_practice', 'SEE Written Subjective Practice')}
            </h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              Solve short and long answer questions. Upload photos of your handwritten responses for instant AI examiner grading &amp; step marks breakdown.
            </p>
          </div>

          {/* Language Toggle */}
          <div className="flex items-center p-1 bg-muted rounded-2xl border border-border shrink-0 self-start sm:self-auto">
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                language === 'en' ? 'bg-card text-primary shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('np')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                language === 'np' ? 'bg-card text-primary shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              नेपाली
            </button>
          </div>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="grid md:grid-cols-12 gap-3 items-center">
          {/* Search Box */}
          <div className="md:col-span-6 relative">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search questions, chapters, or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted/60 border border-border/80 focus:border-primary focus:ring-2 focus:ring-primary/20 text-xs sm:text-sm font-medium text-foreground outline-none transition-all"
            />
          </div>

          {/* Subject Selector */}
          <div className="md:col-span-3">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-muted/60 border border-border/80 text-xs font-bold text-foreground outline-none cursor-pointer"
            >
              <option value="all">All Subjects</option>
              {subjects.filter((s) => s !== 'all').map((subj) => (
                <option key={subj} value={subj}>
                  {subj}
                </option>
              ))}
            </select>
          </div>

          {/* Marks Selector */}
          <div className="md:col-span-3 flex items-center gap-1.5">
            {(['all', '2', '4', '5'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMarks(m)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                  selectedMarks === m
                    ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                    : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {m === 'all' ? 'All' : `${m}M`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Questions List */}
      {isLoading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground font-semibold">Loading SEE subjective questions...</p>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="py-16 text-center bg-card border border-border rounded-3xl p-8 max-w-md mx-auto shadow-xs space-y-3">
          <FileText size={40} className="mx-auto text-muted-foreground/50" />
          <h3 className="text-lg font-bold text-foreground">No Questions Found</h3>
          <p className="text-xs text-muted-foreground">
            No subjective questions match your current search and filter selections. Try selecting &quot;All Subjects&quot;.
          </p>
          <button
            onClick={() => {
              setSelectedSubject('all');
              setSelectedMarks('all');
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((q) => {
            const isExpanded = expandedSolutionId === q.id;
            return (
              <div
                key={q.id}
                className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-xs hover:border-primary/40 transition-all duration-300 space-y-4 group"
              >
                {/* Meta Badges */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${getMarksBadgeStyle(q.marks)}`}>
                      {q.marks} Marks
                    </span>
                    <span className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-md">
                      {q.subject}
                    </span>
                    <span className="text-[11px] font-medium text-muted-foreground bg-muted/60 px-2.5 py-0.5 rounded-md">
                      {q.chapter}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                    <Clock size={13} className="text-primary" />
                    <span>~{q.suggested_time_minutes} mins</span>
                  </div>
                </div>

                {/* Question Text */}
                <p className="text-sm sm:text-base font-bold text-foreground leading-relaxed">
                  {q.question_text}
                </p>

                {/* Action Buttons */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-border/50">
                  <button
                    onClick={() => setExpandedSolutionId(isExpanded ? null : q.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
                  >
                    <BookOpen size={14} />
                    <span>{t('model_solution', 'Model Solution & Marking Scheme')}</span>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  <button
                    onClick={() => onSelectQuestion(q)}
                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-extrabold flex items-center gap-1.5 shadow-sm hover:bg-primary/90 transition-all"
                  >
                    <Sparkles size={14} />
                    <span>{t('evaluate_answer', 'Evaluate My Answer with AI')}</span>
                  </button>
                </div>

                {/* Model Solution Expandable Dropdown */}
                {isExpanded && (
                  <div className="mt-3 p-4 rounded-xl bg-muted/40 border border-border/80 space-y-3 text-xs animate-fade-in">
                    <div className="flex items-center gap-1.5 font-bold text-foreground border-b border-border/60 pb-2">
                      <CheckCircle size={14} className="text-success" />
                      <span>Official NEB Marking Scheme &amp; Solution:</span>
                    </div>
                    <pre className="font-sans text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
                      {q.sample_solution}
                    </pre>

                    {q.rubric && q.rubric.length > 0 && (
                      <div className="pt-2 border-t border-border/60">
                        <p className="font-bold text-muted-foreground mb-2">Step Marks Breakdown:</p>
                        <div className="grid gap-1.5">
                          {q.rubric.map((r, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-card p-2 rounded-lg border border-border/40">
                              <span className="font-medium text-foreground">{r.criterion}</span>
                              <span className="font-bold text-primary">{r.max_marks} Mark{r.max_marks > 1 ? 's' : ''}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
