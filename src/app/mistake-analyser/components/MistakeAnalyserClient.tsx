'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useChat } from '@/lib/hooks/useChat';
import DashboardLayout from '@/components/DashboardLayout';
import {
  AlertTriangle,
  TrendingUp,
  Loader2,
  ChevronDown,
  ChevronUp,
  Target,
  BookOpen,
  FlaskConical,
  Atom,
  Brain,
  Lightbulb,
  CheckCircle2,
  Zap,
  Play,
  RotateCcw,
  Layers,
  Sparkles,
  PartyPopper,
  Check,
  RefreshCw,
  X,
  Award
} from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { optionLetterToText } from '@/lib/scoring';
import { MathText } from '@/components/MathText';

interface WrongAnswer {
  id: string;
  question: string;
  subject: string;
  yourAnswer: string;
  correctAnswer: string;
  topic: string;
  options?: string[];
}

interface AnalysisResult {
  patterns: string[];
  weakTopics: Array<{ topic: string; subject: string; severity: 'High' | 'Medium' | 'Low'; advice: string }>;
  overallInsight: string;
  revisionPlan: string[];
}

function parseAnalysis(raw: string): AnalysisResult | null {
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch {}
  return null;
}

function normalizeAnswerText(val: string): string {
  return val.trim().toLowerCase().replace(/\s+/g, ' ');
}

