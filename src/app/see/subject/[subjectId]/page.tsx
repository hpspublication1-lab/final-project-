'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import PublicNav from '@/components/PublicNav';
import HomepageFooter from '@/app/components/HomepageFooter';
import {
  GraduationCap, Play, FileText, Zap, Sparkles, BookOpen, Clock,
  CheckCircle2, ArrowRight, ArrowLeft, Download, ShieldCheck, Award,
  Loader2, Video
} from 'lucide-react';

interface SubjectMeta {
  slug: string;
  name: string;
  code: string;
  icon: string;
  color: string;
  gradient: string;
  desc: string;
}

const SUBJECT_METAS: Record<string, SubjectMeta> = {
  science: {
    slug: 'physics',
    name: 'Compulsory Science & Technology',
    code: 'SCI-10',
    icon: '🔬',
    color: 'blue',
    gradient: 'from-blue-600 via-indigo-600 to-blue-800',
    desc: 'Physics, Chemistry, Biology, Astronomy, Earth Science & Applied Technology.',
  },
  physics: {
    slug: 'physics',
    name: 'Compulsory Science & Technology',
    code: 'SCI-10',
    icon: '🔬',
    color: 'blue',
    gradient: 'from-blue-600 via-indigo-600 to-blue-800',
    desc: 'Physics, Chemistry, Biology, Astronomy, Earth Science & Applied Technology.',
  },
  compulsory_science: {
    slug: 'physics',
    name: 'Compulsory Science & Technology',
    code: 'SCI-10',
    icon: '🔬',
    color: 'blue',
    gradient: 'from-blue-600 via-indigo-600 to-blue-800',
    desc: 'Physics, Chemistry, Biology, Astronomy, Earth Science & Applied Technology.',
  },
  mathematics: {
    slug: 'math',
    name: 'Compulsory Mathematics',
    code: 'MATH-10',
    icon: '📐',
    color: 'emerald',
    gradient: 'from-emerald-600 via-teal-600 to-emerald-800',
    desc: 'Sets, Arithmetic, Compound Interest, Mensuration, Algebra & Probability.',
  },
  math: {
    slug: 'math',
    name: 'Compulsory Mathematics',
    code: 'MATH-10',
    icon: '📐',
    color: 'emerald',
    gradient: 'from-emerald-600 via-teal-600 to-emerald-800',
    desc: 'Sets, Arithmetic, Compound Interest, Mensuration, Algebra & Probability.',
  },
  compulsory_math: {
    slug: 'math',
    name: 'Compulsory Mathematics',
    code: 'MATH-10',
    icon: '📐',
    color: 'emerald',
    gradient: 'from-emerald-600 via-teal-600 to-emerald-800',
    desc: 'Sets, Arithmetic, Compound Interest, Mensuration, Algebra & Probability.',
  },
  opt_math: {
    slug: 'opt_math',
    name: 'Optional Mathematics',
    code: 'OPTM-10',
    icon: '📊',
    color: 'purple',
    gradient: 'from-purple-600 via-indigo-600 to-purple-800',
    desc: 'Functions, Polynomials, Limits, Trigonometry, Vectors, Matrices & Statistics.',
  },
  optional_mathematics: {
    slug: 'opt_math',
    name: 'Optional Mathematics',
    code: 'OPTM-10',
    icon: '📊',
    color: 'purple',
    gradient: 'from-purple-600 via-indigo-600 to-purple-800',
    desc: 'Functions, Polynomials, Limits, Trigonometry, Vectors, Matrices & Statistics.',
  },
  english: {
    slug: 'english',
    name: 'English Language',
    code: 'ENG-10',
    icon: '📚',
    color: 'rose',
    gradient: 'from-rose-600 via-pink-600 to-rose-800',
    desc: 'Grammar, Reading Comprehension, Free Writing, Essays, Letters & Literature.',
  },
  social: {
    slug: 'social',
    name: 'Social Studies & Life Skills',
    code: 'SOC-10',
    icon: '🌍',
    color: 'amber',
    gradient: 'from-amber-600 via-orange-600 to-amber-800',
    desc: 'Civic Awareness, Constitution, Economy, International Affairs & Geography.',
  },
  social_studies: {
    slug: 'social',
    name: 'Social Studies & Life Skills',
    code: 'SOC-10',
    icon: '🌍',
    color: 'amber',
    gradient: 'from-amber-600 via-orange-600 to-amber-800',
    desc: 'Civic Awareness, Constitution, Economy, International Affairs & Geography.',
  },
  nepali: {
    slug: 'nepali',
    name: 'Compulsory Nepali (नेपाली)',
    code: 'NEP-10',
    icon: '🇳🇵',
    color: 'red',
    gradient: 'from-red-600 via-rose-600 to-red-800',
    desc: 'नेपाली व्याकरण, पदवर्ग, काल, पक्ष, वाच्य, उत्तर लेखन र मोडल प्रश्न समाधान।',
  },
};

