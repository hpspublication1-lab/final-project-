'use client';

import React from 'react';
import Link from 'next/link';
import CoursePortalHeader from './CoursePortalHeader';
import { COURSE_PORTAL_CONFIGS } from '@/lib/config/courseFeatures';
import {
  TrendingUp,
  Sparkles,
  ArrowRight,
  FolderKanban,
  Download,
  CheckSquare,
  Upload,
  Zap,
  Target,
  FileText,
  CheckCircle2,
} from 'lucide-react';

interface PortalViewProps {
  displayName: string;
  isEnrolled?: boolean;
  isPro?: boolean;
  onOpenCourseSelector?: () => void;
}

export default function DigitalMarketingPortalView({
  displayName,
  isEnrolled = true,
  isPro = false,
  onOpenCourseSelector,
}: PortalViewProps) {
  const config = COURSE_PORTAL_CONFIGS.digital_marketing;

  const practicalProjects = [
    {
      id: 'proj-1',
      title: 'Meta Ads Manager: Launch A/B Test Campaign for E-commerce',
      desc: 'Set up pixel events, upload 3 creative angles, and write high-ROAS primary copy.',
      deadline: 'Assignment 1',
      status: 'Submitted · Grade: 98/100',
      badge: 'HIGH ROAS',
    },
    {
      id: 'proj-2',
      title: 'Complete On-Page & Technical SEO Audit of a Live Website',
      desc: 'Identify crawl errors, optimize meta tags, and build an internal linking plan.',
      deadline: 'Assignment 2',
      status: 'In Progress',
      badge: 'SEO AUDIT',
    },
    {
      id: 'proj-3',
      title: 'Upwork & Fiverr High-Ticket Client Proposal Pitch Deck',
      desc: 'Draft a personalized client video proposal that lands a $1,000/mo retainer.',
      deadline: 'Assignment 3',
      status: 'Pending Submission',
      badge: 'CLIENT WIN',
    },
  ];

  const swipeFiles = [
    { id: 'sf-1', title: '100+ High-Converting Facebook & Instagram Ad Copy Templates', format: 'PDF + Notion', downloads: '8.4k' },
    { id: 'sf-2', title: 'TikTok & Reels 3-Second Viral Hook Formulas & Storyboard Sheet', format: 'Notion Playbook', downloads: '12.1k' },
    { id: 'sf-3', title: 'Top-Ranked Upwork Proposal Templates for Marketing Agencies', format: 'Word / Google Doc', downloads: '6.9k' },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header Identity */}
      <CoursePortalHeader
        displayName={displayName}
        isEnrolled={isEnrolled}
        isPro={isPro}
        onOpenCourseSelector={onOpenCourseSelector}
      />

      {/* 2. Career Progression Summary Card */}
      <div className="p-5 rounded-3xl card-luxury shadow-luxury flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/20 font-mono">
              Career Track Progress
            </span>
            <span className="text-xs text-muted-foreground font-semibold">Specialization: Performance Marketer</span>
          </div>
          <h2 className="text-base sm:text-lg font-black text-foreground">
            Practical Project Completion: <span className="text-rose-600 font-mono">65%</span>
          </h2>
          <p className="text-xs text-muted-foreground font-medium">
            Complete 3 live client projects to unlock the verified Samyak Digital Marketing Certificate.
          </p>
        </div>

        <Link
          href="/courses"
          className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-rose-600/20 transition-all shrink-0 active:scale-95"
        >
          <Upload size={14} />
          <span>Submit Project</span>
        </Link>
      </div>

      {/* 3. Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Modules & Projects (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Practical Modules Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                <Sparkles size={16} className="text-rose-500" /> Practical Marketing Modules ({config.defaultSubjects.length})
              </h3>
              <Link href="/courses" className="text-xs font-bold text-rose-600 hover:underline">
                All Modules →
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {config.defaultSubjects.map((mod) => (
                <div
                  key={mod.id}
                  className="p-4 rounded-2xl card-luxury shadow-xs hover:border-rose-500/50 hover:shadow-luxury transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xl">{mod.icon}</span>
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600">
                        {mod.weightage}
                      </span>
                    </div>
                    <h4 className="text-xs font-extrabold text-foreground">{mod.name}</h4>
                    <p className="text-[10px] text-muted-foreground">{mod.chaptersCount} Playbooks &amp; Video Lessons</p>
                  </div>

                  <Link
                    href="/courses"
                    className="text-[10px] font-bold text-rose-600 hover:text-rose-700 flex items-center justify-between pt-2 border-t border-border/50"
                  >
                    <span>Start Module</span>
                    <ArrowRight size={11} />
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Real-World Client Projects */}
          <div className="p-5 rounded-2xl bg-card border border-border space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                  <CheckSquare size={16} className="text-rose-500" /> Real-World Client Projects &amp; Assignments
                </h3>
                <p className="text-[11px] text-muted-foreground">Upload deliverables for mentor copy and campaign review.</p>
              </div>
              <span className="text-[10px] font-bold text-rose-600">2 of 3 Completed</span>
            </div>

            <div className="space-y-2.5">
              {practicalProjects.map((proj) => (
                <div
                  key={proj.id}
                  className="p-3.5 rounded-xl bg-muted/40 border border-border/60 hover:border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600">
                        {proj.badge}
                      </span>
                      <span className="text-xs font-bold text-foreground">{proj.title}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{proj.desc}</p>
                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{proj.status}</p>
                  </div>

                  <Link
                    href="/courses"
                    className="px-3 py-1.5 rounded-xl bg-card border border-border hover:bg-rose-600 hover:text-white font-bold text-xs flex items-center justify-center gap-1 transition-colors shrink-0"
                  >
                    <span>View Brief</span>
                    <ArrowRight size={11} />
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Ad Templates & Swipe Files Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-600 via-pink-600 to-rose-700 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold">
                <FolderKanban size={12} /> Swipe Files
              </div>
              <h3 className="text-base sm:text-lg font-black">100+ High-Converting Ad Copy Templates</h3>
              <p className="text-xs text-rose-100 leading-relaxed">
                Copy-paste headline formulas, landing page wireframes, and Upwork proposal templates proven to convert client leads into retainers.
              </p>
            </div>

            <Link
              href="/courses"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white text-rose-900 font-black text-xs hover:bg-rose-50 transition-all shadow-sm shrink-0 flex items-center justify-center gap-2"
            >
              <span>Access Vault</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Downloadable Toolkits */}
          <div className="p-5 rounded-2xl bg-card border border-border space-y-3">
            <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
              <Download size={16} className="text-rose-500" /> Downloadable Marketing Toolkits
            </h3>
            <div className="grid sm:grid-cols-3 gap-3">
              {swipeFiles.map((file) => (
                <div
                  key={file.id}
                  className="p-3.5 rounded-xl bg-muted/30 border border-border hover:border-rose-500/30 flex items-center justify-between gap-2 transition-all"
                >
                  <div>
                    <p className="text-xs font-bold text-foreground line-clamp-1">{file.title}</p>
                    <p className="text-[10px] text-muted-foreground">{file.format} · {file.downloads}</p>
                  </div>
                  <Link
                    href="/courses"
                    className="p-1.5 rounded-lg bg-card border border-border hover:bg-rose-500/10 hover:text-rose-600 text-muted-foreground transition-colors shrink-0"
                  >
                    <Download size={13} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Tasks & Career Badges (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Today's Action Plan */}
          <div className="p-5 rounded-2xl bg-card border border-border space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                <Zap size={15} className="text-rose-500" /> Today&apos;s Marketing Sprint
              </h3>
              <span className="text-[10px] font-bold text-emerald-600">2 of 3 Done</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  <span className="font-semibold text-foreground line-through text-muted-foreground">Setup Meta Pixel &amp; Events</span>
                </div>
                <span className="text-[10px] text-muted-foreground">Done</span>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  <span className="font-semibold text-foreground line-through text-muted-foreground">Competitor Ad Library Breakdown</span>
                </div>
                <span className="text-[10px] text-muted-foreground">Done</span>
              </div>

              <div className="p-2.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between hover:border-rose-500/30 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border border-border shrink-0" />
                  <span className="font-semibold text-foreground">Draft 3 Ad Angles &amp; Hooks</span>
                </div>
                <Link href="/courses" className="text-[10px] font-bold text-rose-600 hover:underline">
                  Start →
                </Link>
              </div>
            </div>
          </div>

          {/* Agency Certification Progress */}
          <div className="p-5 rounded-2xl bg-card border border-border space-y-3">
            <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
              <Target size={15} className="text-rose-500" /> Certification Requirements
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <span className="text-muted-foreground">Meta Ads Campaign Audit</span>
                <span className="font-bold text-emerald-600">Passed (98%)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <span className="text-muted-foreground">SEO Audit &amp; Keyword Map</span>
                <span className="font-bold text-amber-600">In Review</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <span className="text-muted-foreground">Client Proposal Pitch Deck</span>
                <span className="font-bold text-muted-foreground">Pending</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
