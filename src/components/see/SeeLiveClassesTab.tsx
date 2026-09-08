'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Video,
  Clock,
  Calendar,
  Users,
  CheckCircle2,
  Play,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Radio,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface LiveSession {
  id: string;
  title: string;
  subject: string;
  teacher: string;
  teacherRole: string;
  teacherAvatar: string;
  date: string;
  time: string;
  duration: string;
  status: 'LIVE_NOW' | 'UPCOMING' | 'COMPLETED';
  zoomLink: string;
  notesAvailable: boolean;
  registeredCount: number;
}

const SEE_LIVE_SCHEDULE: LiveSession[] = [
  {
    id: 'live-see-01',
    title: 'Force & Gravitation: Numericals & 2082 Board Prediction Special',
    subject: 'Compulsory Science & Tech',
    teacher: 'Prof. Ram K. Adhikari',
    teacherRole: 'Senior Science Faculty, 18+ Years Board Examiner',
    teacherAvatar: '/avatars/teacher-sci.jpg',
    date: 'Today',
    time: '6:00 PM - 7:30 PM NST',
    duration: '90 mins',
    status: 'LIVE_NOW',
    zoomLink: '/live-classes?session=see-sci-live',
    notesAvailable: true,
    registeredCount: 412,
  },
  {
    id: 'live-see-02',
    title: 'Circle Theorems & Riders: 4-Mark Geometric Proofs Workshop',
    subject: 'Compulsory Mathematics',
    teacher: 'Er. Pradeep Sharma',
    teacherRole: 'Lead Mathematics Specialist & Author',
    teacherAvatar: '/avatars/teacher-math.jpg',
    date: 'Tomorrow',
    time: '6:00 PM - 7:30 PM NST',
    duration: '90 mins',
    status: 'UPCOMING',
    zoomLink: '/live-classes?session=see-math-live',
    notesAvailable: true,
    registeredCount: 385,
  },
  {
    id: 'live-see-03',
    title: 'Conditional Trigonometric Identities: Step-by-Step Derivation Drill',
    subject: 'Optional Mathematics',
    teacher: 'Prof. K.B. Thapa',
    teacherRole: 'Senior Faculty & Trigonometry Master',
    teacherAvatar: '/avatars/teacher-opt.jpg',
    date: 'Wednesday',
    time: '7:45 PM - 9:00 PM NST',
    duration: '75 mins',
    status: 'UPCOMING',
    zoomLink: '/live-classes?session=see-opt-live',
    notesAvailable: true,
    registeredCount: 290,
  },
  {
    id: 'live-see-04',
    title: 'Formal Letter & CV Writing: CDC 100% Score Format Rubric',
    subject: 'English Language',
    teacher: 'Ms. Anita Shrestha',
    teacherRole: 'Head of English Pedagogy',
    teacherAvatar: '/avatars/teacher-eng.jpg',
    date: 'Thursday',
    time: '6:00 PM - 7:15 PM NST',
    duration: '75 mins',
    status: 'UPCOMING',
    zoomLink: '/live-classes?session=see-eng-live',
    notesAvailable: true,
    registeredCount: 310,
  }
];