export default function SeeSubjectPredictablePage() {
  const params = useParams();
  const rawId = (params?.subjectId as string)?.toLowerCase() || 'science';
  const meta = SUBJECT_METAS[rawId] || SUBJECT_METAS.science;

  const [activeTab, setActiveTab] = useState<'classes' | 'notes' | 'mcqs' | 'practice' | 'tests'>('classes');
  const [lessons, setLessons] = useState<any[]>([]);
  const [chaptersGrouped, setChaptersGrouped] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch(`/api/see/lessons?subject=${meta.slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const allLessons = data.lessons || [];
        setLessons(allLessons);

        // Group by chapter
        const grouped: Record<string, any[]> = {};
        allLessons.forEach((l: any) => {
          const chName = l.chapter_name || 'General';
          if (!grouped[chName]) grouped[chName] = [];
          grouped[chName].push(l);
        });
        setChaptersGrouped(grouped);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [meta.slug]);

  const totalDurationMin = Math.round(lessons.reduce((acc, l) => acc + (l.duration_sec || 0), 0) / 60);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <PublicNav />

      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20 w-full space-y-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
          <Link href="/see" className="hover:text-emerald-600 flex items-center gap-1">
            <ArrowLeft size={14} /> SEE Dashboard
          </Link>
          <span>/</span>
          <span className="text-foreground">{meta.name}</span>
        </div>

        {/* Hero Subject Header */}
        <div className={`p-8 sm:p-10 rounded-3xl bg-gradient-to-r ${meta.gradient} text-white shadow-2xl space-y-4`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="text-3xl">{meta.icon}</span>
                <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-white/20 text-white font-mono">
                  {meta.code} • {Object.keys(chaptersGrouped).length || 12} UNITS • {lessons.length} HD LECTURES
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black">{meta.name}</h1>
              <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
                {meta.desc} Full HD video lectures, chapter notes, past paper questions and AI grading.
              </p>
            </div>

            <div className="space-y-2 shrink-0">
              <Link
                href="/see/checkout"
                className="px-6 py-3.5 rounded-2xl bg-white text-slate-950 hover:bg-slate-100 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg"
              >
                <span>Enroll in SEE Batch — NPR 2,990</span>
                <ArrowRight size={16} />
              </Link>
              <div className="text-center text-[10px] text-white/80 font-mono font-bold">
                ⚡ Includes all 6 subjects &amp; AI Marker
              </div>
            </div>
          </div>
        </div>

        {/* 5 Predictable Subject Pillars Tabs */}
        <div className="flex gap-2 bg-card p-1.5 rounded-2xl border border-border overflow-x-auto">
          {[
            { id: 'classes', label: '🎥 Video Lectures', desc: `${lessons.length} HD Classes (${totalDurationMin}m)` },
            { id: 'notes', label: '📖 Unit Notes', desc: 'Formulas & Summaries' },
            { id: 'mcqs', label: '⚡ Question Bank', desc: 'Board Past Questions' },
            { id: 'practice', label: '✍️ AI Marking', desc: 'Subjective Answer Sheet' },
            { id: 'tests', label: '📝 Model Sets', desc: 'Full SEE Mock Tests' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-center transition-all ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white font-black shadow-md'
                  : 'text-muted-foreground hover:text-foreground font-bold hover:bg-muted/50'
              }`}
            >
              <div className="text-xs">{tab.label}</div>
              <div className="text-[9px] opacity-80">{tab.desc}</div>
            </button>
          ))}
        </div>

        {/* TAB 1: CLASSES (Organized Unit Playlists & Lectures) */}
        {activeTab === 'classes' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-foreground">Unit-wise Video Curriculum</h3>
                <p className="text-xs text-muted-foreground">Streaming in full HD adaptive bitrate via Bunny.net Stream.</p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-600 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                {lessons.length} Lectures Total
              </span>
            </div>

            {loading ? (
              <div className="py-20 text-center space-y-3">
                <Loader2 size={32} className="animate-spin text-emerald-500 mx-auto" />
                <p className="text-xs font-mono text-muted-foreground font-bold">Loading {meta.name} lectures...</p>
              </div>
            ) : Object.keys(chaptersGrouped).length === 0 ? (
              <div className="p-8 rounded-3xl bg-card border border-border text-center space-y-3">
                <p className="text-sm font-bold text-foreground">Lectures are being updated for this subject.</p>
                <Link href="/lecture-videos" className="text-xs text-emerald-600 font-bold hover:underline">
                  Browse All Lecture Videos →
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(chaptersGrouped).map(([chapterTitle, chapterLessons], chIdx) => (
                  <div key={chapterTitle} className="p-6 rounded-3xl bg-card border border-border space-y-4 shadow-sm">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-black uppercase text-emerald-600 font-mono tracking-wider">
                          UNIT {chIdx + 1} PLAYLIST
                        </span>
                        <h4 className="text-base font-black text-foreground">{chapterTitle}</h4>
                      </div>
                      <span className="text-xs text-muted-foreground font-mono font-bold">
                        {chapterLessons.length} {chapterLessons.length === 1 ? 'Lecture' : 'Lectures'}
                      </span>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {chapterLessons.map((l: any, lIdx: number) => (
                        <Link
                          key={l.id}
                          href={`/see/lessons/${l.id}`}
                          className="p-4 rounded-2xl bg-muted/30 hover:bg-emerald-500/10 border border-border hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-3 group"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                              <span className="font-bold text-emerald-600">Part {lIdx + 1}</span>
                              <span className="flex items-center gap-1">
                                <Clock size={10} /> {Math.round((l.duration_sec || 900) / 60)}m
                              </span>
                            </div>
                            <h5 className="text-xs font-black text-foreground group-hover:text-emerald-600 transition-colors line-clamp-2">
                              {l.title}
                            </h5>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px] font-bold text-emerald-600">
                            <span>Watch HD Stream</span>
                            <Play size={12} className="fill-emerald-600" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: NOTES */}
        {activeTab === 'notes' && (
          <div className="space-y-4">
            <h3 className="text-lg font-black text-foreground">Official Revision Notes &amp; Formula Sheets</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.keys(chaptersGrouped).slice(0, 9).map((ch, idx) => (
                <div key={ch} className="p-5 rounded-2xl bg-card border border-border space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase text-blue-600 font-mono">PDF FORMULA SHEET</span>
                    <h4 className="text-sm font-black text-foreground">{ch}</h4>
                    <p className="text-xs text-muted-foreground">NEB Exam Blueprint &amp; Model Solved Questions</p>
                  </div>
                  <button
                    onClick={() => alert(`Downloading ${ch} revision notes PDF...`)}
                    className="w-full py-2.5 rounded-xl bg-muted text-foreground hover:bg-muted/80 text-xs font-black flex items-center justify-center gap-2 transition-colors"
                  >
                    <Download size={14} /> Download PDF Notes
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: MCQS & QUESTION BANK */}
        {activeTab === 'mcqs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-foreground">10-Year NEB Question Bank &amp; Practice Drills</h3>
              <Link href="/practice" className="text-xs text-emerald-600 font-bold hover:underline">
                Open Full Practice Arena →
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.keys(chaptersGrouped).slice(0, 6).map((ch, idx) => (
                <div key={ch} className="p-5 rounded-2xl bg-card border border-border space-y-3 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase text-emerald-600 font-mono">30+ QUESTIONS</span>
                    <h4 className="text-sm font-black text-foreground">{ch} Drill</h4>
                    <p className="text-xs text-muted-foreground">Solved with instant explanations and score tracking.</p>
                  </div>
                  <Link
                    href="/practice"
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-2 transition-colors"
                  >
                    <Zap size={14} /> Start Chapter Quiz
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: PRACTICE (AI Marking) */}
        {activeTab === 'practice' && (
          <div className="p-8 sm:p-10 rounded-3xl bg-card border border-border space-y-6">
            <div className="max-w-xl space-y-2">
              <span className="text-[10px] font-black uppercase text-emerald-600 font-mono">AI VISION MARKER</span>
              <h3 className="text-xl sm:text-2xl font-black text-foreground">Upload Handwritten Answer Sheets</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Solve subjective model questions from {meta.name}, take a photo of your paper, and get instant step-by-step marks, feedback, and NEB rubric grading.
              </p>
            </div>
            <Link
              href="/practice/subjective"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-black shadow-lg"
            >
              <Sparkles size={16} />
              <span>Launch AI Handwritten Answer Sheet Marker</span>
            </Link>
          </div>
        )}

        {/* TAB 5: TESTS */}
        {activeTab === 'tests' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-foreground">Full SEE Mock Examination Sets</h3>
              <Link href="/mock-tests" className="text-xs text-emerald-600 font-bold hover:underline">
                View All Mock Tests →
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((num) => (
                <div key={num} className="p-5 rounded-2xl bg-card border border-border space-y-3 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase text-purple-600 font-mono">TIMED 3-HOUR EXAM</span>
                    <h4 className="text-sm font-black text-foreground">{meta.name} Model Set {num}</h4>
                    <p className="text-xs text-muted-foreground">Strict 75-mark format mapped to official CDC Nepal specification grid.</p>
                  </div>
                  <Link
                    href="/mock-tests"
                    className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black flex items-center justify-center gap-2 transition-colors"
                  >
                    <Award size={14} /> Start Mock Exam
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      <HomepageFooter />
    </div>
  );
}
