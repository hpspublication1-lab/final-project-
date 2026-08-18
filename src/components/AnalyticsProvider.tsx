'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initMixpanel, trackPageView } from '@/lib/analytics/mixpanel';

const PAGE_NAMES: Record<string, string> = {
  '/': 'Home',
  '/sign-up-login-screen': 'Auth',
  '/student-dashboard': 'Student Dashboard',
  '/subjects': 'Subjects',
  '/practice': 'Practice MCQs',
  '/mock-tests': 'Mock Tests',
  '/battle-arena': 'Battle Arena',
  '/match-lobby': 'Match Lobby',
  '/post-match-summary': 'Post Match Summary',
  '/leaderboard': 'Leaderboard',
  '/ai-tutor': 'AI Tutor',
  '/mcq-generator': 'MCQ Generator',
  '/mistake-analyser': 'Mistake Analyser',
  '/study-plan': 'Study Plan',
  '/app-feature': 'Samyak Guru App Feature',
  '/account': 'Account',
  '/activate-plan': 'Activate Plan',
  '/admin': 'Admin Dashboard',
};

function getPageName(pathname: string): string {
  if (PAGE_NAMES[pathname]) return PAGE_NAMES[pathname];
  // Match prefix
  for (const [path, name] of Object.entries(PAGE_NAMES)) {
    if (path !== '/' && pathname.startsWith(path)) return name;
  }
  return pathname;
}

export default function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    initMixpanel();
  }, []);

  useEffect(() => {
    if (!pathname) return;
    const pageName = getPageName(pathname);
    trackPageView(pageName, { path: pathname });
  }, [pathname]);

  return <>{children}</>;
}
