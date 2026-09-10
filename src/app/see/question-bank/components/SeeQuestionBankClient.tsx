'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import {
  SEE_QUESTION_BANK,
  SEE_SUBJECT_HIERARCHY,
  SeeQuestion,
} from '@/lib/data/seeQuestionBankData';
import {
  SEE_DIGEST_LIST,
  SeeDigestItem,
} from '@/lib/data/seeDigestData';
import SeeQuestionCard2 from '@/components/see/SeeQuestionCard2';
import SeeHierarchyFilter from '@/components/see/SeeHierarchyFilter';
import SeePdfViewerModal from '@/components/see/SeePdfViewerModal';
import SeePracticeSessionModal from '@/components/see/SeePracticeSessionModal';
import {
  Search,
  BookOpen,
  CheckCircle2,
  Sparkles,
  Download,
  Upload,
  FileText,
  Copy,
  Zap,
  GraduationCap,
  Layers,
  HelpCircle,
  Video,
  ArrowRight,
  Filter,
  Eye,
  PlusCircle,
  X,
  Trash2,
  FileUp,
  SlidersHorizontal,
  Bookmark,
  BookmarkCheck,
  RefreshCw,
  FolderOpen,
  Flame,
  Target,
  Play,
  RotateCcw,
} from 'lucide-react';

const STORAGE_KEY_QUESTIONS = 'samyak_see_custom_questions_v2';
const STORAGE_KEY_DIGESTS = 'samyak_see_custom_digests_v2';
const STORAGE_KEY_BOOKMARKS = 'samyak_see_bookmarked_ids_v2';
const STORAGE_KEY_MISTAKES = 'samyak_see_student_mistakes_v1';

