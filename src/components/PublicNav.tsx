'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import {
  Menu, X, Sun, Moon, LayoutDashboard, ArrowRight,
  ChevronDown, BookOpen, Zap, Award, Sparkles, CheckCircle2,
  GraduationCap, HelpCircle, KeyRound, Swords, Trophy, Brain, FileText
} from 'lucide-react';
import RedeemVoucherModal from '@/components/billing/RedeemVoucherModal';

interface PublicNavProps {
  isDark?: boolean;
  onToggleDark?: () => void;
  announcementHeight?: number;
}

export default function PublicNav({ isDark, onToggleDark, announcementHeight = 0 }: PublicNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [programsOpen, setProgramsOpen] = useState(false);
  const [practiceOpen, setPracticeOpen] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const practiceDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/profile/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((me) => {
        if (!active) return;
        setAuthed(!!(me && me.id));
      })
      .catch(() => {
        if (active) setAuthed(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const scrolled = scrollY > 16;
  const navTop = Math.max(announcementHeight - scrollY, 0);

  useEffect(() => {
    const handler = () => setScrollY(window.scrollY);
    handler();
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProgramsOpen(false);
      }
      if (practiceDropdownRef.current && !practiceDropdownRef.current.contains(e.target as Node)) {
        setPracticeOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const practiceItems = [
    {
      title: '1v1 Battle Arena',
      desc: 'Live multiplayer duels with daily Rs. 1,000 cash prizes',
      href: '/battle-arena',
      icon: '⚔️',
      badge: 'Rs. 1,000 Daily',
    },
    {
      title: 'Full-Length Mock Exams',
      desc: '200Q Timed CBT with -0.25 negative marking & instant percentile',
      href: '/mock-tests',
      icon: '📝',
      badge: 'CBT Mocks',
    },
    {
      title: '15,000+ Question Bank',
      desc: 'Chapter-wise MCQs, past papers & step-by-step solutions',
      href: '/practice',
      icon: '⚡',
      badge: 'MCQ Bank',
    },
    {
      title: 'CEE Rank & Seat Predictor',
      desc: 'Calculate MEC merit position & government college admission odds',
      href: '/rank-predictor',
      icon: '🎯',
      badge: 'AI Powered',
    },
    {
      title: 'Mistake Analyser (Galti Sudhar)',
      desc: 'Track and master every wrong answer with root-cause tags',
      href: '/mistake-analyser',
      icon: '🔍',
      badge: 'Revision',
    },
    {
      title: 'SM-2 Spaced Flashcards',
      desc: 'Cognitive retention intervals for high-yield formulas & definitions',
      href: '/flashcards',
      icon: '🧠',
      badge: 'Spaced',
    },
  ];

  const programs = [
    {
      title: 'CEE Medical Entrance',
      desc: 'MBBS / BDS / B.Sc Nursing · MEC Syllabus',
      href: '/cee-medical-entrance',
      badge: 'Flagship',
      icon: '🩺',
    },
    {
      title: 'SEE Class 10 Board',
      desc: 'GPA 4.0 Preparation · CDC Solved Papers',
      href: '/see',
      badge: 'Class 10',
      icon: '🎓',
    },
    {
      title: 'NEB Class 11 & 12',
      desc: 'Science & Entrance Foundation Batches',
      href: '/courses',
      badge: 'Grade 11-12',
      icon: '📘',
    },
    {
      title: 'IOE / BE Engineering',
      desc: 'TU Pulchowk, KU & PU 140M CBT Mocks',
      href: '/courses',
      badge: 'Engineering',
      icon: '⚙️',
    },
    {
      title: 'Lok Sewa Aayog',
      desc: 'Kharidar / Subba / Officer GK & IQ',
      href: '/courses',
      badge: 'Civil Service',
      icon: '🏛️',
    },
    {
      title: 'IELTS & Academic English',
      desc: 'Speaking AI Simulator & Band 8.0 Drills',
      href: '/english',
      badge: 'Language',
      icon: '🌐',
    },
  ];

  return (
    <nav
      ref={navRef}
      style={{ top: navTop }}
      className={`fixed left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || mobileOpen
          ? 'bg-card/95 backdrop-blur-2xl border-b border-border shadow-sm'
          : 'bg-background/80 backdrop-blur-xl border-b border-border/50'
      }`}
    >
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group" aria-label="SamyakCEE — Home">
            <div className="transition-transform duration-200 group-hover:scale-105">
              <AppLogo size={38} showText={true} />
            </div>
          </Link>

          {/* Desktop Streamlined Navigation */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-2 text-xs xl:text-sm font-semibold">
            
            {/* Programs Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setProgramsOpen(!programsOpen)}
                onMouseEnter={() => setProgramsOpen(true)}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                  programsOpen
                    ? 'text-primary bg-primary/10 font-bold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
                aria-expanded={programsOpen}
              >
                <span>Programs</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${programsOpen ? 'rotate-180 text-primary' : ''}`} />
              </button>

              {programsOpen && (
                <div
                  onMouseLeave={() => setProgramsOpen(false)}
                  className="absolute top-full left-0 mt-1 w-[460px] bg-card border border-border/80 rounded-2xl shadow-xl p-3 grid grid-cols-2 gap-2 animate-scale-in"
                >
                  <div className="col-span-2 px-3 py-1.5 border-b border-border/60 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Select Learning Stream</span>
                    <Link
                      href="/gate"
                      onClick={() => setProgramsOpen(false)}
                      className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      View All Tracks <ArrowRight size={10} />
                    </Link>
                  </div>
                  {programs.map((p) => (
                    <Link
                      key={p.title}
                      href={p.href}
                      onClick={() => setProgramsOpen(false)}
                      className="p-2.5 rounded-xl hover:bg-muted/70 transition-colors flex items-start gap-2.5 group"
                    >
                      <span className="text-xl shrink-0 mt-0.5">{p.icon}</span>
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">
                            {p.title}
                          </p>
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-1 leading-snug">
                          {p.desc}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Practice & Tests Dropdown */}
            <div className="relative" ref={practiceDropdownRef}>
              <button
                type="button"
                onClick={() => setPracticeOpen(!practiceOpen)}
                onMouseEnter={() => setPracticeOpen(true)}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                  practiceOpen
                    ? 'text-primary bg-primary/10 font-bold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
                aria-expanded={practiceOpen}
              >
                <span>Practice &amp; Arena</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${practiceOpen ? 'rotate-180 text-primary' : ''}`} />
              </button>

              {practiceOpen && (
                <div
                  onMouseLeave={() => setPracticeOpen(false)}
                  className="absolute top-full left-0 mt-1 w-[440px] bg-card border border-border/80 rounded-2xl shadow-xl p-3 grid grid-cols-1 gap-1.5 animate-scale-in"
                >
                  <div className="px-3 py-1.5 border-b border-border/60 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Evaluation &amp; Practice Tools</span>
                    <Link
                      href="/mock-tests"
                      onClick={() => setPracticeOpen(false)}
                      className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      All Mock Exams <ArrowRight size={10} />
                    </Link>
                  </div>
                  {practiceItems.map((item) => (
                    <Link
                      key={item.title}
                      href={item.href}
                      onClick={() => setPracticeOpen(false)}
                      className="p-2.5 rounded-xl hover:bg-muted/70 transition-colors flex items-start gap-2.5 group"
                    >
                      <span className="text-xl shrink-0 mt-0.5">{item.icon}</span>
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">
                            {item.title}
                          </p>
                          <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-primary/10 text-primary shrink-0">
                            {item.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-1 leading-snug">
                          {item.desc}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Academic Vault & Notes */}
            <Link
              href="/free-resources"
              className="px-3.5 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors flex items-center gap-1.5"
            >
              <FileText size={14} className="text-primary" />
              <span>Academic Vault</span>
            </Link>

            <Link
              href="/pricing"
              className="px-3.5 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              Plans &amp; Pricing
            </Link>

            <Link
              href="/contact"
              className="px-3.5 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              Support
            </Link>
          </div>

          {/* Right Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={onToggleDark}
              className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all"
              aria-label="Toggle dark mode"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
            </button>
            <button
              onClick={() => setShowRedeemModal(true)}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors flex items-center gap-1.5"
              title="Redeem offline book activation key"
            >
              <KeyRound size={14} className="text-primary" />
              <span>Redeem Voucher</span>
            </button>

            {authed ? (
              <Link
                href="/student-dashboard"
                className="px-5 py-2.5 rounded-full bg-primary hover:bg-primary-dark text-primary-foreground text-xs font-bold flex items-center gap-2 shadow-xs transition-all hover:shadow-md"
              >
                <LayoutDashboard size={14} />
                <span>My Dashboard</span>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/courses"
                  className="px-5 py-2.5 rounded-full bg-primary hover:bg-primary-dark text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all hover:shadow-md"
                >
                  <span>Start Free</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={onToggleDark}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground"
              aria-label="Toggle dark mode"
            >
              {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
            </button>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2.5 rounded-xl bg-muted/60 border border-border text-foreground hover:bg-muted transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-card/98 backdrop-blur-2xl border-b border-border/80 px-5 py-6 space-y-5 animate-fade-in shadow-xl max-h-[85vh] overflow-y-auto">
          
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Learning Programs</p>
            <div className="grid grid-cols-1 gap-1">
              {programs.map((p) => (
                <Link
                  key={p.title}
                  href={p.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2.5 rounded-xl text-sm font-bold text-foreground hover:bg-muted flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <span>{p.icon}</span>
                    <span>{p.title}</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-primary/10 text-primary">
                    {p.badge}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* 2. Practice & Examination Tools */}
          <div className="space-y-1 pt-2 border-t border-border/60">
            <p className="px-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Practice &amp; Examination</p>
            {practiceItems.map((p) => (
              <Link
                key={p.title}
                href={p.href}
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-foreground hover:bg-muted flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <span>{p.icon}</span>
                  <span>{p.title}</span>
                </span>
                <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                  {p.badge}
                </span>
              </Link>
            ))}
          </div>

          {/* 3. Battle Arena & Daily Prize Pool */}
          <div className="space-y-1 pt-2 border-t border-border/60">
            <p className="px-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Battle Arena &amp; Daily Rewards</p>
            <Link
              href="/battle-arena"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2.5 rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <Swords size={15} />
                <span>1v1 Live Duels · Championship</span>
              </span>
              <span className="text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded bg-amber-500 text-white">
                Rs. 1,000 Daily
              </span>
            </Link>
          </div>

          {/* 4. Academic Vault & In-App Notes */}
          <div className="space-y-1 pt-2 border-t border-border/60">
            <p className="px-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Academic Vault &amp; Resources</p>
            <Link
              href="/free-resources"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2 rounded-xl text-xs font-bold text-foreground hover:bg-muted flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <FileText size={14} className="text-primary" />
                <span>Free Notes, Formulas &amp; Past Papers</span>
              </span>
              <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-primary/10 text-primary">
                Free Vault
              </span>
            </Link>
          </div>

          {/* 5. Plans, Voucher Redemption & Support */}
          <div className="space-y-1 pt-2 border-t border-border/60">
            <p className="px-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Plans &amp; Support</p>
            <button
              onClick={() => {
                setMobileOpen(false);
                setShowRedeemModal(true);
              }}
              className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-foreground hover:bg-muted flex items-center justify-between text-left"
            >
              <span className="flex items-center gap-2">
                <KeyRound size={14} className="text-primary" />
                <span>Redeem Offline Book Voucher</span>
              </span>
              <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                16-Digit
              </span>
            </button>
            <Link
              href="/pricing"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-foreground hover:bg-muted block"
            >
              Subscription Plans &amp; Batches
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-foreground hover:bg-muted block"
            >
              Help Desk &amp; WhatsApp Support
            </Link>
          </div>

          <div className="pt-3 border-t border-border/60 flex flex-col gap-2.5">
            {authed ? (
              <Link
                href="/student-dashboard"
                onClick={() => setMobileOpen(false)}
                className="w-full py-3 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center gap-2 text-center shadow-xs"
              >
                <LayoutDashboard size={16} />
                <span>Go to Student Dashboard</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="w-full py-3 rounded-full border border-border text-foreground text-sm font-bold text-center hover:bg-muted transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/courses"
                  onClick={() => setMobileOpen(false)}
                  className="w-full py-3 rounded-full bg-primary hover:bg-primary-dark text-white text-sm font-bold text-center flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <span>Start Free Practice</span>
                  <ArrowRight size={15} />
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      <RedeemVoucherModal
        isOpen={showRedeemModal}
        onClose={() => setShowRedeemModal(false)}
      />
    </nav>
  );
}
