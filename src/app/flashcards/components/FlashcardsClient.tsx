'use client';

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { reviewCard, sm2StateFromRow, type Sm2Quality } from '@/lib/srs/sm2';
import { Layers, Loader2, RotateCcw, PartyPopper, Lightbulb, ChevronRight } from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface CardRow {
  id: string;
  front: string;
  back: string;
  hint: string | null;
  image_url: string | null;
  subjectLabel: string | null;
  /** Existing SM-2 state (null = never reviewed). */
  review: { ease_factor: number; interval_days: number; repetitions: number } | null;
}

const SUBJECT_COLORS: Record<string, string> = {
  Biology: 'bg-bio-light text-bio',
  Chemistry: 'bg-chem-light text-chem',
  Physics: 'bg-physics-light text-physics',
  'Mental Agility': 'bg-ma-light text-ma',
};

const GRADES: { label: string; quality: Sm2Quality; className: string; hintText: string }[] = [
  { label: 'Again', quality: 1, className: 'bg-error-light text-error border-error/25', hintText: 'Forgot it' },
  { label: 'Hard', quality: 3, className: 'bg-warning-light text-warning border-warning/25', hintText: 'Barely recalled' },
  { label: 'Good', quality: 4, className: 'bg-secondary text-primary border-primary/25', hintText: 'Recalled with effort' },
  { label: 'Easy', quality: 5, className: 'bg-success-light text-success border-success/25', hintText: 'Instant recall' },
];

const SESSION_SIZE = 20;

