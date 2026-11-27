'use client';

import { usePublishedVisualLessons } from '@/components/visual-player/usePublishedVisualLessons';
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTrial } from '@/contexts/TrialContext';
import {
  BookOpen, ChevronRight, PlayCircle, FileText, Zap, Clock, ArrowLeft,
  Target, BarChart2, Video, Loader2, Lock, Sparkles, ExternalLink
} from 'lucide-react';
import InteractiveNoteReader, { type NoteDetailPayload } from '@/components/notes/InteractiveNoteReader';

interface ChapterDetailClientProps {
  subjectId: string;
  chapterId: string;
}

interface VideoRow {
  id: string;
  title: string;
  description: string | null;
  duration_sec: number;
  is_premium: boolean;
}

interface NoteRow {
  id: string;
  title: string;
  is_premium: boolean;
  pdf_url: string | null;
  content?: string | null;
  content_markdown?: string | null;
  summary_key_points?: string[] | null;
  formula_sheet_latex?: string | null;
}

const SUBJECT_STYLES: Record<string, { bgLight: string; textColor: string; borderColor: string }> = {
  biology: { bgLight: 'bg-bio-light', textColor: 'text-bio', borderColor: 'border-bio/20' },
  chemistry: { bgLight: 'bg-chem-light', textColor: 'text-chem', borderColor: 'border-chem/20' },
  physics: { bgLight: 'bg-physics-light', textColor: 'text-physics', borderColor: 'border-physics/20' },
  mental_agility: { bgLight: 'bg-ma-light', textColor: 'text-ma', borderColor: 'border-ma/20' },
};

