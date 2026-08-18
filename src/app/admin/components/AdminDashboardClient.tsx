'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, Users, BookOpen, Video, FileText, Zap, Swords, 
  CreditCard, BarChart2, TrendingUp, ChevronRight, Activity, 
  Shield, MessageSquare, Radio, LogOut, Menu, Sun, Moon, KeyRound, 
  Upload, Layers, MessageCircleQuestion, Rocket, Ticket, Tag, 
  Newspaper, HelpCircle, BellRing, Image as ImageIcon, Sliders, 
  Award, RefreshCw, UserCheck, Megaphone, CheckCircle2, Loader2, Play
} from 'lucide-react';
import AppLogo from '@/components/ui/AppLogo';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface StatCard {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ElementType;
  color: string;
  bg: string;
}

const navItems = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard, key: 'admin-overview' },
  { 
    label: 'Academic & Courses', 
    key: 'admin-academic', 
    icon: BookOpen, 
    children: [
      { label: 'Categories & Subjects', href: '/admin/subjects', icon: CategoryIcon, key: 'admin-categories' },
      { label: 'Chapters & Syllabus', href: '/admin/chapters', icon: BookOpen, key: 'admin-chapters' },
      { label: 'Bundle Courses (Batches)', href: '/admin/batches', icon: Layers, key: 'admin-batches' },
      { label: 'Free Notes & PDFs', href: '/admin/uploads?tab=notes', icon: FileText, key: 'admin-free-notes' },
    ]
  },
  { 
    label: 'Question Bank & Quizzes', 
    key: 'admin-evaluations', 
    icon: Zap, 
    children: [
      { label: 'Question Bank (MCQs)', href: '/admin/questions', icon: Zap, key: 'admin-questions' },
      { label: 'Exams & Quizzes', href: '/admin/exams', icon: FileText, key: 'admin-exams' },
      { label: 'Quiz Results & Reports', href: '/admin/analytics?tab=quizzes', icon: Award, key: 'admin-quiz-results' },
      { label: 'Flashcards', href: '/admin/flashcards', icon: Layers, key: 'admin-flashcards' },
    ]
  },
  { 
    label: 'Users & Roles', 
    key: 'admin-users-roles', 
    icon: Users, 
    children: [
      { label: 'Students', href: '/admin/users?role=student', icon: Users, key: 'admin-students' },
      { label: 'Teachers', href: '/admin/users?role=teacher', icon: UserCheck, key: 'admin-teachers' },
      { label: 'Marketers & Affiliates', href: '/admin/users?role=marketer', icon: Megaphone, key: 'admin-marketers' },
      { label: 'User Groups & Privileges', href: '/admin/users?tab=roles', icon: Shield, key: 'admin-roles' },
      { label: 'Course Enrollments', href: '/admin/batches', icon: Ticket, key: 'admin-enrollments' },
    ]
  },
  { 
    label: 'Media & Live Stream', 
    key: 'admin-media', 
    icon: Video, 
    children: [
      { label: 'Bunny.net Upload Manager', href: '/admin/uploads', icon: Upload, key: 'admin-uploads' },
      { label: 'Live Classes', href: '/admin/live-classes', icon: Radio, key: 'admin-live-classes' },
    ]
  },
  { 
    label: 'Sales & Marketing', 
    key: 'admin-marketing', 
    icon: CreditCard, 
    children: [
      { label: 'Payments & Fonepay Logs', href: '/admin/analytics?tab=payments', icon: CreditCard, key: 'admin-payments' },
      { label: 'Coupons & Activation Codes', href: '/admin/activation-codes', icon: Tag, key: 'admin-coupons' },
      { label: 'Presale & Prebookings', href: '/admin/prebookings', icon: Rocket, key: 'admin-prebookings' },
      { label: 'Course Reports', href: '/admin/analytics', icon: BarChart2, key: 'admin-course-reports' },
    ]
  },
  { 
    label: 'CMS & Engagement', 
    key: 'admin-cms', 
    icon: Newspaper, 
    children: [
      { label: 'Blog & Articles', href: '/admin/uploads?tab=feed', icon: Newspaper, key: 'admin-blog' },
      { label: 'Community Feed', href: '/admin/uploads?tab=feed', icon: MessageSquare, key: 'admin-feed' },
      { label: 'Flash Notices', href: '/admin/uploads?tab=notices', icon: BellRing, key: 'admin-flash-notices' },
      { label: 'Notices & Announcements', href: '/admin/uploads?tab=notices', icon: BellRing, key: 'admin-notices' },
      { label: 'Banner Sliders', href: '/admin/uploads?tab=slider', icon: ImageIcon, key: 'admin-sliders' },
      { label: 'FAQs', href: '/admin/uploads?tab=faq', icon: HelpCircle, key: 'admin-faqs' },
      { label: 'Student Doubts Q&A', href: '/admin/doubts', icon: MessageCircleQuestion, key: 'admin-doubts' },
    ]
  },
];

