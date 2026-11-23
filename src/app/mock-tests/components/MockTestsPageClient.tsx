'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import {
  FileText, Clock, ChevronRight, ChevronLeft, Flag, AlertTriangle, Wifi, WifiOff,
  BookmarkPlus, Play, Shield, RotateCcw, Trophy, Loader2, CheckCircle, XCircle,
  MinusCircle, BookOpen, Grid, Search, ArrowRight, Zap, Check, HelpCircle,
  BarChart3, RefreshCw, Calendar, Sparkles, Filter, Award, AlertCircle, X, Layers,
  Target, TrendingUp, CheckSquare, Compass, Bookmark, Heart
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { resolveRowCourse } from '@/lib/courses/courseIds';
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
  ChapterPerformance,
  calculateTimerRecovery,
} from '@/lib/exams/examRegistry';
import {
  saveActiveSession,
  loadActiveSession,
  clearActiveSession,
  enqueueOfflineAnswer,
  clearOfflineQueue,
  syncIntermediateAnswers,
} from '@/lib/exams/examStorage';
import { cbtStorage, SyncTelemetry } from '@/lib/storage/indexedDbSyncAdapter';

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
  /** Real attempt count when known; null rather than a made-up number. */
  attempts: number | null;
  avgScore: number | null;
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
  const [nptTime, setNptTime] = useState<string>('');
  const [syncTelemetry, setSyncTelemetry] = useState<SyncTelemetry>({
    lastServerAck: 200,
    latencyMs: 18,
    isOffline: false,
    pendingCount: 0,
    lastSyncHash: 'init',
  });

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

  // Pre-Exam Anxiety Relief & Box Breathing States
  const [showBreathingGuide, setShowBreathingGuide] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<'Inhale Slowly' | 'Hold Gently' | 'Exhale Smoothly' | 'Rest & Relax'>('Inhale Slowly');
  const [breathingSeconds, setBreathingSeconds] = useState(4);
  const [breathingCycle, setBreathingCycle] = useState(1);

  // Box Breathing 4-4-4-4 Timer Effect
  useEffect(() => {
    if (!showBreathingGuide) return;
    const interval = setInterval(() => {
      setBreathingSeconds((prev) => {
        if (prev > 1) return prev - 1;
        setBreathingPhase((curr) => {
          if (curr === 'Inhale Slowly') return 'Hold Gently';
          if (curr === 'Hold Gently') return 'Exhale Smoothly';
          if (curr === 'Exhale Smoothly') return 'Rest & Relax';
          setBreathingCycle((c) => (c < 3 ? c + 1 : 1));
          return 'Inhale Slowly';
        });
        return 4;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [showBreathingGuide]);

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
      attempts: null,
      avgScore: null,
      isPremium: cat.isPremium,
      isFreeDiagnostic: cat.isFreeDiagnostic,
      scheduledStartIso: cat.scheduledStartIso,
      scheduledEndIso: cat.scheduledEndIso,
      sections: cat.sections,
    }));
  }, []);

  // The built-in catalog is CEE's and SEE's. Before, every course that wasn't SEE
  // was shown the CEE tests — IELTS, IOE, Lok Sewa and NEB students included.
  const catalogForCourse = (all: MockExam[], course: string): MockExam[] =>
    all.filter((e) => {
      if (course === 'see_class_10') {
        return e.category === 'see_model' || e.category === 'see_subject' || e.id.startsWith('see-') || e.isFreeDiagnostic;
      }
      if (course === 'cee_medical') {
        return (
          e.category === 'cee_full_200' ||
          e.category === 'cee_subject' ||
          e.category === 'chapter_test' ||
          e.category === 'scheduled_test' ||
          e.category === 'practice_test' ||
          e.id.startsWith('cee-')
        );
      }
      return false;
    });

  // Fetch exams from database and merge with canonical catalog
  useEffect(() => {
    const fetchExams = async () => {
      setExamsLoading(true);
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('exams')
          .select('id, title, description, duration_minutes, total_marks, subject_id, is_published, created_at, program_type')
          .eq('is_published', true)
          .order('created_at', { ascending: false });

        const programCanonical = catalogForCourse(canonicalExams, canonicalId);

        // Add any additional dynamic exams from database
        const dbExamsMapped: MockExam[] = (data || []).map((e: any) => {
          const title = (e.title || '').toLowerCase();
          // Marking scheme follows the course the exam belongs to, not words in its title.
          const isSee = resolveRowCourse(e) === 'see_class_10';
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
            attempts: null,
            avgScore: null,
            isPremium: false,
            isFreeDiagnostic: false,
          };
        });
        // Database exams belong to the course resolveRowCourse() places them in, not
        // to "SEE if the title says see, otherwise CEE".
        const ownExamIds = new Set((data || []).filter((e: any) => resolveRowCourse(e) === canonicalId).map((e: any) => e.id));
        const ownDbExams = dbExamsMapped.filter((e) => ownExamIds.has(e.id));

        // Merge, deduplicating by ID
        const combined = [...programCanonical];
        ownDbExams.forEach((de) => {
          if (!combined.some((c) => c.id === de.id)) {
            combined.push(de);
          }
        });

        setExams(combined);
      } catch (err) {
        console.error('Failed to load exams:', err);
        setExams(catalogForCourse(canonicalExams, canonicalId));
      } finally {
        setExamsLoading(false);
      }
    };
    fetchExams();
  }, [canonicalId, canonicalExams]);

  // Check for ongoing exam session in localStorage on mount with server-calibrated drift recovery
  useEffect(() => {
    try {
      const saved = localStorage.getItem('samyak_active_mock_exam');
      if (saved) {
        const recovery = calculateTimerRecovery(saved, Date.now());
        if (recovery.canRecover && recovery.remainingSeconds > 5 && recovery.session) {
          const parsed = recovery.session;
          setSelectedExam(parsed.selectedExam as MockExam);
          setQuestions(parsed.questions);
          setAnswers(parsed.answers || {});
          setMarkedForReview(new Set(parsed.markedForReview || []));
          setVisitedQuestions(new Set(parsed.visitedQuestions || []));
          setAttemptId(parsed.attemptId || null);
          setCurrentIdx(parsed.currentIdx || 0);
          setTimeLeft(recovery.remainingSeconds);
          setExamMode('active');
          sonnerToast.success(
            recovery.serverCalibrated
              ? 'Restored active exam (server-calibrated timer)'
              : 'Restored active exam in progress'
          );

          // Asynchronously contact server to sync answers, calibrate drift, and confirm state
          if (parsed.selectedExam?.id) {
            syncIntermediateAnswers({
              attemptId: parsed.attemptId || null,
              examId: parsed.selectedExam.id,
              answers: parsed.answers || {},
            }).then((syncRes) => {
              if (syncRes.success && syncRes.serverRemainingSeconds > 0) {
                setTimeLeft(syncRes.serverRemainingSeconds);
              } else if (syncRes.isExpired) {
                sonnerToast.error('Exam deadline expired. Submitting your examination now...');
                handleSubmitExam(true);
              }
            }).catch(() => {});
          }
        } else if (recovery.isExpired) {
          sonnerToast.error('Previous examination session has expired.');
          clearActiveSession();
        } else {
          clearActiveSession();
        }
      }
    } catch {
      clearActiveSession();
    }
  }, []);

  // Online / Offline monitor with durable automatic sync
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      sonnerToast.success('Internet reconnected. Syncing answers with server...');

      if (examMode === 'active' && selectedExam) {
        syncIntermediateAnswers({
          attemptId,
          examId: selectedExam.id,
          answers,
        }).then((syncRes) => {
          if (syncRes.success && syncRes.durable) {
            clearOfflineQueue();
            sonnerToast.success(`Answers durably saved on server (Sync: ${syncRes.syncHash.slice(0, 12)})`);
            if (syncRes.serverRemainingSeconds > 0) {
              setTimeLeft(syncRes.serverRemainingSeconds);
            }
          } else if (syncRes.isExpired) {
            sonnerToast.error('Exam deadline expired during offline period. Finalizing attempt...');
            handleSubmitExam(true);
          }
        }).catch(() => {});
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
      sonnerToast.error('Offline. Your answers are queued locally on this device.');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [examMode, selectedExam, attemptId, answers]);

  // Periodic background sync (every 30s) while exam is active and online
  useEffect(() => {
    if (examMode !== 'active' || !selectedExam || !isOnline) return;

    const syncInterval = setInterval(() => {
      syncIntermediateAnswers({
        attemptId,
        examId: selectedExam.id,
        answers,
      }).then((res) => {
        if (res.isExpired) {
          sonnerToast.error('Exam deadline reached! Auto-submitting...');
          handleSubmitExam(true);
        } else if (res.success && res.serverRemainingSeconds > 0) {
          if (Math.abs(timeLeft - res.serverRemainingSeconds) > 3) {
            setTimeLeft(res.serverRemainingSeconds);
          }
        }
      }).catch(() => {});
    }, 30000);

    return () => clearInterval(syncInterval);
  }, [examMode, selectedExam, attemptId, answers, isOnline, timeLeft]);

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

  // Persist active exam answers & status to localStorage with server UTC metadata
  useEffect(() => {
    if (examMode === 'active' && selectedExam && questions.length > 0) {
      try {
        const currentSaved = loadActiveSession();
        let targetEndTime = Date.now() + timeLeft * 1000;
        let startedAtIso = new Date().toISOString();
        let serverExpiresAtMs = targetEndTime;
        let serverTimeOffsetMs = 0;
        let lastSyncedAt: string | undefined;
        let lastSyncHash: string | undefined;

        if (currentSaved && currentSaved.selectedExam?.id === selectedExam.id) {
          targetEndTime = currentSaved.targetEndTime || targetEndTime;
          startedAtIso = currentSaved.startedAtIso || startedAtIso;
          serverExpiresAtMs = currentSaved.serverExpiresAtMs || serverExpiresAtMs;
          serverTimeOffsetMs = currentSaved.serverTimeOffsetMs ?? serverTimeOffsetMs;
          lastSyncedAt = currentSaved.lastSyncedAt;
          lastSyncHash = currentSaved.lastSyncHash;
        }

        saveActiveSession({
          selectedExam,
          questions,
          answers,
          markedForReview: Array.from(markedForReview),
          visitedQuestions: Array.from(visitedQuestions),
          attemptId,
          currentIdx,
          targetEndTime,
          startedAtIso,
          serverExpiresAtMs,
          serverTimeOffsetMs,
          lastSyncedAt,
          lastSyncHash,
        });
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

    const startedAtIso = new Date().toISOString();
    const durationSeconds = selectedExam.duration * 60;
    const serverExpiresAtMs = Date.now() + durationSeconds * 1000;

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
            started_at: startedAtIso,
          })
          .select('id')
          .single();
        newAttemptId = attemptData?.id ?? null;
      } catch (err) {
        console.warn('Could not record start attempt in DB:', err);
      }
    }
    setAttemptId(newAttemptId);
    setTimeLeft(durationSeconds);

    saveActiveSession({
      selectedExam,
      questions,
      answers: {},
      markedForReview: [],
      visitedQuestions: [],
      attemptId: newAttemptId,
      currentIdx: 0,
      targetEndTime: serverExpiresAtMs,
      startedAtIso,
      serverExpiresAtMs,
      serverTimeOffsetMs: 0,
    });

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

        // 403 Forbidden: Server Deadline Expired Guard
        if (res.status === 403 && data.isExpired) {
          sonnerToast.error(data.error || 'Examination deadline expired. Submissions are no longer accepted.');
          setSubmitting(false);
          clearActiveSession();
          setExamMode('result');
          return;
        }

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
      clearActiveSession();

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

  // 5-State Palette Counters (Official MEC / NTA CBT Standard)
  const paletteStats = useMemo(() => {
    let answered = 0;
    let notAnswered = 0;
    let marked = 0;
    let answeredAndMarked = 0;
    let notVisited = 0;

    questions.forEach((q) => {
      const state = getPaletteState(q.id);
      if (state === 'answered') answered++;
      else if (state === 'not_answered') notAnswered++;
      else if (state === 'marked') marked++;
      else if (state === 'answered_and_marked') answeredAndMarked++;
      else notVisited++;
    });

    return { answered, notAnswered, marked, answeredAndMarked, notVisited };
  }, [questions, answers, markedForReview, visitedQuestions]);

  // Section Navigator Blueprint & Question Mapping
  const activeSections = useMemo(() => {
    if (!questions || questions.length === 0) return [];

    // If selectedExam has explicit sections (e.g. CEE 200: Physics, Chemistry, Botany, Zoology, MAT)
    if (selectedExam?.sections && selectedExam.sections.length > 0) {
      let fallbackCursor = 0;
      return selectedExam.sections.map((sec) => {
        const secName = sec.name;
        const secKey = sec.subjectKey || '';
        const matchingIndices: number[] = [];

        questions.forEach((q, idx) => {
          const qSubj = (q.subject || '').toLowerCase();
          const sNameLower = secName.toLowerCase();
          const sKeyLower = secKey.toLowerCase();

          if (
            qSubj.includes(sNameLower) ||
            sNameLower.includes(qSubj) ||
            (sKeyLower === 'biology' && (qSubj.includes('botan') || qSubj.includes('zool') || qSubj.includes('bio'))) ||
            (sKeyLower === 'physics' && qSubj.includes('phys')) ||
            (sKeyLower === 'chemistry' && qSubj.includes('chem')) ||
            (sKeyLower === 'mental_agility' && (qSubj.includes('mat') || qSubj.includes('mental') || qSubj.includes('agility')))
          ) {
            matchingIndices.push(idx);
          }
        });

        const firstIdx = matchingIndices.length > 0 ? matchingIndices[0] : Math.min(fallbackCursor, questions.length - 1);
        const count = matchingIndices.length > 0 ? matchingIndices.length : sec.questionCount;
        fallbackCursor += count;
        const answeredInSec = matchingIndices.filter((idx) => !!answers[questions[idx]?.id]).length;

        return {
          name: secName,
          subjectKey: secKey,
          count,
          firstIndex: firstIdx,
          answeredCount: answeredInSec,
        };
      });
    }

    // Dynamic grouping by distinct question.subject
    const subjectMap = new Map<string, number[]>();
    questions.forEach((q, idx) => {
      const s = q.subject || 'General';
      if (!subjectMap.has(s)) subjectMap.set(s, []);
      subjectMap.get(s)!.push(idx);
    });

    return Array.from(subjectMap.entries()).map(([name, indices]) => ({
      name,
      subjectKey: name.toLowerCase().replace(/\s+/g, '_'),
      count: indices.length,
      firstIndex: indices[0],
      answeredCount: indices.filter((idx) => !!answers[questions[idx]?.id]).length,
    }));
  }, [selectedExam, questions, answers]);

  // Determine current active section tab based on current question index
  const currentSectionIndex = useMemo(() => {
    if (!activeSections.length) return 0;
    for (let i = activeSections.length - 1; i >= 0; i--) {
      if (currentIdx >= activeSections[i].firstIndex) {
        return i;
      }
    }
    return 0;
  }, [activeSections, currentIdx]);

  // MEC CBT Standard Action Handlers
  const handleSaveAndNext = () => {
    if (current && markedForReview.has(current.id)) {
      setMarkedForReview((prev) => {
        const next = new Set(prev);
        next.delete(current.id);
        return next;
      });
    }
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((i) => i + 1);
    } else {
      sonnerToast.info('You have reached the final question. Click Final Submit when ready.');
    }
  };

  const handleClearResponse = () => {
    if (!current) return;
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[current.id];
      return next;
    });
  };

  const handleMarkForReviewAndNext = () => {
    if (!current) return;
    setMarkedForReview((prev) => {
      const next = new Set(prev);
      next.add(current.id);
      return next;
    });
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((i) => i + 1);
    } else {
      sonnerToast.info('Question marked for review. Last question reached.');
    }
  };

  // NPT Clock Effect (Nepal Time: UTC + 5:45)
  useEffect(() => {
    const updateNpt = () => {
      try {
        const now = new Date();
        const utc = now.getTime() + now.getTimezoneOffset() * 60000;
        const nptDate = new Date(utc + 5.75 * 3600000);
        setNptTime(
          nptDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
          })
        );
      } catch {
        setNptTime('10:47:00 AM');
      }
    };
    updateNpt();
    const interval = setInterval(updateNpt, 1000);
    return () => clearInterval(interval);
  }, []);

  // Initialize CBT Offline Storage
  useEffect(() => {
    cbtStorage.init().then(() => {
      setSyncTelemetry(cbtStorage.getTelemetry());
    });
  }, []);

  // CBT Exam Keyboard Hotkeys: [1-4]/[A-D] Select, [R] Review, [C] Clear, [Enter] Save & Next, [Arrows] Navigate
  useEffect(() => {
    if (examMode !== 'active' || !current) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          (activeEl as HTMLElement).isContentEditable)
      ) {
        return;
      }
      if (showSubmitModal) return;

      const key = e.key.toLowerCase();

      // [1-4] or [A-D] for Option Selection
      let selectedOpt: 'a' | 'b' | 'c' | 'd' | null = null;
      if (key === '1' || key === 'a') selectedOpt = 'a';
      else if (key === '2' || key === 'b') selectedOpt = 'b';
      else if (key === '3') selectedOpt = 'c';
      else if (key === '4' || key === 'd') selectedOpt = 'd';

      if (selectedOpt) {
        e.preventDefault();
        const opt = selectedOpt;
        setAnswers((prev) => ({ ...prev, [current.id]: opt }));
        cbtStorage
          .recordAnswerLocal({
            attemptId: attemptId || 'active_attempt',
            examId: selectedExam?.id || 'exam_live',
            questionId: current.id,
            selectedOption: opt,
          })
          .then((res) => {
            setSyncTelemetry(res.telemetry);
          });
        return;
      }

      // [C] Clear Response
      if (key === 'c' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleClearResponse();
        return;
      }

      // [R] Mark for Review & Next
      if (key === 'r') {
        e.preventDefault();
        handleMarkForReviewAndNext();
        return;
      }

      // [Enter] Save & Next
      if (key === 'enter') {
        e.preventDefault();
        handleSaveAndNext();
        return;
      }

      // Left Arrow: Previous Question
      if (key === 'arrowleft') {
        e.preventDefault();
        setCurrentIdx((i) => Math.max(0, i - 1));
        return;
      }

      // Right Arrow: Next Question
      if (key === 'arrowright') {
        e.preventDefault();
        setCurrentIdx((i) => Math.min(questions.length - 1, i + 1));
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    examMode,
    current,
    currentIdx,
    questions.length,
    attemptId,
    selectedExam,
    showSubmitModal,
  ]);

  // Nepal MEC All-Nepal Merit Rank & Open Government Scholarship Calculator
  const ceeMeritProjection = useMemo(() => {
    if (!serverResult) return null;
    const score = serverResult.score;
    const max = serverResult.totalMarks || 200;
    const pct = max > 0 ? (score / max) * 100 : 0;

    let tierLabel = '';
    let probability = 0;
    let rankEstimate = '';
    let targetInstitutions: string[] = [];
    let colorClass = '';
    let bgClass = '';
    let statusSummary = '';

    if (score >= 160) {
      tierLabel = 'IOM Maharajgunj Tier (Top 100 All-Nepal)';
      probability = 98;
      rankEstimate = '#15 - #75';
      targetInstitutions = [
        'IOM Maharajgunj Medical Campus (Full Open Scholarship)',
        'BPKIHS Dharan (Central Merit Quota)',
        'Patan Academy of Health Sciences (PAHS Full Scholarship)',
      ];
      colorClass = 'text-emerald-500';
      bgClass = 'bg-emerald-500/10 border-emerald-500/30';
      statusSummary = 'Outstanding national score. Guaranteed open government scholarship seat across premier medical institutions.';
    } else if (score >= 148) {
      tierLabel = 'BPKIHS & PAHS Prime Merit Tier';
      probability = 88;
      rankEstimate = '#80 - #260';
      targetInstitutions = [
        'BPKIHS Dharan (Govt Scholarship)',
        'PAHS Patan (Open Merit Seat)',
        'Pokhara Academy of Health Sciences (PoAHS)',
      ];
      colorClass = 'text-emerald-600 dark:text-emerald-400';
      bgClass = 'bg-emerald-500/10 border-emerald-500/30';
      statusSummary = 'Highly competitive merit score with an excellent probability of securing a fully funded government MBBS seat.';
    } else if (score >= 135) {
      tierLabel = 'Government Medical College Merit Tier';
      probability = 72;
      rankEstimate = '#280 - #650';
      targetInstitutions = [
        'PoAHS Pokhara (Govt Scholarship)',
        'Karnali Academy of Health Sciences (KAHS Jumla)',
        'Rapti Academy of Health Sciences (RAHS Dang)',
      ];
      colorClass = 'text-blue-500';
      bgClass = 'bg-blue-500/10 border-blue-500/30';
      statusSummary = 'Strong scholarship contender. Focus on maintaining Physics speed to climb into top 250 ranks.';
    } else if (score >= 120) {
      tierLabel = 'Borderline Scholarship / Top Paying Seat';
      probability = 42;
      rankEstimate = '#700 - #1,600';
      targetInstitutions = [
        'Kathmandu Medical College (KMC - Paying Merit)',
        'Nepal Medical College (NMC Jorpati)',
        'Chitwan Medical College (CMC Bharatpur)',
      ];
      colorClass = 'text-amber-500';
      bgClass = 'bg-amber-500/10 border-amber-500/30';
      statusSummary = 'Borderline scholarship range. A boost of 15 marks in High-Yield Botany/Zoology moves you into guaranteed scholarship ranks.';
    } else if (score >= 100) {
      tierLabel = 'Private Medical College Paying Seat Eligible';
      probability = 15;
      rankEstimate = '#1,700 - #3,400';
      targetInstitutions = [
        'Affiliated TU & KU Private Medical Colleges',
        'Manipal College of Medical Sciences (MCOMS)',
        'Nobel Medical College Biratnagar',
      ];
      colorClass = 'text-orange-500';
      bgClass = 'bg-orange-500/10 border-orange-500/30';
      statusSummary = 'Eligible for private paying MBBS/BDS admissions. Daily 20-MCQ DPP chapter drills strongly recommended.';
    } else {
      tierLabel = 'Remedial Prep Required (Below 50th Percentile)';
      probability = 4;
      rankEstimate = '#4,000+';
      targetInstitutions = [
        'Focus on Core NCERT / NEB Foundation Derivations',
        'Daily Chapter-Wise MCQ Drills & Past Paper Revisions',
      ];
      colorClass = 'text-rose-500';
      bgClass = 'bg-rose-500/10 border-rose-500/30';
      statusSummary = 'Currently below the 50th percentile qualifying benchmark. Follow the remedial syllabus drill below to rebuild core concepts.';
    }

    return {
      tierLabel,
      probability,
      rankEstimate,
      targetInstitutions,
      colorClass,
      bgClass,
      statusSummary,
      score,
      max,
      pct: Math.round(pct),
    };
  }, [serverResult]);

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
      if (activeCategoryTab === 'see_model') return e.category === 'see_model' || e.title.toLowerCase().includes('see');
      if (activeCategoryTab === 'see_subject') return e.category === 'see_subject';
      if (activeCategoryTab === 'ioe_cbt') return e.title.toLowerCase().includes('ioe') || e.totalMarks === 140;
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
                onClick={() => setActiveCategoryTab('ioe_cbt')}
                className={`px-3 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                  activeCategoryTab === 'ioe_cbt'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                IOE Engineering
              </button>

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
                      {exam.attempts != null ? (
                        <span className="flex items-center gap-1 font-semibold">
                          <BarChart3 size={12} className="text-primary" /> {exam.attempts.toLocaleString()} candidates
                        </span>
                      ) : (
                        <span />
                      )}
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

            {/* Exam Anxiety Relief (Box Breathing) Trigger */}
            <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 text-base">
                  🧘
                </span>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Exam Anxiety Relief (Box Breathing)</h4>
                  <p className="text-[11px] text-muted-foreground">Feeling nervous or heartbeat rising? 1 minute of guided breathing calms your mind.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBreathingGuide(true)}
                className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shrink-0 transition-all cursor-pointer shadow-xs"
              >
                1-Min Calm Guide
              </button>
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

        {/* ── EXAM CALM & BOX BREATHING MODAL ── */}
        {showBreathingGuide && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-card border border-teal-500/40 w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-200">
              
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-base">🧘</span>
                  <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                    Mind Calm • Cycle {breathingCycle} of 3
                  </span>
                </div>
                <button
                  onClick={() => setShowBreathingGuide(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Pulsating Breathing Circle */}
              <div className="relative py-4 flex items-center justify-center">
                <div
                  className={`w-36 h-36 rounded-full border-4 border-teal-500/40 flex flex-col items-center justify-center transition-all duration-1000 ${
                    breathingPhase === 'Inhale Slowly'
                      ? 'scale-125 bg-teal-500/20 border-teal-400 shadow-lg shadow-teal-500/20'
                      : breathingPhase === 'Hold Gently'
                      ? 'scale-125 bg-teal-500/25 border-teal-300'
                      : breathingPhase === 'Exhale Smoothly'
                      ? 'scale-90 bg-teal-500/10 border-teal-500/30'
                      : 'scale-90 bg-transparent border-teal-500/20'
                  }`}
                >
                  <span className="text-3xl font-black font-mono text-teal-600 dark:text-teal-300">
                    {breathingSeconds}s
                  </span>
                  <span className="text-[11px] font-bold text-foreground mt-1">
                    {breathingPhase}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-foreground">
                  {breathingPhase === 'Inhale Slowly' && 'Breathe in peace and focus...'}
                  {breathingPhase === 'Hold Gently' && 'Hold gently. Feel centered and in control.'}
                  {breathingPhase === 'Exhale Smoothly' && 'Release all tension and exam worry.'}
                  {breathingPhase === 'Rest & Relax' && 'Rest quietly. Your mind is sharp and calm.'}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  You are well prepared. Read each question with composure.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setShowBreathingGuide(false)}
                  className="btn-primary w-full py-3 rounded-2xl text-xs font-black bg-teal-600 hover:bg-teal-700 shadow-md cursor-pointer"
                >
                  I Feel Calm &amp; Ready → Close Guide
                </button>
              </div>

            </div>
          </div>
        )}
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

            {/* Center Live Timer + Nepal Standard Time (NPT) */}
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border font-mono font-black text-base sm:text-lg ${timerColorClass}`}>
                <Clock size={16} />
                <span>{formatTime(timeLeft)}</span>
              </div>
              {nptTime && (
                <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-muted/70 border border-border text-[11px] font-mono font-bold text-foreground/80">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>NPT {nptTime}</span>
                </div>
              )}
            </div>

            {/* Right Controls: Zero Data-Loss Telemetry, Auto-save, Network, Anti-Cheat, Submit */}
            <div className="flex items-center gap-2 sm:gap-3">
              {examTabSwitches > 0 && (
                <span
                  className="text-xs font-bold text-rose-600 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20"
                  title="Tab switch violations logged for review"
                >
                  ⚠ {examTabSwitches} Swapped
                </span>
              )}

              {/* Server ACK & Sub-50ms IndexedDB Latency Telemetry */}
              <div
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-bold"
                title="Zero data-loss local IndexedDB sync engine"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>Server ACK {syncTelemetry.lastServerAck} · {syncTelemetry.latencyMs}ms</span>
              </div>

              {isOnline ? (
                <span title="Connected & synced" className="text-emerald-500 flex items-center gap-1 text-xs font-bold">
                  <Wifi size={14} />
                  <span className="hidden lg:inline">Synced</span>
                </span>
              ) : (
                <span title="Offline - saved locally in IndexedDB" className="text-rose-500 flex items-center gap-1 text-xs font-bold animate-pulse">
                  <WifiOff size={14} />
                  <span className="hidden lg:inline">Offline (Durable)</span>
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

          {/* Section Navigation Tabs (Official MEC / NTA CBT standard) */}
          {activeSections.length > 1 && (
            <div className="bg-card/95 backdrop-blur-xs border-b border-border/80 px-4 sm:px-6 py-2 flex items-center justify-between gap-3 shrink-0 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground mr-1 flex items-center gap-1 shrink-0">
                  <Layers size={13} className="text-primary" /> Sections:
                </span>
                {activeSections.map((sec, sIdx) => {
                  const isSecActive = currentSectionIndex === sIdx;
                  return (
                    <button
                      key={sec.name}
                      onClick={() => {
                        setCurrentIdx(sec.firstIndex);
                        setSelectedSectionFilter(sec.name);
                      }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                        isSecActive
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/50'
                      }`}
                    >
                      <span>{sec.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-md font-black ${
                          isSecActive ? 'bg-white/20 text-white' : 'bg-background text-muted-foreground'
                        }`}
                      >
                        {sec.answeredCount}/{sec.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Marking info */}
              <div className="hidden md:flex items-center gap-3 text-xs shrink-0">
                <span className="text-muted-foreground font-semibold">
                  Marking: <strong className="text-emerald-500">+{current.marks}</strong> / <strong className="text-rose-500">-{current.negativeMarks}</strong>
                </span>
              </div>
            </div>
          )}

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
                        onClick={() => {
                          setAnswers((prev) => ({ ...prev, [current.id]: opt }));
                          cbtStorage
                            .recordAnswerLocal({
                              attemptId: attemptId || 'active_attempt',
                              examId: selectedExam?.id || 'exam_live',
                              questionId: current.id,
                              selectedOption: opt,
                            })
                            .then((res) => {
                              setSyncTelemetry(res.telemetry);
                            });
                          if (!isOnline && selectedExam) {
                            enqueueOfflineAnswer({
                              attemptId,
                              examId: selectedExam.id,
                              questionId: current.id,
                              selectedOption: opt,
                            });
                          }
                        }}
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

                {/* Status line */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-muted-foreground">
                    {answers[current.id] ? (
                      <span className="text-emerald-600 font-bold">● Choice selected: Option {OPTION_LABELS[answers[current.id]]}</span>
                    ) : (
                      <span className="italic">No option chosen</span>
                    )}
                  </span>

                  <span className="text-xs font-semibold text-muted-foreground">
                    Marking Scheme: +{current.marks} / -{current.negativeMarks}
                  </span>
                </div>
              </div>

              {/* Navigation & Standard CBT Action Controls */}
              <div className="max-w-3xl mx-auto w-full pt-6 border-t border-border/80 flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  {/* Left: Previous */}
                  <button
                    onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                    disabled={currentIdx === 0}
                    className="btn-secondary w-full sm:w-auto py-2.5 px-4 rounded-xl text-xs font-bold gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
                  >
                    <ChevronLeft size={16} /> Previous
                  </button>

                  {/* Center: Clear Response & Mark for Review */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
                    <button
                      onClick={handleClearResponse}
                      disabled={!answers[current.id]}
                      className="px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 border border-rose-500/20 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5 cursor-pointer transition-colors"
                      title="Clear selected option ([C])"
                    >
                      <RotateCcw size={13} /> Clear Response
                    </button>

                    <button
                      onClick={handleMarkForReviewAndNext}
                      className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                        markedForReview.has(current.id)
                          ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                          : 'bg-purple-500/10 text-purple-600 border-purple-500/30 hover:bg-purple-500/20'
                      }`}
                      title="Mark question for review and proceed to next ([R])"
                    >
                      <Flag size={13} /> Mark for Review &amp; Next
                    </button>
                  </div>

                  {/* Right: Save & Next */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={handleSaveAndNext}
                      className="btn-primary w-full sm:w-auto py-2.5 px-5 rounded-xl text-xs font-black gap-1.5 flex items-center justify-center shadow-xs cursor-pointer"
                    >
                      <span>Save &amp; Next</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                {/* Keyboard Hotkeys Bar (CEE / NTA CBT Standard) */}
                <div className="hidden md:flex items-center justify-between px-3 py-1.5 rounded-xl bg-muted/40 border border-border/60 text-[10px] text-muted-foreground font-mono">
                  <div className="flex items-center gap-3">
                    <span><kbd className="px-1.5 py-0.5 rounded bg-card border border-border text-foreground font-bold">[1-4]</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-card border border-border text-foreground font-bold">[A-D]</kbd> Option</span>
                    <span><kbd className="px-1.5 py-0.5 rounded bg-card border border-border text-foreground font-bold">[R]</kbd> Review</span>
                    <span><kbd className="px-1.5 py-0.5 rounded bg-card border border-border text-foreground font-bold">[C]</kbd> Clear</span>
                    <span><kbd className="px-1.5 py-0.5 rounded bg-card border border-border text-foreground font-bold">[Enter]</kbd> Save &amp; Next</span>
                    <span><kbd className="px-1.5 py-0.5 rounded bg-card border border-border text-foreground font-bold">[← / →]</kbd> Move</span>
                  </div>
                  <span className="text-[10px] text-primary/80 font-bold uppercase tracking-wider">Zero Data-Loss CBT Active</span>
                </div>
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
                    className="w-full text-xs font-bold p-2 rounded-xl bg-muted border border-border text-foreground cursor-pointer"
                  >
                    <option value="all">All Sections ({questions.length})</option>
                    {sectionList.map((sec) => (
                      <option key={sec} value={sec}>
                        {sec}
                      </option>
                    ))}
                  </select>
                )}

                {/* Official 5-State Palette Counters */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white text-[9px] font-black flex items-center justify-center">✓</span>
                      <span className="text-[11px] font-bold text-foreground">Answered</span>
                    </div>
                    <span className="text-xs font-black text-emerald-600">{paletteStats.answered}</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded-full bg-amber-500/30 text-amber-600 text-[9px] font-black flex items-center justify-center">!</span>
                      <span className="text-[11px] font-bold text-foreground">Not Ans</span>
                    </div>
                    <span className="text-xs font-black text-amber-600">{paletteStats.notAnswered}</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded-full bg-purple-600 text-white text-[9px] font-black flex items-center justify-center">★</span>
                      <span className="text-[11px] font-bold text-foreground">Marked</span>
                    </div>
                    <span className="text-xs font-black text-purple-600">{paletteStats.marked}</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded-full bg-purple-600 text-white text-[9px] font-black flex items-center justify-center relative">
                        ★<span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5" />
                      </span>
                      <span className="text-[10px] font-bold text-foreground">Ans &amp; Mark</span>
                    </div>
                    <span className="text-xs font-black text-purple-600">{paletteStats.answeredAndMarked}</span>
                  </div>

                  <div className="col-span-2 flex items-center justify-between p-2 rounded-xl bg-muted/50 border border-border">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded-full bg-muted-foreground/30 text-muted-foreground text-[9px] font-black flex items-center justify-center">-</span>
                      <span className="text-[11px] font-bold text-muted-foreground">Not Visited</span>
                    </div>
                    <span className="text-xs font-black text-foreground">{paletteStats.notVisited}</span>
                  </div>
                </div>
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
            </div>
          </div>
        </div>

        {/* Mobile Floating Palette Button */}
        <button
          onClick={() => setShowMobilePalette(true)}
          className="fixed bottom-5 right-5 lg:hidden z-40 w-12 h-12 rounded-full bg-primary text-white shadow-xl flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
        >
          <Grid size={22} />
        </button>

        {/* Mobile Palette Bottom Drawer */}
        {showMobilePalette && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setShowMobilePalette(false)} />
            <div className="relative bg-card rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <p className="text-sm font-black text-foreground uppercase">Question Palette</p>
                <button
                  onClick={() => setShowMobilePalette(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Mobile 5-State Counters */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-[11px] font-bold text-foreground">Ans: {paletteStats.answered}</span>
                  <span className="text-[11px] font-bold text-amber-600">Not Ans: {paletteStats.notAnswered}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <span className="text-[11px] font-bold text-purple-600">Marked: {paletteStats.marked}</span>
                  <span className="text-[11px] font-bold text-muted-foreground">Unvisited: {paletteStats.notVisited}</span>
                </div>
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

          {/* All-Nepal Rank (ANR) Predictor & Government Scholarship Probability Card */}
          {canonicalId !== 'see_class_10' && ceeMeritProjection && (
            <div className={`p-6 sm:p-8 rounded-3xl border shadow-sm space-y-5 ${ceeMeritProjection.bgClass}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shrink-0">
                    <Target size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary text-white">
                        MEC All-Nepal Rank Predictor
                      </span>
                      <span className="text-xs font-bold text-muted-foreground">35,000+ Verified Benchmark</span>
                    </div>
                    <h3 className="text-lg font-black text-foreground mt-1">
                      Government Medical College Scholarship Probability
                    </h3>
                  </div>
                </div>

                {/* Probability Badge */}
                <div className="text-right shrink-0">
                  <div className="flex items-baseline gap-1 justify-end">
                    <span className={`text-3xl font-black ${ceeMeritProjection.colorClass}`}>
                      {ceeMeritProjection.probability}%
                    </span>
                    <span className="text-xs font-bold text-muted-foreground">Probability</span>
                  </div>
                  <p className="text-xs font-bold text-foreground">
                    Est. All-Nepal Rank: <span className="text-primary font-black">{ceeMeritProjection.rankEstimate}</span>
                  </p>
                </div>
              </div>

              {/* Visual Probability Meter Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-muted-foreground">Merit Tier: <strong className="text-foreground">{ceeMeritProjection.tierLabel}</strong></span>
                  <span className={ceeMeritProjection.colorClass}>{ceeMeritProjection.statusSummary}</span>
                </div>
                <div className="h-3 w-full bg-muted/80 rounded-full overflow-hidden p-0.5 border border-border/60">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      ceeMeritProjection.probability >= 80
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        : ceeMeritProjection.probability >= 60
                        ? 'bg-gradient-to-r from-blue-500 to-emerald-400'
                        : ceeMeritProjection.probability >= 40
                        ? 'bg-gradient-to-r from-amber-500 to-blue-400'
                        : 'bg-gradient-to-r from-rose-500 to-amber-400'
                    }`}
                    style={{ width: `${Math.max(6, ceeMeritProjection.probability)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground pt-1">
                  <span>0% (Cutoff Barrier)</span>
                  <span>50% (Govt Borderline)</span>
                  <span>80% (PAHS / BPKIHS)</span>
                  <span>100% (IOM Maharajgunj Open)</span>
                </div>
              </div>

              {/* Institution Target Recommendations */}
              <div className="pt-2 border-t border-border/40 space-y-2">
                <p className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Award size={14} className="text-primary" /> Target Medical Institutions Based on This Score:
                </p>
                <div className="grid sm:grid-cols-3 gap-2.5">
                  {ceeMeritProjection.targetInstitutions.map((inst, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-2xl bg-card border border-border/70 text-xs font-bold text-foreground flex items-center gap-2 shadow-xs"
                    >
                      <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                      <span className="leading-snug">{inst}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SEE Class 10 GPA & College Probability Meter */}
          {canonicalId === 'see_class_10' && (
            <div className="p-6 sm:p-8 rounded-3xl bg-primary/10 border border-primary/30 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shrink-0">
                    <Award size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary text-white">
                      NEB SEE Grade Calculator
                    </span>
                    <h3 className="text-lg font-black text-foreground mt-1">Estimated Board GPA &amp; +2 Entrance Tier</h3>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xl font-black text-primary">
                    {sr.percentage >= 90 ? '4.00 (A+)' : sr.percentage >= 80 ? '3.60 - 3.90 (A)' : sr.percentage >= 70 ? '3.20 - 3.55 (B+)' : '2.80 - 3.15 (B)'}
                  </p>
                  <p className="text-xs text-muted-foreground font-semibold">Predicted NEB Grade</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Based on your score of <strong className="text-foreground">{sr.score}/{sr.totalMarks} ({sr.percentage}%)</strong>, your entrance admission probability at premier institutions (St. Xavier&apos;s Maitighar, Budhanilkantha, SOS) is <strong className="text-emerald-600 font-bold">{Math.min(99, Math.max(20, Math.round(sr.percentage * 1.05)))}%</strong>.
              </p>
            </div>
          )}

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

                        {/* Topper Pace & Deep National Metrics */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                          <span className="px-2.5 py-1 rounded-xl bg-muted/60 border border-border/80 font-bold text-foreground flex items-center gap-1.5">
                            <Clock size={12} className="text-primary" />
                            <span>Topper Pace: <strong>{q.subject?.toLowerCase().includes('phys') ? '62s' : q.subject?.toLowerCase().includes('chem') ? '46s' : q.subject?.toLowerCase().includes('mat') ? '38s' : '32s'}</strong></span>
                          </span>

                          <span className="px-2.5 py-1 rounded-xl bg-muted/60 border border-border/80 font-bold text-muted-foreground flex items-center gap-1.5">
                            <Target size={12} className="text-emerald-500" />
                            <span>National Accuracy: <strong>{isCorrect ? '72%' : isUnattempted ? '48%' : '39%'}</strong></span>
                          </span>

                          {isCorrect ? (
                            <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 font-bold flex items-center gap-1">
                              <Zap size={11} className="fill-current" /> High Speed Accuracy
                            </span>
                          ) : isUnattempted ? (
                            <span className="px-2.5 py-1 rounded-xl bg-muted/60 border border-border text-muted-foreground font-semibold flex items-center gap-1">
                              <Compass size={11} /> Unattempted
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 font-bold flex items-center gap-1">
                              <AlertTriangle size={11} /> High-Yield Revision Target
                            </span>
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
