'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTrial } from '@/contexts/TrialContext';
import { useProgram, PROGRAMS } from '@/contexts/ProgramContext';
import ProgramSwitcher from '@/components/ProgramSwitcher';
import { BookOpen, ChevronRight, CheckCircle2, Lock, PlayCircle, Zap, Clock, TrendingUp, Search, FileText, Loader2, GraduationCap, Stethoscope } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChapterView {
  id: string;
  subjectId: string;
  title: string;
  chapterNumber: number | null;
  isPremium: boolean;
  mcqCount: number;
  videoCount: number;
  videoDurationSec: number;
  progress: number;
  masteryLevel: string;
  isLocked: boolean;
}

interface SubjectView {
  id: string;
  name: string;
  displayName: string;
  icon: string;
  color: string;
  bgLight: string;
  textColor: string;
  borderColor: string;
  chapters: ChapterView[];
  totalMCQs: number;
  completedChapters: number;
  masteryPercent: number;
}

const SUBJECT_STYLES: Record<string, { bgLight: string; textColor: string; borderColor: string }> = {
  biology: { bgLight: 'bg-bio-light', textColor: 'text-bio', borderColor: 'border-bio/20' },
  chemistry: { bgLight: 'bg-chem-light', textColor: 'text-chem', borderColor: 'border-chem/20' },
  physics: { bgLight: 'bg-physics-light', textColor: 'text-physics', borderColor: 'border-physics/20' },
  mental_agility: { bgLight: 'bg-ma-light', textColor: 'text-ma', borderColor: 'border-ma/20' },
  compulsory_science: { bgLight: 'bg-bio-light', textColor: 'text-bio', borderColor: 'border-bio/20' },
  compulsory_math: { bgLight: 'bg-chem-light', textColor: 'text-chem', borderColor: 'border-chem/20' },
  optional_math: { bgLight: 'bg-physics-light', textColor: 'text-physics', borderColor: 'border-physics/20' },
  english: { bgLight: 'bg-ma-light', textColor: 'text-ma', borderColor: 'border-ma/20' },
  social_studies: { bgLight: 'bg-primary/10', textColor: 'text-primary', borderColor: 'border-primary/20' },
};

