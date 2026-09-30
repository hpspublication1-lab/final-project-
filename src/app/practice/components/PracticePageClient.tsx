'use client';

import React, { useState, useEffect, useCallback, useTransition, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Zap,
  ChevronRight,
  ChevronLeft,
  BookmarkPlus,
  BookmarkCheck,
  Flag,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart2,
  Play,
  RotateCcw,
  Target,
  Brain,
  Loader2,
  AlertCircle,
  Lightbulb,
  X,
  Sparkles,
  SlidersHorizontal,
  HelpCircle,
  Send,
  RefreshCw,
  TrendingUp,
  Award,
  Layers
} from 'lucide-react';
import { fetchPracticeQuestions, fetchSubjectChapters, type QuestionRow, type ChapterOption } from '../actions';
import { createClient } from '@/lib/supabase/client';
import { useChat } from '@/lib/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { useProgram, normalizeCourseId } from '@/contexts/ProgramContext';
import ProgramSwitcher from '@/components/ProgramSwitcher';
import { MathText } from '@/components/MathText';
import toast from 'react-hot-toast';

interface MCQOption {
  id: string;
  text: string;
}

interface MCQ {
  id: string;
  question: string;
  options: MCQOption[];
  correctId: string;
  explanation: string;
  subject: string;
  chapter: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  marks: number;
  negativeMarks: number;
  subjectId: string | null;
}

function mapRowToMCQ(row: QuestionRow, isSee = false): MCQ {
  return {
    id: row.id,
    question: row.questionText,
    options: [
      { id: 'a', text: row.optionA },
      { id: 'b', text: row.optionB },
      { id: 'c', text: row.optionC },
      { id: 'd', text: row.optionD },
    ],
    correctId: row.correctOption,
    explanation: row.explanation ?? '',
    subject: row.subjectName ?? '',
    chapter: row.chapterTitle ?? '',
    difficulty: (row.difficulty.charAt(0).toUpperCase() + row.difficulty.slice(1)) as 'Easy' | 'Medium' | 'Hard',
    marks: 1,
    negativeMarks: isSee ? 0 : 0.25,
    subjectId: row.subjectId,
  };
}

type PracticeMode = 'setup' | 'loading' | 'active' | 'review';

const difficultyColors: Record<string, string> = {
  Easy: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
  Medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
  Hard: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
};

interface EvaluatedDetail {
  questionId: string;
  selectedOption: string | null;
  correctOption: string;
  isCorrect: boolean;
  marksAwarded: number;
  explanation: string;
  difficulty: string;
  markingScheme?: any;
}

interface SessionMetrics {
  totalQuestions: number;
  attempted: number;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  totalMarksPossible: number;
  totalScore: number;
  percentage: number;
  accuracyPercentage: number;
  paceMinutesPerQuestion: number;
  paceStatus: 'rushed' | 'on_target' | 'slow';
}

