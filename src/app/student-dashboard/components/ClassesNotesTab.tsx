'use client';

import React from 'react';
import Link from 'next/link';
import {
  Search,
  BookOpen,
  ArrowRight,
  Video,
  FileText,
  Zap,
  ChevronDown,
  ChevronUp,
  PlayCircle,
  Download,
  Loader2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { CurriculumSubject } from '../types';

interface ClassesNotesTabProps {
  curriculumSubjects: CurriculumSubject[];
  selectedSubjectId: string;
  setSelectedSubjectId: (id: string) => void;
  chapterSearch: string;
  setChapterSearch: (search: string) => void;
  curriculumLoading: boolean;
  expandedChapterId: string | null;
  setExpandedChapterId: React.Dispatch<React.SetStateAction<string | null>>;
  setActiveVideo: (video: {
    id: string;
    title: string;
    videoUrl?: string;
    durationSec?: number;
  }) => void;
}

export default function ClassesNotesTab({
  curriculumSubjects,
  selectedSubjectId,
  setSelectedSubjectId,
  chapterSearch,
  setChapterSearch,
  curriculumLoading,
  expandedChapterId,
  setExpandedChapterId,
  setActiveVideo,
}: ClassesNotesTabProps) {
  const filteredCurriculumSubjects = curriculumSubjects.filter((s) => {
    if (selectedSubjectId === 'all') return true;
    return s.id === selectedSubjectId || s.name.toLowerCase() === selectedSubjectId.toLowerCase();
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="space-y-5"
    >
      {/* Subject Filters & Search Bar */}
      <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Subject Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedSubjectId('all')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
              selectedSubjectId === 'all'
                ? 'bg-primary text-white shadow-2xs'
                : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            All Subjects
          </button>
          {curriculumSubjects.map((sub) => {
            const isSelected = selectedSubjectId === sub.id;
            return (
              <button
                key={sub.id}
                onClick={() => setSelectedSubjectId(sub.id)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-primary text-white shadow-2xs'
                    : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {sub.displayName}
              </button>
            );
          })}
        </div>

        {/* Search Box */}
        <div className="relative sm:w-64 shrink-0">
          <Search size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search chapters or topics..."
            value={chapterSearch}
            onChange={(e) => setChapterSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-muted/30 border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Chapters & Content View */}
      {curriculumLoading ? (
        <div className="p-12 flex flex-col items-center justify-center space-y-3 bg-card border border-border/80 rounded-2xl">
          <Loader2 size={32} className="animate-spin text-primary" />
          <p className="text-xs font-bold text-muted-foreground">
            Fetching batch syllabus and lectures...
          </p>
        </div>
      ) : filteredCurriculumSubjects.length === 0 ? (
        <div className="p-8 text-center bg-card border border-border/80 rounded-2xl space-y-2">
          <BookOpen size={28} className="mx-auto text-muted-foreground/60" />
          <h4 className="text-sm font-bold text-foreground">No subjects found</h4>
          <p className="text-xs text-muted-foreground">
            Curriculum for this batch is syncing with the academic timetable.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredCurriculumSubjects.map((subject) => {
            const allChapters = subject.units.flatMap((u) => u.chapters);
            const filteredChapters = allChapters.filter((c) =>
              c.title.toLowerCase().includes(chapterSearch.toLowerCase())
            );

            if (filteredChapters.length === 0) return null;

            return (
              <div
                key={subject.id}
                className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4"
              >
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                      <BookOpen size={16} />
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-foreground">
                        {subject.displayName}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {filteredChapters.length} Chapters in Syllabus
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/subjects?subject=${encodeURIComponent(subject.name)}`}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    <span>Open Subject Portal</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>

                {/* Chapters Accordion List */}
                <div className="space-y-3">
                  {filteredChapters.map((chapter, chapIdx) => {
                    const isExpanded = expandedChapterId === chapter.id;
                    const videoLessons = chapter.lessons.filter(
                      (l) => l.type === 'recorded_video'
                    );
                    const noteLessons = chapter.lessons.filter(
                      (l) => l.type === 'pdf_note' || l.type === 'text_lesson'
                    );
                    const quizLessons = chapter.lessons.filter((l) => l.type === 'quiz');

                    return (
                      <div
                        key={chapter.id}
                        className={`border rounded-xl transition-all overflow-hidden ${
                          isExpanded
                            ? 'border-primary/50 bg-primary/5 shadow-2xs'
                            : 'border-border/70 bg-card hover:border-border'
                        }`}
                      >
                        {/* Chapter Header */}
                        <div
                          onClick={() =>
                            setExpandedChapterId(isExpanded ? null : chapter.id)
                          }
                          className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-lg bg-muted text-muted-foreground font-mono font-bold text-xs flex items-center justify-center shrink-0">
                              {chapIdx + 1}
                            </span>
                            <div>
                              <h4 className="text-xs sm:text-sm font-bold text-foreground">
                                {chapter.title}
                              </h4>
                              <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Video size={11} className="text-primary" />
                                  <span>{videoLessons.length} Lectures</span>
                                </span>
                                <span className="flex items-center gap-1">
                                  <FileText size={11} className="text-emerald-600 dark:text-emerald-400" />
                                  <span>{noteLessons.length} Notes</span>
                                </span>
                                <span className="flex items-center gap-1">
                                  <Zap size={11} className="text-amber-500" />
                                  <span>{quizLessons.length} DPP Quiz</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-auto">
                            <span className="text-xs font-bold text-primary flex items-center gap-1">
                              <span>{isExpanded ? 'Hide Content' : 'View Content'}</span>
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </span>
                          </div>
                        </div>

                        {/* Chapter Content Expanded */}
                        {isExpanded && (
                          <div className="p-4 pt-0 border-t border-border/40 space-y-3">
                            {chapter.lessons.length === 0 ? (
                              <p className="text-xs text-muted-foreground py-2">
                                Lectures and DPPs for this chapter are scheduled for this week.
                              </p>
                            ) : (
                              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3">
                                {chapter.lessons.map((lesson) => {
                                  const isVid = lesson.type === 'recorded_video';
                                  const isPdf = lesson.type === 'pdf_note' || lesson.type === 'text_lesson';

                                  return (
                                    <div
                                      key={lesson.id}
                                      className="p-3.5 rounded-xl bg-card border border-border/80 hover:border-primary/40 transition-all flex flex-col justify-between space-y-3 shadow-2xs"
                                    >
                                      <div className="space-y-1">
                                        <div className="flex items-center justify-between text-[10px]">
                                          <span
                                            className={`font-mono font-bold uppercase px-1.5 py-0.2 rounded ${
                                              isVid
                                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                                : isPdf
                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                            }`}
                                          >
                                            {isVid
                                              ? 'Video Lecture'
                                              : isPdf
                                              ? 'Class Notes'
                                              : 'Chapter DPP'}
                                          </span>
                                          {lesson.durationSec && (
                                            <span className="text-muted-foreground font-mono">
                                              {Math.round(lesson.durationSec / 60)}m
                                            </span>
                                          )}
                                        </div>
                                        <h5 className="text-xs font-bold text-foreground line-clamp-2">
                                          {lesson.title}
                                        </h5>
                                      </div>

                                      <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
                                        {isVid ? (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setActiveVideo({
                                                id: lesson.id,
                                                title: lesson.title,
                                                videoUrl: lesson.videoUrl,
                                                durationSec: lesson.durationSec,
                                              })
                                            }
                                            className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                                          >
                                            <PlayCircle size={14} />
                                            <span>Watch Lecture</span>
                                          </button>
                                        ) : isPdf ? (
                                          <a
                                            href={lesson.pdfUrl || `/free-resources`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                                          >
                                            <Download size={13} />
                                            <span>Open Notes</span>
                                          </a>
                                        ) : (
                                          <Link
                                            href={String(chapter.id).startsWith('other-') ? '/practice' : `/practice?chapter=${chapter.id}`}
                                            className="font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                                          >
                                            <Zap size={13} />
                                            <span>Solve DPP</span>
                                          </Link>
                                        )}

                                        <Link
                                          href={`/learn/${lesson.id}`}
                                          className="text-[11px] text-muted-foreground hover:text-foreground font-medium"
                                        >
                                          Full View &rarr;
                                        </Link>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
