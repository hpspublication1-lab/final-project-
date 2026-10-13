'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import PublicNav from '@/components/PublicNav';
import HeroSection from './HeroSection';
import FlagshipPillarsSection from './FlagshipPillarsSection';
import FlagshipDemoSection from './FlagshipDemoSection';
import AnnouncementBar from './AnnouncementBar';
import PageTransitionWrapper from '@/components/PageTransitionWrapper';
import CourseSelectionGate from '@/components/courses/CourseSelectionGate';

const FeaturedInstructors = dynamic(() => import('./FeaturedInstructors'), {
  loading: () => <div className="h-64 bg-card border-t border-border/60 animate-pulse" />,
  ssr: true,
});

const PricingSection = dynamic(() => import('./PricingSection'), {
  loading: () => <div className="h-64 bg-card border-t border-border/60 animate-pulse" />,
  ssr: true,
});

const TestimonialsSection = dynamic(() => import('./TestimonialsSection'), {
  loading: () => <div className="h-64 bg-card border-t border-border/60 animate-pulse" />,
  ssr: true,
});

const AuxiliaryProgramsBanner = dynamic(() => import('./AuxiliaryProgramsBanner'), {
  loading: () => <div className="h-32 bg-card border-t border-border/60 animate-pulse" />,
  ssr: true,
});

const FAQSection = dynamic(() => import('./FAQSection'), {
  loading: () => <div className="h-64 bg-card border-t border-border/60 animate-pulse" />,
  ssr: true,
});

const HomepageFooter = dynamic(() => import('./HomepageFooter'), {
  loading: () => <div className="h-64 bg-card border-t border-border/60" />,
  ssr: true,
});

export default function HomepageClient() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      const stored = localStorage.getItem('samyak-theme');
      if (stored) return stored === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch { return false; }
  });
  const [announceOpen, setAnnounceOpen] = useState(true);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('samyak-theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('samyak-theme', 'light');
    }
  }, [isDark]);

  return (
    <PageTransitionWrapper>
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        {/* Top Announcement */}
        <AnnouncementBar onDismiss={() => setAnnounceOpen(false)} />

        {/* Global Navigation */}
        <PublicNav isDark={isDark} onToggleDark={() => setIsDark(!isDark)} announcementHeight={announceOpen ? 40 : 0} />

        {/* Main Flagship Hero & Course Selection Gate */}
        <main id="main-content" className="flex-1">
          <HeroSection />
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-10">
            <CourseSelectionGate autoOpenOnFirstVisit={true} />
          </div>
          <FlagshipPillarsSection />
          <FlagshipDemoSection />
          <FeaturedInstructors />
          <PricingSection />
          <TestimonialsSection />
          <AuxiliaryProgramsBanner />
          <FAQSection />
        </main>

        {/* Footer */}
        <HomepageFooter />
      </div>
    </PageTransitionWrapper>
  );
}
