'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import {
  LayoutDashboard, BookOpen, Video, Radio, Zap, FileText, Bell, CreditCard,
  User, ChevronLeft, ChevronRight, Sun, Moon, Swords, AlertTriangle, LogOut,
  ClipboardList, Bot, Sparkles, Users, CheckCheck, X, Menu, Home, Trophy,
  Layers, MessageCircleQuestion, Bookmark, Lock, Languages, Cpu, TrendingUp,
  GraduationCap, Stethoscope, Mic, Headphones, FileEdit, Search, Share2, Code, Terminal, Target
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

interface NavGroup {
  label: string;
  key: string;
  items: NavItem[];
}

function getCourseNavGroups(canonicalId: CanonicalCourseId): NavGroup[] {
  switch (canonicalId) {
    case 'see_class_10':
      return [
        {
          label: 'SEE Class 10 Overview',
          key: 'group-see-home',
          items: [
            { label: 'SEE Dashboard', href: '/student-dashboard', icon: LayoutDashboard, key: 'nav-dashboard', desc: 'GPA Tracker & Stats' },
            { label: 'Study Schedule', href: '/study-plan', icon: ClipboardList, key: 'nav-study-plan', desc: 'Daily revision tasks' },
            { label: 'Ask Teacher', href: '/doubts', icon: MessageCircleQuestion, key: 'nav-doubts', desc: 'Ask subject teachers' },
          ],
        },
        {
          label: 'Class 10 Syllabus',
          key: 'group-see-syllabus',
          items: [
            { label: '5 Core Subjects', href: '/subjects', icon: BookOpen, key: 'nav-subjects', desc: 'Science, Math, Opt Math...' },
            { label: 'Video Classes', href: '/app-feature', icon: Video, key: 'nav-app-guru', badge: 'HD', desc: 'Chapter-wise lectures' },
            { label: 'Revision Cards', href: '/flashcards', icon: Layers, key: 'nav-flashcards', badge: 'NEW', desc: 'Formula sheets' },
            { label: 'Class 10 Batches', href: '/batches', icon: Layers, key: 'nav-batches', desc: 'Batch enrollments' },
          ],
        },
        {
          label: 'Board Exam Preparation',
          key: 'group-see-exams',
          items: [
            { label: 'AI Subjective Grading', href: '/practice/subjective', icon: Sparkles, key: 'nav-subjective', badge: 'AI', desc: 'Handwritten answer check' },
            { label: 'NEB Model Papers', href: '/mock-tests', icon: FileText, key: 'nav-mock', desc: '10-Year Question Sets' },
            { label: 'Objective Practice', href: '/practice', icon: Zap, key: 'nav-practice', desc: 'Unit-wise test drills' },
          ],
        },
        {
          label: 'AI Study Assistant',
          key: 'group-see-ai',
          items: [
            { label: 'SEE AI Tutor', href: '/ai-tutor', icon: Bot, key: 'nav-ai-tutor', badge: 'AI', desc: 'Math & Science solver' },
            { label: 'Question Generator', href: '/mcq-generator', icon: Sparkles, key: 'nav-mcq-gen', desc: 'Create practice questions' },
            { label: 'Weakness Fixer', href: '/mistake-analyser', icon: AlertTriangle, key: 'nav-mistake', desc: 'Fix exam weak spots' },
          ],
        },
        {
          label: 'My Progress',
          key: 'group-see-progress',
          items: [
            { label: 'Rankings', href: '/leaderboard', icon: Trophy, key: 'nav-leaderboard', desc: 'Batch rankings' },
            { label: 'Saved Notes', href: '/bookmarks', icon: Bookmark, key: 'nav-bookmarks', desc: 'Bookmarked questions' },
            { label: 'Course Store', href: '/courses', icon: Sparkles, key: 'nav-courses', badge: 'STORE', desc: 'Explore all courses' },
          ],
        },
      ];

    case 'ielts':
      return [
        {
          label: 'IELTS Mastery Overview',
          key: 'group-ielts-home',
          items: [
            { label: 'IELTS Dashboard', href: '/student-dashboard', icon: LayoutDashboard, key: 'nav-dashboard', desc: 'Target Band 8.0+ Tracker' },
            { label: 'Study Plan', href: '/study-plan', icon: ClipboardList, key: 'nav-study-plan', desc: 'Daily speaking & essay schedule' },
            { label: 'Examiner Q&A', href: '/doubts', icon: MessageCircleQuestion, key: 'nav-doubts', desc: 'Ask certified mentors' },
          ],
        },
        {
          label: '4 Core Skills Hub',
          key: 'group-ielts-skills',
          items: [
            { label: 'Speaking Simulator', href: '/english', icon: Mic, key: 'nav-speaking', badge: 'AI LIVE', desc: 'Part 1, 2, 3 AI scoring' },
            { label: 'Writing Evaluator', href: '/english', icon: FileEdit, key: 'nav-writing', badge: 'RUBRIC', desc: 'Task 1 & 2 essay checks' },
            { label: 'Listening Audio Sets', href: '/courses?sector=english', icon: Headphones, key: 'nav-listening', desc: 'Audio sections 1-4' },
            { label: 'Reading Speed Drills', href: '/courses?sector=english', icon: BookOpen, key: 'nav-reading', desc: 'Academic & GT passages' },
          ],
        },
        {
          label: 'Mock Tests & Grammar',
          key: 'group-ielts-mock',
          items: [
            { label: 'Full Mock Exams', href: '/mock-tests', icon: FileText, key: 'nav-mock', desc: 'Band score prediction' },
            { label: 'Vocabulary & Grammar', href: '/practice', icon: Zap, key: 'nav-grammar', desc: 'AWL 500 academic words' },
            { label: 'Flashcards', href: '/flashcards', icon: Layers, key: 'nav-flashcards', desc: 'Collocations & idioms' },
          ],
        },
        {
          label: 'AI Fluency Tools',
          key: 'group-ielts-ai',
          items: [
            { label: 'English AI Tutor', href: '/ai-tutor', icon: Bot, key: 'nav-ai-tutor', badge: 'AI', desc: 'Grammar correction & tips' },
            { label: 'Drill Generator', href: '/mcq-generator', icon: Sparkles, key: 'nav-mcq-gen', desc: 'Custom practice tests' },
          ],
        },
        {
          label: 'My Progress',
          key: 'group-ielts-progress',
          items: [
            { label: 'Band Rankings', href: '/leaderboard', icon: Trophy, key: 'nav-leaderboard', desc: 'Global learner rankings' },
            { label: 'Saved Drills', href: '/bookmarks', icon: Bookmark, key: 'nav-bookmarks', desc: 'Saved questions' },
            { label: 'Course Store', href: '/courses', icon: Sparkles, key: 'nav-courses', badge: 'STORE', desc: 'Explore all courses' },
          ],
        },
      ];

    case 'digital_marketing':
      return [
        {
          label: 'Marketing Overview',
          key: 'group-dm-home',
          items: [
            { label: 'Marketing Dashboard', href: '/student-dashboard', icon: LayoutDashboard, key: 'nav-dashboard', desc: 'Campaigns & Milestones' },
            { label: 'Daily Action Plan', href: '/study-plan', icon: ClipboardList, key: 'nav-study-plan', desc: 'Growth strategies' },
            { label: 'Mentor Support', href: '/doubts', icon: MessageCircleQuestion, key: 'nav-doubts', desc: 'Ask marketing experts' },
          ],
        },
        {
          label: 'Marketing Tracks',
          key: 'group-dm-tracks',
          items: [
            { label: 'Meta & Instagram Ads', href: '/courses?sector=digital', icon: TrendingUp, key: 'nav-meta', badge: 'HIGH ROAS', desc: 'Pixel & ad setup' },
            { label: 'TikTok Viral Growth', href: '/courses?sector=digital', icon: Share2, key: 'nav-tiktok', desc: 'Hook formulas & scripts' },
            { label: 'Search Engine SEO', href: '/courses?sector=digital', icon: Search, key: 'nav-seo', desc: 'Rank #1 on Google' },
            { label: 'Copywriting & Funnels', href: '/courses?sector=digital', icon: FileText, key: 'nav-copy', desc: 'High-converting pages' },
          ],
        },
        {
          label: 'Practical Hub',
          key: 'group-dm-practical',
          items: [
            { label: 'Swipe Files & Templates', href: '/digital', icon: Layers, key: 'nav-swipe', badge: 'PRO', desc: 'Proven ad copy' },
            { label: 'Video Playbooks', href: '/app-feature', icon: Video, key: 'nav-app-guru', badge: 'HD', desc: 'Step-by-step walkthrus' },
            { label: 'Marketing Batches', href: '/batches', icon: Layers, key: 'nav-batches', desc: 'Live cohorts' },
          ],
        },
        {
          label: 'AI Marketing Tools',
          key: 'group-dm-ai',
          items: [
            { label: 'Marketing AI Tutor', href: '/ai-tutor', icon: Bot, key: 'nav-ai-tutor', badge: 'AI', desc: 'Ad angle brainstorming' },
            { label: 'Prompt Studio', href: '/digital', icon: Sparkles, key: 'nav-prompt', desc: 'Marketing prompt tests' },
          ],
        },
        {
          label: 'My Progress',
          key: 'group-dm-progress',
          items: [
            { label: 'Certification Hub', href: '/account', icon: Trophy, key: 'nav-cert', desc: 'Course certificates' },
            { label: 'Saved Resources', href: '/bookmarks', icon: Bookmark, key: 'nav-bookmarks', desc: 'Saved templates' },
            { label: 'Course Store', href: '/courses', icon: Sparkles, key: 'nav-courses', badge: 'STORE', desc: 'Explore all courses' },
          ],
        },
      ];

    case 'artificial_intelligence':
      return [
        {
          label: 'AI Academy Overview',
          key: 'group-ai-home',
          items: [
            { label: 'AI Dashboard', href: '/student-dashboard', icon: LayoutDashboard, key: 'nav-dashboard', desc: 'AI skill progress' },
            { label: 'Learning Roadmap', href: '/study-plan', icon: ClipboardList, key: 'nav-study-plan', desc: 'Daily AI tasks' },
            { label: 'Dev Doubts', href: '/doubts', icon: MessageCircleQuestion, key: 'nav-doubts', desc: 'Ask AI instructors' },
          ],
        },
        {
          label: 'AI Specialization Tracks',
          key: 'group-ai-tracks',
          items: [
            { label: 'Prompt Studio Sandbox', href: '/digital', icon: Bot, key: 'nav-prompt-studio', badge: 'LIVE AI', desc: 'Test & score prompts' },
            { label: 'Modern AI Tools', href: '/digital', icon: Zap, key: 'nav-ai-tools', desc: 'ChatGPT, Claude, Midjourney' },
            { label: 'Python for AI', href: '/courses?sector=digital', icon: Code, key: 'nav-python', desc: '5 Real-world projects' },
            { label: 'AI Automation & Agents', href: '/courses?sector=digital', icon: Terminal, key: 'nav-agents', desc: 'No-code workflows' },
          ],
        },
        {
          label: 'Hands-On Practice',
          key: 'group-ai-practice',
          items: [
            { label: 'Coding Exercises', href: '/practice', icon: Zap, key: 'nav-practice', desc: 'Syntax & logic tests' },
            { label: 'Project Submissions', href: '/app-feature', icon: Video, key: 'nav-app-guru', badge: 'BUILD', desc: 'Portfolio projects' },
            { label: 'AI Flashcards', href: '/flashcards', icon: Layers, key: 'nav-flashcards', desc: 'Core terms & concepts' },
          ],
        },
        {
          label: 'AI Study Assistants',
          key: 'group-ai-tutors',
          items: [
            { label: 'Master AI Tutor', href: '/ai-tutor', icon: Bot, key: 'nav-ai-tutor', badge: 'AI', desc: 'Ask coding & AI questions' },
            { label: 'Prompt Generator', href: '/mcq-generator', icon: Sparkles, key: 'nav-mcq-gen', desc: 'Generate test cases' },
          ],
        },
        {
          label: 'My Progress',
          key: 'group-ai-progress',
          items: [
            { label: 'Skill Rankings', href: '/leaderboard', icon: Trophy, key: 'nav-leaderboard', desc: 'Leaderboard' },
            { label: 'Saved Prompts', href: '/bookmarks', icon: Bookmark, key: 'nav-bookmarks', desc: 'Bookmark library' },
            { label: 'Course Store', href: '/courses', icon: Sparkles, key: 'nav-courses', badge: 'STORE', desc: 'Explore all courses' },
          ],
        },
      ];

    case 'cee_medical':
    default:
      return [
        {
          label: 'CEE Medical Overview',
          key: 'group-cee-home',
          items: [
            { label: 'Medical Dashboard', href: '/student-dashboard', icon: LayoutDashboard, key: 'nav-dashboard', desc: 'Rank, accuracy & stats' },
            { label: 'CEE Study Plan', href: '/study-plan', icon: ClipboardList, key: 'nav-study-plan', desc: 'Daily tasks & schedule' },
            { label: 'Ask Doctor / Teacher', href: '/doubts', icon: MessageCircleQuestion, key: 'nav-doubts', desc: 'Medical entrance doubts' },
          ],
        },
        {
          label: 'Medical Syllabus & Materials',
          key: 'group-cee-study',
          items: [
            { label: 'Medical Subjects', href: '/subjects', icon: BookOpen, key: 'nav-subjects', desc: 'Bio, Chem, Physics & MAT' },
            { label: 'Bunny Video Lectures', href: '/app-feature', icon: Video, key: 'nav-app-guru', badge: 'APP', desc: 'Live & recorded classes' },
            { label: 'SM-2 Flashcards', href: '/flashcards', icon: Layers, key: 'nav-flashcards', badge: 'NEW', desc: 'Spaced-repetition high-yield' },
            { label: 'Target Batches', href: '/batches', icon: Layers, key: 'nav-batches', desc: 'Structured medical batches' },
          ],
        },
        {
          label: 'Medical Entrance Practice',
          key: 'group-cee-exam',
          items: [
            { label: 'Practice 15,000+ MCQs', href: '/practice', icon: Zap, key: 'nav-practice', desc: 'Subjectwise question bank' },
            { label: 'MEC Mock Exams', href: '/mock-tests', icon: FileText, key: 'nav-mock', desc: '200-Question full simulation' },
            { label: '2-Player Battle Arena', href: '/battle-arena', icon: Swords, key: 'nav-battle', badge: 'LIVE', desc: 'Realtime 1v1 battle' },
            { label: 'Match Lobby', href: '/match-lobby', icon: Users, key: 'nav-match-lobby', badge: 'NEW', desc: 'Find opponents' },
          ],
        },
        {
          label: 'Medical AI Tools',
          key: 'group-cee-ai',
          items: [
            { label: 'AI Medical Tutor', href: '/ai-tutor', icon: Bot, key: 'nav-ai-tutor', badge: 'AI', desc: 'Instant explanations' },
            { label: 'MCQ Generator', href: '/mcq-generator', icon: Sparkles, key: 'nav-mcq-gen', desc: 'Generate practice questions' },
            { label: 'Mistake Analyser', href: '/mistake-analyser', icon: AlertTriangle, key: 'nav-mistake', desc: 'Fix your weak spots' },
          ],
        },
        {
          label: 'My Progress',
          key: 'group-cee-progress',
          items: [
            { label: 'CEE Leaderboard', href: '/leaderboard', icon: Trophy, key: 'nav-leaderboard', desc: 'See rankings' },
            { label: 'Saved MCQs', href: '/bookmarks', icon: Bookmark, key: 'nav-bookmarks', desc: 'Saved questions' },
            { label: 'All Courses Store', href: '/courses', icon: Sparkles, key: 'nav-courses', badge: 'STORE', desc: 'Browse all courses' },
          ],
        },
      ];
  }
}