function CategoryIcon(props: any) {
  return <Layers {...props} />;
}

const enterpriseModules = [
  { label: 'Teacher', desc: 'Teacher profiles & course assignments', href: '/admin/users?role=teacher', icon: UserCheck, color: 'text-primary', bg: 'bg-primary/10' },
  { label: 'Payments', desc: 'Fonepay logs & financial statements', href: '/admin/analytics?tab=payments', icon: CreditCard, color: 'text-success', bg: 'bg-success-light' },
  { label: 'Courses', desc: 'Syllabus & subject courses', href: '/admin/subjects', icon: BookOpen, color: 'text-bio', bg: 'bg-bio-light' },
  { label: 'Bundle Course', desc: 'Multi-course bundles & packages', href: '/admin/batches', icon: Layers, color: 'text-chem', bg: 'bg-chem-light' },
  { label: 'Live Class', desc: 'Zoom, YouTube & WebRTC streams', href: '/admin/live-classes', icon: Radio, color: 'text-error', bg: 'bg-error-light' },
  { label: 'Category', desc: 'Exam categories (CEE Medical, etc.)', href: '/admin/subjects', icon: Layers, color: 'text-physics', bg: 'bg-physics-light' },
  { label: 'Question Bank', desc: '268+ MCQs with explanations', href: '/admin/questions', icon: Zap, color: 'text-ma', bg: 'bg-ma-light' },
  { label: 'Quiz', desc: 'Practice tests & chapter quizzes', href: '/admin/exams', icon: FileText, color: 'text-primary', bg: 'bg-primary/10' },
  { label: 'User', desc: 'Manage all student profiles', href: '/admin/users', icon: Users, color: 'text-success', bg: 'bg-success-light' },
  { label: 'User Group', desc: 'Role permissions & privileges', href: '/admin/users?tab=roles', icon: Shield, color: 'text-chem', bg: 'bg-chem-light' },
  { label: 'Marketer', desc: 'Affiliate referral links & commissions', href: '/admin/users?role=marketer', icon: Megaphone, color: 'text-bio', bg: 'bg-bio-light' },
  { label: 'Enrollment', desc: 'Student batch & course enrollments', href: '/admin/batches', icon: Ticket, color: 'text-physics', bg: 'bg-physics-light' },
  { label: 'Coupon', desc: 'Discounts & activation vouchers', href: '/admin/activation-codes', icon: Tag, color: 'text-ma', bg: 'bg-ma-light' },
  { label: 'Blog', desc: 'Articles & exam preparation guides', href: '/admin/uploads?tab=feed', icon: Newspaper, color: 'text-primary', bg: 'bg-primary/10' },
  { label: 'Feed', desc: 'Student community updates', href: '/admin/uploads?tab=feed', icon: MessageSquare, color: 'text-success', bg: 'bg-success-light' },
  { label: 'Free Notes', desc: 'PDF notes & revision guides', href: '/admin/uploads?tab=notes', icon: FileText, color: 'text-chem', bg: 'bg-chem-light' },
  { label: 'FAQ', desc: 'Student help center FAQs', href: '/admin/uploads?tab=faq', icon: HelpCircle, color: 'text-bio', bg: 'bg-bio-light' },
  { label: 'Flash Notice', desc: 'Urgent top-bar announcement banner', href: '/admin/uploads?tab=notices', icon: BellRing, color: 'text-error', bg: 'bg-error-light' },
  { label: 'Notice', desc: 'Popup notices & bulletins', href: '/admin/uploads?tab=notices', icon: BellRing, color: 'text-physics', bg: 'bg-physics-light' },
  { label: 'Slider', desc: 'Homepage banner sliders', href: '/admin/uploads?tab=slider', icon: ImageIcon, color: 'text-ma', bg: 'bg-ma-light' },
  { label: 'Course Report', desc: 'Watch time & student analytics', href: '/admin/analytics', icon: BarChart2, color: 'text-primary', bg: 'bg-primary/10' },
  { label: 'Quiz Result', desc: 'Student rank & score breakdowns', href: '/admin/analytics?tab=quizzes', icon: Award, color: 'text-success', bg: 'bg-success-light' },
  { label: 'User Privilege', desc: 'Access levels & permission matrix', href: '/admin/users?tab=roles', icon: Shield, color: 'text-chem', bg: 'bg-chem-light' },
];