function MathText({ text }: { text: string }) {
  const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[^$]+?\$)/);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          return <span key={i} dangerouslySetInnerHTML={{ __html: katex.renderToString(part.slice(2, -2), { throwOnError: false, displayMode: true }) }} />;
        }
        if (part.startsWith('$') && part.endsWith('$')) {
          return <span key={i} dangerouslySetInnerHTML={{ __html: katex.renderToString(part.slice(1, -1), { throwOnError: false }) }} />;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

export default function FlashcardsClient() {
  const { user } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState<CardRow[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [totalDue, setTotalDue] = useState(0);
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [uniqueSubjects, setUniqueSubjects] = useState<string[]>([]);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    setIsDark(stored === 'dark');
  }, []);
  const handleToggleDark = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', next);
  };

  // ── Build the session queue: due reviews first, then unseen cards ──────────
  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const supabase = createClient();

      const [cardsRes, reviewsRes] = await Promise.all([
        supabase
          .from('flashcards')
          .select('id, front, back, hint, image_url, subjects(display_name)')
          .eq('is_active', true)
          .limit(400),
        supabase
          .from('flashcard_reviews')
          .select('flashcard_id, ease_factor, interval_days, repetitions, due_at')
          .eq('student_id', user.id),
      ]);
      if (cancelled) return;

      const reviewByCard = new Map(
        (reviewsRes.data ?? []).map((r: any) => [r.flashcard_id, r])
      );
      const now = Date.now();

      const all: CardRow[] = (cardsRes.data ?? []).map((c: any) => ({
        id: c.id,
        front: c.front,
        back: c.back,
        hint: c.hint,
        image_url: c.image_url,
        subjectLabel: (Array.isArray(c.subjects) ? c.subjects[0] : c.subjects)?.display_name ?? null,
        review: reviewByCard.get(c.id) ?? null,
      }));

      const due = all.filter((c) => c.review && new Date((reviewByCard.get(c.id) as any).due_at).getTime() <= now);
      const unseen = all.filter((c) => !c.review);
      // Not-due cards are excluded — that's the whole point of spaced repetition.

      const subjects = Array.from(new Set(all.map(c => c.subjectLabel).filter(Boolean))) as string[];
      setUniqueSubjects(subjects);

      let filtered = [...due, ...unseen];
      if (filterSubject !== 'all') {
        filtered = filtered.filter((c) => c.subjectLabel === filterSubject);
      }

      const session = filtered.slice(0, SESSION_SIZE);

      setTotalDue(filtered.length);
      setQueue(session);
      setIdx(0);
      setReviewedCount(0);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user?.id, filterSubject]);

  const current = queue[idx] ?? null;

  const grade = useCallback(async (quality: Sm2Quality) => {
    if (!current || !user?.id) return;
    const next = reviewCard(sm2StateFromRow(current.review), quality);

    // Persist (upsert per student+card); optimistic UI advance.
    const supabase = createClient();
    supabase
      .from('flashcard_reviews')
      .upsert(
        {
          student_id: user.id,
          flashcard_id: current.id,
          ease_factor: next.easeFactor,
          interval_days: next.intervalDays,
          repetitions: next.repetitions,
          due_at: next.dueAt,
          last_grade: next.lastGrade,
          last_reviewed_at: new Date().toISOString(),
        },
        { onConflict: 'student_id,flashcard_id' }
      )
      .then(({ error }: any) => {
        if (error) console.error('Failed to save review:', error.message);
      });

    setReviewedCount((n) => n + 1);
    setFlipped(false);
    setShowHint(false);
    setIdx((i) => i + 1);
  }, [current, user?.id]);

  const sessionDone = !loading && queue.length > 0 && idx >= queue.length;
  const progressPct = queue.length > 0 ? Math.round((Math.min(idx, queue.length) / queue.length) * 100) : 0;

  return (
    <DashboardLayout isDark={isDark} onToggleDark={handleToggleDark}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Layers size={20} className="text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground leading-none">Flashcards</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Spaced repetition (SM-2) — review at the perfect moment</p>
            </div>
          </div>
          {!loading && queue.length > 0 && !sessionDone && (
            <span className="text-xs font-bold text-primary bg-secondary px-2.5 py-1 rounded-full">
              {Math.min(idx + 1, queue.length)} / {queue.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 mb-4">
          <label className="text-sm font-semibold text-foreground">Filter by Subject:</label>
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-sm bg-muted border border-border text-foreground"
          >
            <option value="all">All Subjects</option>
            {uniqueSubjects.map(sub => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </div>

        {/* Progress */}
        {!loading && queue.length > 0 && (
          <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-6">
            <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={26} className="animate-spin text-muted-foreground" />
          </div>
        ) : !user ? (
          <div className="text-center py-24">
            <Layers size={34} className="text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium text-foreground">Sign in to review flashcards</p>
          </div>
        ) : queue.length === 0 ? (
          <div className="text-center py-24">
            <PartyPopper size={34} className="text-success mx-auto mb-3 opacity-80" />
            <p className="text-base font-semibold text-foreground">Nothing due right now</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              {totalDue === 0
                ? 'All caught up — or no flashcards have been added yet. New cards appear here as your teachers add them.'
                : 'Come back later — spaced repetition schedules each card at the moment you\'re about to forget it.'}
            </p>
          </div>
        ) : sessionDone ? (
          <div className="text-center py-20">
            <PartyPopper size={36} className="text-success mx-auto mb-4" />
            <p className="text-xl font-extrabold text-foreground">Session complete!</p>
            <p className="text-sm text-muted-foreground mt-2">You reviewed {reviewedCount} {reviewedCount === 1 ? 'card' : 'cards'}. Each one is now rescheduled at its optimal interval.</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary gap-2 mt-6"
            >
              <RotateCcw size={15} /> Start another session
            </button>
          </div>
        ) : current ? (
          <>
            {/* Card */}
            <button
              onClick={() => setFlipped((f) => !f)}
              className="w-full bg-card border border-border rounded-3xl shadow-elevated p-8 sm:p-10 min-h-[300px] flex flex-col items-center justify-center text-center transition-all hover:shadow-floating cursor-pointer"
            >
              {current.subjectLabel && (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full mb-5 ${SUBJECT_COLORS[current.subjectLabel] ?? 'bg-muted text-muted-foreground'}`}>
                  {current.subjectLabel}
                </span>
              )}
              {!flipped ? (
                <>
                  <p className="text-lg sm:text-xl font-bold text-foreground leading-relaxed"><MathText text={current.front} /></p>
                  {current.image_url && (
                    <img 
                      src={current.image_url} 
                      alt="" 
                      className="mt-5 max-h-44 rounded-xl object-contain cursor-pointer hover:opacity-80 transition-opacity" 
                      onClick={(e) => { e.stopPropagation(); setZoomImage(current.image_url!); }}
                    />
                  )}
                  <p className="text-xs text-muted-foreground mt-6 flex items-center gap-1">
                    Tap to reveal answer <ChevronRight size={12} />
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-2"><MathText text={current.front} /></p>
                  <p className="text-lg sm:text-xl font-bold text-primary leading-relaxed"><MathText text={current.back} /></p>
                </>
              )}
            </button>

            {/* Hint */}
            {!flipped && current.hint && (
              <div className="mt-3 text-center">
                {showHint ? (
                  <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
                    <Lightbulb size={14} className="text-ma" /> {current.hint}
                  </p>
                ) : (
                  <button onClick={() => setShowHint(true)} className="text-xs font-semibold text-primary hover:underline">
                    Show hint
                  </button>
                )}
              </div>
            )}

            {/* Grading */}
            {flipped && (
              <div className="mt-5 grid grid-cols-4 gap-2.5">
                {GRADES.map((g) => (
                  <button
                    key={g.label}
                    onClick={() => grade(g.quality)}
                    className={`flex flex-col items-center gap-0.5 py-3 rounded-2xl border font-bold text-sm transition-transform hover:-translate-y-0.5 ${g.className}`}
                  >
                    {g.label}
                    <span className="text-[10px] font-medium opacity-75">{g.hintText}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : null}
      </div>
      {zoomImage && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setZoomImage(null)}>
          <img src={zoomImage} alt="" className="max-w-full max-h-full object-contain rounded-xl" />
        </div>
      )}
    </DashboardLayout>
  );
}
