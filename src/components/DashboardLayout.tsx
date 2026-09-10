'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import {
  BookOpen, Video, Zap, FileText, Bell, CreditCard,
  User, ChevronLeft, ChevronRight, Sun, Moon, Swords, AlertTriangle, LogOut,
  ClipboardList, Bot, Sparkles, Users, CheckCheck, X, Menu, Home, Trophy,
  Layers, MessageCircleQuestion, Bookmark, Lock, TrendingUp, Radio,
  Mic, Headphones, FileEdit, MoreHorizontal, ChevronDown
} from 'lucide-react';

// Nav items that require a paid/prebook plan (see PremiumGate). Free users get
// a small "Pro" lock badge on these until they upgrade.
const PRO_FEATURES = new Set([
  '/study-plan', '/flashcards', '/ai-tutor', '/mcq-generator',
  '/mistake-analyser', '/mock-tests', '/battle-arena', '/match-lobby',
]);
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import PageTransitionWrapper from '@/components/PageTransitionWrapper';
import ProgramSwitcher from '@/components/ProgramSwitcher';
import ProgramSelectorModal from '@/components/ProgramSelectorModal';
import { useProgram, normalizeCourseId, CanonicalCourseId } from '@/contexts/ProgramContext';

interface NavItem {
  label: string;
  href: string;
  icon: any;
  key: string;
  desc?: string;
  badge?: string;
}



// ─── Primary nav per program ──────────────────────────────────────────────────
function getPrimaryNav(canonicalId: CanonicalCourseId): NavItem[] {
  if (canonicalId === 'see_class_10') {
    return [
      { label: 'Home',      href: '/student-dashboard',        icon: Home,        key: 'pnav-home' },
      { label: 'Learn',     href: '/see',                      icon: BookOpen,    key: 'pnav-learn' },
      { label: 'Practice',  href: '/see/question-bank',        icon: Zap,         key: 'pnav-practice' },
      { label: 'Tests',     href: '/mock-tests?program=see',   icon: FileText,    key: 'pnav-tests' },
      { label: 'Resources', href: '/see#learning-suite',       icon: Layers,      key: 'pnav-resources' },
      { label: 'Progress',  href: '/see?tab=tracker',          icon: TrendingUp,  key: 'pnav-progress' },
    ];
  }
  if (canonicalId === 'ielts') {
    return [
      { label: 'Home',      href: '/student-dashboard',             icon: Home,     key: 'pnav-home' },
      { label: 'Learn',     href: '/english',                       icon: BookOpen, key: 'pnav-learn' },
      { label: 'Practice',  href: '/english/reading/speed-drills',  icon: Zap,      key: 'pnav-practice' },
      { label: 'Tests',     href: '/mock-tests',                    icon: FileText, key: 'pnav-tests' },
      { label: 'Predictor', href: '/english/band-predictor',        icon: Sparkles, key: 'pnav-band' },
    ];
  }
  if (canonicalId === 'digital_marketing' || canonicalId === 'artificial_intelligence') {
    return [
      { label: 'Home',      href: '/student-dashboard', icon: Home,     key: 'pnav-home' },
      { label: 'Learn',     href: '/digital',           icon: BookOpen, key: 'pnav-learn' },
      { label: 'AI Studio', href: '/ai-tutor',          icon: Bot,      key: 'pnav-ai' },
      { label: 'Batches',   href: '/batches',           icon: Layers,   key: 'pnav-batches' },
    ];
  }
  // Default: CEE Medical
  return [
    { label: 'Home',     href: '/student-dashboard',        icon: Home,           key: 'pnav-home' },
    { label: 'Learn',    href: '/subjects',                 icon: BookOpen,       key: 'pnav-learn' },
    { label: 'Practice', href: '/practice',                 icon: Zap,            key: 'pnav-practice' },
    { label: 'Mocks',    href: '/mock-tests',               icon: FileText,       key: 'pnav-mocks' },
    { label: 'Mistakes', href: '/ai-tutor?tab=mistakes',    icon: AlertTriangle,  key: 'pnav-mistakes' },
    { label: 'Rank',     href: '/leaderboard',              icon: Trophy,         key: 'pnav-rank' },
  ];
}

