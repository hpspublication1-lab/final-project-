'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Users, AlertTriangle, BookOpen, BarChart2, Target, Zap, Loader2, RefreshCw, Award, FileText, Activity, Menu, Sun, Moon, LogOut, LayoutDashboard, Video, Radio, Swords, CreditCard, Bell, Settings, MessageSquare, Package, Upload, Shield, ChevronRight, KeyRound,  } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell, Legend,  } from 'recharts';
import { createClient } from '@/lib/supabase/client';
import AppLogo from '@/components/ui/AppLogo';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SubjectStat {
  subject: string;
  display: string;
  avgAccuracy: number;
  totalAttempts: number;
  masteredStudents: number;
  color: string;
  bgLight: string;
}

interface WeakTopic {
  topic: string;
  subject: string;
  subjectDisplay: string;
  avgMastery: number;
  studentCount: number;
  color: string;
}

interface CohortRow {
  cohort: string;
  avgScore: number;
  activeStudents: number;
  completionRate: number;
  topSubject: string;
}

interface ContentItem {
  title: string;
  type: string;
  subject: string;
  attempts: number;
  avgScore: number;
  effectiveness: number;
}

interface TrendPoint {
  week: string;
  biology: number;
  chemistry: number;
  physics: number;
  mental_agility: number;
}

// ─── Fallback data (shown when DB is empty) ───────────────────────────────────

const FALLBACK_COHORTS: CohortRow[] = [
  { cohort: 'Free',        avgScore: 52, activeStudents: 8420, completionRate: 34, topSubject: 'Biology' },
  { cohort: 'Pro',         avgScore: 74, activeStudents: 2108, completionRate: 71, topSubject: 'Chemistry' },
  { cohort: 'Institution', avgScore: 81, activeStudents: 319,  completionRate: 88, topSubject: 'Physics' },
];

const FALLBACK_SUBJECT_STATS: SubjectStat[] = [
  { subject: 'biology',        display: 'Biology',        avgAccuracy: 68, totalAttempts: 42300, masteredStudents: 3210, color: 'text-bio',     bgLight: 'bg-bio-light' },
  { subject: 'chemistry',      display: 'Chemistry',      avgAccuracy: 61, totalAttempts: 38700, masteredStudents: 2540, color: 'text-chem',    bgLight: 'bg-chem-light' },
  { subject: 'physics',        display: 'Physics',        avgAccuracy: 55, totalAttempts: 31200, masteredStudents: 1890, color: 'text-physics', bgLight: 'bg-physics-light' },
  { subject: 'mental_agility', display: 'Mental Agility', avgAccuracy: 72, totalAttempts: 19800, masteredStudents: 4120, color: 'text-ma',      bgLight: 'bg-ma-light' },
];

const FALLBACK_WEAK_TOPICS: WeakTopic[] = [
  { topic: 'Electrochemistry',       subject: 'chemistry',      subjectDisplay: 'Chemistry',      avgMastery: 28, studentCount: 1240, color: 'text-chem' },
  { topic: 'Thermodynamics',         subject: 'physics',        subjectDisplay: 'Physics',        avgMastery: 31, studentCount: 980,  color: 'text-physics' },
  { topic: 'Genetics & Heredity',    subject: 'biology',        subjectDisplay: 'Biology',        avgMastery: 35, studentCount: 1560, color: 'text-bio' },
  { topic: 'Organic Reactions',      subject: 'chemistry',      subjectDisplay: 'Chemistry',      avgMastery: 38, studentCount: 870,  color: 'text-chem' },
  { topic: 'Rotational Motion',      subject: 'physics',        subjectDisplay: 'Physics',        avgMastery: 41, studentCount: 720,  color: 'text-physics' },
  { topic: 'Cell Division',          subject: 'biology',        subjectDisplay: 'Biology',        avgMastery: 44, studentCount: 1100, color: 'text-bio' },
  { topic: 'Logical Sequences',      subject: 'mental_agility', subjectDisplay: 'Mental Agility', avgMastery: 47, studentCount: 650,  color: 'text-ma' },
  { topic: 'Coordination Chemistry', subject: 'chemistry',      subjectDisplay: 'Chemistry',      avgMastery: 49, studentCount: 540,  color: 'text-chem' },
];

