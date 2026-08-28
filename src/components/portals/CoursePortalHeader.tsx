'use client';

import React from 'react';
import Link from 'next/link';
import { useProgram } from '@/contexts/ProgramContext';
import { COURSE_PORTAL_CONFIGS } from '@/lib/config/courseFeatures';
import { GraduationCap, Stethoscope, Languages, TrendingUp, Cpu, Layers, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

interface CoursePortalHeaderProps {
  displayName: string;
  isEnrolled: boolean;
  isPro: boolean;
  onOpenCourseSelector?: () => void;
}

export default function CoursePortalHeader({
  displayName,
  isEnrolled,
  isPro,
  onOpenCourseSelector,
}: CoursePortalHeaderProps) {
  const { program } = useProgram();
  const config = COURSE_PORTAL_CONFIGS[program] || COURSE_PORTAL_CONFIGS.cee_medical;

  const getCourseIcon = () => {
    switch (program) {
      case 'see_class_10': return <GraduationCap size={20} className="text-emerald-400" />;
      case 'cee_medical': return <Stethoscope size={20} className="text-indigo-400" />;
      case 'ielts': return <Languages size={20} className="text-amber-400" />;
      case 'digital_marketing': return <TrendingUp size={20} className="text-rose-400" />;
      case 'artificial_intelligence': return <Cpu size={20} className="text-purple-400" />;
    }
  };

  const getBadgeColor = () => {
    switch (program) {
      case 'see_class_10': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'cee_medical': return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      case 'ielts': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'digital_marketing': return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'artificial_intelligence': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${config.accentGradient} text-white p-6 sm:p-8 shadow-xl border border-white/10`}>
      {/* Background ambient pattern */}
      <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 right-0 p-8 opacity-10 font-black text-8xl select-none pointer-events-none">
        {program === 'see_class_10' && 'SEE'}
        {program === 'cee_medical' && 'CEE'}
        {program === 'ielts' && 'IELTS'}
        {program === 'digital_marketing' && 'MKT'}
        {program === 'artificial_intelligence' && 'AI'}
      </div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          {/* Brand & Course Identity */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-black tracking-widest text-white/80 uppercase bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/15 shadow-xs">
              {config.brandName}
            </span>
            <span className={`text-[11px] font-extrabold uppercase px-3 py-1 rounded-full border ${getBadgeColor()}`}>
              {config.courseTitle}
            </span>
            <span className="text-xs font-semibold text-white/70">
              Dashboard
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight flex items-center gap-2.5">
            {getCourseIcon()}
            <span>Welcome, {displayName || 'Student'}</span>
          </h1>

          <p className="text-xs sm:text-sm text-white/85 leading-relaxed">
            {config.portalSubtitle}
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-xl bg-white/15 backdrop-blur-md text-white border border-white/20">
              <ShieldCheck size={14} className="text-emerald-300" />
              {config.targetBadge}
            </span>
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-xl border ${
              isEnrolled
                ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40'
                : 'bg-amber-500/20 text-amber-200 border-amber-400/40'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isEnrolled ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              {isEnrolled ? 'Active Enrolled Access' : 'Course Preview Mode'}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end gap-3 shrink-0">
          <Link
            href="/courses"
            className="px-5 py-2.5 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-black text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 transition-all"
          >
            <span>My Courses &amp; Batches</span>
            <ArrowRight size={15} />
          </Link>

          {onOpenCourseSelector && (
            <button
              onClick={onOpenCourseSelector}
              className="px-4 py-2 rounded-xl bg-black/30 hover:bg-black/40 text-white font-bold text-xs border border-white/20 backdrop-blur flex items-center justify-center gap-1.5 transition-colors"
            >
              <Layers size={14} />
              <span>Switch Learning Path</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