// ─── Mobile bottom nav per program ────────────────────────────────────────────
function getMobileNav(canonicalId: CanonicalCourseId): NavItem[] {
  if (canonicalId === 'see_class_10') {
    return [
      { label: 'Home',     href: '/student-dashboard',        icon: Home,       key: 'mnav-home' },
      { label: 'Learn',    href: '/see',                      icon: BookOpen,   key: 'mnav-learn' },
      { label: 'Practice', href: '/see/question-bank',        icon: Zap,        key: 'mnav-practice' },
      { label: 'Tests',    href: '/mock-tests?program=see',   icon: FileText,   key: 'mnav-tests' },
      { label: 'Progress', href: '/see?tab=tracker',          icon: TrendingUp, key: 'mnav-progress' },
    ];
  }
  // Default: CEE Medical
  return [
    { label: 'Home',     href: '/student-dashboard',        icon: Home,           key: 'mnav-home' },
    { label: 'Practice', href: '/practice',                 icon: Zap,            key: 'mnav-practice' },
    { label: 'Mocks',    href: '/mock-tests',               icon: FileText,       key: 'mnav-mocks' },
    { label: 'Mistakes', href: '/ai-tutor?tab=mistakes',    icon: AlertTriangle,  key: 'mnav-mistakes' },
    { label: 'Rank',     href: '/leaderboard',              icon: Trophy,         key: 'mnav-rank' },
  ];
}

