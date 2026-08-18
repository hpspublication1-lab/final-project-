'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { CheckCircle2, XCircle, ChevronRight, Zap, Clock, Target, Shuffle, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface DemoQuestion {
  id: string;
  subject: string;
  chapter: string;
  difficulty: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

// Shown only if the live fetch fails or the bank is empty — the demo never breaks.
const FALLBACK: DemoQuestion[] = [
  {
    id: 'fallback-1',
    subject: 'Biology',
    chapter: 'Cell Biology',
    difficulty: 'medium',
    question: 'Which organelle modifies, sorts, and packages proteins for secretion?',
    options: ['Ribosome', 'Golgi apparatus', 'Mitochondrion', 'Lysosome'],
    correctIndex: 1,
    explanation: 'The Golgi apparatus glycosylates, sorts, and packages proteins from the ER into vesicles for secretion or delivery to other organelles.',
  },
];

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

/** correct_answer may be a letter ("B"), an index ("1"), or the option text. */
function resolveCorrectIndex(correct: unknown, options: string[]): number {
  if (typeof correct === 'number') return correct;
  const s = String(correct ?? '').trim();
  if (/^[A-Ea-e]$/.test(s)) return s.toUpperCase().charCodeAt(0) - 65;
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  const byText = options.findIndex((o) => o?.trim() === s);
  return byText >= 0 ? byText : 0;
}

