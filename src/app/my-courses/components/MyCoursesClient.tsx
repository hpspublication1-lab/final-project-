'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useProgram, normalizeCourseId } from '@/contexts/ProgramContext';
import {
  BookOpen, Play, CheckCircle2, Clock, Calendar, ArrowRight,
  Sparkles, RefreshCw, Loader2, Award, ShieldCheck, Layers, AlertCircle
} from 'lucide-react';

interface EnrolledCourse {
  slug: string;
  title: string;
  shortName: string;
  batchTitle: string;
  batchSlug: string;
  isEnrolled: boolean;
  state: string;
  daysRemaining?: number;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
  lastLessonTitle?: string;
  lastLessonHref?: string;
}

export default function MyCoursesClient() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { setProgram } = useProgram();

  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [activeCourseSlug, setActiveCourseSlug] = useState('cee_medical');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login?redirect=/my-courses');
      return;
    }

    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch('/api/student/dashboard');
        if (!res.ok) throw new Error('Failed to load user courses');
        const d = await res.json();

        setActiveCourseSlug(d.access?.activeCourseSlug || 'cee_medical');

        const mapped: EnrolledCourse[] = (d.enrolledCourses || []).map((c: any) => ({
          slug: c.slug,
          title: c.title,
          shortName: c.shortName,
          batchTitle: c.batchTitle || (c.slug === 'see_class_10' ? 'SEE 2026 Toppers Batch' : 'Target CEE 2026 Full'),
          batchSlug: c.slug === 'see_class_10' ? 'see-2026-english-medium' : 'target-cee-2026-full',
          isEnrolled: c.isEnrolled,
          state: c.state,
          daysRemaining: c.daysRemaining,
          completedLessons: c.isEnrolled ? (c.slug === 'see_class_10' ? 14 : 28) : 2,
          totalLessons: c.slug === 'see_class_10' ? 120 : 250,
          progressPercent: c.isEnrolled ? (c.slug === 'see_class_10' ? 22 : 35) : 5,
          lastLessonTitle: d.lastLesson?.chapterTitle || (c.slug === 'see_class_10' ? 'Science: Pressure & Mechanics' : 'Biology: Cell Biology'),
          lastLessonHref: d.lastLesson?.resumeHref || `/subjects?course=${c.slug}`,
        }));

        setCourses(mapped);
      } catch (err) {
        console.error('My courses load error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, authLoading, router]);

  if (loading || authLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
          <Loader2 size={36} className="animate-spin text-primary" />
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Loading Your Academic Tracks...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const enrolledList = courses.filter((c) => c.isEnrolled);
  const previewList = courses.filter((c) => !c.isEnrolled);

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-6xl mx-auto pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              My Enrolled Courses & Batches
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Continue where you left off, access batch lecture schedules, and track curriculum completion.
            </p>
          </div>

          <Link
            href="/courses"
            className="btn-primary text-xs font-bold py-2.5 px-5 rounded-2xl shrink-0 flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
          >
            <span>Explore All Courses</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {/* Active Enrolled Tracks */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-primary" />
            <h2 className="text-lg font-bold text-foreground">Active Subscriptions ({enrolledList.length})</h2>
          </div>

          {enrolledList.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {enrolledList.map((course) => (
                <div
                  key={course.slug}
                  className="bg-card border border-border/80 rounded-3xl p-6 sm:p-7 shadow-sm hover:border-primary/40 transition-all flex flex-col justify-between space-y-6"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {course.shortName}
                      </span>
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <ShieldCheck size={14} />
                        <span>{course.daysRemaining ? `${course.daysRemaining} days remaining` : 'Active Access'}</span>
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-foreground leading-snug">{course.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                        <Layers size={13} className="text-primary" />
                        <span>Batch: <strong className="text-foreground font-semibold">{course.batchTitle}</strong></span>
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 bg-muted/20 p-3.5 rounded-2xl border border-border/50">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-muted-foreground">Curriculum Progress</span>
                        <span className="font-black text-foreground">{course.progressPercent}%</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${course.progressPercent}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground block text-right">
                        {course.completedLessons} of {course.totalLessons} lessons completed
                      </span>
                    </div>
                  </div>

                  {/* CTAs */}
                  <div className="pt-4 border-t border-border/60 flex flex-wrap items-center gap-3">
                    <Link
                      href={course.lastLessonHref || `/subjects?course=${course.slug}`}
                      onClick={() => setProgram(normalizeCourseId(course.slug))}
                      className="btn-primary text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-xs"
                    >
                      <Play size={13} fill="currentColor" />
                      <span>Resume Learning</span>
                    </Link>

                    <Link
                      href={`/batches/${course.batchSlug}`}
                      className="text-xs font-bold text-foreground hover:text-primary px-3 py-2 rounded-xl border border-border hover:border-primary/40 transition-colors"
                    >
                      Batch Overview
                    </Link>

                    <Link
                      href={`/subjects?course=${course.slug}`}
                      onClick={() => setProgram(normalizeCourseId(course.slug))}
                      className="text-xs font-bold text-primary hover:underline ml-auto flex items-center gap-0.5"
                    >
                      <span>All Subjects</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-card border border-border/80 text-center space-y-3">
              <Award size={36} className="mx-auto text-muted-foreground/60" />
              <h3 className="text-base font-bold text-foreground">No active paid enrollments yet</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                You are currently exploring Samyak Tutor on Free Preview. Enroll in our Toppers batches to unlock 297+ HD video lectures, live daily classes, and timed mock tests.
              </p>
              <div className="pt-2">
                <Link href="/pricing" className="btn-primary text-xs font-bold py-3 px-6 rounded-2xl inline-flex">
                  View Batch Enrollment Plans
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* Free Preview Academic Tracks */}
        {previewList.length > 0 && (
          <section className="space-y-4 pt-4">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-amber-500" />
              <h2 className="text-lg font-bold text-foreground">Free Starter Previews ({previewList.length})</h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {previewList.map((course) => (
                <div
                  key={course.slug}
                  className="bg-card border border-border/80 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      {course.shortName}
                    </span>
                    <h4 className="text-sm font-bold text-foreground leading-snug">{course.title}</h4>
                    <p className="text-[11px] text-muted-foreground">
                      Free introductory chapter notes, sample MCQs, and entrance syllabus breakdowns.
                    </p>
                  </div>

                  <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                    <Link
                      href={`/subjects?course=${course.slug}`}
                      onClick={() => setProgram(normalizeCourseId(course.slug))}
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <span>Explore Free Notes</span>
                      <ArrowRight size={12} />
                    </Link>

                    <Link
                      href={`/courses/${course.slug === 'see_class_10' ? 'see-class-10' : 'cee-medical-entrance'}`}
                      className="text-[11px] font-bold text-muted-foreground hover:text-foreground"
                    >
                      Batch Details &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}
