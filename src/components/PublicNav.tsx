'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import ProgramSwitcher from '@/components/ProgramSwitcher';
import ProgramSelectorModal from '@/components/ProgramSelectorModal';
import { Menu, X, ChevronDown, Sun, Moon, BookOpen, Download, Zap, FileText, Bot, Swords, Trophy, ClipboardList, Rocket, LayoutDashboard, Stethoscope, GraduationCap, Languages, Cpu, Sparkles, TrendingUp } from 'lucide-react';
import AiDoubtSolverModal from '@/components/AiDoubtSolverModal';
import SmartNotificationsDrawer from '@/components/SmartNotificationsDrawer';



type NavChild = { label: string; href: string; icon: React.ElementType; key: string; desc: string; badge?: string };
type NavLink = { label: string; href: string; key: string; badge?: string; children?: NavChild[] };

const navLinks: NavLink[] = [
  {
    label: 'Learn',
    href: '/courses',
    key: 'nav-learn',
    children: [
      { label: 'Samyak SEE', href: '/see', icon: GraduationCap, key: 'nav-see', desc: 'Class 10 Board Exam Prep & NEB Model Papers' },
      { label: 'Samyak CEE', href: '/courses?sector=cee', icon: Stethoscope, key: 'nav-cee', desc: 'Medical Entrance 15,000+ MCQs & Notes' },
      { label: 'Samyak IELTS', href: '/english', icon: Languages, key: 'nav-eng', desc: 'Academic & General Band 8.5+ Mastery' },
      { label: 'Samyak Digital', href: '/digital-marketing', icon: TrendingUp, key: 'nav-dm', desc: 'Meta Ads, TikTok Growth & SEO Playbooks' },
      { label: 'Samyak AI', href: '/ai-tutor', icon: Cpu, key: 'nav-ai-tech', desc: 'Generative AI, Python & Automation Agents' },
    ],
  },
  {
    label: 'Practice',
    href: '/practice',
    key: 'nav-practice',
    children: [
      { label: 'Practice MCQs', href: '/practice', icon: Zap, key: 'nav-mcq', desc: 'Chapter-wise test question drills' },
      { label: 'Mock Tests', href: '/mock-tests', icon: FileText, key: 'nav-mock', desc: 'Full exam simulations with negative marks' },
      { label: 'Speaking Simulator', href: '/english/speaking/simulator', icon: Languages, key: 'nav-speak', desc: '3-Part Cue Card Voice Recorder' },
      { label: 'Writing Evaluator', href: '/english/writing/rubric', icon: FileText, key: 'nav-write', desc: 'Task 1 & 2 Examiner Rubric Grader' },
      { label: 'Coding & AI Drills', href: '/ai-tutor', icon: Cpu, key: 'nav-code', desc: 'Python Syntax & Prompt Engineering' },
    ],
  },
  {
    label: 'Compete',
    href: '/match-lobby',
    key: 'nav-compete',
    children: [
      { label: '⚔️ Samyak Arena', href: '/match-lobby', icon: Swords, key: 'nav-arena', desc: 'Real-time 1v1 multi-vertical quiz duels', badge: 'LIVE' },
      { label: 'Leaderboard', href: '/leaderboard', icon: Trophy, key: 'nav-leaderboard', desc: 'Rankings & ELO ratings' },
    ],
  },
  {
    label: 'AI',
    href: '/live-teacher',
    key: 'nav-ai-suite',
    badge: 'AI SUITE',
    children: [
      { label: 'AI Teacher Avatar', href: '/live-teacher', icon: Bot, key: 'nav-ai-teacher', desc: '1-on-1 WebRTC spoken teacher stage', badge: 'REALTIME' },
      { label: 'AI Tutor Agent', href: '/ai-tutor', icon: Bot, key: 'nav-ai-tutor', desc: '24/7 instant doubt solver' },
      { label: 'AI Vision Marker', href: '/vision-marker', icon: Sparkles, key: 'nav-ai-eval', desc: 'Handwritten exam paper OCR marker' },
      { label: 'AI Study Planner', href: '/study-plan', icon: ClipboardList, key: 'nav-ai-plan', desc: 'Personalized curriculum roadmap' },
    ],
  },
  {
    label: 'My Learning',
    href: '/student-dashboard',
    key: 'nav-my-learning',
    children: [
      { label: 'Student Dashboard', href: '/student-dashboard', icon: LayoutDashboard, key: 'nav-dash', desc: 'Active Today Stream & Course Portals' },
      { label: 'Learning Progress', href: '/student-dashboard', icon: TrendingUp, key: 'nav-prog', desc: 'Mastery rings & accuracy trends' },
      { label: 'Mistake Analyser', href: '/mistake-analyser', icon: Sparkles, key: 'nav-weak', desc: 'AI detected weakness bottlenecks' },
      { label: 'Certificates & Orders', href: '/account/purchases', icon: Rocket, key: 'nav-cert', desc: 'Enrolled courses & verified credentials' },
    ],
  },
];