function formatDuration(totalSec: number): string {
  if (!totalSec) return '0m';
  const h = Math.floor(totalSec / 3600);
  const m = Math.round((totalSec % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function ChapterDetailClient({ subjectId, chapterId }: ChapterDetailClientProps) {
  const [isDark, setIsDark] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'mcqs' | 'videos' | 'notes'>('overview');
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [subjectRow, setSubjectRow] = useState<any>(null);
  const [chapterRow, setChapterRow] = useState<any>(null);
  const [mcqCount, setMcqCount] = useState(0);
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [mastery, setMastery] = useState<any>(null);
  const [selectedNoteForReader, setSelectedNoteForReader] = useState<NoteDetailPayload | null>(null);

  const { user, profile } = useAuth();
  const { isTrialActive } = useTrial();
  const supabase = createClient();
  const isFree = !isTrialActive && (profile?.subscription_plan ?? 'free') === 'free';

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setNotFound(false);

      const [{ data: subjRow }, { data: chapRow }] = await Promise.all([
        supabase.from('subjects').select('*').eq('name', subjectId).maybeSingle(),
        supabase.from('chapters').select('*').eq('id', chapterId).maybeSingle(),
      ]);

      if (cancelled) return;

      if (!subjRow || !chapRow || chapRow.subject_id !== subjRow.id) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const [{ count: qCount }, { data: videoRows }, { data: noteRows }, masteryRes] = await Promise.all([
        supabase.from('questions').select('*', { count: 'exact', head: true }).eq('chapter_id', chapterId).eq('is_published', true),
        supabase.from('video_lectures').select('id, title, description, duration_sec, is_premium').eq('chapter_id', chapterId).eq('is_active', true).order('created_at', { ascending: true }),
        supabase.from('notes').select('id, title, is_premium, pdf_url, content, content_markdown, summary_key_points, formula_sheet_latex').eq('chapter_id', chapterId).eq('is_active', true).order('created_at', { ascending: true }),
        user
          ? supabase.from('topic_mastery').select('*').eq('student_id', user.id).eq('chapter_id', chapterId).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      if (cancelled) return;

      setSubjectRow(subjRow);
      setChapterRow(chapRow);
      setMcqCount(qCount ?? 0);
      setVideos(videoRows ?? []);
      setNotes(noteRows ?? []);
      setMastery((masteryRes as any).data ?? null);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [subjectId, chapterId, user]);

  // Published visual lessons mapped to this chapter (none until published; nothing inferred from titles).
  const visualLessons = usePublishedVisualLessons('cee_medical');
  const chapterVisualLessons = useMemo(() => visualLessons.filter((v) => v.legacyChapterIds.includes(chapterId)), [visualLessons, chapterId]);

  if (loading) {
    return (
      <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 size={32} className="text-primary animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (notFound || !subjectRow || !chapterRow) {
    return (
      <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-5xl mb-4">📚</div>
            <h2 className="text-xl font-bold text-foreground mb-2">Chapter Not Found</h2>
            <p className="text-muted-foreground mb-6">This chapter doesn&apos;t exist or may have been moved.</p>
            <Link href="/subjects" className="btn-primary">Back to Subjects</Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const style = SUBJECT_STYLES[subjectRow.name] ?? SUBJECT_STYLES.biology;
  const isLocked = !!chapterRow.is_premium && isFree;
  const progress = mastery ? Math.round(Number(mastery.accuracy) || 0) : 0;
  const videoDurationSec = videos.reduce((sum, v) => sum + (v.duration_sec ?? 0), 0);
  const practiceHref = `/practice?subject=${encodeURIComponent(subjectRow.display_name)}&chapter=${chapterRow.id}`;

  const tabs = [
    { key: 'overview' as const, label: 'Overview', icon: BookOpen },
    { key: 'mcqs' as const, label: `MCQs (${mcqCount})`, icon: Zap },
    { key: 'videos' as const, label: `Videos (${videos.length})`, icon: Video },
    { key: 'notes' as const, label: `Notes (${notes.length})`, icon: FileText },
  ];

  return (
    <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Link href="/subjects" className="hover:text-foreground transition-colors flex items-center gap-1">
            <ArrowLeft size={14} />
            Subjects
          </Link>
          <ChevronRight size={13} />
          <span className={style.textColor}>{subjectRow.display_name}</span>
          <ChevronRight size={13} />
          <span className="text-foreground font-medium truncate">{chapterRow.title}</span>
        </div>

        {/* Chapter Header */}
        <div className={`bg-card border ${style.borderColor} rounded-2xl p-5 mb-6`}>
          <div className="flex items-start gap-4 flex-wrap">
            <div className={`w-14 h-14 rounded-2xl ${style.bgLight} flex items-center justify-center text-3xl shrink-0`}>
              {subjectRow.icon ?? '📘'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-xl font-bold text-foreground">{chapterRow.title}</h1>
                {chapterRow.is_premium && (
                  <span className="text-xs bg-warning-light text-warning px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                    <Lock size={10} /> Pro
                  </span>
                )}
              </div>
              <p className={`text-sm font-medium ${style.textColor} mb-3`}>{subjectRow.display_name} · CEE 2026 Syllabus</p>
              {chapterRow.description && (
                <p className="text-sm text-muted-foreground mb-3">{chapterRow.description}</p>
              )}

              <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Zap size={12} /> {mcqCount} MCQs</span>
                <span className="flex items-center gap-1"><PlayCircle size={12} /> {videos.length} videos</span>
                <span className="flex items-center gap-1"><FileText size={12} /> {notes.length} notes</span>
                {videoDurationSec > 0 && (
                  <span className="flex items-center gap-1"><Clock size={12} /> {formatDuration(videoDurationSec)}</span>
                )}
              </div>
            </div>

            {!isLocked ? (
              <div className="flex flex-col items-end gap-3 shrink-0">
                <div className="text-right">
                  <p className={`text-2xl font-bold ${style.textColor}`}>{progress}%</p>
                  <p className="text-xs text-muted-foreground">Complete</p>
                </div>
                <Link href={practiceHref} className="btn-primary text-sm">
                  {progress > 0 ? 'Continue Practicing' : 'Start Practicing'}
                </Link>
              </div>
            ) : (
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-lg">
                  <Lock size={11} /> Pro content
                </span>
                <Link href="/#pricing" className="btn-primary text-sm">Upgrade Plan</Link>
              </div>
            )}
          </div>

          {!isLocked && (
            <div className="mt-4">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${progress}%`, backgroundColor: subjectRow.color ?? '#2563EB' }}
                />
              </div>
            </div>
          )}
        </div>

        {isLocked ? (
          <div className="bg-card border border-border rounded-2xl p-10 text-center">
            <Lock size={32} className="text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-bold text-foreground mb-2">This is a Pro chapter</h3>
            <p className="text-sm text-muted-foreground mb-5">Upgrade your plan to unlock notes, videos, and MCQs for this chapter.</p>
            <Link href="/#pricing" className="btn-primary inline-flex">Upgrade Plan</Link>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex gap-1 bg-muted/50 rounded-xl p-1 mb-6 overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    activeTab === tab.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Overview */}
            {activeTab === 'overview' && (
              <div className="grid lg:grid-cols-3 gap-6">
                {chapterVisualLessons.map((v) => (
                  <div
                    key={v.id}
                    className="lg:col-span-3 p-5 rounded-2xl bg-card border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Sparkles size={22} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{v.title}</p>
                        <p className="text-xs text-muted-foreground">Visual lesson on {v.topic}</p>
                      </div>
                    </div>
                    <Link
                      href={`/cee/visual/${v.id}`}
                      className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-primary-foreground font-semibold text-sm shrink-0 transition"
                    >
                      Open lesson
                    </Link>
                  </div>
                ))}

                <div className="lg:col-span-3 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'MCQs Available', value: mcqCount, icon: Zap, color: 'text-primary', bg: 'bg-primary/10' },
                    { label: 'Video Lectures', value: videos.length, icon: PlayCircle, color: 'text-chem', bg: 'bg-chem-light' },
                    { label: 'Notes', value: notes.length, icon: FileText, color: style.textColor, bg: style.bgLight },
                    { label: 'Your Accuracy', value: mastery ? `${progress}%` : 'Not started', icon: Target, color: 'text-ma', bg: 'bg-ma-light' },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
                        <stat.icon size={18} className={stat.color} />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-foreground">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Target size={16} className={style.textColor} />
                    Your Progress
                  </h3>
                  {mastery ? (
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Mastery level</span><span className="font-semibold text-foreground capitalize">{String(mastery.mastery_level).replace('_', ' ')}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Questions attempted</span><span className="font-semibold text-foreground">{mastery.questions_attempted}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Correct answers</span><span className="font-semibold text-foreground">{mastery.correct_answers}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Accuracy</span><span className="font-semibold text-foreground">{Number(mastery.accuracy).toFixed(0)}%</span></div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">You haven&apos;t practiced this chapter yet — start now to track your mastery here.</p>
                  )}
                </div>

                <div className="bg-card border border-border rounded-2xl p-5">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <BarChart2 size={16} className="text-warning" />
                    Quick Actions
                  </h3>
                  <div className="space-y-2">
                    {[
                      { icon: Zap, label: 'Practice MCQs', href: practiceHref, color: 'text-primary' },
                      { icon: FileText, label: 'Take Chapter Test', href: '/mock-tests', color: 'text-chem' },
                      videos.length > 0 ? { icon: PlayCircle, label: 'Watch Video Lectures', href: `/learn/${videos[0].id}`, color: 'text-physics' } : { icon: PlayCircle, label: 'Practice MCQs', href: practiceHref, color: 'text-physics' },
                      { icon: BarChart2, label: 'View Progress', href: '/student-dashboard', color: style.textColor },
                    ].map((action) => (
                      <Link
                        key={action.label}
                        href={action.href}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors group"
                      >
                        <action.icon size={15} className={`${action.color} shrink-0`} />
                        <span className="text-sm text-foreground group-hover:text-primary transition-colors">{action.label}</span>
                        <ChevronRight size={13} className="ml-auto text-muted-foreground" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* MCQs */}
            {activeTab === 'mcqs' && (
              <div className="bg-card border border-border rounded-2xl p-5 text-center">
                <div className={`w-16 h-16 rounded-2xl ${style.bgLight} flex items-center justify-center mx-auto mb-4`}>
                  <Zap size={28} className={style.textColor} />
                </div>
                {mcqCount > 0 ? (
                  <>
                    <h3 className="text-lg font-bold text-foreground mb-2">{mcqCount} MCQs Available</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      Practice all {mcqCount} multiple choice questions for {chapterRow.title}.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Link href={practiceHref} className="btn-primary">Practice All MCQs</Link>
                      <Link href="/mock-tests" className="flex items-center justify-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors">
                        <FileText size={15} />
                        Chapter Test
                      </Link>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No MCQs have been added for this chapter yet.</p>
                )}
              </div>
            )}

            {/* Videos */}
            {activeTab === 'videos' && (
              <div className="space-y-3">
                {videos.length === 0 ? (
                  <div className="bg-card border border-border rounded-2xl p-10 text-center space-y-2">
                    <PlayCircle size={36} className="text-muted-foreground mx-auto mb-2" />
                    <h4 className="text-base font-bold text-foreground">No video lectures recorded yet</h4>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto">
                      Lectures for {chapterRow.title} are currently scheduled. Practice MCQs or read notes in the meantime.
                    </p>
                  </div>
                ) : (
                  videos.map((v, idx) => (
                    <Link
                      key={v.id}
                      href={`/learn/${v.id}`}
                      className="group flex items-center justify-between p-4 bg-card border border-border rounded-2xl hover:border-primary/40 hover:shadow-card-hover transition-all"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className={`w-10 h-10 rounded-xl ${style.bgLight} ${style.textColor} flex items-center justify-center shrink-0`}>
                          <PlayCircle size={20} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                            {idx + 1}. {v.title}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground font-mono">
                            <span className="flex items-center gap-1"><Clock size={12} /> {formatDuration(v.duration_sec)}</span>
                            {v.is_premium ? (
                              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">Premium</span>
                            ) : (
                              <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded font-bold">Free Preview</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-xl group-hover:bg-primary group-hover:text-white transition-colors">
                          Study Lecture →
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}

            {/* Notes */}
            {activeTab === 'notes' && (
              <div className="space-y-4">
                {/* Fallback / High-Yield In-App Capsule Card (Always Available) */}
                <div className="bg-card border border-border/80 hover:border-primary/40 rounded-2xl p-5 shadow-sm transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className={`w-11 h-11 rounded-2xl ${style.bgLight} ${style.textColor} flex items-center justify-center shrink-0`}>
                      <BookOpen size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          In-App LaTeX Notes
                        </span>
                        <span className="text-[11px] text-muted-foreground font-medium">
                          CEE 2026 Core Syllabus
                        </span>
                      </div>
                      <h4 className="text-sm sm:text-base font-bold text-foreground mt-0.5">
                        {chapterRow.title} — High-Yield Conceptual Summary &amp; Formulae
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        Comprehensive chapter revision, mathematical derivations, chemical notations, and examination traps.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedNoteForReader({
                        id: `capsule-${chapterId}`,
                        title: `${chapterRow.title} — High-Yield Revision Note`,
                        subjectName: subjectRow.display_name,
                        chapterTitle: chapterRow.title,
                        readingTimeMins: 12,
                        contentMarkdown: `# ${chapterRow.title}\n\n## 1. Core Examination Overview\nThis chapter is a foundational pillar of **${subjectRow.display_name}** for the Nepal Medical Entrance Examination (MECEE).\n\n### Key Concepts & Principles\n- **Fundamental Laws & Definitions**: Master the exact definitions, boundary conditions, and SI unit dimensional formulas.\n- **High-Frequency Traps**: Entrance questions regularly test edge cases where standard simplified assumptions fail.\n\n### Step-by-Step Problem Solving Method\n1. Identify given parameters and convert to standard SI units.\n2. Write down the governing equation before substituting values.\n3. Verify limiting conditions (e.g., $t \\to 0$, $T \\to \\infty$).`,
                        summaryKeyPoints: [
                          `Always memorize the fundamental constants and dimensional formulas for ${chapterRow.title}.`,
                          `Look out for unit conversion traps (e.g., cm to m, or minutes to seconds).`,
                          `Questions in MECEE frequently repeat previous 5-year question patterns from IOM and BPKIHS.`
                        ],
                        formulaSheetLatex: `\\text{General Governing Equation:} \\quad f(x, t) = A \\sin(\\omega t - kx + \\phi) \\\\\n\\text{Energy Conservation:} \\quad E_{total} = E_k + E_p = \\text{constant}`,
                        pdfUrl: notes[0]?.pdf_url ?? null,
                      });
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow-sm transition-all shrink-0"
                  >
                    <BookOpen size={14} />
                    <span>Read In-App Note</span>
                  </button>
                </div>

                {/* Additional DB Notes */}
                {notes.map((n) => (
                  <div
                    key={n.id}
                    className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`w-10 h-10 rounded-xl ${style.bgLight} ${style.textColor} flex items-center justify-center shrink-0`}>
                        <FileText size={20} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-foreground truncate">{n.title}</p>
                          {n.is_premium && (
                            <span className="text-[10px] bg-warning-light text-warning px-1.5 py-0.5 rounded font-bold">Pro</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {n.content_markdown ? 'Formatted with LaTeX & Key Points' : (n.pdf_url ? 'PDF Chapter Handout' : 'Study Resource')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => {
                          setSelectedNoteForReader({
                            id: n.id,
                            title: n.title,
                            subjectName: subjectRow.display_name,
                            chapterTitle: chapterRow.title,
                            readingTimeMins: 10,
                            contentMarkdown: n.content || n.content_markdown || `# ${n.title}\n\nComprehensive academic notes for **${chapterRow.title}** (${subjectRow.display_name}).\n\nRefer to the attached lecture recordings and chapter practice tests to solidify your conceptual understanding.`,
                            summaryKeyPoints: n.summary_key_points || undefined,
                            formulaSheetLatex: n.formula_sheet_latex || undefined,
                            pdfUrl: n.pdf_url,
                            isPremium: n.is_premium,
                          });
                        }}
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs transition-colors"
                      >
                        <BookOpen size={13} />
                        <span>Read Note</span>
                      </button>

                      {n.pdf_url && (
                        <a
                          href={n.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-muted/60 text-muted-foreground hover:text-foreground border border-border transition-colors"
                          title="Open PDF"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Interactive In-App Note Reader Modal */}
        {selectedNoteForReader && (
          <InteractiveNoteReader
            note={selectedNoteForReader}
            onClose={() => setSelectedNoteForReader(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
