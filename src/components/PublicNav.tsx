'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import { Menu, X, Sun, Moon, LayoutDashboard, ArrowRight } from 'lucide-react';

interface PublicNavProps {
  isDark?: boolean;
  onToggleDark?: () => void;
  announcementHeight?: number;
}

export default function PublicNav({ isDark, onToggleDark, announcementHeight = 0 }: PublicNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const navRef = useRef<HTMLElement | null>(null);

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

  // Primary navigation items requested:
  // Courses | SEE | CEE | Free Resources | Results | Sign In | Start Learning
  const navLinks = [
    { label: 'Courses', href: '/courses' },
    { label: 'SEE', href: '/see', badge: 'Class 10' },
    { label: 'CEE', href: '/cee-medical-entrance', badge: 'Medical' },
    { label: 'Free Resources', href: '/free-resources' },
    { label: 'Results', href: '/results' },
  ];

  return (
    <nav
      ref={navRef}
      style={{ top: navTop }}
      className={`fixed left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || mobileOpen
          ? 'bg-card/90 backdrop-blur-2xl border-b border-border/80 shadow-md supports-[backdrop-filter]:bg-card/80'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group" aria-label="Samyak Tutor — Home">
            <div className="transition-transform duration-200 group-hover:scale-105">
              <AppLogo size={36} showText={true} />
            </div>
          </Link>

          {/* Desktop Primary Navigation */}
          <div className="hidden lg:flex items-center gap-1.5 text-sm font-bold">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors flex items-center gap-1.5"
              >
                <span>{link.label}</span>
                {link.badge && (
                  <span className="text-[10px] font-mono font-black uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Right Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={onToggleDark}
              className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all"
              aria-label="Toggle dark mode"
            >
              {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
            </button>

            {authed ? (
              <Link
                href="/student-dashboard"
                className="btn-primary text-xs font-bold py-2.5 px-5 rounded-xl flex items-center gap-1.5 shadow-sm"
              >
                <LayoutDashboard size={14} />
                <span>Dashboard</span>
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
                  className="btn-primary text-xs font-bold py-2.5 px-5 rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  <span>Start Learning</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={onToggleDark}
              className="p-2 text-muted-foreground hover:text-foreground"
              aria-label="Toggle dark mode"
            >
              {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
            </button>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2.5 rounded-xl bg-muted/60 border border-border text-foreground"
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-card/95 backdrop-blur-2xl border-b border-border/80 px-6 py-6 space-y-4 animate-fade-in shadow-xl">
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 rounded-2xl text-base font-bold text-foreground hover:bg-muted/70 flex items-center justify-between"
              >
                <span>{link.label}</span>
                {link.badge && (
                  <span className="text-xs font-mono font-black uppercase px-2 py-0.5 rounded bg-primary/10 text-primary">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          <div className="pt-4 border-t border-border/60 flex flex-col gap-3">
            {authed ? (
              <Link
                href="/student-dashboard"
                onClick={() => setMobileOpen(false)}
                className="w-full btn-primary text-sm font-bold py-3 rounded-2xl flex items-center justify-center gap-2 text-center"
              >
                <LayoutDashboard size={16} />
                <span>Go to Student Dashboard</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="w-full py-3 rounded-2xl border border-border text-foreground text-sm font-bold text-center hover:bg-muted"
                >
                  Sign In
                </Link>
                <Link
                  href="/courses"
                  onClick={() => setMobileOpen(false)}
                  className="w-full btn-primary text-sm font-bold py-3 rounded-2xl text-center flex items-center justify-center gap-2"
                >
                  <span>Start Learning</span>
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
