'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import KPIBentoGrid from './KPIBentoGrid';
import SubjectMasteryRings from './SubjectMasteryRings';
import AccuracyTrendChart from './AccuracyTrendChart';
import WeakTopicsPanel from './WeakTopicsPanel';
import UpcomingSchedule from './UpcomingSchedule';
import RecentExamsTable from './RecentExamsTable';
import StudyPlanTasks from './StudyPlanTasks';
import LiveClassesCard from './LiveClassesCard';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Zap, FileText, Bot, Swords, BookOpen, Video, ArrowRight, ClipboardList } from 'lucide-react';

const quickActions = [
  {
    key: 'qa-practice',
    label: 'Practice MCQs',
    desc: 'Answer questions by subject',
    href: '/practice',
    icon: Zap,
    color: 'bg-primary/10 text-primary',
    border: 'border-primary/20',
  },
  {
    key: 'qa-mock',
    label: 'Take a Mock Test',
    desc: 'Full exam simulation',
    href: '/mock-tests',
    icon: FileText,
    color: 'bg-success-light text-success',
    border: 'border-success/20',
  },
  {
    key: 'qa-ai',
    label: 'Ask AI Tutor',
    desc: 'Get instant explanations',
    href: '/ai-tutor',
    icon: Bot,
    color: 'bg-chem-light text-chem',
    border: 'border-chem/20',
  },
  {
    key: 'qa-battle',
    label: 'Battle Arena',
    desc: 'Compete with students',
    href: '/battle-arena',
    icon: Swords,
    color: 'bg-error-light text-error',
    border: 'border-error/20',
  },
  {
    key: 'qa-subjects',
    label: 'Study Subjects',
    desc: 'Browse notes & chapters',
    href: '/subjects',
    icon: BookOpen,
    color: 'bg-bio-light text-bio',
    border: 'border-bio/20',
  },
  {
    key: 'qa-app',
    label: 'Samyak Guru App',
    desc: 'Live & Video Lectures',
    href: '/app-feature',
    icon: Video,
    color: 'bg-physics-light text-physics',
    border: 'border-physics/20',
  },
];

export default function DashboardPageClient() {
  const [isDark, setIsDark] = useState(false);
  const { user, profile, loading } = useAuth();
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
          <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const displayName = profile?.full_name?.split(' ')?.[0] || user?.email?.split('@')?.[0] || 'Student';
  const isPro = profile?.subscription_plan === 'pro' || profile?.subscription_plan === 'institution';

  return (
    <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-16 py-6 space-y-6">
        {/* Welcome header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Welcome back, {displayName} 👋
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {profile?.cee_year
                ? `CEE ${profile?.cee_year} · Keep pushing!`
                : 'Samyak CEE Mastery · Keep pushing!'}
              {profile?.study_streak ? (
                <span className="ml-2 font-semibold text-primary">🔥 {profile?.study_streak} day streak</span>
              ) : null}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 border text-sm font-semibold px-3 py-1.5 rounded-full ${
              isPro
                ? 'bg-success-light border-success/20 text-success' :'bg-muted border-border text-muted-foreground'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isPro ? 'bg-success' : 'bg-muted-foreground'}`} />
              {isPro ? 'Pro Plan Active' : 'Free Plan'}
            </div>
            <Link href="/practice" className="btn-primary text-sm py-2 px-4 gap-1.5">
              Start Practicing
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>

        {/* Quick Actions — most important for beginners */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-foreground">What do you want to do?</h2>
            <Link href="/study-plan" className="flex items-center gap-1 text-sm text-primary font-medium hover:underline">
              <ClipboardList size={14} />
              View Study Plan
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {quickActions?.map((action) => (
              <Link
                key={action?.key}
                href={action?.href}
                className={`flex flex-col items-center text-center gap-2.5 p-4 rounded-2xl border bg-card hover:shadow-md transition-all duration-150 hover:-translate-y-0.5 ${action?.border}`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${action?.color}`}>
                  <action.icon size={22} />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground leading-tight">{action?.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{action?.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Live Classes (Bunny.net) — Pro gated */}
        <LiveClassesCard />

        {/* KPI Bento Grid */}
        <KPIBentoGrid />

        {/* Main content grid */}
        <div className="grid lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-5">
          <div className="lg:col-span-2 xl:col-span-3 2xl:col-span-3">
            <AccuracyTrendChart />
          </div>
          <div className="lg:col-span-1 xl:col-span-1 2xl:col-span-1">
            <WeakTopicsPanel />
          </div>
        </div>

        {/* Subject mastery + schedule */}
        <div className="grid lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-5">
          <div className="lg:col-span-2 xl:col-span-2 2xl:col-span-2">
            <SubjectMasteryRings />
          </div>
          <div className="lg:col-span-1 xl:col-span-1 2xl:col-span-1">
            <UpcomingSchedule />
          </div>
          <div className="lg:col-span-3 xl:col-span-1 2xl:col-span-1">
            <StudyPlanTasks />
          </div>
        </div>

        {/* Recent exams */}
        <RecentExamsTable />
      </div>
    </DashboardLayout>
  );
}