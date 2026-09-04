'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import ProgramSwitcher from '@/components/ProgramSwitcher';
import ProgramSelectorModal from '@/components/ProgramSelectorModal';
import { Menu, X, ChevronDown, Sun, Moon, BookOpen, Download, Zap, FileText, Bot, Swords, Trophy, ClipboardList, Rocket, LayoutDashboard, Stethoscope, GraduationCap, Languages, Cpu, Sparkles, TrendingUp } from 'lucide-react';
import AiDoubtSolverModal from '@/components/AiDoubtSolverModal';
import SmartNotificationsDrawer from '@/components/SmartNotificationsDrawer';
import { SUPPORT_CONFIG } from '@/lib/config/support';



type NavChild = { label: string; href: string; icon: React.ElementType; key: string; desc: string; badge?: string };
type NavLink = { label: string; href: string; key: string; badge?: string; children?: NavChild[] };

const primaryNavItems = [
  { label: 'Home', href: '/', key: 'nav-home' },
  { label: 'My Learning', href: '/student-dashboard', key: 'nav-learning' },
  { label: 'Practice', href: '/practice', key: 'nav-practice' },
  { label: 'Tests', href: '/mock-tests', key: 'nav-tests' },
  { label: 'AI Tutor', href: '/ai-tutor', key: 'nav-ai', badge: 'AI' },
];

const secondaryNavItems: NavChild[] = [
  { label: 'Explore Programs', href: '/courses', icon: BookOpen, key: 'more-courses', desc: 'SEE, CEE, IELTS & AI Courses' },
  { label: 'Live Batches', href: '/batches', icon: Rocket, key: 'more-batches', desc: 'Dedicated cohorts & schedules' },
  { label: 'Battle Arena', href: '/battle-arena', icon: Swords, key: 'more-arena', desc: 'Real-time 1v1 quiz duels', badge: 'LIVE' },
  { label: 'Leaderboard', href: '/leaderboard', icon: Trophy, key: 'more-leaderboard', desc: 'National rankings & score tracking' },
  { label: 'Doubts Forum', href: '/doubts', icon: Bot, key: 'more-doubts', desc: 'Ask teachers and peers' },
  { label: 'Study Blog', href: '/blog', icon: FileText, key: 'more-blog', desc: 'Notes, model papers & strategies' },
  { label: 'Contact Support', href: '/contact', icon: Sparkles, key: 'more-contact', desc: 'WhatsApp & phone helpline' },
];


interface PublicNavProps {
  isDark?: boolean;
  onToggleDark?: () => void;
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
        setAuthed(!!(me && me.id));
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
      className={`fixed left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || mobileOpen
          ? 'bg-card/80 backdrop-blur-2xl border-b border-border/80 shadow-luxury supports-[backdrop-filter]:bg-card/70'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/" className="flex items-center gap-2 group" aria-label="Samyak Tutor — home">
              <div className="transition-transform duration-200 group-hover:scale-105">
                <AppLogo size={36} showText={true} />
              </div>
            </Link>

            <div className="hidden xl:flex items-center ml-2">
              <ProgramSelectorModal isOpen={showCourseModal} onClose={() => setShowCourseModal(false)} />
              <ProgramSwitcher size="sm" onOpenModal={() => setShowCourseModal(true)} />
            </div>
          </div>

          {/* Desktop nav — 5-7 primary items max: Home | My Learning | Practice | Tests | AI Tutor | More */}
          <div className="hidden lg:flex items-center justify-center gap-1 text-sm font-semibold">
            {primaryNavItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className="px-3.5 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors flex items-center gap-1.5"
              >
                <span>{item.label}</span>
                {item.badge && (
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}

            {/* More dropdown */}
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'more' ? null : 'more')}
                className="px-3.5 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors flex items-center gap-1"
                aria-expanded={openDropdown === 'more'}
              >
                <span>More</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${openDropdown === 'more' ? 'rotate-180' : ''}`} />
              </button>

              {openDropdown === 'more' && (
                <div className="absolute top-full right-0 mt-2 w-72 p-2 bg-card border border-border rounded-2xl shadow-luxury z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {secondaryNavItems.map((child) => (
                    <Link
                      key={child.key}
                      href={child.href}
                      onClick={() => setOpenDropdown(null)}
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-muted/80 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                        <child.icon size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{child.label}</span>
                          {child.badge && (
                            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-error text-white leading-none">
                              {child.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">{child.desc}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right actions — clean, uncluttered */}
          <div className="flex items-center gap-3 shrink-0 justify-self-end">
            <button
              onClick={onToggleDark}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all"
              aria-label="Toggle dark mode"
            >
              {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
            </button>

            {authed ? (
              <Link
                href={DASHBOARD_HREF}
                className="inline-flex bg-primary hover:bg-primary/90 text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow-sm items-center gap-1.5 transition-all"
              >
                <LayoutDashboard size={14} />
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:inline-flex text-xs font-bold text-muted-foreground hover:text-foreground px-3 py-2 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/login?mode=signup"
                  className="inline-flex bg-primary hover:bg-primary/90 text-white text-xs font-extrabold py-2.5 px-5 rounded-xl shadow-sm items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-95"
                >
                  Start Learning
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
                { label: 'Home', href: '/', icon: Zap, color: 'text-primary bg-primary/10' },
                { label: 'Practice', href: '/practice', icon: Zap, color: 'text-primary bg-primary/10' },
                { label: 'Tests', href: '/mock-tests', icon: FileText, color: 'text-success bg-success-light' },
                { label: 'AI Tutor', href: '/ai-tutor', icon: Bot, color: 'text-chem bg-chem-light' },
                { label: 'Programs', href: '/courses', icon: BookOpen, color: 'text-physics bg-physics-light' },
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

            {/* Primary Nav Links */}
            <div className="flex flex-col gap-0.5">
              {primaryNavItems.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>

            {/* Secondary links */}
            <div className="border-t border-border pt-2 mt-2 flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-1">More Resources</span>
              {secondaryNavItems.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  <item.icon size={14} className="text-primary shrink-0" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

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
                  <Link href="/login" className="btn-secondary text-sm text-center justify-center" onClick={() => setMobileOpen(false)}>
                    Sign In
                  </Link>
                  <Link href="/login?mode=signup" className="btn-primary text-sm text-center justify-center" onClick={() => setMobileOpen(false)}>
                    Start Learning
                  </Link>
                </>
              )}
            </div>

            {/* Social Communities */}
            <div className="pt-2 flex items-center justify-center gap-3 border-t border-border/60">
              <a
                href={SUPPORT_CONFIG.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
              >
                Facebook
              </a>
              <span className="text-border">•</span>
              <a
                href={SUPPORT_CONFIG.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
              >
                Instagram
              </a>
              <span className="text-border">•</span>
              <a
                href={SUPPORT_CONFIG.social.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
              >
                YouTube
              </a>
              <span className="text-border">•</span>
              <a
                href={SUPPORT_CONFIG.social.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
              >
                TikTok
              </a>
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
