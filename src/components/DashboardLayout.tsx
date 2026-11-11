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
  Search, ShieldCheck, CheckCircle2, ChevronDown, HelpCircle
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import PageTransitionWrapper from '@/components/PageTransitionWrapper';
import ProgramSwitcher from '@/components/ProgramSwitcher';
import ProgramSelectorModal from '@/components/ProgramSelectorModal';
import { useProgram, normalizeCourseId, CanonicalCourseId } from '@/contexts/ProgramContext';
import MobileBottomNav from '@/components/navigation/MobileBottomNav';

interface NavItem {
  label: string;
  href: string;
  icon: any;
  key: string;
  badge?: string;
  section?: 'LEARN' | 'PRACTICE' | 'MOCK TESTS' | 'REVISE' | 'SUPPORT';
}

// ── Mobile 5-Tab Navigation (Home, Learn, Practice, Tests, Profile) ──────────
const MOBILE_FIVE_TABS: NavItem[] = [
  { label: 'Home',     href: '/student-dashboard', icon: Home,          key: 'm-home' },
  { label: 'Learn',    href: '/subjects',          icon: BookOpen,      key: 'm-learn' },
  { label: 'Practice', href: '/practice',          icon: Zap,           key: 'm-practice' },
  { label: 'Tests',    href: '/mock-tests',        icon: ClipboardList, key: 'm-tests' },
  { label: 'Profile',  href: '/profile',           icon: User,          key: 'm-profile' },
];