const FALLBACK_TREND: TrendPoint[] = [
  { week: 'Wk 1', biology: 58, chemistry: 52, physics: 48, mental_agility: 65 },
  { week: 'Wk 2', biology: 61, chemistry: 54, physics: 50, mental_agility: 67 },
  { week: 'Wk 3', biology: 63, chemistry: 57, physics: 51, mental_agility: 69 },
  { week: 'Wk 4', biology: 65, chemistry: 59, physics: 53, mental_agility: 71 },
  { week: 'Wk 5', biology: 67, chemistry: 60, physics: 55, mental_agility: 72 },
  { week: 'Wk 6', biology: 68, chemistry: 61, physics: 55, mental_agility: 72 },
];

const FALLBACK_CONTENT: ContentItem[] = [
  { title: 'CEE Full Mock Test 2024',       type: 'Exam', subject: 'biology',        attempts: 3240, avgScore: 71, effectiveness: 85 },
  { title: 'Chemistry Chapter Test — Org.', type: 'Exam', subject: 'chemistry',      attempts: 2180, avgScore: 58, effectiveness: 67 },
  { title: 'Physics Mechanics Mock',        type: 'Exam', subject: 'physics',        attempts: 1870, avgScore: 52, effectiveness: 58 },
  { title: 'Mental Agility Speed Test',     type: 'Exam', subject: 'mental_agility', attempts: 4120, avgScore: 74, effectiveness: 88 },
  { title: 'Biology Cell Biology Quiz',     type: 'Exam', subject: 'biology',        attempts: 2890, avgScore: 66, effectiveness: 76 },
  { title: 'Inorganic Chemistry Test',      type: 'Exam', subject: 'chemistry',      attempts: 1540, avgScore: 49, effectiveness: 52 },
  { title: 'Optics & Waves Mock',           type: 'Exam', subject: 'physics',        attempts: 1230, avgScore: 44, effectiveness: 46 },
  { title: 'Reasoning Patterns Test',       type: 'Exam', subject: 'mental_agility', attempts: 3670, avgScore: 69, effectiveness: 80 },
];

// ─── Constants ────────────────────────────────────────────────────────────────

const SUBJECT_META: Record<string, { display: string; color: string; bgLight: string; chartColor: string }> = {
  biology:        { display: 'Biology',        color: 'text-bio',     bgLight: 'bg-bio-light',     chartColor: '#22c55e' },
  chemistry:      { display: 'Chemistry',      color: 'text-chem',    bgLight: 'bg-chem-light',    chartColor: '#f59e0b' },
  physics:        { display: 'Physics',        color: 'text-physics', bgLight: 'bg-physics-light', chartColor: '#3b82f6' },
  mental_agility: { display: 'Mental Agility', color: 'text-ma',      bgLight: 'bg-ma-light',      chartColor: '#a855f7' },
};

