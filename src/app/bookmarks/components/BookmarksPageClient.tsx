'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Bookmark, BookmarkX, Loader2, ChevronDown, ChevronUp, CheckCircle2, Zap, Search } from 'lucide-react';

interface BookmarkedQuestion {
  bookmarkId: string;
  questionId: string;
  questionText: string;
  options: { key: string; text: string }[];
  correctOption: string;
  explanation: string | null;
  difficulty: string | null;
  subjectLabel: string | null;
  chapterLabel: string | null;
}

const SUBJECT_COLORS: Record<string, string> = {
  Biology: 'bg-bio-light text-bio',
  Chemistry: 'bg-chem-light text-chem',
  Physics: 'bg-physics-light text-physics',
  'Mental Agility': 'bg-ma-light text-ma',
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-success-light text-success',
  medium: 'bg-warning-light text-warning',
  hard: 'bg-error-light text-error',
};

export default function BookmarksPageClient() {
  const { user } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<BookmarkedQuestion[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

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

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('bookmarks')
        .select(`
          id, question_id, created_at,
          questions (
            id, question_text, option_a, option_b, option_c, option_d,
            correct_option, explanation, difficulty,
            subjects ( display_name ), chapters ( title )
          )
        `)
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });

      if (cancelled) return;
      if (error) {
        console.error('Failed to load bookmarks:', error.message);
        setItems([]);
      } else {
        const mapped: BookmarkedQuestion[] = (data ?? [])
          .filter((row: any) => row.questions)
          .map((row: any) => {
            const q = row.questions;
            return {
              bookmarkId: row.id,
              questionId: row.question_id,
              questionText: q.question_text,
              options: [
                { key: 'a', text: q.option_a },
                { key: 'b', text: q.option_b },
                { key: 'c', text: q.option_c },
                { key: 'd', text: q.option_d },
              ],
              correctOption: (q.correct_option ?? '').toLowerCase(),
              explanation: q.explanation,
              difficulty: q.difficulty,
              subjectLabel: q.subjects?.display_name ?? null,
              chapterLabel: q.chapters?.title ?? null,
            };
          });
        setItems(mapped);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);else next.add(id);
      return next;
    });
  };

  const removeBookmark = async (bookmarkId: string) => {
    setItems((prev) => prev.filter((i) => i.bookmarkId !== bookmarkId));
    const supabase = createClient();
    const { error } = await supabase.from('bookmarks').delete().eq('id', bookmarkId);
    if (error) console.error('Failed to remove bookmark:', error.message);
  };

  const filtered = items.filter(
    (i) => !search || i.questionText.toLowerCase().includes(search.toLowerCase()) || (i.chapterLabel ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout isDark={isDark} onToggleDark={handleToggleDark}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Bookmark size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground leading-none">Bookmarked Questions</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Saved MCQs to revisit and master</p>
          </div>
        </div>

        {/* Search */}
        {items.length > 0 && (
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your bookmarks..."
              className="w-full pl-9 pr-3 py-2.5 text-sm bg-card border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={26} className="animate-spin text-muted-foreground" />
          </div>
        ) : !user ? (
          <div className="text-center py-20">
            <Bookmark size={34} className="text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium text-foreground">Sign in to see your bookmarks</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <Bookmark size={34} className="text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium text-foreground">No bookmarks yet</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">Tap the bookmark icon on any question during practice to save it here.</p>
            <Link href="/practice" className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
              <Zap size={14} /> Start Practicing
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Search size={30} className="text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium text-foreground">No bookmarks match "{search}"</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((q) => {
              const isOpen = expanded.has(q.bookmarkId);
              return (
                <div key={q.bookmarkId} className="bg-card border border-border rounded-2xl overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {q.subjectLabel && (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${SUBJECT_COLORS[q.subjectLabel] ?? 'bg-muted text-muted-foreground'}`}>
                            {q.subjectLabel}
                          </span>
                        )}
                        {q.difficulty && (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${DIFFICULTY_COLORS[q.difficulty] ?? 'bg-muted text-muted-foreground'}`}>
                            {q.difficulty}
                          </span>
                        )}
                        {q.chapterLabel && <span className="text-xs text-muted-foreground">{q.chapterLabel}</span>}
                      </div>
                      <button
                        onClick={() => removeBookmark(q.bookmarkId)}
                        title="Remove bookmark"
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-error hover:bg-error-light transition-colors shrink-0"
                      >
                        <BookmarkX size={16} />
                      </button>
                    </div>
                    <p className="text-sm font-medium text-foreground leading-snug mt-2">{q.questionText}</p>
                    <button
                      onClick={() => toggleExpand(q.bookmarkId)}
                      className="mt-3 flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      {isOpen ? <>Hide answer <ChevronUp size={13} /></> : <>Show answer & explanation <ChevronDown size={13} /></>}
                    </button>
                  </div>

                  {isOpen && (
                    <div className="px-4 pb-4 border-t border-border pt-3 space-y-2">
                      {q.options.map((opt) => {
                        const isCorrect = opt.key === q.correctOption;
                        return (
                          <div
                            key={opt.key}
                            className={`flex items-start gap-2 text-sm rounded-lg px-3 py-2 ${
                              isCorrect ? 'bg-success-light text-success font-medium' : 'bg-muted/50 text-foreground'
                            }`}
                          >
                            <span className="uppercase font-bold shrink-0">{opt.key}.</span>
                            <span className="flex-1">{opt.text}</span>
                            {isCorrect && <CheckCircle2 size={15} className="text-success shrink-0" />}
                          </div>
                        );
                      })}
                      {q.explanation && (
                        <div className="mt-2 bg-secondary/60 rounded-lg px-3 py-2.5">
                          <p className="text-xs font-semibold text-primary mb-1">Explanation</p>
                          <p className="text-sm text-foreground leading-relaxed">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
