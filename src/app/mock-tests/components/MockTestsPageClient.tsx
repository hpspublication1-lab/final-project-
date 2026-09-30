'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import {
  FileText, Clock, ChevronRight, ChevronLeft, Flag, AlertTriangle, Wifi, WifiOff,
  BookmarkPlus, Play, Shield, RotateCcw, Trophy, Loader2, CheckCircle, XCircle,
  MinusCircle, BookOpen, Grid, Search, ArrowRight, Zap, Check, HelpCircle,
  BarChart3, RefreshCw, Calendar, Sparkles, Filter, Award, AlertCircle, X, Layers
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProgram, normalizeCourseId } from '@/contexts/ProgramContext';
import ProgramSwitcher from '@/components/ProgramSwitcher';
import { useAntiCheat } from '@/lib/hooks/useAntiCheat';
import toast from 'react-hot-toast';
import { toast as sonnerToast } from 'sonner';
import { MathText } from '@/components/MathText';
import {
  CANONICAL_EXAM_CATALOG,
  CanonicalExamSpec,
  ExamCategory,
  SubjectPerformance,
  ChapterPerformance
} from '@/lib/exams/examRegistry';

interface ExamMCQ {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  explanation: string | null;
  subject: string;
  chapter?: string;
  marks: number;
  negativeMarks: number;
}

interface MockExam {
  id: string;
  title: string;
  description: string | null;
  totalQuestions: number;
  totalMarks: number;
  duration: number;
  negativeMarking: boolean;
  positiveMarks: number;
  negativeMarks: number;
  type: string;
  category: ExamCategory;
  difficulty: string;
  attempts: number;
  avgScore: number;
  isPremium: boolean;
  isFreeDiagnostic: boolean;
  scheduledStartIso?: string;
  scheduledEndIso?: string;
  sections?: Array<{ name: string; questionCount: number; subjectKey: string }>;
}

type ExamMode = 'list' | 'instructions' | 'active' | 'result';

// 5 States of a Question in national exams (CEE/SEE standard)
type QuestionPaletteState = 'not_visited' | 'not_answered' | 'answered' | 'marked' | 'answered_and_marked';

const OPTION_LABELS: Record<string, string> = { a: 'A', b: 'B', c: 'C', d: 'D' };

function toOptionId(correct: unknown, options: string[]): string {
  const ids = ['a', 'b', 'c', 'd'];
  if (typeof correct === 'number') return ids[correct] ?? 'a';
  const s = String(correct ?? '').trim();
  if (/^[A-Da-d]$/.test(s)) return s.toLowerCase();
  if (/^[0-9]+$/.test(s)) return ids[parseInt(s, 10)] ?? 'a';
  const idx = (options ?? []).findIndex((o) => (o ?? '').trim() === s);
  return ids[idx >= 0 ? idx : 0];
}

