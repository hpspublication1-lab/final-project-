'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, BookOpen, Layers, CheckCircle2, Archive,
  ExternalLink, Eye, Star, Plus, ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';

interface CourseItem {
  slug: string;
  title: string;
  headline: string;
  category: string;
  is_flagship: boolean;
  is_published: boolean;
  is_archived: boolean;
  total_subjects: number;
}

const INITIAL_COURSES: CourseItem[] = [
  {
    slug: 'cee_medical',
    title: 'CEE Medical Entrance Grand Mastery',
    headline: 'Complete MBBS/BDS/BSc Nursing Entrance Preparation with 200Q Mocks & Flashcards',
    category: 'medical_entrance',
    is_flagship: true,
    is_published: true,
    is_archived: false,
    total_subjects: 5,
  },
  {
    slug: 'see_class_10',
    title: 'SEE Class 10 Board Excellence',
    headline: 'High-Yield Board Revision, 75-Mark Model Exams with Step-by-Step AI & Teacher Rubrics',
    category: 'academic_board',
    is_flagship: true,
    is_published: true,
    is_archived: false,
    total_subjects: 4,
  },
  {
    slug: 'ielts',
    title: 'IELTS Academic & General Training',
    headline: 'Comprehensive Band 7.5+ Preparation with Real-Time Mock Assessments',
    category: 'language_exam',
    is_flagship: false,
    is_published: true,
    is_archived: false,
    total_subjects: 4,
  },
  {
    slug: 'digital_marketing',
    title: 'Digital Marketing & AI Masterclass',
    headline: 'Practical Skills for Social Media, Paid Ads, and AI-Driven Content Creation',
    category: 'career_skills',
    is_flagship: false,
    is_published: true,
    is_archived: false,
    total_subjects: 3,
  },
];

export default function AdminCoursesClient() {
  const [courses, setCourses] = useState<CourseItem[]>(INITIAL_COURSES);

  const handleToggleArchive = (slug: string) => {
    setCourses((prev) =>
      prev.map((c) => {
        if (c.slug === slug) {
          const updated = !c.is_archived;
          toast.success(`Course '${c.title}' has been ${updated ? 'archived' : 'restored'} (preserves student enrollment history).`);
          return { ...c, is_archived: updated, is_published: updated ? false : c.is_published };
        }
        return c;
      })
    );
  };

  const handleTogglePublish = (slug: string) => {
    setCourses((prev) =>
      prev.map((c) => {
        if (c.slug === slug) {
          const updated = !c.is_published;
          toast.success(`Course '${c.title}' publication status updated: ${updated ? 'Published' : 'Draft'}.`);
          return { ...c, is_published: updated };
        }
        return c;
      })
    );
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="w-9 h-9 flex items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-muted transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-extrabold text-foreground flex items-center gap-2">
                <BookOpen size={22} className="text-primary" /> Courses Catalog &amp; Programs
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage flagship programs, publication states, and curriculum linkages.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/admin/batches" className="btn-secondary py-2 px-3 text-xs font-bold gap-1.5 flex items-center">
              <Layers size={14} /> View Cohort Batches
            </Link>
          </div>
        </div>

        {/* Policy Alert */}
        <div className="bg-muted/40 border border-border rounded-2xl p-4 flex items-center gap-3 text-xs text-muted-foreground">
          <ShieldCheck size={18} className="text-primary shrink-0" />
          <p>
            <strong>Archive Over Delete Guarantee:</strong> Archiving a course unpublishes it from public discovery while preserving historical student attempts, payment logs, and certificates.
          </p>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map((c) => (
            <div
              key={c.slug}
              className={`bg-card border rounded-2xl p-5 space-y-4 shadow-sm transition-all ${
                c.is_archived ? 'opacity-60 border-dashed border-border' : 'border-border'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {c.is_flagship && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-primary/10 text-primary flex items-center gap-1">
                        <Star size={10} /> FLAGSHIP
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-muted text-muted-foreground">
                      {c.category.replace(/_/g, ' ')}
                    </span>
                    {c.is_archived && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-error-light text-error">
                        ARCHIVED
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-base text-foreground">{c.title}</h3>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleTogglePublish(c.slug)}
                    disabled={c.is_archived}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                      c.is_published
                        ? 'bg-success-light text-success hover:bg-success/20'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {c.is_published ? 'Published' : 'Draft'}
                  </button>
                  <button
                    onClick={() => handleToggleArchive(c.slug)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-error hover:bg-error-light transition-colors"
                    title={c.is_archived ? 'Restore course' : 'Archive course'}
                  >
                    <Archive size={15} />
                  </button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {c.headline}
              </p>

              <div className="flex items-center justify-between text-xs pt-3 border-t border-border">
                <span className="text-muted-foreground font-mono">Slug: {c.slug}</span>
                <Link
                  href="/admin/subjects"
                  className="font-bold text-primary hover:underline flex items-center gap-1"
                >
                  Manage Subjects ({c.total_subjects}) →
                </Link>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
