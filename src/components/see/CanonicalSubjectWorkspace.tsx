'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import {
  BookOpen,
  ChevronRight,
  Play,
  FileText,
  HelpCircle,
  Award,
  Sparkles,
  ArrowLeft,
  Flame,
  CheckCircle2,
  Clock,
  Target,
  Zap,
} from 'lucide-react';
import { SEE_SUBJECT_HIERARCHY, SEE_QUESTION_BANK, SeeSubjectHierarchy, SeeQuestion } from '@/lib/data/seeQuestionBankData';
import { SEE_DIGEST_LIST } from '@/lib/data/seeDigestData';
import SeePracticeSessionModal from '@/components/see/SeePracticeSessionModal';
import SeePdfViewerModal from '@/components/see/SeePdfViewerModal';

interface CanonicalSubjectWorkspaceProps {
  subjectId: string;
}

export default function CanonicalSubjectWorkspace({ subjectId }: CanonicalSubjectWorkspaceProps) {
  const [practiceSession, setPracticeSession] = useState<{
    questions: SeeQuestion[];
    title: string;
  } | null>(null);

  const [selectedPdf, setSelectedPdf] = useState<any | null>(null);

  // Find subject details
  const subject: SeeSubjectHierarchy =
    SEE_SUBJECT_HIERARCHY.find((s) => s.id === subjectId) || SEE_SUBJECT_HIERARCHY[0];

  // Calculate subject questions
  const subjectQuestions = SEE_QUESTION_BANK.filter((q) => q.subject === subject.id);
  const subjectDigests = SEE_DIGEST_LIST.filter((d) => d.subject === subject.id);

  const startChapterPractice = (chapterName: string) => {
    const matched = subjectQuestions.filter((q) => q.chapter === chapterName);
    const questionsToUse = matched.length > 0 ? matched : subjectQuestions.slice(0, 10);
    setPracticeSession({
      questions: questionsToUse,
      title: `🎯 ${subject.name} › ${chapterName} Practice Drill`,
    });
  };

  const openChapterDigest = (chapterName: string) => {
    const doc =
      subjectDigests.find((d) => d.title.includes(chapterName)) ||
      subjectDigests[0] ||
      SEE_DIGEST_LIST[0];
    setSelectedPdf(doc);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/student-dashboard" className="hover:text-foreground transition-colors">
            SEE Home
          </Link>
          <ChevronRight size={13} />
          <Link href="/subjects" className="hover:text-foreground transition-colors">
            Subjects
          </Link>
          <ChevronRight size={13} />
          <span className="font-bold text-foreground">{subject.name}</span>
        </div>

        {/* Subject Hero Header */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white border border-slate-700/50 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-3 z-10 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-3xl">{subject.icon}</span>
              <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-white/10 border border-white/15 font-mono">
                {subject.chapters.length} CHAPTERS • NEB BOARD SYLLABUS
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
              {subject.name}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
              Complete video lectures, formula sheets, step-by-step board question bank, and timed chapter mock tests.
            </p>

            <div className="flex items-center gap-3 pt-1">
              <div className="flex-1 max-w-xs h-2.5 rounded-full bg-black/40 overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full" style={{ width: '68%' }} />
              </div>
              <span className="text-xs font-mono font-black text-emerald-300">
                68% Mastered
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 z-10 w-full md:w-auto">
            <button
              onClick={() => startChapterPractice(subject.chapters[0]?.name || 'Unit 1')}
              className="px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Sparkles size={16} />
              <span>START CHAPTER 1 PRACTICE</span>
            </button>
          </div>
        </div>

        {/* 4-Pillar Universal Subsystem Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/lecture-videos"
            className="p-4 rounded-2xl bg-card border border-border hover:border-blue-500 hover:shadow-md transition-all flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Play size={18} />
            </div>
            <div>
              <h4 className="text-xs font-black text-foreground group-hover:text-blue-600">
                📚 LEARN
              </h4>
              <p className="text-[11px] text-muted-foreground">Video Lessons</p>
            </div>
          </Link>

          <Link
            href="/see/question-bank"
            className="p-4 rounded-2xl bg-card border border-border hover:border-amber-500 hover:shadow-md transition-all flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <FileText size={18} />
            </div>
            <div>
              <h4 className="text-xs font-black text-foreground group-hover:text-amber-600">
                📖 REVISE
              </h4>
              <p className="text-[11px] text-muted-foreground">Formula Digests</p>
            </div>
          </Link>

          <Link
            href="/see/question-bank"
            className="p-4 rounded-2xl bg-card border border-border hover:border-emerald-500 hover:shadow-md transition-all flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <HelpCircle size={18} />
            </div>
            <div>
              <h4 className="text-xs font-black text-foreground group-hover:text-emerald-600">
                🧠 PRACTICE
              </h4>
              <p className="text-[11px] text-muted-foreground">Question Bank</p>
            </div>
          </Link>

          <Link
            href="/mock-tests"
            className="p-4 rounded-2xl bg-card border border-border hover:border-purple-500 hover:shadow-md transition-all flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Award size={18} />
            </div>
            <div>
              <h4 className="text-xs font-black text-foreground group-hover:text-purple-600">
                📝 TEST
              </h4>
              <p className="text-[11px] text-muted-foreground">Mock Exams</p>
            </div>
          </Link>
        </div>

        {/* Chapter Workspace Directory */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-black text-foreground flex items-center gap-2">
              <Target size={18} className="text-emerald-500" />
              <span>Chapters &amp; Units in {subject.name}</span>
            </h3>
            <span className="text-xs text-muted-foreground font-mono">
              {subject.chapters.length} Units Total
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subject.chapters.map((chapter: { name: string; subtopics: string[] }, idx: number) => {
              const chapterQs = subjectQuestions.filter((q) => q.chapter === chapter.name);
              const chapterSlug = 'unit-' + (idx + 1);
              return (
                <div
                  key={idx}
                  className="p-5 sm:p-6 rounded-3xl bg-card border border-border hover:border-emerald-500/50 hover:shadow-lg transition-all space-y-4 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-mono">
                          Unit {idx + 1}
                        </span>
                        <span className="text-xs font-mono text-muted-foreground">
                          {chapterQs.length > 0 ? chapterQs.length : 12} Questions
                        </span>
                      </div>
                      <h4 className="text-base font-black text-foreground">
                        {chapter.name}
                      </h4>
                    </div>

                    <Link
                      href={`/subjects/${subject.id}/${chapterSlug}`}
                      className="p-2 rounded-xl bg-muted/60 hover:bg-emerald-500 hover:text-white text-muted-foreground transition-all"
                      title="Open Chapter Workspace"
                    >
                      <ChevronRight size={18} />
                    </Link>
                  </div>

                  {/* Subtopics List */}
                  {chapter.subtopics && chapter.subtopics.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {chapter.subtopics.map((sub: string, sIdx: number) => (
                        <span
                          key={sIdx}
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-muted/50 text-muted-foreground font-medium"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 4 Action Pills per Chapter */}
                  <div className="grid grid-cols-4 gap-2 pt-2 border-t border-border/50">
                    <Link
                      href="/lecture-videos"
                      className="p-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 text-center text-[11px] font-black flex flex-col items-center gap-1 transition-colors"
                    >
                      <Play size={12} />
                      <span>Learn</span>
                    </Link>

                    <button
                      onClick={() => openChapterDigest(chapter.name)}
                      className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 text-center text-[11px] font-black flex flex-col items-center gap-1 transition-colors"
                    >
                      <FileText size={12} />
                      <span>Revise</span>
                    </button>

                    <button
                      onClick={() => startChapterPractice(chapter.name)}
                      className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 text-center text-[11px] font-black flex flex-col items-center gap-1 transition-colors"
                    >
                      <HelpCircle size={12} />
                      <span>Practice</span>
                    </button>

                    <Link
                      href="/mock-tests"
                      className="p-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 text-center text-[11px] font-black flex flex-col items-center gap-1 transition-colors"
                    >
                      <Award size={12} />
                      <span>Test</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Interactive Practice Modal */}
      {practiceSession && (
        <SeePracticeSessionModal
          questions={practiceSession.questions}
          sessionTitle={practiceSession.title}
          onClose={() => setPracticeSession(null)}
        />
      )}

      {/* PDF Digest Viewer Modal */}
      {selectedPdf && (
        <SeePdfViewerModal
          digest={selectedPdf}
          onClose={() => setSelectedPdf(null)}
          userName="SEE Scholar"
        />
      )}
    </DashboardLayout>
  );
}
