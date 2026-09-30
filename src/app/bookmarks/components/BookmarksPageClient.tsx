'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Bookmark, BookmarkX, Loader2, ChevronDown, ChevronUp, CheckCircle2, Zap, Search, Play } from 'lucide-react';
import { MathText } from '@/components/MathText';
import toast from 'react-hot-toast';

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
  Biology: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
  Chemistry: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
  Physics: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20',
  'Mental Agility': 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20',
  'Compulsory Science': 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20',
  'Compulsory Mathematics': 'bg-amber-500/10 text-amber-600 border border-amber-500/20',
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-emerald-500/10 text-emerald-600',
  medium: 'bg-amber-500/10 text-amber-600',
  hard: 'bg-rose-500/10 text-rose-600',
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
      try {
        const res = await fetch('/api/bookmarks');
        if (cancelled) return;
        if (!res.ok) {
          setItems([]);
          setLoading(false);
          return;
        }
        const data = await res.json();
        const bms = data.bookmarks || [];
        const mapped: BookmarkedQuestion[] = bms.map((bm: any) => ({
          bookmarkId: bm.id,
          questionId: bm.resource_id,
          questionText: bm.question?.question_text || '',
          options: bm.question?.options || [],
          correctOption: String(bm.question?.correct_answer || 'a').toLowerCase().trim(),
          explanation: bm.question?.explanation || null,
          difficulty: bm.question?.difficulty || 'medium',
          subjectLabel: bm.question?.subject_name || null,
          chapterLabel: bm.question?.chapter_title || null,
        }));
        setItems(mapped);
      } catch (err) {
        console.error('Failed to load bookmarks:', err);
        setItems([]);
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
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const removeBookmark = async (bookmarkId: string) => {
    setItems((prev) => prev.filter((i) => i.bookmarkId !== bookmarkId));
    const supabase = createClient();
    const { error } = await supabase.from('bookmarks').delete().eq('id', bookmarkId);
    if (error) {
      console.error('Failed to remove bookmark:', error.message);
      toast.error('Could not remove bookmark');
    } else {
      toast.success('Bookmark removed');
    }
  };

  const filtered = items.filter(
    (i) =>
      !search ||
      i.questionText.toLowerCase().includes(search.toLowerCase()) ||
      (i.chapterLabel ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (i.subjectLabel ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout isDark={isDark} onToggleDark={handleToggleDark}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Bookmark size={24} className="text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-foreground">Saved Question Bookmarks</h1>
              <p className="text-xs text-muted-foreground mt-0.5">High-yield MCQs pinned for rapid revision before exams</p>
            </div>
          </div>
          {items.length > 0 && (
            <Link
              href="/practice"
              className="btn-primary py-2.5 px-4 text-xs font-bold gap-2 shrink-0 self-start sm:self-auto"
            >
              <Play size={14} fill="currentColor" /> Practice Questions
            </Link>
          )}
        </div>

        {/* Search */}
        {items.length > 0 && (
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by topic, keyword, or question text..."
              className="w-full pl-10 pr-4 py-3 text-sm bg-card border border-border rounded-2xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-xs"
            />
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-muted-foreground" />
          </div>
        ) : !user ? (
          <div className="text-center py-20 bg-card border border-border rounded-3xl p-8">
            <Bookmark size={40} className="text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-base font-bold text-foreground">Sign in to view your bookmarks</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">Your saved questions sync across all your devices.</p>
            <Link href="/auth/login" className="btn-primary py-2.5 px-5 text-xs font-bold">
              Sign In
            </Link>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 bg-card border border-border rounded-3xl p-8">
            <Bookmark size={40} className="text-muted-foreground mx-auto mb-3 opacity-30" />
            <p className="text-base font-bold text-foreground">No bookmarked questions yet</p>
            <p className="text-xs text-muted-foreground mt-1 mb-5 max-w-sm mx-auto">
              Tap the bookmark icon while solving questions in the practice engine to save them here for quick revision.
            </p>
            <Link href="/practice" className="btn-primary py-2.5 px-5 text-xs font-bold gap-2">
              <Zap size={14} /> Start Practicing Now
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Search size={32} className="text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-sm font-bold text-foreground">No bookmarks match "{search}"</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((q) => {
              const isOpen = expanded.has(q.bookmarkId);
              return (
                <div key={q.bookmarkId} className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {q.subjectLabel && (
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${SUBJECT_COLORS[q.subjectLabel] ?? 'bg-muted text-muted-foreground'}`}>
                            {q.subjectLabel}
                          </span>
                        )}
                        {q.difficulty && (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${DIFFICULTY_COLORS[q.difficulty] ?? 'bg-muted text-muted-foreground'}`}>
                            {q.difficulty}
                          </span>
                        )}
                        {q.chapterLabel && <span className="text-xs text-muted-foreground font-medium">· {q.chapterLabel}</span>}
                      </div>
                      <button
                        onClick={() => removeBookmark(q.bookmarkId)}
                        title="Remove bookmark"
                        className="p-1.5 rounded-xl text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-colors shrink-0"
                      >
                        <BookmarkX size={18} />
                      </button>
                    </div>

                    <div className="text-sm sm:text-base font-semibold text-foreground leading-relaxed">
                      <MathText text={q.questionText} />
                    </div>

                    <button
                      onClick={() => toggleExpand(q.bookmarkId)}
                      className="mt-4 flex items-center gap-1.5 text-xs font-bold text-primary hover:underline cursor-pointer"
                    >
                      {isOpen ? <>Hide answer and solution <ChevronUp size={14} /></> : <>Show answer &amp; step-by-step solution <ChevronDown size={14} /></>}
                    </button>
                  </div>

                  {isOpen && (
                    <div className="px-5 pb-5 border-t border-border pt-4 space-y-2 bg-muted/10">
                      {q.options.map((opt) => {
                        const isCorrect = opt.key.toLowerCase() === q.correctOption.toLowerCase();
                        return (
                          <div
                            key={opt.key}
                            className={`flex items-start gap-2.5 text-xs sm:text-sm rounded-xl px-3.5 py-2.5 ${
                              isCorrect ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30' : 'bg-muted/30 text-foreground'
                            }`}
                          >
                            <span className="uppercase font-black shrink-0">{opt.key}.</span>
                            <div className="flex-1"><MathText text={opt.text} /></div>
                            {isCorrect && <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />}
                          </div>
                        );
                      })}
                      {q.explanation && (
                        <div className="mt-3 bg-card border border-border rounded-xl p-3.5 text-xs leading-relaxed text-foreground">
                          <p className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider mb-1">
                            Explanation
                          </p>
                          <MathText text={q.explanation} />
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
