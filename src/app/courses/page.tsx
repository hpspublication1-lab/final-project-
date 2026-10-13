'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import PublicNav from '@/components/PublicNav';
import HomepageFooter from '@/app/components/HomepageFooter';
import CourseSelectionGate from '@/components/courses/CourseSelectionGate';
import {
  getAllCourses,
  CourseTrack,
  CourseDeliveryFormat,
} from '@/lib/courses/catalog';
import { SUPPORT_CONFIG } from '@/lib/config/support';
import {
  Search,
  ArrowRight,
  Clock,
  ShieldCheck,
  X,
  HelpCircle,
  Sparkles,
  Users,
  BookOpen,
  Calendar,
  Layers,
} from 'lucide-react';

const VALID_TRACKS: Array<'all' | CourseTrack> = [
  'all',
  'cee_medical',
  'ioe_engineering',
  'lok_sewa',
  'neb_11_12',
  'see_class_10',
  'skills_languages',
];

function CourseCatalogueContent() {
  const searchParams = useSearchParams();
  const initialTrackParam = searchParams.get('track') as CourseTrack | 'all' | null;
  const sectorParam = searchParams.get('sector');
  const formatParam = searchParams.get('format') as CourseDeliveryFormat | 'all' | null;
  const initialQuery = searchParams.get('q') || '';

  const resolveInitialTrack = (): 'all' | CourseTrack => {
    if (initialTrackParam && VALID_TRACKS.includes(initialTrackParam)) {
      return initialTrackParam;
    }
    if (sectorParam === 'english' || sectorParam === 'digital') {
      return 'skills_languages';
    }
    if (sectorParam === 'engineering' || sectorParam === 'ioe') {
      return 'ioe_engineering';
    }
    if (sectorParam === 'loksewa' || sectorParam === 'lok_sewa') {
      return 'lok_sewa';
    }
    if (sectorParam === 'class11' || sectorParam === 'class12' || sectorParam === 'neb') {
      return 'neb_11_12';
    }
    return 'all';
  };

  const resolveInitialFormat = (): 'all' | CourseDeliveryFormat => {
    if (
      formatParam === 'all' ||
      formatParam === 'live_batch' ||
      formatParam === 'crash_course' ||
      formatParam === 'subject_course' ||
      formatParam === 'self_paced_pass'
    ) {
      return formatParam;
    }
    return 'all';
  };

  const [selectedTrack, setSelectedTrack] = useState<'all' | CourseTrack>(resolveInitialTrack);
  const [selectedFormat, setSelectedFormat] = useState<'all' | CourseDeliveryFormat>(
    resolveInitialFormat
  );
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  useEffect(() => {
    const trackParam = searchParams.get('track') as CourseTrack | 'all' | null;
    const secParam = searchParams.get('sector');
    const fmtParam = searchParams.get('format') as CourseDeliveryFormat | 'all' | null;
    const qParam = searchParams.get('q');

    if (trackParam && VALID_TRACKS.includes(trackParam)) {
      setSelectedTrack(trackParam);
    } else if (secParam === 'english' || secParam === 'digital') {
      setSelectedTrack('skills_languages');
    } else if (secParam === 'engineering' || secParam === 'ioe') {
      setSelectedTrack('ioe_engineering');
    } else if (secParam === 'loksewa' || secParam === 'lok_sewa') {
      setSelectedTrack('lok_sewa');
    } else if (secParam === 'class11' || secParam === 'class12' || secParam === 'neb') {
      setSelectedTrack('neb_11_12');
    }

    if (
      fmtParam &&
      (fmtParam === 'all' ||
        fmtParam === 'live_batch' ||
        fmtParam === 'crash_course' ||
        fmtParam === 'subject_course' ||
        fmtParam === 'self_paced_pass')
    ) {
      setSelectedFormat(fmtParam);
    }

    if (qParam !== null) {
      setSearchQuery(qParam);
    }
  }, [searchParams]);

  const allCourses = getAllCourses();

  const ceeCount = allCourses.filter((c) => c.track === 'cee_medical').length;
  const ioeCount = allCourses.filter((c) => c.track === 'ioe_engineering').length;
  const lokSewaCount = allCourses.filter((c) => c.track === 'lok_sewa').length;
  const nebCount = allCourses.filter((c) => c.track === 'neb_11_12').length;
  const seeCount = allCourses.filter((c) => c.track === 'see_class_10').length;
  const skillsCount = allCourses.filter((c) => c.track === 'skills_languages').length;

  const filteredCourses = allCourses.filter((course) => {
    const matchesTrack = selectedTrack === 'all' || course.track === selectedTrack;
    const matchesFormat = selectedFormat === 'all' || course.courseFormat === selectedFormat;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      course.title.toLowerCase().includes(q) ||
      course.description.toLowerCase().includes(q) ||
      course.targetStudent.toLowerCase().includes(q) ||
      course.formatLabel.toLowerCase().includes(q) ||
      course.subjects.some((s) => s.name.toLowerCase().includes(q)) ||
      course.faculty.some((f) => f.name.toLowerCase().includes(q));
    return matchesTrack && matchesFormat && matchesSearch;
  });

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-wider">
          <Sparkles size={14} />
          <span>Verified Academic, Entrance &amp; Civil Service Batches · 2082 / 2026</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight">
          Course Catalogue &amp; Learning Gate
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed">
          Choose your primary learning goal below or compare live faculty batches across CEE Medical, IOE Engineering, Lok Sewa Aayog, NEB Class 11 &amp; 12, SEE Class 10, and Skills tracks.
        </p>
      </div>

      {/* Interactive Course Selection Gate */}
      <CourseSelectionGate
        autoOpenOnFirstVisit={true}
        onSelectTrack={(track) => {
          setSelectedTrack(track);
          setSelectedFormat('all');
        }}
      />

      {/* Track Filter Tabs & Search */}
      <div className="space-y-4 max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center justify-center p-1.5 bg-muted/60 border border-border rounded-2xl gap-1">
            <button
              onClick={() => setSelectedTrack('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedTrack === 'all'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All ({allCourses.length})
            </button>
            <button
              onClick={() => setSelectedTrack('cee_medical')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedTrack === 'cee_medical'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              🩺 CEE Medical ({ceeCount})
            </button>
            <button
              onClick={() => setSelectedTrack('ioe_engineering')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedTrack === 'ioe_engineering'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              ⚙️ IOE Engineering ({ioeCount})
            </button>
            <button
              onClick={() => setSelectedTrack('lok_sewa')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedTrack === 'lok_sewa'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              🏛️ Lok Sewa ({lokSewaCount})
            </button>
            <button
              onClick={() => setSelectedTrack('neb_11_12')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedTrack === 'neb_11_12'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              📘 Class 11 &amp; 12 ({nebCount})
            </button>
            <button
              onClick={() => setSelectedTrack('see_class_10')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedTrack === 'see_class_10'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              🎓 SEE Class 10 ({seeCount})
            </button>
            <button
              onClick={() => setSelectedTrack('skills_languages')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedTrack === 'skills_languages'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              🌐 Skills &amp; IELTS ({skillsCount})
            </button>
          </div>

          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search subjects, faculty, formats..."
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

        {/* Delivery Format Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <span className="text-xs font-bold text-muted-foreground mr-1 flex items-center gap-1">
            <Layers size={13} />
            <span>Delivery Format:</span>
          </span>
          {(
            [
              { id: 'all', label: 'All Formats' },
              { id: 'live_batch', label: 'Live Batches' },
              { id: 'crash_course', label: 'Crash Courses' },
              { id: 'subject_course', label: 'Subject Courses' },
              { id: 'self_paced_pass', label: 'Self-Paced Passes' },
            ] as const
          ).map((fmt) => (
            <button
              key={fmt.id}
              type="button"
              onClick={() => setSelectedFormat(fmt.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                selectedFormat === fmt.id
                  ? 'bg-primary text-white border-primary shadow-xs'
                  : 'bg-card text-muted-foreground border-border hover:text-foreground'
              }`}
            >
              {fmt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Courses Grid / Empty State */}
      {filteredCourses.length === 0 ? (
        <div className="bg-card border border-border/80 rounded-3xl p-10 sm:p-14 text-center max-w-xl mx-auto space-y-5 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
            <Search size={28} />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-xl font-extrabold text-foreground">No matching courses found</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {searchQuery
                ? `We couldn't find any courses matching "${searchQuery}" with your active filters.`
                : 'There are currently no courses matching this track and delivery format combination.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5 justify-center pt-2">
            <button
              onClick={() => {
                setSelectedTrack('all');
                setSelectedFormat('all');
                setSearchQuery('');
              }}
              className="btn-primary text-xs font-bold py-2.5 px-5 rounded-xl shadow-xs"
            >
              Reset All Filters
            </button>
            <a
              href={`https://wa.me/${SUPPORT_CONFIG.whatsappNumber}?text=${encodeURIComponent(
                'Hi Samyak Guru, I am looking for an academic batch in the course catalogue. Please guide me.'
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
            const isIoe = course.track === 'ioe_engineering';
            const isLokSewa = course.track === 'lok_sewa';
            const isNeb = course.track === 'neb_11_12';

            const accentBorder = isSee
              ? 'hover:border-emerald-500/60'
              : isCee
              ? 'hover:border-indigo-500/60'
              : isIoe
              ? 'hover:border-blue-500/60'
              : isLokSewa
              ? 'hover:border-orange-500/60'
              : isNeb
              ? 'hover:border-teal-500/60'
              : 'hover:border-primary/60';

            const badgeBg = isSee
              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
              : isCee
              ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20'
              : isIoe
              ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
              : isLokSewa
              ? 'bg-orange-500/10 text-orange-600 border-orange-500/20'
              : isNeb
              ? 'bg-teal-500/10 text-teal-600 border-teal-500/20'
              : 'bg-primary/10 text-primary border-primary/20';

            const formatPillBg =
              course.courseFormat === 'live_batch'
                ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20'
                : course.courseFormat === 'crash_course'
                ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                : course.courseFormat === 'subject_course'
                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                : 'bg-sky-500/10 text-sky-600 border-sky-500/20';

            const totalChapters = course.subjects.reduce((sum, s) => sum + s.chaptersCount, 0);
            const facultyList = course.faculty.map((f) => f.name).join(', ');

            return (
              <div
                key={course.slug}
                className={`bg-card border border-border/80 ${accentBorder} rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group`}
              >
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`text-[10px] font-mono font-black uppercase px-2.5 py-1 rounded-lg border ${badgeBg}`}
                      >
                        {course.badge}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${formatPillBg}`}
                      >
                        {course.formatLabel}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Clock size={13} />
                      <span>{course.validityText}</span>
                    </span>
                  </div>

                  <div>
                    <h2 className="text-xl font-extrabold text-foreground group-hover:text-primary transition-colors leading-snug">
                      <Link href={`/courses/${course.slug}`}>{course.title}</Link>
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                      {course.headline}
                    </p>
                  </div>

                  {/* Target, Schedule & Faculty */}
                  <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 text-xs space-y-1.5">
                    <div className="font-semibold text-foreground flex items-start gap-1.5">
                      <span className="shrink-0">🎯 Target:</span>
                      <span className="text-muted-foreground line-clamp-1">
                        {course.targetStudent}
                      </span>
                    </div>
                    <div className="font-semibold text-foreground flex items-start gap-1.5">
                      <Calendar size={13} className="shrink-0 mt-0.5 text-primary" />
                      <span className="text-muted-foreground line-clamp-1">
                        {course.batchSchedule.liveSchedule}
                      </span>
                    </div>
                    <div className="font-semibold text-foreground flex items-start gap-1.5">
                      <Users size={13} className="shrink-0 mt-0.5 text-emerald-500" />
                      <span className="text-muted-foreground line-clamp-1">
                        Faculty: {facultyList}
                      </span>
                    </div>
                  </div>

                  {/* Subjects & Chapter Coverage */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      <span>Subjects ({course.subjects.length})</span>
                      <span>{totalChapters} Chapters Covered</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {course.subjects.map((sub, sIdx) => (
                        <span
                          key={sIdx}
                          className="text-[11px] px-2 py-0.5 rounded-lg bg-muted border border-border/60 text-foreground font-medium"
                        >
                          {sub.icon} {sub.name} ({sub.chaptersCount})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Pricing & CTAs */}
                <div className="pt-6 border-t border-border/60 mt-6 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <div className="text-xs text-muted-foreground font-medium">
                      <span>Full Price:</span>
                      {course.depositNpr && (
                        <span className="block text-[10px] text-amber-600 font-bold">
                          Or NPR {course.depositNpr} Seat Deposit
                        </span>
                      )}
                    </div>
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
                      <BookOpen size={13} />
                      <span>Preview &amp; Details</span>
                    </Link>

                    <Link
                      href={course.enrollPath}
                      className="w-full py-3 rounded-2xl bg-primary hover:bg-primary-dark text-white font-bold text-xs text-center shadow-sm transition-all flex items-center justify-center gap-1"
                    >
                      <span>Enroll Now</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>

                  <p className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1">
                    <ShieldCheck size={12} className="text-emerald-500 shrink-0" />
                    <span className="truncate">{course.refundRules}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Side-by-Side Legitimate Offer Comparison Table */}
      <section className="pt-8 space-y-5">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
            Compare All 12 Approved Programs &amp; Formats
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Transparent side-by-side breakdown of delivery format, chapter coverage, access duration, full pricing, and refund eligibility.
          </p>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-border/80 bg-card shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-muted-foreground uppercase tracking-wider text-[11px] font-bold">
                <th className="py-4 px-5">Program Title</th>
                <th className="py-4 px-4">Delivery Format</th>
                <th className="py-4 px-4">Coverage</th>
                <th className="py-4 px-4">Schedule &amp; Validity</th>
                <th className="py-4 px-4">Full Fee</th>
                <th className="py-4 px-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {allCourses.map((c) => {
                const chapters = c.subjects.reduce((sum, s) => sum + s.chaptersCount, 0);
                return (
                  <tr key={c.slug} className="hover:bg-muted/20 transition-colors">
                    <td className="py-4 px-5 font-bold text-foreground">
                      <Link href={`/courses/${c.slug}`} className="hover:text-primary transition-colors">
                        {c.title}
                      </Link>
                      <span className="block text-[11px] font-normal text-muted-foreground mt-0.5">
                        {c.faculty.map((f) => f.name).join(', ')}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-bold text-foreground px-2.5 py-1 rounded-lg bg-muted border border-border/60 inline-block">
                        {c.formatLabel}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-muted-foreground">
                      <strong className="text-foreground">{c.subjects.length} Subjects</strong> ·{' '}
                      {chapters} Chapters
                    </td>
                    <td className="py-4 px-4 text-muted-foreground">
                      <span className="block text-foreground font-semibold">
                        {c.validityText} ({c.validityDays}d)
                      </span>
                      <span className="text-[11px]">{c.batchSchedule.startDate}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm font-black text-foreground">
                        NPR {c.priceNpr.toLocaleString()}
                      </span>
                      {c.depositNpr && (
                        <span className="block text-[10px] text-amber-600 font-semibold">
                          Deposit: NPR {c.depositNpr}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/courses/${c.slug}`}
                          className="px-3 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold"
                        >
                          Details
                        </Link>
                        <Link
                          href={c.enrollPath}
                          className="px-3 py-1.5 rounded-xl bg-primary text-white font-bold"
                        >
                          Enroll
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
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