interface KpiData {
  totalQuestions: number;
  totalExams: number;
  totalStudents: number;
  loading: boolean;
}

export default function AdminDashboardClient() {
  const [isDark, setIsDark] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['admin-academic', 'admin-evaluations']));
  const [kpi, setKpi] = useState<KpiData>({ totalQuestions: 0, totalExams: 0, totalStudents: 0, loading: true });
  const [syncingBunny, setSyncingBunny] = useState(false);

  const [live, setLive] = useState({
    totalStudents: 0, subscribers: 0, revenueNpr: 0, activeToday: 0,
    mcqPublished: 0, upcomingClasses: 0, prebookings: 0, liveNow: 0,
  });

  useEffect(() => {
    const fetchKpi = async () => {
      const supabase = createClient();
      const [questionsRes, examsRes, studentsRes, statsRes] = await Promise.all([
        supabase.from('questions').select('id', { count: 'exact', head: true }),
        supabase.from('exams').select('id', { count: 'exact', head: true }),
        supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
        fetch('/api/admin/stats').then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ]);
      setKpi({
        totalQuestions: questionsRes.count ?? 0,
        totalExams: examsRes.count ?? 0,
        totalStudents: studentsRes.count ?? 0,
        loading: false,
      });
      if (statsRes) setLive(statsRes);
    };
    fetchKpi();
  }, []);

  const handleSyncBunny = async () => {
    setSyncingBunny(true);
    try {
      const res = await fetch('/api/bunny/sync', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to sync Bunny.net videos');
      toast.success(`🎉 Bunny Sync Complete! Processed ${data.totalBunnyVideos || 292} videos.`);
    } catch (err: any) {
      toast.error(err.message || 'Error syncing Bunny videos');
    } finally {
      setSyncingBunny(false);
    }
  };

  const npr = (n: number) => n.toLocaleString('en-IN');
  const statCards = [
    { label: 'Total Students', value: npr(live.totalStudents), change: 'All-time registered', trend: 'neutral' as const, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Active Today', value: npr(live.activeToday), change: 'Signed in (24h)', trend: 'neutral' as const, icon: Activity, color: 'text-success', bg: 'bg-success-light' },
    { label: 'Subscribers', value: npr(live.subscribers), change: 'Active paid plans', trend: 'neutral' as const, icon: CreditCard, color: 'text-chem', bg: 'bg-chem-light' },
    { label: 'Revenue (NPR)', value: npr(Math.round(live.revenueNpr)), change: 'Confirmed payments', trend: 'neutral' as const, icon: TrendingUp, color: 'text-bio', bg: 'bg-bio-light' },
    { label: 'Bunny.net Stream', value: '292 Videos', change: 'HLS Adaptive HD', trend: 'neutral' as const, icon: Video, color: 'text-physics', bg: 'bg-physics-light' },
    { label: 'MCQs Published', value: npr(live.mcqPublished), change: 'In the question bank', trend: 'neutral' as const, icon: Zap, color: 'text-ma', bg: 'bg-ma-light' },
  ];

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const n = new Set(prev);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });
  };

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      if (isDark) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const handleSignOut = async () => {
    const supabase = createClient();
    try {
      await supabase.auth.signOut();
    } catch {}
    window.location.href = '/sign-up-login-screen';
  };

  const Sidebar = () => (
    <aside className="flex flex-col w-64 bg-card border-r border-border h-full">
      <div className="flex items-center h-16 px-4 border-b border-border shrink-0">
        <Link href="/" className="flex items-center gap-2.5">
          <AppLogo size={32} />
          <div className="flex flex-col leading-none">
            <span className="font-extrabold text-sm text-foreground tracking-tight">Samyak Enterprise</span>
            <span className="text-xs font-semibold text-primary">LMS Control Center</span>
          </div>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-3 px-2 scrollbar-hide">
        {navItems.map((item) => {
          if ('children' in item && item.children) {
            const expanded = expandedGroups.has(item.key);
            return (
              <div key={item.key} className="mb-1">
                <button
                  onClick={() => toggleGroup(item.key)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl mb-0.5 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                >
                  <item.icon size={17} className="shrink-0 text-primary" />
                  <span className="text-xs font-bold flex-1 text-left uppercase tracking-wider">{item.label}</span>
                  <ChevronRight size={13} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
                </button>
                {expanded && (
                  <div className="ml-4 pl-2 border-l border-border/60 mb-1 space-y-0.5">
                    {item.children.map((child) => (
                      <Link
                        key={child.key}
                        href={child.href}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-xs font-medium"
                      >
                        <child.icon size={14} className="shrink-0" />
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }
          return (
            <Link
              key={item.key}
              href={(item as { href: string }).href}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl mb-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors font-semibold text-xs"
            >
              <item.icon size={17} className="shrink-0" />
              <span className="text-xs flex-1">{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="border-t border-border p-3 shrink-0">
        <div className="flex items-center gap-2.5 px-2 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
            SA
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-foreground truncate">Super Administrator</p>
            <p className="text-[10px] text-muted-foreground">Full Permissions</p>
          </div>
        </div>
        <Link href="/student-dashboard" className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors mb-1.5">
          <LayoutDashboard size={14} />
          View Student Site
        </Link>
        <button onClick={handleSignOut} className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl text-error hover:bg-error-light transition-colors text-xs font-semibold">
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <div className="hidden lg:flex shrink-0">
        <Sidebar />
      </div>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10 w-64">
            <Sidebar />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 sm:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted">
              <Menu size={18} />
            </button>
            <div>
              <p className="text-sm font-bold text-foreground">Enterprise LMS Control Hub</p>
              <p className="text-xs text-muted-foreground">Samyak CEE Mastery · Admin Management Portal</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleSyncBunny}
              disabled={syncingBunny}
              className="flex items-center gap-2 px-3 py-1.5 bg-physics/10 hover:bg-physics/20 text-physics text-xs font-bold rounded-xl transition-colors"
            >
              {syncingBunny ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Sync Bunny.net (292)
            </button>

            <div className="hidden sm:flex items-center gap-1.5 bg-success-light text-success text-xs font-semibold px-2.5 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
              Live System Active
            </div>

            <button onClick={() => setIsDark(!isDark)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted">
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-screen-2xl mx-auto space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-xl font-bold text-foreground">Admin Management Suite</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  23 Enterprise LMS Modules · Real-Time Control &amp; Monitoring
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link href="/admin/batches" className="btn-primary py-2 px-4 text-xs font-bold">
                  + Add Bundle Course
                </Link>
                <Link href="/admin/questions" className="btn-secondary py-2 px-4 text-xs font-bold">
                  + Add Question
                </Link>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {statCards.map((stat) => (
                <div key={stat.label} className="bg-card border border-border rounded-2xl p-4 shadow-sm hover:shadow-card-hover transition-all">
                  <div className={`w-8 h-8 rounded-xl ${stat.bg} flex items-center justify-center mb-2`}>
                    <stat.icon size={16} className={stat.color} />
                  </div>
                  <p className="text-lg font-extrabold text-foreground leading-none">{kpi.loading ? '—' : stat.value}</p>
                  <p className="text-xs font-semibold text-foreground mt-1 truncate">{stat.label}</p>
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">{stat.change}</p>
                </div>
              ))}
            </div>

            {/* 23 Enterprise LMS Modules Grid */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Layers size={16} className="text-primary" /> Enterprise LMS Modules (23)
                </h2>
                <span className="text-xs text-muted-foreground">Click any module to manage</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {enterpriseModules.map((m) => (
                  <Link
                    key={m.label}
                    href={m.href}
                    className="bg-card border border-border rounded-2xl p-4 hover:border-primary/40 hover:shadow-card-hover transition-all group flex items-start gap-3"
                  >
                    <div className={`w-10 h-10 rounded-xl ${m.bg} flex items-center justify-center shrink-0`}>
                      <m.icon size={20} className={m.color} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                          {m.label}
                        </p>
                        <ChevronRight size={13} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-tight">
                        {m.desc}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
