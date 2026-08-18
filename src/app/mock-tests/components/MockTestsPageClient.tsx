'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { FileText, Clock, ChevronRight, ChevronLeft, Flag, AlertTriangle, Wifi, WifiOff, BookmarkPlus, Play, Shield, RotateCcw, Trophy, Loader2, CheckCircle, XCircle, MinusCircle, BookOpen, Grid } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProgram } from '@/contexts/ProgramContext';
import ProgramSwitcher from '@/components/ProgramSwitcher';
import { useAntiCheat } from '@/lib/hooks/useAntiCheat';

import toast from 'react-hot-toast';
import { toast as sonnerToast } from 'sonner';
import { MathText } from '@/components/MathText';

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
  type: string;
  difficulty: string;
  attempts: number;
  avgScore: number;
  isPremium: boolean;
}

interface SubjectBreakdown {
  subject: string;
  correct: number;
  incorrect: number;
  unattempted: number;
  accuracy: number;
}

type ExamMode = 'list' | 'confirm' | 'active' | 'result';

const OPTION_LABELS: Record<string, string> = { a: 'A', b: 'B', c: 'C', d: 'D' };

/** Normalise a DB correct answer (letter "B", index "1", or option text) to the
 *  lowercase option id the exam UI uses: 'a' | 'b' | 'c' | 'd'. */
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
  const [isDark, setIsDark] = useState(false);
  const [examMode, setExamMode] = useState<ExamMode>('list');
  const [exams, setExams] = useState<MockExam[]>([]);
  const [examsLoading, setExamsLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState<MockExam | null>(null);
  const [questions, setQuestions] = useState<ExamMCQ[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [subjectBreakdown, setSubjectBreakdown] = useState<SubjectBreakdown[]>([]);
  const [showExplanations, setShowExplanations] = useState(false);
  const [showMobilePalette, setShowMobilePalette] = useState(false);

  const current = questions[currentIdx];

  // Fetch exams from Supabase
  useEffect(() => {
    const fetchExams = async () => {
      setExamsLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('exams')
          .select('id, title, description, duration_minutes, total_marks, subject_id, program_type')
          .eq('is_published', true)
          .order('created_at', { ascending: false });

        if (error || !data) {
          setExams([]);
          return;
        }

        // Filter by program
        const isSeeExam = (e: any) => {
          const title = (e.title || '').toLowerCase();
          return e.program_type === 'see' || title.includes('see');
        };

        const filteredData = data.filter((e: any) => {
          if (program === 'see') return isSeeExam(e);
          return !isSeeExam(e); // CEE
        });


        // Get attempt counts
        const examIds = data.map((e: any) => e.id);
        const { data: attemptCounts } = await supabase
          .from('exam_attempts')
          .select('exam_id')
          .in('exam_id', examIds);

        const countMap: Record<string, number> = {};
        (attemptCounts || []).forEach((a: any) => {
          countMap[a.exam_id] = (countMap[a.exam_id] || 0) + 1;
        });

        // Get question counts per exam
        const { data: qCounts } = await supabase
          .from('exam_questions')
          .select('exam_id')
          .in('exam_id', examIds);

        const qCountMap: Record<string, number> = {};
        (qCounts || []).forEach((q: any) => {
          qCountMap[q.exam_id] = (qCountMap[q.exam_id] || 0) + 1;
        });

        const mapped: MockExam[] = filteredData.map((e: any) => ({
          id: e.id,
          title: e.title,
          description: e.description,
          totalQuestions: qCountMap[e.id] || 0,
          totalMarks: e.total_marks,
          duration: e.duration_minutes,
          negativeMarking: e.negative_marking ?? (program === 'cee'),
          type: program === 'see' ? 'SEE Model Test' : 'Full CEE Mock',
          difficulty: 'Medium',
          attempts: countMap[e.id] || 0,
          avgScore: 0,
          isPremium: e.is_premium ?? true,
        }));

        if (mapped.length > 0) {
          setExams(mapped);
        } else {
          const CEE_PRELOADED: MockExam[] = [
            { id: 'cee-full-1', title: 'Full CEE Grand Mock Test #1 (200 MCQs)', description: 'Complete 200-question MEC pattern mock test covering Physics (50), Chemistry (50), Botany (40), Zoology (40), and MAT (20).', totalQuestions: 200, totalMarks: 200, duration: 180, negativeMarking: true, type: 'Full CEE Mock', difficulty: 'Hard', attempts: 1840, avgScore: 138, isPremium: false },
            { id: 'cee-full-2', title: 'Full CEE Grand Mock Test #2 (200 MCQs)', description: 'Comprehensive CEE medical entrance exam simulation with +1 / -0.25 marking.', totalQuestions: 200, totalMarks: 200, duration: 180, negativeMarking: true, type: 'Full CEE Mock', difficulty: 'Hard', attempts: 1420, avgScore: 142, isPremium: false },
            { id: 'cee-phys-1', title: 'Physics High-Yield CEE Practice Pack', description: 'Mechanics, Electromagnetism, Modern Physics & Optics practice set.', totalQuestions: 50, totalMarks: 50, duration: 45, negativeMarking: true, type: 'Subject Special', difficulty: 'Medium', attempts: 2190, avgScore: 36, isPremium: false },
            { id: 'cee-chem-1', title: 'Chemistry Organic & Physical Sprint', description: 'Reaction mechanisms, stoichiometry, equilibrium & coordination compounds.', totalQuestions: 50, totalMarks: 50, duration: 45, negativeMarking: true, type: 'Subject Special', difficulty: 'Medium', attempts: 1980, avgScore: 38, isPremium: false },
            { id: 'cee-bio-1', title: 'Biology Botany & Zoology Master Set', description: 'Human Physiology, Genetics, Ecology, Cell Biology & Plant Physiology.', totalQuestions: 80, totalMarks: 80, duration: 75, negativeMarking: true, type: 'Subject Special', difficulty: 'Medium', attempts: 3120, avgScore: 62, isPremium: false },
            { id: 'cee-mat-1', title: 'Mental Agility (MAT) Speed Test', description: 'Logical reasoning, numerical sequences, spatial reasoning & verbal agility.', totalQuestions: 20, totalMarks: 20, duration: 20, negativeMarking: true, type: 'MAT Special', difficulty: 'Medium', attempts: 4100, avgScore: 16, isPremium: false },
          ];

          const SEE_PRELOADED: MockExam[] = [
            { id: 'see-sci-1', title: 'SEE Class 10 Compulsory Science Model Exam', description: 'Full Class 10 NEB Board Science examination covering Physics, Chemistry, Biology & Astronomy.', totalQuestions: 75, totalMarks: 75, duration: 135, negativeMarking: false, type: 'SEE Board Mock', difficulty: 'Medium', attempts: 1540, avgScore: 58, isPremium: false },
            { id: 'see-math-1', title: 'SEE Class 10 Compulsory Mathematics Model Test', description: 'Comprehensive NEB Math board paper covering Sets, Arithmetic, Algebra, Geometry & Stats.', totalQuestions: 75, totalMarks: 75, duration: 135, negativeMarking: false, type: 'SEE Board Mock', difficulty: 'Hard', attempts: 1890, avgScore: 54, isPremium: false },
            { id: 'see-optmath-1', title: 'SEE Class 10 Optional Mathematics Master Test', description: 'Complete Opt. Math board mock covering Functions, Trigonometry, Coordinate Geometry & Vectors.', totalQuestions: 75, totalMarks: 75, duration: 135, negativeMarking: false, type: 'SEE Board Mock', difficulty: 'Hard', attempts: 1210, avgScore: 52, isPremium: false },
            { id: 'see-eng-1', title: 'SEE Class 10 English Board Practice Set', description: 'Reading comprehension, grammar transformation, letter & essay writing practice test.', totalQuestions: 50, totalMarks: 50, duration: 90, negativeMarking: false, type: 'SEE Board Mock', difficulty: 'Medium', attempts: 1670, avgScore: 41, isPremium: false },
            { id: 'see-soc-1', title: 'SEE Class 10 Social Studies Board Model Paper', description: 'Nepal Constitution, geography, history, civic awareness & international relations set.', totalQuestions: 50, totalMarks: 50, duration: 90, negativeMarking: false, type: 'SEE Board Mock', difficulty: 'Medium', attempts: 1430, avgScore: 43, isPremium: false },
          ];

          setExams(program === 'see' ? SEE_PRELOADED : CEE_PRELOADED);
        }
      } catch {
        const CEE_FALLBACK: MockExam[] = [
          { id: 'cee-full-1', title: 'Full CEE Grand Mock Test #1 (200 MCQs)', description: 'Complete 200-question MEC pattern mock test.', totalQuestions: 200, totalMarks: 200, duration: 180, negativeMarking: true, type: 'Full CEE Mock', difficulty: 'Hard', attempts: 1840, avgScore: 138, isPremium: false },
        ];
        const SEE_FALLBACK: MockExam[] = [
          { id: 'see-sci-1', title: 'SEE Class 10 Compulsory Science Model Exam', description: 'Full Class 10 NEB Board Science examination.', totalQuestions: 75, totalMarks: 75, duration: 135, negativeMarking: false, type: 'SEE Board Mock', difficulty: 'Medium', attempts: 1540, avgScore: 58, isPremium: false },
        ];
        setExams(program === 'see' ? SEE_FALLBACK : CEE_FALLBACK);
      } finally {
        setExamsLoading(false);
      }
    };
    fetchExams();
  }, [program]);


  // Online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  // Timer
  useEffect(() => {
    if (examMode === 'active' && selectedExam) {
      setTimeLeft(selectedExam.duration * 60);
    }
  }, [examMode, selectedExam]);

  useEffect(() => {
    if (examMode !== 'active') return;
    if (timeLeft <= 0) { handleSubmitExam(); return; }
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

  // Loads a fresh, randomized set of REAL questions from the question bank
  // (this DB has no exam_questions link table). Uses the real schema: an
  // `options` text[] array + a `correct_answer` letter, normalized to the
  // lowercase a/b/c/d ids the exam UI and grading use.
  const loadExamQuestions = async (exam: MockExam) => {
    setQuestionsLoading(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('questions')
        .select('id, question_text, options, correct_answer, explanation, subject_id, difficulty')
        .eq('is_published', true)
        .limit(300);

      const pool = (data ?? []).filter((r: any) => Array.isArray(r.options) && r.options.length >= 2 && r.question_text);
      // Fisher–Yates shuffle → no repeats within a single test.
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      const want = exam.totalQuestions && exam.totalQuestions > 0 ? exam.totalQuestions : pool.length;
      const picked = pool.slice(0, Math.min(want, pool.length));

      const mapped: ExamMCQ[] = picked.map((r: any) => ({
        id: r.id,
        question_text: r.question_text,
        option_a: r.options[0] ?? '',
        option_b: r.options[1] ?? '',
        option_c: r.options[2] ?? '',
        option_d: r.options[3] ?? '',
        correct_option: toOptionId(r.correct_answer, r.options),
        explanation: r.explanation ?? '',
        subject: subjectNameById.current.get(r.subject_id) ?? 'General',
        marks: 1,
        negativeMarks: 0.25,
      }));

      if (mapped.length === 0) {
        toast.error('No questions available yet. Please add questions in the admin panel.');
        setQuestionsLoading(false);
        return false;
      }
      setQuestions(mapped);
      setQuestionsLoading(false);
      return true;
    } catch {
      toast.error('Failed to load questions.');
      setQuestionsLoading(false);
      return false;
    }
  };

  // Anti-cheat: exam-mode monitoring (tab switches, copy/paste)
  const { counts: cheatCounts } = useAntiCheat({
    enabled: examMode === 'active',
    onViolation: (v, total) => {
      if ((v.type === 'tab_switch' || v.type === 'window_blur') && total <= 3) {
        toast(`⚠️ Exam integrity: tab switch detected (${total}). This is recorded.`, { icon: '🚨' });
      }
      if (v.type === 'copy' || v.type === 'paste') {
        toast('Copy/paste is disabled during the exam.', { icon: '🔒' });
      }
    },
  });
  const examTabSwitches = cheatCounts.tab_switch + cheatCounts.window_blur;

  // subject_id -> display name lookup for the secure question rows
  const subjectNameById = useRef<Map<string, string>>(new Map());
  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.from('subjects').select('id, display_name');
      if (data) subjectNameById.current = new Map(data.map((s: any) => [s.id, s.display_name]));
    })();
  }, []);

  const handleStartExam = async () => {
    if (!selectedExam) return;
    const ok = await loadExamQuestions(selectedExam);
    if (!ok) return;
    setCurrentIdx(0);
    setAnswers({});
    setMarkedForReview(new Set());

    // Create the attempt row up-front: the server-side grader
    // (grade_exam_attempt) finalizes THIS row at submit time.
    let newAttemptId: string | null = null;
    if (user?.id) {
      const supabase = createClient();
      const { data: attemptData } = await supabase
        .from('exam_attempts')
        .insert({ exam_id: selectedExam.id, student_id: user.id, total_marks: selectedExam.totalMarks })
        .select('id')
        .single();
      newAttemptId = attemptData?.id ?? null;
    }
    setAttemptId(newAttemptId);
    setExamMode('active');
  };

  const getResults = useCallback(() => {
    let score = 0; let correct = 0; let incorrect = 0;
    const subjectMap: Record<string, SubjectBreakdown> = {};

    questions.forEach((q) => {
      if (!subjectMap[q.subject]) {
        subjectMap[q.subject] = { subject: q.subject, correct: 0, incorrect: 0, unattempted: 0, accuracy: 0 };
      }
      const a = answers[q.id];
      if (!a) {
        subjectMap[q.subject].unattempted++;
        return;
      }
      if (a === q.correct_option) {
        score += q.marks;
        correct++;
        subjectMap[q.subject].correct++;
      } else {
        score -= q.negativeMarks;
        incorrect++;
        subjectMap[q.subject].incorrect++;
      }
    });

    const unattempted = questions.length - correct - incorrect;
    const accuracy = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;

    // Calculate per-subject accuracy
    Object.values(subjectMap).forEach((s) => {
      const total = s.correct + s.incorrect + s.unattempted;
      s.accuracy = total > 0 ? Math.round((s.correct / total) * 100) : 0;
    });

    return { score, correct, incorrect, unattempted, accuracy, subjectBreakdown: Object.values(subjectMap) };
  }, [questions, answers]);

  // After submission the exam is over, so it's fine (and needed for the review
  // screen) to fetch the answer key + explanations and merge them in. Returns
  // the key map so callers can grade against it immediately (state updates are
  // async, so reading `questions` right after setQuestions would be stale).
  const revealAnswerKey = useCallback(async (): Promise<Map<string, any>> => {
    const keyById = new Map<string, any>();
    try {
      const supabase = createClient();
      const ids = questions.map((q) => q.id);
      if (ids.length === 0) return keyById;
      const { data } = await supabase
        .from('questions')
        .select('id, options, correct_answer, explanation')
        .in('id', ids);
      if (!data) return keyById;
      (data as any[]).forEach((r) =>
        keyById.set(r.id, { correct_option: toOptionId(r.correct_answer, r.options), explanation: r.explanation })
      );
      setQuestions((prev) =>
        prev.map((q) => {
          const k = keyById.get(q.id);
          return k ? { ...q, correct_option: k.correct_option ?? q.correct_option, explanation: k.explanation ?? q.explanation } : q;
        })
      );
    } catch {
      // review screen will simply lack explanations
    }
    return keyById;
  }, [questions]);

  const handleSubmitExam = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);

    const supabase = createClient();
    const timeTaken = selectedExam ? selectedExam.duration * 60 - timeLeft : 0;
    let gradedOnServer = false;

    // ── Preferred path: server-side grading (answer key never needed client-side)
    if (user?.id && selectedExam && attemptId) {
      try {
        const payload = questions
          .filter((q) => answers[q.id])
          .map((q) => ({ question_id: q.id, selected_option: answers[q.id] }));

        const { data: graded, error: gradeError } = await supabase.rpc('grade_exam_attempt', {
          p_attempt_id: attemptId,
          p_answers: payload,
          p_time_taken_seconds: timeTaken,
        });

        const row = Array.isArray(graded) ? graded[0] : graded;
        if (!gradeError && row) {
          gradedOnServer = true;
          // Flag marked-for-review rows (grader already stored the answers).
          if (markedForReview.size > 0) {
            await supabase
              .from('exam_question_answers')
              .update({ is_flagged: true })
              .eq('attempt_id', attemptId)
              .in('question_id', Array.from(markedForReview));
          }
        }
      } catch {
        // fall through to legacy local grading
      }
    }

    // ── Reveal the key so the result/review screens can render; grade the
    //    fallback against the RETURNED map (not async state).
    const keyById = await revealAnswerKey();

    // Per-subject breakdown, computed against the fresh key map.
    {
      const subjectMap: Record<string, SubjectBreakdown> = {};
      questions.forEach((q) => {
        if (!subjectMap[q.subject]) {
          subjectMap[q.subject] = { subject: q.subject, correct: 0, incorrect: 0, unattempted: 0, accuracy: 0 };
        }
        const a = answers[q.id];
        const key = keyById.get(q.id)?.correct_option ?? q.correct_option;
        if (!a) subjectMap[q.subject].unattempted++;
        else if (a === key) subjectMap[q.subject].correct++;
        else subjectMap[q.subject].incorrect++;
      });
      Object.values(subjectMap).forEach((s) => {
        const total = s.correct + s.incorrect + s.unattempted;
        s.accuracy = total > 0 ? Math.round((s.correct / total) * 100) : 0;
      });
      setSubjectBreakdown(Object.values(subjectMap));
    }

    // ── Legacy fallback: local grading + manual attempt persistence
    if (!gradedOnServer && user?.id && selectedExam) {
      try {
        let score = 0; let correct = 0; let incorrect = 0;
        questions.forEach((q) => {
          const a = answers[q.id];
          if (!a) return;
          const key = keyById.get(q.id)?.correct_option ?? q.correct_option;
          if (a === key) { score += q.marks; correct++; }
          else { score -= q.negativeMarks; incorrect++; }
        });
        const unattempted = questions.length - correct - incorrect;
        const percentage = selectedExam.totalMarks > 0
          ? Math.round((score / selectedExam.totalMarks) * 100 * 10) / 10
          : 0;
        if (attemptId) {
          await supabase
            .from('exam_attempts')
            .update({
              score,
              correct_answers: correct,
              incorrect_answers: incorrect,
              unattempted,
              percentage,
              time_taken_seconds: timeTaken,
              completed_at: new Date().toISOString(),
            })
            .eq('id', attemptId);
        }
      } catch {
        // silently continue to results
      }
    }

    setSubmitting(false);
    setExamMode('result');
  }, [submitting, getResults, revealAnswerKey, user?.id, selectedExam, timeLeft, questions, answers, markedForReview, attemptId]);

  if (examMode === 'list') {
    return (
      <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border rounded-2xl p-6 shadow-sm mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${programDetails.badgeBg} ${programDetails.badgeText}`}>
                  {programDetails.badge}
                </span>
                <span className="text-xs text-muted-foreground font-medium">Exam Simulation</span>
              </div>
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
                <FileText size={24} className="text-primary" /> {programDetails.shortName} Mock Tests
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Simulate the real {programDetails.name} exam experience with timed tests &amp; instant analysis.
              </p>
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
              <span className="text-xs text-muted-foreground font-semibold">Active Program Section:</span>
              <ProgramSwitcher size="md" />
            </div>
          </div>


          {examsLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={28} className="animate-spin text-primary" />
            </div>
          ) : exams.length === 0 ? (
            <div className="text-center py-20">
              <FileText size={40} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-base font-semibold text-foreground">No exams available yet</p>
              <p className="text-sm text-muted-foreground mt-1">Check back soon — new mock tests are added regularly.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {exams.map((exam) => (
                <div key={exam.id} className="bg-card border border-border rounded-2xl p-5 hover:shadow-card-hover hover:border-primary/20 transition-all duration-200 flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-primary/10 text-primary">{exam.type}</span>
                        {exam.isPremium && <span className="text-xs bg-warning-light text-warning px-2 py-0.5 rounded-full font-semibold">⭐ Pro</span>}
                      </div>
                      <h3 className="font-bold text-sm text-foreground leading-snug">{exam.title}</h3>
                    </div>
                  </div>

                  {exam.description && (
                    <p className="text-xs text-muted-foreground mb-4 leading-relaxed flex-1">{exam.description}</p>
                  )}

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      { label: 'Questions', value: exam.totalQuestions || '—' },
                      { label: 'Duration', value: `${exam.duration}m` },
                      { label: 'Marks', value: exam.totalMarks },
                    ].map((s) => (
                      <div key={s.label} className="bg-muted/50 rounded-lg p-2 text-center">
                        <p className="text-sm font-bold text-foreground">{s.value}</p>
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span>{exam.attempts.toLocaleString()} attempts</span>
                    {exam.negativeMarking && <span className="text-error">-ve marking</span>}
                  </div>

                  <button
                    onClick={() => { setSelectedExam(exam); setExamMode('confirm'); }}
                    className={`btn-primary w-full py-2.5 text-sm gap-2 ${exam.isPremium ? 'opacity-80' : ''}`}
                  >
                    {exam.isPremium ? '🔒 Unlock with Pro' : <><Play size={14} /> Start Exam</>}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  if (examMode === 'confirm' && selectedExam) {
    return (
      <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
        <div className="max-w-lg mx-auto px-4 sm:px-6 py-8">
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
              <Shield size={28} className="text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-1">{selectedExam.title}</h2>
            {selectedExam.description && <p className="text-sm text-muted-foreground mb-5">{selectedExam.description}</p>}

            <div className="bg-muted/50 rounded-xl p-4 space-y-2.5 mb-5">
              {[
                { label: 'Total Questions', value: selectedExam.totalQuestions || 'Loading…' },
                { label: 'Total Marks', value: selectedExam.totalMarks },
                { label: 'Duration', value: `${selectedExam.duration} minutes` },
                { label: 'Negative Marking', value: selectedExam.negativeMarking ? '-0.25 per wrong answer' : 'None' },
              ].map((item) => (
                <div key={item.label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-semibold text-foreground">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="bg-warning-light border border-warning/20 rounded-xl p-3 mb-5">
              <div className="flex items-start gap-2">
                <AlertTriangle size={15} className="text-warning shrink-0 mt-0.5" />
                <p className="text-xs text-warning font-medium">
                  The timer starts immediately. Do not refresh the page. Your answers are saved on submission.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setExamMode('list')} className="flex-1 btn-secondary py-2.5">Cancel</button>
              <button
                onClick={handleStartExam}
                disabled={questionsLoading}
                className="flex-1 btn-primary py-2.5 gap-2"
              >
                {questionsLoading ? <><Loader2 size={15} className="animate-spin" />Loading…</> : <><Play size={16} /> Begin Exam</>}
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (examMode === 'result') {
    const r = getResults();
    return (
      <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-5">
          {/* Score card */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Trophy size={28} className="text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Exam Complete!</h2>
                <p className="text-sm text-muted-foreground">{selectedExam?.title}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {[
                { label: 'Score', value: `${r.score}/${selectedExam?.totalMarks ?? 0}`, color: 'text-primary' },
                { label: 'Accuracy', value: `${r.accuracy}%`, color: r.accuracy >= 70 ? 'text-success' : r.accuracy >= 50 ? 'text-warning' : 'text-error' },
                { label: 'Correct', value: r.correct, color: 'text-success' },
                { label: 'Incorrect', value: r.incorrect, color: 'text-error' },
              ].map((s) => (
                <div key={s.label} className="bg-muted/50 rounded-xl p-3 text-center">
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Correct', value: r.correct, color: 'text-success', bg: 'bg-success-light', Icon: CheckCircle },
                { label: 'Incorrect', value: r.incorrect, color: 'text-error', bg: 'bg-error-light', Icon: XCircle },
                { label: 'Unattempted', value: r.unattempted, color: 'text-muted-foreground', bg: 'bg-muted', Icon: MinusCircle },
              ].map((s) => (
                <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
                  <s.Icon size={18} className={`${s.color} mx-auto mb-1`} />
                  <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Subject breakdown */}
          {subjectBreakdown.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-5">
              <p className="text-sm font-bold text-foreground mb-4">Subject-wise Breakdown</p>
              <div className="space-y-3">
                {subjectBreakdown.map((s) => (
                  <div key={s.subject}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <BookOpen size={13} className="text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">{s.subject}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="text-success font-semibold">{s.correct}✓</span>
                        <span className="text-error font-semibold">{s.incorrect}✗</span>
                        <span className="font-bold text-foreground">{s.accuracy}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-border rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${s.accuracy >= 70 ? 'bg-success' : s.accuracy >= 50 ? 'bg-warning' : 'bg-error'}`}
                        style={{ width: `${s.accuracy}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Question review */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowExplanations(!showExplanations)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors"
            >
              <p className="text-sm font-bold text-foreground">Review Questions & Explanations</p>
              <span className="text-xs text-primary font-medium">{showExplanations ? 'Hide' : 'Show'}</span>
            </button>
            {showExplanations && (
              <div className="divide-y divide-border border-t border-border">
                {questions.map((q, idx) => {
                  const userAnswer = answers[q.id];
                  const isCorrect = userAnswer === q.correct_option;
                  const isUnattempted = !userAnswer;
                  return (
                    <div key={q.id} className="p-5">
                      <div className="flex items-start gap-3 mb-3">
                        <span className="text-xs font-bold text-muted-foreground w-6 shrink-0 mt-0.5">Q{idx + 1}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground leading-relaxed mb-3"><MathText text={q.question_text} /></p>
                          <div className="space-y-1.5">
                            {(['a', 'b', 'c', 'd'] as const).map((opt) => {
                              const optText = q[`option_${opt}` as keyof ExamMCQ] as string;
                              const isCorrectOpt = q.correct_option === opt;
                              const isUserOpt = userAnswer === opt;
                              return (
                                <div
                                  key={opt}
                                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm border ${
                                    isCorrectOpt
                                      ? 'border-success bg-success-light text-success font-semibold'
                                      : isUserOpt && !isCorrectOpt
                                      ? 'border-error bg-error-light text-error' :'border-border bg-muted/30 text-muted-foreground'
                                  }`}
                                >
                                  <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 border-current">
                                    {OPTION_LABELS[opt]}
                                  </span>
                                  <MathText text={optText} className="flex-1" />
                                  {isCorrectOpt && <CheckCircle size={14} className="ml-auto text-success" />}
                                  {isUserOpt && !isCorrectOpt && <XCircle size={14} className="ml-auto text-error" />}
                                </div>
                              );
                            })}
                          </div>
                          {isUnattempted && (
                            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                              <MinusCircle size={12} /> Not attempted
                            </p>
                          )}
                          {q.explanation && (
                            <div className="mt-3 bg-secondary border border-primary/20 rounded-lg p-3">
                              <p className="text-xs font-semibold text-primary mb-1">Explanation</p>
                              <p className="text-xs text-foreground leading-relaxed">{q.explanation}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={() => { setExamMode('list'); setQuestions([]); }} className="flex-1 btn-secondary py-2.5 gap-2">
              <RotateCcw size={15} /> Back to Tests
            </button>
            <button
              onClick={() => { setExamMode('confirm'); setQuestions([]); }}
              className="flex-1 btn-primary py-2.5 gap-2"
            >
              <Play size={15} /> Retake
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Active exam
  const answered = Object.keys(answers).length;
  const timerPct = selectedExam ? (timeLeft / (selectedExam.duration * 60)) * 100 : 100;
  const timerColor = timerPct > 33 ? 'text-success' : timerPct > 10 ? 'text-warning' : 'text-error';

  return (
    <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
      <div className="flex h-full">
        {/* Main exam area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Exam topbar */}
          <div className="bg-card border-b border-border px-4 sm:px-6 py-3 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-foreground">Q {currentIdx + 1}/{questions.length}</span>
              <span className="text-xs text-muted-foreground hidden sm:block">{current?.subject}</span>
            </div>
            <div className={`flex items-center gap-1.5 font-mono font-bold text-lg ${timerColor}`}>
              <Clock size={16} />
              {formatTime(timeLeft)}
            </div>
            <div className="flex items-center gap-2">
              {examTabSwitches > 0 && (
                <span className="text-xs font-bold text-warning bg-warning-light px-2 py-0.5 rounded-full" title="Tab switches detected — recorded for exam integrity">
                  ⚠ {examTabSwitches}
                </span>
              )}
              {isOnline ? <Wifi size={14} className="text-success" /> : <WifiOff size={14} className="text-error" />}
              <button
                onClick={() => { if (confirm('Submit exam? This cannot be undone.')) handleSubmitExam(); }}
                disabled={submitting}
                className="btn-primary text-xs py-1.5 px-3 gap-1"
              >
                {submitting ? <><Loader2 size={12} className="animate-spin" />Saving…</> : 'Submit'}
              </button>
            </div>
          </div>

          {/* Question */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="max-w-2xl mx-auto">
              {current && (
                <>
                  <div className="flex items-start justify-between gap-3 mb-5">
                    <p className="text-base font-semibold text-foreground leading-relaxed"><MathText text={current.question_text} /></p>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => setMarkedForReview((prev) => { const n = new Set(prev); n.has(current.id) ? n.delete(current.id) : n.add(current.id); return n; })}
                        className={`p-2 rounded-lg transition-colors ${markedForReview.has(current.id) ? 'text-warning bg-warning-light' : 'text-muted-foreground hover:text-warning hover:bg-warning-light'}`}
                      >
                        <Flag size={15} />
                      </button>
                      <button onClick={() => sonnerToast.success('Question bookmarked!')} className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                        <BookmarkPlus size={15} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2.5 mb-6">
                    {(['a', 'b', 'c', 'd'] as const).map((opt) => {
                      const optText = current[`option_${opt}` as keyof ExamMCQ] as string;
                      return (
                        <button
                          key={opt}
                          onClick={() => setAnswers((prev) => ({ ...prev, [current.id]: opt }))}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-sm font-medium transition-all duration-200 ${
                            answers[current.id] === opt
                              ? 'border-primary bg-primary/10 text-primary' :'border-border bg-muted/30 text-foreground hover:border-primary/40 hover:bg-primary/5'
                          }`}
                        >
                          <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 ${
                            answers[current.id] === opt ? 'border-primary bg-primary text-white' : 'border-current'
                          }`}>
                            {OPTION_LABELS[opt]}
                          </span>
                          <MathText text={optText} className="flex-1" />
                        </button>
                      );
                    })}
                    {answers[current.id] && (
                      <div className="flex justify-start">
                        <button
                          onClick={() => setAnswers((prev) => { const next = {...prev}; delete next[current.id]; return next; })}
                          className="text-xs text-muted-foreground hover:text-error mt-2"
                        >
                          Clear Selection
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                      disabled={currentIdx === 0}
                      className="btn-secondary py-2 px-4 gap-2 text-sm disabled:opacity-40"
                    >
                      <ChevronLeft size={15} /> Previous
                    </button>
                    <span className="text-xs text-muted-foreground">{answered} answered · {questions.length - answered} remaining</span>
                    <button
                      onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
                      disabled={currentIdx === questions.length - 1}
                      className="btn-primary py-2 px-4 gap-2 text-sm disabled:opacity-40"
                    >
                      Next <ChevronRight size={15} />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right panel — question palette */}
        <div className="hidden lg:flex w-56 xl:w-64 flex-col bg-card border-l border-border shrink-0">
          <div className="p-4 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Question Palette</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <div className="grid grid-cols-5 gap-1.5">
              {questions.map((q, idx) => {
                const isAnswered = !!answers[q.id];
                const isReview = markedForReview.has(q.id);
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${
                      idx === currentIdx ? 'ring-2 ring-primary ring-offset-1' : ''
                    } ${
                      isReview ? 'bg-warning-light text-warning' : isAnswered ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="p-3 border-t border-border space-y-1.5">
            {[
              { color: 'bg-primary/10 text-primary', label: 'Answered' },
              { color: 'bg-warning-light text-warning', label: 'Marked' },
              { color: 'bg-muted text-muted-foreground', label: 'Not visited' },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className={`w-5 h-5 rounded ${l.color} flex items-center justify-center text-xs font-bold`}>1</span>
                {l.label}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Mobile Floating Button */}
      {examMode === 'active' && (
        <button
          className="fixed bottom-4 right-4 lg:hidden z-50 w-12 h-12 rounded-full bg-primary text-white shadow-lg flex items-center justify-center"
          onClick={() => setShowMobilePalette((v) => !v)}
        >
          <Grid size={20} />
        </button>
      )}

      {/* Mobile Question Palette Drawer */}
      {examMode === 'active' && showMobilePalette && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobilePalette(false)} />
          <div className="relative bg-card rounded-t-2xl max-h-[80vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <p className="text-sm font-bold text-foreground">Question Palette</p>
              <button onClick={() => setShowMobilePalette(false)} className="text-muted-foreground hover:text-foreground">
                <XCircle size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, idx) => {
                  const isAnswered = !!answers[q.id];
                  const isReview = markedForReview.has(q.id);
                  return (
                    <button
                      key={q.id}
                      onClick={() => { setCurrentIdx(idx); setShowMobilePalette(false); }}
                      className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${
                        idx === currentIdx ? 'ring-2 ring-primary ring-offset-1' : ''
                      } ${
                        isReview ? 'bg-warning-light text-warning' : isAnswered ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                      }`}
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
    </DashboardLayout>
  );
}
