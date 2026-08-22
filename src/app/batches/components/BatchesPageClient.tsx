'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProgram, PROGRAMS, normalizeCourseId } from '@/contexts/ProgramContext';
import ProgramSwitcher from '@/components/ProgramSwitcher';
import { Search, Calendar, CheckCircle2, Loader2, GraduationCap, Layers, UserRound, Stethoscope } from 'lucide-react';

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
  subject: BatchSubject | BatchSubject[] | null;
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
  const { program, programDetails } = useProgram();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState<string>('all');
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

    setBatches((data as unknown as Batch[]) || []);

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

  const canonicalId = normalizeCourseId(program);

  const isSeeBatch = (b: Batch) => {
    const slug = (b.slug || '').toLowerCase();
    const title = (b.title || '').toLowerCase();
    return b.program_type === 'see' || b.program_type === 'see_class_10' || slug.includes('see-') || slug.includes('-see') || title.includes('see');
  };

  const programBatches = batches.filter((b) => {
    if (canonicalId === 'see_class_10') return isSeeBatch(b);
    if (canonicalId === 'ielts') {
      const s = (b.slug || '').toLowerCase() + (b.title || '').toLowerCase();
      return s.includes('ielts') || s.includes('english') || s.includes('spoken') || s.includes('pte');
    }
    if (canonicalId === 'digital_marketing') {
      const s = (b.slug || '').toLowerCase() + (b.title || '').toLowerCase();
      return s.includes('market') || s.includes('ads') || s.includes('seo') || s.includes('canva');
    }
    if (canonicalId === 'artificial_intelligence') {
      const s = (b.slug || '').toLowerCase() + (b.title || '').toLowerCase();
      return s.includes('ai') || s.includes('chatgpt') || s.includes('python') || s.includes('prompt');
    }
    return !isSeeBatch(b); // CEE
  });

  const years = Array.from(new Set(programBatches.map((b) => b.cee_year).filter((y): y is number => !!y))).sort(
    (a, b) => a - b
  );

  const filtered = programBatches.filter((b) => {
    if (tab === 'enrolled' && !enrolledIds.has(b.id)) return false;
    if (yearFilter !== 'all' && String(b.cee_year) !== yearFilter) return false;
    if (search && !b.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Header & Program Switcher */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border rounded-2xl p-6 shadow-sm mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${programDetails.badgeBg} ${programDetails.badgeText}`}>
                {programDetails.badge}
              </span>
              <span className="text-xs text-muted-foreground font-medium">Structured Courses</span>
            </div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
              {program === 'cee' ? <Stethoscope className="text-primary" size={24} /> : <GraduationCap className="text-bio" size={24} />}
              {programDetails.name} Batches
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              Comprehensive live &amp; recorded batches curated specifically for {programDetails.shortName} aspirants.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className="text-xs text-muted-foreground font-semibold">Active Program Section:</span>
            <ProgramSwitcher size="md" />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl shrink-0 border border-border">
            <button
              onClick={() => setTab('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                tab === 'all' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All Batches ({programBatches.length})
            </button>
            <button
              onClick={() => setTab('enrolled')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                tab === 'enrolled' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              My Enrolled ({programBatches.filter((b) => enrolledIds.has(b.id)).length})
            </button>
          </div>

          <div className="flex items-center gap-3">
            {years.length > 0 && (
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="bg-card border border-border rounded-xl px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">All Years</option>
                {years.map((y) => (
                  <option key={y} value={String(y)}>
                    Target {y}
                  </option>
                ))}
              </select>
            )}

            <div className="relative flex-1 sm:w-64">
              <Search size={15} className="absolute left-3 top-2.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search batches..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 size={32} className="animate-spin text-primary mb-3" />
            <p className="text-sm text-muted-foreground">Loading batches...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-12 text-center max-w-lg mx-auto">
            <Layers size={36} className="text-muted-foreground mx-auto mb-3" />
            <h3 className="text-base font-bold text-foreground">No batches found</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {tab === 'enrolled'
                ? "You haven't enrolled in any batches for this program section yet."
                : `No active batches match your search criteria for ${programDetails.shortName}.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((b) => {
              const subj = getSubject(b);
              const enrolled = enrolledIds.has(b.id);
              const dateRange = formatDateRange(b.start_date, b.end_date);

              return (
                <div
                  key={b.id}
                  className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-card-hover transition-all flex flex-col justify-between group"
                >
                  <div className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 font-bold">
                        {subj?.icon || <GraduationCap size={24} />}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-sm font-black text-foreground">
                          {b.price_npr > 0 ? `Rs. ${b.price_npr.toLocaleString()}` : 'Free'}
                        </span>
                        {b.is_premium && (
                          <span className="text-[10px] font-bold bg-warning-light text-warning px-2 py-0.5 rounded-full">
                            PRO
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h2 className="text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {b.title}
                      </h2>
                      {b.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                          {b.description}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-border/60 text-xs text-muted-foreground">
                      {b.instructor_name && (
                        <p className="flex items-center gap-1.5 font-medium">
                          <UserRound size={13} className="text-primary" /> {b.instructor_name}
                        </p>
                      )}
                      {dateRange && (
                        <p className="flex items-center gap-1.5 font-mono">
                          <Calendar size={13} /> {dateRange}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-muted/30 border-t border-border/60 flex items-center justify-between">
                    {enrolled ? (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-success bg-success-light px-3 py-1.5 rounded-xl">
                        <CheckCircle2 size={14} /> Enrolled
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-muted-foreground">Open Access</span>
                    )}

                    <Link
                      href={`/batches/${b.slug}`}
                      className="btn-primary py-1.5 px-4 text-xs font-bold rounded-xl"
                    >
                      View Details →
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
