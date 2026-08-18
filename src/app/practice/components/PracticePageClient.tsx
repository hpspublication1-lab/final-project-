'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { Zap, ChevronRight, ChevronLeft, BookmarkPlus, Flag, CheckCircle2, XCircle, Clock, BarChart2, Play, RotateCcw, Target, Brain, Loader2, AlertCircle, Lightbulb, X, Sparkles } from 'lucide-react';
import { fetchPracticeQuestions, savePracticeAttempt, type QuestionRow } from '../actions';
import { createClient } from '@/lib/supabase/client';
import { useChat } from '@/lib/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { useProgram, PROGRAMS } from '@/contexts/ProgramContext';
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

function mapRowToMCQ(row: QuestionRow): MCQ {
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
    negativeMarks: 0.25,
    subjectId: row.subjectId,
  };
}

type PracticeMode = 'setup' | 'loading' | 'active' | 'review';

const difficultyColors: Record<string, string> = {
  Easy: 'bg-success-light text-success',
  Medium: 'bg-warning-light text-warning',
  Hard: 'bg-error-light text-error',
};

export default function PracticePageClient() {
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
  const [liveMode, setLiveMode] = useState(false); // ⚡ generate fresh via OpenAI
  const [questions, setQuestions] = useState<MCQ[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isPending, startTransition] = useTransition();

  const { user } = useAuth();
  const { program, programDetails } = useProgram();

  const ceeSubjectsList = [
    { name: 'Biology', icon: '🧬', color: 'text-bio', bg: 'bg-bio-light', border: 'border-bio/30' },
    { name: 'Chemistry', icon: '⚗️', color: 'text-chem', bg: 'bg-chem-light', border: 'border-chem/30' },
    { name: 'Physics', icon: '⚡', color: 'text-physics', bg: 'bg-physics-light', border: 'border-physics/30' },
    { name: 'Mental Agility', icon: '🧠', color: 'text-ma', bg: 'bg-ma-light', border: 'border-ma/30' },
  ];

  const seeSubjectsList = [
    { name: 'Compulsory Science', icon: '🔬', color: 'text-bio', bg: 'bg-bio-light', border: 'border-bio/30' },
    { name: 'Compulsory Mathematics', icon: '📐', color: 'text-chem', bg: 'bg-chem-light', border: 'border-chem/30' },
    { name: 'Optional Mathematics', icon: '✨', color: 'text-physics', bg: 'bg-physics-light', border: 'border-physics/30' },
    { name: 'English', icon: '📖', color: 'text-ma', bg: 'bg-ma-light', border: 'border-ma/30' },
    { name: 'Social Studies', icon: '🌍', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30' },
  ];

  const availableSubjects = program === 'see' ? seeSubjectsList : ceeSubjectsList;

  // Auto-switch selected subject when program changes
  useEffect(() => {
    const isCurrentValid = availableSubjects.some((s) => s.name === selectedSubject);
    if (!isCurrentValid && availableSubjects.length > 0) {
      setSelectedSubject(availableSubjects[0].name);
    }
  }, [program, availableSubjects, selectedSubject]);


  // Persist a bookmark toggle to the DB (optimistic). Previously this button
  // only mutated local state, so nothing ever reached the bookmarks table.
  const toggleBookmark = useCallback(async (questionId: string) => {
    if (!user?.id) {
      toast.error('Sign in to save bookmarks');
      return;
    }
    const willBookmark = !bookmarked.has(questionId);
    setBookmarked((prev) => {
      const n = new Set(prev);
      willBookmark ? n.add(questionId) : n.delete(questionId);
      return n;
    });

    const supabase = createClient();
    if (willBookmark) {
      const { error } = await supabase
        .from('bookmarks')
        .upsert({ student_id: user.id, question_id: questionId }, { onConflict: 'student_id,question_id' });
      if (error) {
        setBookmarked((prev) => { const n = new Set(prev); n.delete(questionId); return n; });
        toast.error('Could not save bookmark');
      } else {
        toast.success('Saved to bookmarks');
      }
    } else {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('student_id', user.id)
        .eq('question_id', questionId);
      if (error) {
        setBookmarked((prev) => { const n = new Set(prev); n.add(questionId); return n; });
        toast.error('Could not remove bookmark');
      }
    }
  }, [user?.id, bookmarked]);

  // Pre-fill bookmark state for whatever questions are in the current session
  // so already-saved questions show as bookmarked.
  useEffect(() => {
    if (!user?.id || questions.length === 0) return;
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('bookmarks')
        .select('question_id')
        .eq('student_id', user.id)
        .in('question_id', questions.map((q) => q.id));
      if (cancelled || !data) return;
      setBookmarked((prev) => {
        const n = new Set(prev);
        data.forEach((r: any) => n.add(r.question_id));
        return n;
      });
    })();
    return () => { cancelled = true; };
  }, [user?.id, questions]);

  // Chapter-scoped practice, arrived at via ?subject=&chapter= from Subjects/
  // Chapter Detail pages (previously silently ignored — those links did nothing).
  const searchParams = useSearchParams();
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [chapterFilterTitle, setChapterFilterTitle] = useState<string | null>(null);

  useEffect(() => {
    const subjParam = searchParams.get('subject');
    const chapterParam = searchParams.get('chapter');
    if (subjParam) setSelectedSubject(subjParam);
    if (chapterParam) setSelectedChapterId(chapterParam);
    // Only read the URL once, on initial load of the setup screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        content: `You are a helpful tutor for Nepal's CEE (Common Entrance Examination) for medical students. Your job is to give a SHORT conceptual hint (2–3 sentences max) that helps the student think through the question without revealing or implying the correct answer. Do NOT mention which option is correct. Do NOT say "the answer is..." or "option X is...". Focus on the underlying concept or principle they should recall.`,
      },
      {
        role: 'user',
        content: `Question: ${question.question}\n\nOptions:\n${optionsList}\n\nSubject: ${question.subject}${question.chapter ? ` | Chapter: ${question.chapter}` : ''}\n\nGive me a conceptual hint to help me think through this question.`,
      },
    ], { max_completion_tokens: 150 });
  }, [hints, sendHintMessage]);

  const current = questions[currentIdx];
  const selectedAnswer = current ? selectedAnswers[current.id] : undefined;
  const isAnswered = !!selectedAnswer;

  // Timer
  useEffect(() => {
    if (mode === 'active') {
      const t = questionCount * 60;
      setTimeLeft(t);
      setTotalTime(t);
      setSessionStartTime(Date.now());
    }
  }, [mode, questionCount]);

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

  const getScore = () => {
    let score = 0;
    let correct = 0;
    let incorrect = 0;
    questions.forEach((q) => {
      const ans = selectedAnswers[q.id];
      if (!ans) return;
      if (ans === q.correctId) { score += q.marks; correct++; }
      else { score -= q.negativeMarks; incorrect++; }
    });
    return { score, correct, incorrect, unattempted: questions.length - correct - incorrect };
  };

  const handleStartSession = () => {
    setFetchError(null);
    setMode('loading');
    startTransition(async () => {
      // ⚡ Live AI mode: generate a fresh set via OpenAI (Pro feature), no bank.
      if (liveMode) {
        try {
          const res = await fetch('/api/practice/live', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subject: selectedSubject, difficulty: selectedDifficulty === 'All' ? undefined : selectedDifficulty.toLowerCase(), count: questionCount }),
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
            subject: selectedSubject,
            chapter: 'Live AI',
            difficulty: (q.difficulty ? q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1) : 'Medium') as 'Easy' | 'Medium' | 'Hard',
            marks: 1,
            negativeMarks: 0.25,
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

      // Free plan: 200 practice MCQs / month. Paid & prebook users are unlimited.
      try {
        const quotaRes = await fetch('/api/practice/quota');
        if (quotaRes.ok) {
          const q = await quotaRes.json();
          if (q.limited) {
            setFetchError(
              `You've used all ${q.limit} free practice MCQs this month. Upgrade to Pro or prebook the crash course for unlimited practice and every premium feature.`
            );
            setMode('setup');
            return;
          }
        }
      } catch {
        // fail open — never block practice on a quota hiccup
      }

      const result = await fetchPracticeQuestions(selectedSubject, selectedDifficulty, questionCount, selectedChapterId);
      if (result.error || result.questions.length === 0) {
        const scope = chapterFilterTitle ? `${chapterFilterTitle} (${selectedSubject})` : `${selectedSubject} (${selectedDifficulty})`;
        setFetchError(result.error ?? `No questions found for ${scope}. Please try a different filter.`);
        setMode('setup');
        return;
      }
      setQuestions(result.questions.map(mapRowToMCQ));
      setCurrentIdx(0);
      setSelectedAnswers({});
      setShowExplanation(false);
      setMode('active');
    });
  };

  const handleFinishSession = () => {
    setMode('review');
    const { score, correct, incorrect, unattempted } = getScore();
    const timeTaken = sessionStartTime > 0 ? Math.round((Date.now() - sessionStartTime) / 1000) : questionCount * 60;
    setSaveStatus('saving');
    startTransition(async () => {
      const result = await savePracticeAttempt({
        subjectName: selectedSubject,
        difficulty: selectedDifficulty,
        totalQuestions: questions.length,
        correctAnswers: correct,
        incorrectAnswers: incorrect,
        unattempted,
        score,
        totalMarks: questions.length,
        timeTakenSeconds: timeTaken,
        questionAttempts: questions.map((q) => ({
          questionId: q.id,
          selectedOption: selectedAnswers[q.id] ?? '',
          isCorrect: selectedAnswers[q.id] === q.correctId,
          subjectId: q.subjectId,
          difficulty: q.difficulty,
        })).filter((qa) => qa.selectedOption !== ''),
      });
      setSaveStatus(result.success ? 'saved' : 'error');
    });
  };

  // ─── Setup Screen ───────────────────────────────────────────────────────────
  if (mode === 'setup' || mode === 'loading') {
    return (
      <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${programDetails.badgeBg} ${programDetails.badgeText}`}>
                  {programDetails.badge}
                </span>
                <span className="text-xs text-muted-foreground">Practice Bank</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Zap size={24} className="text-primary" /> {programDetails.shortName} MCQ Practice
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Configure your practice session and start solving.</p>
            </div>
            <div className="shrink-0">
              <ProgramSwitcher size="sm" />
            </div>
          </div>

          {/* SEE Subjective Written Practice Banner */}
          <div className="mb-6 bg-gradient-to-r from-primary/10 via-card to-bio-light border border-primary/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-card px-2.5 py-0.5 rounded-full border border-primary/20">
                <Sparkles size={13} /> SEE Board Exam Written Evaluator
              </div>
              <h3 className="text-base font-extrabold text-foreground">
                Practice SEE Subjective Written Questions
              </h3>
              <p className="text-xs text-muted-foreground">
                Upload photos of your handwritten answers for instant AI examiner grading &amp; step marks breakdown.
              </p>
            </div>
            <a
              href="/practice/subjective"
              className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 shadow-sm hover:bg-primary/90 transition-all"
            >
              <span>Subjective Written Practice</span>
              <ChevronRight size={15} />
            </a>
          </div>

          {fetchError && (
            <div className="mb-4 flex items-start gap-3 bg-error-light border border-error/30 rounded-xl p-4">
              <AlertCircle size={18} className="text-error shrink-0 mt-0.5" />
              <p className="text-sm text-error">{fetchError}</p>
            </div>
          )}

          {chapterFilterTitle && (
            <div className="mb-4 flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl px-4 py-2.5 text-sm">
              <Target size={14} className="text-primary shrink-0" />
              <span className="text-foreground">Practicing <span className="font-semibold">{chapterFilterTitle}</span> only</span>
              <button
                onClick={() => setSelectedChapterId(null)}
                className="ml-auto text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
              >
                <X size={13} /> Clear
              </button>
            </div>
          )}

          <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
            {/* Subject */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-foreground">Select Subject ({availableSubjects.length})</label>
                <span className="text-xs text-muted-foreground font-mono">{programDetails.name}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {availableSubjects.map((s) => (
                  <button
                    key={s.name}
                    onClick={() => { setSelectedSubject(s.name); setSelectedChapterId(null); }}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border font-medium text-sm transition-all ${
                      selectedSubject === s.name
                        ? `${s.bg} ${s.color} ${s.border} shadow-xs font-bold`
                        : 'bg-muted/30 border-border text-muted-foreground hover:border-border hover:text-foreground'
                    }`}
                  >
                    <span className="text-xl">{s.icon}</span>
                    <span className="text-xs leading-tight text-center">{s.name}</span>
                  </button>
                ))}
              </div>
            </div>


            {/* Difficulty */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Difficulty</label>
              <div className="flex gap-2 flex-wrap">
                {['All', 'Easy', 'Medium', 'Hard'].map((d) => (
                  <button
                    key={d}
                    onClick={() => setSelectedDifficulty(d)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                      selectedDifficulty === d
                        ? 'bg-primary text-white border-primary' :'bg-card border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Question count */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Number of Questions</label>
              <div className="flex gap-2 flex-wrap">
                {[10, 25, 50, 100].map((n) => (
                  <button
                    key={n}
                    onClick={() => setQuestionCount(n)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                      questionCount === n
                        ? 'bg-primary text-white border-primary' :'bg-card border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {n} Qs
                  </button>
                ))}
              </div>
            </div>

            {/* Practice modes */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Practice Mode</label>
              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  { icon: Target, title: 'Topic Practice', desc: 'Focus on specific chapters', color: 'text-primary', active: true },
                  { icon: Brain, title: 'Adaptive', desc: 'AI selects based on weak areas', color: 'text-chem', badge: 'Pro', comingSoon: true },
                  { icon: Clock, title: 'Timed Sprint', desc: 'Race against the clock', color: 'text-physics', comingSoon: true },
                ].map((m) => (
                  <div key={m.title} className={`relative rounded-xl p-3 transition-colors ${m.active ? 'bg-primary/5 border-2 border-primary cursor-default' : 'bg-muted/30 border border-border cursor-not-allowed opacity-60'}`}>
                    <div className="absolute top-2 right-2 flex gap-1 items-center">
                      {m.comingSoon && (
                        <span className="text-[10px] bg-muted border border-border text-muted-foreground px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider">Coming Soon</span>
                      )}
                      {m.badge && (
                        <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold">{m.badge}</span>
                      )}
                    </div>
                    <m.icon size={18} className={`${m.color} mb-1.5`} />
                    <p className="text-sm font-semibold text-foreground">{m.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ⚡ Live AI practice toggle — generates fresh questions via OpenAI */}
            <button
              type="button"
              onClick={() => setLiveMode((v) => !v)}
              className={`w-full mb-3 flex items-center justify-between gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                liveMode ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${liveMode ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}>
                  <Sparkles size={17} />
                </span>
                <span>
                  <span className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    Live AI Practice
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-ma-light text-ma">PRO</span>
                  </span>
                  <span className="text-xs text-muted-foreground">Fresh questions generated by SamyakGURU for you — never repeated.</span>
                </span>
              </span>
              <span className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${liveMode ? 'bg-primary' : 'bg-muted'}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${liveMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </span>
            </button>

            <button
              onClick={handleStartSession}
              disabled={mode === 'loading'}
              className="btn-primary w-full py-3 text-base gap-2 disabled:opacity-60"
            >
              {mode === 'loading' ? (
                <><Loader2 size={18} className="animate-spin" /> {liveMode ? 'Generating with AI…' : 'Loading Questions...'}</>
              ) : liveMode ? (
                <><Sparkles size={18} /> Start Live AI Practice</>
              ) : (
                <><Play size={18} /> Start Practice Session</>
              )}
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ─── Review Screen ───────────────────────────────────────────────────────────
  if (mode === 'review') {
    const { score, correct, incorrect, unattempted } = getScore();
    const accuracy = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
    return (
      <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-card border border-border rounded-2xl p-6 text-center mb-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <BarChart2 size={36} className="text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Session Complete!</h2>
            <p className="text-muted-foreground text-sm mt-1">Here&apos;s how you performed</p>

            {/* Save status */}
            {saveStatus === 'saving' && (
              <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 size={12} className="animate-spin" /> Saving results...
              </div>
            )}
            {saveStatus === 'saved' && (
              <div className="mt-3 flex items-center justify-center gap-2 text-xs text-success">
                <CheckCircle2 size={12} /> Results saved to your profile
              </div>
            )}
            {saveStatus === 'error' && (
              <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <AlertCircle size={12} /> Could not save results (login required)
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              {[
                { label: 'Score', value: `${score}/${questions.length}`, color: 'text-primary' },
                { label: 'Correct', value: correct, color: 'text-success' },
                { label: 'Incorrect', value: incorrect, color: 'text-error' },
                { label: 'Accuracy', value: `${accuracy}%`, color: 'text-ma' },
              ].map((stat) => (
                <div key={stat.label} className="bg-muted/50 rounded-xl p-3">
                  <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 mb-6">
            {questions.map((q, idx) => {
              const ans = selectedAnswers[q.id];
              const isCorrect = ans === q.correctId;
              return (
                <div key={q.id} className={`bg-card border rounded-xl p-4 ${isCorrect ? 'border-success/30' : ans ? 'border-error/30' : 'border-border'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                      isCorrect ? 'bg-success-light text-success' : ans ? 'bg-error-light text-error' : 'bg-muted text-muted-foreground'
                    }`}>
                      {isCorrect ? <CheckCircle2 size={14} /> : ans ? <XCircle size={14} /> : idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground font-medium line-clamp-2">{q.question}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Correct: <span className="font-semibold text-success">{q.options.find(o => o.id === q.correctId)?.text}</span>
                        {ans && ans !== q.correctId && (
                          <> · Your answer: <span className="font-semibold text-error">{q.options.find(o => o.id === ans)?.text}</span></>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3">
            <button onClick={() => { setMode('setup'); setSelectedAnswers({}); setCurrentIdx(0); setSaveStatus('idle'); }} className="flex-1 btn-secondary py-2.5 gap-2">
              <RotateCcw size={16} /> New Session
            </button>
            <button onClick={() => { setCurrentIdx(0); setSelectedAnswers({}); setShowExplanation(false); setSaveStatus('idle'); setMode('active'); }} className="flex-1 btn-primary py-2.5 gap-2">
              <Play size={16} /> Retry
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ─── Active Mode ─────────────────────────────────────────────────────────────
  if (!current) return null;

  const progressPct = ((currentIdx + 1) / questions.length) * 100;
  const timerPct = totalTime > 0 ? (timeLeft / totalTime) * 100 : 100;
  const timerColor = timerPct > 50 ? 'text-success' : timerPct > 20 ? 'text-warning' : 'text-error';

  return (
    <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-foreground">Q {currentIdx + 1} / {questions.length}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficultyColors[current.difficulty]}`}>{current.difficulty}</span>
            {current.subject && <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{current.subject}</span>}
          </div>
          <div className={`flex items-center gap-1.5 font-mono font-bold text-sm ${timerColor}`}>
            <Clock size={14} />
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-muted rounded-full mb-5 overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
        </div>

        {/* Question card */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-4">
          <div className="flex items-start justify-between gap-3 mb-5">
            <p className="text-base font-semibold text-foreground leading-relaxed flex-1"><MathText text={current.question} /></p>
            <button
              onClick={() => toggleBookmark(current.id)}
              title={bookmarked.has(current.id) ? 'Remove bookmark' : 'Save to bookmarks'}
              className={`p-2 rounded-lg transition-colors shrink-0 ${bookmarked.has(current.id) ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-primary hover:bg-primary/10'}`}
            >
              <BookmarkPlus size={16} />
            </button>
          </div>

          <div className="space-y-2.5">
            {current.options.map((option) => {
              let optionClass = 'border-border bg-muted/30 text-foreground hover:border-primary/40 hover:bg-primary/5';
              if (isAnswered) {
                if (option.id === current.correctId) optionClass = 'border-success bg-success-light text-success';
                else if (option.id === selectedAnswer) optionClass = 'border-error bg-error-light text-error';
                else optionClass = 'border-border bg-muted/20 text-muted-foreground';
              }
              return (
                <button
                  key={option.id}
                  onClick={() => handleAnswer(option.id)}
                  disabled={isAnswered}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-sm font-medium transition-all duration-200 ${optionClass}`}
                >
                  <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 ${
                    isAnswered && option.id === current.correctId ? 'border-success bg-success text-white' :
                    isAnswered && option.id === selectedAnswer && option.id !== current.correctId ? 'border-error bg-error text-white' : 'border-current'
                  }`}>
                    {option.id.toUpperCase()}
                  </span>
                  <MathText text={option.text} className="flex-1" />
                  {isAnswered && option.id === current.correctId && <CheckCircle2 size={15} className="ml-auto text-success shrink-0" />}
                  {isAnswered && option.id === selectedAnswer && option.id !== current.correctId && <XCircle size={15} className="ml-auto text-error shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* AI Hint — only before answering */}
          {!isAnswered && (
            <div className="mt-4">
              <button
                onClick={() => handleGetHint(current)}
                disabled={hintLoading && hintRequestedFor === current.id}
                className="flex items-center gap-2 text-sm font-semibold text-amber-600 hover:text-amber-700 transition-colors disabled:opacity-60"
              >
                {hintLoading && hintRequestedFor === current.id ? (
                  <><Loader2 size={15} className="animate-spin" /> Generating hint...</>
                ) : hints[current.id] ? (
                  <><Lightbulb size={15} className="fill-amber-400 text-amber-500" /> {hintVisible[current.id] ? 'Hide Hint' : 'Show Hint'}</>
                ) : (
                  <><Lightbulb size={15} /> Get AI Hint</>
                )}
              </button>

              {hintVisible[current.id] && hints[current.id] && (
                <div className="mt-3 flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <Lightbulb size={16} className="text-amber-500 shrink-0 mt-0.5 fill-amber-200" />
                  <div>
                    <p className="text-xs font-semibold text-amber-700 mb-1">Conceptual Hint</p>
                    <p className="text-sm text-amber-900 leading-relaxed">{hints[current.id]}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Instant feedback + Explanation */}
          {isAnswered && (
            <div className="mt-4">
              {/* Instant feedback banner */}
              <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl mb-3 ${
                selectedAnswer === current.correctId
                  ? 'bg-success-light border border-success/30' :'bg-error-light border border-error/30'
              }`}>
                {selectedAnswer === current.correctId ? (
                  <><CheckCircle2 size={16} className="text-success shrink-0" /><span className="text-sm font-semibold text-success">Correct! +{current.marks} marks</span></>
                ) : (
                  <><XCircle size={16} className="text-error shrink-0" /><span className="text-sm font-semibold text-error">Incorrect — -{current.negativeMarks} mark</span></>
                )}
              </div>

              <button
                onClick={() => setShowExplanation(!showExplanation)}
                className="text-sm text-primary font-semibold hover:underline"
              >
                {showExplanation ? 'Hide' : 'Show'} Explanation
              </button>
              {showExplanation && current.explanation && (
                <div className="mt-3 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                  <p className="text-sm text-foreground leading-relaxed">{current.explanation}</p>
                  {(current.subject || current.chapter) && (
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                      {current.subject && <span>{current.subject}</span>}
                      {current.subject && current.chapter && <span>·</span>}
                      {current.chapter && <span>{current.chapter}</span>}
                      <span>·</span>
                      <span>+{current.marks} marks</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => { setCurrentIdx((i) => Math.max(0, i - 1)); setShowExplanation(false); }}
            disabled={currentIdx === 0}
            className="btn-secondary py-2.5 px-4 gap-2 disabled:opacity-40"
          >
            <ChevronLeft size={16} /> Previous
          </button>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => toast.success('Question reported! We will review it shortly.')}
              className="p-2 rounded-lg text-muted-foreground hover:text-error hover:bg-error-light transition-colors"
            >
              <Flag size={15} />
            </button>
          </div>
          {currentIdx < questions.length - 1 ? (
            <button
              onClick={() => { setCurrentIdx((i) => i + 1); setShowExplanation(false); }}
              className="btn-primary py-2.5 px-4 gap-2"
            >
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={handleFinishSession} className="btn-primary py-2.5 px-4 gap-2 bg-success border-success hover:bg-success/90">
              Finish <CheckCircle2 size={16} />
            </button>
          )}
        </div>

        {/* Question palette */}
        <div className="mt-5 bg-card border border-border rounded-2xl p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-3">Question Palette</p>
          <div className="flex flex-wrap gap-1.5">
            {questions.map((q, idx) => {
              const ans = selectedAnswers[q.id];
              const isCorrect = ans === q.correctId;
              return (
                <button
                  key={q.id}
                  onClick={() => { setCurrentIdx(idx); setShowExplanation(false); }}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                    idx === currentIdx ? 'ring-2 ring-primary ring-offset-1' : ''
                  } ${
                    !ans ? 'bg-muted text-muted-foreground' :
                    isCorrect ? 'bg-success-light text-success' : 'bg-error-light text-error'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
