'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard, Users, BookOpen, Video, FileText, Zap,
  CreditCard, BarChart2, TrendingUp, ChevronRight, Activity,
  Shield, MessageSquare, Radio, LogOut, Menu, Sun, Moon, KeyRound,
  Upload, Layers, MessageCircleQuestion, Ticket, Tag,
  BellRing, Sliders, Award, RefreshCw, UserCheck, Megaphone,
  CheckCircle2, Loader2, Play, ExternalLink
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

// Exactly covers the 21 canonical Admin Modules
const navItems = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard, key: 'admin-overview' },
  {
    label: 'Academic & Curriculum',
    key: 'admin-academic',
    icon: BookOpen,
    children: [
      { label: 'Courses & Programs', href: '/admin/courses', icon: BookOpen, key: 'admin-courses' },
      { label: 'Batches (Cohorts)', href: '/admin/batches', icon: Layers, key: 'admin-batches' },
      { label: 'Subjects & Chapters', href: '/admin/subjects', icon: Layers, key: 'admin-subjects' },
      { label: 'Lessons & Videos', href: '/admin/lessons', icon: Video, key: 'admin-lessons' },
      { label: 'Study Resources & PDFs', href: '/admin/resources', icon: FileText, key: 'admin-resources' },
    ],
  },
  {
    label: 'Assessments & Questions',
    key: 'admin-assessment',
    icon: Zap,
    children: [
      { label: 'Question Bank (MCQs)', href: '/admin/questions', icon: Zap, key: 'admin-questions' },
      { label: 'Tests & Mock Exams', href: '/admin/exams', icon: FileText, key: 'admin-exams' },
    ],
  },
  {
    label: 'Users & Privileges',
    key: 'admin-users',
    icon: Users,
    children: [
      { label: 'Students Directory', href: '/admin/users?role=student', icon: Users, key: 'admin-students' },
      { label: 'Teachers & Faculty', href: '/admin/teachers', icon: UserCheck, key: 'admin-teachers' },
      { label: 'Roles & Permissions', href: '/admin/roles', icon: Shield, key: 'admin-roles' },
      { label: 'Course Enrollments', href: '/admin/enrollments', icon: Ticket, key: 'admin-enrollments' },
    ],
  },
  {
    label: 'Finance & Commerce',
    key: 'admin-finance',
    icon: CreditCard,
    children: [
      { label: 'Orders & Payments', href: '/admin/orders', icon: CreditCard, key: 'admin-orders' },
      { label: 'Coupons & Vouchers', href: '/admin/coupons', icon: Tag, key: 'admin-coupons' },
    ],
  },
  {
    label: 'Classroom & Interaction',
    key: 'admin-classroom',
    icon: Radio,
    children: [
      { label: 'Live Virtual Classes', href: '/admin/live-classes', icon: Radio, key: 'admin-live-classes' },
      { label: 'Student Doubts & Q&A', href: '/admin/doubts', icon: MessageCircleQuestion, key: 'admin-doubts' },
      { label: 'Broadcast Bulletins', href: '/admin/announcements', icon: Megaphone, key: 'admin-announcements' },
      { label: 'Push Notifications', href: '/admin/notifications', icon: BellRing, key: 'admin-notifications' },
    ],
  },
  {
    label: 'Governance & Reporting',
    key: 'admin-governance',
    icon: Sliders,
    children: [
      { label: 'Operational Reports', href: '/admin/reports', icon: BarChart2, key: 'admin-reports' },
      { label: 'Platform Settings', href: '/admin/settings', icon: Sliders, key: 'admin-settings' },
      { label: 'Immutable Audit Logs', href: '/admin/audit-logs', icon: Shield, key: 'admin-audit-logs' },
    ],
  },
];

