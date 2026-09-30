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
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { optionLetterToText } from '@/lib/scoring';
import { MathText } from '@/components/MathText';

interface WrongAnswer {
  question: string;
  subject: string;
  yourAnswer: string;
  correctAnswer: string;
  topic: string;
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

export default function MistakeAnalyserClient() {
  const [isDark, setIsDark] = useState(false);
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([]);
  const [loadingMistakes, setLoadingMistakes] = useState(true);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [expandedTopics, setExpandedTopics] = useState<Set<number>>(new Set());
  const [analysed, setAnalysed] = useState(false);
  const [newEntry, setNewEntry] = useState<Partial<WrongAnswer>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [flashcardSaved, setFlashcardSaved] = useState<Record<number, boolean>>({});
  const [savingFlashcard, setSavingFlashcard] = useState<Record<number, boolean>>({});

  const { user } = useAuth();
  const { response, isLoading, error, sendMessage } = useChat('OPEN_AI', 'gpt-4o', false);

  const handleConvertMistakeToFlashcard = async (w: WrongAnswer, index: number) => {
    if (flashcardSaved[index]) return;
    setSavingFlashcard((prev) => ({ ...prev, [index]: true }));
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
        setFlashcardSaved((prev) => ({ ...prev, [index]: true }));
        toast.success(data.message || 'Converted mistake into an active SM-2 Flashcard!');
      } else {
        toast.error(data.details || 'Could not save flashcard');
      }
    } catch {
      toast.error('Failed to convert mistake to flashcard');
    } finally {
      setSavingFlashcard((prev) => ({ ...prev, [index]: false }));
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
          if (!row.questions || seen.has(row.question_id)) continue;
          seen.add(row.question_id);

          const q = row.questions;
          const yourAnsText = optionLetterToText(q, row.selected_option);
          const correctAnsText = optionLetterToText(q, q.correct_answer || 'A');

          real.push({
            question: q.question_text || '',
            subject: row.subjects?.display_name ?? 'General',
            yourAnswer: yourAnsText,
            correctAnswer: correctAnsText,
            topic: q.chapters?.title ?? row.subjects?.display_name ?? 'General',
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
    setWrongAnswers((prev) => [newEntry as WrongAnswer, ...prev]);
    setNewEntry({});
    setShowAddForm(false);
    setAnalysis(null);
    toast.success('Added mistake entry');
  };

  const handleRemove = (i: number) => {
    setWrongAnswers((prev) => prev.filter((_, idx) => idx !== i));
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

        {/* List of Wrong Answers */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-muted-foreground uppercase tracking-wider">
            Recent Practice Misses ({wrongAnswers.length})
          </h3>

          {loadingMistakes ? (
            <div className="py-12 flex justify-center">
              <Loader2 size={24} className="animate-spin text-muted-foreground" />
            </div>
          ) : wrongAnswers.length === 0 ? (
            <div className="py-12 text-center bg-card border border-border rounded-2xl p-6">
              <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-2 opacity-60" />
              <p className="text-sm font-bold text-foreground">No mistakes recorded!</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Every time you miss a question during practice, it will appear here automatically.
              </p>
            </div>
          ) : (
            wrongAnswers.map((w, idx) => (
              <div key={idx} className="p-4 bg-card border border-border rounded-2xl shadow-xs">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="font-bold text-primary">{w.subject}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">{w.topic}</span>
                  </div>
                  <button
                    onClick={() => handleRemove(idx)}
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
                  <button
                    onClick={() => handleConvertMistakeToFlashcard(w, idx)}
                    disabled={savingFlashcard[idx] || flashcardSaved[idx]}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      flashcardSaved[idx]
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                        : 'bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border-border'
                    }`}
                  >
                    {savingFlashcard[idx] ? (
                      <><Loader2 size={12} className="animate-spin" /> Saving Card...</>
                    ) : flashcardSaved[idx] ? (
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
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
