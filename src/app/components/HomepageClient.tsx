'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import PublicNav from '@/components/PublicNav';
import HeroSection from './HeroSection';
import FlagshipPillarsSection from './FlagshipPillarsSection';
import FlagshipDemoSection from './FlagshipDemoSection';
import AnnouncementBar from './AnnouncementBar';
import PageTransitionWrapper from '@/components/PageTransitionWrapper';

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
  const [isDark, setIsDark] = useState(false);
  const [announceOpen, setAnnounceOpen] = useState(true);

  useEffect(() => {
    if (isDark) {
      document.documentElement?.classList?.add('dark');
    } else {
      document.documentElement?.classList?.remove('dark');
    }
  }, [isDark]);

  return (
    <PageTransitionWrapper>
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        {/* Top Announcement */}
        <AnnouncementBar onDismiss={() => setAnnounceOpen(false)} />

        {/* Global Navigation */}
        <PublicNav isDark={isDark} onToggleDark={() => setIsDark(!isDark)} announcementHeight={announceOpen ? 40 : 0} />

        {/* Main Flagship Hero (SEE Class 10 & CEE Medical) */}
        <main className="flex-1">
          <HeroSection />
          <FlagshipPillarsSection />
          <FlagshipDemoSection />
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
