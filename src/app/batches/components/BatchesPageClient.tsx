'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Search, Calendar, CheckCircle2, Loader2, GraduationCap, Layers,
  UserRound, Video, Sparkles, BookOpen, Tv, ArrowRight,
  ShieldCheck, Check, Globe, Play
} from 'lucide-react';

interface BatchSubject {
  display_name: string;
  icon: string | null;
  color: string | null;
}

interface Batch {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  cee_year: number | null;
  instructor_name: string | null;
  thumbnail_url: string | null;
  start_date: string | null;
  end_date: string | null;
  price_npr: number;
  is_premium: boolean;
  program_type?: string;
  subject?: BatchSubject | BatchSubject[] | null;
}

function getSubject(batch: Batch): BatchSubject | null {
  if (!batch.subject) return null;
  return Array.isArray(batch.subject) ? batch.subject[0] ?? null : batch.subject;
}

function formatDateRange(start: string | null, end: string | null): string | null {
  if (!start && !end) return null;
  const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  if (start && end) return `${fmt(start)} — ${fmt(end)}`;
  return fmt(start || end!);
}

export default function BatchesPageClient() {
  const [isDark, setIsDark] = useState(false);
  const { user } = useAuth();

  const [batches, setBatches] = useState<Batch[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [mediumFilter, setMediumFilter] = useState<'all' | 'english' | 'nepali'>('all');
  const [tab, setTab] = useState<'all' | 'enrolled'>('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    const { data } = await supabase
      .from('batches')
      .select(
        'id, title, slug, description, cee_year, instructor_name, thumbnail_url, start_date, end_date, price_npr, is_premium, subject:subjects(display_name, icon, color)'
      )
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    const allBatches = (data as unknown as Batch[]) || [];
    
    // Filter for SEE Batches
    const seeOnly = allBatches.filter((b) => {
      const s = (b.slug || '').toLowerCase();
      const t = (b.title || '').toLowerCase();
      return s.includes('see') || t.includes('see') || t.includes('नेपाली माध्यम');
    });

    const defaultBatches: Batch[] = [
      {
        id: '00000000-0000-0000-0000-000000000001',
        title: 'SEE Class 10 — नेपाली माध्यम भिडियो कक्षा',
        slug: 'see-2026-nepali-medium',
        description: 'नेपाली माध्यममा एसईई कक्षा १० को सम्पूर्ण विषयहरूको भिडियो लेक्चर, मोडल प्रश्न र समाधान।',
        cee_year: null,
        instructor_name: 'Samyak Faculty Team',
        thumbnail_url: null,
        start_date: '2025-04-01',
        end_date: '2026-03-31',
        price_npr: 4990,
        is_premium: true,
        subject: { display_name: 'SEE Class 10 (नेपाली)', icon: '🇳🇵', color: 'emerald' },
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        title: 'SEE Class 10 — English Medium Video Lectures',
        slug: 'see-2026-english-medium',
        description: 'Complete SEE Class 10 video lectures, solved past board papers, and revision notes in English medium.',
        cee_year: null,
        instructor_name: 'Samyak Faculty Team',
        thumbnail_url: null,
        start_date: '2025-04-01',
        end_date: '2026-03-31',
        price_npr: 4990,
        is_premium: true,
        subject: { display_name: 'SEE Class 10 (English)', icon: '🇬🇧', color: 'blue' },
      },
    ];

    setBatches(seeOnly.length > 0 ? seeOnly : defaultBatches);

    if (user?.id) {
      const { data: enrollments } = await supabase
        .from('batch_enrollments')
        .select('batch_id')
        .eq('student_id', user.id);
      setEnrolledIds(new Set((enrollments || []).map((e: { batch_id: string }) => e.batch_id)));
    } else {
      setEnrolledIds(new Set());
    }

    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter batches based on Medium and Search
  const filtered = batches.filter((b) => {
    if (tab === 'enrolled' && !enrolledIds.has(b.id)) return false;

    // Medium filter
    const isNepali = b.slug.includes('nepali') || b.title.includes('नेपाली') || b.title.includes('Nepali');
    if (mediumFilter === 'nepali' && !isNepali) return false;
    if (mediumFilter === 'english' && isNepali) return false;

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      const matchTitle = (b.title || '').toLowerCase().includes(q);
      const matchDesc = (b.description || '').toLowerCase().includes(q);
      const matchInstructor = (b.instructor_name || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchInstructor) return false;
    }

    return true;
  });

  return (
    <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Header Bar */}
        <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 font-mono">
                  SEE 2026 OFFICIAL BATCHES
                </span>
                <span className="text-xs text-muted-foreground font-semibold">1080p HD Streaming</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-2.5">
                <GraduationCap className="text-emerald-500" size={30} />
                <span>SEE Class 10 Preparation Batches</span>
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
                Official Class 10 Board preparation batches available in <strong>English Medium</strong> (Player ID 379737) and <strong>Nepali Medium (नेपाली माध्यम)</strong> (Player ID 367785).
              </p>
            </div>

            <Link
              href="/lecture-videos"
              className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md flex items-center gap-2 transition-all shrink-0"
            >
              <Video size={15} />
              <span>Video Lecture Hub →</span>
            </Link>
          </div>

          {/* Medium Selector Chips */}
          <div className="p-3 rounded-2xl bg-muted/40 border border-border flex flex-wrap items-center justify-between gap-3 pt-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-muted-foreground ml-1 flex items-center gap-1.5 mr-2">
                <Globe size={14} className="text-emerald-500" /> Choose Medium:
              </span>
              <button
                onClick={() => setMediumFilter('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                  mediumFilter === 'all'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >
                All Batches (2)
              </button>
              <button
                onClick={() => setMediumFilter('english')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                  mediumFilter === 'english'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >
                <span>🇬🇧 English Medium</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/20">379737</span>
              </button>
              <button
                onClick={() => setMediumFilter('nepali')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                  mediumFilter === 'nepali'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >
                <span>🇳🇵 Nepali Medium (नेपाली माध्यम)</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/20">367785</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search & Enrolled Tab Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-2xl shrink-0 border border-border">
            <button
              onClick={() => setTab('all')}
              className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${
                tab === 'all' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All Batches ({batches.length})
            </button>
            <button
              onClick={() => setTab('enrolled')}
              className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${
                tab === 'enrolled' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              My Enrolled ({batches.filter((b) => enrolledIds.has(b.id)).length})
            </button>
          </div>

          <div className="relative flex-1 sm:max-w-md">
            <Search size={14} className="absolute left-3.5 top-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search batches by title or instructor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-2xl text-xs text-foreground focus:outline-none focus:border-emerald-500 shadow-xs"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-2.5 p-1 text-xs text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Batches Grid Display */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <Loader2 size={36} className="animate-spin text-emerald-500" />
            <p className="text-xs font-mono font-bold text-muted-foreground">Loading SEE batches...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-3xl p-12 text-center max-w-lg mx-auto space-y-4 shadow-sm">
            <Layers size={40} className="text-muted-foreground mx-auto opacity-50" />
            <div className="space-y-1">
              <h3 className="text-base font-black text-foreground">No Batches Found</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {tab === 'enrolled'
                  ? "You haven't enrolled in any batch yet."
                  : "No batches matched your search filter."}
              </p>
            </div>
            <button
              onClick={() => {
                setMediumFilter('all');
                setSearch('');
                setTab('all');
              }}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all"
            >
              Show All SEE Batches
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((b) => {
              const enrolled = enrolledIds.has(b.id);
              const dateRange = formatDateRange(b.start_date, b.end_date);
              const isNepali = b.slug.includes('nepali') || b.title.includes('नेपाली') || b.title.includes('Nepali');
              const playerId = isNepali ? '367785' : '379737';

              return (
                <div
                  key={b.id}
                  className={`bg-card border rounded-3xl overflow-hidden transition-all flex flex-col justify-between group shadow-sm hover:shadow-xl ${
                    isNepali
                      ? 'hover:border-red-500/50 border-red-500/20'
                      : 'hover:border-blue-500/50 border-blue-500/20'
                  }`}
                >
                  <div className="p-6 space-y-5">
                    
                    {/* Header Badges */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {isNepali ? (
                          <span className="px-3 py-1 rounded-xl bg-red-500/10 text-red-600 border border-red-500/30 text-xs font-black flex items-center gap-1.5">
                            <span>🇳🇵</span>
                            <span>नेपाली माध्यम (Nepali Medium)</span>
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/30 text-xs font-black flex items-center gap-1.5">
                            <span>🇬🇧</span>
                            <span>English Medium</span>
                          </span>
                        )}

                        <span className="px-2 py-0.5 rounded-lg bg-muted text-muted-foreground font-mono text-[10px] font-bold border border-border">
                          ID: {playerId}
                        </span>
                      </div>

                      <div className="flex flex-col items-end">
                        <span className="text-base font-black text-foreground">
                          {b.price_npr > 0 ? `Rs. ${b.price_npr.toLocaleString()}` : 'Free'}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600 font-mono">FULL ACCESS</span>
                      </div>
                    </div>

                    {/* Batch Title & Description */}
                    <div className="space-y-2">
                      <h2 className="text-lg sm:text-xl font-black text-foreground group-hover:text-emerald-600 transition-colors leading-snug">
                        {b.title}
                      </h2>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                        {b.description}
                      </p>
                    </div>

                    {/* Feature Highlights */}
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border/60 text-xs">
                      <div className="flex items-center gap-2 text-muted-foreground font-medium">
                        <CheckCircle2 size={14} className={isNepali ? 'text-red-500' : 'text-blue-500'} />
                        <span>147+ HD Video Lectures</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground font-medium">
                        <CheckCircle2 size={14} className={isNepali ? 'text-red-500' : 'text-blue-500'} />
                        <span>Formula &amp; Revision Notes</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground font-medium">
                        <CheckCircle2 size={14} className={isNepali ? 'text-red-500' : 'text-blue-500'} />
                        <span>10-Year NEB Past Sets</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground font-medium">
                        <CheckCircle2 size={14} className={isNepali ? 'text-red-500' : 'text-blue-500'} />
                        <span>AI Subjective Marking</span>
                      </div>
                    </div>

                    {/* Instructor & Target */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/40 font-mono">
                      <span className="flex items-center gap-1.5 font-sans font-bold text-foreground">
                        <UserRound size={13} className={isNepali ? 'text-red-500' : 'text-blue-500'} />
                        {b.instructor_name || 'Faculty Team'}
                      </span>
                      <span>Target {b.cee_year || 2026} Board</span>
                    </div>

                  </div>

                  {/* Card Action Footer */}
                  <div className="p-4 bg-muted/30 border-t border-border flex items-center justify-between">
                    {enrolled ? (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                        <CheckCircle2 size={14} /> Enrolled
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-muted-foreground">Open Enrollment</span>
                    )}

                    <Link
                      href={`/batches/${b.slug}`}
                      className={`py-2.5 px-5 text-xs font-black rounded-xl text-white shadow-md flex items-center gap-1.5 transition-all ${
                        isNepali
                          ? 'bg-red-600 hover:bg-red-700'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      <span>Explore Batch &amp; Lectures</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
