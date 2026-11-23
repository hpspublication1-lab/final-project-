'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trophy, Sparkles } from 'lucide-react';
import VisualPlayerShell from '@/components/visual/VisualPlayerShell';
import { type VisualAssetManifest } from '@/lib/cee/visual/manifestSchema';
import { type PracticeQuestion } from '@/components/visual/VisualQuizCard';

interface VisualLessonClientProps {
  lesson: {
    lessonId: string;
    title: string;
    slug: string;
    subject: string;
    chapter: string;
    topic: string;
    objectives: string[];
    manifest: VisualAssetManifest;
    practiceQuestions: PracticeQuestion[];
  };
}

export default function VisualLessonClient({ lesson }: VisualLessonClientProps) {
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleProgressUpdate = (percentage: number, completed: boolean) => {
    setProgress(percentage);
    setIsCompleted(completed);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Breadcrumb & Progress Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur border-b border-slate-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/subjects"
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
              title="Return to CEE Syllabus"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span>{lesson.subject}</span>
                <span>/</span>
                <span>{lesson.chapter}</span>
              </div>
              <h1 className="text-sm md:text-base font-bold text-slate-100 line-clamp-1">
                {lesson.topic}
              </h1>
            </div>
          </div>

          {/* Real-Time Verified Progress Badge */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                {isCompleted && <Trophy className="w-3.5 h-3.5 text-amber-400" />}
                <span>Mastery Progress</span>
              </span>
              <div className="w-28 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-slate-800 text-emerald-400 font-mono font-bold text-xs border border-slate-700">
              {progress}%
            </div>
          </div>
        </div>
      </header>

      {/* Main Lesson Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        <VisualPlayerShell
          lessonId={lesson.lessonId}
          lessonTitle={lesson.title}
          objectives={lesson.objectives}
          manifest={lesson.manifest}
          practiceQuestions={lesson.practiceQuestions}
          onProgressUpdate={handleProgressUpdate}
        />
      </main>

      {/* Footer Notes */}
      <footer className="border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500">
        <p>
          Samyak Guru Visual Intelligence • Nepal Medical Education Commission (MEC) CEE Standard • Verified Curriculum
        </p>
      </footer>
    </div>
  );
}
