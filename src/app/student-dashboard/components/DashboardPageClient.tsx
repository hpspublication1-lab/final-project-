'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useProgram, normalizeCourseId } from '@/contexts/ProgramContext';
import { Loader2 } from 'lucide-react';

import CeePortalView from '@/components/portals/CeePortalView';
import SeePortalView from '@/components/portals/SeePortalView';
import IeltsPortalView from '@/components/portals/IeltsPortalView';
import DigitalMarketingPortalView from '@/components/portals/DigitalMarketingPortalView';
import AiPortalView from '@/components/portals/AiPortalView';

export default function DashboardPageClient() {
  const [isDark, setIsDark] = useState(false);
  const { user, profile, loading } = useAuth();
  const { program } = useProgram();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router?.replace('/sign-up-login-screen');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (isDark) {
      document.documentElement?.classList?.add('dark');
    } else {
      document.documentElement?.classList?.remove('dark');
    }
  }, [isDark]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your learning portal...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const displayName = profile?.full_name?.split(' ')?.[0] || user?.email?.split('@')?.[0] || 'Student';
  const isPro = profile?.subscription_plan === 'pro' || profile?.subscription_plan === 'institution';

  const canonicalId = normalizeCourseId(program);

  const renderActivePortal = () => {
    switch (canonicalId) {
      case 'see_class_10':
        return <SeePortalView displayName={displayName} isPro={isPro} profile={profile} />;
      case 'ielts':
        return <IeltsPortalView displayName={displayName} isPro={isPro} />;
      case 'digital_marketing':
        return <DigitalMarketingPortalView displayName={displayName} isPro={isPro} />;
      case 'artificial_intelligence':
        return <AiPortalView displayName={displayName} isPro={isPro} />;
      case 'cee_medical':
      default:
        return <CeePortalView displayName={displayName} isPro={isPro} profile={profile} />;
    }
  };

  return (
    <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-16 py-6">
        {renderActivePortal()}
      </div>
    </DashboardLayout>
  );
}