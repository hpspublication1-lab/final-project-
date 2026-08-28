'use client';

import React from 'react';
import Link from 'next/link';
import CoursePortalHeader from './CoursePortalHeader';
import { COURSE_PORTAL_CONFIGS } from '@/lib/config/courseFeatures';
import {
  TrendingUp,
  Target,
  Award,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  FolderKanban,
  FileText,
  Smartphone,
  Search,
  Share2,
  Briefcase,
  Download,
  CheckSquare,
  BarChart3,
  Globe,
  Upload,
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
      {/* 1. Header Identity: SOUMYA GURU - DIGITAL MARKETING Dashboard */}
      <CoursePortalHeader
        displayName={displayName}
        isEnrolled={isEnrolled}
        isPro={isPro}
        onOpenCourseSelector={onOpenCourseSelector}
      />

      {/* 2. Freelance & Career Progression Summary Card */}
      <div className="p-6 rounded-3xl bg-card border border-rose-500/30 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/20">
              Career Track Progress
            </span>
            <span className="text-xs text-muted-foreground font-semibold">Specialization: Performance Marketer</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-foreground">
            Practical Project Completion: <span className="text-rose-600">65%</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Complete 3 live client projects to unlock the verified Samyak Guru Digital Marketer Certificate.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Link
            href="/courses?sector=digital_marketing"
            className="flex-1 md:flex-none px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-rose-600/20 transition-all"
          >
            <Upload size={15} />
            <span>Submit Assignment</span>
          </Link>
        </div>
      </div>

      {/* 3. Core Practical Marketing Modules */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm sm:text-base font-extrabold text-foreground flex items-center gap-2">
            <Sparkles size={16} className="text-rose-500" /> Practical Marketing Modules ({config.defaultSubjects.length})
          </h3>
          <Link href="/courses?sector=digital_marketing" className="text-xs font-bold text-rose-600 hover:underline">
            All Lessons →
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {config.defaultSubjects.map((mod) => (
            <div
              key={mod.id}
              className="p-5 rounded-3xl bg-card border border-border hover:border-rose-500/40 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{mod.icon}</span>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600">
                    {mod.weightage}
                  </span>
                </div>
                <h4 className="text-sm font-extrabold text-foreground">{mod.name}</h4>
                <p className="text-[11px] text-muted-foreground">{mod.chaptersCount} Practical Lessons &amp; Video Playbooks</p>
              </div>

              <div className="pt-3 border-t border-border/50 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Hands-on Drills</span>
                <Link
                  href="/courses?sector=digital_marketing"
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                >
                  <span>Start Module</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Live Client Assignments & Portfolio Projects */}
      <div className="p-6 rounded-3xl bg-card border border-border space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-foreground flex items-center gap-2">
              <CheckSquare size={16} className="text-rose-500" /> Real-World Client Projects &amp; Assignments
            </h3>
            <p className="text-xs text-muted-foreground">Upload deliverables for mentor code/copy review and portfolio certification.</p>
          </div>
          <span className="text-xs font-bold text-rose-600">2 of 3 Completed</span>
        </div>

        <div className="space-y-3">
          {practicalProjects.map((proj) => (
            <div
              key={proj.id}
              className="p-4 rounded-2xl bg-muted/40 border border-border/60 hover:border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
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
                href="/courses?sector=digital_marketing"
                className="px-4 py-2 rounded-xl bg-card border border-border hover:bg-rose-600 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shrink-0"
              >
                <span>View Brief</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* 5. 100+ Ad Swipe Files & Landing Page Templates */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-rose-600 via-pink-600 to-rose-700 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-bold">
            <FolderKanban size={13} /> Swipe Files &amp; Ad Templates
          </div>
          <h3 className="text-xl sm:text-2xl font-black">Download 100+ High-Converting Ad Templates</h3>
          <p className="text-xs sm:text-sm text-rose-100 leading-relaxed">
            Copy-paste headline formulas, landing page wireframes, and Upwork proposal templates proven to convert client leads into contracts.
          </p>
        </div>

        <Link
          href="/courses?sector=digital_marketing"
          className="px-6 py-3.5 rounded-2xl bg-white text-rose-900 font-black text-xs sm:text-sm hover:bg-rose-50 transition-all shadow-lg shrink-0 flex items-center gap-2"
        >
          <span>Access Resource Vault</span>
          <ArrowRight size={16} />
        </Link>
      </div>

      {/* 6. Downloadable Resource Toolkits */}
      <div className="p-6 rounded-3xl bg-card border border-border space-y-4">
        <h3 className="text-sm sm:text-base font-extrabold text-foreground flex items-center gap-2">
          <Download size={16} className="text-rose-500" /> Downloadable Marketing Toolkits
        </h3>
        <div className="grid sm:grid-cols-3 gap-3">
          {swipeFiles.map((file) => (
            <div
              key={file.id}
              className="p-4 rounded-2xl bg-muted/30 border border-border hover:border-rose-500/30 flex items-center justify-between gap-3 transition-all"
            >
              <div>
                <p className="text-xs font-bold text-foreground line-clamp-1">{file.title}</p>
                <p className="text-[10px] text-muted-foreground">{file.format} · {file.downloads} downloads</p>
              </div>
              <Link
                href="/courses?sector=digital_marketing"
                className="p-2 rounded-xl bg-card border border-border hover:bg-rose-500/10 hover:text-rose-600 text-muted-foreground transition-colors shrink-0"
              >
                <Download size={14} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
