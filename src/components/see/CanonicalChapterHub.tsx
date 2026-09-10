'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Play,
  FileText,
  HelpCircle,
  Award,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  BookOpen,
  Share2,
  Zap,
  Eye,
  Download,
  AlertTriangle,
  Loader2,
  Video,
  X,
} from 'lucide-react';
import { SEE_SUBJECT_HIERARCHY, SEE_QUESTION_BANK, SeeQuestion } from '@/lib/data/seeQuestionBankData';
import { SEE_DIGEST_LIST, SeeDigestItem } from '@/lib/data/seeDigestData';
import SeeQuestionCard2 from '@/components/see/SeeQuestionCard2';
import SeePracticeSessionModal from '@/components/see/SeePracticeSessionModal';
import SeePdfViewerModal from '@/components/see/SeePdfViewerModal';
import MathRenderer from '@/components/common/MathRenderer';
import BunnyHlsPlayer from '@/components/video/BunnyHlsPlayer';

interface CanonicalChapterHubProps {
  subjectId: string;
  chapterId: string;
}

interface BunnyVideo {
  id: string;
  guid: string;
  title: string;
  rawTitle: string;
  subject: string;
  collectionName: string;
  duration: number;
  thumbnailUrl: string;
  videoUrl: string;
  embedUrl: string;
}