// 21 Canonical Modules Dashboard Directory
const canonicalModules = [
  { label: 'Overview', desc: 'Real-time operational dashboard & metrics', href: '/admin', icon: LayoutDashboard, color: 'text-primary', bg: 'bg-primary/10' },
  { label: 'Students', desc: 'Registered student accounts, progress & status', href: '/admin/users?role=student', icon: Users, color: 'text-success', bg: 'bg-success-light' },
  { label: 'Teachers & Staff', desc: 'Faculty profiles, subject & batch assignments', href: '/admin/teachers', icon: UserCheck, color: 'text-bio', bg: 'bg-bio-light' },
  { label: 'Roles & Permissions', desc: 'RBAC permissions matrix & super admin roles', href: '/admin/roles', icon: Shield, color: 'text-chem', bg: 'bg-chem-light' },
  { label: 'Courses', desc: 'Samyak flagship course catalog & archiving', href: '/admin/courses', icon: BookOpen, color: 'text-physics', bg: 'bg-physics-light' },
  { label: 'Batches', desc: 'Cohort schedules, start dates & capacities', href: '/admin/batches', icon: Layers, color: 'text-ma', bg: 'bg-ma-light' },
  { label: 'Subjects & Chapters', desc: 'Curriculum structure, weightage & chapters', href: '/admin/subjects', icon: Layers, color: 'text-primary', bg: 'bg-primary/10' },
  { label: 'Lessons & Videos', desc: 'HLS video streaming & free preview flags', href: '/admin/lessons', icon: Video, color: 'text-success', bg: 'bg-success-light' },
  { label: 'Resources', desc: 'PDF notes, formula sheets & model papers', href: '/admin/resources', icon: FileText, color: 'text-chem', bg: 'bg-chem-light' },
  { label: 'Question Bank', desc: 'MCQs with KaTeX math & exam tagging', href: '/admin/questions', icon: Zap, color: 'text-ma', bg: 'bg-ma-light' },
  { label: 'Tests & Quizzes', desc: 'CEE 200Q mocks, SEE model exams & scoring', href: '/admin/exams', icon: FileText, color: 'text-primary', bg: 'bg-primary/10' },
  { label: 'Live Classes', desc: 'Zoom/100ms interactive live lectures', href: '/admin/live-classes', icon: Radio, color: 'text-error', bg: 'bg-error-light' },
  { label: 'Doubts', desc: 'Student query triage & teacher replies', href: '/admin/doubts', icon: MessageCircleQuestion, color: 'text-physics', bg: 'bg-physics-light' },
  { label: 'Enrollments', desc: 'Access period grants & manual enrollments', href: '/admin/enrollments', icon: Ticket, color: 'text-bio', bg: 'bg-bio-light' },
  { label: 'Orders & Payments', desc: 'Fonepay/bank verification & refund audit', href: '/admin/orders', icon: CreditCard, color: 'text-success', bg: 'bg-success-light' },
  { label: 'Coupons', desc: 'Discount voucher generator & activation codes', href: '/admin/coupons', icon: Tag, color: 'text-ma', bg: 'bg-ma-light' },
  { label: 'Announcements', desc: 'Urgent notices & student bulletin broadcasts', href: '/admin/announcements', icon: Megaphone, color: 'text-primary', bg: 'bg-primary/10' },
  { label: 'Notifications', desc: 'In-app transactional alerts & notifications', href: '/admin/notifications', icon: BellRing, color: 'text-chem', bg: 'bg-chem-light' },
  { label: 'Reports', desc: 'Verified enrollment velocity & revenue metrics', href: '/admin/reports', icon: BarChart2, color: 'text-bio', bg: 'bg-bio-light' },
  { label: 'Platform Settings', desc: 'Payment gateways, maintenance & test toggles', href: '/admin/settings', icon: Sliders, color: 'text-physics', bg: 'bg-physics-light' },
  { label: 'Audit Logs', desc: 'Immutable audit trail with diff inspector', href: '/admin/audit-logs', icon: Shield, color: 'text-error', bg: 'bg-error-light' },
];

