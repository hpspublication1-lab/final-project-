'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import ProgramSwitcher from '@/components/ProgramSwitcher';
import ProgramSelectorModal from '@/components/ProgramSelectorModal';
import { Menu, X, ChevronDown, Sun, Moon, BookOpen, Download, Zap, FileText, Bot, Swords, Trophy, ClipboardList, Rocket, LayoutDashboard, Stethoscope, GraduationCap, Languages, Cpu, Sparkles, TrendingUp } from 'lucide-react';



type NavChild = { label: string; href: string; icon: React.ElementType; key: string; desc: string; badge?: string };
type NavLink = { label: string; href: string; key: string; badge?: string; children?: NavChild[] };

const navLinks: NavLink[] = [
  {
    label: 'Courses & Portals',
    href: '/courses',
    key: 'nav-sectors',
    badge: '5 PATHS',
    children: [
      { label: 'SEE Class 10 Board', href: '/courses?sector=see', icon: GraduationCap, key: 'nav-see', desc: 'Grade 10 NEB Model Sets & AI Grading' },
      { label: 'CEE Medical Entrance', href: '/courses?sector=cee', icon: Stethoscope, key: 'nav-cee', desc: 'MBBS, BDS, 15,000+ MCQs & Arena' },
      { label: 'IELTS & English Mastery', href: '/english', icon: Languages, key: 'nav-eng', desc: 'AI Speaking Cue Cards & Writing Task 1/2' },
      { label: 'Digital Marketing Skills', href: '/courses?sector=digital', icon: TrendingUp, key: 'nav-dm', desc: 'Meta Ads, TikTok Viral Hooks & SEO' },
      { label: 'Artificial Intelligence (AI)', href: '/digital', icon: Cpu, key: 'nav-ai-port', desc: 'Prompt Studio, Python & Automations' },
    ],
  },
  {
    label: 'Study',
    href: '/subjects',
    key: 'nav-learn',
    children: [
      { label: 'Notes & Subjects', href: '/subjects', icon: BookOpen, key: 'nav-notes', desc: 'Chapter-wise notes' },
      { label: 'Study Plan', href: '/study-plan', icon: ClipboardList, key: 'nav-plan', desc: 'Daily schedule' },
      { label: 'Samyak Guru App', href: '/app-feature', icon: Download, key: 'nav-app', desc: 'Live & Video App' },
    ],
  },
  {
    label: 'Practice',
    href: '/practice',
    key: 'nav-practice',
    children: [
      { label: 'Practice MCQs', href: '/practice', icon: Zap, key: 'nav-mcq', desc: 'Quick question sets' },
      { label: 'SEE Subjective Answers', href: '/practice/subjective', icon: Sparkles, key: 'nav-subj', desc: 'AI Handwritten Grading', badge: 'NEW' },
      { label: 'Mock Tests', href: '/mock-tests', icon: FileText, key: 'nav-mock', desc: 'Full exam simulation' },
      { label: 'AI Tutor', href: '/ai-tutor', icon: Bot, key: 'nav-ai', desc: 'Ask any question' },
    ],
  },
  {
    label: 'Compete',
    href: '/battle-arena',
    key: 'nav-compete',
    children: [
      { label: 'Battle Arena', href: '/battle-arena', icon: Swords, key: 'nav-battle', desc: '2-player quiz duels', badge: 'LIVE' },
      { label: 'Leaderboard', href: '/leaderboard', icon: Trophy, key: 'nav-leaderboard', desc: 'Rankings & rank predictor' },
    ],
  },
  { label: 'All Courses', href: '/courses', key: 'nav-courses' },
  { label: 'Batches', href: '/batches', key: 'nav-batches' },
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
                  className="hidden lg:inline-flex btn-secondary text-sm py-2 px-4"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up-login-screen"
                  className="hidden sm:inline-flex btn-primary text-sm py-2 px-4 shadow-sm"
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
    </nav>
  );
}