export default function MCQPreviewSection() {
  const [pool, setPool] = useState<DemoQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const supabase = createClient();
        const [{ data: qs }, { data: subs }, { data: chs }] = await Promise.all([
          supabase
            .from('questions')
            .select('id, question_text, options, correct_answer, explanation, difficulty, subject_id, chapter_id')
            .eq('is_published', true)
            .limit(60),
          supabase.from('subjects').select('id, display_name'),
          supabase.from('chapters').select('id, title'),
        ]);

        const subMap = new Map((subs ?? []).map((s: any) => [s.id, s.display_name]));
        const chMap = new Map((chs ?? []).map((c: any) => [c.id, c.title]));

        const normalized: DemoQuestion[] = (qs ?? [])
          .filter((q: any) => Array.isArray(q.options) && q.options.length >= 2 && q.question_text)
          .map((q: any) => ({
            id: q.id,
            subject: subMap.get(q.subject_id) ?? 'CEE',
            chapter: chMap.get(q.chapter_id) ?? 'Practice',
            difficulty: q.difficulty ?? 'medium',
            question: q.question_text,
            options: q.options,
            correctIndex: resolveCorrectIndex(q.correct_answer, q.options),
            explanation: q.explanation ?? '',
          }));

        if (!active) return;
        const usable = normalized.length > 0 ? normalized : FALLBACK;
        // Start on a random question so every visitor sees a different one.
        setPool(usable);
        setIdx(Math.floor(Math.random() * usable.length));
      } catch {
        if (active) {
          setPool(FALLBACK);
          setIdx(0);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const current = pool[idx];

  const handleOption = (i: number) => {
    if (revealed) return;
    setSelected(i);
    setRevealed(true);
  };

  const nextQuestion = useCallback(() => {
    setSelected(null);
    setRevealed(false);
    setPool((p) => {
      if (p.length <= 1) return p;
      setIdx((cur) => {
        let n = cur;
        while (n === cur) n = Math.floor(Math.random() * p.length);
        return n;
      });
      return p;
    });
  }, []);

  const isCorrect = selected !== null && current && selected === current.correctIndex;

  return (
    <section id="practice" className="py-20 bg-muted/30 relative overflow-hidden w-full max-w-full">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — copy */}
          <div className="space-y-6">
            <span className="inline-flex items-center gap-1.5 bg-secondary text-primary font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wider">
              <Zap size={13} /> MCQ Practice Engine
            </span>
            <h2 className="text-hero-md text-foreground font-black tracking-tight">
              15,000+ Questions with{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Detailed Explanations
              </span>
            </h2>
            <p className="text-muted-foreground leading-relaxed text-base">
              Every MCQ is curated, reviewed, and explained by top CEE toppers. Practice chapter-wise, filter by difficulty, or simulate authentic CEE time limits with real-time scoring.
            </p>

            <div className="grid grid-cols-3 gap-3.5">
              {[
                { key: 'feat-adaptive', icon: Target, label: 'Adaptive Engine', color: 'text-primary', bg: 'bg-secondary' },
                { key: 'feat-timed', icon: Clock, label: 'Timed Sets', color: 'text-bio', bg: 'bg-bio-light' },
                { key: 'feat-prev', icon: Zap, label: 'Past CEE Papers', color: 'text-ma', bg: 'bg-ma-light' },
              ].map((f) => (
                <div key={f.key} className="glass-card-interactive rounded-2xl text-center py-4 px-2 border border-border/80">
                  <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center mx-auto mb-2 shadow-xs`}>
                    <f.icon size={20} className={f.color} />
                  </div>
                  <p className="text-xs font-extrabold text-foreground">{f.label}</p>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <Link href="/practice" className="btn-primary gap-2 text-base py-3.5 px-7 font-bold shadow-md">
                Start Practice MCQs
                <ChevronRight size={18} />
              </Link>
            </div>
          </div>

          {/* Right — Interactive MCQ Card */}
          <div className="glass-card-interactive rounded-3xl p-6 sm:p-7 border border-primary/20 shadow-xl bg-card min-h-[380px]">
            {loading || !current ? (
              <div className="flex flex-col items-center justify-center h-[340px] gap-3 text-muted-foreground">
                <Loader2 size={28} className="animate-spin text-primary" />
                <p className="text-sm font-medium">Loading a live question…</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="bg-bio-light text-bio text-xs font-bold px-2.5 py-1 rounded-md shrink-0">
                      {current.subject}
                    </span>
                    <span className="text-xs text-muted-foreground font-semibold truncate">
                      {current.chapter}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-primary bg-secondary px-2.5 py-0.5 rounded-full capitalize shrink-0">
                    {current.difficulty}
                  </span>
                </div>

                <p className="text-foreground font-bold text-sm sm:text-base mb-5 leading-snug">
                  {current.question}
                </p>

                <div className="space-y-2.5 mb-5">
                  {current.options.map((text, i) => {
                    let style = 'bg-card border-border hover:border-primary/50 text-foreground';
                    if (revealed) {
                      if (i === current.correctIndex) {
                        style = 'bg-success-light border-success text-success font-bold';
                      } else if (i === selected && !isCorrect) {
                        style = 'bg-error-light border-error text-error font-bold';
                      } else {
                        style = 'bg-card border-border opacity-50';
                      }
                    }
                    return (
                      <button
                        key={i}
                        onClick={() => handleOption(i)}
                        disabled={revealed}
                        className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm transition-all flex items-start justify-between gap-3 ${style}`}
                      >
                        <span className="flex items-start gap-3">
                          <span className="w-5 h-5 rounded-md border border-current flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                            {LETTERS[i]}
                          </span>
                          <span>{text}</span>
                        </span>
                        {revealed && i === current.correctIndex && (
                          <CheckCircle2 size={18} className="text-success shrink-0 mt-0.5" />
                        )}
                        {revealed && i === selected && !isCorrect && (
                          <XCircle size={18} className="text-error shrink-0 mt-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {revealed && current.explanation && (
                  <div className={`p-4 rounded-xl border text-xs sm:text-sm animate-fade-in ${
                    isCorrect ? 'bg-success-light border-success/30 text-success' : 'bg-error-light border-error/30 text-error'
                  }`}>
                    <p className="font-bold mb-1 flex items-center gap-1.5">
                      {isCorrect ? '🎉 Correct Answer!' : '❌ Incorrect Answer'}
                    </p>
                    <p className="text-muted-foreground leading-relaxed text-xs">
                      {current.explanation}
                    </p>
                  </div>
                )}

                <button
                  onClick={nextQuestion}
                  className="mt-3 w-full btn-secondary text-xs sm:text-sm py-2 font-semibold gap-2"
                >
                  <Shuffle size={15} />
                  {revealed ? 'Try Another Question' : 'Skip to Another Question'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