export default function PracticePageClient() {
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);
  const [mode, setMode] = useState<PracticeMode>('setup');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [selectedSubject, setSelectedSubject] = useState('Biology');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [questionCount, setQuestionCount] = useState(10);
  const [liveMode, setLiveMode] = useState(false);
  const [questions, setQuestions] = useState<MCQ[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Certified server evaluation results
  const [evaluating, setEvaluating] = useState(false);
  const [certifiedMetrics, setCertifiedMetrics] = useState<SessionMetrics | null>(null);
  const [evaluatedDetails, setEvaluatedDetails] = useState<EvaluatedDetail[]>([]);

  // Flag Question Modal
  const [flagModalOpen, setFlagModalOpen] = useState(false);
  const [flagReason, setFlagReason] = useState('Wrong answer key');
  const [flagDetails, setFlagDetails] = useState('');
  const [submittingFlag, setSubmittingFlag] = useState(false);

  // Custom Practice Drawer / Modal
  const [customPracticeOpen, setCustomPracticeOpen] = useState(false);

  const { user } = useAuth();
  const { program, programDetails, isSee } = useProgram();
  const canonicalId = normalizeCourseId(program);

  const ceeSubjectsList = [
    { name: 'Biology', icon: '🧬', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800' },
    { name: 'Chemistry', icon: '⚗️', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800' },
    { name: 'Physics', icon: '⚡', color: 'text-sky-600', bg: 'bg-sky-50 dark:bg-sky-950/30', border: 'border-sky-200 dark:border-sky-800' },
    { name: 'Mental Agility', icon: '🧠', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30', border: 'border-purple-200 dark:border-purple-800' },
  ];

  const seeSubjectsList = [
    { name: 'Compulsory Science', icon: '🔬', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800' },
    { name: 'Compulsory Mathematics', icon: '📐', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800' },
    { name: 'Optional Mathematics', icon: '✨', color: 'text-sky-600', bg: 'bg-sky-50 dark:bg-sky-950/30', border: 'border-sky-200 dark:border-sky-800' },
    { name: 'English', icon: '📖', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30', border: 'border-purple-200 dark:border-purple-800' },
    { name: 'Social Studies', icon: '🌍', color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/30', border: 'border-rose-200 dark:border-rose-800' },
  ];

  const availableSubjects = isSee || canonicalId === 'see_class_10' ? seeSubjectsList : ceeSubjectsList;

  // Auto-switch selected subject when program changes
  useEffect(() => {
    const isCurrentValid = availableSubjects.some((s) => s.name === selectedSubject);
    if (!isCurrentValid && availableSubjects.length > 0) {
      setSelectedSubject(availableSubjects[0].name);
    }
  }, [canonicalId, availableSubjects, selectedSubject]);

  // Real Database Bookmark Toggle
  const toggleBookmark = useCallback(async (questionId: string) => {
    if (!user?.id) {
      toast.error('Sign in to save bookmarks');
      return;
    }
    const willBookmark = !bookmarked.has(questionId);
    setBookmarked((prev) => {
      const n = new Set(prev);
      if (willBookmark) n.add(questionId);
      else n.delete(questionId);
      return n;
    });

    const supabase = createClient();
    if (willBookmark) {
      const { error } = await supabase
        .from('bookmarks')
        .insert({
          user_id: user.id,
          resource_type: 'question',
          resource_id: questionId,
        });
      if (error) {
        setBookmarked((prev) => {
          const n = new Set(prev);
          n.delete(questionId);
          return n;
        });
        toast.error('Could not save bookmark');
      } else {
        toast.success('Saved to bookmarks');
      }
    } else {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('resource_type', 'question')
        .eq('resource_id', questionId);
      if (error) {
        setBookmarked((prev) => {
          const n = new Set(prev);
          n.add(questionId);
          return n;
        });
        toast.error('Could not remove bookmark');
      } else {
        toast.success('Bookmark removed');
      }
    }
  }, [user?.id, bookmarked]);

  // Pre-fill bookmark state for questions in active session
  useEffect(() => {
    if (!user?.id || questions.length === 0) return;
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('bookmarks')
        .select('resource_id')
        .eq('user_id', user.id)
        .eq('resource_type', 'question')
        .in('resource_id', questions.map((q) => q.id));
      if (cancelled || !data) return;
      setBookmarked((prev) => {
        const n = new Set(prev);
        data.forEach((r: any) => n.add(r.resource_id));
        return n;
      });
    })();
    return () => { cancelled = true; };
  }, [user?.id, questions]);

  const searchParams = useSearchParams();
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [chapterFilterTitle, setChapterFilterTitle] = useState<string | null>(null);
  const [availableChapters, setAvailableChapters] = useState<ChapterOption[]>([]);
  const [loadingChapters, setLoadingChapters] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingChapters(true);
    fetchSubjectChapters(selectedSubject).then((chaps) => {
      if (!cancelled) {
        setAvailableChapters(chaps);
        setLoadingChapters(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [selectedSubject]);

  const handleStartSession = useCallback((overrideCount?: number, overrideDiff?: string, overrideSubj?: string) => {
    const count = overrideCount ?? questionCount;
    const diff = overrideDiff ?? selectedDifficulty;
    const subj = overrideSubj ?? selectedSubject;

    setFetchError(null);
    setCertifiedMetrics(null);
    setEvaluatedDetails([]);
    setMode('loading');

    startTransition(async () => {
      // Live AI mode
      if (liveMode) {
        try {
          const res = await fetch('/api/practice/live', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subject: subj,
              difficulty: diff === 'All' ? undefined : diff.toLowerCase(),
              count,
            }),
          });
          const data = await res.json();
          if (!res.ok || !data.questions?.length) {
            setFetchError(data.error ?? 'Could not generate live questions. Please try again.');
            setMode('setup');
            return;
          }
          const mapped: MCQ[] = data.questions.map((q: any) => ({
            id: q.id,
            question: q.question,
            options: q.options,
            correctId: q.correctId,
            explanation: q.explanation ?? '',
            subject: subj,
            chapter: 'Live AI',
            difficulty: (q.difficulty ? q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1) : 'Medium') as 'Easy' | 'Medium' | 'Hard',
            marks: 1,
            negativeMarks: isSee ? 0 : 0.25,
            subjectId: null,
          }));
          setQuestions(mapped);
          setCurrentIdx(0);
          setSelectedAnswers({});
          setShowExplanation(false);
          setMode('active');
        } catch {
          setFetchError('Live practice generation failed. Please try again.');
          setMode('setup');
        }
        return;
      }

      // Check quota for free accounts
      try {
        const quotaRes = await fetch('/api/practice/quota');
        if (quotaRes.ok) {
          const q = await quotaRes.json();
          if (q.limited) {
            setFetchError(
              `You've used all ${q.limit} free practice MCQs this month. Upgrade to Pro for unlimited practice.`
            );
            setMode('setup');
            return;
          }
        }
      } catch {
        // fail open
      }

      const result = await fetchPracticeQuestions(subj, diff, count, selectedChapterId);
      if (result.error || result.questions.length === 0) {
        const scope = chapterFilterTitle ? `${chapterFilterTitle} (${subj})` : `${subj} (${diff})`;
        setFetchError(result.error ?? `No questions found for ${scope}. Try a different filter.`);
        setMode('setup');
        return;
      }
      setQuestions(result.questions.map((q) => mapRowToMCQ(q, isSee)));
      setCurrentIdx(0);
      setSelectedAnswers({});
      setShowExplanation(false);
      setMode('active');
    });
  }, [liveMode, questionCount, selectedDifficulty, selectedSubject, selectedChapterId, chapterFilterTitle, isSee]);

  useEffect(() => {
    const countParam = searchParams.get('count');
    const subjParam = searchParams.get('subject');
    const chapterParam = searchParams.get('chapter');
    const autostart = searchParams.get('autostart') === 'true' || searchParams.get('start') === 'true';

    let initialCount = 10;
    if (countParam) {
      const parsed = parseInt(countParam, 10);
      if (!isNaN(parsed) && parsed > 0) {
        initialCount = parsed;
        setQuestionCount(parsed);
      }
    }
    if (subjParam) setSelectedSubject(subjParam);
    if (chapterParam) setSelectedChapterId(chapterParam);

    if (autostart) {
      handleStartSession(initialCount, 'All', subjParam || undefined);
    }
  }, []);

  useEffect(() => {
    if (!selectedChapterId) {
      setChapterFilterTitle(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.from('chapters').select('title').eq('id', selectedChapterId).maybeSingle();
      if (!cancelled) setChapterFilterTitle(data?.title ?? null);
    })();
    return () => { cancelled = true; };
  }, [selectedChapterId]);

  // AI Hint state
  const [hintVisible, setHintVisible] = useState<Record<string, boolean>>({});
  const [hints, setHints] = useState<Record<string, string>>({});
  const { response: hintResponse, isLoading: hintLoading, error: hintError, sendMessage: sendHintMessage } = useChat('OPEN_AI', 'gpt-4o-mini', false);
  const [hintRequestedFor, setHintRequestedFor] = useState<string | null>(null);

  useEffect(() => {
    if (hintError) toast.error(hintError.message);
  }, [hintError]);

  useEffect(() => {
    if (hintResponse && hintRequestedFor && !hintLoading) {
      setHints((prev) => ({ ...prev, [hintRequestedFor]: hintResponse }));
      setHintVisible((prev) => ({ ...prev, [hintRequestedFor]: true }));
    }
  }, [hintResponse, hintLoading, hintRequestedFor]);

  const handleGetHint = useCallback((question: MCQ) => {
    if (hints[question.id]) {
      setHintVisible((prev) => ({ ...prev, [question.id]: !prev[question.id] }));
      return;
    }
    setHintRequestedFor(question.id);
    const optionsList = question.options.map((o) => `${o.id.toUpperCase()}) ${o.text}`).join('\n');
    sendHintMessage([
      {
        role: 'system',
        content: `You are an expert tutor for Nepal's ${isSee ? 'SEE Class 10' : 'CEE Medical'} exams. Give a SHORT conceptual hint (2-3 sentences max) to help the student recall the key principle without revealing or giving away the correct answer option.`,
      },
      {
        role: 'user',
        content: `Question: ${question.question}\n\nOptions:\n${optionsList}\n\nSubject: ${question.subject}${question.chapter ? ` | Chapter: ${question.chapter}` : ''}\n\nGive a conceptual hint to solve this.`,
      },
    ], { max_completion_tokens: 150 });
  }, [hints, sendHintMessage, isSee]);

  // AI Copilot Mistake Diagnostic & SM-2 Flashcard states
  const [diagnosticOpen, setDiagnosticOpen] = useState<Record<string, boolean>>({});
  const [diagnostics, setDiagnostics] = useState<Record<string, string>>({});
  const [diagnosticLoading, setDiagnosticLoading] = useState<Record<string, boolean>>({});
  const [flashcardSaved, setFlashcardSaved] = useState<Record<string, boolean>>({});
  const [savingFlashcard, setSavingFlashcard] = useState<Record<string, boolean>>({});

  const handleDiagnoseWithCopilot = useCallback(async (q: MCQ, chosenAns?: string, correctAns?: string) => {
    if (diagnostics[q.id]) {
      setDiagnosticOpen((prev) => ({ ...prev, [q.id]: !prev[q.id] }));
      return;
    }
    setDiagnosticLoading((prev) => ({ ...prev, [q.id]: true }));
    setDiagnosticOpen((prev) => ({ ...prev, [q.id]: true }));
    try {
      const res = await fetch('/api/ai/chat-completion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are the Samyak CEE AI Medical Entrance Copilot. Diagnose the student's mistake concisely in high-yield bullet points:
1. ⚠️ The Conceptual Pitfall: Why the chosen distractor was tempting.
2. 💡 The Core Principle: The key formula, rule, or biological mechanism needed.
3. 🎯 High-Yield Exam Takeaway: A mnemonic or 1-line rule for future CEE entrance tests.`
            },
            {
              role: 'user',
              content: `Subject: ${q.subject || 'CEE'} | Chapter: ${q.chapter || 'General'}
Question: ${q.question}
Student's Choice: ${chosenAns || 'Unattempted'}
Correct Answer: ${correctAns || q.correctId}
Official Explanation: ${q.explanation || 'None provided'}`
            }
          ],
          temperature: 0.5,
          max_tokens: 350
        })
      });
      const data = await res.json();
      if (res.ok) {
        const reply = data.choices?.[0]?.message?.content || data.reply || 'No diagnosis generated.';
        setDiagnostics((prev) => ({ ...prev, [q.id]: reply }));
      } else {
        toast.error(data.details || 'Could not fetch AI diagnosis');
        setDiagnosticOpen((prev) => ({ ...prev, [q.id]: false }));
      }
    } catch {
      toast.error('AI Copilot diagnosis failed');
      setDiagnosticOpen((prev) => ({ ...prev, [q.id]: false }));
    } finally {
      setDiagnosticLoading((prev) => ({ ...prev, [q.id]: false }));
    }
  }, [diagnostics]);

  const handleConvertToFlashcard = useCallback(async (q: MCQ, correctAns: string) => {
    if (flashcardSaved[q.id]) return;
    setSavingFlashcard((prev) => ({ ...prev, [q.id]: true }));
    try {
      const res = await fetch('/api/flashcards/convert-mistake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          front: q.question,
          back: `**Correct Answer: ${correctAns}**\n\n${q.explanation || ''}`,
          hint: q.chapter ? `Topic: ${q.chapter}` : undefined,
          subjectId: q.subjectId,
          topic: q.chapter || q.subject,
        })
      });
      const data = await res.json();
      if (res.ok) {
        setFlashcardSaved((prev) => ({ ...prev, [q.id]: true }));
        toast.success(data.message || 'Added to your SM-2 flashcard queue!');
      } else {
        toast.error(data.details || 'Could not add to flashcards');
      }
    } catch {
      toast.error('Failed to create flashcard');
    } finally {
      setSavingFlashcard((prev) => ({ ...prev, [q.id]: false }));
    }
  }, [flashcardSaved]);

  const current = questions[currentIdx];
  const selectedAnswer = current ? selectedAnswers[current.id] : undefined;
  const isAnswered = !!selectedAnswer;

  // Timer
  useEffect(() => {
    if (mode === 'active') {
      const t = questions.length * 60;
      setTimeLeft(t);
      setTotalTime(t);
      setSessionStartTime(Date.now());
    }
  }, [mode, questions.length]);

  useEffect(() => {
    if (mode !== 'active') return;
    if (timeLeft <= 0) {
      handleFinishSession();
      return;
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [mode, timeLeft]);

  const handleAnswer = useCallback((optionId: string) => {
    if (isAnswered || !current) return;
    setSelectedAnswers((prev) => ({ ...prev, [current.id]: optionId }));
    setShowExplanation(false);
  }, [isAnswered, current]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // Server-Side Evaluation Finish
  const handleFinishSession = async () => {
    setMode('review');
    setEvaluating(true);
    const timeTaken = sessionStartTime > 0 ? Math.round((Date.now() - sessionStartTime) / 1000) : (questions.length * 60 - timeLeft);

    try {
      const answersPayload = questions.map((q) => ({
        questionId: q.id,
        selectedOption: selectedAnswers[q.id] || null,
        timeSpentSeconds: Math.max(1, Math.round(timeTaken / (questions.length || 1))),
      }));

      const res = await fetch('/api/practice/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseSlug: canonicalId,
          subjectId: current?.subjectId || null,
          chapterId: selectedChapterId || null,
          totalSessionTimeSec: timeTaken,
          answers: answersPayload,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCertifiedMetrics(data.metrics);
        setEvaluatedDetails(data.questionResults);
      } else {
        throw new Error(data.error || 'Server evaluation failed');
      }
    } catch (err: any) {
      console.warn('Server evaluation failed, falling back to local calculation:', err.message);
      // Fallback local metrics
      let corr = 0;
      let incorr = 0;
      const details: EvaluatedDetail[] = questions.map((q) => {
        const ans = selectedAnswers[q.id];
        const isCorr = ans === q.correctId;
        if (ans) {
          if (isCorr) corr++;
          else incorr++;
        }
        return {
          questionId: q.id,
          selectedOption: ans || null,
          correctOption: q.correctId,
          isCorrect: isCorr,
          marksAwarded: !ans ? 0 : isCorr ? q.marks : -q.negativeMarks,
          explanation: q.explanation,
          difficulty: q.difficulty.toLowerCase(),
        };
      });

      const totalMarks = questions.reduce((acc, q) => acc + q.marks, 0);
      const totalScore = corr * 1.0 - (isSee ? 0 : incorr * 0.25);
      const unatt = questions.length - corr - incorr;

      setCertifiedMetrics({
        totalQuestions: questions.length,
        attempted: corr + incorr,
        correctCount: corr,
        incorrectCount: incorr,
        unattemptedCount: unatt,
        totalMarksPossible: totalMarks,
        totalScore: Math.round(totalScore * 100) / 100,
        percentage: totalMarks > 0 ? Math.round((Math.max(0, totalScore) / totalMarks) * 100) : 0,
        accuracyPercentage: (corr + incorr) > 0 ? Math.round((corr / (corr + incorr)) * 100) : 0,
        paceMinutesPerQuestion: Math.round((timeTaken / 60 / (questions.length || 1)) * 10) / 10,
        paceStatus: 'on_target',
      });
      setEvaluatedDetails(details);
    } finally {
      setEvaluating(false);
    }
  };

  // 1-Click Retry Incorrect Questions
  const handleRetryMistakes = () => {
    if (!evaluatedDetails.length) return;
    const mistakeQuestionIds = new Set(
      evaluatedDetails.filter((d) => !d.isCorrect && d.selectedOption !== null).map((d) => d.questionId)
    );

    const mistakeQuestions = questions.filter((q) => mistakeQuestionIds.has(q.id));
    if (mistakeQuestions.length === 0) {
      toast.success('No mistakes to retry! Excellent job!');
      return;
    }

    setQuestions(mistakeQuestions);
    setCurrentIdx(0);
    setSelectedAnswers({});
    setShowExplanation(false);
    setCertifiedMetrics(null);
    setEvaluatedDetails([]);
    setMode('active');
    toast.success(`Started revision session with ${mistakeQuestions.length} mistake questions.`);
  };

  // Handle Question Flag Submit
  const handleReportQuestion = async () => {
    if (!current) return;
    setSubmittingFlag(true);
    try {
      const supabase = createClient();
      await supabase.from('feedback').insert({
        user_id: user?.id || null,
        type: 'question_flag',
        subject: `Question Flag: ${flagReason}`,
        message: `Question ID: ${current.id}\nReason: ${flagReason}\nDetails: ${flagDetails}\nQuestion Text: ${current.question}`,
      });
    } catch {
      // non-blocking
    } finally {
      setSubmittingFlag(false);
      setFlagModalOpen(false);
      setFlagDetails('');
      toast.success('Thank you! Our academic team will review this question.');
    }
  };

  // ─── Setup Screen ───────────────────────────────────────────────────────────
  if (mode === 'setup' || mode === 'loading') {
    return (
      <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {programDetails.badge}
                </span>
                <span className="text-xs text-muted-foreground font-medium">Practice &amp; Drill Engine</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-2">
                <Zap size={26} className="text-primary fill-primary/20" /> {programDetails.shortName} Practice Engine
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Authentic syllabus questions with server-validated negative marking (-0.25) and step-by-step solutions.
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <ProgramSwitcher size="sm" />
            </div>
          </div>

          {/* Quick Start Buttons */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles size={14} className="text-primary" /> 1-Click Quick Practice
              </p>
              <button
                onClick={() => setCustomPracticeOpen(true)}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                <SlidersHorizontal size={13} /> Custom Practice Builder
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: '10 High-Yield MCQs', desc: '~7 min quick drill', count: 10, tag: 'Warm-up' },
                { label: '25 Standard MCQs', desc: '~18 min timed practice', count: 25, tag: 'Most Popular' },
                { label: '50 Mock Exam Drill', desc: '~35 min deep assessment', count: 50, tag: 'High Rigor' },
              ].map((q) => (
                <button
                  key={q.label}
                  disabled={mode === 'loading'}
                  onClick={() => {
                    setQuestionCount(q.count);
                    handleStartSession(q.count, 'All', selectedSubject);
                  }}
                  className="flex flex-col text-left p-4 rounded-2xl bg-card border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group disabled:opacity-60 cursor-pointer shadow-xs relative overflow-hidden"
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      {q.tag}
                    </span>
                    <Zap size={16} className="text-primary group-hover:scale-125 transition-transform" />
                  </div>
                  <span className="text-base font-black text-foreground">{q.label}</span>
                  <span className="text-xs text-muted-foreground mt-0.5">{q.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {fetchError && (
            <div className="mb-6 flex items-start gap-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4">
              <AlertCircle size={18} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="text-sm text-rose-600 dark:text-rose-400">
                <p className="font-bold">Practice Setup Alert</p>
                <p>{fetchError}</p>
              </div>
            </div>
          )}

          {/* Subject Cards & Chapter Configuration */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-bold text-foreground">Select Subject ({availableSubjects.length})</label>
                <span className="text-xs text-muted-foreground font-semibold">{programDetails.name}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {availableSubjects.map((s) => (
                  <button
                    key={s.name}
                    onClick={() => { setSelectedSubject(s.name); setSelectedChapterId(null); }}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all cursor-pointer ${
                      selectedSubject === s.name
                        ? `${s.bg} ${s.color} ${s.border} ring-2 ring-primary/40 font-black shadow-xs`
                        : 'bg-muted/20 border-border text-muted-foreground hover:border-border hover:text-foreground'
                    }`}
                  >
                    <span className="text-2xl">{s.icon}</span>
                    <span className="text-xs font-bold text-center leading-snug">{s.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Chapter Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-foreground">Chapter Drill (Optional)</label>
                {selectedChapterId && (
                  <button
                    type="button"
                    onClick={() => { setSelectedChapterId(null); setChapterFilterTitle(null); }}
                    className="text-xs text-primary font-bold hover:underline"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
              <select
                value={selectedChapterId ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) {
                    setSelectedChapterId(null);
                    setChapterFilterTitle(null);
                  } else {
                    setSelectedChapterId(val);
                    const chap = availableChapters.find((c) => c.id === val);
                    setChapterFilterTitle(chap?.title ?? null);
                  }
                }}
                disabled={loadingChapters}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-medium cursor-pointer"
              >
                <option value="">
                  {loadingChapters ? 'Loading syllabus chapters...' : `All Chapters in ${selectedSubject} (Full Coverage)`}
                </option>
                {availableChapters.map((chap) => (
                  <option key={chap.id} value={chap.id}>
                    {chap.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Practice Configuration Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
              <div>
                <label className="block text-xs font-black text-foreground mb-2 uppercase tracking-wider">
                  Difficulty Level
                </label>
                <div className="flex gap-2">
                  {['All', 'Easy', 'Medium', 'Hard'].map((d) => (
                    <button
                      key={d}
                      onClick={() => setSelectedDifficulty(d)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        selectedDifficulty === d
                          ? 'bg-primary text-white border-primary shadow-xs'
                          : 'bg-card border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-foreground mb-2 uppercase tracking-wider">
                  Question Count
                </label>
                <div className="flex gap-2">
                  {[10, 20, 30, 50].map((n) => (
                    <button
                      key={n}
                      onClick={() => setQuestionCount(n)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        questionCount === n
                          ? 'bg-primary text-white border-primary shadow-xs'
                          : 'bg-card border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {n} Qs
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Negative Marking & Feature Notice */}
            <div className="p-4 rounded-xl bg-muted/30 border border-border flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Target size={16} className="text-primary shrink-0" />
                <span className="text-muted-foreground">
                  {isSee ? (
                    <span><strong>SEE Class 10 Mode:</strong> Standard marking scheme with CDC step rubrics.</span>
                  ) : (
                    <span><strong>CEE Medical Rules:</strong> +1.0 per correct answer, <strong>-0.25 penalty</strong> per wrong answer.</span>
                  )}
                </span>
              </div>
              <span className="font-bold text-foreground shrink-0">Server Verified</span>
            </div>

            {/* Launch Practice Button */}
            <button
              onClick={() => handleStartSession()}
              disabled={mode === 'loading'}
              className="btn-primary w-full py-4 text-base font-black gap-2 disabled:opacity-60 cursor-pointer shadow-md"
            >
              {mode === 'loading' ? (
                <><Loader2 size={18} className="animate-spin" /> Preparing Authenticated Question Set...</>
              ) : (
                <><Play size={18} fill="currentColor" /> Start Practice Drill ({questionCount} Questions)</>
              )}
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ─── Review Screen (Server Certified) ───────────────────────────────────────
  if (mode === 'review') {
    const metrics = certifiedMetrics || {
      totalQuestions: questions.length,
      attempted: Object.keys(selectedAnswers).length,
      correctCount: 0,
      incorrectCount: 0,
      unattemptedCount: questions.length,
      totalMarksPossible: questions.length,
      totalScore: 0,
      percentage: 0,
      accuracyPercentage: 0,
      paceMinutesPerQuestion: 0,
      paceStatus: 'on_target' as const,
    };

    return (
      <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          {/* Header Card */}
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 text-center mb-6 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Award size={32} className="text-primary" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground">Practice Session Evaluated</h2>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1">
              Verified by server grading engine with authoritative exam scoring.
            </p>

            {evaluating ? (
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 size={14} className="animate-spin" /> Verifying score with server key...
              </div>
            ) : (
              <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                <CheckCircle2 size={13} /> Official Server-Scored Result
              </div>
            )}

            {/* Certified Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              <div className="bg-muted/40 rounded-2xl p-4 border border-border/50">
                <p className="text-2xl font-black text-primary">{metrics.totalScore} / {metrics.totalMarksPossible}</p>
                <p className="text-xs text-muted-foreground mt-0.5 font-semibold">Net Score</p>
              </div>
              <div className="bg-emerald-500/5 rounded-2xl p-4 border border-emerald-500/20">
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{metrics.correctCount}</p>
                <p className="text-xs text-muted-foreground mt-0.5 font-semibold">Correct</p>
              </div>
              <div className="bg-rose-500/5 rounded-2xl p-4 border border-rose-500/20">
                <p className="text-2xl font-black text-rose-600 dark:text-rose-400">{metrics.incorrectCount}</p>
                <p className="text-xs text-muted-foreground mt-0.5 font-semibold">
                  Incorrect {!isSee && '(-0.25 ea)'}
                </p>
              </div>
              <div className="bg-purple-500/5 rounded-2xl p-4 border border-purple-500/20">
                <p className="text-2xl font-black text-purple-600 dark:text-purple-400">{metrics.accuracyPercentage}%</p>
                <p className="text-xs text-muted-foreground mt-0.5 font-semibold">Accuracy</p>
              </div>
            </div>

            {/* Pacing Info */}
            <div className="mt-4 p-3 rounded-xl bg-muted/20 border border-border flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Clock size={14} /> Pacing: <strong>{metrics.paceMinutesPerQuestion} min / question</strong>
              </span>
              <span className={`font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-full ${
                metrics.paceStatus === 'on_target' ? 'bg-emerald-500/10 text-emerald-600' :
                metrics.paceStatus === 'rushed' ? 'bg-amber-500/10 text-amber-600' : 'bg-rose-500/10 text-rose-600'
              }`}>
                {metrics.paceStatus === 'on_target' ? 'On Target Pace' : metrics.paceStatus === 'rushed' ? 'Slightly Rushed' : 'Needs Speed Drill'}
              </span>
            </div>
          </div>

          {/* Action Buttons: Mistake Revision / New Session */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            {metrics.incorrectCount > 0 && (
              <button
                onClick={handleRetryMistakes}
                className="flex-1 btn-primary py-3.5 gap-2 bg-amber-600 hover:bg-amber-700 border-amber-600 text-white font-bold"
              >
                <RotateCcw size={16} /> Retry {metrics.incorrectCount} Incorrect Questions
              </button>
            )}
            <button
              onClick={() => { setMode('setup'); setSelectedAnswers({}); setCurrentIdx(0); }}
              className="flex-1 btn-secondary py-3.5 gap-2 font-bold"
            >
              <Zap size={16} /> New Practice Session
            </button>
            <button
              onClick={() => router.push('/mistake-analyser')}
              className="sm:w-auto px-4 btn-secondary py-3.5 gap-2 text-xs font-bold text-muted-foreground hover:text-foreground"
              title="Open AI Mistake Analyser"
            >
              <Brain size={16} className="text-purple-600" /> Mistake Notebook
            </button>
          </div>

          {/* Detailed Question Review List */}
          <div className="space-y-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-muted-foreground mb-2">
              Question-by-Question Solution Breakdown
            </h3>
            {questions.map((q, idx) => {
              const detail = evaluatedDetails.find((d) => d.questionId === q.id);
              const ans = selectedAnswers[q.id];
              const isCorrect = detail ? detail.isCorrect : ans === q.correctId;
              const correctKey = detail ? detail.correctOption : q.correctId;

              return (
                <div
                  key={q.id}
                  className={`bg-card border rounded-2xl p-5 transition-all ${
                    isCorrect
                      ? 'border-emerald-500/30 bg-emerald-500/[0.02]'
                      : ans
                      ? 'border-rose-500/30 bg-rose-500/[0.02]'
                      : 'border-border'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                        isCorrect
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : ans
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {isCorrect ? <CheckCircle2 size={16} /> : ans ? <XCircle size={16} /> : idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-muted-foreground">Q{idx + 1}</span>
                        {q.chapter && <span className="text-[11px] text-muted-foreground font-medium">· {q.chapter}</span>}
                        <span className="ml-auto text-xs font-mono font-bold">
                          {isCorrect ? `+${q.marks}` : ans ? `-${q.negativeMarks}` : '0'} marks
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-foreground leading-relaxed mb-3">
                        <MathText text={q.question} />
                      </p>

                      <div className="space-y-1.5 mb-3 text-xs">
                        <p className="text-muted-foreground">
                          Correct Answer:{' '}
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {correctKey.toUpperCase()}) {q.options.find((o) => o.id.toLowerCase() === correctKey.toLowerCase())?.text || correctKey}
                          </span>
                        </p>
                        {ans && ans.toLowerCase() !== correctKey.toLowerCase() && (
                          <p className="text-muted-foreground">
                            Your Choice:{' '}
                            <span className="font-bold text-rose-600 dark:text-rose-400">
                              {ans.toUpperCase()}) {q.options.find((o) => o.id === ans)?.text || ans}
                            </span>
                          </p>
                        )}
                      </div>

                      {q.explanation && (
                        <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-xs text-foreground leading-relaxed">
                          <p className="font-bold text-muted-foreground mb-1 text-[11px] uppercase tracking-wider">Explanation</p>
                          <MathText text={q.explanation} />
                        </div>
                      )}

                      {/* AI Copilot & Flashcards Action Bar */}
                      <div className="mt-3 pt-3 border-t border-border/50 flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleDiagnoseWithCopilot(q, ans, correctKey)}
                          disabled={diagnosticLoading[q.id]}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all cursor-pointer"
                        >
                          {diagnosticLoading[q.id] ? (
                            <><Loader2 size={13} className="animate-spin" /> Diagnosing...</>
                          ) : (
                            <><Brain size={13} /> {diagnosticOpen[q.id] ? 'Hide AI Diagnosis' : 'Diagnose with Copilot'}</>
                          )}
                        </button>

                        <button
                          onClick={() => handleConvertToFlashcard(q, correctKey)}
                          disabled={savingFlashcard[q.id] || flashcardSaved[q.id]}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                            flashcardSaved[q.id]
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                              : 'bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border-border'
                          }`}
                        >
                          {savingFlashcard[q.id] ? (
                            <><Loader2 size={13} className="animate-spin" /> Saving Card...</>
                          ) : flashcardSaved[q.id] ? (
                            <><CheckCircle2 size={13} /> Flashcard Scheduled (SM-2)</>
                          ) : (
                            <><Layers size={13} /> Convert to Flashcard</>
                          )}
                        </button>

                        <button
                          onClick={() => router.push(`/ai-tutor?doubt=${encodeURIComponent(`I have a doubt on this CEE question:\n\nQ: ${q.question}\nCorrect Answer: ${correctKey}\nExplanation: ${q.explanation || ''}`)}`)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-primary transition-colors ml-auto cursor-pointer"
                        >
                          Open in AI Tutor <Sparkles size={12} />
                        </button>
                      </div>

                      {/* Inline AI Copilot Diagnostic Result */}
                      {diagnosticOpen[q.id] && diagnostics[q.id] && (
                        <div className="mt-3 p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 text-xs text-foreground space-y-2">
                          <div className="flex items-center gap-2 font-bold text-purple-600 dark:text-purple-400">
                            <Sparkles size={14} />
                            <span>Samyak CEE Copilot Diagnostic</span>
                          </div>
                          <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                            <MathText text={diagnostics[q.id]} />
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
      </DashboardLayout>
    );
  }

  // ─── Active Practice Mode ───────────────────────────────────────────────────
  if (!current) return null;

  const progressPct = ((currentIdx + 1) / questions.length) * 100;
  const timerPct = totalTime > 0 ? (timeLeft / totalTime) * 100 : 100;
  const timerColor = timerPct > 50 ? 'text-emerald-600 dark:text-emerald-400' : timerPct > 20 ? 'text-amber-600' : 'text-rose-600';

  return (
    <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* Top Header Status Bar */}
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-foreground">Q {currentIdx + 1} of {questions.length}</span>
            <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${difficultyColors[current.difficulty]}`}>
              {current.difficulty}
            </span>
            {current.subject && (
              <span className="text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">
                {current.subject}
              </span>
            )}
          </div>
          <div className={`flex items-center gap-1.5 font-mono font-black text-sm ${timerColor}`}>
            <Clock size={15} />
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-muted rounded-full mb-5 overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
        </div>

        {/* Question Card */}
        <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 mb-5 shadow-xs">
          <div className="flex items-start justify-between gap-3 mb-6">
            <div className="text-base sm:text-lg font-bold text-foreground leading-relaxed flex-1">
              <MathText text={current.question} />
            </div>
            <button
              onClick={() => toggleBookmark(current.id)}
              title={bookmarked.has(current.id) ? 'Remove bookmark' : 'Save to bookmarks'}
              className={`p-2.5 rounded-xl transition-all shrink-0 ${
                bookmarked.has(current.id)
                  ? 'text-primary bg-primary/10 border border-primary/20'
                  : 'text-muted-foreground hover:text-primary hover:bg-muted'
              }`}
            >
              {bookmarked.has(current.id) ? <BookmarkCheck size={18} /> : <BookmarkPlus size={18} />}
            </button>
          </div>

          {/* Option Choices */}
          <div className="space-y-3">
            {current.options.map((option) => {
              let optionClass = 'border-border bg-muted/20 text-foreground hover:border-primary/40 hover:bg-primary/5';
              if (isAnswered) {
                if (option.id === current.correctId) {
                  optionClass = 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
                } else if (option.id === selectedAnswer) {
                  optionClass = 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300';
                } else {
                  optionClass = 'border-border/50 bg-muted/10 text-muted-foreground opacity-60';
                }
              }

              return (
                <button
                  key={option.id}
                  onClick={() => handleAnswer(option.id)}
                  disabled={isAnswered}
                  className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl border text-left text-sm font-medium transition-all cursor-pointer ${optionClass}`}
                >
                  <span
                    className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center text-xs font-black shrink-0 ${
                      isAnswered && option.id === current.correctId
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : isAnswered && option.id === selectedAnswer
                        ? 'border-rose-600 bg-rose-600 text-white'
                        : 'border-muted-foreground/40 text-foreground'
                    }`}
                  >
                    {option.id.toUpperCase()}
                  </span>
                  <MathText text={option.text} className="flex-1" />
                  {isAnswered && option.id === current.correctId && (
                    <CheckCircle2 size={18} className="ml-auto text-emerald-600 shrink-0" />
                  )}
                  {isAnswered && option.id === selectedAnswer && option.id !== current.correctId && (
                    <XCircle size={18} className="ml-auto text-rose-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* AI Hint */}
          {!isAnswered && (
            <div className="mt-5 pt-4 border-t border-border">
              <button
                onClick={() => handleGetHint(current)}
                disabled={hintLoading && hintRequestedFor === current.id}
                className="flex items-center gap-2 text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors disabled:opacity-60 cursor-pointer"
              >
                {hintLoading && hintRequestedFor === current.id ? (
                  <><Loader2 size={14} className="animate-spin" /> Thinking conceptual hint...</>
                ) : hints[current.id] ? (
                  <><Lightbulb size={14} className="fill-amber-400 text-amber-500" /> {hintVisible[current.id] ? 'Hide Conceptual Hint' : 'Show Conceptual Hint'}</>
                ) : (
                  <><Lightbulb size={14} /> Get AI Conceptual Hint</>
                )}
              </button>

              {hintVisible[current.id] && hints[current.id] && (
                <div className="mt-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3">
                  <Lightbulb size={16} className="text-amber-500 shrink-0 mt-0.5 fill-amber-300" />
                  <div>
                    <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-1">Conceptual Hint</p>
                    <p className="text-xs text-foreground leading-relaxed">{hints[current.id]}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Instant feedback + Explanation toggle */}
          {isAnswered && (
            <div className="mt-5 pt-4 border-t border-border">
              <div
                className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl mb-3 ${
                  selectedAnswer === current.correctId
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400'
                }`}
              >
                {selectedAnswer === current.correctId ? (
                  <>
                    <CheckCircle2 size={18} className="shrink-0" />
                    <span className="text-xs font-bold">
                      Correct Answer! +{current.marks} mark awarded.
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle size={18} className="shrink-0" />
                    <span className="text-xs font-bold">
                      Incorrect! {!isSee && '-0.25 negative marking applied.'}
                    </span>
                  </>
                )}
              </div>

              <button
                onClick={() => setShowExplanation(!showExplanation)}
                className="text-xs text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                {showExplanation ? 'Hide Detailed Solution' : 'View Step-by-Step Solution'}
              </button>

              {showExplanation && current.explanation && (
                <div className="mt-3 p-4 bg-muted/40 border border-border rounded-2xl text-xs text-foreground leading-relaxed">
                  <p className="font-bold text-muted-foreground uppercase tracking-wider text-[10px] mb-1">
                    Verified Solution
                  </p>
                  <MathText text={current.explanation} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation Bar */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => { setCurrentIdx((i) => Math.max(0, i - 1)); setShowExplanation(false); }}
            disabled={currentIdx === 0}
            className="btn-secondary py-3 px-5 gap-2 disabled:opacity-40 font-bold text-xs"
          >
            <ChevronLeft size={16} /> Previous
          </button>

          <button
            onClick={() => setFlagModalOpen(true)}
            title="Report question problem"
            className="p-3 rounded-xl text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
          >
            <Flag size={16} />
          </button>

          {currentIdx < questions.length - 1 ? (
            <button
              onClick={() => { setCurrentIdx((i) => i + 1); setShowExplanation(false); }}
              className="btn-primary py-3 px-5 gap-2 font-bold text-xs"
            >
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleFinishSession}
              className="btn-primary py-3 px-6 gap-2 bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white font-black text-xs"
            >
              Finish &amp; Evaluate <CheckCircle2 size={16} />
            </button>
          )}
        </div>

        {/* Question Navigation Palette */}
        <div className="mt-6 bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3 text-xs text-muted-foreground font-semibold">
            <span>Question Palette ({questions.length} Items)</span>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Correct</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> Wrong</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-muted-foreground/40" /> Unanswered</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {questions.map((q, idx) => {
              const ans = selectedAnswers[q.id];
              const isCorr = ans === q.correctId;
              return (
                <button
                  key={q.id}
                  onClick={() => { setCurrentIdx(idx); setShowExplanation(false); }}
                  className={`w-9 h-9 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    idx === currentIdx ? 'ring-2 ring-primary ring-offset-2 scale-105' : ''
                  } ${
                    !ans
                      ? 'bg-muted/40 text-muted-foreground hover:bg-muted'
                      : isCorr
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Flag Question Modal */}
        {flagModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-card border border-border rounded-3xl p-6 max-w-md w-full shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Flag size={18} className="text-rose-600" /> Report Question Issue
                </h3>
                <button onClick={() => setFlagModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Issue Category</label>
                  <select
                    value={flagReason}
                    onChange={(e) => setFlagReason(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground"
                  >
                    <option value="Wrong answer key">Wrong answer key in options</option>
                    <option value="Typo or formatting error">Typo / equation rendering error</option>
                    <option value="Ambiguous question">Question is ambiguous or incomplete</option>
                    <option value="Out of syllabus">Out of current exam syllabus</option>
                    <option value="Other">Other problem</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Details (Optional)</label>
                  <textarea
                    rows={3}
                    value={flagDetails}
                    onChange={(e) => setFlagDetails(e.target.value)}
                    placeholder="Describe what is incorrect so our faculty can fix it..."
                    className="w-full bg-background border border-border rounded-xl p-3 text-xs text-foreground resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setFlagModalOpen(false)}
                    className="flex-1 btn-secondary py-2.5 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReportQuestion}
                    disabled={submittingFlag}
                    className="flex-1 btn-primary py-2.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 border-rose-600 text-white"
                  >
                    {submittingFlag ? <Loader2 size={14} className="animate-spin" /> : 'Submit Report'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
