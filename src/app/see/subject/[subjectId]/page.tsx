'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import PublicNav from '@/components/PublicNav';
import HomepageFooter from '@/app/components/HomepageFooter';
import {
  GraduationCap, Play, FileText, Zap, Sparkles, BookOpen, Clock,
  CheckCircle2, ArrowRight, ArrowLeft, Download, ShieldCheck, Award
} from 'lucide-react';

interface SubjectInfo {
  id: string;
  name: string;
  code: string;
  chaptersCount: number;
  icon: string;
  color: string;
  gradient: string;
  chapters: { id: string; title: string; duration: string; mcqs: number; pdfSize: string }[];
}

const SEE_SUBJECTS_DATA: Record<string, SubjectInfo> = {
  mathematics: {
    id: 'mathematics',
    name: 'Compulsory Mathematics',
    code: 'MATH-10',
    chaptersCount: 20,
    icon: '📐',
    color: 'emerald',
    gradient: 'from-emerald-600 via-teal-600 to-emerald-800',
    chapters: [
      { id: 'm1', title: 'Sets & Venn Diagrams', duration: '45 mins', mcqs: 30, pdfSize: '1.8 MB' },
      { id: 'm2', title: 'Arithmetic: Compound Interest & Depreciation', duration: '60 mins', mcqs: 35, pdfSize: '2.1 MB' },
      { id: 'm3', title: 'Mensuration: Prism, Cylinder & Sphere', duration: '75 mins', mcqs: 40, pdfSize: '2.5 MB' },
      { id: 'm4', title: 'Algebra: Quadratic Equations & Indices', duration: '90 mins', mcqs: 50, pdfSize: '3.1 MB' },
      { id: 'm5', title: 'Geometry: Parallelograms & Circles Theorems', duration: '110 mins', mcqs: 60, pdfSize: '3.9 MB' },
    ],
  },
  science: {
    id: 'science',
    name: 'Compulsory Science',
    code: 'SCI-10',
    chaptersCount: 24,
    icon: '🔬',
    color: 'blue',
    gradient: 'from-blue-600 via-indigo-600 to-blue-800',
    chapters: [
      { id: 's1', title: 'Physics: Force & Universal Law of Gravitation', duration: '50 mins', mcqs: 35, pdfSize: '2.2 MB' },
      { id: 's2', title: 'Physics: Pressure & Pascal\'s Law', duration: '55 mins', mcqs: 30, pdfSize: '1.9 MB' },
      { id: 's3', title: 'Physics: Energy, Heat & Light Refraction', duration: '70 mins', mcqs: 45, pdfSize: '2.8 MB' },
      { id: 's4', title: 'Chemistry: Chemical Reactions & Periodic Table', duration: '80 mins', mcqs: 50, pdfSize: '3.2 MB' },
      { id: 's5', title: 'Biology: Human Nervous System & Reproduction', duration: '85 mins', mcqs: 55, pdfSize: '3.5 MB' },
    ],
  },
  english: {
    id: 'english',
    name: 'Compulsory English',
    code: 'ENG-10',
    chaptersCount: 15,
    icon: '📚',
    color: 'amber',
    gradient: 'from-amber-600 via-orange-600 to-amber-800',
    chapters: [
      { id: 'e1', title: 'Reading Comprehension Passage 1 & 2', duration: '40 mins', mcqs: 25, pdfSize: '1.5 MB' },
      { id: 'e2', title: 'Grammar: Tense Transformations & Reported Speech', duration: '60 mins', mcqs: 40, pdfSize: '2.0 MB' },
      { id: 'e3', title: 'Grammar: Prepositions & Subject-Verb Agreement', duration: '45 mins', mcqs: 30, pdfSize: '1.6 MB' },
      { id: 'e4', title: 'Writing: Formal Essay & Letter Templates', duration: '65 mins', mcqs: 20, pdfSize: '2.4 MB' },
      { id: 'e5', title: 'Writing: Story Writing & News Reports', duration: '50 mins', mcqs: 15, pdfSize: '1.9 MB' },
    ],
  },
  nepali: {
    id: 'nepali',
    name: 'Compulsory Nepali (नेपाली)',
    code: 'NEP-10',
    chaptersCount: 16,
    icon: '🇳🇵',
    color: 'red',
    gradient: 'from-red-600 via-rose-600 to-red-800',
    chapters: [
      { id: 'n1', title: 'नेपाली व्याकरण: पदवर्ग, काल र पक्ष', duration: '45 mins', mcqs: 30, pdfSize: '1.7 MB' },
      { id: 'n2', title: 'नेपाली व्याकरण: वाच्य र वाक्य परिवर्तन', duration: '50 mins', mcqs: 35, pdfSize: '1.8 MB' },
      { id: 'n3', title: 'निबन्ध लेखन र मनोवाद', duration: '60 mins', mcqs: 20, pdfSize: '2.1 MB' },
      { id: 'n4', title: 'पाठ्यपुस्तक कविता र कथा व्याख्या', duration: '70 mins', mcqs: 25, pdfSize: '2.6 MB' },
    ],
  },
  social: {
    id: 'social',
    name: 'Social Studies & Life Skills',
    code: 'SOC-10',
    chaptersCount: 18,
    icon: '🌍',
    color: 'orange',
    gradient: 'from-orange-600 via-amber-600 to-orange-800',
    chapters: [
      { id: 'so1', title: 'History of Modern Nepal & Unification', duration: '55 mins', mcqs: 35, pdfSize: '2.3 MB' },
      { id: 'so2', title: 'Civics: Constitution & Fundamental Rights', duration: '60 mins', mcqs: 40, pdfSize: '2.5 MB' },
      { id: 'so3', title: 'Geography: Topography & Climate Zones', duration: '50 mins', mcqs: 30, pdfSize: '2.0 MB' },
      { id: 'so4', title: 'International Organizations: UN & SAARC', duration: '45 mins', mcqs: 25, pdfSize: '1.8 MB' },
    ],
  },
  opt_math: {
    id: 'opt_math',
    name: 'Optional Mathematics',
    code: 'OPTM-10',
    chaptersCount: 16,
    icon: '📊',
    color: 'purple',
    gradient: 'from-purple-600 via-indigo-600 to-purple-800',
    chapters: [
      { id: 'om1', title: 'Functions & Polynomial Equations', duration: '60 mins', mcqs: 35, pdfSize: '2.2 MB' },
      { id: 'om2', title: 'Matrices & Determinants', duration: '55 mins', mcqs: 30, pdfSize: '1.9 MB' },
      { id: 'om3', title: 'Trigonometry: Compound Angles & Transformation', duration: '80 mins', mcqs: 50, pdfSize: '3.1 MB' },
      { id: 'om4', title: 'Vectors & Coordinate Geometry Transformations', duration: '90 mins', mcqs: 45, pdfSize: '3.5 MB' },
    ],
  },
  computer: {
    id: 'computer',
    name: 'Computer Science',
    code: 'COMP-10',
    chaptersCount: 12,
    icon: '💻',
    color: 'teal',
    gradient: 'from-teal-600 via-emerald-600 to-teal-800',
    chapters: [
      { id: 'c1', title: 'Networking & Telecommunications', duration: '45 mins', mcqs: 30, pdfSize: '1.6 MB' },
      { id: 'c2', title: 'Database Management Systems (MS Access)', duration: '65 mins', mcqs: 40, pdfSize: '2.4 MB' },
      { id: 'c3', title: 'Modular Programming in C / QBASIC', duration: '80 mins', mcqs: 45, pdfSize: '3.0 MB' },
      { id: 'c4', title: 'Cyber Law & Computer Ethics in Nepal', duration: '40 mins', mcqs: 25, pdfSize: '1.5 MB' },
    ],
  },
};