interface PublicNavProps {
  isDark: boolean;
  onToggleDark: () => void;
  /** Height (px) of an announcement bar above the nav. The nav parks below it
   *  and slides up to top:0 as that bar scrolls away. Defaults to 0 (no bar). */
  announcementHeight?: number;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PublicNav({ isDark, onToggleDark, announcementHeight = 0 }: PublicNavProps) {
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showAiDoubtModal, setShowAiDoubtModal] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);

  // Auth-aware: signed-in visitors see a "Dashboard" button (→ the student
  // dashboard) instead of Sign In. The admin panel is hidden and is NEVER
  // linked from the user site — it's reachable only via its secret URL.
  const [authed, setAuthed] = useState<boolean | null>(null);
  const DASHBOARD_HREF = '/student-dashboard';
  useEffect(() => {
    let active = true;
    fetch('/api/profile/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((me) => {
        if (!active) return;
        setAuthed(!!me);
      })
      .catch(() => { if (active) setAuthed(false); });
    return () => { active = false; };
  }, []);

  const scrolled = scrollY > 16;
  // Park the nav directly under the announcement bar, then let it ride up to the
  // top as that bar scrolls off-screen. Stays at 0 on pages without a bar.
  const navTop = Math.max(announcementHeight - scrollY, 0);

  useEffect(() => {
    const handler = () => setScrollY(window.scrollY);
    handler();
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Lock body scroll while the mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // Close an open desktop dropdown on Escape or a click/tap outside the nav.
  useEffect(() => {
    if (!openDropdown) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpenDropdown(null);
    const onPointer = (e: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenDropdown(null);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [openDropdown]);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <nav
      ref={navRef}
      style={{ top: navTop }}
      className={`fixed left-0 right-0 z-50 transition-colors duration-300 ${
        scrolled || mobileOpen
          ? 'bg-card/80 backdrop-blur-xl border-b border-border/70 shadow-sm supports-[backdrop-filter]:bg-card/70'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 h-16">
          {/* Logo & Program Switcher */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/" className="flex items-center gap-2.5" aria-label="Samyak CEE Mastery — home">
              <AppLogo size={36} />
              <div className="hidden sm:flex flex-col leading-none">
                <span className="font-extrabold text-base text-foreground tracking-tight">Samyak</span>
                <span className="text-xs font-semibold text-primary">CEE &amp; SEE</span>
              </div>
            </Link>

            <div className="hidden md:flex items-center ml-1">
              <ProgramSelectorModal isOpen={showCourseModal} onClose={() => setShowCourseModal(false)} />
              <ProgramSwitcher size="sm" onOpenModal={() => setShowCourseModal(true)} />
            </div>
          </div>



          {/* Desktop nav — grid col 2, centred independent of side widths */}
          <div className="hidden lg:flex items-center justify-center gap-0.5">
            {navLinks.map((link) =>
              link.children ? (
                <div
                  key={link.key}
                  className="relative"
                  onMouseEnter={() => setOpenDropdown(link.key)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <button
                    type="button"
                    aria-haspopup="true"
                    aria-expanded={openDropdown === link.key}
                    onClick={() => setOpenDropdown(openDropdown === link.key ? null : link.key)}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      openDropdown === link.key ? 'text-foreground bg-muted' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    {link.label}
                    <ChevronDown size={14} className={`transition-transform duration-200 ${openDropdown === link.key ? 'rotate-180' : ''}`} />
                  </button>
                  {openDropdown === link.key && (
                    // pt-2 acts as an invisible hover bridge so the menu doesn't flicker.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-60">
                      <div className="bg-card border border-border rounded-xl shadow-card-hover py-1.5 animate-scale-in">
                        {link.children.map((child) => (
                          <Link
                            key={child.key}
                            href={child.href}
                            onClick={() => setOpenDropdown(null)}
                            className="flex items-center gap-3 px-2.5 py-2 mx-1 rounded-lg text-sm hover:bg-muted transition-colors group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                              <child.icon size={15} className="text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                                {child.label}
                                {child.badge && (
                                  <span className="bg-error text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">{child.badge}</span>
                                )}
                              </p>
                              <p className="text-[11px] text-muted-foreground truncate">{child.desc}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={link.key}
                  href={link.href}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  {link.label}
                </Link>
              )
            )}
          </div>

          {/* Right actions — col 3, pinned to the right edge */}
          <div className="flex items-center gap-1.5 shrink-0 justify-self-end">
            
            {/* Smart Behavior Notifications Bell */}
            <SmartNotificationsDrawer />

            {/* 🤖 ASK SAMYAK AI Button */}
            <button
              onClick={() => setShowAiDoubtModal(true)}
              className="hidden lg:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition-all border border-emerald-500/30"
            >
              <Bot size={15} />
              <span>🤖 ASK SAMYAK AI</span>
            </button>

            {/* Prebook — highlighted conversion CTA */}
            <Link
              href="/prebook"
              className="hidden md:inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full text-sm font-semibold text-primary bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-colors"
            >
              <Rocket size={14} />
              Prebook
              <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">Rs 300</span>
            </Link>

            <button
              onClick={onToggleDark}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {!isInstalled && deferredPrompt && (
              <button
                onClick={handleInstall}
                className="hidden xl:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20"
                aria-label="Install app"
              >
                <Download size={15} />
                Install
              </button>
            )}

            {authed ? (
              <Link
                href={DASHBOARD_HREF}
                className="hidden sm:inline-flex btn-primary text-sm py-2 px-4 shadow-sm items-center gap-1.5"
              >
                <LayoutDashboard size={15} />
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-up-login-screen"
                  className="hidden sm:inline-flex btn-secondary text-xs sm:text-sm py-2 px-3 gap-2 items-center font-bold"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Google Sign In</span>
                </Link>
                <Link
                  href="/sign-up-login-screen"
                  className="hidden lg:inline-flex btn-primary text-sm py-2 px-4 shadow-sm font-extrabold"
                >
                  Start Free
                </Link>
              </>
            )}

            <button
              className="lg:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-card border-t border-border max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="max-w-screen-2xl mx-auto px-4 py-4 flex flex-col gap-1">
            {/* Feature shortcuts */}
            <div className="grid grid-cols-3 gap-2 pb-4 border-b border-border mb-2">
              {[
                { label: 'Practice', href: '/practice', icon: Zap, color: 'text-primary bg-primary/10' },
                { label: 'Mock Tests', href: '/mock-tests', icon: FileText, color: 'text-success bg-success-light' },
                { label: 'AI Tutor', href: '/ai-tutor', icon: Bot, color: 'text-chem bg-chem-light' },
                { label: 'Battle', href: '/battle-arena', icon: Swords, color: 'text-error bg-error-light' },
                { label: 'App', href: '/app-feature', icon: Download, color: 'text-physics bg-physics-light' },
                { label: 'Ranking', href: '/leaderboard', icon: Trophy, color: 'text-ma bg-ma-light' },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border border-border hover:bg-muted transition-colors"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.color}`}>
                    <item.icon size={16} />
                  </div>
                  <span className="text-[10px] font-semibold text-foreground">{item.label}</span>
                </Link>
              ))}
            </div>

            {/* Prebook highlight */}
            <Link
              href="/prebook"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between px-3 py-3 rounded-xl bg-primary/10 border border-primary/20 mb-1"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Rocket size={16} /> Prebook the Crash Course
              </span>
              <span className="bg-primary text-primary-foreground text-[11px] font-bold px-2 py-0.5 rounded-full">Rs 300</span>
            </Link>

            {navLinks.map((link) => (
              <div key={link.key}>
                <Link
                  href={link.href}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
                {link.children && (
                  <div className="ml-3 pl-3 border-l border-border flex flex-col">
                    {link.children.map((child) => (
                      <Link
                        key={child.key}
                        href={child.href}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        onClick={() => setMobileOpen(false)}
                      >
                        <child.icon size={14} className="text-primary shrink-0" />
                        {child.label}
                        {child.badge && (
                          <span className="bg-error text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">{child.badge}</span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <div className="border-t border-border mt-2 pt-3 flex flex-col gap-2">
              {!isInstalled && deferredPrompt && (
                <button
                  onClick={() => { handleInstall(); setMobileOpen(false); }}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                >
                  <Download size={15} />
                  Install App
                </button>
              )}
              {authed ? (
                <Link href={DASHBOARD_HREF} className="btn-primary text-sm text-center justify-center items-center gap-1.5" onClick={() => setMobileOpen(false)}>
                  <LayoutDashboard size={15} />
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/sign-up-login-screen" className="btn-secondary text-sm text-center justify-center" onClick={() => setMobileOpen(false)}>
                    Sign In
                  </Link>
                  <Link href="/sign-up-login-screen" className="btn-primary text-sm text-center justify-center" onClick={() => setMobileOpen(false)}>
                    Start Free Today
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {/* AI Doubt Solver Modal */}
      <AiDoubtSolverModal
        isOpen={showAiDoubtModal}
        onClose={() => setShowAiDoubtModal(false)}
      />
    </nav>
  );
}