// ── Desktop Primary Nav (Track Aware & Organized Around Core Pillars) ─────────
function getDesktopNav(canonicalId: CanonicalCourseId): NavItem[] {
  if (canonicalId === 'see_class_10') {
    return [
      { label: 'Dashboard',     href: '/student-dashboard',              icon: Home,          key: 'd-home' },
      // Learn
      { label: 'All Subjects',  href: '/subjects?program=see_class_10',  icon: BookOpen,      key: 'd-subjects', section: 'LEARN' },
      { label: 'SEE 8-Tab Hub', href: '/see',                            icon: Layers,        key: 'd-see-hub', badge: 'CDC Hub', section: 'LEARN' },
      { label: 'Academic Vault',href: '/free-resources?program=see',     icon: FileText,      key: 'd-vault', section: 'LEARN' },
      { label: 'Live Classes',  href: '/live-classes',                   icon: Radio,         key: 'd-live', badge: 'LIVE', section: 'LEARN' },
      // Practice
      { label: 'Question Bank', href: '/see/question-bank',              icon: FileText,      key: 'd-qb', section: 'PRACTICE' },
      { label: 'Practice Drills',href: '/practice?program=see_class_10', icon: Zap,           key: 'd-practice', section: 'PRACTICE' },
      { label: 'Battle Arena',  href: '/battle-arena',                   icon: Swords,        key: 'd-arena', badge: 'Rs. 1,000', section: 'PRACTICE' },
      { label: 'AI Rubric Marker', href: '/vision-marker',               icon: Sparkles,      key: 'd-vision', badge: 'AI', section: 'PRACTICE' },
      // Mock Tests
      { label: 'Model Tests',   href: '/mock-tests?program=see',         icon: ClipboardList, key: 'd-tests', badge: 'CDC', section: 'MOCK TESTS' },
      // Revise
      { label: 'Mistakes Log',  href: '/mistake-analyser',               icon: AlertTriangle, key: 'd-mistakes', section: 'REVISE' },
      { label: 'Flashcards',    href: '/flashcards',                     icon: Layers,        key: 'd-flashcards', badge: 'SM-2', section: 'REVISE' },
      { label: 'Study Plan',    href: '/study-plan',                     icon: CalendarScheduleIcon, key: 'd-plan', section: 'REVISE' },
      // Support
      { label: 'Billing & Invoices', href: '/billing',                   icon: CreditCard,    key: 'd-billing', section: 'SUPPORT' },
      { label: 'Help & Support',href: '/contact',                        icon: HelpCircle,    key: 'd-support', section: 'SUPPORT' },
    ];
  }

  if (canonicalId === 'ioe_engineering') {
    return [
      { label: 'Dashboard',     href: '/student-dashboard',                icon: Home,          key: 'd-home' },
      // Learn
      { label: 'IOE Subjects',  href: '/subjects?program=ioe_engineering', icon: BookOpen,      key: 'd-subjects', section: 'LEARN' },
      { label: 'Academic Vault',href: '/free-resources?program=ioe',       icon: FileText,      key: 'd-vault', section: 'LEARN' },
      { label: 'Live Classes',  href: '/live-classes',                     icon: Radio,         key: 'd-live', badge: 'LIVE', section: 'LEARN' },
      // Practice
      { label: 'CBT Practice',  href: '/practice?program=ioe_engineering', icon: Zap,           key: 'd-practice', section: 'PRACTICE' },
      { label: 'Question Bank', href: '/question-bank',                    icon: FileText,      key: 'd-qb', section: 'PRACTICE' },
      { label: 'Battle Arena',  href: '/battle-arena',                     icon: Swords,        key: 'd-arena', badge: 'Rs. 1,000', section: 'PRACTICE' },
      { label: 'AI Engineering Tutor', href: '/ai-tutor',                  icon: Bot,           key: 'd-ai', badge: 'AI', section: 'PRACTICE' },
      // Mock Tests
      { label: '140M CBT Mocks',href: '/mock-tests?program=ioe_engineering', icon: ClipboardList, key: 'd-tests', badge: 'IOE', section: 'MOCK TESTS' },
      // Revise
      { label: 'Mistakes Log',  href: '/mistake-analyser',                 icon: AlertTriangle, key: 'd-mistakes', section: 'REVISE' },
      { label: 'Flashcards',    href: '/flashcards',                       icon: Layers,        key: 'd-flashcards', badge: 'SM-2', section: 'REVISE' },
      { label: 'Study Plan',    href: '/study-plan',                       icon: CalendarScheduleIcon, key: 'd-plan', section: 'REVISE' },
      // Support
      { label: 'Billing & Invoices', href: '/billing',                     icon: CreditCard,    key: 'd-billing', section: 'SUPPORT' },
      { label: 'Help & Support',href: '/contact',                          icon: HelpCircle,    key: 'd-support', section: 'SUPPORT' },
    ];
  }

  if (canonicalId === 'lok_sewa') {
    return [
      { label: 'Dashboard',     href: '/student-dashboard',          icon: Home,          key: 'd-home' },
      // Learn
      { label: 'GK & IQ Syllabus', href: '/subjects?program=lok_sewa', icon: BookOpen,    key: 'd-subjects', section: 'LEARN' },
      { label: 'Academic Vault',href: '/free-resources?program=lok_sewa', icon: FileText, key: 'd-vault', section: 'LEARN' },
      { label: 'Live Classes',  href: '/live-classes',               icon: Radio,         key: 'd-live', badge: 'LIVE', section: 'LEARN' },
      // Practice
      { label: 'First Paper Practice', href: '/practice?program=lok_sewa', icon: Zap,    key: 'd-practice', section: 'PRACTICE' },
      { label: 'Question Bank', href: '/question-bank',              icon: FileText,      key: 'd-qb', section: 'PRACTICE' },
      { label: 'Battle Arena',  href: '/battle-arena',               icon: Swords,        key: 'd-arena', badge: 'Rs. 1,000', section: 'PRACTICE' },
      { label: 'AI Lok Sewa Tutor', href: '/ai-tutor',               icon: Bot,           key: 'd-ai', badge: 'AI', section: 'PRACTICE' },
      // Mock Tests
      { label: 'PSC Model Exams', href: '/mock-tests?program=lok_sewa', icon: ClipboardList, key: 'd-tests', badge: 'PSC', section: 'MOCK TESTS' },
      // Revise
      { label: 'Mistakes Log',  href: '/mistake-analyser',           icon: AlertTriangle, key: 'd-mistakes', section: 'REVISE' },
      { label: 'Flashcards',    href: '/flashcards',                 icon: Layers,        key: 'd-flashcards', badge: 'SM-2', section: 'REVISE' },
      { label: 'Study Plan',    href: '/study-plan',                 icon: CalendarScheduleIcon, key: 'd-plan', section: 'REVISE' },
      // Support
      { label: 'Billing & Invoices', href: '/billing',               icon: CreditCard,    key: 'd-billing', section: 'SUPPORT' },
      { label: 'Help & Support',href: '/contact',                    icon: HelpCircle,    key: 'd-support', section: 'SUPPORT' },
    ];
  }

  if (canonicalId === 'neb_class_11' || canonicalId === 'neb_class_12') {
    const gradeLabel = canonicalId === 'neb_class_11' ? 'Class 11' : 'Class 12';
    return [
      { label: 'Dashboard',     href: '/student-dashboard',              icon: Home,          key: 'd-home' },
      // Learn
      { label: `${gradeLabel} Subjects`, href: `/subjects?program=${canonicalId}`, icon: BookOpen, key: 'd-subjects', section: 'LEARN' },
      { label: 'Academic Vault',href: '/free-resources?program=neb',     icon: FileText,      key: 'd-vault', section: 'LEARN' },
      { label: 'Live Classes',  href: '/live-classes',                   icon: Radio,         key: 'd-live', badge: 'LIVE', section: 'LEARN' },
      // Practice
      { label: 'Derivations & MCQs', href: `/practice?program=${canonicalId}`, icon: Zap,    key: 'd-practice', section: 'PRACTICE' },
      { label: 'Question Bank', href: '/question-bank',                  icon: FileText,      key: 'd-qb', section: 'PRACTICE' },
      { label: 'Battle Arena',  href: '/battle-arena',                   icon: Swords,        key: 'd-arena', badge: 'Rs. 1,000', section: 'PRACTICE' },
      { label: 'AI Answer Marker', href: '/vision-marker',               icon: Sparkles,      key: 'd-vision', badge: 'AI', section: 'PRACTICE' },
      { label: 'AI Tutor',      href: '/ai-tutor',                       icon: Bot,           key: 'd-ai', badge: 'AI', section: 'PRACTICE' },
      // Mock Tests
      { label: 'NEB Board Pre-Mocks', href: '/mock-tests?program=neb',   icon: ClipboardList, key: 'd-tests', badge: 'NEB', section: 'MOCK TESTS' },
      // Revise
      { label: 'Mistakes Log',  href: '/mistake-analyser',               icon: AlertTriangle, key: 'd-mistakes', section: 'REVISE' },
      { label: 'Flashcards',    href: '/flashcards',                     icon: Layers,        key: 'd-flashcards', badge: 'SM-2', section: 'REVISE' },
      { label: 'Study Plan',    href: '/study-plan',                     icon: CalendarScheduleIcon, key: 'd-plan', section: 'REVISE' },
      // Support
      { label: 'Billing & Invoices', href: '/billing',                   icon: CreditCard,    key: 'd-billing', section: 'SUPPORT' },
      { label: 'Help & Support',href: '/contact',                        icon: HelpCircle,    key: 'd-support', section: 'SUPPORT' },
    ];
  }

  if (canonicalId === 'ielts') {
    return [
      { label: 'Dashboard',     href: '/student-dashboard',              icon: Home,          key: 'd-home' },
      // Learn
      { label: '4 Modules (L/R/W/S)', href: '/english',                  icon: BookOpen,      key: 'd-subjects', section: 'LEARN' },
      { label: 'Academic Vault',href: '/free-resources?program=ielts',   icon: FileText,      key: 'd-vault', section: 'LEARN' },
      { label: 'Live Masterclasses', href: '/live-classes',              icon: Radio,         key: 'd-live', badge: 'LIVE', section: 'LEARN' },
      // Practice
      { label: 'Module Drills', href: '/practice?program=ielts',         icon: Zap,           key: 'd-practice', section: 'PRACTICE' },
      { label: 'Question Bank', href: '/question-bank',                  icon: FileText,      key: 'd-qb', section: 'PRACTICE' },
      { label: 'Battle Arena',  href: '/battle-arena',                   icon: Swords,        key: 'd-arena', badge: 'Rs. 1,000', section: 'PRACTICE' },
      { label: 'AI Speaking & Essay', href: '/ai-tutor',                 icon: Bot,           key: 'd-ai', badge: 'AI', section: 'PRACTICE' },
      // Mock Tests
      { label: 'Band 9 Simulators', href: '/mock-tests?program=ielts',   icon: ClipboardList, key: 'd-tests', badge: 'IELTS', section: 'MOCK TESTS' },
      // Revise
      { label: 'Mistakes Log',  href: '/mistake-analyser',               icon: AlertTriangle, key: 'd-mistakes', section: 'REVISE' },
      { label: 'Flashcards',    href: '/flashcards',                     icon: Layers,        key: 'd-flashcards', badge: 'SM-2', section: 'REVISE' },
      { label: 'Study Plan',    href: '/study-plan',                     icon: CalendarScheduleIcon, key: 'd-plan', section: 'REVISE' },
      // Support
      { label: 'Billing & Invoices', href: '/billing',                   icon: CreditCard,    key: 'd-billing', section: 'SUPPORT' },
      { label: 'Help & Support',href: '/contact',                        icon: HelpCircle,    key: 'd-support', section: 'SUPPORT' },
    ];
  }

  if (canonicalId === 'digital_marketing' || canonicalId === 'artificial_intelligence') {
    const isTech = canonicalId === 'artificial_intelligence';
    return [
      { label: 'Dashboard',     href: '/student-dashboard',              icon: Home,          key: 'd-home' },
      // Learn
      { label: isTech ? 'AI Modules' : 'Marketing Modules', href: `/subjects?program=${canonicalId}`, icon: BookOpen, key: 'd-subjects', section: 'LEARN' },
      { label: 'Academic Vault',href: '/free-resources',                 icon: FileText,      key: 'd-vault', section: 'LEARN' },
      { label: 'Live Workshops',href: '/live-classes',                   icon: Radio,         key: 'd-live', badge: 'LIVE', section: 'LEARN' },
      // Practice
      { label: 'Hands-on Projects', href: `/practice?program=${canonicalId}`, icon: Zap,      key: 'd-practice', section: 'PRACTICE' },
      { label: 'Battle Arena',  href: '/battle-arena',                   icon: Swords,        key: 'd-arena', badge: 'Rs. 1,000', section: 'PRACTICE' },
      { label: isTech ? 'AI Coding Assistant' : 'AI Copy & Ad Tutor', href: '/ai-tutor', icon: Bot, key: 'd-ai', badge: 'AI', section: 'PRACTICE' },
      // Mock Tests
      { label: 'Skill Assessments', href: `/mock-tests?program=${canonicalId}`, icon: ClipboardList, key: 'd-tests', badge: 'CERT', section: 'MOCK TESTS' },
      // Revise
      { label: 'Flashcards',    href: '/flashcards',                     icon: Layers,        key: 'd-flashcards', badge: 'SM-2', section: 'REVISE' },
      { label: 'Project Milestones', href: '/study-plan',                icon: CalendarScheduleIcon, key: 'd-plan', section: 'REVISE' },
      // Support
      { label: 'Billing & Invoices', href: '/billing',                   icon: CreditCard,    key: 'd-billing', section: 'SUPPORT' },
      { label: 'Help & Support',href: '/contact',                        icon: HelpCircle,    key: 'd-support', section: 'SUPPORT' },
    ];
  }

  // Default / CEE Medical Entrance
  return [
    { label: 'Dashboard',     href: '/student-dashboard', icon: Home,          key: 'd-home' },
    // Learn
    { label: 'All Subjects',  href: '/subjects',          icon: BookOpen,      key: 'd-subjects', section: 'LEARN' },
    { label: 'Academic Vault',href: '/free-resources',    icon: FileText,      key: 'd-vault', section: 'LEARN' },
    { label: 'Live Classes',  href: '/live-classes',      icon: Radio,         key: 'd-live', badge: 'LIVE', section: 'LEARN' },
    // Practice
    { label: 'Practice MCQs', href: '/practice',          icon: Zap,           key: 'd-practice', section: 'PRACTICE' },
    { label: 'Question Bank', href: '/question-bank',     icon: FileText,      key: 'd-qb', section: 'PRACTICE' },
    { label: 'Battle Arena',  href: '/battle-arena',      icon: Swords,        key: 'd-arena', badge: 'Rs. 1,000', section: 'PRACTICE' },
    { label: 'AI Medical Tutor', href: '/ai-tutor',       icon: Bot,           key: 'd-ai', badge: 'AI', section: 'PRACTICE' },
    // Mock Tests
    { label: 'Grand Mocks',   href: '/mock-tests',        icon: ClipboardList, key: 'd-tests', badge: 'MEC', section: 'MOCK TESTS' },
    { label: 'Rank Predictor',href: '/rank-predictor',    icon: Sparkles,      key: 'd-rank', badge: 'NEW', section: 'MOCK TESTS' },
    // Revise
    { label: 'Mistakes Log',  href: '/mistake-analyser',  icon: AlertTriangle, key: 'd-mistakes', section: 'REVISE' },
    { label: 'Flashcards',    href: '/flashcards',        icon: Layers,        key: 'd-flashcards', badge: 'SM-2', section: 'REVISE' },
    { label: 'My Progress',   href: '/progress',          icon: TrendingUp,    key: 'd-progress',   badge: 'AI',   section: 'REVISE' },
    { label: 'Study Plan',    href: '/study-plan',        icon: CalendarScheduleIcon, key: 'd-plan', section: 'REVISE' },
    // Support
    { label: 'Billing & Invoices', href: '/billing',      icon: CreditCard,    key: 'd-billing', section: 'SUPPORT' },
    { label: 'Help & Support',href: '/contact',           icon: HelpCircle,    key: 'd-support', section: 'SUPPORT' },
  ];
}