export default function SeeQuestionBankClient() {
  const searchParams = useSearchParams();
  const [isDark, setIsDark] = useState(false);

  // Active View Tab: 'practice' | 'questions' | 'digest' | 'mistakes' | 'bookmarks'
  const [activeView, setActiveView] = useState<'practice' | 'questions' | 'digest' | 'mistakes' | 'bookmarks'>('practice');

  // Simple Practice Mode Selection
  const [simpleSubject, setSimpleSubject] = useState<string>('science');
  const [simpleChapter, setSimpleChapter] = useState<string>('all');
  const [simpleCount, setSimpleCount] = useState<number>(10);
  const [simplePreset, setSimplePreset] = useState<'all' | 'past_year' | 'important' | 'exam_level'>('all');

  // Show Advanced Filter Drawer
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);

  // Advanced Hierarchy Filters
  const [filters, setFilters] = useState<{
    subject: string;
    chapter: string;
    subtopic: string;
    section: number | 'all';
    marks: number | 'all';
    difficulty: string;
    questionType: string;
    year: string;
  }>({
    subject: 'all',
    chapter: 'all',
    subtopic: 'all',
    section: 'all',
    marks: 'all',
    difficulty: 'all',
    questionType: 'all',
    year: 'all',
  });

  const [searchQuery, setSearchQuery] = useState<string>('');

  // Questions State
  const [customQuestions, setCustomQuestions] = useState<SeeQuestion[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [studentMistakes, setStudentMistakes] = useState<SeeQuestion[]>([]);

  // Interactive Practice Session State
  const [practiceSession, setPracticeSession] = useState<{
    questions: SeeQuestion[];
    title: string;
  } | null>(null);

  // Digest State & PDF Viewer
  const [customDigests, setCustomDigests] = useState<SeeDigestItem[]>([]);
  const [selectedPdfPreview, setSelectedPdfPreview] = useState<SeeDigestItem | null>(null);

  // Modals
  const [isAddQuestionModalOpen, setIsAddQuestionModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkJsonText, setBulkJsonText] = useState('');
  const [bulkError, setBulkError] = useState<string | null>(null);

  // Single Question Form
  const [qSubject, setQSubject] = useState<'science' | 'math' | 'opt_math' | 'english' | 'nepali' | 'social'>('science');
  const [qChapter, setQChapter] = useState('');
  const [qSubtopic, setQSubtopic] = useState('');
  const [qSectionNum, setQSectionNum] = useState<1 | 2 | 3 | 4>(1);
  const [qMarks, setQMarks] = useState<1 | 2 | 3 | 4 | 5 | 6 | 8 | 10>(1);
  const [qText, setQText] = useState('');
  const [qTextNepali, setQTextNepali] = useState('');
  const [qSolution, setQSolution] = useState('');
  const [qTip, setQTip] = useState('');
  const [questionSuccess, setQuestionSuccess] = useState(false);

  // Sync with incoming URL query parameters (?subject=science&chapter=Force%20%26%20Gravitation&marks=4&view=questions)
  useEffect(() => {
    if (!searchParams) return;
    const qSubj = searchParams.get('subject');
    const qChap = searchParams.get('chapter');
    const qMarks = searchParams.get('marks');
    const qView = searchParams.get('view');

    if (qSubj) {
      setSimpleSubject(qSubj);
      setFilters((f) => ({ ...f, subject: qSubj }));
    }
    if (qChap) {
      setSimpleChapter(qChap);
      setFilters((f) => ({ ...f, chapter: qChap }));
    }
    if (qMarks) {
      const parsedMarks = parseInt(qMarks, 10);
      if (!isNaN(parsedMarks)) {
        setFilters((f) => ({ ...f, marks: parsedMarks as any }));
      }
    }
    if (qView && ['practice', 'questions', 'digest', 'mistakes', 'bookmarks'].includes(qView)) {
      setActiveView(qView as any);
    }
  }, [searchParams]);

  // Load from local storage
  useEffect(() => {
    try {
      const savedQ = localStorage.getItem(STORAGE_KEY_QUESTIONS);
      if (savedQ) setCustomQuestions(JSON.parse(savedQ));
      const savedD = localStorage.getItem(STORAGE_KEY_DIGESTS);
      if (savedD) setCustomDigests(JSON.parse(savedD));
      const savedB = localStorage.getItem(STORAGE_KEY_BOOKMARKS);
      if (savedB) setBookmarkedIds(new Set(JSON.parse(savedB)));
      const savedM = localStorage.getItem(STORAGE_KEY_MISTAKES);
      if (savedM) setStudentMistakes(JSON.parse(savedM));
    } catch (e) {
      console.warn('Failed to load stored state:', e);
    }
  }, []);

  const saveCustomQuestions = (updated: SeeQuestion[]) => {
    setCustomQuestions(updated);
    try {
      localStorage.setItem(STORAGE_KEY_QUESTIONS, JSON.stringify(updated));
    } catch (e) {
      console.error('Storage error:', e);
    }
  };

  const toggleBookmark = (id: string) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(Array.from(next)));
      } catch (e) {
        console.error('Bookmark error:', e);
      }
      return next;
    });
  };

  const recordMistake = (q: SeeQuestion) => {
    setStudentMistakes((prev) => {
      if (prev.some((item) => item.id === q.id)) return prev;
      const next = [q, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY_MISTAKES, JSON.stringify(next));
      } catch (e) {
        console.error('Mistake save error:', e);
      }
      return next;
    });
  };

  // Combine built-in + custom
  const allQuestions = useMemo(() => {
    return [...customQuestions, ...SEE_QUESTION_BANK];
  }, [customQuestions]);

  const allDigests = useMemo(() => {
    return [...customDigests, ...SEE_DIGEST_LIST];
  }, [customDigests]);

  // Launch Simple Mode Practice Session
  const handleStartSimplePractice = () => {
    let pool = allQuestions.filter((q) => q.subject === simpleSubject);
    if (simpleChapter !== 'all') {
      pool = pool.filter((q) => q.chapter === simpleChapter);
    }
    if (simplePreset === 'past_year') {
      pool = pool.filter((q) => q.year.includes('2080') || q.year.includes('2081') || q.year.includes('2079'));
    } else if (simplePreset === 'important') {
      pool = pool.filter((q) => q.marks >= 3 || q.difficulty === 'Hard');
    }

    if (pool.length === 0) pool = allQuestions.slice(0, simpleCount);

    const questionsToPractice = pool.slice(0, simpleCount);
    const subjectObj = SEE_SUBJECT_HIERARCHY.find((s) => s.id === simpleSubject);

    setPracticeSession({
      questions: questionsToPractice,
      title: `🎯 Practice Session: ${subjectObj?.name || 'SEE Subject'} (${simpleChapter === 'all' ? 'All Chapters' : simpleChapter})`,
    });
  };

  // Launch Marks Drill
  const handleStartMarksDrill = (marks: number, label: string) => {
    const matched = allQuestions.filter((q) => q.marks === marks);
    setPracticeSession({
      questions: matched.length > 0 ? matched : allQuestions.slice(0, 10),
      title: `🎯 Practice by Marks: ${label} (${marks} Mark${marks > 1 ? 's' : ''})`,
    });
  };

  // Filtered Questions for Full Browser View
  const filteredQuestions = useMemo(() => {
    return allQuestions.filter((q) => {
      if (activeView === 'bookmarks' && !bookmarkedIds.has(q.id)) return false;
      if (activeView === 'mistakes' && !studentMistakes.some((m) => m.id === q.id)) return false;
      if (filters.subject !== 'all' && q.subject !== filters.subject) return false;
      if (filters.chapter !== 'all' && q.chapter !== filters.chapter) return false;
      if (filters.subtopic !== 'all' && q.subtopic !== filters.subtopic) return false;
      if (filters.section !== 'all' && q.sectionNumber !== filters.section) return false;
      if (filters.marks !== 'all' && q.marks !== filters.marks) return false;
      if (filters.difficulty !== 'all' && q.difficulty !== filters.difficulty) return false;
      if (filters.questionType !== 'all' && q.questionType !== filters.questionType) return false;
      if (filters.year !== 'all' && !q.year.includes(filters.year)) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchQ = q.question.toLowerCase().includes(query);
        const matchQNep = (q.questionNepali || '').toLowerCase().includes(query);
        const matchChap = q.chapter.toLowerCase().includes(query);
        if (!matchQ && !matchQNep && !matchChap) return false;
      }
      return true;
    });
  }, [allQuestions, activeView, bookmarkedIds, studentMistakes, filters, searchQuery]);

  const resetFilters = () => {
    setFilters({
      subject: 'all',
      chapter: 'all',
      subtopic: 'all',
      section: 'all',
      marks: 'all',
      difficulty: 'all',
      questionType: 'all',
      year: 'all',
    });
    setSearchQuery('');
  };

  // Selected subject object for simple mode chapters
  const selectedSubjectHierarchy = SEE_SUBJECT_HIERARCHY.find((s) => s.id === simpleSubject);

  return (
    <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        
        {/* Top Header */}
        <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-mono">
                  STUDENT PRACTICE ENGINE
                </span>
                <span className="text-xs text-muted-foreground font-bold">
                  Targeted Learning &bull; Model Solutions &bull; Step Rubrics
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-2.5">
                <HelpCircle className="text-emerald-500" size={32} />
                <span>SEE Question Bank &amp; Practice Hub</span>
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
                Choose a subject and chapter to practice high-yield exam questions, or browse by official 1–10 mark question tiers.
              </p>
            </div>

            {/* Quick Admin Uploader Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsAddQuestionModalOpen(true)}
                className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md flex items-center gap-1.5 transition-all"
              >
                <PlusCircle size={15} />
                <span>Add Question</span>
              </button>

              <button
                onClick={() => setIsBulkModalOpen(true)}
                className="px-3.5 py-2.5 rounded-2xl bg-muted/60 hover:bg-muted text-foreground text-xs font-black border border-border flex items-center gap-1.5 transition-all"
              >
                <FileUp size={15} />
                <span>Bulk JSON</span>
              </button>
            </div>
          </div>

          {/* Navigation Mode Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <div className="flex flex-wrap items-center gap-2">
              
              {/* Mode 1: Simple Quick Practice */}
              <button
                onClick={() => setActiveView('practice')}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all ${
                  activeView === 'practice'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-muted/40 text-muted-foreground hover:text-foreground border border-border'
                }`}
              >
                <Zap size={15} />
                <span>⚡ Quick Practice</span>
              </button>

              {/* Mode 2: Full Question Browser */}
              <button
                onClick={() => setActiveView('questions')}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all ${
                  activeView === 'questions'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-muted/40 text-muted-foreground hover:text-foreground border border-border'
                }`}
              >
                <Layers size={15} />
                <span>Full Question Bank ({allQuestions.length})</span>
              </button>

              {/* Mode 3: Digital Digest */}
              <button
                onClick={() => setActiveView('digest')}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all ${
                  activeView === 'digest'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-muted/40 text-muted-foreground hover:text-foreground border border-border'
                }`}
              >
                <FileText size={15} />
                <span>📖 Study Material Digest ({allDigests.length})</span>
              </button>

              {/* Mode 4: My Mistakes */}
              <button
                onClick={() => setActiveView('mistakes')}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all ${
                  activeView === 'mistakes'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'bg-muted/40 text-muted-foreground hover:text-foreground border border-border'
                }`}
              >
                <Flame size={15} />
                <span>❌ My Mistakes ({studentMistakes.length})</span>
              </button>

              {/* Mode 5: Bookmarks */}
              <button
                onClick={() => setActiveView('bookmarks')}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all ${
                  activeView === 'bookmarks'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-muted/40 text-muted-foreground hover:text-foreground border border-border'
                }`}
              >
                <BookmarkCheck size={15} />
                <span>Saved ({bookmarkedIds.size})</span>
              </button>

            </div>

            {/* Global Search */}
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search questions, laws, formulas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-emerald-500 shadow-xs"
              />
            </div>
          </div>
        </div>

        {/* 🟢 VIEW 1: SIMPLE PRACTICE MODE (HUMAN BEHAVIOR FIRST) */}
        {activeView === 'practice' && (
          <div className="space-y-6">
            
            {/* 🎯 PRACTICE BY MARKS QUICK LAUNCHER */}
            <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-black text-foreground flex items-center gap-2">
                  <Target size={18} className="text-emerald-500" />
                  <span>🎯 Practice by Marks (द्रुत अभ्यास)</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Select an official NEB question tier to start an instant 10-question practice drill.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { mark: 1, label: '① Very Short', desc: '1 Mark • Group A', color: 'border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10 text-blue-600' },
                  { mark: 2, label: '② Short Answer', desc: '2 Marks • Scientific Reasons', color: 'border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-600' },
                  { mark: 3, label: '③ Problem Solving', desc: '3 Marks • Numericals & Steps', color: 'border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 text-amber-600' },
                  { mark: 4, label: '④ Long & HOTS', desc: '4–10 Marks • Proofs & Riders', color: 'border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 text-purple-600' },
                ].map((tier) => (
                  <button
                    key={tier.mark}
                    onClick={() => handleStartMarksDrill(tier.mark, tier.label)}
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

            {/* SIMPLE PRACTICE CREATOR */}
            <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 font-black block">
                  STEP 1 › CHOOSE SUBJECT &bull; STEP 2 › CHOOSE CHAPTER &bull; STEP 3 › START
                </span>
                <h3 className="text-lg font-black text-foreground">
                  Custom Practice Session Generator
                </h3>
              </div>

              {/* Step 1: Choose Subject */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase font-mono">
                  1. Choose Subject
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                  {SEE_SUBJECT_HIERARCHY.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSimpleSubject(s.id);
                        setSimpleChapter('all');
                      }}
                      className={`p-3 rounded-2xl border text-left flex flex-col items-center justify-center text-center space-y-1.5 transition-all ${
                        simpleSubject === s.id
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 shadow-xs'
                          : 'bg-muted/30 border-border text-foreground hover:bg-muted/60'
                      }`}
                    >
                      <span className="text-xl">{s.icon}</span>
                      <span className="text-xs font-bold leading-tight">{s.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Choose Chapter */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase font-mono">
                  2. Choose Chapter
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  <button
                    onClick={() => setSimpleChapter('all')}
                    className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                      simpleChapter === 'all'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-card border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    🌟 All Chapters Combined
                  </button>
                  {selectedSubjectHierarchy?.chapters.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setSimpleChapter(c.name)}
                      className={`p-3 rounded-xl border text-xs font-bold text-left transition-all truncate ${
                        simpleChapter === c.name
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-card border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      📂 {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Choose Presets & Count */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase font-mono">
                    3. Practice Type
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'all', label: 'Mixed Practice' },
                      { id: 'past_year', label: 'Previous Year Board' },
                      { id: 'important', label: 'High-Yield (3M/4M)' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setSimplePreset(p.id as any)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          simplePreset === p.id
                            ? 'bg-emerald-500/15 border border-emerald-500 text-emerald-600 font-black'
                            : 'bg-muted/40 border border-border text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase font-mono">
                    4. Question Count
                  </label>
                  <div className="flex items-center gap-2">
                    {[5, 10, 20, 30].map((num) => (
                      <button
                        key={num}
                        onClick={() => setSimpleCount(num)}
                        className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          simpleCount === num
                            ? 'bg-emerald-600 text-white shadow-xs font-black'
                            : 'bg-muted/40 border border-border text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {num} Qs
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Start Button */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleStartSimplePractice}
                  className="px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg flex items-center gap-2 transition-all active:scale-95"
                >
                  <Play size={16} />
                  <span>START PRACTICE SESSION ({simpleCount} Qs)</span>
                </button>
              </div>

            </div>

          </div>
        )}

        {/* 🔵 VIEW 2, 4, 5: FULL QUESTION BROWSER, MISTAKES, BOOKMARKS */}
        {(activeView === 'questions' || activeView === 'mistakes' || activeView === 'bookmarks') && (
          <div className="space-y-6">
            
            {/* Filter Toggle Bar */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="px-4 py-2 rounded-xl bg-card border border-border text-foreground font-bold text-xs flex items-center gap-2 hover:bg-muted shadow-xs transition-colors"
              >
                <SlidersHorizontal size={14} className="text-emerald-500" />
                <span>{showAdvancedFilters ? 'Hide Advanced Filters' : 'Show Advanced Filters (Section, Marks, Year)'}</span>
              </button>

              <span className="text-xs font-mono text-muted-foreground">
                Showing <strong>{filteredQuestions.length}</strong> questions
              </span>
            </div>

            {/* Advanced Filters Drawer */}
            {showAdvancedFilters && (
              <SeeHierarchyFilter
                filters={filters}
                onChange={setFilters}
                onReset={resetFilters}
                totalFiltered={filteredQuestions.length}
              />
            )}

            {/* Empty States with Helpful Presets */}
            {filteredQuestions.length === 0 ? (
              <div className="bg-card border border-border rounded-3xl p-10 text-center max-w-md mx-auto space-y-4 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mx-auto">
                  <HelpCircle size={24} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-black text-foreground">😕 Nothing here yet</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    No questions matched your exact filter combination.
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <span className="text-[11px] font-bold text-foreground block">Try these popular topics:</span>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={() => {
                        resetFilters();
                        setFilters((prev) => ({ ...prev, subject: 'science', marks: 2 }));
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs font-bold hover:bg-emerald-500/20"
                    >
                      Science &bull; 2 Mark Reasons
                    </button>
                    <button
                      onClick={() => {
                        resetFilters();
                        setFilters((prev) => ({ ...prev, subject: 'opt_math', marks: 4 }));
                      }}
                      className="px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-600 border border-purple-500/20 text-xs font-bold hover:bg-purple-500/20"
                    >
                      Opt Math &bull; 4 Mark Cramer's Rule
                    </button>
                  </div>
                </div>

                <button
                  onClick={resetFilters}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-xs"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredQuestions.map((q, idx) => (
                  <SeeQuestionCard2
                    key={q.id}
                    question={q}
                    index={idx}
                    isBookmarked={bookmarkedIds.has(q.id)}
                    onToggleBookmark={toggleBookmark}
                    onDeleteCustom={(id) => {
                      const updated = customQuestions.filter((item) => item.id !== id);
                      saveCustomQuestions(updated);
                    }}
                  />
                ))}
              </div>
            )}

          </div>
        )}

        {/* 📖 VIEW 3: DIGITAL DIGEST & "READ NOW" LIBRARY */}
        {activeView === 'digest' && (
          <div className="space-y-6">
            
            <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-base sm:text-lg font-black text-amber-900 dark:text-amber-300 flex items-center gap-2">
                  <FileText size={20} />
                  <span>SEE Study Material &amp; Formula Digest Library</span>
                </h2>
                <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
                  Formula booklets, theorem proofs, and 1-day revision capsules with instant in-app reading.
                </p>
              </div>
            </div>

            {/* Categorized Digest Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {allDigests.map((item) => (
                <div
                  key={item.id}
                  className="bg-card border border-border rounded-3xl p-6 flex flex-col justify-between gap-4 shadow-xs hover:shadow-md transition-all group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20 font-mono">
                        {item.category}
                      </span>
                      {item.isPopular && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          🔥 High Yield
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-sm sm:text-base font-black text-foreground group-hover:text-amber-600 transition-colors leading-snug">
                        {item.title}
                      </h3>
                      <p className="text-xs text-muted-foreground font-medium">
                        🇳🇵 {item.titleNepali}
                      </p>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-mono text-[11px]">
                      📄 {item.pageCount} Pages &bull; {item.fileSize}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedPdfPreview(item)}
                        className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition-all"
                      >
                        <BookOpen size={14} />
                        <span>READ NOW</span>
                      </button>

                      <a
                        href={item.downloadUrl}
                        download
                        className="p-2 rounded-xl bg-card border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        title="Download PDF"
                      >
                        <Download size={14} />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

      </div>

      {/* INTERACTIVE PRACTICE SESSION MODAL */}
      {practiceSession && (
        <SeePracticeSessionModal
          questions={practiceSession.questions}
          sessionTitle={practiceSession.title}
          onClose={() => setPracticeSession(null)}
          onBookmarkToggle={toggleBookmark}
          bookmarkedIds={bookmarkedIds}
          onRecordMistake={recordMistake}
        />
      )}

      {/* IN-APP PDF VIEWER MODAL */}
      {selectedPdfPreview && (
        <SeePdfViewerModal
          digest={selectedPdfPreview}
          onClose={() => setSelectedPdfPreview(null)}
        />
      )}

      {/* SINGLE QUESTION UPLOAD MODAL */}
      {isAddQuestionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-foreground">Add SEE Question</h3>
              <button onClick={() => setIsAddQuestionModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {questionSuccess ? (
              <div className="p-6 text-center text-emerald-600 font-bold text-xs bg-emerald-500/10 rounded-2xl">
                Question Saved Successfully!
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!qText.trim() || !qSolution.trim()) return;
                  const newQ: SeeQuestion = {
                    id: `custom-${Date.now()}`,
                    subject: qSubject,
                    subjectName: SEE_SUBJECT_HIERARCHY.find((s) => s.id === qSubject)?.name || 'Compulsory Subject',
                    chapter: qChapter || 'General Chapter',
                    subtopic: qSubtopic || undefined,
                    sectionNumber: qSectionNum,
                    section: qSectionNum === 1 ? 'Section 1 (Very Short)' : qSectionNum === 2 ? 'Section 2 (Short Answer)' : qSectionNum === 3 ? 'Section 3 (Problem Solving)' : 'Section 4 (Long & HOTS)',
                    group: qSectionNum === 1 ? 'Group A' : qSectionNum === 2 ? 'Group B' : qSectionNum === 3 ? 'Group C' : 'Group D',
                    marks: qMarks,
                    questionType: 'short_answer',
                    question: qText.trim(),
                    questionNepali: qTextNepali.trim() || undefined,
                    year: 'NEB 2082',
                    difficulty: 'Medium',
                    solution: qSolution.trim(),
                    markingScheme: [{ step: 'Full Model Solution', marks: qMarks }],
                    examTip: qTip.trim() || undefined,
                  };
                  saveCustomQuestions([newQ, ...customQuestions]);
                  setQuestionSuccess(true);
                  setTimeout(() => {
                    setQuestionSuccess(false);
                    setIsAddQuestionModalOpen(false);
                  }, 1000);
                }}
                className="space-y-3 text-xs"
              >
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-foreground block mb-1">Subject</label>
                    <select
                      value={qSubject}
                      onChange={(e) => setQSubject(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl bg-muted/40 border border-border"
                    >
                      {SEE_SUBJECT_HIERARCHY.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-foreground block mb-1">Marks</label>
                    <select
                      value={qMarks}
                      onChange={(e) => setQMarks(Number(e.target.value) as any)}
                      className="w-full p-2.5 rounded-xl bg-muted/40 border border-border font-bold text-emerald-600"
                    >
                      {[1, 2, 3, 4, 5, 6, 8, 10].map((m) => (
                        <option key={m} value={m}>{m} Mark{m > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-foreground block mb-1">Chapter</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Force & Gravity"
                    value={qChapter}
                    onChange={(e) => setQChapter(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-muted/40 border border-border"
                  />
                </div>

                <div>
                  <label className="font-bold text-foreground block mb-1">Question (English)</label>
                  <textarea
                    rows={2}
                    required
                    value={qText}
                    onChange={(e) => setQText(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-muted/40 border border-border"
                  />
                </div>

                <div>
                  <label className="font-bold text-foreground block mb-1">Step-by-Step Model Solution</label>
                  <textarea
                    rows={3}
                    required
                    value={qSolution}
                    onChange={(e) => setQSolution(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-muted/40 border border-border font-mono"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddQuestionModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-muted-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold"
                  >
                    Save Question
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* BULK MODAL */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-foreground">Bulk JSON Questions</h3>
              <button onClick={() => setIsBulkModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <textarea
              rows={6}
              placeholder='[{"subject": "science", "chapter": "Force", "marks": 2, "question": "...", "solution": "..."}]'
              value={bulkJsonText}
              onChange={(e) => setBulkJsonText(e.target.value)}
              className="w-full p-3 rounded-xl bg-muted/40 border border-border font-mono text-xs"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-muted-foreground"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  try {
                    const parsed = JSON.parse(bulkJsonText);
                    const formatted = parsed.map((item: any, idx: number) => ({
                      id: `custom-bulk-${Date.now()}-${idx}`,
                      subject: item.subject || 'science',
                      subjectName: 'Compulsory Subject',
                      chapter: item.chapter || 'Unit 1',
                      sectionNumber: item.marks === 1 ? 1 : item.marks === 2 ? 2 : item.marks === 3 ? 3 : 4,
                      section: item.marks === 1 ? 'Section 1 (Very Short)' : item.marks === 2 ? 'Section 2 (Short Answer)' : item.marks === 3 ? 'Section 3 (Problem Solving)' : 'Section 4 (Long & HOTS)',
                      group: item.marks === 1 ? 'Group A' : item.marks === 2 ? 'Group B' : item.marks === 3 ? 'Group C' : 'Group D',
                      marks: item.marks || 1,
                      questionType: 'short_answer',
                      question: item.question || 'Untitled',
                      year: 'NEB 2082',
                      difficulty: 'Medium',
                      solution: item.solution || 'Provided',
                    }));
                    saveCustomQuestions([...formatted, ...customQuestions]);
                    setIsBulkModalOpen(false);
                    setBulkJsonText('');
                  } catch (e: any) {
                    alert('Invalid JSON: ' + e.message);
                  }
                }}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