export default function MistakeAnalyserClient() {
  const [isDark, setIsDark] = useState(false);
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([]);
  const [loadingMistakes, setLoadingMistakes] = useState(true);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [expandedTopics, setExpandedTopics] = useState<Set<number>>(new Set());
  const [analysed, setAnalysed] = useState(false);
  const [newEntry, setNewEntry] = useState<Partial<WrongAnswer>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [flashcardSaved, setFlashcardSaved] = useState<Record<string, boolean>>({});
  const [savingFlashcard, setSavingFlashcard] = useState<Record<string, boolean>>({});

  // Galti Sudhar (Re-Attempt Drill) Engine States (keyed by stable WrongAnswer.id)
  const [resolvedMistakes, setResolvedMistakes] = useState<Record<string, boolean>>({});
  const [activeMistakeFilter, setActiveMistakeFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [drillIndex, setDrillIndex] = useState<number | null>(null);
  const [drillSelectedOption, setDrillSelectedOption] = useState<string | null>(null);
  const [drillResult, setDrillResult] = useState<'correct' | 'incorrect' | null>(null);
  const [recallRevealed, setRecallRevealed] = useState(false);

  const { user } = useAuth();
  const { response, isLoading, error, sendMessage } = useChat('OPEN_AI', 'gpt-4o', false);

  const resolvedStorageKey = `samyak_resolved_mistakes_v2_${user?.id || 'guest'}`;

  // Load resolved mistakes from user-scoped localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(resolvedStorageKey);
      if (saved) {
        setResolvedMistakes(JSON.parse(saved));
      } else {
        setResolvedMistakes({});
      }
    } catch {
      setResolvedMistakes({});
    }
  }, [resolvedStorageKey]);

  const handleConvertMistakeToFlashcard = async (w: WrongAnswer) => {
    if (flashcardSaved[w.id]) return;
    setSavingFlashcard((prev) => ({ ...prev, [w.id]: true }));
    try {
      const res = await fetch('/api/flashcards/convert-mistake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          front: w.question,
          back: `**Correct Answer: ${w.correctAnswer}**\n\n(Previously answered: ${w.yourAnswer})`,
          hint: `Subject: ${w.subject} | Topic: ${w.topic}`,
          topic: w.topic,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setFlashcardSaved((prev) => ({ ...prev, [w.id]: true }));
        toast.success(data.message || 'Converted mistake into an active SM-2 Flashcard!');
      } else {
        toast.error(data.details || 'Could not save flashcard');
      }
    } catch {
      toast.error('Failed to convert mistake to flashcard');
    } finally {
      setSavingFlashcard((prev) => ({ ...prev, [w.id]: false }));
    }
  };

  useEffect(() => {
    if (!user?.id) {
      setLoadingMistakes(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingMistakes(true);
      const supabase = createClient();
      // Fetch practice attempts where student got question wrong
      const { data, error: fetchError } = await supabase
        .from('practice_attempts')
        .select(`
          question_id, selected_option, created_at,
          questions ( id, question_text, options, correct_answer, chapter_id, chapters ( title ) ),
          subjects ( display_name )
        `)
        .eq('student_id', user.id)
        .eq('is_correct', false)
        .order('created_at', { ascending: false })
        .limit(60);

      if (cancelled) return;

      if (fetchError) {
        console.error('Failed to load past mistakes:', fetchError.message);
        setWrongAnswers([]);
      } else {
        const seen = new Set<string>();
        const real: WrongAnswer[] = [];
        for (const row of (data ?? []) as any[]) {
          const qId = String(row.question_id || row.questions?.id || '');
          if (!row.questions || !qId || seen.has(qId)) continue;
          seen.add(qId);

          const q = row.questions;
          const yourAnsText = optionLetterToText(q, row.selected_option);
          const correctAnsText = optionLetterToText(q, q.correct_answer || 'A');

          let opts: string[] = [];
          if (Array.isArray(q.options) && q.options.length >= 2) {
            opts = q.options
              .map((o: any) => (typeof o === 'string' ? o : o?.text || String(o ?? '')))
              .filter((s: string) => s.trim().length > 0);
          } else if (typeof q.options === 'object' && q.options !== null) {
            opts = Object.values(q.options)
              .map((o: any) => (typeof o === 'string' ? o : o?.text || String(o ?? '')))
              .filter((s: string) => s.trim().length > 0);
          }

          real.push({
            id: qId,
            question: q.question_text || '',
            subject: row.subjects?.display_name ?? 'General',
            yourAnswer: yourAnsText,
            correctAnswer: correctAnsText,
            topic: q.chapters?.title ?? row.subjects?.display_name ?? 'General',
            options: opts.length >= 2 ? opts : undefined,
          });
          if (real.length >= 25) break;
        }
        setWrongAnswers(real);
      }
      setLoadingMistakes(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (error) toast.error(error.message);
  }, [error]);

  useEffect(() => {
    if (response && !isLoading && analysed) {
      const parsed = parseAnalysis(response);
      if (parsed) {
        setAnalysis(parsed);
      } else {
        toast.error('Could not parse analysis. Please try again.');
      }
    }
  }, [response, isLoading, analysed]);

  const handleAnalyse = () => {
    if (wrongAnswers.length < 2) {
      toast.error('At least 2 wrong answers are needed to analyse mistake patterns.');
      return;
    }
    setAnalysed(true);
    setAnalysis(null);

    const prompt = `You are an expert CEE & SEE exam diagnostic tutor. Analyse these wrong answers from a student and identify mistake patterns.

Wrong Answers:
${wrongAnswers.map((w, i) => `${i + 1}. Subject: ${w.subject} | Topic: ${w.topic}
   Q: ${w.question}
   Student answered: ${w.yourAnswer} | Correct: ${w.correctAnswer}`).join('\n\n')}

Return ONLY valid JSON (no extra text):
{
  "patterns": ["Pattern 1 description", "Pattern 2 description", "Pattern 3 description"],
  "weakTopics": [
    {
      "topic": "Topic name",
      "subject": "Subject name",
      "severity": "High",
      "advice": "Specific revision advice for this topic"
    }
  ],
  "overallInsight": "2-3 sentence overall assessment of the student's mistake patterns",
  "revisionPlan": ["Step 1", "Step 2", "Step 3", "Step 4"]
}

Severity: High = 3+ mistakes or fundamental misconception, Medium = 2 mistakes, Low = minor calculation or recall error.`;

    sendMessage([{ role: 'user', content: prompt }], { max_completion_tokens: 2000 });
  };

  const handleAddEntry = () => {
    if (!newEntry.question || !newEntry.subject || !newEntry.yourAnswer || !newEntry.correctAnswer || !newEntry.topic) {
      toast.error('Please fill all fields');
      return;
    }
    const manualItem: WrongAnswer = {
      id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      question: newEntry.question.trim(),
      subject: newEntry.subject,
      topic: newEntry.topic.trim(),
      yourAnswer: newEntry.yourAnswer.trim(),
      correctAnswer: newEntry.correctAnswer.trim(),
      options: undefined,
    };
    setWrongAnswers((prev) => [manualItem, ...prev]);
    setNewEntry({});
    setShowAddForm(false);
    setAnalysis(null);
    toast.success('Added mistake entry');
  };

  const handleRemove = (id: string) => {
    setWrongAnswers((prev) => prev.filter((item) => item.id !== id));
    setAnalysis(null);
  };

  const toggleTopic = (i: number) => {
    setExpandedTopics((prev) => {
      const n = new Set(prev);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });
  };

  const severityColor: Record<string, string> = {
    High: 'text-rose-600 bg-rose-500/10 border-rose-500/20',
    Medium: 'text-amber-600 bg-amber-500/10 border-amber-500/20',
    Low: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20',
  };

  const resolvedCount = wrongAnswers.filter((w) => !!resolvedMistakes[w.id]).length;
  const pendingCount = Math.max(0, wrongAnswers.length - resolvedCount);
  const clearedPercentage = wrongAnswers.length > 0 ? Math.round((resolvedCount / wrongAnswers.length) * 100) : 0;

  const handleStartDrill = (startIndex?: number) => {
    let targetIdx: number;
    if (startIndex !== undefined) {
      targetIdx = startIndex;
    } else {
      targetIdx = wrongAnswers.findIndex((w) => !resolvedMistakes[w.id]);
    }

    if (targetIdx === -1 && wrongAnswers.length > 0) {
      toast.success('All recorded mistakes are already resolved! Opening drill for review 🎉');
      setDrillIndex(0);
    } else if (targetIdx !== -1) {
      setDrillIndex(targetIdx);
    } else {
      toast.error('No mistakes recorded yet to practice.');
      return;
    }
    setDrillSelectedOption(null);
    setDrillResult(null);
    setRecallRevealed(false);
  };

  const markMistakeResolved = (mistakeId: string) => {
    setDrillResult('correct');
    const updated = { ...resolvedMistakes, [mistakeId]: true };
    setResolvedMistakes(updated);
    try {
      localStorage.setItem(resolvedStorageKey, JSON.stringify(updated));
    } catch {}
    toast.success('सुधार भयो! 🎉 Correct answer! Marked as resolved.', { icon: '🌟' });
  };

  const handleDrillSubmit = (chosenOptionText: string) => {
    if (drillIndex === null) return;
    const current = wrongAnswers[drillIndex];
    if (!current) return;

    setDrillSelectedOption(chosenOptionText);
    const isCorrect = normalizeAnswerText(chosenOptionText) === normalizeAnswerText(current.correctAnswer);

    if (isCorrect) {
      markMistakeResolved(current.id);
    } else {
      setDrillResult('incorrect');
      toast.error('Not quite! Review the concept and try again.');
    }
  };

  const handleNextDrillItem = () => {
    if (drillIndex === null) return;
    const nextUnresolved = wrongAnswers.findIndex((w, idx) => idx > drillIndex && !resolvedMistakes[w.id]);
    if (nextUnresolved !== -1) {
      setDrillIndex(nextUnresolved);
      setDrillSelectedOption(null);
      setDrillResult(null);
      setRecallRevealed(false);
    } else {
      const anyUnresolved = wrongAnswers.findIndex((w) => !resolvedMistakes[w.id]);
      if (anyUnresolved !== -1 && anyUnresolved !== drillIndex) {
        setDrillIndex(anyUnresolved);
        setDrillSelectedOption(null);
        setDrillResult(null);
        setRecallRevealed(false);
      } else {
        setDrillIndex(null);
        setRecallRevealed(false);
        toast.success('Outstanding! You completed the Galti Sudhar drill! 🏆', { duration: 5000 });
      }
    }
  };

  return (
    <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center shrink-0">
              <AlertTriangle size={24} className="text-rose-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-foreground">AI Mistake Notebook &amp; Diagnostic</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Automatically tracks questions you miss during practice and diagnoses conceptual gaps.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/practice"
              className="btn-primary py-2.5 px-4 text-xs font-bold gap-1.5"
            >
              <Zap size={14} /> Practice Engine
            </Link>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="btn-secondary py-2.5 px-4 text-xs font-bold"
            >
              {showAddForm ? 'Cancel' : '+ Add Manual Entry'}
            </button>
          </div>
        </div>

        {/* Add manual wrong answer modal/form */}
        {showAddForm && (
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-foreground">Add Custom Mistake Record</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground"
                placeholder="Question text"
                value={newEntry.question || ''}
                onChange={(e) => setNewEntry((p) => ({ ...p, question: e.target.value }))}
              />
              <select
                className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground"
                value={newEntry.subject || ''}
                onChange={(e) => setNewEntry((p) => ({ ...p, subject: e.target.value }))}
              >
                <option value="">Select Subject</option>
                {['Biology', 'Chemistry', 'Physics', 'Mental Agility', 'Compulsory Science', 'Compulsory Mathematics'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <input
                className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground"
                placeholder="Topic / Chapter"
                value={newEntry.topic || ''}
                onChange={(e) => setNewEntry((p) => ({ ...p, topic: e.target.value }))}
              />
              <input
                className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground"
                placeholder="Your wrong answer"
                value={newEntry.yourAnswer || ''}
                onChange={(e) => setNewEntry((p) => ({ ...p, yourAnswer: e.target.value }))}
              />
              <input
                className="w-full sm:col-span-2 bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground"
                placeholder="Correct answer"
                value={newEntry.correctAnswer || ''}
                onChange={(e) => setNewEntry((p) => ({ ...p, correctAnswer: e.target.value }))}
              />
            </div>
            <button onClick={handleAddEntry} className="btn-primary py-2 px-4 text-xs font-bold">
              Save Entry
            </button>
          </div>
        )}

        {/* Diagnosis Trigger Card */}
        <div className="bg-card border border-border rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Recorded Mistakes: {wrongAnswers.length} Questions
            </span>
            <h2 className="text-base sm:text-lg font-black text-foreground mt-0.5">
              Run AI Diagnostic Pattern Analysis
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Find out whether your mistakes stem from memory slips, conceptual traps, or calculation speed.
            </p>
          </div>
          <button
            onClick={handleAnalyse}
            disabled={isLoading || wrongAnswers.length === 0}
            className="btn-primary py-3.5 px-6 text-xs font-black gap-2 shrink-0 disabled:opacity-50 cursor-pointer shadow-md"
          >
            {isLoading ? (
              <><Loader2 size={16} className="animate-spin" /> Analyzing Patterns...</>
            ) : (
              <><Brain size={16} /> Diagnose My Weak Topics</>
            )}
          </button>
        </div>

        {/* Analysis Results Display */}
        {analysis && (
          <div className="bg-card border border-primary/30 rounded-3xl p-6 space-y-6 shadow-sm">
            <div>
              <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Lightbulb size={14} /> AI Diagnostic Report
              </span>
              <p className="text-sm text-foreground font-semibold leading-relaxed">
                {analysis.overallInsight}
              </p>
            </div>

            {/* Patterns */}
            {analysis.patterns?.length > 0 && (
              <div>
                <h4 className="text-xs font-black text-muted-foreground uppercase tracking-wider mb-2">
                  Key Mistake Patterns Detected
                </h4>
                <div className="grid sm:grid-cols-2 gap-2">
                  {analysis.patterns.map((p, idx) => (
                    <div key={idx} className="p-3 bg-muted/40 border border-border rounded-xl text-xs font-medium text-foreground">
                      • {p}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Weak Topics */}
            {analysis.weakTopics?.length > 0 && (
              <div>
                <h4 className="text-xs font-black text-muted-foreground uppercase tracking-wider mb-2">
                  Priority Topics to Revise
                </h4>
                <div className="space-y-2">
                  {analysis.weakTopics.map((w, idx) => (
                    <div key={idx} className="p-4 bg-muted/20 border border-border rounded-2xl">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-bold text-foreground">{w.topic} ({w.subject})</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${severityColor[w.severity] || 'text-muted-foreground'}`}>
                          {w.severity} Priority
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{w.advice}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Revision Plan */}
            {analysis.revisionPlan?.length > 0 && (
              <div className="pt-2 border-t border-border">
                <h4 className="text-xs font-black text-muted-foreground uppercase tracking-wider mb-2">
                  Actionable 4-Step Revision Plan
                </h4>
                <div className="space-y-1.5">
                  {analysis.revisionPlan.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-foreground">
                      <span className="font-bold text-primary shrink-0">{idx + 1}.</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── GALTI SUDHAR DRILL ENGINE (RE-ATTEMPT VAULT) ── */}
        <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/30 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                <PartyPopper size={12} />
                <span>Galti Sudhar Engine (गलती सुधार)</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-foreground">
                Re-Attempt &amp; Clear Your Mistakes
              </h3>
              <p className="text-xs text-muted-foreground">
                Turn your red wrong answers into green mastery badges. When you re-solve an error, it marks as resolved!
              </p>
            </div>

            <button
              onClick={() => handleStartDrill()}
              disabled={wrongAnswers.length === 0}
              className="btn-primary py-3 px-5 text-xs font-black gap-2 shrink-0 bg-emerald-600 hover:bg-emerald-700 shadow-md cursor-pointer disabled:opacity-50"
            >
              <Award size={15} />
              <span>Launch Galti Sudhar Drill</span>
            </button>
          </div>

          {/* Progress and Counters */}
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-emerald-500/20">
            <div className="p-3 rounded-xl bg-card border border-border/80">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Total Misses</span>
              <p className="text-base font-extrabold text-foreground">{wrongAnswers.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border/80">
              <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">Needs Sudhar</span>
              <p className="text-base font-extrabold text-amber-600 dark:text-amber-400">{pendingCount}</p>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border/80">
              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Mastered (Resolved)</span>
              <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">{resolvedCount}</p>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
              <span>Mistake Clearance Progress</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{clearedPercentage}% Cleared</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${clearedPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Filter Tabs & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-wider">
              Recorded Mistakes ({wrongAnswers.length})
            </h3>
          </div>

          <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/60 text-xs self-start sm:self-auto">
            <button
              onClick={() => setActiveMistakeFilter('all')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activeMistakeFilter === 'all'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All ({wrongAnswers.length})
            </button>
            <button
              onClick={() => setActiveMistakeFilter('pending')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activeMistakeFilter === 'pending'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Needs Sudhar ({pendingCount})
            </button>
            <button
              onClick={() => setActiveMistakeFilter('resolved')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                activeMistakeFilter === 'resolved'
                  ? 'bg-card text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Resolved ({resolvedCount})
            </button>
          </div>
        </div>

        {/* List of Wrong Answers */}
        <div className="space-y-3">
          {loadingMistakes ? (
            <div className="py-12 flex justify-center">
              <Loader2 size={24} className="animate-spin text-muted-foreground" />
            </div>
          ) : wrongAnswers.length === 0 ? (
            <div className="py-12 text-center bg-card border border-border rounded-2xl p-6">
              <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-2 opacity-60" />
              <p className="text-sm font-bold text-foreground">No mistakes recorded!</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Every time you miss a question during practice or tests, it will appear here automatically.
              </p>
            </div>
          ) : (
            wrongAnswers
              .map((w, idx) => ({ ...w, originalIdx: idx }))
              .filter((w) => {
                if (activeMistakeFilter === 'pending') return !resolvedMistakes[w.id];
                if (activeMistakeFilter === 'resolved') return !!resolvedMistakes[w.id];
                return true;
              })
              .map((w) => {
                const isResolved = !!resolvedMistakes[w.id];
                return (
                  <div
                    key={w.id}
                    className={`p-4 bg-card border rounded-2xl shadow-xs transition-all ${
                      isResolved ? 'border-emerald-500/40 bg-emerald-500/[0.02]' : 'border-border'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="font-bold text-primary">{w.subject}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground">{w.topic}</span>
                        {isResolved && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <Check size={11} strokeWidth={3} />
                            <span>सुधार भयो (Resolved)</span>
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemove(w.id)}
                        className="text-xs text-muted-foreground hover:text-rose-600 transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>

                    <div className="text-xs sm:text-sm font-semibold text-foreground leading-relaxed mb-3">
                      <MathText text={w.question} />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300">
                        <span className="font-bold block text-[10px] uppercase">Your Answer</span>
                        <MathText text={w.yourAnswer} />
                      </div>
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                        <span className="font-bold block text-[10px] uppercase">Correct Answer</span>
                        <MathText text={w.correctAnswer} />
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-border/50 flex flex-wrap items-center gap-2">
                      {/* Re-Attempt Galti Sudhar Drill Button */}
                      <button
                        onClick={() => handleStartDrill(w.originalIdx)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all cursor-pointer"
                      >
                        <RefreshCw size={12} />
                        <span>{isResolved ? 'Re-Practice' : '🎯 Galti Sudhar (Re-Attempt)'}</span>
                      </button>

                      <button
                        onClick={() => handleConvertMistakeToFlashcard(w)}
                        disabled={savingFlashcard[w.id] || flashcardSaved[w.id]}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                          flashcardSaved[w.id]
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                            : 'bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border-border'
                        }`}
                      >
                        {savingFlashcard[w.id] ? (
                          <><Loader2 size={12} className="animate-spin" /> Saving Card...</>
                        ) : flashcardSaved[w.id] ? (
                          <><CheckCircle2 size={12} /> Scheduled in Flashcards (SM-2)</>
                        ) : (
                          <><Layers size={12} /> Convert to SM-2 Flashcard</>
                        )}
                      </button>

                      <Link
                        href={`/ai-tutor?doubt=${encodeURIComponent(`I made a mistake during practice on this question and need help understanding the concept:\n\nSubject: ${w.subject} | Topic: ${w.topic}\nQuestion: ${w.question}\nMy Answer: ${w.yourAnswer}\nCorrect Answer: ${w.correctAnswer}`)}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/20 transition-all cursor-pointer ml-auto"
                      >
                        <Sparkles size={12} /> Diagnose with Copilot
                      </Link>
                    </div>
                  </div>
                );
              })
          )}
        </div>

        {/* ── GALTI SUDHAR INTERACTIVE MODAL ── */}
        {drillIndex !== null && wrongAnswers[drillIndex] && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-card border border-border w-full max-w-xl rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
              
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Award size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Mistake #{drillIndex + 1} of {wrongAnswers.length}
                    </span>
                    <h3 className="text-sm font-bold text-foreground">
                      Galti Sudhar Drill • {wrongAnswers[drillIndex].subject}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => setDrillIndex(null)}
                  className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Question Text */}
              <div className="p-4 rounded-2xl bg-muted/30 border border-border/80 text-sm font-semibold text-foreground leading-relaxed">
                <MathText text={wrongAnswers[drillIndex].question} />
              </div>

              {/* Real MCQ Options OR Honest Active Recall Self-Check Mode */}
              {wrongAnswers[drillIndex].options && wrongAnswers[drillIndex].options!.length >= 2 ? (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Select the correct answer to resolve this mistake:
                  </span>
                  
                  {wrongAnswers[drillIndex].options!.map((opt, oIdx) => {
                    const isSelected = drillSelectedOption === opt;
                    const isAnswerCorrect = drillResult === 'correct' && isSelected;
                    const isAnswerWrong = drillResult === 'incorrect' && isSelected;

                    return (
                      <button
                        key={oIdx}
                        onClick={() => handleDrillSubmit(opt)}
                        className={`w-full p-3.5 rounded-xl border text-left text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                          isAnswerCorrect
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-bold'
                            : isAnswerWrong
                            ? 'bg-rose-500/20 border-rose-500 text-rose-800 dark:text-rose-200'
                            : isSelected
                            ? 'bg-primary/10 border-primary text-primary font-bold'
                            : 'bg-background hover:bg-muted/40 border-border text-foreground'
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-md bg-muted text-[11px] font-bold flex items-center justify-center shrink-0">
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <MathText text={opt} />
                        </span>
                        {isAnswerCorrect && <Check size={16} className="text-emerald-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300">
                    <span className="text-[10px] font-bold uppercase block mb-0.5">Your Previous Wrong Answer:</span>
                    <MathText text={wrongAnswers[drillIndex].yourAnswer} />
                  </div>

                  {!recallRevealed ? (
                    <button
                      onClick={() => setRecallRevealed(true)}
                      className="w-full py-3.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-xs font-bold transition-all cursor-pointer"
                    >
                      Recall the Correct Answer Mentally &amp; Click to Reveal
                    </button>
                  ) : (
                    <div className="space-y-3 animate-in fade-in">
                      <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-200">
                        <span className="text-[10px] font-bold uppercase block mb-1 text-emerald-600 dark:text-emerald-400">
                          Verified Correct Answer:
                        </span>
                        <div className="font-bold text-sm">
                          <MathText text={wrongAnswers[drillIndex].correctAnswer} />
                        </div>
                      </div>

                      {drillResult === null && (
                        <div className="grid grid-cols-2 gap-2.5">
                          <button
                            onClick={() => markMistakeResolved(wrongAnswers[drillIndex].id)}
                            className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Check size={14} />
                            <span>I Recalled It Correctly</span>
                          </button>
                          <button
                            onClick={() => {
                              setDrillResult('incorrect');
                              toast('Kept in pending queue for another review.', { icon: '🔄' });
                            }}
                            className="py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer"
                          >
                            Still Learning (Keep Pending)
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Result Notification & Action */}
              {drillResult === 'correct' && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center justify-between gap-3 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <PartyPopper size={20} className="text-emerald-500 shrink-0" />
                    <div>
                      <p className="text-xs font-black">सुधार भयो! Mistake Resolved! 🎉</p>
                      <p className="text-[11px] opacity-80">This question has been successfully cleared from your pending list.</p>
                    </div>
                  </div>
                  <button
                    onClick={handleNextDrillItem}
                    className="btn-primary py-2 px-3 text-xs font-bold shrink-0 bg-emerald-600 hover:bg-emerald-700"
                  >
                    Next Mistake →
                  </button>
                </div>
              )}

              {drillResult === 'incorrect' && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 flex items-center justify-between gap-3 animate-in fade-in">
                  <div>
                    <p className="text-xs font-bold">Needs More Practice!</p>
                    <p className="text-[11px] opacity-80">Review the topic: <strong>{wrongAnswers[drillIndex].topic}</strong></p>
                  </div>
                  <button
                    onClick={() => {
                      setDrillSelectedOption(null);
                      setDrillResult(null);
                      setRecallRevealed(false);
                    }}
                    className="text-xs font-bold text-rose-600 underline"
                  >
                    Reset &amp; Retry
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-border/60">
                <button
                  onClick={() => setDrillIndex(null)}
                  className="text-xs text-muted-foreground hover:text-foreground font-semibold cursor-pointer"
                >
                  Exit Drill
                </button>
                <button
                  onClick={handleNextDrillItem}
                  className="btn-secondary py-2 px-4 text-xs font-bold"
                >
                  Skip Question →
                </button>
              </div>

            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
