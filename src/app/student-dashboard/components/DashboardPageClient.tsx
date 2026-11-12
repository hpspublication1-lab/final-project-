'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useProgram, normalizeCourseId, COURSES_MAP } from '@/contexts/ProgramContext';
import {
  Play, ArrowRight, AlertTriangle,
  ShieldCheck, RefreshCw, TrendingUp, KeyRound, RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';
import DashboardSkeleton from './DashboardSkeleton';
import AnalyticsBentoCockpit from './AnalyticsBentoCockpit';
import ScheduleTab from './ScheduleTab';
import ClassesNotesTab from './ClassesNotesTab';
import TestsTab from './TestsTab';
import DppPracticeTab from './DppPracticeTab';
import DoubtsTab from './DoubtsTab';
import NoticesTab from './NoticesTab';
import BatchSwitchModal from './BatchSwitchModal';
import StreakRepairModal from './StreakRepairModal';
import WorkspaceRail from './WorkspaceRail';
import DashboardWorkspaceTabs, { isDashboardTab } from './DashboardWorkspaceTabs';
import { DashboardData, CurriculumSubject, PWTab } from '../types';

const BatchVideoPlayerModal = dynamic(
  () => import('./BatchVideoPlayerModal'),
  { ssr: false }
);

const RedeemVoucherModal = dynamic(
  () => import('@/components/billing/RedeemVoucherModal'),
  { ssr: false }
);

// ── Main PW-Style Dashboard Component ────────────────────────────────────────

export default function DashboardPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { program } = useProgram();

  const canonicalId = normalizeCourseId(program);
  const trackMeta = COURSES_MAP[canonicalId];
  const tabFromUrl = searchParams.get('tab');
  const activeTab: PWTab = isDashboardTab(tabFromUrl) ? tabFromUrl : 'analytics';

  const setActiveTab = (tab: PWTab) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === 'analytics') params.delete('tab');
    else params.set('tab', tab);
    const query = params.toString();
    router.replace(query ? `/student-dashboard?${query}` : '/student-dashboard', { scroll: false });
  };

  // SWR Client-Side Cache (Instant Render from sessionStorage / memory)
  const [data, setData] = useState<DashboardData | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = sessionStorage.getItem(`samyak_swr_dash_${canonicalId}`);
      if (stored) return JSON.parse(stored);
    } catch {}
    return null;
  });
  const [loading, setLoading] = useState<boolean>(!data);
  const [isDark, setIsDark] = useState(false);
  const [themeReady, setThemeReady] = useState(false);

  // Interactive state
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [switchingBatch, setSwitchingBatch] = useState(false);
  const [backlogMode, setBacklogMode] = useState<'balanced' | 'express' | 'weekend'>('balanced');
  const [streakFreezeArmed, setStreakFreezeArmed] = useState(true);
  const [showRedeemModal, setShowRedeemModal] = useState(false);

  // Streak Repair Drill & Habit Engine state
  const [showStreakRepairModal, setShowStreakRepairModal] = useState(false);
  const [repairingStreak, setRepairingStreak] = useState(false);
  const [claimingMissionBonus, setClaimingMissionBonus] = useState(false);

  // Curriculum & Video state
  const [curriculumSubjects, setCurriculumSubjects] = useState<CurriculumSubject[]>([]);
  const [curriculumLoading, setCurriculumLoading] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [chapterSearch, setChapterSearch] = useState('');
  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(null);
  const [activeVideo, setActiveVideo] = useState<{ id: string; title: string; videoUrl?: string; durationSec?: number } | null>(null);

  // Quick Doubt input state
  const [doubtQuestion, setDoubtQuestion] = useState('');

  // Streak freeze persistence
  useEffect(() => {
    if (!user?.id) return;
    try {
      const saved = localStorage.getItem(`samyak_streak_freeze_${user.id}`);
      if (saved !== null) {
        setStreakFreezeArmed(saved === 'true');
      }
    } catch {}
  }, [user?.id]);

  const handleToggleStreakFreeze = () => {
    if (!user?.id) return;
    const next = !streakFreezeArmed;
    setStreakFreezeArmed(next);
    try {
      localStorage.setItem(`samyak_streak_freeze_${user.id}`, String(next));
    } catch {}
    if (next) {
      toast.success('Streak Freeze Shield Armed! Protects consistency if you miss 1 day.', {
        icon: '🛡️',
        duration: 3500,
      });
    } else {
      toast('Streak Freeze Shield Disarmed. Strict daily tracking enabled.', {
        icon: '⚡',
        duration: 3000,
      });
    }
  };

  const handleStreakRepair = async () => {
    try {
      setRepairingStreak(true);
      const res = await fetch('/api/student/streak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'repair_streak' }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to repair streak');

      toast.success(result.message || '🔥 Streak Repaired! Restored with +50 XP bonus!', {
        duration: 4000,
        icon: '🔥',
      });

      setData((prev) => {
        if (!prev) return prev;
        const newStreak = result.currentStreak || Math.max(prev.weeklyProgress.currentStreak + 1, 7);
        const newXp = (prev.gamification?.xpPoints || 1250) + 50;
        return {
          ...prev,
          weeklyProgress: {
            ...prev.weeklyProgress,
            currentStreak: newStreak,
          },
          gamification: prev.gamification
            ? {
                ...prev.gamification,
                streakDays: newStreak,
                xpPoints: newXp,
              }
            : undefined,
        };
      });

      setShowStreakRepairModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Streak repair failed';
      toast.error(msg);
    } finally {
      setRepairingStreak(false);
    }
  };

  const handleClaimDailyMission = async () => {
    if (!data?.gamification?.dailyMission) return;
    try {
      setClaimingMissionBonus(true);
      const res = await fetch('/api/student/streak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete_mission' }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to claim daily bonus');

      toast.success(result.message || '🎉 3-Pillar Daily Mission Bonus Claimed! +100 XP awarded!', {
        duration: 4000,
        icon: '🏆',
      });

      setData((prev) => {
        if (!prev) return prev;
        const newXp = (prev.gamification?.xpPoints || 1250) + 100;
        return {
          ...prev,
          gamification: prev.gamification
            ? {
                ...prev.gamification,
                xpPoints: newXp,
                dailyMission: {
                  ...prev.gamification.dailyMission,
                  bonusClaimed: true,
                } as any,
              }
            : undefined,
        };
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not claim daily mission bonus';
      toast.error(msg);
    } finally {
      setClaimingMissionBonus(false);
    }
  };

  const handleSwitchBatch = async (batchId: string) => {
    try {
      setSwitchingBatch(true);
      const res = await fetch('/api/student/batch/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseSlug: canonicalId, batchId }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to switch batch');
      toast.success(result.message || 'Batch switched successfully!');
      setShowBatchModal(false);

      // Refresh dashboard data
      const refreshRes = await fetch(`/api/student/dashboard?course=${canonicalId}&refresh=1`);
      if (refreshRes.ok) {
        const refreshed = await refreshRes.json();
        setData(refreshed);
        try {
          sessionStorage.setItem(`samyak_swr_dash_${user?.id}_${canonicalId}`, JSON.stringify(refreshed));
        } catch {}
      }
      // Re-fetch curriculum for new batch
      loadCurriculum();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not switch batch';
      toast.error(msg);
    } finally {
      setSwitchingBatch(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('samyak_theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(saved ? saved === 'dark' : prefersDark);
    } catch {}
    setThemeReady(true);
  }, []);

  useEffect(() => {
    if (!themeReady) return;
    document.documentElement.classList.toggle('dark', isDark);
    try {
      localStorage.setItem('samyak_theme', isDark ? 'dark' : 'light');
    } catch {}
  }, [isDark, themeReady]);

  // SWR Pipeline: Fetch fresh data in background without blocking UI
  useEffect(() => {
    if (!user?.id) return;
    let active = true;

    // Check SWR cache if data not initialized
    try {
      const cached = sessionStorage.getItem(`samyak_swr_dash_${user.id}_${canonicalId}`);
      if (cached && !data) {
        const parsed = JSON.parse(cached);
        setData(parsed);
        setLoading(false);
      }
    } catch {}

    async function loadDashboard() {
      if (!data) setLoading(true);
      try {
        const res = await fetch(`/api/student/dashboard?course=${canonicalId}`);
        if (res.ok) {
          const json = await res.json();
          if (active) {
            setData(json);
            try {
              sessionStorage.setItem(`samyak_swr_dash_${user.id}_${canonicalId}`, JSON.stringify(json));
            } catch {}
            // Pre-seed completed tasks from API
            const initialTasks: Record<string, boolean> = {};
            json.todayStudyPlan?.tasks?.forEach((t: { id: string; isCompleted: boolean }) => {
              initialTasks[t.id] = !!t.isCompleted;
            });
            setCompletedTasks((prev) => ({ ...initialTasks, ...prev }));
          }
        }
      } catch (err) {
        console.error('Failed to load student dashboard:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      active = false;
    };
  }, [user?.id, canonicalId]);

  // Load Curriculum for Classes Tab
  const loadCurriculum = async () => {
    try {
      setCurriculumLoading(true);
      const res = await fetch(`/api/curriculum?course=${canonicalId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.subjects && Array.isArray(json.subjects)) {
          setCurriculumSubjects(json.subjects);
          // Auto-expand first chapter of first subject if none expanded
          if (!expandedChapterId && json.subjects[0]?.units?.[0]?.chapters?.[0]?.id) {
            setExpandedChapterId(json.subjects[0].units[0].chapters[0].id);
          }
        }
      }
    } catch (err) {
      console.warn('Curriculum fetch warning:', err);
    } finally {
      setCurriculumLoading(false);
    }
  };

  // Pre-fetch curriculum quietly 80ms after initial mount for 0ms tab switching
  useEffect(() => {
    if (!user?.id) return;
    const timer = setTimeout(() => {
      if (curriculumSubjects.length === 0) {
        loadCurriculum();
      }
    }, 80);
    return () => clearTimeout(timer);
  }, [user?.id, canonicalId, curriculumSubjects.length]);

  const toggleTask = (taskId: string) => {
    setCompletedTasks((prev) => {
      const next = !prev[taskId];
      if (next) {
        toast.success('Goal completed! Streak momentum locked in 🔥', {
          duration: 2500,
        });
      }
      return {
        ...prev,
        [taskId]: next,
      };
    });
  };

  const handleAskDoubt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!doubtQuestion.trim()) return;
    router.push(`/ai-tutor?prompt=${encodeURIComponent(doubtQuestion.trim())}`);
  };

  // Instant SWR: If loading and no cached data, render full-fidelity skeleton
  if (authLoading || (loading && !data)) {
    return <DashboardSkeleton />;
  }

  if (!user || !data) return null;

  const isSee = canonicalId === 'see_class_10';
  const isTrial = data.activeCourse.state === 'free_preview';
  const isExpired = data.activeCourse.state === 'expired';
  const checkoutPlanSku = isSee ? 'see-class-10-board-topper-batch' : 'cee-mbbs-mastery-2026';

  const completedCount = Object.values(completedTasks).filter(Boolean).length;
  const totalTasksCount = data.todayStudyPlan.tasks.length;

  // Backlog Recovery calculations
  const incompletePlanTasks = data.todayStudyPlan.tasks.filter((t) => !completedTasks[t.id]);
  const hasUnfinishedChapter = Boolean(data.lastLesson && data.lastLesson.masteryScore < 100);
  const unfinishedChapterCount = (hasUnfinishedChapter ? 1 : 0) + incompletePlanTasks.length;
  const unfinishedChapterMins =
    incompletePlanTasks.reduce((sum, t) => sum + (t.estimatedMins || 25), 0) +
    (hasUnfinishedChapter ? 30 : 0);

  const pendingDrillCount = data.weakTopics.length;
  const totalWeakTopicErrors = data.weakTopics.reduce((sum, w) => sum + (w.errorCount || 0), 0);

  const dynamicBacklogQueue: Array<{
    id: string;
    type: 'chapter' | 'dpp' | 'task';
    subject: string;
    title: string;
    meta: string;
    href: string;
    cta: string;
  }> = [];

  if (data.lastLesson && data.lastLesson.masteryScore < 100) {
    dynamicBacklogQueue.push({
      id: `lesson-${data.lastLesson.chapterId}`,
      type: 'chapter',
      subject: data.lastLesson.subjectDisplayName,
      title: `Master Chapter: ${data.lastLesson.chapterTitle}`,
      meta: `${data.lastLesson.masteryScore}% mastered`,
      href: data.lastLesson.resumeHref,
      cta: 'Resume',
    });
  }

  for (const wt of data.weakTopics) {
    if (dynamicBacklogQueue.length >= 6) break;
    dynamicBacklogQueue.push({
      id: `weak-${wt.id}`,
      type: 'dpp',
      subject: wt.subject,
      title: `Fix Weak Topic: ${wt.title}`,
      meta: `${wt.accuracy}% acc • ${wt.errorCount} misses`,
      href: wt.practiceHref,
      cta: 'Solve DPP',
    });
  }

  for (const pt of incompletePlanTasks) {
    if (dynamicBacklogQueue.length >= 6) break;
    dynamicBacklogQueue.push({
      id: `plan-${pt.id}`,
      type: 'task',
      subject: pt.subject,
      title: pt.title,
      meta: `~${pt.estimatedMins} mins target`,
      href: pt.actionHref,
      cta: 'Start Task',
    });
  }

  const displayedBacklogQueue =
    backlogMode === 'weekend' ? dynamicBacklogQueue.slice(0, 6) : dynamicBacklogQueue.slice(0, 3);

  const totalActionableItems =
    totalTasksCount + data.weakTopics.length + (data.lastLesson ? 1 : 0);
  const completedActionableItems =
    completedCount + (data.lastLesson && data.lastLesson.masteryScore >= 80 ? 1 : 0);
  const recoveryProgressPct =
    totalActionableItems > 0
      ? Math.min(100, Math.round((completedActionableItems / totalActionableItems) * 100))
      : 100;

  // Calculate overall batch progress
  const batchCompletionPct = Math.min(
    95,
    Math.max(
      22,
      (data.weeklyProgress.totalQuestionsThisWeek > 0 ? 32 : 18) +
        completedCount * 8 +
        (data.recentTestPerformance.length > 0 ? 15 : 0)
    )
  );

  const contextualPanel = (
    <WorkspaceRail
      data={data}
      streakFreezeArmed={streakFreezeArmed}
      onToggleStreakFreeze={handleToggleStreakFreeze}
      onOpenStreakRepair={() => setShowStreakRepairModal(true)}
      onOpenRedeem={() => setShowRedeemModal(true)}
    />
  );

  return (
    <DashboardLayout
      isDark={isDark}
      onToggleDark={() => setIsDark(!isDark)}
      contextualPanel={contextualPanel}
    >
      {/* ── 0. TRIAL OR EXPIRED STATE BANNER ───────────────────────────────── */}
      {isTrial && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
              <ShieldCheck size={18} />
            </span>
            <div>
              <p className="text-xs sm:text-sm font-bold text-foreground">
                Free Starter Preview Active
              </p>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                Upgrade to unlock all 15,000+ past questions, daily interactive live batches, and AI grading.
              </p>
            </div>
          </div>
          <Link
            href={`/checkout?plan=${checkoutPlanSku}`}
            className="btn-primary text-xs font-bold py-2.5 px-5 rounded-xl shrink-0 flex items-center gap-1.5 shadow-xs"
          >
            <span>Upgrade to Full Batch</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      )}

      {isExpired && (
        <div className="p-4 sm:p-5 rounded-2xl bg-red-500/10 border border-red-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span className="w-9 h-9 rounded-xl bg-red-500/20 text-red-600 flex items-center justify-center shrink-0">
              <AlertTriangle size={18} />
            </span>
            <div>
              <p className="text-xs sm:text-sm font-bold text-foreground">
                Batch Access Expired
              </p>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                Renew your enrollment to continue taking timed mocks and attending live sessions.
              </p>
            </div>
          </div>
          <Link
            href={`/checkout?plan=${checkoutPlanSku}`}
            className="btn-primary text-xs font-bold py-2.5 px-5 rounded-xl shrink-0 flex items-center gap-1.5 shadow-xs"
          >
            <span>Renew Access</span>
            <RefreshCw size={13} />
          </Link>
        </div>
      )}

      <section className="bg-card border border-border/80 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <p className="text-xs text-muted-foreground">
              {data.activeCourse.daysRemaining
                ? `${trackMeta.shortName} · ${data.activeCourse.daysRemaining} days remaining`
                : trackMeta.shortName}
            </p>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight leading-[1.15]">
              {data.batchManagement?.currentBatchTitle || data.activeCourse.title}
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
              {trackMeta.tagline}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start shrink-0">
            {data.batchManagement?.canSwitchBatch &&
              (data.batchManagement?.availableBatches?.length || 0) > 1 && (
                <button
                  type="button"
                  onClick={() => setShowBatchModal(true)}
                  className="min-h-11 px-3.5 rounded-xl border border-border text-foreground font-semibold text-xs inline-flex items-center gap-1.5 bg-muted/40 hover:bg-muted transition-colors cursor-pointer"
                >
                  <RotateCcw size={13} className="text-primary" />
                  Switch batch
                </button>
              )}

            <button
              type="button"
              onClick={() => setShowRedeemModal(true)}
              className="min-h-11 px-3.5 rounded-xl border border-border text-foreground font-semibold text-xs inline-flex items-center gap-1.5 hover:bg-muted transition-colors cursor-pointer"
            >
              <KeyRound size={13} />
              Redeem key
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-muted-foreground inline-flex items-center gap-1.5">
              <TrendingUp size={13} className="text-primary" />
              Curriculum progress
            </span>
            <span className="font-semibold text-foreground font-mono tabular-nums">
              {batchCompletionPct}%
            </span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: `${batchCompletionPct}%` }}
            />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-muted/50 border border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-9 h-9 rounded-lg bg-primary text-white inline-flex items-center justify-center shrink-0">
              <Play size={14} fill="currentColor" />
            </span>
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-muted-foreground block">
                {data.lastLesson ? 'Continue' : 'Next up'}
              </span>
              <p className="text-sm font-semibold text-foreground truncate tracking-tight">
                {data.lastLesson
                  ? `${data.lastLesson.chapterTitle} · ${data.lastLesson.subjectDisplayName}`
                  : data.recommendation.title}
              </p>
            </div>
          </div>

          <Link
            href={data.lastLesson ? data.lastLesson.resumeHref : data.recommendation.actionHref}
            className="min-h-11 px-4 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold text-xs inline-flex items-center justify-center gap-1.5 transition-colors shrink-0 self-start sm:self-auto"
          >
            {data.lastLesson ? 'Resume' : 'Start'}
            <ArrowRight size={13} />
          </Link>
        </div>
      </section>

      <section className="space-y-5">
        <DashboardWorkspaceTabs
          activeTab={activeTab}
          onChange={setActiveTab}
          badges={{
            schedule: incompletePlanTasks.length || undefined,
            tests: data.recentTestPerformance.length || undefined,
            dpp: pendingDrillCount || undefined,
            notices: data.announcements.length || undefined,
          }}
        />

        {activeTab === 'analytics' && (
          <AnalyticsBentoCockpit
            track={canonicalId}
            score={data.recentTestPerformance[0]?.score ? Math.round(data.recentTestPerformance[0].score * 1.05) : 162}
            totalMarks={200}
            scoreDelta={14}
            accuracy={data.recentTestPerformance[0]?.accuracy || 78.4}
            accuracyDelta={4.2}
            rankEstimate={data.gamification?.rankPosition || '~140'}
            cohortSize={data.gamification?.cohortTotal || 18500}
            percentile={data.gamification?.percentile || 99.2}
            streakDays={data.gamification?.streakDays ?? data.weeklyProgress.currentStreak}
            questionsSolved={data.weeklyProgress.totalQuestionsThisWeek > 0 ? 1420 + data.weeklyProgress.totalQuestionsThisWeek : 1420}
            daysToCee={38}
          />
        )}

        {activeTab === 'schedule' && (
          <ScheduleTab
            data={data}
            completedTasks={completedTasks}
            toggleTask={toggleTask}
            claimingMissionBonus={claimingMissionBonus}
            handleClaimDailyMission={handleClaimDailyMission}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'classes' && (
          <ClassesNotesTab
            curriculumSubjects={curriculumSubjects}
            selectedSubjectId={selectedSubjectId}
            setSelectedSubjectId={setSelectedSubjectId}
            chapterSearch={chapterSearch}
            setChapterSearch={setChapterSearch}
            curriculumLoading={curriculumLoading}
            expandedChapterId={expandedChapterId}
            setExpandedChapterId={setExpandedChapterId}
            setActiveVideo={setActiveVideo}
          />
        )}

        {activeTab === 'tests' && (
          <TestsTab
            data={data}
            isSee={isSee}
          />
        )}

        {activeTab === 'dpp' && (
          <DppPracticeTab
            data={data}
            backlogMode={backlogMode}
            setBacklogMode={setBacklogMode}
            unfinishedChapterCount={unfinishedChapterCount}
            unfinishedChapterMins={unfinishedChapterMins}
            pendingDrillCount={pendingDrillCount}
            totalWeakTopicErrors={totalWeakTopicErrors}
            recoveryProgressPct={recoveryProgressPct}
            displayedBacklogQueue={displayedBacklogQueue}
          />
        )}

        {activeTab === 'doubts' && (
          <DoubtsTab
            data={data}
            doubtQuestion={doubtQuestion}
            setDoubtQuestion={setDoubtQuestion}
            handleAskDoubt={handleAskDoubt}
          />
        )}

        {activeTab === 'notices' && (
          <NoticesTab
            data={data}
          />
        )}
      </section>

      {/* ── BATCH SWITCHER MODAL ─────────────────────────────────────────── */}
      <BatchSwitchModal
        isOpen={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        availableBatches={data?.batchManagement?.availableBatches || []}
        currentBatchId={data?.batchManagement?.currentBatchId}
        onConfirmSwitch={handleSwitchBatch}
        isSwitching={switchingBatch}
      />

      {/* ── VIDEO PLAYER MODAL ───────────────────────────────────────────── */}
      {activeVideo && (
        <BatchVideoPlayerModal
          video={activeVideo}
          onClose={() => setActiveVideo(null)}
        />
      )}

      {/* ── STREAK REPAIR DRILL MODAL (ANTI-DROPOUT RECOVERY) ────────────── */}
      <StreakRepairModal
        isOpen={showStreakRepairModal}
        onClose={() => setShowStreakRepairModal(false)}
        currentStreak={data?.weeklyProgress?.currentStreak || 0}
        onConfirmRepair={handleStreakRepair}
        isRepairing={repairingStreak}
      />

      {/* ── REDEEM VOUCHER MODAL ─────────────────────────────────────────── */}
      <RedeemVoucherModal
        isOpen={showRedeemModal}
        onClose={() => setShowRedeemModal(false)}
      />
    </DashboardLayout>
  );
}