export default function SeeSubjectPredictablePage() {
  const params = useParams();
  const subjectId = (params?.subjectId as string)?.toLowerCase() || 'mathematics';
  const subject = SEE_SUBJECTS_DATA[subjectId] || SEE_SUBJECTS_DATA.mathematics;

  const [activeTab, setActiveTab] = useState<'classes' | 'notes' | 'mcqs' | 'practice' | 'tests'>('classes');

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <PublicNav />

      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20 w-full space-y-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
          <Link href="/see" className="hover:text-emerald-600 flex items-center gap-1">
            <ArrowLeft size={14} /> SEE Home
          </Link>
          <span>/</span>
          <span className="text-foreground">{subject.name}</span>
        </div>

        {/* Hero Subject Header */}
        <div className={`p-8 sm:p-10 rounded-3xl bg-gradient-to-r ${subject.gradient} text-white shadow-2xl space-y-4`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-3xl">{subject.icon}</span>
                <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-white/20 text-white">
                  {subject.code} • {subject.chaptersCount} CHAPTERS
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black">{subject.name}</h1>
              <p className="text-xs sm:text-sm text-white/90">
                Complete NEB Class 10 {subject.name} preparation with predictable 5-pillar study modules.
              </p>
            </div>

            <Link
              href="/see/checkout"
              className="px-6 py-3.5 rounded-2xl bg-white text-slate-950 hover:bg-slate-100 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shrink-0"
            >
              <span>Unlock Full Subject — NPR 2,490</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* 5 Predictable Subject Pillars Tabs */}
        <div className="flex gap-2 bg-card p-1.5 rounded-2xl border border-border overflow-x-auto">
          {[
            { id: 'classes', label: '🎥 Classes', desc: 'Video Lectures' },
            { id: 'notes', label: '📖 Notes', desc: 'Summary & Formulas' },
            { id: 'mcqs', label: '⚡ MCQs', desc: 'Question Bank' },
            { id: 'practice', label: '✍️ Practice', desc: 'AI Subjective Marking' },
            { id: 'tests', label: '📝 Tests', desc: 'Model Sets' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-center transition-all ${
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

        {/* TAB 1: CLASSES (Video Lectures & Chapter Intelligence Mastery) */}
        {activeTab === 'classes' && (
          <div className="space-y-4">
            <h3 className="text-lg font-black text-foreground">Chapter Learning &amp; AI Mastery Levels</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {subject.chapters.map((chap, idx) => {
                const mastery = Math.round(60 + (idx * 7) % 35);
                const understanding = Math.round(mastery + 4);
                const practice = Math.round(mastery - 10);
                const mcq = Math.round(mastery + 13);
                const written = Math.round(mastery - 25);

                return (
                  <div key={chap.id} className="p-6 rounded-3xl bg-card border border-border shadow-md space-y-4 flex flex-col justify-between hover:border-emerald-500/40 transition-all">
                    
                    <div className="space-y-3 font-mono">
                      <div className="flex items-center justify-between border-b border-border pb-2">
                        <span className="text-xs font-black uppercase text-foreground font-sans">{chap.title}</span>
                        <span className="text-[10px] text-emerald-600 font-bold font-sans">CH {idx + 1}</span>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-sans">Understanding</span>
                          <span className="font-bold text-foreground">{understanding}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-sans">Practice</span>
                          <span className="font-bold text-foreground">{practice}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-sans">MCQ</span>
                          <span className="font-bold text-emerald-600">{mcq}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-sans">Written</span>
                          <span className="font-bold text-amber-600">{written}%</span>
                        </div>
                      </div>

                      {/* Master Level Progress Bar */}
                      <div className="pt-2 border-t border-border/60 space-y-1">
                        <div className="flex justify-between text-[11px] font-sans font-black">
                          <span className="text-foreground">MASTER LEVEL</span>
                          <span className="text-emerald-600">{mastery}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                            style={{ width: `${mastery}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/see/lessons/${chap.id}`}
                      className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md transition-colors"
                    >
                      <Play size={14} />
                      <span>CONTINUE LESSON</span>
                    </Link>

                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: NOTES (Summaries & Formula PDF Sheets) */}
        {activeTab === 'notes' && (
          <div className="space-y-4">
            <h3 className="text-lg font-black text-foreground">Revision Notes &amp; Formula Sheets</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {subject.chapters.map((chap) => (
                <div key={chap.id} className="p-5 rounded-2xl bg-card border border-border space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase text-blue-600">PDF SUMMARY</span>
                    <h4 className="text-sm font-black text-foreground">{chap.title} Notes</h4>
                    <p className="text-xs text-muted-foreground">{chap.pdfSize} • NEB Exam Scheme</p>
                  </div>
                  <button
                    onClick={() => alert(`Downloading ${chap.title} Notes PDF...`)}
                    className="w-full py-2.5 rounded-xl bg-muted text-foreground hover:bg-muted/80 text-xs font-black flex items-center justify-center gap-2 transition-colors"
                  >
                    <Download size={14} /> Download PDF
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: MCQs (Topic-wise Question Bank) */}
        {activeTab === 'mcqs' && (
          <div className="space-y-4">
            <h3 className="text-lg font-black text-foreground">Topic-Wise MCQ Practice Bank</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {subject.chapters.map((chap) => (
                <div key={chap.id} className="p-5 rounded-2xl bg-card border border-border space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase text-amber-600">MCQ DRILL</span>
                    <h4 className="text-sm font-black text-foreground">{chap.title}</h4>
                    <p className="text-xs text-muted-foreground">{chap.mcqs} Practice Questions</p>
                  </div>
                  <Link
                    href="/practice"
                    className="w-full py-2.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-black flex items-center justify-center gap-2 hover:bg-amber-600 transition-colors"
                  >
                    <Zap size={14} /> Start MCQ Drill
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: PRACTICE (AI Subjective Handwritten Grading) */}
        {activeTab === 'practice' && (
          <div className="p-8 rounded-3xl bg-card border border-emerald-500/30 space-y-4 text-center">
            <Sparkles size={32} className="text-emerald-500 mx-auto" />
            <h3 className="text-xl font-black text-foreground">AI Subjective Answer Sheet Evaluator</h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto">
              Solve handwritten subjective questions for {subject.name}, take a photo, and get instant step-by-step red-pen grading based on official NEB marking schemes.
            </p>
            <Link
              href="/practice/subjective"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-lg transition-all"
            >
              <Sparkles size={16} />
              <span>Upload Answer Sheet for AI Marking</span>
            </Link>
          </div>
        )}

        {/* TAB 5: TESTS (Full Model Question Sets) */}
        {activeTab === 'tests' && (
          <div className="space-y-4">
            <h3 className="text-lg font-black text-foreground">Full Model Question Test Sets</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-6 rounded-2xl bg-card border border-border space-y-3">
                <span className="text-[10px] font-bold uppercase text-purple-600">NEB MODEL TEST 1</span>
                <h4 className="text-base font-black text-foreground">NEB Official {subject.name} Model Paper 2082</h4>
                <p className="text-xs text-muted-foreground">Full 75 Marks • Timed 2:15 Hours Simulation</p>
                <Link href="/mock-tests" className="inline-block px-5 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-black hover:bg-purple-700">Start Timed Mock Test</Link>
              </div>

              <div className="p-6 rounded-2xl bg-card border border-border space-y-3">
                <span className="text-[10px] font-bold uppercase text-purple-600">10-YEAR BANK</span>
                <h4 className="text-base font-black text-foreground">10-Year NEB Past Paper Solution Bank</h4>
                <p className="text-xs text-muted-foreground">Solved 2072–2081 Past Papers</p>
                <Link href="/mock-tests" className="inline-block px-5 py-2.5 rounded-xl bg-muted text-foreground text-xs font-black hover:bg-muted/80">Explore Past Solutions</Link>
              </div>
            </div>
          </div>
        )}

      </main>

      <HomepageFooter />
    </div>
  );
}