function getCourseMobileNavItems(canonicalId: CanonicalCourseId) {
  switch (canonicalId) {
    case 'see_class_10':
      return [
        { label: 'Home', href: '/student-dashboard', icon: Home, key: 'mob-dashboard' },
        { label: 'Subjective', href: '/practice/subjective', icon: Sparkles, key: 'mob-subjective' },
        { label: 'Papers', href: '/mock-tests', icon: FileText, key: 'mob-mock' },
        { label: 'AI Tutor', href: '/ai-tutor', icon: Bot, key: 'mob-ai' },
        { label: 'Menu', href: '#', icon: Menu, key: 'mob-more' },
      ];
    case 'ielts':
      return [
        { label: 'Home', href: '/student-dashboard', icon: Home, key: 'mob-dashboard' },
        { label: 'Speaking', href: '/english', icon: Mic, key: 'mob-speaking' },
        { label: 'Mocks', href: '/mock-tests', icon: FileText, key: 'mob-mock' },
        { label: 'AI Tutor', href: '/ai-tutor', icon: Bot, key: 'mob-ai' },
        { label: 'Menu', href: '#', icon: Menu, key: 'mob-more' },
      ];
    case 'digital_marketing':
      return [
        { label: 'Home', href: '/student-dashboard', icon: Home, key: 'mob-dashboard' },
        { label: 'Modules', href: '/courses?sector=digital', icon: TrendingUp, key: 'mob-modules' },
        { label: 'Swipe Files', href: '/digital', icon: Layers, key: 'mob-swipe' },
        { label: 'AI Tutor', href: '/ai-tutor', icon: Bot, key: 'mob-ai' },
        { label: 'Menu', href: '#', icon: Menu, key: 'mob-more' },
      ];
    case 'artificial_intelligence':
      return [
        { label: 'Home', href: '/student-dashboard', icon: Home, key: 'mob-dashboard' },
        { label: 'Studio', href: '/digital', icon: Bot, key: 'mob-studio' },
        { label: 'Code', href: '/courses?sector=digital', icon: Code, key: 'mob-code' },
        { label: 'AI Tutor', href: '/ai-tutor', icon: Bot, key: 'mob-ai' },
        { label: 'Menu', href: '#', icon: Menu, key: 'mob-more' },
      ];
    case 'cee_medical':
    default:
      return [
        { label: 'Home', href: '/student-dashboard', icon: Home, key: 'mob-dashboard' },
        { label: 'Practice', href: '/practice', icon: Zap, key: 'mob-practice' },
        { label: 'Mock Tests', href: '/mock-tests', icon: FileText, key: 'mob-mock' },
        { label: 'Battle', href: '/battle-arena', icon: Swords, key: 'mob-battle' },
        { label: 'Menu', href: '#', icon: Menu, key: 'mob-more' },
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
    case 'live_class': return Radio;
    case 'exam': return FileText;
    case 'battle': return Swords;
    case 'achievement': return Trophy;
    default: return Bell;
  }
}

function notifColor(type: string) {
  switch (type) {
    case 'live_class': return 'text-error';
    case 'exam': return 'text-primary';
    case 'battle': return 'text-chem';
    case 'achievement': return 'text-ma';
    default: return 'text-muted-foreground';
  }
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  isDark?: boolean;
  onToggleDark?: () => void;
}

export default function DashboardLayout({ children, isDark = false, onToggleDark }: DashboardLayoutProps) {
  const { program, programDetails } = useProgram();
  const canonicalId = normalizeCourseId(program);
  const activeNavGroups = getCourseNavGroups(canonicalId);
  const activeMobileNavItems = getCourseMobileNavItems(canonicalId);

  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
      router.push('/sign-up-login-screen');
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
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 bg-card border-r border-border transition-all duration-300 ease-in-out ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-border shrink-0">
          <Link href="/" className="flex items-center gap-2.5 min-w-0">
            <AppLogo size={32} />
            {!collapsed && (
              <div className="flex flex-col leading-none overflow-hidden">
                <span className="font-extrabold text-sm text-foreground tracking-tight truncate">Samyak</span>
                <span className="text-xs font-semibold text-primary">{programDetails.shortName}</span>
              </div>
            )}
          </Link>
        </div>


        {/* Nav */}
        <div className="flex-1 overflow-y-auto py-3 px-2 scrollbar-hide">
          {activeNavGroups.map((group) => (
            <div key={group.key} className="mb-5">
              {!collapsed && (
                <p className="section-label px-2 mb-1.5">{group.label}</p>
              )}
              {group.items.map((item) => {
                const active = pathname === item.href || (item.href !== '/student-dashboard' && pathname?.startsWith(item.href));
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={`flex items-center gap-3 px-2.5 py-2.5 rounded-xl mb-0.5 transition-all duration-150 group relative ${
                      active
                        ? 'bg-primary text-white font-semibold shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon size={18} className="shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="text-sm truncate flex-1">{item.label}</span>
                        {PRO_FEATURES.has(item.href) && !isPremium ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none shrink-0 flex items-center gap-0.5 bg-ma-light text-ma">
                            <Lock size={9} /> PRO
                          </span>
                        ) : item.badge ? (
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full leading-none shrink-0 ${
                            item.badge === 'LIVE' ? 'bg-error text-white animate-pulse' : active ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                          }`}>
                            {item.badge}
                          </span>
                        ) : null}
                      </>
                    )}
                    {collapsed && (item.badge || (PRO_FEATURES.has(item.href) && !isPremium)) && (
                      <span className={`absolute top-1 right-1 w-2 h-2 rounded-full ${PRO_FEATURES.has(item.href) && !isPremium ? 'bg-ma' : 'bg-error'}`} />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="border-t border-border p-2 space-y-1 shrink-0">
          <Link
            href="/account"
            className={`flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl transition-colors ${
              pathname === '/account' ? 'bg-primary text-white font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
            title={collapsed ? 'Account' : undefined}
          >
            <User size={18} className="shrink-0" />
            {!collapsed && <span className="text-sm">My Account</span>}
          </Link>
          <Link
            href="/account?tab=subscription"
            className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title={collapsed ? 'Subscription' : undefined}
          >
            <CreditCard size={18} className="shrink-0" />
            {!collapsed && <span className="text-sm">Subscription</span>}
          </Link>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-error hover:bg-error-light transition-colors disabled:opacity-60"
            title={collapsed ? 'Sign Out' : undefined}
          >
            <LogOut size={18} className="shrink-0" />
            {!collapsed && <span className="text-sm font-medium">{signingOut ? 'Signing out...' : 'Sign Out'}</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center h-10 border-t border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-72 bg-card border-r border-border flex flex-col h-full overflow-y-auto">
            {/* Mobile sidebar header */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-border shrink-0">
              <Link href="/" className="flex items-center gap-2.5" onClick={() => setMobileMenuOpen(false)}>
                <AppLogo size={32} />
                <div className="flex flex-col leading-none">
                  <span className="font-extrabold text-sm text-foreground tracking-tight">Samyak</span>
                  <span className="text-xs font-medium text-primary">CEE Mastery</span>
                </div>
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
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

            {/* Mobile nav groups */}
            <div className="flex-1 py-3 px-3">
              {activeNavGroups.map((group) => (
                <div key={group.key} className="mb-5">
                  <p className="section-label px-2 mb-1.5">{group.label}</p>
                  {group.items.map((item) => {
                    const active = pathname === item.href || (item.href !== '/student-dashboard' && pathname?.startsWith(item.href));
                    return (
                      <Link
                        key={item.key}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-3 rounded-xl mb-0.5 transition-all duration-150 ${
                          active
                            ? 'bg-primary text-white font-semibold shadow-sm'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                      >
                        <item.icon size={18} className="shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-none">{item.label}</p>
                          {!active && <p className="text-xs opacity-60 mt-0.5">{item.desc}</p>}
                        </div>
                        {PRO_FEATURES.has(item.href) && !isPremium ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none shrink-0 flex items-center gap-0.5 bg-ma-light text-ma">
                            <Lock size={9} /> PRO
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
                <User size={18} />
                <span className="text-sm">My Account</span>
              </Link>
              <Link href="/account?tab=subscription" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <CreditCard size={18} />
                <span className="text-sm">Subscription</span>
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
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 sm:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu size={20} />
            </button>
            <div className="lg:hidden">
              <AppLogo size={28} />
            </div>
            <div className="hidden lg:block">
              <p className="text-sm font-semibold text-foreground leading-none">Student Portal</p>
              <p className="text-xs text-primary font-semibold mt-0.5">{programDetails.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ProgramSelectorModal isOpen={showCourseModal} onClose={() => setShowCourseModal(false)} />
            <ProgramSwitcher size="sm" onOpenModal={() => setShowCourseModal(true)} />

            <button
              onClick={onToggleDark}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
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

        {/* Mobile Bottom Navigation Bar */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40">
          <div className="flex items-stretch justify-around px-1 py-1">
            {activeMobileNavItems.map((item) => {
              if (item.key === 'mob-more') {
                return (
                  <button
                    key={item.key}
                    onClick={() => setMobileMenuOpen(true)}
                    className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2 px-1 rounded-xl text-muted-foreground hover:text-primary transition-colors"
                  >
                    <item.icon size={22} />
                    <span className="text-[10px] font-semibold">{item.label}</span>
                  </button>
                );
              }
              const active = pathname === item.href || (item.href !== '/student-dashboard' && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 px-1 rounded-xl transition-colors ${
                    active ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                  }`}
                >
                  <div className={`p-1 rounded-lg transition-colors ${active ? 'bg-primary/10' : ''}`}>
                    <item.icon size={21} />
                  </div>
                  <span className={`text-[10px] ${active ? 'font-bold' : 'font-semibold'}`}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}