function CalendarScheduleIcon(props: any) {
  return <ClipboardList {...props} />;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  action_url?: string;
  created_at: string;
}

export default function DashboardLayout({
  children,
  isDark,
  onToggleDark,
  contextualPanel,
}: {
  children: React.ReactNode;
  isDark?: boolean;
  onToggleDark?: () => void;
  contextualPanel?: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const { program } = useProgram();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  const canonicalId = normalizeCourseId(program);
  const desktopNav = getDesktopNav(canonicalId);

  // Close popovers on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Keyboard shortcut Ctrl+K / Cmd+K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch real notifications
  useEffect(() => {
    if (!user?.id) return;
    const supabase = createClient();
    supabase
      .from('notifications')
      .select('id, title, message, type, is_read, action_url, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(8)
      .then(({ data }) => {
        if (data) setNotifications(data);
      });
  }, [user?.id]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAllRead = async () => {
    if (!user?.id) return;
    const supabase = createClient();
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const displayName = profile?.full_name?.split(' ')?.[0] || user?.email?.split('@')?.[0] || 'Student';
  const roleName = profile?.role_name || (profile?.subscription_plan && profile.subscription_plan !== 'free' ? 'Paid Student' : 'Free Student');

  const searchableLinks = [
    { title: 'Learning Track Gate (Switch Program / Course Stream)', href: '/gate', category: 'Global Navigation' },
    { title: 'CEE Medical Entrance Super Target Batch 2026', href: '/courses/cee-mbbs-mastery-2026', category: 'Flagship Course' },
    { title: 'IOE Engineering Entrance Preparation Batch 2026', href: '/courses/ioe-engineering-entrance-2026', category: 'Engineering Entrance' },
    { title: 'Lok Sewa Aayog Preparation Batch 2082 (GK & IQ)', href: '/courses/lok-sewa-aayog-preparation-2082', category: 'Civil Service' },
    { title: 'SEE Class 10 Board Topper Batch 2082/2083', href: '/courses/see-class-10-board-topper-batch', category: 'Class 10 Board' },
    { title: 'NEB Class 11 Science Mastery & Foundation', href: '/courses/neb-class-11-science-mastery', category: 'Class 11 Board' },
    { title: 'NEB Class 12 Board Topper & Entrance Bridge', href: '/courses/neb-class-12-board-topper-batch', category: 'Class 12 Board' },
    { title: 'IELTS Target Band 8.0+ Academic & General', href: '/courses/english-ielts-target-8-mastery', category: 'Global English' },
    { title: 'Digital Marketing, Canva & Freelancing Masterclass', href: '/courses/digital-marketing-canva-freelancing', category: 'Digital Career' },
    { title: 'AI Prompt Engineering & Python Academy', href: '/courses/digital-python-programming-zero-to-hero', category: 'Tech & AI' },
    { title: 'CEE 45-Day Ultimate Crash Course 2026', href: '/courses/cee-45-day-crash-course', category: 'Crash Course' },
    { title: 'All Courses & Admissions Catalogue', href: '/courses', category: 'Directory' },
    { title: 'Medical Biology (Zoology & Botany 80 Marks)', href: '/subjects?subject=biology', category: 'CEE Subject' },
    { title: 'Medical Physics (Mechanics, Optics 50 Marks)', href: '/subjects?subject=physics', category: 'CEE Subject' },
    { title: 'Medical Chemistry (Organic & Physical 50 Marks)', href: '/subjects?subject=chemistry', category: 'CEE Subject' },
    { title: 'Engineering Mathematics (IOE 140M CBT)', href: '/subjects?subject=engineering_math', category: 'IOE Subject' },
    { title: 'Lok Sewa General Knowledge (GK / सामान्य ज्ञान)', href: '/subjects?subject=loksewa_gk', category: 'Lok Sewa' },
    { title: 'Lok Sewa General Mental Ability (IQ / बौद्धिक परीक्षण)', href: '/subjects?subject=loksewa_iq', category: 'Lok Sewa' },
    { title: 'Compulsory Science (Physics, Chemistry, Biology)', href: '/subjects?subject=science', category: 'SEE Subject' },
    { title: 'Compulsory Mathematics (Algebra, Geometry)', href: '/subjects?subject=mathematics', category: 'SEE Subject' },
    { title: 'Optional Mathematics (Vectors, Trigonometry)', href: '/subjects?subject=opt_math', category: 'SEE Subject' },
    { title: 'Practice 15,000+ Topicwise MCQs', href: '/practice', category: 'Practice' },
    { title: 'Full-Length Timed Mock Exams (-0.25 Marking)', href: '/mock-tests', category: 'Assessment' },
    { title: 'Personalized Mistakes Notebook & Revision', href: '/mistake-analyser', category: 'Revision' },
    { title: 'Daily Study Plan & Tasks', href: '/study-plan', category: 'Planning' },
    { title: 'Interactive Live Batch Classes', href: '/live-classes', category: 'Live Class' },
    { title: 'AI Handwritten Vision Marker', href: '/vision-marker', category: 'Subjective AI' },
    { title: '1v1 Battle Arena Duels (Rs. 1,000 Daily Payout)', href: '/battle-arena', category: 'Practice & Arena' },
    { title: 'Academic Vault — Free In-App Notes, Formulas & Model Papers', href: '/free-resources', category: 'Notes & Vault' },
    { title: 'CEE Rank & Medical College Cutoff Predictor', href: '/rank-predictor', category: 'Assessment' },
    { title: 'SM-2 Spaced Repetition Flashcards', href: '/flashcards', category: 'Revision' },
    { title: 'Autonomous AI Operations & Daemons', href: '/admin/autonomous', category: 'System & Admin' },
    { title: 'Redeem Offline Book Activation Voucher', href: '/free-resources', category: 'Voucher & Access' },
    { title: 'Help Center & WhatsApp Support', href: '/contact', category: 'Support' },
  ];

  const filteredLinks = searchQuery.trim()
    ? searchableLinks.filter((item) => item.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : searchableLinks.slice(0, 5);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased">
      
      {/* ── GLOBAL SEARCH MODAL (Cmd+K) ─────────────────────────────────── */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-20 px-4 animate-fade-in">
          <div className="bg-card border border-border w-full max-w-lg rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <div className="flex items-center gap-2 flex-1">
                <Search size={18} className="text-muted-foreground" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search subjects, chapters, mock tests..."
                  className="w-full bg-transparent text-sm focus:outline-none text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <button
                onClick={() => setSearchOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-1 max-h-72 overflow-y-auto">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">
                {searchQuery ? 'Search Results' : 'Quick Navigation'}
              </p>
              {filteredLinks.map((item, idx) => (
                <Link
                  key={idx}
                  href={item.href}
                  onClick={() => setSearchOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/70 transition-all text-xs font-semibold text-foreground group"
                >
                  <span className="group-hover:text-primary transition-colors">{item.title}</span>
                  <span className="text-[10px] font-mono text-muted-foreground px-2 py-0.5 rounded bg-muted">
                    {item.category}
                  </span>
                </Link>
              ))}
            </div>

            <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Press ESC or click outside to close</span>
              <kbd className="px-2 py-0.5 rounded bg-muted font-mono text-[10px]">ESC</kbd>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        
        {/* ── DESKTOP LEFT SIDEBAR ─────────────────────────────────────── */}
        <aside
          className={`hidden lg:flex flex-col justify-between shrink-0 bg-card border-r border-border/80 transition-all duration-300 z-30 ${
            sidebarCollapsed ? 'w-20' : 'w-64'
          }`}
        >
          {/* Top Header in Sidebar */}
          <div className="p-4 border-b border-border/60 space-y-4">
            <div className="flex items-center justify-between">
              <Link href="/student-dashboard" className="flex items-center gap-2">
                <AppLogo size={32} showText={!sidebarCollapsed} />
              </Link>
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </button>
            </div>

            {/* Active Track Indicator */}
            {!sidebarCollapsed && (
              <button
                onClick={() => setShowCourseModal(true)}
                className="w-full p-2 rounded-2xl bg-muted/60 hover:bg-muted border border-border/80 text-left transition-all flex items-center justify-between group"
              >
                <div className="truncate">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
                    Active Track
                  </span>
                  <span className="text-xs font-bold text-foreground truncate block">
                    {canonicalId === 'see_class_10' ? 'SEE Class 10' : 'CEE Medical'}
                  </span>
                </div>
                <ChevronDown size={14} className="text-muted-foreground group-hover:text-foreground shrink-0" />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {desktopNav.map((item, idx) => {
              const active = pathname === item.href || (item.href !== '/student-dashboard' && pathname?.startsWith(item.href.split('?')[0]));
              const prevItem = idx > 0 ? desktopNav[idx - 1] : null;
              const showSection = !sidebarCollapsed && item.section && (!prevItem || prevItem.section !== item.section);

              return (
                <React.Fragment key={item.key}>
                  {showSection && (
                    <div className="pt-3 pb-1 px-3 text-[9px] font-black tracking-widest uppercase text-muted-foreground/60 select-none">
                      {item.section}
                    </div>
                  )}
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                      active
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                    }`}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <item.icon size={18} className="shrink-0" />
                    {!sidebarCollapsed && (
                      <div className="flex-1 flex items-center justify-between">
                        <span>{item.label}</span>
                        {item.badge && (
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full font-black uppercase ${
                            item.badge === 'LIVE' ? 'bg-red-500 text-white animate-pulse' : active ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                </React.Fragment>
              );
            })}
          </div>

          {/* User Profile & Footer in Sidebar */}
          <div className="p-3 border-t border-border/60 space-y-2">
            {!sidebarCollapsed ? (
              <div className="p-2.5 rounded-2xl bg-muted/40 border border-border/60 flex items-center justify-between">
                <Link href="/profile" className="flex items-center gap-2.5 truncate hover:opacity-80 transition-opacity">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-black text-xs flex items-center justify-center shrink-0">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-foreground leading-none truncate">{displayName}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 font-medium truncate">{roleName}</p>
                  </div>
                </Link>
                <button
                  onClick={async () => {
                    await signOut();
                    router.replace('/login');
                  }}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors shrink-0"
                  title="Sign Out"
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <button
                onClick={async () => {
                  await signOut();
                  router.replace('/login');
                }}
                className="w-full p-2 flex justify-center text-muted-foreground hover:text-red-500"
                title="Sign Out"
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        </aside>

        {/* ── MAIN APPLICATION WORKSPACE ───────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          
          {/* Top Application Header */}
          <header className="h-16 bg-card/85 backdrop-blur-xl border-b border-border/80 flex items-center justify-between px-4 sm:px-6 shrink-0 shadow-xs z-20">
            
            {/* Left Header: Mobile Toggle & Program Title */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileDrawerOpen(true)}
                className="lg:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                aria-label="Open navigation menu"
              >
                <Menu size={20} />
              </button>

              <div className="lg:hidden">
                <AppLogo size={28} />
              </div>

              <div className="hidden sm:flex items-center gap-2">
                <span className="text-xs font-black text-foreground uppercase tracking-wider">
                  Student Workspace
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {canonicalId === 'see_class_10' ? 'SEE Class 10' : 'CEE Medical'}
                </span>
              </div>
            </div>

            {/* Right Header: Search, Track Switcher, Notifications, Dark Mode, Avatar */}
            <div className="flex items-center gap-2 sm:gap-3">
              
              {/* Search Button (Cmd+K) */}
              <button
                onClick={() => setSearchOpen(true)}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/60 border border-border/80 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
              >
                <Search size={14} />
                <span>Search curriculum...</span>
                <kbd className="text-[10px] font-mono bg-background border border-border px-1.5 py-0.2 rounded">⌘K</kbd>
              </button>

              {/* Course Switcher */}
              <ProgramSwitcher size="sm" onOpenModal={() => setShowCourseModal(true)} />
              <ProgramSelectorModal isOpen={showCourseModal} onClose={() => setShowCourseModal(false)} />

              {/* Dark Mode Toggle */}
              <button
                onClick={onToggleDark}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all active:scale-90"
                aria-label="Toggle dark mode"
              >
                {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
              </button>

              {/* Notification Bell Dropdown */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                  aria-label="Notifications"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[9px] font-bold px-0.5">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-2xl shadow-xl animate-scale-in z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-foreground">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="text-[10px] bg-red-500 text-white font-bold px-1.5 py-0.2 rounded-full">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="flex items-center gap-1 text-[11px] text-primary font-semibold hover:underline"
                        >
                          <CheckCheck size={12} />
                          <span>Mark all read</span>
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-border/40">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center text-muted-foreground space-y-1">
                          <Bell size={20} className="mx-auto text-muted-foreground/60" />
                          <p className="text-xs font-medium">No notifications yet</p>
                          <p className="text-[10px]">Updates about exams and live classes will appear here</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`p-3.5 hover:bg-muted/60 transition-colors cursor-pointer ${
                              !n.is_read ? 'bg-primary/5' : ''
                            }`}
                          >
                            <p className="text-xs font-bold text-foreground leading-snug">{n.title}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                            <span className="text-[9px] text-muted-foreground mt-1 block">
                              {new Date(n.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="p-2 border-t border-border/60 text-center">
                      <Link
                        href="/student-dashboard"
                        onClick={() => setNotifOpen(false)}
                        className="text-[11px] text-primary font-bold hover:underline"
                      >
                        Notification Center
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile Avatar Link */}
              <Link
                href="/profile"
                className="flex items-center gap-2 pl-2 border-l border-border hover:opacity-80 transition-opacity"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-bold text-foreground leading-none">{displayName}</p>
                  <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{roleName}</p>
                </div>
              </Link>
            </div>
          </header>

          {/* Main Learning Content + Optional Contextual Panel */}
          <main className="flex-1 overflow-y-auto w-full max-w-full overflow-x-hidden pb-20 lg:pb-0">
            <PageTransitionWrapper>
              <div className="flex flex-col xl:flex-row gap-6 p-4 sm:p-6 lg:p-8 max-w-screen-2xl mx-auto">
                {/* Center Learning Workspace */}
                <div className="flex-1 min-w-0 space-y-8">
                  {children}
                </div>

                {/* Compact Contextual Panel (when provided or large screens) */}
                {contextualPanel && (
                  <aside className="w-full xl:w-80 shrink-0 space-y-6">
                    {contextualPanel}
                  </aside>
                )}
              </div>
            </PageTransitionWrapper>
          </main>

          {/* ── MOBILE BOTTOM NAVIGATION BAR (Home, Learn, Practice, Exams, Compete) ── */}
          <MobileBottomNav />

        </div>
      </div>

      {/* ── MOBILE SLIDE-OUT DRAWER ────────────────────────────────────── */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex lg:hidden animate-fade-in">
          <div className="bg-card w-72 max-w-[85vw] h-full p-5 flex flex-col justify-between shadow-2xl border-r border-border">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <AppLogo size={32} showText={true} />
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Track Selector in Drawer */}
              <button
                onClick={() => {
                  setMobileDrawerOpen(false);
                  setShowCourseModal(true);
                }}
                className="w-full p-3 rounded-2xl bg-muted/60 border border-border flex items-center justify-between text-left"
              >
                <div>
                  <span className="text-[10px] font-mono uppercase text-muted-foreground block">Active Course</span>
                  <span className="text-xs font-bold text-foreground">
                    {canonicalId === 'see_class_10' ? 'SEE Class 10 Board' : 'CEE Medical Entrance'}
                  </span>
                </div>
                <ChevronDown size={14} className="text-muted-foreground" />
              </button>

              {/* Navigation Items */}
              <div className="space-y-1">
                {desktopNav.map((item, idx) => {
                  const prevItem = idx > 0 ? desktopNav[idx - 1] : null;
                  const showSection = item.section && (!prevItem || prevItem.section !== item.section);

                  return (
                    <React.Fragment key={item.key}>
                      {showSection && (
                        <div className="pt-2 pb-0.5 px-3 text-[9px] font-black tracking-widest uppercase text-muted-foreground/60 select-none">
                          {item.section}
                        </div>
                      )}
                      <Link
                        href={item.href}
                        onClick={() => setMobileDrawerOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-2xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-all"
                      >
                        <item.icon size={17} />
                        <span>{item.label}</span>
                      </Link>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Bottom Account & Sign Out */}
            <div className="pt-4 border-t border-border/60 space-y-2">
              <Link
                href="/profile"
                onClick={() => setMobileDrawerOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-muted/40 border border-border text-xs font-bold text-foreground"
              >
                <User size={16} />
                <span>Profile &amp; Settings</span>
              </Link>
              <button
                onClick={async () => {
                  setMobileDrawerOpen(false);
                  await signOut();
                  router.replace('/login');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-bold text-red-500 hover:bg-red-500/10 transition-colors"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
