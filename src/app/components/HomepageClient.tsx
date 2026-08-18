'use client';

import React, { useState, useEffect } from 'react';
import PublicNav from '@/components/PublicNav';
import HeroSection from './HeroSection';
import StatsSection from './StatsSection';
import SubjectsSection from './SubjectsSection';
import MCQPreviewSection from './MCQPreviewSection';
import BattleArenaSection from './BattleArenaSection';
import PricingSection from './PricingSection';
import TestimonialsSection from './TestimonialsSection';
import FAQSection from './FAQSection';
import HomepageFooter from './HomepageFooter';
import AnnouncementBar from './AnnouncementBar';
import PageTransitionWrapper from '@/components/PageTransitionWrapper';

import SectorsShowcase from './SectorsShowcase';
import FeaturedInstructors from './FeaturedInstructors';

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
        <StatsSection />
        <SubjectsSection />
        <FeaturedInstructors />
        <MCQPreviewSection />
        <BattleArenaSection />
        <PricingSection />
        <TestimonialsSection />
        <FAQSection />
        <HomepageFooter />
      </div>
    </PageTransitionWrapper>
  );
}