export default function CanonicalChapterHub({ subjectId, chapterId }: CanonicalChapterHubProps) {
  const [activeTab, setActiveTab] = useState<'learn' | 'revise' | 'practice' | 'test'>('practice');
  const [selectedMark, setSelectedMark] = useState<number | 'all'>('all');
  const [practiceModalOpen, setPracticeModalOpen] = useState<boolean>(false);
  const [selectedPdf, setSelectedPdf] = useState<SeeDigestItem | null>(null);
  
  // Bunny Stream Videos
  const [bunnyVideos, setBunnyVideos] = useState<BunnyVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState<boolean>(false);
  const [activePlayVideo, setActivePlayVideo] = useState<BunnyVideo | null>(null);

  // Identify Subject & Chapter
  const subject =
    SEE_SUBJECT_HIERARCHY.find((s) => s.id === subjectId) || SEE_SUBJECT_HIERARCHY[0];

  const chapterIndex = subject.chapters.findIndex(
    (c, idx) => ('unit-' + (idx + 1)) === chapterId || c.name.toLowerCase().includes(chapterId.toLowerCase())
  );
  const currentChapter =
    chapterIndex !== -1 ? subject.chapters[chapterIndex] : subject.chapters[0];

  // Fetch Bunny videos
  useEffect(() => {
    async function fetchChapterVideos() {
      try {
        setLoadingVideos(true);
        const res = await fetch('/api/bunny/videos');
        if (res.ok) {
          const data = await res.json();
          setBunnyVideos(data.videos || []);
        }
      } catch (e) {
        console.error('Error fetching videos:', e);
      } finally {
        setLoadingVideos(false);
      }
    }
    fetchChapterVideos();
  }, []);

  // Filter Bunny videos for this specific subject and chapter
  const matchedChapterVideos = bunnyVideos.filter((v) => {
    const isMatchingSubject =
      v.subject === subject.id ||
      (subject.id === 'science' && v.subject === 'science') ||
      (subject.id === 'math' && v.subject === 'math') ||
      (subject.id === 'opt_math' && v.subject === 'opt_math') ||
      (subject.id === 'english' && v.subject === 'english') ||
      (subject.id === 'social' && v.subject === 'social_studies') ||
      (subject.id === 'social_studies' && v.subject === 'social_studies');
    const isMatchingChapter =
      v.title.toLowerCase().includes(currentChapter.name.toLowerCase()) ||
      v.rawTitle.toLowerCase().includes(currentChapter.name.toLowerCase()) ||
      (currentChapter.subtopics && currentChapter.subtopics.some(st => v.title.toLowerCase().includes(st.toLowerCase())));
    return isMatchingSubject && (isMatchingChapter || v.collectionName.toLowerCase().includes(subject.id));
  });

  const displayVideos = matchedChapterVideos.length > 0 ? matchedChapterVideos.slice(0, 6) : bunnyVideos.filter(v => v.subject === subject.id).slice(0, 4);

  // Questions for this specific chapter
  const chapterQuestions = SEE_QUESTION_BANK.filter(
    (q) => q.subject === subject.id && (q.chapter === currentChapter.name || q.chapter.includes(currentChapter.name))
  );
  const filteredQuestions =
    selectedMark === 'all'
      ? chapterQuestions
      : chapterQuestions.filter((q) => q.marks === selectedMark);

  // Digest for this chapter
  const chapterDigest =
    SEE_DIGEST_LIST.find((d) => d.subject === subject.id && d.title.includes(currentChapter.name)) ||
    SEE_DIGEST_LIST.find((d) => d.subject === subject.id) ||
    SEE_DIGEST_LIST[0];

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0m';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        
        {/* Breadcrumb Context Preserved */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/student-dashboard" className="hover:text-foreground transition-colors">
            SEE Home
          </Link>
          <ChevronRight size={13} />
          <Link href="/subjects" className="hover:text-foreground transition-colors">
            Subjects
          </Link>
          <ChevronRight size={13} />
          <Link href={`/see/subject/${subject.id}`} className="hover:text-foreground transition-colors">
            {subject.name}
          </Link>
          <ChevronRight size={13} />
          <span className="font-bold text-foreground">{currentChapter.name}</span>
        </div>

        {/* Chapter Master Hero Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-950 text-white border border-emerald-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-2xl">{subject.icon}</span>
              <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                {subject.name} • UNIT {chapterIndex !== -1 ? chapterIndex + 1 : 1}
              </span>
              <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                <Clock size={13} /> {chapterQuestions.length} Questions
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {currentChapter.name}
            </h1>

            {currentChapter.subtopics && currentChapter.subtopics.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {currentChapter.subtopics.map((st, i) => (
                  <span
                    key={i}
                    className="text-[11px] px-2.5 py-0.5 rounded-md bg-white/10 text-slate-200 border border-white/10"
                  >
                    {st}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
            <button
              onClick={() => setPracticeModalOpen(true)}
              className="w-full md:w-auto px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Sparkles size={16} />
              <span>START CHAPTER PRACTICE</span>
            </button>
          </div>
        </div>

        {/* In-Page Video Player Modal when active */}
        {activePlayVideo && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <div className="bg-card border border-border rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl space-y-4 my-auto">
              <div className="p-4 bg-muted/60 border-b border-border flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-blue-600 font-mono">
                    Bunny HD Video Stream
                  </span>
                  <h3 className="text-sm sm:text-base font-black text-foreground">{activePlayVideo.title}</h3>
                </div>
                <button
                  onClick={() => setActivePlayVideo(null)}
                  className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="bg-black">
                <BunnyHlsPlayer
                  videoUrl={activePlayVideo.videoUrl}
                  thumbnailUrl={activePlayVideo.thumbnailUrl}
                  title={activePlayVideo.title}
                />
              </div>
            </div>
          </div>
        )}

        {/* 4-Pillar Mode Switcher Bar */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-muted/60 border border-border overflow-x-auto">
          {[
            { id: 'learn' as const, label: '📚 1. LEARN (Lectures)', icon: Play },
            { id: 'revise' as const, label: '📖 2. REVISE (Formulas)', icon: FileText },
            { id: 'practice' as const, label: '🧠 3. PRACTICE (Questions)', icon: HelpCircle },
            { id: 'test' as const, label: '📝 4. TEST (Mock Exam)', icon: Award },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card/60'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* TAB 1: LEARN (Lectures & Videos from Bunny Stream Library) */}
        {activeTab === 'learn' && (
          <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-xs space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-base font-black text-foreground flex items-center gap-2">
                  <Video size={18} className="text-blue-500" />
                  <span>Video Lessons &amp; Playlist for {currentChapter.name}</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Streaming directly from Bunny HD CDN with step-by-step teacher explanations.
                </p>
              </div>
              <Link
                href="/lecture-videos"
                className="text-xs font-bold text-emerald-600 hover:underline"
              >
                All {bunnyVideos.length} Lectures →
              </Link>
            </div>

            {loadingVideos ? (
              <div className="py-12 text-center space-y-2">
                <Loader2 size={28} className="animate-spin text-emerald-500 mx-auto" />
                <p className="text-xs text-muted-foreground font-mono">Loading chapter video playlist...</p>
              </div>
            ) : displayVideos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayVideos.map((v, i) => (
                  <div
                    key={v.id || i}
                    className="p-5 rounded-2xl bg-muted/40 border border-border hover:border-emerald-500 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                        <Play size={18} />
                      </div>
                      <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600">
                        {formatDuration(v.duration)}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-foreground leading-snug">{v.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5 font-mono">📂 {v.collectionName}</p>
                    </div>
                    <button
                      onClick={() => setActivePlayVideo(v)}
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs text-center flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
                    >
                      <Play size={14} />
                      <span>Stream Video Lecture</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-muted/30 border border-border text-center space-y-2">
                <p className="text-xs text-muted-foreground">No specific videos uploaded for this chapter yet.</p>
                <Link href="/lecture-videos" className="text-xs font-bold text-emerald-600 hover:underline">
                  Browse All 292 Video Lectures →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: REVISE (Formulas & Digests) */}
        {activeTab === 'revise' && (
          <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-xs space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-base font-black text-foreground">
                  Formula Booklet &amp; Rapid Revision Capsule
                </h3>
                <p className="text-xs text-muted-foreground">
                  Verified cheat-sheets, theorem proofs, and essential board equations.
                </p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 font-mono">
                    {chapterDigest.category}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">
                    {chapterDigest.pageCount} Pages • High-Yield
                  </span>
                </div>
                <h4 className="text-base font-black text-foreground">
                  {chapterDigest.title}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {chapterDigest.description}
                </p>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                <button
                  onClick={() => setSelectedPdf(chapterDigest)}
                  className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                >
                  <Eye size={15} />
                  <span>READ IN-APP NOW</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PRACTICE (Questions & Solutions) */}
        {activeTab === 'practice' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Filter by Marks Rail */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-card border border-border shadow-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground mr-1">Filter Marks:</span>
                {[
                  { id: 'all' as const, label: 'All Marks' },
                  { id: 1, label: '① 1 Mark (Very Short)' },
                  { id: 2, label: '② 2 Marks (Short Answer)' },
                  { id: 3, label: '③ 3 Marks (Problem Solving)' },
                  { id: 4, label: '④ 4 Marks (Long/HOTS)' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMark(m.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                      selectedMark === m.id
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-muted/60 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setPracticeModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
              >
                <Sparkles size={14} />
                <span>Interactive Practice Session ({filteredQuestions.length} Qs)</span>
              </button>
            </div>

            {/* Questions List with KaTeX math and Step Solutions */}
            <div className="space-y-4">
              {filteredQuestions.length > 0 ? (
                filteredQuestions.map((q, idx) => (
                  <SeeQuestionCard2
                    key={q.id}
                    question={q}
                    index={idx}
                  />
                ))
              ) : (
                <div className="p-8 rounded-3xl bg-card border border-border text-center space-y-2">
                  <p className="text-sm font-bold text-foreground">
                    No questions match the selected mark filter.
                  </p>
                  <button
                    onClick={() => setSelectedMark('all')}
                    className="text-xs font-bold text-emerald-600 hover:underline"
                  >
                    Reset to All Marks
                  </button>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 4: TEST (Mock Exam) */}
        {activeTab === 'test' && (
          <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-xs space-y-6 animate-fade-in">
            <div className="space-y-1">
              <h3 className="text-base font-black text-foreground">
                Chapter Mastery Assessment (20 Minutes)
              </h3>
              <p className="text-xs text-muted-foreground">
                Timed 20-mark chapter test following official NEB Board grading patterns.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-purple-500/5 border border-purple-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1 max-w-xl">
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 font-mono">
                  TIMED TEST • 20 MARKS
                </span>
                <h4 className="text-base font-black text-foreground">
                  {currentChapter.name} — Unit Assessment Test
                </h4>
                <p className="text-xs text-muted-foreground">
                  Evaluates your speed, accuracy, and step-wise formula execution.
                </p>
              </div>

              <Link
                href="/mock-tests"
                className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 shrink-0"
              >
                <Award size={15} />
                <span>START ASSESSMENT NOW</span>
              </Link>
            </div>
          </div>
        )}

      </div>

      {/* Interactive In-Session Practice Modal */}
      {practiceModalOpen && (
        <SeePracticeSessionModal
          questions={filteredQuestions.length > 0 ? filteredQuestions : chapterQuestions}
          sessionTitle={`🎯 ${subject.name} › ${currentChapter.name} Practice Session`}
          onClose={() => setPracticeModalOpen(false)}
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