// ─── Secondary "More" items per program ──────────────────────────────────────
function getSecondaryNav(canonicalId: CanonicalCourseId): { section: string; items: NavItem[] }[] {
  switch (canonicalId) {
    case 'see_class_10':
      return [
        { section: 'Study', items: [
          { label: 'Live Classes',   href: '/live-classes',       icon: Radio,                 key: 'snav-live',    badge: 'LIVE' },
          { label: 'Question Bank',  href: '/see/question-bank',  icon: FileText,              key: 'snav-qb',      desc: '1-4 Marks + Solutions' },
          { label: 'Video Lectures', href: '/lecture-videos',     icon: Video,                 key: 'snav-videos' },
          { label: 'Mock Tests',     href: '/mock-tests?program=see', icon: FileText,          key: 'snav-mock',    desc: 'Timed NEB Model Papers' },
          { label: 'Study Plan',     href: '/study-plan',         icon: ClipboardList,         key: 'snav-plan' },
        ]},
        { section: 'Tools', items: [
          { label: 'AI Tutor',       href: '/ai-tutor',           icon: Bot,                   key: 'snav-ai',      badge: 'AI' },
          { label: 'Mistakes Log',   href: '/ai-tutor?tab=mistakes', icon: AlertTriangle,      key: 'snav-mistakes' },
          { label: 'Bookmarks',      href: '/bookmarks',          icon: Bookmark,              key: 'snav-bm' },
          { label: 'Doubts',         href: '/doubts',             icon: MessageCircleQuestion, key: 'snav-doubts' },
        ]},
      ];
    case 'ielts':
      return [
        { section: 'Skills', items: [
          { label: 'Speaking',       href: '/english/speaking',              icon: Mic,      key: 'snav-speak',  badge: 'AI' },
          { label: 'Writing',        href: '/english/writing/rubric',        icon: FileEdit, key: 'snav-write' },
          { label: 'Listening',      href: '/english/listening',             icon: Headphones, key: 'snav-listen' },
          { label: 'Reading',        href: '/english/reading/speed-drills',  icon: BookOpen, key: 'snav-read' },
        ]},
        { section: 'Tools', items: [
          { label: 'Mock Tests',     href: '/mock-tests',             icon: FileText,  key: 'snav-mock' },
          { label: 'Band Predictor', href: '/english/band-predictor', icon: Sparkles,  key: 'snav-band',  badge: 'AI' },
          { label: 'AI Tutor',       href: '/ai-tutor',               icon: Bot,       key: 'snav-ai',    badge: 'AI' },
          { label: 'Bookmarks',      href: '/bookmarks',              icon: Bookmark,  key: 'snav-bm' },
        ]},
      ];
    case 'digital_marketing':
      return [
        { section: 'Content', items: [
          { label: 'Swipe Files',    href: '/digital',     icon: Layers,       key: 'snav-swipe',   badge: 'PRO' },
          { label: 'Batches',        href: '/batches',     icon: Layers,       key: 'snav-batches' },
          { label: 'Study Plan',     href: '/study-plan',  icon: ClipboardList, key: 'snav-plan' },
        ]},
        { section: 'Tools', items: [
          { label: 'AI Tutor',       href: '/ai-tutor',    icon: Bot,                   key: 'snav-ai',      badge: 'AI' },
          { label: 'Bookmarks',      href: '/bookmarks',   icon: Bookmark,              key: 'snav-bm' },
          { label: 'Doubts',         href: '/doubts',      icon: MessageCircleQuestion, key: 'snav-doubts' },
        ]},
      ];
    case 'artificial_intelligence':
      return [
        { section: 'Content', items: [
          { label: 'Prompt Studio',  href: '/digital',     icon: Bot,          key: 'snav-studio',  badge: 'LIVE' },
          { label: 'Flashcards',     href: '/flashcards',  icon: Layers,       key: 'snav-flash' },
          { label: 'Batches',        href: '/batches',     icon: Layers,       key: 'snav-batches' },
          { label: 'Study Plan',     href: '/study-plan',  icon: ClipboardList, key: 'snav-plan' },
        ]},
        { section: 'Tools', items: [
          { label: 'AI Tutor',       href: '/ai-tutor',    icon: Bot,                   key: 'snav-ai',      badge: 'AI' },
          { label: 'Bookmarks',      href: '/bookmarks',   icon: Bookmark,              key: 'snav-bm' },
          { label: 'Doubts',         href: '/doubts',      icon: MessageCircleQuestion, key: 'snav-doubts' },
        ]},
      ];
    case 'cee_medical':
    default:
      return [
        { section: 'Study', items: [
          { label: 'Mock Tests',      href: '/mock-tests',      icon: FileText,  key: 'snav-mock',    desc: '200-Q full simulation' },
          { label: 'Video Lectures',  href: '/lecture-videos',  icon: Video,     key: 'snav-videos',  badge: 'HD' },
          { label: 'Flashcards',      href: '/flashcards',      icon: Layers,    key: 'snav-flash',   badge: 'NEW' },
          { label: 'Battle Arena',    href: '/battle-arena',    icon: Swords,    key: 'snav-battle',  badge: 'LIVE' },
          { label: 'Match Lobby',     href: '/match-lobby',     icon: Users,     key: 'snav-lobby',   badge: 'NEW' },
        ]},
        { section: 'Tools', items: [
          { label: 'AI Tutor',        href: '/ai-tutor',         icon: Bot,                   key: 'snav-ai',      badge: 'AI' },
          { label: 'MCQ Generator',   href: '/mcq-generator',    icon: Sparkles,              key: 'snav-gen' },
          { label: 'Study Plan',      href: '/study-plan',       icon: ClipboardList,         key: 'snav-plan' },
          { label: 'Bookmarks',       href: '/bookmarks',        icon: Bookmark,              key: 'snav-bm' },
          { label: 'Doubts',          href: '/doubts',           icon: MessageCircleQuestion, key: 'snav-doubts' },
          { label: 'Mistake Analyser',href: '/mistake-analyser', icon: AlertTriangle,         key: 'snav-mistake' },
          { label: 'Batches',         href: '/batches',          icon: Layers,                key: 'snav-batches' },
        ]},
      ];
  }
}



interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function notifIcon(type: string) {
  switch (type) {
    case 'exam': return FileText;
    case 'battle': return Swords;
    case 'achievement': return Trophy;
    default: return Bell;
  }
}

function notifColor(type: string) {
  switch (type) {
    case 'exam': return 'text-primary';
    case 'battle': return 'text-violet-500';
    case 'achievement': return 'text-amber-500';
    default: return 'text-muted-foreground';
  }
}