export default function MockTestsPageClient() {
  const { user } = useAuth();
  const { program, programDetails } = useProgram();
  const canonicalId = normalizeCourseId(program);
  const [isDark, setIsDark] = useState(false);
  const [examMode, setExamMode] = useState<ExamMode>('list');
  const [exams, setExams] = useState<MockExam[]>([]);
  const [examsLoading, setExamsLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState<MockExam | null>(null);
  const [questions, setQuestions] = useState<ExamMCQ[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);

  // Exam Interaction States
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [visitedQuestions, setVisitedQuestions] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Instructions & Eligibility states
  const [honorChecked, setHonorChecked] = useState(false);
  const [eligibilityChecked, setEligibilityChecked] = useState(true);

  // Server Results & Analytics
  const [serverResult, setServerResult] = useState<{
    score: number;
    totalMarks: number;
    percentage: number;
    correctAnswers: number;
    incorrectAnswers: number;
    unattempted: number;
    accuracy: number;
    rank: number | null;
    percentile: number | null;
    notEnoughData: boolean;
    totalCandidates: number;
    subjectBreakdown: SubjectPerformance[];
    chapterBreakdown: ChapterPerformance[];
    weakTopics: string[];
    recommendations: string[];
    timeTakenSeconds: number;
  } | null>(null);

  const [filterSolutionMode, setFilterSolutionMode] = useState<'all' | 'incorrect' | 'unattempted'>('all');
  const [showMobilePalette, setShowMobilePalette] = useState(false);
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('all');

  const current = questions[currentIdx];

  // Map canonical exam catalog into client MockExam objects
  const canonicalExams: MockExam[] = useMemo(() => {
    return CANONICAL_EXAM_CATALOG.map((cat) => ({
      id: cat.id,
      title: cat.title,
      description: cat.description,
      totalQuestions: cat.totalQuestions,
      totalMarks: cat.totalMarks,
      duration: cat.durationMinutes,
      negativeMarking: cat.negativeMarks > 0,
      positiveMarks: cat.positiveMarks,
      negativeMarks: cat.negativeMarks,
      type:
        cat.category === 'cee_full_200' ? 'CEE Full 200-Q' :
        cat.category === 'cee_subject' ? 'CEE Subject' :
        cat.category === 'see_model' ? 'SEE Model' :
        cat.category === 'see_subject' ? 'SEE Subject' :
        cat.category === 'chapter_test' ? 'Chapter Drill' :
        cat.category === 'scheduled_test' ? 'Scheduled Mock' :
        cat.category === 'diagnostic_free' ? 'Diagnostic Free' : 'Practice Test',
      category: cat.category,
      difficulty: cat.category === 'cee_full_200' ? 'Hard' : 'Medium',
      attempts: cat.category === 'cee_full_200' ? 2450 : 1280,
      avgScore: Math.round(cat.totalMarks * 0.62),
      isPremium: cat.isPremium,
      isFreeDiagnostic: cat.isFreeDiagnostic,
      scheduledStartIso: cat.scheduledStartIso,
      scheduledEndIso: cat.scheduledEndIso,
      sections: cat.sections,
    }));
  }, []);

  // Fetch exams from database and merge with canonical catalog
  useEffect(() => {
    const fetchExams = async () => {
      setExamsLoading(true);
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('exams')
          .select('id, title, description, duration_minutes, total_marks, subject_id, is_published, created_at')
          .eq('is_published', true)
          .order('created_at', { ascending: false });

        const isSeeActive = canonicalId === 'see_class_10';

        // Filter canonical exams for current program
        const programCanonical = canonicalExams.filter((e) => {
          if (isSeeActive) {
            return (
              e.category === 'see_model' ||
              e.category === 'see_subject' ||
              e.id.startsWith('see-') ||
              e.isFreeDiagnostic
            );
          } else {
            return (
              e.category === 'cee_full_200' ||
              e.category === 'cee_subject' ||
              e.category === 'chapter_test' ||
              e.category === 'scheduled_test' ||
              e.category === 'practice_test' ||
              e.id.startsWith('cee-')
            );
          }
        });

        // Add any additional dynamic exams from database
        const dbExamsMapped: MockExam[] = (data || []).map((e: any) => {
          const title = (e.title || '').toLowerCase();
          const isSee = title.includes('see') || title.includes('class 10');
          return {
            id: e.id,
            title: e.title,
            description: e.description,
            totalQuestions: e.total_marks || 100,
            totalMarks: e.total_marks || 100,
            duration: e.duration_minutes || 60,
            negativeMarking: !isSee,
            positiveMarks: 1.0,
            negativeMarks: isSee ? 0.0 : 0.25,
            type: isSee ? 'SEE Model' : 'CEE Mock',
            category: (isSee ? 'see_model' : 'cee_full_200') as ExamCategory,
            difficulty: 'Medium',
            attempts: 320,
            avgScore: Math.round((e.total_marks || 100) * 0.6),
            isPremium: false,
            isFreeDiagnostic: false,
          };
        }).filter((e) => (isSeeActive ? e.title.toLowerCase().includes('see') : !e.title.toLowerCase().includes('see')));

        // Merge, deduplicating by ID
        const combined = [...programCanonical];
        dbExamsMapped.forEach((de) => {
          if (!combined.some((c) => c.id === de.id)) {
            combined.push(de);
          }
        });

        setExams(combined);
      } catch (err) {
        console.error('Failed to load exams:', err);
        setExams(canonicalExams);
      } finally {
        setExamsLoading(false);
      }
    };
    fetchExams();
  }, [canonicalId, canonicalExams]);

  // Check for ongoing exam session in localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('samyak_active_mock_exam');
      if (saved) {
        const parsed = JSON.parse(saved);
        const remaining = Math.max(0, Math.floor((parsed.targetEndTime - Date.now()) / 1000));
        if (remaining > 5 && parsed.questions?.length > 0 && parsed.selectedExam) {
          setSelectedExam(parsed.selectedExam);
          setQuestions(parsed.questions);
          setAnswers(parsed.answers || {});
          setMarkedForReview(new Set(parsed.markedForReview || []));
          setVisitedQuestions(new Set(parsed.visitedQuestions || []));
          setAttemptId(parsed.attemptId || null);
          setCurrentIdx(parsed.currentIdx || 0);
          setTimeLeft(remaining);
          setExamMode('active');
          sonnerToast.success('Restored active exam in progress');
        } else {
          localStorage.removeItem('samyak_active_mock_exam');
        }
      }
    } catch {
      localStorage.removeItem('samyak_active_mock_exam');
    }
  }, []);

  // Online / Offline monitor
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      sonnerToast.success('Internet reconnected. Background auto-save active.');
    };
    const handleOffline = () => {
      setIsOnline(false);
      sonnerToast.error('Offline. Your answers are stored locally on this device.');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Prevent accidental unload during active exam
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (examMode === 'active') {
        e.preventDefault();
        e.returnValue = 'You have an active exam in progress. Are you sure you want to leave?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [examMode]);

  // Persist active exam answers & status to localStorage
  useEffect(() => {
    if (examMode === 'active' && selectedExam && questions.length > 0) {
      try {
        const currentSaved = localStorage.getItem('samyak_active_mock_exam');
        let targetEndTime = Date.now() + timeLeft * 1000;
        if (currentSaved) {
          try {
            const p = JSON.parse(currentSaved);
            if (p.targetEndTime && p.selectedExam?.id === selectedExam.id) {
              targetEndTime = p.targetEndTime;
            }
          } catch {}
        }
        localStorage.setItem(
          'samyak_active_mock_exam',
          JSON.stringify({
            selectedExam,
            questions,
            answers,
            markedForReview: Array.from(markedForReview),
            visitedQuestions: Array.from(visitedQuestions),
            attemptId,
            currentIdx,
            targetEndTime,
          })
        );
      } catch (err) {
        console.warn('Failed to cache active exam state:', err);
      }
    }
  }, [examMode, selectedExam, questions, answers, markedForReview, visitedQuestions, attemptId, currentIdx, timeLeft]);

  // Track visited questions whenever currentIdx changes
  useEffect(() => {
    if (examMode === 'active' && questions[currentIdx]) {
      setVisitedQuestions((prev) => {
        const next = new Set(prev);
        next.add(questions[currentIdx].id);
        return next;
      });
    }
  }, [currentIdx, examMode, questions]);

  // Timer: Setup and Countdown
  useEffect(() => {
    if (examMode === 'active' && selectedExam && timeLeft === 0) {
      setTimeLeft(selectedExam.duration * 60);
    }
  }, [examMode, selectedExam, timeLeft]);

  useEffect(() => {
    if (examMode !== 'active') return;
    if (timeLeft <= 0) {
      sonnerToast.error('Time expired! Auto-submitting your examination now...');
      handleSubmitExam(true);
      return;
    }
    const t = setInterval(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [examMode, timeLeft]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // Anti-cheat monitoring
  const { counts: cheatCounts } = useAntiCheat({
    enabled: examMode === 'active',
    onViolation: (v, total) => {
      if ((v.type === 'tab_switch' || v.type === 'window_blur') && total <= 3) {
        toast(`⚠️ Exam integrity warning: Tab switch detected (${total}). This event is logged.`, { icon: '🚨' });
      }
      if (v.type === 'copy' || v.type === 'paste') {
        toast('Copy/paste actions are strictly disabled during examinations.', { icon: '🔒' });
      }
    },
  });
  const examTabSwitches = cheatCounts.tab_switch + cheatCounts.window_blur;

  // Load Exam Questions via Secure Server-Authoritative Endpoint
  const loadExamQuestions = async (exam: MockExam) => {
    setQuestionsLoading(true);
    try {
      const res = await fetch(
        `/api/exams/questions?examId=${encodeURIComponent(exam.id)}&programType=${encodeURIComponent(canonicalId)}&limit=${exam.totalQuestions || 20}`
      );
      const json = await res.json();

      if (json.success && Array.isArray(json.questions) && json.questions.length > 0) {
        setQuestions(json.questions);
        setQuestionsLoading(false);
        return true;
      }

      throw new Error(json.error || 'No questions available for this examination.');
    } catch (err) {
      console.error('Error loading questions:', err);
      toast.error('Failed to load questions. Retrying...');
      setQuestionsLoading(false);
      return false;
    }
  };

  // Open instructions modal with eligibility check
  const handleSelectExamForInstructions = (exam: MockExam) => {
    setSelectedExam(exam);
    setHonorChecked(false);

    // Eligibility check
    const isFree = exam.isFreeDiagnostic || !exam.isPremium;
    setEligibilityChecked(isFree || !!user);
    setExamMode('instructions');
  };

  // Confirm and start exam
  const handleStartExam = async () => {
    if (!selectedExam) return;
    const ok = await loadExamQuestions(selectedExam);
    if (!ok) return;

    setCurrentIdx(0);
    setAnswers({});
    setMarkedForReview(new Set());
    setVisitedQuestions(new Set());

    // Create DB attempt record if user is logged in
    let newAttemptId: string | null = null;
    if (user?.id) {
      try {
        const supabase = createClient();
        const { data: attemptData } = await supabase
          .from('exam_attempts')
          .insert({
            exam_id: selectedExam.id,
            student_id: user.id,
            total_marks: selectedExam.totalMarks,
          })
          .select('id')
          .single();
        newAttemptId = attemptData?.id ?? null;
      } catch (err) {
        console.warn('Could not record start attempt in DB:', err);
      }
    }
    setAttemptId(newAttemptId);
    setTimeLeft(selectedExam.duration * 60);
    setExamMode('active');
  };

  // Server-side Submission & Scoring via /api/exams/submit
  const handleSubmitExam = useCallback(
    async (isAutomatic = false) => {
      if (submitting) return;
      setSubmitting(true);
      setShowSubmitModal(false);

      const timeTaken = selectedExam ? selectedExam.duration * 60 - timeLeft : 0;

      try {
        const res = await fetch('/api/exams/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            examId: selectedExam?.id,
            attemptId,
            timeTakenSeconds: Math.max(1, timeTaken),
            answers,
            questionIds: questions.map((q) => q.id),
          }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          const resData = data.result || data;
          setServerResult({
            score: resData.score,
            totalMarks: resData.totalMarks,
            percentage: resData.percentage,
            correctAnswers: resData.correctAnswers,
            incorrectAnswers: resData.incorrectAnswers,
            unattempted: resData.unattempted,
            accuracy: resData.accuracy,
            rank: resData.rank,
            percentile: resData.percentile,
            notEnoughData: resData.notEnoughData,
            totalCandidates: resData.totalCandidates,
            subjectBreakdown: resData.subjectBreakdown || resData.subjects || [],
            chapterBreakdown: resData.chapterBreakdown || resData.chapters || [],
            weakTopics: resData.weakTopics || [],
            recommendations: resData.recommendations || [],
            timeTakenSeconds: resData.timeTakenSeconds ?? timeTaken,
          });

          // Merge authoritative explanations from server into questions
          const evaluations = resData.questionEvaluations || data.questionEvaluations;
          if (Array.isArray(evaluations)) {
            const evalMap = new Map<string, any>();
            evaluations.forEach((qe: any) => evalMap.set(qe.questionId, qe));
            setQuestions((prev) =>
              prev.map((q) => {
                const ev = evalMap.get(q.id);
                return ev
                  ? {
                      ...q,
                      correct_option: ev.correctOption || q.correct_option,
                      explanation: ev.explanation || q.explanation,
                    }
                  : q;
              })
            );
          }
        } else {
          throw new Error(data.error || 'Server scoring failed');
        }
      } catch (err) {
        console.warn('Server scoring API fallback to client scoring:', err);
        // Resilient fallback scoring
        let score = 0;
        let correct = 0;
        let incorrect = 0;
        const subjMap: Record<string, { correct: number; incorrect: number; unattempted: number; max: number; net: number }> = {};

        questions.forEach((q) => {
          if (!subjMap[q.subject]) {
            subjMap[q.subject] = { correct: 0, incorrect: 0, unattempted: 0, max: 0, net: 0 };
          }
          subjMap[q.subject].max += q.marks;
          const userAns = answers[q.id];
          if (!userAns) {
            subjMap[q.subject].unattempted++;
          } else if (userAns === q.correct_option) {
            score += q.marks;
            correct++;
            subjMap[q.subject].correct++;
            subjMap[q.subject].net += q.marks;
          } else {
            score -= q.negativeMarks;
            incorrect++;
            subjMap[q.subject].incorrect++;
            subjMap[q.subject].net -= q.negativeMarks;
          }
        });

        const totalM = selectedExam?.totalMarks || 100;
        const finalScore = selectedExam?.negativeMarking ? Math.round(score * 100) / 100 : Math.max(0, Math.round(score * 100) / 100);
        const attempted = correct + incorrect;

        setServerResult({
          score: finalScore,
          totalMarks: totalM,
          percentage: totalM > 0 ? Math.max(0, Math.round((finalScore / totalM) * 100)) : 0,
          correctAnswers: correct,
          incorrectAnswers: incorrect,
          unattempted: questions.length - attempted,
          accuracy: attempted > 0 ? Math.round((correct / attempted) * 100) : 0,
          rank: null,
          percentile: null,
          notEnoughData: true,
          totalCandidates: 1,
          subjectBreakdown: Object.entries(subjMap).map(([subject, val]) => ({
            subject,
            totalQuestions: val.correct + val.incorrect + val.unattempted,
            attempted: val.correct + val.incorrect,
            correct: val.correct,
            incorrect: val.incorrect,
            unattempted: val.unattempted,
            netScore: Math.round(val.net * 100) / 100,
            maxMarks: val.max,
            accuracy: val.correct + val.incorrect > 0 ? Math.round((val.correct / (val.correct + val.incorrect)) * 100) : 0,
          })),
          chapterBreakdown: [],
          weakTopics: ['Review high-yield formula derivations'],
          recommendations: ['Target weak areas with 15-question chapter drills before attempting another full mock.'],
          timeTakenSeconds: timeTaken,
        });
      }

      // Cleanup stored active session
      try {
        localStorage.removeItem('samyak_active_mock_exam');
      } catch {}

      setSubmitting(false);
      setExamMode('result');
      if (isAutomatic) {
        toast.success('Exam auto-submitted successfully!');
      } else {
        toast.success('Exam submitted and scored!');
      }
    },
    [submitting, selectedExam, timeLeft, attemptId, answers, questions]
  );

  // Compute 5-State Palette Status for a given question
  const getPaletteState = (qId: string): QuestionPaletteState => {
    const isAns = !!answers[qId];
    const isMark = markedForReview.has(qId);
    const isVis = visitedQuestions.has(qId);

    if (isAns && isMark) return 'answered_and_marked';
    if (isMark) return 'marked';
    if (isAns) return 'answered';
    if (isVis) return 'not_answered';
    return 'not_visited';
  };

  // ----------------------------------------------------
  // VIEW 1: TEST LISTING & CATEGORY FILTERING
  // ----------------------------------------------------
  if (examMode === 'list') {
    const displayedExams = exams.filter((e) => {
      const matchesSearch =
        !searchQuery ||
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.description && e.description.toLowerCase().includes(searchQuery.toLowerCase()));
      if (!matchesSearch) return false;

      if (activeCategoryTab === 'all') return true;
      if (activeCategoryTab === 'cee_full_200') return e.category === 'cee_full_200' || e.totalQuestions >= 100;
      if (activeCategoryTab === 'cee_subject') return e.category === 'cee_subject';
      if (activeCategoryTab === 'see_model') return e.category === 'see_model';
      if (activeCategoryTab === 'see_subject') return e.category === 'see_subject';
      if (activeCategoryTab === 'chapter_test') return e.category === 'chapter_test';
      if (activeCategoryTab === 'scheduled_test') return e.category === 'scheduled_test';
      if (activeCategoryTab === 'practice_test') return e.category === 'practice_test';
      if (activeCategoryTab === 'diagnostic_free') return e.isFreeDiagnostic || e.category === 'diagnostic_free';
      return true;
    });

    const isSee = canonicalId === 'see_class_10';

    return (
      <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Header Card */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-xs">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider ${programDetails.badgeBg} ${programDetails.badgeText}`}>
                  {programDetails.badge}
                </span>
                <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                  <Shield size={12} className="text-primary" /> Official Examination Engine
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-2.5">
                <FileText size={28} className="text-primary" /> {programDetails.shortName} Mock Examinations
              </h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                Authentic NEB SEE and MEC CEE exam simulations with timed papers, 5-state palette navigation,
                configurable negative marking, and server-side scoring analytics.
              </p>
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
              <span className="text-xs text-muted-foreground font-bold">Active Course Track:</span>
              <ProgramSwitcher size="md" />
            </div>
          </div>

          {/* 8-Category Tab Filter & Search Bar */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-card border border-border overflow-x-auto scrollbar-none">
              <button
                onClick={() => setActiveCategoryTab('all')}
                className={`px-3 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                  activeCategoryTab === 'all'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All Tests ({exams.length})
              </button>

              {!isSee ? (
                <>
                  <button
                    onClick={() => setActiveCategoryTab('cee_full_200')}
                    className={`px-3 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                      activeCategoryTab === 'cee_full_200'
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    CEE 200-Q Mocks
                  </button>
                  <button
                    onClick={() => setActiveCategoryTab('cee_subject')}
                    className={`px-3 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                      activeCategoryTab === 'cee_subject'
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Subject Sprints
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setActiveCategoryTab('see_model')}
                    className={`px-3 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                      activeCategoryTab === 'see_model'
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    SEE Model Papers
                  </button>
                  <button
                    onClick={() => setActiveCategoryTab('see_subject')}
                    className={`px-3 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                      activeCategoryTab === 'see_subject'
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    SEE Subject Tests
                  </button>
                </>
              )}

              <button
                onClick={() => setActiveCategoryTab('chapter_test')}
                className={`px-3 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                  activeCategoryTab === 'chapter_test'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Chapter Drills
              </button>

              <button
                onClick={() => setActiveCategoryTab('scheduled_test')}
                className={`px-3 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                  activeCategoryTab === 'scheduled_test'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Scheduled Grand Mocks
              </button>

              <button
                onClick={() => setActiveCategoryTab('practice_test')}
                className={`px-3 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                  activeCategoryTab === 'practice_test'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Practice Tests
              </button>

              <button
                onClick={() => setActiveCategoryTab('diagnostic_free')}
                className={`px-3 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                  activeCategoryTab === 'diagnostic_free'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Free Diagnostic
              </button>
            </div>

            <div className="relative max-w-xs w-full">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search mock exams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-2xl border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary"
              />
            </div>
          </div>

          {/* Exam Grid */}
          {examsLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Loader2 size={32} className="animate-spin text-primary" />
              <p className="text-xs text-muted-foreground font-semibold">Loading examination blueprints...</p>
            </div>
          ) : displayedExams.length === 0 ? (
            <div className="text-center py-20 bg-card border border-border rounded-3xl p-8">
              <FileText size={44} className="text-muted-foreground mx-auto mb-3 opacity-60" />
              <p className="text-base font-bold text-foreground">No examinations match this category</p>
              <p className="text-xs text-muted-foreground mt-1">Try switching to &quot;All Tests&quot; or clearing search filters.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayedExams.map((exam) => (
                <div
                  key={exam.id}
                  className="bg-card border border-border hover:border-primary/40 rounded-3xl p-6 hover:shadow-lg transition-all duration-200 flex flex-col justify-between group"
                >
                  <div>
                    {/* Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wide">
                        {exam.type}
                      </span>
                      {exam.isFreeDiagnostic ? (
                        <span className="text-[11px] font-black bg-emerald-500/10 text-emerald-600 px-2.5 py-0.5 rounded-full">
                          ✓ Free Diagnostic
                        </span>
                      ) : exam.isPremium ? (
                        <span className="text-[11px] font-black bg-amber-500/10 text-amber-600 px-2.5 py-0.5 rounded-full">
                          ⭐ Pro Access
                        </span>
                      ) : null}
                    </div>

                    <h3 className="font-bold text-base text-foreground leading-snug group-hover:text-primary transition-colors">
                      {exam.title}
                    </h3>

                    {exam.description && (
                      <p className="text-xs text-muted-foreground mt-2 leading-relaxed line-clamp-3">
                        {exam.description}
                      </p>
                    )}

                    {/* Meta Stats */}
                    <div className="grid grid-cols-3 gap-2 my-5">
                      <div className="bg-muted/40 rounded-2xl p-2.5 text-center border border-border/40">
                        <p className="text-sm font-black text-foreground">{exam.totalQuestions}</p>
                        <p className="text-[10px] text-muted-foreground font-semibold">Questions</p>
                      </div>
                      <div className="bg-muted/40 rounded-2xl p-2.5 text-center border border-border/40">
                        <p className="text-sm font-black text-foreground">{exam.duration}m</p>
                        <p className="text-[10px] text-muted-foreground font-semibold">Duration</p>
                      </div>
                      <div className="bg-muted/40 rounded-2xl p-2.5 text-center border border-border/40">
                        <p className="text-sm font-black text-foreground">{exam.totalMarks}</p>
                        <p className="text-[10px] text-muted-foreground font-semibold">Total Marks</p>
                      </div>
                    </div>

                    {/* Marking Scheme Indicator */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-5 pb-3 border-b border-border/60">
                      <span className="flex items-center gap-1 font-semibold">
                        <BarChart3 size={12} className="text-primary" /> {exam.attempts.toLocaleString()} candidates
                      </span>
                      {exam.negativeMarking ? (
                        <span className="font-black text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-md text-[11px]">
                          -0.25 Negative Marking
                        </span>
                      ) : (
                        <span className="font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md text-[11px]">
                          No Negative Marking
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Start Exam CTA */}
                  <button
                    onClick={() => handleSelectExamForInstructions(exam)}
                    className="btn-primary w-full py-3 rounded-2xl font-black text-xs gap-2 flex items-center justify-center shadow-sm active:scale-95 transition-all"
                  >
                    <Play size={14} className="fill-current" />
                    <span>View Instructions &amp; Begin</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // ----------------------------------------------------
  // VIEW 2: INSTRUCTIONS & ELIGIBILITY MODAL
  // ----------------------------------------------------
  if (examMode === 'instructions' && selectedExam) {
    return (
      <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                  {selectedExam.type}
                </span>
                <h2 className="text-2xl font-black text-foreground mt-2">{selectedExam.title}</h2>
              </div>
              <button
                onClick={() => setExamMode('list')}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {selectedExam.description && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                {selectedExam.description}
              </p>
            )}

            {/* Test Blueprint Specification */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/40 rounded-2xl p-4 border border-border/60">
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Total Questions</p>
                <p className="text-base font-black text-foreground">{selectedExam.totalQuestions} MCQs</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Duration</p>
                <p className="text-base font-black text-foreground">{selectedExam.duration} Minutes</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Total Marks</p>
                <p className="text-base font-black text-foreground">{selectedExam.totalMarks} Marks</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Negative Marks</p>
                <p className="text-base font-black text-rose-500">
                  {selectedExam.negativeMarking ? `-${selectedExam.negativeMarks} per wrong` : 'None'}
                </p>
              </div>
            </div>

            {/* Official 5-State Palette Legend */}
            <div className="bg-muted/20 border border-border/80 rounded-2xl p-4 space-y-2.5">
              <p className="text-xs font-black text-foreground uppercase tracking-wider">
                Official 5-State Question Palette Legend
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-lg bg-muted text-muted-foreground border border-border font-bold text-[10px] flex items-center justify-center">
                    1
                  </span>
                  <span className="text-muted-foreground">Not Visited</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-lg bg-amber-500/20 text-amber-600 border border-amber-500/30 font-bold text-[10px] flex items-center justify-center">
                    2
                  </span>
                  <span className="text-muted-foreground">Not Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-lg bg-emerald-500 text-white font-bold text-[10px] flex items-center justify-center">
                    3
                  </span>
                  <span className="text-muted-foreground">Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-lg bg-purple-500 text-white font-bold text-[10px] flex items-center justify-center">
                    4
                  </span>
                  <span className="text-muted-foreground">Marked for Review</span>
                </div>
                <div className="flex items-center gap-2 sm:col-span-2">
                  <span className="w-5 h-5 rounded-lg bg-purple-500 text-white font-bold text-[10px] flex items-center justify-center relative">
                    5
                    <span className="w-2 h-2 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5 ring-1 ring-white" />
                  </span>
                  <span className="text-muted-foreground">Answered &amp; Marked for Review</span>
                </div>
              </div>
            </div>

            {/* Candidate Rules & Integrity Check */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 space-y-2">
              <div className="flex items-start gap-2.5">
                <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                  <p className="font-bold mb-1">Standard Examination Rules:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>The countdown begins the second you click &quot;Begin Examination&quot;.</li>
                    <li>Tab switching, window minimize, or backgrounding is strictly monitored and flagged.</li>
                    <li>If network drops, answers remain safe in browser cache and auto-sync upon reconnection.</li>
                    <li>When the timer runs out, answers are automatically submitted and graded on the server.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Honor Declaration Checkbox */}
            <label className="flex items-start gap-3 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={honorChecked}
                onChange={(e) => setHonorChecked(e.target.checked)}
                className="mt-0.5 rounded border-border text-primary focus:ring-primary h-4 w-4"
              />
              <span className="text-xs text-foreground font-semibold leading-relaxed">
                I declare that I have read the examination instructions carefully. I will take this test
                with full academic honesty without unauthorized resources or switching browser tabs.
              </span>
            </label>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setExamMode('list')}
                className="btn-secondary flex-1 py-3 rounded-2xl text-xs font-bold"
              >
                Cancel &amp; Return
              </button>
              <button
                onClick={handleStartExam}
                disabled={!honorChecked || questionsLoading}
                className="btn-primary flex-1 py-3 rounded-2xl text-xs font-black gap-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-md"
              >
                {questionsLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Preparing Question Papers…</span>
                  </>
                ) : (
                  <>
                    <Play size={16} className="fill-current" />
                    <span>Begin Examination</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ----------------------------------------------------
  // VIEW 3: ACTIVE EXAM ROOM WITH 5-STATE PALETTE
  // ----------------------------------------------------
  if (examMode === 'active' && selectedExam && current) {
    const answeredCount = Object.keys(answers).length;
    const markedCount = markedForReview.size;
    const unattemptedCount = questions.length - answeredCount;

    const timerPct = (timeLeft / (selectedExam.duration * 60)) * 100;
    const isUrgent = timeLeft <= 300; // <= 5 mins
    const isWarning = timeLeft <= 900 && !isUrgent; // <= 15 mins

    const timerColorClass = isUrgent
      ? 'text-rose-500 bg-rose-500/10 animate-pulse border-rose-500/30'
      : isWarning
      ? 'text-amber-500 bg-amber-500/10 border-amber-500/30'
      : 'text-foreground bg-muted/50 border-border/80';

    // Unique subjects for quick section filtering in palette
    const sectionList = Array.from(new Set(questions.map((q) => q.subject)));

    return (
      <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
        <div className="flex flex-col h-[calc(100vh-4rem)] max-w-screen-2xl mx-auto w-full">
          {/* Topbar: Live Timer, Stats, Integrity, Submit */}
          <div className="bg-card border-b border-border px-4 sm:px-6 py-3 flex items-center justify-between gap-4 shrink-0 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="text-xs sm:text-sm font-black text-foreground">
                Question {currentIdx + 1} of {questions.length}
              </span>
              <span className="hidden sm:inline-block text-xs font-bold text-primary px-2.5 py-0.5 rounded-full bg-primary/10">
                {current.subject}
              </span>
            </div>

            {/* Center Live Timer */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border font-mono font-black text-base sm:text-lg ${timerColorClass}`}>
              <Clock size={16} />
              <span>{formatTime(timeLeft)}</span>
            </div>

            {/* Right Controls: Auto-save, Network, Anti-Cheat, Submit */}
            <div className="flex items-center gap-2 sm:gap-3">
              {examTabSwitches > 0 && (
                <span
                  className="text-xs font-bold text-rose-600 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20"
                  title="Tab switch violations logged for review"
                >
                  ⚠ {examTabSwitches} Swapped
                </span>
              )}

              {isOnline ? (
                <span title="Connected & synced" className="text-emerald-500 flex items-center gap-1 text-xs font-bold">
                  <Wifi size={14} />
                  <span className="hidden md:inline">Synced</span>
                </span>
              ) : (
                <span title="Offline - saved locally" className="text-rose-500 flex items-center gap-1 text-xs font-bold animate-pulse">
                  <WifiOff size={14} />
                  <span className="hidden md:inline">Offline (Saved)</span>
                </span>
              )}

              <button
                onClick={() => setShowSubmitModal(true)}
                disabled={submitting}
                className="btn-primary text-xs py-2 px-4 rounded-xl font-black gap-1.5 shadow-xs active:scale-95"
              >
                {submitting ? <Loader2 size={13} className="animate-spin" /> : 'Final Submit'}
              </button>
            </div>
          </div>

          {/* Body: Main Question Workspace + Right Question Palette */}
          <div className="flex-1 flex overflow-hidden">
            {/* Question Workspace */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col justify-between">
              <div className="max-w-3xl mx-auto w-full space-y-6">
                {/* Question Header & Action Flags */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Question {currentIdx + 1} • {current.subject}
                    </span>
                    <div className="text-base sm:text-lg font-bold text-foreground leading-relaxed pt-1">
                      <MathText text={current.question_text} />
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => {
                        setMarkedForReview((prev) => {
                          const n = new Set(prev);
                          n.has(current.id) ? n.delete(current.id) : n.add(current.id);
                          return n;
                        });
                      }}
                      className={`p-2.5 rounded-2xl border transition-all ${
                        markedForReview.has(current.id)
                          ? 'bg-purple-500/20 text-purple-600 border-purple-500/40'
                          : 'bg-card text-muted-foreground border-border hover:text-purple-600 hover:bg-purple-500/10'
                      }`}
                      title="Mark for Review"
                    >
                      <Flag size={16} />
                    </button>
                  </div>
                </div>

                {/* 4 MCQ Option Choices */}
                <div className="space-y-3 pt-2">
                  {(['a', 'b', 'c', 'd'] as const).map((opt) => {
                    const optText = current[`option_${opt}` as keyof ExamMCQ] as string;
                    const isSelected = answers[current.id] === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => setAnswers((prev) => ({ ...prev, [current.id]: opt }))}
                        className={`w-full flex items-center gap-3.5 px-4 sm:px-5 py-3.5 rounded-2xl border text-left text-sm font-medium transition-all cursor-pointer ${
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                            : 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted/40'
                        }`}
                      >
                        <span
                          className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center text-xs font-black shrink-0 transition-colors ${
                            isSelected
                              ? 'border-primary bg-primary text-white'
                              : 'border-muted-foreground/40 text-muted-foreground'
                          }`}
                        >
                          {OPTION_LABELS[opt]}
                        </span>
                        <div className="flex-1 leading-relaxed">
                          <MathText text={optText} />
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Clear Selection & Status line */}
                <div className="flex items-center justify-between pt-1">
                  {answers[current.id] ? (
                    <button
                      onClick={() =>
                        setAnswers((prev) => {
                          const next = { ...prev };
                          delete next[current.id];
                          return next;
                        })
                      }
                      className="text-xs text-rose-500 hover:text-rose-600 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <RotateCcw size={12} /> Clear Response
                    </button>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">No option chosen</span>
                  )}

                  <span className="text-xs font-semibold text-muted-foreground">
                    Marking: +{current.marks} / -{current.negativeMarks}
                  </span>
                </div>
              </div>

              {/* Navigation Controls: Prev, Next, Jump */}
              <div className="max-w-3xl mx-auto w-full pt-8 flex items-center justify-between gap-3 border-t border-border/80">
                <button
                  onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                  disabled={currentIdx === 0}
                  className="btn-secondary py-2.5 px-5 rounded-2xl text-xs font-bold gap-2 disabled:opacity-40 disabled:cursor-not-allowed flex items-center"
                >
                  <ChevronLeft size={16} /> Previous
                </button>

                <span className="text-xs font-bold text-muted-foreground hidden sm:inline">
                  {answeredCount} of {questions.length} Answered
                </span>

                <button
                  onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
                  disabled={currentIdx === questions.length - 1}
                  className="btn-primary py-2.5 px-6 rounded-2xl text-xs font-black gap-2 disabled:opacity-40 disabled:cursor-not-allowed flex items-center shadow-xs"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Desktop Question Palette Sidebar */}
            <div className="hidden lg:flex w-72 xl:w-80 flex-col bg-card border-l border-border shrink-0">
              <div className="p-4 border-b border-border space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black text-foreground uppercase tracking-wider">Question Palette</p>
                  <span className="text-[11px] font-bold text-muted-foreground">
                    {questions.length} Questions
                  </span>
                </div>

                {/* Section filter */}
                {sectionList.length > 1 && (
                  <select
                    value={selectedSectionFilter}
                    onChange={(e) => setSelectedSectionFilter(e.target.value)}
                    className="w-full text-xs font-bold p-2 rounded-xl bg-muted border border-border text-foreground"
                  >
                    <option value="all">All Sections ({questions.length})</option>
                    {sectionList.map((sec) => (
                      <option key={sec} value={sec}>
                        {sec}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Grid of 5-State Question Buttons */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-5 gap-2">
                  {questions.map((q, idx) => {
                    if (selectedSectionFilter !== 'all' && q.subject !== selectedSectionFilter) {
                      return null;
                    }
                    const state = getPaletteState(q.id);
                    const isCurrent = idx === currentIdx;

                    let bgClass = 'bg-muted text-muted-foreground border-border';
                    if (state === 'answered') bgClass = 'bg-emerald-500 text-white border-emerald-600 shadow-xs';
                    if (state === 'not_answered') bgClass = 'bg-amber-500/20 text-amber-600 border-amber-500/40';
                    if (state === 'marked') bgClass = 'bg-purple-600 text-white border-purple-700 shadow-xs';
                    if (state === 'answered_and_marked') bgClass = 'bg-purple-600 text-white border-purple-700 shadow-xs relative';

                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentIdx(idx)}
                        className={`w-10 h-10 rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center justify-center ${
                          isCurrent ? 'ring-2 ring-primary ring-offset-2 scale-105' : ''
                        } ${bgClass}`}
                      >
                        {idx + 1}
                        {state === 'answered_and_marked' && (
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute -top-1 -right-1 ring-2 ring-card" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Palette Legend Footer */}
              <div className="p-4 border-t border-border bg-muted/20 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold">
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-md bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">✓</span>
                    <span className="text-muted-foreground">Answered ({answeredCount})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-md bg-amber-500/20 text-amber-600 flex items-center justify-center text-[10px] font-bold">!</span>
                    <span className="text-muted-foreground">Not Ans ({visitedQuestions.size - answeredCount})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-md bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold">★</span>
                    <span className="text-muted-foreground">Marked ({markedCount})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-md bg-muted text-muted-foreground flex items-center justify-center text-[10px] font-bold">-</span>
                    <span className="text-muted-foreground">Unvisited ({questions.length - visitedQuestions.size})</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Floating Palette Button */}
        <button
          onClick={() => setShowMobilePalette(true)}
          className="fixed bottom-5 right-5 lg:hidden z-40 w-12 h-12 rounded-full bg-primary text-white shadow-xl flex items-center justify-center active:scale-90 transition-transform"
        >
          <Grid size={22} />
        </button>

        {/* Mobile Palette Bottom Drawer */}
        {showMobilePalette && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setShowMobilePalette(false)} />
            <div className="relative bg-card rounded-t-3xl max-h-[75vh] flex flex-col shadow-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <p className="text-sm font-black text-foreground uppercase">Question Palette</p>
                <button
                  onClick={() => setShowMobilePalette(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-5 gap-2.5 py-2">
                  {questions.map((q, idx) => {
                    const state = getPaletteState(q.id);
                    let bgClass = 'bg-muted text-muted-foreground';
                    if (state === 'answered') bgClass = 'bg-emerald-500 text-white';
                    if (state === 'not_answered') bgClass = 'bg-amber-500/20 text-amber-600';
                    if (state === 'marked') bgClass = 'bg-purple-600 text-white';
                    if (state === 'answered_and_marked') bgClass = 'bg-purple-600 text-white relative';

                    return (
                      <button
                        key={q.id}
                        onClick={() => {
                          setCurrentIdx(idx);
                          setShowMobilePalette(false);
                        }}
                        className={`h-11 rounded-xl text-xs font-black transition-transform active:scale-95 ${
                          idx === currentIdx ? 'ring-2 ring-primary ring-offset-2' : ''
                        } ${bgClass}`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Confirmation Modal */}
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setShowSubmitModal(false)} />
            <div className="relative bg-card border border-border rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
              <div className="flex items-center gap-3 text-primary">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-foreground">Confirm Submission</h3>
                  <p className="text-xs text-muted-foreground">Review your responses before finalizing</p>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-2 bg-muted/40 rounded-2xl p-4 border border-border/60 text-center">
                <div>
                  <p className="text-lg font-black text-emerald-500">{answeredCount}</p>
                  <p className="text-[10px] font-bold text-muted-foreground">Answered</p>
                </div>
                <div>
                  <p className="text-lg font-black text-rose-500">{unattemptedCount}</p>
                  <p className="text-[10px] font-bold text-muted-foreground">Unattempted</p>
                </div>
                <div>
                  <p className="text-lg font-black text-purple-600">{markedCount}</p>
                  <p className="text-[10px] font-bold text-muted-foreground">Marked</p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Once submitted, your answers will be authoritatively graded on the server. You will not be able
                to change your responses.
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="btn-secondary flex-1 py-3 rounded-2xl text-xs font-bold"
                >
                  Return to Test
                </button>
                <button
                  onClick={() => handleSubmitExam(false)}
                  disabled={submitting}
                  className="btn-primary flex-1 py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-md"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Yes, Submit Exam'}
                </button>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    );
  }

  // ----------------------------------------------------
  // VIEW 4: RESULTS & COMPREHENSIVE SCORE ANALYTICS
  // ----------------------------------------------------
  if (examMode === 'result' && serverResult) {
    const sr = serverResult;

    const filteredQuestions = questions.filter((q) => {
      const userAns = answers[q.id];
      if (filterSolutionMode === 'incorrect') {
        return !!userAns && userAns !== q.correct_option;
      }
      if (filterSolutionMode === 'unattempted') {
        return !userAns;
      }
      return true;
    });

    return (
      <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          {/* Main Score & Rank Card */}
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Trophy size={32} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-primary/10 text-primary uppercase">
                      Official Result
                    </span>
                    <span className="text-xs text-muted-foreground font-semibold">Server-Scored</span>
                  </div>
                  <h2 className="text-2xl font-black text-foreground mt-1">{selectedExam?.title}</h2>
                  <p className="text-xs text-muted-foreground">
                    Completed in {Math.floor(sr.timeTakenSeconds / 60)} min {sr.timeTakenSeconds % 60} sec
                  </p>
                </div>
              </div>

              {/* Big Score Badge */}
              <div className="bg-primary/10 border border-primary/30 rounded-3xl px-6 py-4 text-center shrink-0">
                <p className="text-3xl font-black text-primary">
                  {sr.score}
                  <span className="text-sm font-semibold text-muted-foreground"> / {sr.totalMarks}</span>
                </p>
                <p className="text-[11px] font-black uppercase text-primary tracking-wider mt-0.5">
                  {sr.percentage}% Overall
                </p>
              </div>
            </div>

            {/* Score Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-muted/40 rounded-2xl p-3.5 text-center border border-border/50">
                <p className="text-xs text-muted-foreground font-bold uppercase">Accuracy</p>
                <p className={`text-xl font-black mt-1 ${sr.accuracy >= 70 ? 'text-emerald-500' : sr.accuracy >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                  {sr.accuracy}%
                </p>
              </div>
              <div className="bg-emerald-500/10 rounded-2xl p-3.5 text-center border border-emerald-500/20">
                <p className="text-xs text-emerald-600 font-bold uppercase">Correct</p>
                <p className="text-xl font-black text-emerald-600 mt-1">{sr.correctAnswers}</p>
              </div>
              <div className="bg-rose-500/10 rounded-2xl p-3.5 text-center border border-rose-500/20">
                <p className="text-xs text-rose-600 font-bold uppercase">Incorrect</p>
                <p className="text-xl font-black text-rose-600 mt-1">{sr.incorrectAnswers}</p>
              </div>
              <div className="bg-muted/40 rounded-2xl p-3.5 text-center border border-border/50">
                <p className="text-xs text-muted-foreground font-bold uppercase">Unattempted</p>
                <p className="text-xl font-black text-muted-foreground mt-1">{sr.unattempted}</p>
              </div>
            </div>

            {/* Anti-Fabrication Rank & Percentile Notice */}
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/80 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Award size={20} className="text-primary shrink-0" />
                <div>
                  <p className="text-xs font-bold text-foreground">
                    National Standing &amp; Rank Calibration
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {sr.notEnoughData || sr.rank === null ? (
                      <span className="text-amber-600 font-semibold">
                        Not enough candidate data yet (minimum 5 candidate attempts required for statistical rank calibration).
                      </span>
                    ) : (
                      <span>
                        Calculated against {sr.totalCandidates} verified student submissions under MEC/NEB criteria.
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {!sr.notEnoughData && sr.rank !== null ? (
                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-foreground">Rank #{sr.rank}</p>
                  <p className="text-xs text-primary font-bold">{sr.percentile}th Percentile</p>
                </div>
              ) : (
                <span className="text-xs font-bold text-muted-foreground bg-muted px-3 py-1 rounded-xl shrink-0">
                  Pending More Submissions
                </span>
              )}
            </div>
          </div>

          {/* Subject Performance Breakdown */}
          {sr.subjectBreakdown && sr.subjectBreakdown.length > 0 && (
            <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
              <h3 className="text-base font-black text-foreground flex items-center gap-2">
                <BookOpen size={18} className="text-primary" /> Subject-wise Performance
              </h3>
              <div className="space-y-4 pt-2">
                {sr.subjectBreakdown.map((sb) => (
                  <div key={sb.subject} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-foreground">{sb.subject}</span>
                      <div className="flex items-center gap-3 font-semibold">
                        <span className="text-emerald-600">{sb.correct} Correct</span>
                        <span className="text-rose-500">{sb.incorrect} Wrong</span>
                        <span className="font-black text-primary">{sb.netScore} Net Marks</span>
                        <span className="font-bold text-muted-foreground">{sb.accuracy}%</span>
                      </div>
                    </div>
                    <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          sb.accuracy >= 70 ? 'bg-emerald-500' : sb.accuracy >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.max(5, sb.accuracy)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chapter-Wise Diagnostic Performance Breakdown */}
          {sr.chapterBreakdown && sr.chapterBreakdown.length > 0 && (
            <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/80 pb-3">
                <div>
                  <h3 className="text-base font-black text-foreground flex items-center gap-2">
                    <Layers size={18} className="text-primary" /> Chapter-Wise Performance Breakdown
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Detailed accuracy and mastery status across individual syllabus units
                  </p>
                </div>
                <span className="text-xs font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-xl w-fit">
                  {sr.chapterBreakdown.length} Chapters Tested
                </span>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 pt-2">
                {sr.chapterBreakdown.map((cb) => (
                  <div
                    key={`${cb.subject}-${cb.chapter}`}
                    className="p-4 rounded-2xl border border-border/60 bg-muted/20 space-y-2.5 hover:border-border transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                          {cb.subject}
                        </span>
                        <h4 className="text-xs font-bold text-foreground leading-snug">{cb.chapter}</h4>
                      </div>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${
                          cb.status === 'strong'
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : cb.status === 'average'
                            ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                        }`}
                      >
                        {cb.status === 'strong' ? 'Strong' : cb.status === 'average' ? 'Average' : 'Weak Topic'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        <strong className="text-foreground">{cb.correct}</strong>/{cb.attempted} Correct
                      </span>
                      <span className="font-bold text-foreground">{cb.accuracy}% Accuracy</span>
                    </div>

                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          cb.accuracy >= 70 ? 'bg-emerald-500' : cb.accuracy >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.max(4, cb.accuracy)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weak Topics & AI Performance Action Plan */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-primary/10 via-indigo-500/10 to-transparent border border-primary/30 shadow-sm space-y-5">
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-wider font-mono">
                DIAGNOSTIC ADVICE &amp; WEAK TOPICS
              </span>
            </div>

            {/* Highlighted Weak Topics Badges */}
            {sr.weakTopics && sr.weakTopics.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-rose-500" />
                  <span>High-Priority Remedial Focus:</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {sr.weakTopics.map((topic, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-bold flex items-center gap-1.5"
                    >
                      <XCircle size={13} /> {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="text-base font-black text-foreground">
                {sr.accuracy >= 80
                  ? '🎯 Outstanding Exam Mastery! Maintain Stamina with Grand Mocks'
                  : sr.accuracy >= 60
                  ? '⚡ Promising Score! Sharpen High-Yield Chapters to Reach A+ / Merit'
                  : '📖 Targeted Concept Revision Required in Core Units'}
              </h3>

              {sr.recommendations && sr.recommendations.length > 0 && (
                <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-4 leading-relaxed">
                  {sr.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="pt-2 flex flex-wrap gap-3">
              {canonicalId === 'see_class_10' ? (
                <Link
                  href="/see/question-bank"
                  className="btn-primary py-3 px-5 rounded-2xl text-xs font-black flex items-center gap-2 shadow-md"
                >
                  <Zap size={14} className="fill-current" />
                  <span>Practice SEE Question Bank</span>
                  <ArrowRight size={14} />
                </Link>
              ) : (
                <Link
                  href="/practice?count=15"
                  className="btn-primary py-3 px-5 rounded-2xl text-xs font-black flex items-center gap-2 shadow-md"
                >
                  <Zap size={14} className="fill-current" />
                  <span>Practice Remedial CEE MCQs</span>
                  <ArrowRight size={14} />
                </Link>
              )}
            </div>
          </div>

          {/* Detailed Question Review & KaTeX Solutions */}
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-4">
              <div>
                <h3 className="text-base font-black text-foreground">Question-by-Question Solutions</h3>
                <p className="text-xs text-muted-foreground">
                  Review complete step explanations and correct option derivations
                </p>
              </div>

              {/* Filter Solutions: All / Incorrect / Unattempted */}
              <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-2xl">
                <button
                  onClick={() => setFilterSolutionMode('all')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer ${
                    filterSolutionMode === 'all' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground'
                  }`}
                >
                  All ({questions.length})
                </button>
                <button
                  onClick={() => setFilterSolutionMode('incorrect')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer ${
                    filterSolutionMode === 'incorrect' ? 'bg-card text-rose-500 shadow-xs' : 'text-muted-foreground'
                  }`}
                >
                  Wrong Only ({sr.incorrectAnswers})
                </button>
                <button
                  onClick={() => setFilterSolutionMode('unattempted')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer ${
                    filterSolutionMode === 'unattempted' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground'
                  }`}
                >
                  Unattempted ({sr.unattempted})
                </button>
              </div>
            </div>

            {/* Questions List */}
            <div className="divide-y divide-border/60">
              {filteredQuestions.map((q, idx) => {
                const userAns = answers[q.id];
                const isCorrect = userAns === q.correct_option;
                const isUnattempted = !userAns;

                return (
                  <div key={q.id} className="py-6 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-xs font-black text-muted-foreground w-8 shrink-0">
                        Q{questions.findIndex((orig) => orig.id === q.id) + 1}.
                      </span>
                      <div className="flex-1 space-y-3">
                        <div className="text-sm font-bold text-foreground leading-relaxed">
                          <MathText text={q.question_text} />
                        </div>

                        {/* Options */}
                        <div className="space-y-2">
                          {(['a', 'b', 'c', 'd'] as const).map((opt) => {
                            const optText = q[`option_${opt}` as keyof ExamMCQ] as string;
                            const isCorrectOpt = q.correct_option === opt;
                            const isUserOpt = userAns === opt;

                            let optClass = 'border-border bg-card text-muted-foreground';
                            if (isCorrectOpt) {
                              optClass = 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold';
                            } else if (isUserOpt && !isCorrectOpt) {
                              optClass = 'border-rose-500 bg-rose-500/10 text-rose-600 font-medium';
                            }

                            return (
                              <div
                                key={opt}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border text-xs leading-relaxed ${optClass}`}
                              >
                                <span className="w-5 h-5 rounded-lg border flex items-center justify-center font-black text-[11px] shrink-0 border-current">
                                  {OPTION_LABELS[opt]}
                                </span>
                                <div className="flex-1">
                                  <MathText text={optText} />
                                </div>
                                {isCorrectOpt && <Check size={14} className="text-emerald-600 shrink-0" />}
                                {isUserOpt && !isCorrectOpt && <X size={14} className="text-rose-500 shrink-0" />}
                              </div>
                            );
                          })}
                        </div>

                        {/* Status Label */}
                        <div className="text-xs">
                          {isCorrect ? (
                            <span className="text-emerald-600 font-bold">✓ Correct (+{q.marks} marks)</span>
                          ) : isUnattempted ? (
                            <span className="text-muted-foreground font-semibold">○ Unattempted (0 marks)</span>
                          ) : (
                            <span className="text-rose-500 font-bold">✗ Incorrect (-{q.negativeMarks} marks)</span>
                          )}
                        </div>

                        {/* Step Explanation */}
                        {q.explanation && (
                          <div className="mt-3 bg-muted/40 border border-border/80 rounded-2xl p-4 text-xs space-y-1">
                            <p className="font-bold text-primary flex items-center gap-1">
                              <Sparkles size={13} /> Explanation &amp; Key Derivation
                            </p>
                            <div className="text-muted-foreground leading-relaxed">
                              <MathText text={q.explanation} />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex gap-4 pt-2">
            <button
              onClick={() => {
                setExamMode('list');
                setSelectedExam(null);
                setQuestions([]);
              }}
              className="btn-secondary flex-1 py-3.5 rounded-2xl text-xs font-bold gap-2 flex items-center justify-center"
            >
              <RotateCcw size={15} /> Back to Mock Tests
            </button>
            <button
              onClick={() => {
                if (selectedExam) {
                  handleSelectExamForInstructions(selectedExam);
                }
              }}
              className="btn-primary flex-1 py-3.5 rounded-2xl text-xs font-black gap-2 flex items-center justify-center shadow-md"
            >
              <Play size={15} className="fill-current" /> Retake Examination
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return null;
}
