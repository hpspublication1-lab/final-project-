'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PublicNav from '@/components/PublicNav';
import HomepageFooter from '@/app/components/HomepageFooter';
import {
  ShieldCheck, Clock, Award, CheckCircle2, TrendingUp, AlertCircle,
  Bell, Mail, MessageSquare, ArrowRight, UserCheck, Sparkles, PhoneCall
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ParentDashboardPage() {
  const [isDark, setIsDark] = useState(false);
  const [weeklyReportsEnabled, setWeeklyReportsEnabled] = useState(true);
  const [parentEmail, setParentEmail] = useState('parent@samyak.edu.np');
  const [parentPhone, setParentPhone] = useState('+977 9801234567');

  const handleSaveNotification = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Weekly Parent Automated Reports saved & enabled!');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <PublicNav isDark={isDark} onToggleDark={() => setIsDark(!isDark)} />

      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20 w-full space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-mono">
              PARENT MONITORING &amp; GUARDIAN PORTAL
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">
              CHILD PERFORMANCE DASHBOARD
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Real-time academic progress tracking for <span className="font-bold text-foreground">Suraj Sharma (Class 10 SEE)</span>.
            </p>
          </div>

          <div className="px-5 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center shrink-0">
            <span className="text-[9px] font-black uppercase text-emerald-600 block font-mono">WEEKLY GROWTH</span>
            <span className="text-2xl font-black text-emerald-600 flex items-center justify-center gap-1 font-mono">
              📈 ↑ 8%
            </span>
          </div>
        </div>

        {/* 4 Core Child Performance Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
          
          <div className="p-5 rounded-3xl bg-card border border-border space-y-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase font-sans">Study Time</span>
            <div className="text-2xl font-black text-foreground flex items-center gap-2">
              <Clock size={20} className="text-emerald-600" />
              14h 32m
            </div>
            <span className="text-[10px] text-emerald-600 font-sans font-semibold">Active Study This Week</span>
          </div>

          <div className="p-5 rounded-3xl bg-card border border-border space-y-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase font-sans">Tests Solved</span>
            <div className="text-2xl font-black text-foreground flex items-center gap-2">
              <CheckCircle2 size={20} className="text-blue-600" />
              12
            </div>
            <span className="text-[10px] text-muted-foreground font-sans font-semibold">Model Sets Completed</span>
          </div>

          <div className="p-5 rounded-3xl bg-card border border-border space-y-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase font-sans">Average Score</span>
            <div className="text-2xl font-black text-emerald-600 flex items-center gap-2">
              <Award size={20} className="text-emerald-600" />
              78%
            </div>
            <span className="text-[10px] text-emerald-600 font-sans font-semibold">Board Distinction</span>
          </div>

          <div className="p-5 rounded-3xl bg-card border border-border space-y-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase font-sans">Attendance</span>
            <div className="text-2xl font-black text-purple-600 flex items-center gap-2">
              <UserCheck size={20} className="text-purple-600" />
              91%
            </div>
            <span className="text-[10px] text-purple-600 font-sans font-semibold">Daily Active Learner</span>
          </div>

        </div>

        {/* Subject Breakdown: Strongest vs Weakest */}
        <div className="grid sm:grid-cols-2 gap-6">
          
          {/* Strongest Subject */}
          <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-emerald-600 font-mono">STRONGEST SUBJECT</span>
              <span className="text-xs font-bold text-emerald-600 font-mono">88% Accuracy</span>
            </div>
            <h3 className="text-xl font-black text-foreground">🟢 Compulsory Science</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Suraj excels in Physics laws, Light refraction diagrams, and Biology nervous system concepts.
            </p>
          </div>

          {/* Weakest Subject */}
          <div className="p-6 rounded-3xl bg-red-500/10 border border-red-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-red-600 font-mono">WEAKEST SUBJECT</span>
              <span className="text-xs font-bold text-red-600 font-mono">48% Accuracy</span>
            </div>
            <h3 className="text-xl font-black text-foreground">🔴 Compulsory Mathematics</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Needs targeted revision in Quadratic Equations and Opt Math Vector geometry proofs.
            </p>
          </div>

        </div>

        {/* AI Teacher Remark */}
        <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-md space-y-3 relative overflow-hidden">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-emerald-600" />
            <span className="text-xs font-black uppercase text-emerald-600 font-mono">SAMYAK AI TEACHER REMARK</span>
          </div>
          <blockquote className="text-base sm:text-lg font-bold text-foreground italic">
            &ldquo;Suraj is improving consistently. He completed 12 practice sets this week and raised his Science score by 8%. We recommend 30 minutes of daily Mathematics practice before the upcoming SEE board exam.&rdquo;
          </blockquote>
          <span className="text-xs text-muted-foreground font-semibold block">— Head of Samyak AI Faculty</span>
        </div>

        {/* Automated Weekly Reports Subscription Box */}
        <div className="p-6 sm:p-8 rounded-3xl bg-muted/30 border border-border space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Bell size={18} className="text-emerald-600" />
                <h3 className="text-lg font-black text-foreground uppercase tracking-tight">
                  AUTOMATED WEEKLY PARENT REPORTS
                </h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Receive weekly progress summaries via SMS &amp; Email every Sunday at 8:00 PM.
              </p>
            </div>

            <button
              onClick={() => setWeeklyReportsEnabled(!weeklyReportsEnabled)}
              className={`px-4 py-2 rounded-2xl text-xs font-black transition-all ${
                weeklyReportsEnabled
                  ? 'bg-emerald-600 text-white'
                  : 'bg-muted text-muted-foreground border border-border'
              }`}
            >
              {weeklyReportsEnabled ? '✓ AUTOMATED REPORTS ON' : 'REPORTS OFF'}
            </button>
          </div>

          <form onSubmit={handleSaveNotification} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase block mb-1.5 font-mono">Parent Email Address</label>
              <input
                type="email"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-card border border-border text-xs font-bold text-foreground focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase block mb-1.5 font-mono">Parent Mobile Phone (SMS / WhatsApp)</label>
              <input
                type="text"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-card border border-border text-xs font-bold text-foreground focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="sm:col-span-2 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <Mail size={16} />
              <span>SAVE AUTOMATED REPORT PREFERENCES</span>
            </button>
          </form>
        </div>

      </main>

      <HomepageFooter />
    </div>
  );
}
