'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import {
  Menu, X, Sun, Moon, LayoutDashboard, ArrowRight,
  ChevronDown, BookOpen, Zap, Award, Sparkles, CheckCircle2,
  GraduationCap, HelpCircle
} from 'lucide-react';

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
  const navRef = useRef<HTMLElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

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
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
          ? 'bg-card/95 backdrop-blur-2xl border-b border-border/80 shadow-sm supports-[backdrop-filter]:bg-card/90'
          : 'bg-transparent'
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

            <Link
              href="/practice"
              className="px-3.5 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              Practice &amp; Q-Bank
            </Link>

            <Link
              href="/mock-tests"
              className="px-3.5 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              Mock Tests
            </Link>

            <Link
              href="/pricing"
              className="px-3.5 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              Plans &amp; Pricing
            </Link>

            <Link
              href="/free-resources"
              className="px-3.5 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              Free Resources
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

          <div className="space-y-1 pt-2 border-t border-border/60">
            <p className="px-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Study &amp; Tests</p>
            <Link
              href="/practice"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2.5 rounded-xl text-sm font-semibold text-foreground hover:bg-muted block"
            >
              Practice &amp; Question Bank
            </Link>
            <Link
              href="/mock-tests"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2.5 rounded-xl text-sm font-semibold text-foreground hover:bg-muted block"
            >
              Full-Length Mock Exams
            </Link>
            <Link
              href="/pricing"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2.5 rounded-xl text-sm font-semibold text-foreground hover:bg-muted block"
            >
              Subscription Plans
            </Link>
            <Link
              href="/free-resources"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2.5 rounded-xl text-sm font-semibold text-foreground hover:bg-muted block"
            >
              Free Diagnostic Resources
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2.5 rounded-xl text-sm font-semibold text-foreground hover:bg-muted block"
            >
              Help &amp; Support
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
    </nav>
  );
}
