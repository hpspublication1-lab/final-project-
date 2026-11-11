'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Zap, ClipboardList, Swords } from 'lucide-react';
import { useProgram } from '@/contexts/ProgramContext';

interface TabItem {
  label: string;
  href: string;
  icon: React.ElementType;
  key: string;
  badge?: string;
}

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { isSee } = useProgram();

  const isSeeTrack = isSee;

  const TABS: TabItem[] = [
    { label: 'Home', href: '/student-dashboard', icon: Home, key: 'm-home' },
    {
      label: 'Learn',
      href: isSeeTrack ? '/see' : '/subjects',
      icon: BookOpen,
      key: 'm-learn',
    },
    { label: 'Practice', href: '/practice', icon: Zap, key: 'm-practice' },
    { label: 'Exams', href: '/mock-tests', icon: ClipboardList, key: 'm-exams' },
    { label: 'Compete', href: '/battle-arena', icon: Swords, key: 'm-compete', badge: '1v1' },
  ];

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border/80 shadow-lg pb-[max(0.25rem,env(safe-area-inset-bottom))]"
      aria-label="Mobile Bottom Navigation"
    >
      <div className="flex items-stretch justify-around px-2 py-1.5 max-w-lg mx-auto">
        {TABS.map((tab) => {
          const isActive =
            pathname === tab.href ||
            (tab.href !== '/student-dashboard' && pathname?.startsWith(tab.href.split('?')[0]));

          const IconComponent = tab.icon;

          return (
            <Link
              key={tab.key}
              href={tab.href}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all duration-150 min-h-[48px] select-none active:scale-95 ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-colors ${
                  isActive ? 'bg-primary/10 text-primary' : 'bg-transparent'
                }`}
              >
                <IconComponent size={20} />
              </div>
              <span
                className={`text-[10px] leading-tight mt-0.5 ${
                  isActive ? 'font-black text-primary' : 'font-semibold text-muted-foreground'
                }`}
              >
                {tab.label}
              </span>
              {tab.badge && !isActive && (
                <span className="absolute top-1 right-2 text-[8px] font-mono font-bold px-1 rounded-full bg-primary/15 text-primary border border-primary/20">
                  {tab.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
