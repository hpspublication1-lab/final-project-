'use client';

import React, { useState, useEffect } from 'react';
import { useChat } from '@/lib/hooks/useChat';
import DashboardLayout from '@/components/DashboardLayout';
import { AlertTriangle, TrendingUp, Loader2, ChevronDown, ChevronUp, Target, BookOpen, FlaskConical, Atom, Brain, Lightbulb, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { optionLetterToText } from '@/lib/scoring';


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

const SUBJECT_ICONS: Record<string, React.ElementType> = {
  Biology: BookOpen,
  Chemistry: FlaskConical,
  Physics: Atom,
  'Mental Agility': Brain,
};

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

  const { user } = useAuth();
  const { response, isLoading, error, sendMessage } = useChat('OPEN_AI', 'gpt-4o', false);

  // Load the student's real wrong answers from their practice history
  // (manual entries via "Add Wrong Answer" are appended on top, in-memory only)
  useEffect(() => {
    if (!user?.id) {
      setLoadingMistakes(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingMistakes(true);
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from('practice_attempts')
        .select(`
          question_id, selected_option, created_at,
          questions ( question_text, option_a, option_b, option_c, option_d, correct_option, chapter_id, chapters ( title ) ),
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
          real.push({
            question: row.questions.question_text,
            subject: row.subjects?.display_name ?? 'General',
            yourAnswer: optionLetterToText(row.questions, row.selected_option),
            correctAnswer: optionLetterToText(row.questions, row.questions.correct_option),
            topic: row.questions.chapters?.title ?? row.subjects?.display_name ?? 'General',
          });
          if (real.length >= 20) break;
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
  }, [response, isLoading]);

  const handleAnalyse = () => {
    if (wrongAnswers.length < 3) {
      toast.error('Add at least 3 wrong answers to analyse patterns.');
      return;
    }
    setAnalysed(true);
    setAnalysis(null);

    const prompt = `You are an expert CEE exam coach. Analyse these wrong answers from a student and identify mistake patterns.

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
  "revisionPlan": ["Step 1", "Step 2", "Step 3", "Step 4", "Step 5"]
}

Severity: High = 3+ mistakes, Medium = 2 mistakes, Low = 1 mistake but important topic.`;

    sendMessage([{ role: 'user', content: prompt }], { max_completion_tokens: 2000 });
  };

  const handleAddEntry = () => {
    if (!newEntry.question || !newEntry.subject || !newEntry.yourAnswer || !newEntry.correctAnswer || !newEntry.topic) {
      toast.error('Please fill all fields');
      return;
    }
    setWrongAnswers((prev) => [...prev, newEntry as WrongAnswer]);
    setNewEntry({});
    setShowAddForm(false);
    setAnalysis(null);
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
    High: 'text-error bg-error-light border-error/20',
    Medium: 'text-warning bg-warning-light border-warning/20',
    Low: 'text-success bg-success-light border-success/20',
  };

  return (
    <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-error-light flex items-center justify-center">
              <AlertTriangle size={20} className="text-error" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground leading-none">Mistake Analyser</h1>
              <p className="text-xs text-muted-foreground mt-0.5">AI detects patterns in your wrong answers</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-primary text-sm py-2 px-4"
          >
            + Add Wrong Answer
          </button>
        </div>

        {/* Add form */}
        {showAddForm && (
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <p className="text-sm font-bold text-foreground">Add Wrong Answer</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                className="input-field text-sm"
                placeholder="Question text"
                value={newEntry.question || ''}
                onChange={(e) => setNewEntry((p) => ({ ...p, question: e.target.value }))}
              />
              <select
                className="input-field text-sm"
                value={newEntry.subject || ''}
                onChange={(e) => setNewEntry((p) => ({ ...p, subject: e.target.value }))}
              >
                <option value="">Select Subject</option>
                {['Biology', 'Chemistry', 'Physics', 'Mental Agility'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <input
                className="input-field text-sm"
                placeholder="Topic / Chapter"
                value={newEntry.topic || ''}
                onChange={(e) => setNewEntry((p) => ({ ...p, topic: e.target.value }))}
              />
              <input
                className="input-field text-sm"
                placeholder="Your wrong answer"
                value={newEntry.yourAnswer || ''}
                onChange={(e) => setNewEntry((p) => ({ ...p, yourAnswer: e.target.value }))}
              />
              <input
                className="input-field text-sm sm:col-span-2"
                placeholder="Correct answer"
                value={newEntry.correctAnswer || ''}
                onChange={(e) => setNewEntry((p) => ({ ...p, correctAnswer: e.target.value }))}
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleAddEntry} className="btn-primary text-sm py-2 px-4">Add</button>
              <button onClick={() => setShowAddForm(false)} className="btn-secondary text-sm py-2 px-4">Cancel</button>
            </div>
          </div>
        )}

        {/* Wrong answers list */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <p className="text-sm font-bold text-foreground">{wrongAnswers.length} Wrong Answers Logged</p>
            <button
              onClick={handleAnalyse}
              disabled={isLoading || wrongAnswers.length < 3}
              className="flex items-center gap-2 btn-primary text-sm py-2 px-4 disabled:opacity-50"
            >
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Target size={14} />}
              {isLoading ? 'Analysing…' : 'Analyse Patterns'}
            </button>
          </div>
          {loadingMistakes ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={20} className="animate-spin text-muted-foreground" />
            </div>
          ) : wrongAnswers.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-10 px-5">
              <CheckCircle2 size={26} className="text-success opacity-70 mb-2" />
              <p className="text-sm text-foreground font-medium">No wrong answers on record yet</p>
              <p className="text-xs text-muted-foreground mt-1">Practice some MCQs, or add a mistake manually above, then come back to analyse patterns.</p>
            </div>
          ) : (
          <div className="divide-y divide-border">
            {wrongAnswers.map((w, i) => {
              const Icon = SUBJECT_ICONS[w.subject] || BookOpen;
              return (
                <div key={i} className="flex items-start gap-3 px-5 py-3 hover:bg-muted/50 transition-colors">
                  <Icon size={15} className={`mt-0.5 shrink-0 ${
                    w.subject === 'Biology' ? 'text-bio' :
                    w.subject === 'Chemistry' ? 'text-chem' :
                    w.subject === 'Physics' ? 'text-physics' : 'text-ma'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-snug truncate">{w.question}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-muted-foreground">{w.subject} · {w.topic}</span>
                      <span className="text-xs text-error">You: {w.yourAnswer}</span>
                      <span className="text-xs text-success">Correct: {w.correctAnswer}</span>
                    </div>
                  </div>
                  <button onClick={() => handleRemove(i)} className="text-muted-foreground hover:text-error text-xs shrink-0">✕</button>
                </div>
              );
            })}
          </div>
          )}
        </div>

        {/* Analysis results */}
        {analysis && (
          <div className="space-y-4">
            {/* Overall insight */}
            <div className="bg-secondary border border-primary/20 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} className="text-primary" />
                <p className="text-sm font-bold text-primary">AI Analysis</p>
              </div>
              <p className="text-sm text-foreground leading-relaxed">{analysis.overallInsight}</p>
            </div>

            {/* Patterns */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <p className="text-sm font-bold text-foreground mb-3">Mistake Patterns Detected</p>
              <div className="space-y-2">
                {analysis.patterns?.map((p, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-lg bg-error-light text-error text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    <p className="text-sm text-foreground leading-relaxed">{p}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Weak topics */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-border">
                <p className="text-sm font-bold text-foreground">Weak Topics — Personalised Coaching</p>
              </div>
              <div className="divide-y divide-border">
                {analysis.weakTopics?.map((t, i) => (
                  <div key={i} className="px-5 py-3">
                    <button
                      onClick={() => toggleTopic(i)}
                      className="w-full flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${severityColor[t.severity]}`}>{t.severity}</span>
                        <span className="text-sm font-semibold text-foreground">{t.topic}</span>
                        <span className="text-xs text-muted-foreground">· {t.subject}</span>
                      </div>
                      {expandedTopics.has(i) ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
                    </button>
                    {expandedTopics.has(i) && (
                      <div className="mt-3 flex items-start gap-2 bg-muted rounded-xl px-3 py-2.5">
                        <Lightbulb size={14} className="text-ma shrink-0 mt-0.5" />
                        <p className="text-sm text-foreground leading-relaxed">{t.advice}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Revision plan */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <p className="text-sm font-bold text-foreground mb-3">Personalised Revision Plan</p>
              <div className="space-y-2">
                {analysis.revisionPlan?.map((step, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-xl bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    <p className="text-sm text-foreground leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