function formatDuration(totalSec: number): string {
  if (!totalSec) return '0m';
  const h = Math.floor(totalSec / 3600);
  const m = Math.round((totalSec % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function SubjectsPageClient() {
  const [isDark, setIsDark] = useState(false);
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<SubjectView[]>([]);

  const { program, programDetails } = useProgram();
  const { user, profile } = useAuth();
  const supabase = createClient();
  const { isTrialActive } = useTrial();
  const isFree = !isTrialActive && (profile?.subscription_plan ?? 'free') === 'free';

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);

      // Fetch chapters
      let chaptersRes = await supabase.from('chapters').select('*').eq('is_active', true).order('chapter_number', { ascending: true });
      if (chaptersRes.error) {
        chaptersRes = await supabase.from('chapters').select('*').eq('is_active', true).order('sort_order', { ascending: true });
        if (chaptersRes.error) {
          chaptersRes = await supabase.from('chapters').select('*').eq('is_active', true).order('created_at', { ascending: true });
        }
      }

      const [subjectsRes, questionsRes, videosRes, masteryRes] = await Promise.all([
        supabase.from('subjects').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
        supabase.from('questions').select('id, chapter_id').eq('is_published', true),
        supabase.from('video_lectures').select('id, chapter_id, duration_sec').eq('is_active', true),
        user
          ? supabase.from('topic_mastery').select('*').eq('student_id', user.id)
          : Promise.resolve({ data: [] as any[] }),
      ]);

      if (cancelled) return;

      const masteryByChapter = new Map<string, any>(
        ((masteryRes as any).data ?? []).map((m: any) => [m.chapter_id, m])
      );

      const mcqCountByChapter = new Map<string, number>();
      (questionsRes.data ?? []).forEach((q: any) => {
        if (q.chapter_id) {
          mcqCountByChapter.set(q.chapter_id, (mcqCountByChapter.get(q.chapter_id) ?? 0) + 1);
        }
      });

      const videoStatsByChapter = new Map<string, { count: number; totalSec: number }>();
      (videosRes.data ?? []).forEach((v: any) => {
        if (v.chapter_id) {
          const current = videoStatsByChapter.get(v.chapter_id) ?? { count: 0, totalSec: 0 };
          videoStatsByChapter.set(v.chapter_id, {
            count: current.count + 1,
            totalSec: current.totalSec + (v.duration_sec ?? 0),
          });
        }
      });

      const dbSubjects = subjectsRes.data ?? [];
      const rawChapters = chaptersRes.data ?? [];

      const builtSubjects: SubjectView[] = dbSubjects.map((s: any) => {
        const sChapters = rawChapters.filter((c: any) => c.subject_id === s.id);
        let totalMCQs = 0;
        let completedChapters = 0;

        const chaptersViews: ChapterView[] = sChapters.map((c: any) => {
          const mcqs = mcqCountByChapter.get(c.id) ?? 0;
          const vStats = videoStatsByChapter.get(c.id) ?? { count: 0, totalSec: 0 };
          const mData = masteryByChapter.get(c.id);

          const isPremium = c.is_premium ?? true;
          const isLocked = isFree && isPremium;
          const progress = mData?.mastery_score ?? 0;
          const masteryLevel = mData?.mastery_level ?? 'Not Started';

          totalMCQs += mcqs;
          if (progress >= 80) completedChapters += 1;

          return {
            id: c.id,
            subjectId: s.id,
            title: c.title,
            chapterNumber: c.chapter_number ?? c.sort_order ?? null,
            isPremium,
            mcqCount: mcqs,
            videoCount: vStats.count,
            videoDurationSec: vStats.totalSec,
            progress,
            masteryLevel,
            isLocked,
          };
        });

        const styles = SUBJECT_STYLES[s.name] ?? {
          bgLight: 'bg-primary/10',
          textColor: 'text-primary',
          borderColor: 'border-primary/20',
        };

        const totalCh = chaptersViews.length;
        const masteryPercent = totalCh > 0 ? Math.round((completedChapters / totalCh) * 100) : 0;

        return {
          id: s.id,
          name: s.name,
          displayName: s.display_name,
          icon: s.icon ?? 'BookOpen',
          color: s.color ?? '#5A45E8',
          bgLight: styles.bgLight,
          textColor: styles.textColor,
          borderColor: styles.borderColor,
          chapters: chaptersViews,
          totalMCQs,
          completedChapters,
          masteryPercent,
        };
      });

      setSubjects(builtSubjects);
      if (builtSubjects.length > 0) {
        setActiveSubject(builtSubjects[0].id);
      }
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [user?.id, isFree]);

  // Filter subjects by active program (CEE vs SEE)
  const isSeeSubject = (name: string) => ['compulsory_science', 'compulsory_math', 'optional_math', 'english', 'social_studies'].includes(name);
  
  const programFilteredSubjects = subjects.filter((s) => {
    if (program === 'see') return isSeeSubject(s.name);
    return !isSeeSubject(s.name); // CEE
  });

  // Ensure activeSubject points to a valid subject in the currently active program
  useEffect(() => {
    if (programFilteredSubjects.length > 0) {
      const exists = programFilteredSubjects.some((s) => s.id === activeSubject);
      if (!exists) {
        setActiveSubject(programFilteredSubjects[0].id);
      }
    }
  }, [program, programFilteredSubjects, activeSubject]);

  const selectedSubjectObj = programFilteredSubjects.find((s) => s.id === activeSubject) || programFilteredSubjects[0];


  const filteredChapters = (selectedSubjectObj?.chapters ?? []).filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Header & Program Switcher */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${programDetails.badgeBg} ${programDetails.badgeText}`}>
                {programDetails.badge}
              </span>
              <span className="text-xs text-muted-foreground font-medium">Official Curriculum</span>
            </div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
              {program === 'cee' ? <Stethoscope className="text-primary" size={24} /> : <GraduationCap className="text-bio" size={24} />}
              {programDetails.name} Subjects
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              {programDetails.description}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className="text-xs text-muted-foreground font-semibold">Active Program Section:</span>
            <ProgramSwitcher size="md" />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 size={32} className="animate-spin text-primary mb-3" />
            <p className="text-sm text-muted-foreground">Loading curriculum database...</p>
          </div>
        ) : programFilteredSubjects.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-12 text-center max-w-xl mx-auto">
            <BookOpen size={36} className="text-muted-foreground mx-auto mb-3" />
            <h3 className="text-base font-bold text-foreground">No subjects found for {programDetails.shortName}</h3>
            <p className="text-xs text-muted-foreground mt-1">Subjects for this section are being updated in the curriculum database.</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-12 gap-6">
            
            {/* Subject Selector Tabs (4 cols) */}
            <div className="lg:col-span-4 space-y-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
                {programDetails.shortName} Subjects ({programFilteredSubjects.length})
              </p>

              <div className="space-y-2">
                {programFilteredSubjects.map((s) => {
                  const isActive = (selectedSubjectObj?.id === s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => setActiveSubject(s.id)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${
                        isActive
                          ? `${s.bgLight} ${s.borderColor} shadow-sm border-2`
                          : 'bg-card border-border hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className={`w-10 h-10 rounded-xl ${s.bgLight} flex items-center justify-center text-lg shrink-0 border border-border/50`}>
                          <BookOpen size={20} className={s.textColor} />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm font-bold truncate ${isActive ? s.textColor : 'text-foreground'}`}>
                            {s.displayName}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                            {s.chapters.length} chapters · {s.totalMCQs} MCQs
                          </p>
                        </div>
                      </div>
                      <ChevronRight size={16} className={isActive ? s.textColor : 'text-muted-foreground'} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chapters & Content List (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between gap-3 bg-card border border-border rounded-2xl p-4 shadow-sm flex-wrap">
                <div>
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <span className={selectedSubjectObj?.textColor}>{selectedSubjectObj?.displayName}</span> Chapters
                  </h2>
                  <p className="text-xs text-muted-foreground">Select a chapter to practice MCQs and stream Bunny video lectures</p>
                </div>

                <div className="relative min-w-[200px]">
                  <Search size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search chapters..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-muted/60 border border-border rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {filteredChapters.length === 0 ? (
                <div className="bg-card border border-border rounded-2xl p-8 text-center">
                  <p className="text-xs text-muted-foreground">No chapters match your search.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredChapters.map((c) => (
                    <Link
                      key={c.id}
                      href={`/subjects/${selectedSubjectObj?.id}/${c.id}`}
                      className="group flex items-center justify-between p-4 bg-card border border-border rounded-2xl hover:border-primary/40 hover:shadow-card-hover transition-all"
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div className={`w-8 h-8 rounded-xl ${selectedSubjectObj?.bgLight} text-xs font-bold ${selectedSubjectObj?.textColor} flex items-center justify-center shrink-0 mt-0.5`}>
                          {c.chapterNumber ? `Ch.${c.chapterNumber}` : '•'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                            {c.title}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground font-mono">
                            <span className="flex items-center gap-1"><Zap size={12} className="text-warning" /> {c.mcqCount} MCQs</span>
                            {c.videoCount > 0 && (
                              <span className="flex items-center gap-1"><PlayCircle size={12} className="text-physics" /> {c.videoCount} videos ({formatDuration(c.videoDurationSec)})</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {c.isLocked ? (
                          <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-lg flex items-center gap-1">
                            <Lock size={12} /> Pro
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-xl group-hover:bg-primary group-hover:text-white transition-colors">
                            Start Chapter →
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