export default function AdminDashboardClient() {
  const [isDark, setIsDark] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(['admin-academic', 'admin-assessment', 'admin-users', 'admin-finance'])
  );
  
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>({
    totalStudents: 0,
    subscribers: 0,
    activeToday: 0,
    totalRevenueNpr: 0,
    mcqsPublished: 0,
    examsPublished: 0,
    openDoubts: 0,
    pendingOrdersCount: 0,
    recentAudits: [],
  });

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/overview');
      const data = await res.json();
      if (res.ok && data.data) {
        setOverview(data.data);
      }
    } catch (err) {
      console.error('Error loading admin overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

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
    window.location.href = '/login';
  };

  const npr = (n: number) => Number(n || 0).toLocaleString('en-IN');

  const statCards = [
    { label: 'Total Students', value: npr(overview.totalStudents), change: 'Verified database users', trend: 'neutral' as const, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Active Today', value: npr(overview.activeToday), change: 'Signed in (24h estimate)', trend: 'neutral' as const, icon: Activity, color: 'text-success', bg: 'bg-success-light' },
    { label: 'Subscribers', value: npr(overview.subscribers), change: 'Active paid plans', trend: 'neutral' as const, icon: CreditCard, color: 'text-chem', bg: 'bg-chem-light' },
    { label: 'Total Revenue', value: `Rs. ${npr(overview.totalRevenueNpr)}`, change: 'Confirmed orders', trend: 'neutral' as const, icon: TrendingUp, color: 'text-bio', bg: 'bg-bio-light' },
    { label: 'MCQs Published', value: npr(overview.mcqsPublished), change: 'Active in question bank', trend: 'neutral' as const, icon: Zap, color: 'text-ma', bg: 'bg-ma-light' },
    { label: 'Active Exams', value: npr(overview.examsPublished), change: 'Published blueprints', trend: 'neutral' as const, icon: FileText, color: 'text-physics', bg: 'bg-physics-light' },
  ];

  const Sidebar = () => (
    <aside className="flex flex-col w-64 bg-card border-r border-border h-full">
      <div className="flex items-center h-16 px-4 border-b border-border shrink-0">
        <Link href="/" className="flex items-center gap-2.5">
          <AppLogo size={32} />
          <div className="flex flex-col leading-none">
            <span className="font-extrabold text-sm text-foreground tracking-tight">Samyak Enterprise</span>
            <span className="text-xs font-semibold text-primary">21 Admin Modules</span>
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

      <div className="border-t border-border p-3 shrink-0 space-y-1.5">
        <Link
          href="/teacher"
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-bio/10 text-bio text-xs font-bold hover:bg-bio/20 transition-colors"
        >
          <UserCheck size={14} />
          Teacher Portal (10 Modules)
        </Link>
        <Link
          href="/student-dashboard"
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors"
        >
          <LayoutDashboard size={14} />
          View Student Site
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl text-error hover:bg-error-light transition-colors text-xs font-semibold"
        >
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
              <p className="text-sm font-bold text-foreground">Samyak Operational Administration</p>
              <p className="text-xs text-muted-foreground">Authoritative Control across 21 Enterprise LMS Modules</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link
              href="/teacher"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-bio/10 hover:bg-bio/20 text-bio text-xs font-bold rounded-xl transition-colors"
            >
              <UserCheck size={14} />
              Teacher Portal
            </Link>

            <button onClick={fetchOverview} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted" title="Refresh Live Data">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>

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
                <h1 className="text-xl font-bold text-foreground">Operational Admin Control Center</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Production Overview · Real Database Figures · Audit-Logged Mutations
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link href="/admin/orders" className="btn-primary py-2 px-3 text-xs font-bold flex items-center gap-1.5">
                  <CreditCard size={14} /> Orders ({overview.pendingOrdersCount} Pending)
                </Link>
                <Link href="/admin/enrollments" className="btn-secondary py-2 px-3 text-xs font-bold flex items-center gap-1.5">
                  <Ticket size={14} /> Grant Enrollment
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
                  <p className="text-lg font-extrabold text-foreground leading-none">{loading ? '—' : stat.value}</p>
                  <p className="text-xs font-semibold text-foreground mt-1 truncate">{stat.label}</p>
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">{stat.change}</p>
                </div>
              ))}
            </div>

            {/* 21 Canonical Modules Directory */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Layers size={16} className="text-primary" /> Canonical Administration Modules (21)
                </h2>
                <span className="text-xs text-muted-foreground">Every module adheres to server-side authorization</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {canonicalModules.map((m) => (
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

            {/* Recent Audit Trail Stream */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Shield size={16} className="text-primary" /> Live Audit Log Activity
                </h3>
                <Link href="/admin/audit-logs" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                  View Full Audit Trail ({overview.recentAudits?.length || 0}) →
                </Link>
              </div>

              {overview.recentAudits && overview.recentAudits.length > 0 ? (
                <div className="divide-y divide-border text-xs">
                  {overview.recentAudits.slice(0, 5).map((log: any) => (
                    <div key={log.id} className="py-2.5 flex items-center justify-between gap-4 font-mono">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary shrink-0">
                          {log.action}
                        </span>
                        <span className="font-sans font-semibold text-foreground truncate">
                          {log.resource_type} ({log.resource_id})
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground shrink-0 font-sans">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground py-3">No administrative audit events recorded yet.</p>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