// ─── More Popover (desktop sidebar) ──────────────────────────────────────────
function MorePopover({
  sections,
  isPremium,
  onClose,
}: {
  sections: { section: string; items: NavItem[] }[];
  isPremium: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute left-full top-0 ml-2 w-64 bg-card border border-border rounded-xl shadow-card-hover animate-scale-in z-50 overflow-hidden"
    >
      {sections.map((sec) => (
        <div key={sec.section} className="p-2">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/60 px-2 mb-1">
            {sec.section}
          </p>
          {sec.items.map((item) => {
            const active = pathname === item.href || (item.href !== '/student-dashboard' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 transition-all duration-150 ${
                  active
                    ? 'bg-primary text-white font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <item.icon size={16} className="shrink-0" />
                <span className="text-xs font-medium flex-1">{item.label}</span>
                {PRO_FEATURES.has(item.href) && !isPremium ? (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none flex items-center gap-0.5 bg-amber-500/10 text-amber-600 border border-amber-500/20">
                    <Lock size={8} /> PRO
                  </span>
                ) : item.badge ? (
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full leading-none shrink-0 ${
                    item.badge === 'LIVE' || item.badge === 'AI LIVE'
                      ? 'bg-error text-white animate-pulse'
                      : active
                      ? 'bg-white/20 text-white'
                      : 'bg-primary/10 text-primary'
                  }`}>
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      ))}
      <div className="border-t border-border p-2">
        <Link
          href="/account"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <CreditCard size={16} />
          <span className="text-xs font-medium">Subscription & Orders</span>
        </Link>
        <Link
          href="/courses"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Sparkles size={16} />
          <span className="text-xs font-medium">Course Store</span>
        </Link>
      </div>
    </div>
  );
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  isDark?: boolean;
  onToggleDark?: () => void;
}

export default function DashboardLayout({ children, isDark = false, onToggleDark }: DashboardLayoutProps) {
  const { program, programDetails } = useProgram();
  const canonicalId = normalizeCourseId(program);
  const primaryNav = getPrimaryNav(canonicalId);
  const secondaryNav = getSecondaryNav(canonicalId);

  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const notifRef = useRef<HTMLDivElement>(null);
  const [signingOut, setSigningOut] = useState(false);


  // Entitlement — default true so paid users never see a flash of locks; flips
  // to false for free users once /api/profile/me resolves.
  const [isPremium, setIsPremium] = useState(true);
  useEffect(() => {
    let active = true;
    fetch('/api/profile/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((me) => {
        if (!active || !me) return;
        const exp = me.subscription_expires_at;
        const planActive = !exp || new Date(exp) > new Date();
        const paid = ['student', 'pro', 'institution'].includes(me.subscription_plan);
        setIsPremium(!!me.is_admin || (paid && planActive));
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      router.push('/login');
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    const fetchNotifications = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('notifications')
        .select('id, title, message, notification_type, is_read, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter((n: Notification) => !n.is_read).length);
      }
    };
    fetchNotifications();

    const supabase = createClient();
    const channel = supabase
      .channel('notifications-' + user.id)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const newNotif = payload.new as Notification;
        setNotifications((prev) => [newNotif, ...prev].slice(0, 10));
        setUnreadCount((c) => c + 1);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    if (!user?.id || unreadCount === 0) return;
    const supabase = createClient();
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const markOneRead = async (id: string) => {
    const supabase = createClient();
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const displayName = profile?.full_name?.split(' ')?.[0] || user?.email?.split('@')?.[0] || 'Student';
  const isPro = profile?.subscription_plan === 'pro' || profile?.subscription_plan === 'institution';

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* ── Desktop Sidebar ─────────────────────────────────────────────── */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 bg-card/90 backdrop-blur-2xl border-r border-border/80 shadow-luxury transition-all duration-300 ease-in-out ${
          collapsed ? 'w-16' : 'w-56'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-border/80 shrink-0">
          <Link href="/" className="flex items-center gap-2.5 min-w-0 group">
            <div className="transition-transform duration-200 group-hover:scale-105">
              <AppLogo size={32} />
            </div>
            {!collapsed && (
              <div className="flex flex-col leading-none overflow-hidden">
                <span className="font-extrabold text-sm text-foreground tracking-tight truncate">Samyak</span>
                <span className="text-[11px] font-bold text-primary tracking-wide">{programDetails.shortName}</span>
              </div>
            )}
          </Link>
        </div>

        {/* Primary 5 nav items + More */}
        <div className="flex-1 flex flex-col overflow-y-auto py-4 px-2.5 scrollbar-hide gap-1">
          {primaryNav.map((item) => {
            const active = pathname === item.href || (item.href !== '/student-dashboard' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.key}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                  active
                    ? 'bg-gradient-to-r from-primary to-primary-dark text-white font-bold shadow-sm shadow-primary/30'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
                }`}
              >
                <item.icon size={18} className="shrink-0" />
                {!collapsed && <span className="text-sm font-semibold">{item.label}</span>}
              </Link>
            );
          })}

          {/* ··· More button */}
          <div className="relative">
            <button
              onClick={() => setMoreOpen((v) => !v)}
              title={collapsed ? 'More' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-muted/70 ${
                moreOpen ? 'bg-muted/70 text-foreground' : ''
              }`}
            >
              <MoreHorizontal size={18} className="shrink-0" />
              {!collapsed && (
                <>
                  <span className="text-sm font-semibold flex-1 text-left">More</span>
                  <ChevronDown size={14} className={`transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
                </>
              )}
            </button>
            {moreOpen && (
              <MorePopover
                sections={secondaryNav}
                isPremium={isPremium}
                onClose={() => setMoreOpen(false)}
              />
            )}
          </div>
        </div>

        {/* Bottom: user + sign out */}
        <div className="border-t border-border p-2 space-y-1 shrink-0">
          <Link
            href="/profile"
            className={`flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl transition-colors ${
              pathname === '/profile' ? 'bg-primary text-white font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
            title={collapsed ? 'Profile' : undefined}
          >
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground truncate">{displayName}</p>
                <p className="text-[10px] text-muted-foreground">{isPro ? '✓ Pro' : 'Free'}</p>
              </div>
            )}
          </Link>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-error hover:bg-error-light transition-colors disabled:opacity-60"
            title={collapsed ? 'Sign Out' : undefined}
          >
            <LogOut size={16} className="shrink-0" />
            {!collapsed && <span className="text-xs font-medium">{signingOut ? 'Signing out...' : 'Sign Out'}</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center h-9 border-t border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </aside>


      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <aside className="relative w-72 bg-card border-r border-border flex flex-col h-full overflow-y-auto">
            {/* Mobile sidebar header */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-border shrink-0">
              <Link href="/" className="flex items-center gap-2.5" onClick={() => setMobileMenuOpen(false)}>
                <AppLogo size={32} />
                <div className="flex flex-col leading-none">
                  <span className="font-extrabold text-sm text-foreground tracking-tight">Samyak</span>
                  <span className="text-xs font-medium text-primary">{programDetails.shortName}</span>
                </div>
              </Link>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* User info */}
            <div className="px-4 py-3 border-b border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-base">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{displayName}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isPro ? 'bg-success-light text-success' : 'bg-muted text-muted-foreground'}`}>
                    {isPro ? '✓ Pro Plan' : 'Free Plan'}
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile nav — primary items */}
            <div className="flex-1 py-3 px-3">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/60 px-2 mb-1">Main</p>
              {primaryNav.map((item) => {
                const active = pathname === item.href || (item.href !== '/student-dashboard' && pathname?.startsWith(item.href));
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl mb-0.5 transition-all duration-150 ${
                      active ? 'bg-primary text-white font-semibold shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <item.icon size={18} className="shrink-0" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}

              {/* Secondary nav sections */}
              {secondaryNav.map((sec) => (
                <div key={sec.section} className="mt-4">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/60 px-2 mb-1">{sec.section}</p>
                  {sec.items.map((item) => {
                    const active = pathname === item.href || (item.href !== '/student-dashboard' && pathname?.startsWith(item.href));
                    return (
                      <Link
                        key={item.key}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 transition-all duration-150 ${
                          active ? 'bg-primary text-white font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                      >
                        <item.icon size={16} className="shrink-0" />
                        <span className="text-sm font-medium flex-1">{item.label}</span>
                        {PRO_FEATURES.has(item.href) && !isPremium ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none flex items-center gap-0.5 bg-amber-500/10 text-amber-600 border border-amber-500/20">
                            <Lock size={8} /> PRO
                          </span>
                        ) : item.badge ? (
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full leading-none shrink-0 ${
                            item.badge === 'LIVE' ? 'bg-error text-white animate-pulse' : active ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                          }`}>
                            {item.badge}
                          </span>
                        ) : null}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Mobile sidebar bottom */}
            <div className="border-t border-border p-3 space-y-1">
              <Link href="/account" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <CreditCard size={18} />
                <span className="text-sm">Subscription & Orders</span>
              </Link>
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-error hover:bg-error-light transition-colors disabled:opacity-60"
              >
                <LogOut size={18} />
                <span className="text-sm font-medium">{signingOut ? 'Signing out...' : 'Sign Out'}</span>
              </button>
            </div>
          </aside>
        </div>
      )}


      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-card/85 backdrop-blur-xl border-b border-border/80 flex items-center justify-between px-4 sm:px-6 shrink-0 shadow-xs z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu size={20} />
            </button>
            <div className="lg:hidden">
              <AppLogo size={28} />
            </div>
            <div className="hidden lg:block">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-foreground uppercase tracking-wider">Student Workspace</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">{programDetails.shortName}</span>
              </div>
              <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{programDetails.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ProgramSelectorModal isOpen={showCourseModal} onClose={() => setShowCourseModal(false)} />
            <ProgramSwitcher size="sm" onOpenModal={() => setShowCourseModal(true)} />

            <button
              onClick={onToggleDark}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all active:scale-90"
              aria-label="Toggle dark mode"
            >
              {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
            </button>


            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-error rounded-full flex items-center justify-center text-white text-[9px] font-bold px-0.5">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-card-hover animate-scale-in z-50">
                  <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">Notifications</p>
                      {unreadCount > 0 && (
                        <span className="text-xs bg-error text-white font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                      >
                        <CheckCheck size={12} />
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <Bell size={24} className="text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No notifications yet</p>
                        <p className="text-xs text-muted-foreground mt-0.5">We&apos;ll notify you about exams, live classes, and more</p>
                      </div>
                    ) : (
                      notifications.map((n) => {
                        const NIcon = notifIcon(n.notification_type);
                        const color = notifColor(n.notification_type);
                        return (
                          <div
                            key={n.id}
                            onClick={() => { if (!n.is_read) markOneRead(n.id); }}
                            className={`flex items-start gap-3 px-4 py-3 hover:bg-muted transition-colors cursor-pointer border-b border-border/50 last:border-0 ${!n.is_read ? 'bg-primary/5' : ''}`}
                          >
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${!n.is_read ? 'bg-primary/10' : 'bg-muted'}`}>
                              <NIcon size={14} className={color} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-semibold leading-snug ${!n.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>{n.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5 leading-snug line-clamp-2">{n.message}</p>
                              <p className="text-xs text-muted-foreground mt-1">{timeAgo(n.created_at)}</p>
                            </div>
                            {!n.is_read && (
                              <span className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1.5" />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="px-4 py-2 border-t border-border">
                    <button className="text-xs text-primary font-medium hover:underline">View all notifications</button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pl-2 border-l border-border">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-foreground leading-none">{displayName}</p>
                <p className="text-xs text-muted-foreground">{isPro ? '✓ Pro' : 'Free Plan'}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content — extra bottom padding on mobile for bottom nav */}
        <main className="flex-1 overflow-y-auto w-full max-w-full overflow-x-hidden pb-20 lg:pb-0">
          <PageTransitionWrapper>
            {children}
          </PageTransitionWrapper>
        </main>

        {/* Mobile Bottom Navigation Bar — Program-specific 5 clean icons */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border z-40">
          <div className="flex items-stretch justify-around px-1 py-1">
            {getMobileNav(canonicalId).map((item) => {
              const active = pathname === item.href || (item.href !== '/student-dashboard' && pathname?.startsWith(item.href.split('?')[0].split('#')[0]));
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 px-0.5 rounded-xl transition-colors ${
                    active ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                  }`}
                >
                  <div className={`p-1 rounded-lg transition-colors ${active ? 'bg-primary/10' : ''}`}>
                    <item.icon size={19} />
                  </div>
                  <span className={`text-[9.5px] ${active ? 'font-bold text-primary' : 'font-semibold'}`}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

      </div>
    </div>
  );
}