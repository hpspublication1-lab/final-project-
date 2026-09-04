'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import PublicNav from '@/components/PublicNav';
import HeroSection from './HeroSection';
import SectorsShowcase from './SectorsShowcase';
import AnnouncementBar from './AnnouncementBar';
import PageTransitionWrapper from '@/components/PageTransitionWrapper';

// Lightweight skeleton placeholder for below-the-fold sections
const SectionSkeleton = () => (
  <div className="py-16 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="h-48 rounded-3xl bg-muted/30 animate-pulse border border-border/40" />
  </div>
);

// Code-split below-the-fold components
const SamyakIntelligenceSection = dynamic(() => import('@/components/SamyakIntelligenceSection'), {
  loading: SectionSkeleton,
  ssr: true,
});
const StatsSection = dynamic(() => import('./StatsSection'), {
  loading: SectionSkeleton,
  ssr: true,
});
const SubjectsSection = dynamic(() => import('./SubjectsSection'), {
  loading: SectionSkeleton,
  ssr: true,
});
const FeaturedInstructors = dynamic(() => import('./FeaturedInstructors'), {
  loading: SectionSkeleton,
  ssr: true,
});
const MCQPreviewSection = dynamic(() => import('./MCQPreviewSection'), {
  loading: SectionSkeleton,
  ssr: true,
});
const BattleArenaSection = dynamic(() => import('./BattleArenaSection'), {
  loading: SectionSkeleton,
  ssr: true,
});
const PricingSection = dynamic(() => import('./PricingSection'), {
  loading: SectionSkeleton,
  ssr: true,
});
const TestimonialsSection = dynamic(() => import('./TestimonialsSection'), {
  loading: SectionSkeleton,
  ssr: true,
});
const LeadMagnetSection = dynamic(() => import('./LeadMagnetSection'), {
  loading: SectionSkeleton,
  ssr: true,
});
const FAQSection = dynamic(() => import('./FAQSection'), {
  loading: SectionSkeleton,
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
      <div className="min-h-screen bg-background text-foreground">
        <AnnouncementBar onDismiss={() => setAnnounceOpen(false)} />
        <PublicNav isDark={isDark} onToggleDark={() => setIsDark(!isDark)} announcementHeight={announceOpen ? 40 : 0} />
        <HeroSection />
        <SectorsShowcase />
        <SamyakIntelligenceSection />
        <StatsSection />
        <SubjectsSection />
        <FeaturedInstructors />
        <MCQPreviewSection />
        <BattleArenaSection />
        <LeadMagnetSection />
        <PricingSection />
        <TestimonialsSection />
        <FAQSection />
        <HomepageFooter />
      </div>
    </PageTransitionWrapper>
  );
}