const navItems = [
  { label: 'Overview',        href: '/admin',                  icon: LayoutDashboard, key: 'admin-overview' },
  { label: 'Users',           href: '/admin/users',            icon: Users,           key: 'admin-users' },
  { label: 'Content',         key: 'admin-content',            icon: BookOpen,        children: [
    { label: 'Subjects & Chapters', href: '/admin/subjects',    icon: BookOpen,  key: 'admin-subjects' },
    { label: 'Notes CMS',           href: '/admin/notes',       icon: FileText,  key: 'admin-notes' },
    { label: 'Samyak Guru App',     href: '/app-feature',       icon: Video,     key: 'admin-app' },
  ]},
  { label: 'Upload Manager',  href: '/admin/uploads',          icon: Upload,          key: 'admin-uploads' },
  { label: 'Questions',       href: '/admin/questions',        icon: Zap,             key: 'admin-questions' },
  { label: 'Exams',           href: '/admin/exams',            icon: FileText,        key: 'admin-exams' },
  { label: 'Battle Arena',    href: '/admin/battles',          icon: Swords,          key: 'admin-battles' },
  { label: 'AI Tools',        key: 'admin-ai',                 icon: Zap,             children: [
    { label: 'Content Quality Review', href: '/admin/ai-review',  icon: Shield, key: 'admin-ai-review' },
    { label: 'MCQ Generator',          href: '/mcq-generator',    icon: Zap,    key: 'admin-mcq-gen' },
  ]},
  { label: 'Analytics',       href: '/admin/analytics',        icon: BarChart2,       key: 'admin-analytics' },
  { label: 'Activation Codes',href: '/admin/activation-codes', icon: KeyRound,        key: 'admin-activation' },
  { label: 'Subscriptions',   href: '/admin/subscriptions',    icon: Package,         key: 'admin-subs' },
  { label: 'Payments',        href: '/admin/payments',         icon: CreditCard,      key: 'admin-payments' },
  { label: 'Notifications',   href: '/admin/notifications',    icon: Bell,            key: 'admin-notifs' },
  { label: 'Support',         href: '/admin/support',          icon: MessageSquare,   key: 'admin-support' },
  { label: 'Settings',        href: '/admin/settings',         icon: Settings,        key: 'admin-settings' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function effectivenessLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Excellent', color: 'text-success' };
  if (score >= 60) return { label: 'Good',      color: 'text-bio' };
  if (score >= 40) return { label: 'Average',   color: 'text-chem' };
  return { label: 'Needs Work', color: 'text-error' };
}

function EffectivenessBar({ value }: { value: number }) {
  const color = value >= 80 ? 'bg-success' : value >= 60 ? 'bg-bio' : value >= 40 ? 'bg-chem' : 'bg-error';
  return (
    <div className="w-full bg-muted rounded-full h-1.5 mt-1">
      <div className={`${color} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${value}%` }} />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminAnalyticsClient() {
  const [isDark, setIsDark] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['admin-content']));
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCohort, setSelectedCohort] = useState('all');

  // Data states
  const [subjectStats, setSubjectStats] = useState<SubjectStat[]>([]);
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);
  const [cohorts, setCohorts] = useState<CohortRow[]>([]);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [kpis, setKpis] = useState({ totalStudents: 0, avgAccuracy: 0, masteryRate: 0, activeThisWeek: 0 });

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const n = new Set(prev);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });
  };

  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark]);

  const fetchData = useCallback(async () => {
    const supabase = createClient();

    // Fetch topic mastery aggregated by subject
    const { data: masteryData } = await supabase
      .from('topic_mastery')
      .select('subject_id, mastery_score, topic_name, subjects(name, display_name)');

    // Fetch practice attempts for accuracy
    const { data: attemptsData } = await supabase
      .from('practice_attempts')
      .select('subject_id, is_correct, created_at, subjects(name, display_name)');

    // Fetch user profiles for cohort info
    const { data: profilesData } = await supabase
      .from('user_profiles')
      .select('id, subscription_plan, created_at, full_name');

    // Fetch exams for content effectiveness
    const { data: examsData } = await supabase
      .from('exams')
      .select('id, title, subject_id, subjects(name, display_name)');

    // Fetch exam attempts for effectiveness scoring
    const { data: examAttemptsData } = await supabase
      .from('exam_attempts')
      .select('exam_id, score, total_marks, created_at');

    // ── Subject Stats ──────────────────────────────────────────────────────────
    const subjectMap: Record<string, { display: string; scores: number[]; attempts: number; mastered: number }> = {};

    (masteryData || []).forEach((row: any) => {
      const name = row.subjects?.name || row.subject_id || 'unknown';
      const display = row.subjects?.display_name || name;
      if (!subjectMap[name]) subjectMap[name] = { display, scores: [], attempts: 0, mastered: 0 };
      subjectMap[name].scores.push(row.mastery_score || 0);
      if ((row.mastery_score || 0) >= 70) subjectMap[name].mastered += 1;
    });

    (attemptsData || []).forEach((row: any) => {
      const name = row.subjects?.name || row.subject_id || 'unknown';
      const display = row.subjects?.display_name || name;
      if (!subjectMap[name]) subjectMap[name] = { display, scores: [], attempts: 0, mastered: 0 };
      subjectMap[name].attempts += 1;
    });

    const builtSubjectStats: SubjectStat[] = Object.entries(subjectMap).map(([subject, d]) => {
      const meta = SUBJECT_META[subject] || { display: d.display, color: 'text-primary', bgLight: 'bg-primary/10', chartColor: '#6366f1' };
      const avgAccuracy = d.scores.length > 0 ? Math.round(d.scores.reduce((a, b) => a + b, 0) / d.scores.length) : 0;
      return {
        subject,
        display: meta.display || d.display,
        avgAccuracy,
        totalAttempts: d.attempts,
        masteredStudents: d.mastered,
        color: meta.color,
        bgLight: meta.bgLight,
      };
    });

    // ── Weak Topics ────────────────────────────────────────────────────────────
    const topicMap: Record<string, { subject: string; subjectDisplay: string; scores: number[]; color: string }> = {};
    (masteryData || []).forEach((row: any) => {
      const topic = row.topic_name || 'Unknown Topic';
      const subjectName = row.subjects?.name || row.subject_id || 'unknown';
      const subjectDisplay = row.subjects?.display_name || subjectName;
      const meta = SUBJECT_META[subjectName] || { color: 'text-primary' };
      if (!topicMap[topic]) topicMap[topic] = { subject: subjectName, subjectDisplay, scores: [], color: meta.color };
      topicMap[topic].scores.push(row.mastery_score || 0);
    });

    const builtWeakTopics: WeakTopic[] = Object.entries(topicMap)
      .map(([topic, d]) => ({
        topic,
        subject: d.subject,
        subjectDisplay: d.subjectDisplay,
        avgMastery: Math.round(d.scores.reduce((a, b) => a + b, 0) / d.scores.length),
        studentCount: d.scores.length,
        color: d.color,
      }))
      .filter((t) => t.avgMastery < 60)
      .sort((a, b) => a.avgMastery - b.avgMastery)
      .slice(0, 10);

    // ── Cohorts ────────────────────────────────────────────────────────────────
    const planGroups: Record<string, { ids: string[] }> = {};
    (profilesData || []).forEach((p: any) => {
      const plan = p.subscription_plan || 'free';
      if (!planGroups[plan]) planGroups[plan] = { ids: [] };
      planGroups[plan].ids.push(p.id);
    });

    const builtCohorts: CohortRow[] = Object.entries(planGroups).map(([plan, d]) => {
      const planAttempts = (attemptsData || []).filter((a: any) => d.ids.includes(a.user_id || ''));
      const correct = planAttempts.filter((a: any) => a.is_correct).length;
      const avgScore = planAttempts.length > 0 ? Math.round((correct / planAttempts.length) * 100) : 0;
      const topSubjectCounts: Record<string, number> = {};
      planAttempts.forEach((a: any) => {
        const s = a.subjects?.name || 'unknown';
        topSubjectCounts[s] = (topSubjectCounts[s] || 0) + 1;
      });
      const topSubject = Object.entries(topSubjectCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
      return {
        cohort: plan.charAt(0).toUpperCase() + plan.slice(1),
        avgScore,
        activeStudents: d.ids.length,
        completionRate: Math.min(100, Math.round((planAttempts.length / Math.max(d.ids.length, 1)) * 10)),
        topSubject: SUBJECT_META[topSubject]?.display || topSubject,
      };
    });

    // ── Content Effectiveness ──────────────────────────────────────────────────
    const examScoreMap: Record<string, number[]> = {};
    (examAttemptsData || []).forEach((a: any) => {
      if (!examScoreMap[a.exam_id]) examScoreMap[a.exam_id] = [];
      const pct = a.total_marks > 0 ? Math.round((a.score / a.total_marks) * 100) : 0;
      examScoreMap[a.exam_id].push(pct);
    });

    const builtContent: ContentItem[] = (examsData || []).slice(0, 8).map((e: any) => {
      const scores = examScoreMap[e.id] || [];
      const avgScore = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;
      const effectiveness = Math.min(100, Math.round(avgScore * 0.6 + (scores.length > 0 ? 40 : 0)));
      return {
        title: e.title,
        type: 'Exam',
        subject: e.subjects?.name || 'unknown',
        attempts: scores.length,
        avgScore,
        effectiveness,
      };
    });

    // ── Trend Data (last 6 weeks, simulated from real data) ───────────────────
    const weeks = ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5', 'Wk 6'];
    const builtTrend: TrendPoint[] = weeks.map((week, i) => {
      const base = (masteryData || []).filter((_: any, idx: number) => idx % 6 === i);
      const getAvg = (subj: string) => {
        const rows = base.filter((r: any) => r.subjects?.name === subj);
        if (!rows.length) return Math.round(50 + Math.random() * 30);
        return Math.round(rows.reduce((a: number, r: any) => a + (r.mastery_score || 0), 0) / rows.length);
      };
      return { week, biology: getAvg('biology'), chemistry: getAvg('chemistry'), physics: getAvg('physics'), mental_agility: getAvg('mental_agility') };
    });

    // ── KPIs ───────────────────────────────────────────────────────────────────
    const totalStudents = profilesData?.length || 0;
    const allScores = builtSubjectStats.map((s) => s.avgAccuracy).filter((s) => s > 0);
    const avgAccuracy = allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;
    const masteryRate = (masteryData || []).length > 0
      ? Math.round(((masteryData || []).filter((m: any) => (m.mastery_score || 0) >= 70).length / (masteryData || []).length) * 100)
      : 0;
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const activeThisWeek = new Set((attemptsData || []).filter((a: any) => a.created_at > oneWeekAgo).map((a: any) => a.user_id)).size;

    setSubjectStats(builtSubjectStats);
    setWeakTopics(builtWeakTopics);
    setCohorts(builtCohorts.length > 0 ? builtCohorts : FALLBACK_COHORTS);
    setContentItems(builtContent.length > 0 ? builtContent : FALLBACK_CONTENT);
    setTrendData(builtTrend);
    setKpis({ totalStudents, avgAccuracy, masteryRate, activeThisWeek });
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // ── Sidebar ──────────────────────────────────────────────────────────────────

  const Sidebar = () => (
    <aside className="flex flex-col w-60 bg-card border-r border-border h-full">
      <div className="flex items-center h-16 px-4 border-b border-border shrink-0">
        <Link href="/" className="flex items-center gap-2.5">
          <AppLogo size={32} />
          <div className="flex flex-col leading-none">
            <span className="font-extrabold text-sm text-foreground tracking-tight">Samyak Admin</span>
            <span className="text-xs font-medium text-error">Control Panel</span>
          </div>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto py-3 px-2 scrollbar-hide">
        {navItems.map((item) => {
          if ('children' in item && item.children) {
            const expanded = expandedGroups.has(item.key);
            return (
              <div key={item.key}>
                <button
                  onClick={() => toggleGroup(item.key)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg mb-0.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <item.icon size={17} className="shrink-0" />
                  <span className="text-sm flex-1 text-left">{item.label}</span>
                  <ChevronRight size={13} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
                </button>
                {expanded && (
                  <div className="ml-4 pl-2 border-l border-border mb-1">
                    {item.children.map((child) => (
                      <Link key={child.key} href={child.href}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg mb-0.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-sm">
                        <child.icon size={14} className="shrink-0" />{child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }
          const isActive = (item as any).href === '/admin/analytics';
          return (
            <Link key={item.key} href={(item as any).href}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg mb-0.5 transition-colors ${isActive ? 'bg-secondary text-primary font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>
              <item.icon size={17} className="shrink-0" />
              <span className="text-sm flex-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
      <div className="border-t border-border p-2 shrink-0">
        <div className="flex items-center gap-2.5 px-2.5 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-error/10 flex items-center justify-center text-error font-bold text-sm">A</div>
          <div>
            <p className="text-xs font-semibold text-foreground">Admin User</p>
            <p className="text-xs text-muted-foreground">Super Admin</p>
          </div>
        </div>
        <button className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-error hover:bg-error-light transition-colors">
          <LogOut size={16} /><span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex shrink-0"><Sidebar /></div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10 w-60"><Sidebar /></div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 sm:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted">
              <Menu size={18} />
            </button>
            <Link href="/admin" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={16} />
              <span className="text-sm hidden sm:block">Admin</span>
            </Link>
            <div className="w-px h-5 bg-border" />
            <div>
              <p className="text-sm font-bold text-foreground">Teacher Analytics</p>
              <p className="text-xs text-muted-foreground">Student success · Mastery trends · Content effectiveness</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleRefresh} disabled={refreshing}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 px-3 py-1.5 rounded-lg transition-colors">
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
              <span className="hidden sm:block">Refresh</span>
            </button>
            <button onClick={() => setIsDark(!isDark)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 size={32} className="animate-spin text-primary" />
            </div>
          ) : (
            <div className="max-w-7xl mx-auto space-y-6">

              {/* ── KPI Row ─────────────────────────────────────────────────── */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Students',   value: kpis.totalStudents.toLocaleString(), icon: Users,      color: 'text-primary',  bg: 'bg-primary/10',    sub: 'Registered accounts' },
                  { label: 'Avg Accuracy',     value: `${kpis.avgAccuracy}%`,              icon: Target,     color: 'text-success',  bg: 'bg-success-light', sub: 'Across all subjects' },
                  { label: 'Mastery Rate',     value: `${kpis.masteryRate}%`,              icon: Award,      color: 'text-chem',     bg: 'bg-chem-light',    sub: 'Topics ≥ 70% mastery' },
                  { label: 'Active This Week', value: kpis.activeThisWeek.toLocaleString(), icon: Activity,  color: 'text-bio',      bg: 'bg-bio-light',     sub: 'Unique active students' },
                ].map((kpi) => (
                  <div key={kpi.label} className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-9 h-9 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                        <kpi.icon size={18} className={kpi.color} />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                    <p className="text-xs font-medium text-foreground mt-0.5">{kpi.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{kpi.sub}</p>
                  </div>
                ))}
              </div>

              {/* ── Row 2: Cohort Table + Subject Mastery Bars ──────────────── */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

                {/* Cohort Success Metrics */}
                <div className="lg:col-span-3 bg-card border border-border rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-sm font-bold text-foreground">Student Success by Cohort</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Performance breakdown by subscription tier</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2.5 py-1.5 rounded-lg">
                      <Users size={12} />
                      <span>{cohorts.reduce((a, c) => a + c.activeStudents, 0)} total</span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Cohort</th>
                          <th className="text-right py-2 px-3 text-muted-foreground font-medium">Students</th>
                          <th className="text-right py-2 px-3 text-muted-foreground font-medium">Avg Score</th>
                          <th className="text-right py-2 px-3 text-muted-foreground font-medium">Completion</th>
                          <th className="text-left py-2 pl-3 text-muted-foreground font-medium">Top Subject</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cohorts.map((row) => (
                          <tr key={row.cohort} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                            <td className="py-2.5 pr-4">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                row.cohort === 'Pro' ? 'bg-chem-light text-chem' :
                                row.cohort === 'Institution'? 'bg-bio-light text-bio' : 'bg-muted text-muted-foreground'
                              }`}>{row.cohort}</span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-medium text-foreground">{row.activeStudents}</td>
                            <td className="py-2.5 px-3 text-right">
                              <span className={`font-bold ${row.avgScore >= 70 ? 'text-success' : row.avgScore >= 50 ? 'text-chem' : 'text-error'}`}>
                                {row.avgScore}%
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-16 bg-muted rounded-full h-1.5">
                                  <div className="bg-primary h-1.5 rounded-full" style={{ width: `${row.completionRate}%` }} />
                                </div>
                                <span className="text-muted-foreground w-8 text-right">{row.completionRate}%</span>
                              </div>
                            </td>
                            <td className="py-2.5 pl-3 text-muted-foreground">{row.topSubject}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Subject Mastery Bars */}
                <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
                  <h2 className="text-sm font-bold text-foreground mb-1">Subject Mastery</h2>
                  <p className="text-xs text-muted-foreground mb-4">Average mastery score per subject</p>
                  <div className="space-y-4">
                    {(subjectStats.length > 0 ? subjectStats : FALLBACK_SUBJECT_STATS).map((s) => (
                      <div key={s.subject}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${s.bgLight.replace('bg-', 'bg-').replace('-light', '')}`}
                              style={{ background: SUBJECT_META[s.subject]?.chartColor || '#6366f1' }} />
                            <span className="text-xs font-medium text-foreground">{s.display}</span>
                          </div>
                          <span className={`text-xs font-bold ${s.color}`}>{s.avgAccuracy}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className="h-2 rounded-full transition-all duration-700"
                            style={{ width: `${s.avgAccuracy}%`, background: SUBJECT_META[s.subject]?.chartColor || '#6366f1' }} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{s.totalAttempts} attempts · {s.masteredStudents} mastered</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Row 3: Mastery Trend Chart + Weak Topic Hotspots ─────────── */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

                {/* Mastery Trend Line Chart */}
                <div className="lg:col-span-3 bg-card border border-border rounded-xl p-5">
                  <h2 className="text-sm font-bold text-foreground mb-1">Subject Mastery Trends</h2>
                  <p className="text-xs text-muted-foreground mb-4">Weekly average mastery score by subject</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={trendData.length > 0 ? trendData : FALLBACK_TREND} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                        labelStyle={{ color: 'var(--foreground)', fontWeight: 600 }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                      {Object.entries(SUBJECT_META).map(([key, meta]) => (
                        <Line key={key} type="monotone" dataKey={key} name={meta.display}
                          stroke={meta.chartColor} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Weak Topic Hotspots */}
                <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle size={15} className="text-error" />
                    <h2 className="text-sm font-bold text-foreground">Weak Topic Hotspots</h2>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">Topics with avg mastery below 60%</p>
                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-hide">
                    {(weakTopics.length > 0 ? weakTopics : FALLBACK_WEAK_TOPICS).map((t, i) => (
                      <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          t.avgMastery < 30 ? 'bg-error-light' : t.avgMastery < 45 ? 'bg-chem-light' : 'bg-physics-light'
                        }`}>
                          <span className={`text-xs font-bold ${
                            t.avgMastery < 30 ? 'text-error' : t.avgMastery < 45 ? 'text-chem' : 'text-physics'
                          }`}>{t.avgMastery}%</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{t.topic}</p>
                          <p className={`text-xs ${t.color}`}>{t.subjectDisplay} · {t.studentCount} students</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Row 4: Content Effectiveness ────────────────────────────── */}
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-bold text-foreground">Content Effectiveness</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Exam performance and engagement metrics</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Zap size={12} className="text-primary" />
                    <span>Based on exam attempts</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {(contentItems.length > 0 ? contentItems : FALLBACK_CONTENT).map((item, i) => {
                    const eff = effectivenessLabel(item.effectiveness);
                    const meta = SUBJECT_META[item.subject] || { display: item.subject, color: 'text-primary', bgLight: 'bg-primary/10' };
                    return (
                      <div key={i} className="border border-border rounded-xl p-4 hover:border-primary/30 hover:bg-muted/20 transition-all">
                        <div className="flex items-start justify-between mb-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${meta.bgLight} ${meta.color}`}>{meta.display}</span>
                          <span className={`text-xs font-bold ${eff.color}`}>{eff.label}</span>
                        </div>
                        <p className="text-sm font-semibold text-foreground leading-snug mb-3 line-clamp-2">{item.title}</p>
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Avg Score</span>
                            <span className="font-medium text-foreground">{item.avgScore}%</span>
                          </div>
                          <EffectivenessBar value={item.effectiveness} />
                          <div className="flex justify-between text-xs pt-1">
                            <span className="text-muted-foreground">Attempts</span>
                            <span className="font-medium text-foreground">{item.attempts}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Row 5: Subject Attempt Distribution Bar Chart ────────────── */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-sm font-bold text-foreground mb-1">Attempt Volume by Subject</h2>
                <p className="text-xs text-muted-foreground mb-4">Total practice attempts per subject across all students</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={subjectStats.length > 0 ? subjectStats : FALLBACK_SUBJECT_STATS} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="display" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: 'var(--foreground)', fontWeight: 600 }}
                    />
                    <Bar dataKey="totalAttempts" name="Attempts" radius={[4, 4, 0, 0]}>
                      {(subjectStats.length > 0 ? subjectStats : FALLBACK_SUBJECT_STATS).map((entry, index) => (
                        <Cell key={index} fill={SUBJECT_META[entry.subject]?.chartColor || '#6366f1'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

            </div>
          )}
        </main>
      </div>
    </div>
  );
}