export default function SeeLiveClassesTab() {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'LIVE_NOW' | 'UPCOMING' | 'COMPLETED'>('ALL');

  const filteredSessions = SEE_LIVE_SCHEDULE.filter((s) => {
    if (activeFilter === 'ALL') return true;
    return s.status === activeFilter;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner: Today's Interactive Live Broadcast */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-950 via-slate-900 to-slate-950 border border-red-500/30 p-6 sm:p-8 text-white shadow-2xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-black tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
              LIVE RIGHT NOW ON SAMYAK CLASSROOM
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Force &amp; Gravitation: Numericals &amp; 2082 Board Prediction Special
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Taught by <span className="text-white font-bold">Prof. Ram K. Adhikari</span> (Chief Science Moderation Panel). Live interactive audio/video, real-time doubt clearing, and instant step-by-step marking rubrics.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-400 pt-1">
              <span className="flex items-center gap-1.5 text-slate-200">
                <Clock size={14} className="text-red-400" /> 6:00 PM - 7:30 PM NST (Live Session Active)
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-slate-200">
                <Users size={14} className="text-emerald-400" /> 412 Students in Room
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 w-full sm:w-auto">
            <Link
              href="/live-classes"
              className="px-8 py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-sm flex items-center justify-center gap-2.5 shadow-xl transition-all shadow-red-950/50 hover:scale-105"
            >
              <Radio size={18} className="animate-pulse" />
              <span>JOIN LIVE CLASSROOM</span>
            </Link>
            <Link
              href="/batches"
              className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white border border-white/20 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Calendar size={15} />
              <span>View Full Weekly Timetable</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Timetable Header & Filter Chips */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h3 className="text-lg font-black text-foreground flex items-center gap-2">
            <Video size={20} className="text-red-500" />
            <span>SEE Live Class Timetable &amp; Schedule</span>
          </h3>
          <p className="text-xs text-muted-foreground">
            Daily 2-hour interactive evening batches strictly aligned with Nepal CDC Grade 10 curriculum.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-2xl border border-border text-xs font-bold">
          {(['ALL', 'LIVE_NOW', 'UPCOMING'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3.5 py-1.5 rounded-xl transition-all ${
                activeFilter === filter
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {filter === 'ALL' ? 'All Classes' : filter === 'LIVE_NOW' ? '🔴 Live Now' : 'Upcoming'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Scheduled Live Sessions */}
      <div className="grid md:grid-cols-2 gap-4">
        {filteredSessions.map((session) => (
          <div
            key={session.id}
            className={`p-6 rounded-3xl border transition-all ${
              session.status === 'LIVE_NOW'
                ? 'bg-gradient-to-br from-red-500/10 via-card to-card border-red-500/40 shadow-lg'
                : 'bg-card border-border hover:border-border/80 shadow-sm'
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-muted text-foreground border border-border">
                {session.subject}
              </span>
              {session.status === 'LIVE_NOW' ? (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500 text-white text-[10px] font-black uppercase tracking-wider animate-pulse">
                  <Radio size={12} /> LIVE NOW
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-wider">
                  {session.date}
                </span>
              )}
            </div>

            <h4 className="text-base font-black text-foreground mb-2 line-clamp-2">
              {session.title}
            </h4>

            <div className="flex items-center gap-3 py-3 border-y border-border/60 my-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-black text-sm text-primary">
                {session.teacher.charAt(0)}
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-black text-foreground flex items-center gap-1">
                  {session.teacher}
                  <ShieldCheck size={13} className="text-emerald-500" />
                </div>
                <div className="text-[11px] text-muted-foreground">{session.teacherRole}</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
              <div className="flex items-center gap-1.5">
                <Clock size={14} className="text-muted-foreground" />
                <span>{session.time}</span>
              </div>
              <div className="text-[11px] font-bold text-muted-foreground">
                {session.registeredCount} enrolled
              </div>
            </div>

            <div className="pt-4 mt-3 border-t border-border flex items-center justify-between gap-3">
              <Link
                href="/live-classes"
                className={`w-full py-2.5 rounded-xl font-black text-xs text-center flex items-center justify-center gap-2 transition-all ${
                  session.status === 'LIVE_NOW'
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-md'
                    : 'bg-muted hover:bg-muted/80 text-foreground'
                }`}
              >
                {session.status === 'LIVE_NOW' ? (
                  <>
                    <Radio size={14} /> Enter Classroom Now
                  </>
                ) : (
                  <>
                    <Calendar size={14} /> Set Reminder / Register
                  </>
                )}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Feature Guarantee Callout */}
      <div className="p-5 rounded-2xl bg-muted/40 border border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3 text-foreground">
          <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
          <span>
            <strong>Missed a live class?</strong> Every live session is automatically recorded in 1080p HD with chapter bookmarks and uploaded to your Recorded Lectures vault within 2 hours.
          </span>
        </div>
        <Link
          href="/lecture-videos"
          className="font-bold text-primary hover:underline whitespace-nowrap flex items-center gap-1"
        >
          <span>Open Replay Vault</span>
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}
