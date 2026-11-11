'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import PublicNav from '@/components/PublicNav';
import HeroSection from './HeroSection';
import AcademicProgramsSection from './AcademicProgramsSection';
import FlagshipPillarsSection from './FlagshipPillarsSection';
import AnnouncementBar from './AnnouncementBar';
import PageTransitionWrapper from '@/components/PageTransitionWrapper';

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
        {/* Top Dismissible Announcement */}
        <AnnouncementBar onDismiss={() => setAnnounceOpen(false)} />

        {/* Global Navigation Header */}
        <PublicNav isDark={isDark} onToggleDark={() => setIsDark(!isDark)} announcementHeight={announceOpen ? 40 : 0} />

        {/* Cohesive, Streamlined Main Journey */}
        <main id="main-content" className="flex-1">
          {/* 1. Hero with live interactive product showcase (CBT, 1v1 Battle, AI Saarthi, Radar) */}
          <HeroSection />

          {/* 2. Structured Academic Programs (Medical, Board, Engineering, Civil Service, Skills) */}
          <AcademicProgramsSection />

          {/* 3. The 4-Pillar Learning Methodology (Live Classes, 15k+ MCQs, 200Q Mocks, AI Saarthi) */}
          <FlagshipPillarsSection />

          {/* 4. Faculty & Medical Examiners */}
          <FeaturedInstructors />

          {/* 5. Clear, Transparent Pricing & Batches */}
          <PricingSection />

          {/* 6. Student Reviews & Social Proof */}
          <TestimonialsSection />

          {/* 7. Frequently Asked Questions */}
          <FAQSection />
        </main>

        {/* Footer */}
        <HomepageFooter />
      </div>
    </PageTransitionWrapper>
  );
}
