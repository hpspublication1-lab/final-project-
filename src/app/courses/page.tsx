'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import PublicNav from '@/components/PublicNav';
import HomepageFooter from '@/app/components/HomepageFooter';
import { getAllCourses, CourseTrack } from '@/lib/courses/catalog';
import { SUPPORT_CONFIG } from '@/lib/config/support';
import { Search, ArrowRight, CheckCircle2, Clock, BookOpen, ShieldCheck, X, HelpCircle, Sparkles } from 'lucide-react';

function CourseCatalogueContent() {
  const searchParams = useSearchParams();
  const initialTrack = (searchParams.get('track') as CourseTrack | 'all') || 'all';
  const initialQuery = searchParams.get('q') || '';

  const [selectedTrack, setSelectedTrack] = useState<'all' | CourseTrack>(initialTrack);
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  useEffect(() => {
    const trackParam = searchParams.get('track') as CourseTrack | 'all';
    if (trackParam && (trackParam === 'all' || trackParam === 'see_class_10' || trackParam === 'cee_medical' || trackParam === 'skills_languages')) {
      setSelectedTrack(trackParam);
    }
    const qParam = searchParams.get('q');
    if (qParam !== null) {
      setSearchQuery(qParam);
    }
  }, [searchParams]);

  const allCourses = getAllCourses();

  const ceeCount = allCourses.filter((c) => c.track === 'cee_medical').length;
  const seeCount = allCourses.filter((c) => c.track === 'see_class_10').length;
  const skillsCount = allCourses.filter((c) => c.track === 'skills_languages').length;

  const filteredCourses = allCourses.filter((course) => {
    const matchesTrack = selectedTrack === 'all' || course.track === selectedTrack;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      course.title.toLowerCase().includes(q) ||
      course.description.toLowerCase().includes(q) ||
      course.targetStudent.toLowerCase().includes(q) ||
      course.subjects.some((s) => s.name.toLowerCase().includes(q));
    return matchesTrack && matchesSearch;
  });

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 space-y-12">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-wider">
          <Sparkles size={14} />
          <span>Official Academic Batches · Admissions Open 2082 / 2026</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight">
          Course Catalogue &amp; Live Batches
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed">
          Explore our verified curriculum batches for CEE Medical Entrance, SEE Class 10 board preparation, and specialized skill tracks.
        </p>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-4xl mx-auto">
        <div className="flex flex-wrap items-center justify-center p-1.5 bg-muted/60 border border-border rounded-2xl gap-1">
          <button
            onClick={() => setSelectedTrack('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedTrack === 'all' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All Programs ({allCourses.length})
          </button>
          <button
            onClick={() => setSelectedTrack('cee_medical')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedTrack === 'cee_medical' ? 'bg-indigo-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            🩺 CEE Medical ({ceeCount})
          </button>
          <button
            onClick={() => setSelectedTrack('see_class_10')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedTrack === 'see_class_10' ? 'bg-emerald-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            🎓 SEE Class 10 ({seeCount})
          </button>
          <button
            onClick={() => setSelectedTrack('skills_languages')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedTrack === 'skills_languages' ? 'bg-amber-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            🌐 Skills &amp; Languages ({skillsCount})
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subjects, chapters, batches..."
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-card border border-border text-xs focus:outline-none focus:border-primary transition-all text-foreground"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Courses Grid / Empty State */}
      {filteredCourses.length === 0 ? (
        <div className="bg-card border border-border/80 rounded-3xl p-10 sm:p-14 text-center max-w-xl mx-auto space-y-5 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
            <Search size={28} />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-xl font-extrabold text-foreground">No batches found</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {searchQuery
                ? `We couldn't find any batches matching "${searchQuery}" in ${
                    selectedTrack === 'all'
                      ? 'all programs'
                      : selectedTrack === 'cee_medical'
                      ? 'CEE Medical'
                      : selectedTrack === 'see_class_10'
                      ? 'SEE Class 10'
                      : 'Skills & Languages'
                  }.`
                : 'There are currently no active batches in this category.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5 justify-center pt-2">
            <button
              onClick={() => {
                setSelectedTrack('all');
                setSearchQuery('');
              }}
              className="btn-primary text-xs font-bold py-2.5 px-5 rounded-xl shadow-xs"
            >
              Reset All Filters
            </button>
            <a
              href={`https://wa.me/${SUPPORT_CONFIG.whatsappNumber}?text=${encodeURIComponent(
                'Hi Samyak Guru, I am looking for an academic batch but could not find it in the catalogue. Please guide me.'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-xs font-bold py-2.5 px-5 rounded-xl flex items-center gap-1.5"
            >
              <HelpCircle size={14} />
              <span>Inquire on WhatsApp</span>
            </a>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
          {filteredCourses.map((course) => {
            const isSee = course.track === 'see_class_10';
            const isCee = course.track === 'cee_medical';
            const accentBorder = isSee ? 'hover:border-emerald-500/60' : isCee ? 'hover:border-indigo-500/60' : 'hover:border-primary/60';
            const badgeBg = isSee ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : isCee ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' : 'bg-primary/10 text-primary border-primary/20';

            return (
              <div
                key={course.slug}
                className={`bg-card border border-border/80 ${accentBorder} rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-mono font-black uppercase px-2.5 py-1 rounded-lg border ${badgeBg}`}>
                      {course.badge}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Clock size={13} />
                      <span>{course.validityText}</span>
                    </span>
                  </div>

                  <div>
                    <h2 className="text-xl font-extrabold text-foreground group-hover:text-primary transition-colors leading-snug">
                      {course.title}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                      {course.headline}
                    </p>
                  </div>

                  {/* Target & Outcome */}
                  <div className="p-3 rounded-2xl bg-muted/40 border border-border/60 text-xs space-y-1">
                    <div className="font-semibold text-foreground flex items-center gap-1">
                      <span>🎯 Target:</span>
                      <span className="text-muted-foreground truncate">{course.targetStudent}</span>
                    </div>
                    <div className="font-semibold text-foreground flex items-center gap-1">
                      <span>🏆 Goal:</span>
                      <span className="text-muted-foreground truncate">{course.examOutcome}</span>
                    </div>
                  </div>

                  {/* Subjects Summary */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Included Subjects ({course.subjects.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {course.subjects.map((sub, sIdx) => (
                        <span key={sIdx} className="text-[11px] px-2 py-0.5 rounded-lg bg-muted border border-border/60 text-foreground font-medium">
                          {sub.icon} {sub.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Pricing & CTAs */}
                <div className="pt-6 border-t border-border/60 mt-6 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-muted-foreground font-medium">Enrollment Fee:</span>
                    <div className="text-right">
                      <span className="text-xl font-black text-foreground">
                        NPR {course.priceNpr.toLocaleString()}
                      </span>
                      {course.originalPriceNpr && (
                        <span className="text-xs text-muted-foreground line-through ml-2">
                          NPR {course.originalPriceNpr.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <Link
                      href={`/courses/${course.slug}`}
                      className="w-full py-3 rounded-2xl bg-muted/60 hover:bg-muted border border-border text-foreground font-bold text-xs text-center transition-all flex items-center justify-center gap-1"
                    >
                      <span>Details</span>
                      <ArrowRight size={13} />
                    </Link>

                    <Link
                      href={course.enrollPath}
                      className="w-full py-3 rounded-2xl bg-primary hover:bg-primary-dark text-white font-bold text-xs text-center shadow-sm transition-all flex items-center justify-center gap-1"
                    >
                      <span>Enroll Now</span>
                    </Link>
                  </div>

                  <p className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1">
                    <ShieldCheck size={12} className="text-emerald-500" />
                    <span>7-Day Full Money-Back Guarantee</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

export default function CourseCataloguePage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <PublicNav />

      <main className="flex-1 pt-28 sm:pt-36 pb-20">
        <Suspense
          fallback={
            <div className="max-w-screen-2xl mx-auto px-4 py-20 text-center text-muted-foreground text-sm">
              Loading course catalogue...
            </div>
          }
        >
          <CourseCatalogueContent />
        </Suspense>
      </main>

      <HomepageFooter />
    </div>
  );
}
