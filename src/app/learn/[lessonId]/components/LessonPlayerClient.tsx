'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import BunnyHlsPlayer from '@/components/video/BunnyHlsPlayer';
import { useAuth } from '@/contexts/AuthContext';
import { useProgram } from '@/contexts/ProgramContext';
import {
  Play, Pause, ChevronLeft, ChevronRight, CheckCircle2, FileText,
  Download, ArrowRight, Clock, Sparkles, BookOpen, Loader2, Bookmark,
  MessageSquare, HelpCircle, Layers, Check, RotateCcw, RotateCw,
  ListVideo, Send, Trash2, Video, Radio, Zap, Shield, ExternalLink,
  Volume2, VolumeX, Maximize2, AlertCircle, X, FolderDown, Paperclip,
  Tv, Eye, EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';
import { FALLBACK_PRACTICE_QUESTIONS, FallbackQuestion } from '@/lib/data/practiceQuestionsFallback';

interface LessonPlayerClientProps {
  lessonId: string;
}

interface NoteItem {
  id: string;
  timeSec: number;
  text: string;
  createdAt: string;
}

export default function LessonPlayerClient({ lessonId }: LessonPlayerClientProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { program } = useProgram();

  const [loading, setLoading] = useState(true);
  const [curriculumData, setCurriculumData] = useState<any>(null);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [prevLesson, setPrevLesson] = useState<any>(null);
  const [nextLesson, setNextLesson] = useState<any>(null);

  // Playback & Security State
  const [signedVideoUrl, setSignedVideoUrl] = useState<string | null>(null);
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [requiresEnrollment, setRequiresEnrollment] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentPlaybackSec, setCurrentPlaybackSec] = useState(0);
  const [initialSeekSec, setInitialSeekSec] = useState(0);
  const [jumpToTime, setJumpToTime] = useState<number | undefined>(undefined);
  const [isCompleted, setIsCompleted] = useState(false);

  // Distraction-Free & Media UI State
  const [isTheatreMode, setIsTheatreMode] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [savedMistakes, setSavedMistakes] = useState<Record<string, boolean>>({});
  const [submittingDoubt, setSubmittingDoubt] = useState(false);

  // Playback Auto-Save Synchronization Refs (Guarantee 0-loss on reload/exit)
  const currentPlaybackSecRef = useRef(0);
  const videoDurationRef = useRef(0);
  const isCompletedRef = useRef(false);

  // Notes & Resources Drawer State — PW 5-Pillar Pedagogy
  const [activeTab, setActiveTab] = useState<'playlist' | 'dpp' | 'pdf_notes' | 'notes' | 'resources' | 'doubt'>('playlist');
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [doubtText, setDoubtText] = useState('');
  const [doubtSent, setDoubtSent] = useState(false);

  // Daily Practice Problems (DPP) State
  const [dppQuestions, setDppQuestions] = useState<FallbackQuestion[]>([]);
  const [dppAnswers, setDppAnswers] = useState<Record<string, string>>({});
  const [dppSubmitted, setDppSubmitted] = useState<Record<string, boolean>>({});
  const [dppScore, setDppScore] = useState<{ correct: number; incorrect: number; total: number; score: number }>({
    correct: 0,
    incorrect: 0,
    total: 0,
    score: 0,
  });

  // Load saved personal notes from localStorage for this lesson
  useEffect(() => {
    try {
      const savedNotes = localStorage.getItem(`samyak_notes_${lessonId}`);
      if (savedNotes) {
        setNotes(JSON.parse(savedNotes));
      } else {
        setNotes([]);
      }
    } catch {
      // Ignore storage errors
    }
  }, [lessonId]);

  // Fetch Curriculum & Active Lesson
  useEffect(() => {
    let isCancelled = false;

    async function fetchLessonData() {
      try {
        setLoading(true);
        setRequiresAuth(false);
        setRequiresEnrollment(false);
        setSignedVideoUrl(null);

        const res = await fetch(`/api/curriculum?course=${program || 'cee_medical'}&lessonId=${lessonId}`);
        if (!res.ok) throw new Error('Failed to load lesson curriculum');
        const data = await res.json();

        if (isCancelled) return;
        setCurriculumData(data);

        if (data.activeLesson?.lesson) {
          const l = data.activeLesson.lesson;
          setActiveLesson(l);
          setPrevLesson(data.activeLesson.prevLesson);
          setNextLesson(data.activeLesson.nextLesson);
          setIsCompleted(Boolean(l.isCompleted));

          // Fetch saved user playback position
          try {
            const progRes = await fetch(`/api/learn/progress?lessonId=${l.id}`);
            if (progRes.ok) {
              const progData = await progRes.json();
              if (progData.lastPlaybackPosition > 5) {
                setInitialSeekSec(progData.lastPlaybackPosition);
                setCurrentPlaybackSec(progData.lastPlaybackPosition);
              }
              if (progData.isCompleted) {
                setIsCompleted(true);
              }
            }
          } catch {
            // Non-blocking
          }

          // Fetch signed stream URL if video lecture or live replay
          if (l.type === 'recorded_video' || (l.type === 'live_class' && l.videoUrl)) {
            const signRes = await fetch(`/api/video/sign?video=${l.id}`);
            if (signRes.status === 401) {
              setRequiresAuth(true);
            } else if (signRes.status === 403) {
              setRequiresEnrollment(true);
            } else if (signRes.ok) {
              const signData = await signRes.json();
              setSignedVideoUrl(signData.url);
            } else {
              setSignedVideoUrl(l.videoUrl);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching lesson:', err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    fetchLessonData();
    return () => {
      isCancelled = true;
    };
  }, [lessonId, program]);

  // Sync refs to avoid stale closure issues during beforeunload / visibilitychange
  useEffect(() => {
    currentPlaybackSecRef.current = currentPlaybackSec;
  }, [currentPlaybackSec]);

  useEffect(() => {
    videoDurationRef.current = videoDuration;
  }, [videoDuration]);

  useEffect(() => {
    isCompletedRef.current = isCompleted;
  }, [isCompleted]);

  // Periodic Progress Auto-Save
  const saveProgress = useCallback(
    async (currentTime: number, totalDuration: number, markComplete = false) => {
      if (!activeLesson?.id || !user) return;
      try {
        await fetch('/api/learn/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lessonId: activeLesson.id,
            courseSlug: program || 'cee_medical',
            chapterId: activeLesson.chapterId,
            subjectId: activeLesson.subjectId,
            watchedSeconds: Math.floor(currentTime),
            lastPlaybackPosition: Math.floor(currentTime),
            totalDurationSec: Math.floor(totalDuration || activeLesson.durationSec || 0),
            isCompleted: markComplete || isCompleted,
          }),
        });
      } catch (err) {
        console.error('Progress sync error:', err);
      }
    },
    [activeLesson, user, program, isCompleted]
  );

  // Synchronous Beacon Flush on beforeunload & visibilitychange (Exit / Tab Hide)
  useEffect(() => {
    const syncPlaybackBeforeExit = () => {
      if (!activeLesson?.id || !user) return;
      const currentSec = Math.floor(currentPlaybackSecRef.current);
      if (currentSec <= 0) return;

      const payload = JSON.stringify({
        lessonId: activeLesson.id,
        courseSlug: program || 'cee_medical',
        chapterId: activeLesson.chapterId,
        subjectId: activeLesson.subjectId,
        watchedSeconds: currentSec,
        lastPlaybackPosition: currentSec,
        totalDurationSec: Math.floor(videoDurationRef.current || activeLesson.durationSec || 0),
        isCompleted: isCompletedRef.current,
      });

      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon('/api/learn/progress', new Blob([payload], { type: 'application/json' }));
      } else {
        fetch('/api/learn/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        syncPlaybackBeforeExit();
      }
    };

    window.addEventListener('beforeunload', syncPlaybackBeforeExit);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Periodic 10s auto-save timer
    const autoSaveInterval = setInterval(() => {
      if (currentPlaybackSecRef.current > 5) {
        saveProgress(currentPlaybackSecRef.current, videoDurationRef.current, isCompletedRef.current);
      }
    }, 10000);

    return () => {
      window.removeEventListener('beforeunload', syncPlaybackBeforeExit);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(autoSaveInterval);
      syncPlaybackBeforeExit();
    };
  }, [activeLesson?.id, user, program, saveProgress]);

  // High-Yield Lecture Key Milestones
  const lectureMilestones = React.useMemo(() => {
    const total = videoDuration || activeLesson?.durationSec || 1800;
    return [
      { sec: 0, label: '00:00 • Blueprint & Core Map' },
      { sec: Math.floor(total * 0.16), label: `${formatTime(Math.floor(total * 0.16))} • Concept Derivation` },
      { sec: Math.floor(total * 0.38), label: `${formatTime(Math.floor(total * 0.38))} • Model Exam Traps` },
      { sec: Math.floor(total * 0.62), label: `${formatTime(Math.floor(total * 0.62))} • CEE Past Questions` },
      { sec: Math.floor(total * 0.85), label: `${formatTime(Math.floor(total * 0.85))} • Formula Digest & Recap` },
    ];
  }, [videoDuration, activeLesson]);

  // Save DPP mistake directly to personal Galti Sudhar notebook
  const handleSaveToMistakeNotebook = async (q: FallbackQuestion) => {
    try {
      const res = await fetch('/api/flashcards/convert-mistake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          front: q.questionText,
          back: `Correct Answer: Option ${q.correctOption.toUpperCase()}\n\nConceptual Solution:\n${q.explanation}`,
          hint: `${q.chapterTitle} • High-Yield Trap`,
          topic: q.chapterTitle,
          subjectId: activeLesson?.subjectId,
          chapterId: activeLesson?.chapterId,
        }),
      });
      if (res.ok) {
        setSavedMistakes((prev) => ({ ...prev, [q.id]: true }));
        toast.success('Saved to your Galti Sudhar (Mistake Notebook)!');
      } else {
        toast.error('Could not save to mistake notebook');
      }
    } catch {
      toast.error('Network error saving mistake');
    }
  };

  // Submit Doubt to Senior Faculty
  const handleSubmitFacultyDoubt = async () => {
    if (!doubtText.trim() || !activeLesson?.id) return;
    try {
      setSubmittingDoubt(true);
      const res = await fetch('/api/doubts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${activeLesson.title} (at ${formatTime(currentPlaybackSec)})`,
          question_text: `[Timestamp: ${formatTime(currentPlaybackSec)}] ${doubtText.trim()}`,
          subject_id: activeLesson.subjectId,
        }),
      });
      if (res.ok) {
        setDoubtSent(true);
        setDoubtText('');
        toast.success('Doubt submitted to senior faculty mentor!');
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Failed to submit doubt');
      }
    } catch {
      toast.error('Network error submitting doubt');
    } finally {
      setSubmittingDoubt(false);
    }
  };

  const handleTimeUpdate = (time: number, duration: number) => {
    setCurrentPlaybackSec(time);
    setVideoDuration(duration);

    // If watched >= 90% and not marked completed yet, trigger auto-complete
    if (duration > 0 && time / duration >= 0.9 && !isCompleted) {
      setIsCompleted(true);
      saveProgress(time, duration, true);
      toast.success('🎉 Lesson marked as completed!');
    }
  };

  const toggleComplete = async () => {
    const nextState = !isCompleted;
    setIsCompleted(nextState);
    await saveProgress(currentPlaybackSec, videoDuration, nextState);
    toast.success(nextState ? 'Marked as completed' : 'Marked as incomplete');
  };

  // Note taking handler
  const handleAddNote = () => {
    if (!newNoteText.trim()) return;
    const item: NoteItem = {
      id: `note-${Date.now()}`,
      timeSec: Math.floor(currentPlaybackSec),
      text: newNoteText.trim(),
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    const updated = [item, ...notes];
    setNotes(updated);
    setNewNoteText('');
    try {
      localStorage.setItem(`samyak_notes_${lessonId}`, JSON.stringify(updated));
    } catch {}
    toast.success(`Note added at ${formatTime(item.timeSec)}`);
  };

  const handleDeleteNote = (noteId: string) => {
    const updated = notes.filter((n) => n.id !== noteId);
    setNotes(updated);
    try {
      localStorage.setItem(`samyak_notes_${lessonId}`, JSON.stringify(updated));
    } catch {}
    toast.success('Note removed');
  };

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Populate curriculum-aligned DPP questions for active lesson
  useEffect(() => {
    if (!activeLesson) return;
    const targetSubj = (activeLesson.subjectName || activeLesson.subjectId || program || '').toLowerCase();
    const targetChap = (activeLesson.chapterTitle || activeLesson.chapter_name || activeLesson.title || '').toLowerCase();

    const matched = FALLBACK_PRACTICE_QUESTIONS.filter((q) => {
      const qChap = q.chapterTitle.toLowerCase();
      const qSubj = q.subjectSlug.toLowerCase();
      const qDisplay = q.subjectDisplayName.toLowerCase();

      if (targetChap && (qChap.includes(targetChap) || targetChap.includes(qChap))) return true;
      if (targetSubj && (qSubj.includes(targetSubj) || qDisplay.includes(targetSubj) || targetSubj.includes(qSubj))) return true;
      return false;
    });

    const pool = matched.length >= 5 ? matched : FALLBACK_PRACTICE_QUESTIONS;
    const finalSet = pool.slice(0, 10);
    setDppQuestions(finalSet);
    setDppAnswers({});
    setDppSubmitted({});
    setDppScore({ correct: 0, incorrect: 0, total: finalSet.length, score: 0 });
  }, [activeLesson, program]);

  const handleSelectDppOption = (qId: string, option: 'a' | 'b' | 'c' | 'd', correctOption: string) => {
    if (dppSubmitted[qId]) return;

    const isCorrect = option === correctOption;
    const nextAnswers = { ...dppAnswers, [qId]: option };
    const nextSubmitted = { ...dppSubmitted, [qId]: true };

    setDppAnswers(nextAnswers);
    setDppSubmitted(nextSubmitted);

    let c = 0;
    let inc = 0;
    Object.entries(nextAnswers).forEach(([id, ans]) => {
      const q = dppQuestions.find((item) => item.id === id);
      if (q) {
        if (ans === q.correctOption) c++;
        else inc++;
      }
    });

    const netScore = Math.max(0, Math.round((c * 1.0 - inc * 0.25) * 100) / 100);
    setDppScore({
      correct: c,
      incorrect: inc,
      total: dppQuestions.length,
      score: netScore,
    });

    if (isCorrect) {
      toast.success('🎯 Correct Answer! +1.0 Mark');
    } else {
      toast.error(`✕ Incorrect (-0.25). Correct: Option ${correctOption.toUpperCase()}`);
    }
  };

  const handleResetDpp = () => {
    setDppAnswers({});
    setDppSubmitted({});
    setDppScore({ correct: 0, incorrect: 0, total: dppQuestions.length, score: 0 });
    toast.success('DPP Practice session reset');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
          <Loader2 size={36} className="animate-spin text-primary" />
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Loading Distraction-Free Study Workspace...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (!activeLesson) {
    return (
      <DashboardLayout>
        <div className="p-12 text-center max-w-md mx-auto space-y-4">
          <AlertCircle size={40} className="mx-auto text-amber-500" />
          <h2 className="text-lg font-bold text-foreground">Lesson Not Found</h2>
          <p className="text-xs text-muted-foreground">
            The requested lesson could not be loaded or may belong to another course track.
          </p>
          <Link href="/my-courses" className="btn-primary text-xs font-bold py-2.5 px-5 rounded-2xl inline-flex">
            Return to My Courses
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  // Find all resources belonging to the current chapter for the resources tab
  const chapterResources: any[] = [];
  if (curriculumData?.subjects) {
    curriculumData.subjects.forEach((sub: any) => {
      sub.units.forEach((unit: any) => {
        unit.chapters.forEach((chap: any) => {
          if (chap.id === activeLesson.chapterId) {
            chap.lessons.forEach((les: any) => {
              if (les.type === 'pdf_note' || les.pdfUrl) {
                chapterResources.push({
                  id: les.id,
                  title: les.title,
                  type: 'PDF Note Handout',
                  url: les.pdfUrl || '#',
                  isLocked: les.isLocked,
                });
              }
              if (les.type === 'external_resource' || les.externalUrl) {
                chapterResources.push({
                  id: les.id,
                  title: les.title,
                  type: 'Approved Reference / CDC Guide',
                  url: les.externalUrl || '#',
                  isLocked: les.isLocked,
                });
              }
            });
          }
        });
      });
    });
  }

  // Default syllabus & formula capsule resources if none in chapter
  if (chapterResources.length === 0) {
    chapterResources.push({
      id: 'default-syllabus-capsule',
      title: `${activeLesson.chapterTitle || 'Chapter'} — High-Yield Formula Sheet`,
      type: 'Official Handout',
      url: '/free-resources',
      isLocked: false,
    });
    chapterResources.push({
      id: 'default-cdc-spec',
      title: 'CDC Official Curriculum Grid & Marking Specification',
      type: 'Curriculum Blueprint',
      url: '/free-resources',
      isLocked: false,
    });
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Top Breadcrumbs & Previous/Next Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Link href="/my-courses" className="hover:text-primary transition-colors">
                My Courses
              </Link>
              <span>/</span>
              <Link
                href={`/subjects?course=${program || 'cee_medical'}`}
                className="hover:text-primary transition-colors"
              >
                {activeLesson.subjectDisplayName || 'Subject'}
              </Link>
              <span>/</span>
              <span className="text-foreground font-semibold truncate max-w-xs">
                {activeLesson.chapterTitle || 'Chapter'}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-black text-foreground tracking-tight flex items-center gap-2">
              <span>{activeLesson.title}</span>
              {isCompleted && (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 inline-flex items-center gap-1">
                  <CheckCircle2 size={11} /> Completed
                </span>
              )}
            </h1>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              onClick={() => setIsTheatreMode(!isTheatreMode)}
              className={`text-xs font-bold px-3 py-2 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                isTheatreMode
                  ? 'bg-primary text-white border-primary shadow-xs'
                  : 'bg-card text-muted-foreground border-border hover:text-foreground'
              }`}
              title="Toggle distraction-free theatre mode"
            >
              <Tv size={14} />
              <span className="hidden sm:inline">{isTheatreMode ? 'Exit Theatre' : 'Theatre Mode'}</span>
            </button>

            <button
              onClick={toggleComplete}
              className={`text-xs font-bold px-3 py-2 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                isCompleted
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-card text-muted-foreground border-border hover:text-foreground'
              }`}
            >
              <CheckCircle2 size={14} />
              <span className="hidden sm:inline">{isCompleted ? 'Completed' : 'Mark Complete'}</span>
            </button>

            {prevLesson && (
              <Link
                href={`/learn/${prevLesson.id}`}
                className="text-xs font-bold text-foreground bg-card hover:bg-muted/40 p-2 rounded-xl border border-border flex items-center gap-1 cursor-pointer"
                title={`Previous: ${prevLesson.title}`}
              >
                <ChevronLeft size={16} />
                <span className="hidden sm:inline">Prev</span>
              </Link>
            )}

            {nextLesson && (
              <Link
                href={`/learn/${nextLesson.id}`}
                className="btn-primary text-xs font-bold py-2 px-3.5 rounded-xl flex items-center gap-1 shadow-xs cursor-pointer"
                title={`Next: ${nextLesson.title}`}
              >
                <span className="hidden sm:inline">Next Lesson</span>
                <ChevronRight size={16} />
              </Link>
            )}
          </div>
        </div>

        {/* Main Distraction-Free Learning Layout */}
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* Left / Center Column: Dedicated Study Player */}
          <div className={`${isTheatreMode ? 'lg:col-span-12' : 'lg:col-span-8'} space-y-4 transition-all duration-300`}>
            {/* Player Container */}
            <div className="rounded-3xl overflow-hidden bg-black aspect-video border border-border shadow-md relative flex items-center justify-center">
              {/* LESSON TYPE 1: RECORDED VIDEO */}
              {activeLesson.type === 'recorded_video' && (
                requiresEnrollment ? (
                  <div className="p-8 text-center text-white space-y-4 max-w-md">
                    <Shield size={40} className="mx-auto text-amber-400" />
                    <h3 className="text-base font-bold">Premium Lesson Locked</h3>
                    <p className="text-xs text-white/80 leading-relaxed">
                      This lecture is part of the full curriculum. Enroll in your batch cohort to access 297+ HD masterclasses, formula sheets, and live problem sessions.
                    </p>
                    <Link href="/pricing" className="btn-primary text-xs font-bold py-3 px-6 rounded-2xl inline-flex">
                      Enroll to Unlock
                    </Link>
                  </div>
                ) : requiresAuth ? (
                  <div className="p-8 text-center text-white space-y-4 max-w-md">
                    <Shield size={40} className="mx-auto text-primary" />
                    <h3 className="text-base font-bold">Sign In Required</h3>
                    <p className="text-xs text-white/80 leading-relaxed">
                      Sign in to your Samyak Tutor account to stream this video and synchronize your progress.
                    </p>
                    <Link href="/login" className="btn-primary text-xs font-bold py-3 px-6 rounded-2xl inline-flex">
                      Sign In to Account
                    </Link>
                  </div>
                ) : signedVideoUrl ? (
                  <BunnyHlsPlayer
                    videoUrl={signedVideoUrl}
                    title={activeLesson.title}
                    thumbnailUrl={activeLesson.thumbnailUrl}
                    initialTime={initialSeekSec}
                    seekTo={jumpToTime}
                    onTimeUpdate={handleTimeUpdate}
                    onPause={(time) => {
                      saveProgress(time, videoDuration, isCompleted);
                    }}
                    onEnded={() => {
                      setIsCompleted(true);
                      saveProgress(videoDuration, videoDuration, true);
                    }}
                    className="w-full h-full"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-2 text-white">
                    <Loader2 size={30} className="animate-spin text-primary" />
                    <span className="text-xs font-bold">Preparing Secure Video Stream...</span>
                  </div>
                )
              )}

              {/* LESSON TYPE 2: LIVE CLASS */}
              {activeLesson.type === 'live_class' && (
                <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-4 text-white">
                  <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center animate-pulse">
                    <Radio size={32} />
                  </div>
                  <div className="space-y-1 max-w-sm">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                      Live Classroom
                    </span>
                    <h4 className="text-base font-bold mt-2">{activeLesson.title}</h4>
                    <p className="text-xs text-slate-400">
                      Interactive live class hosted on 100ms. Join with microphone &amp; chat to solve problems live with faculty.
                    </p>
                  </div>
                  <Link
                    href="/live-classes"
                    className="btn-primary text-xs font-bold py-3 px-6 rounded-2xl inline-flex items-center gap-2 shadow-lg"
                  >
                    <Radio size={14} />
                    <span>Join 100ms Live Classroom</span>
                  </Link>
                </div>
              )}

              {/* LESSON TYPE 3: TEXT LESSON */}
              {activeLesson.type === 'text_lesson' && (
                <div className="w-full h-full bg-card p-6 sm:p-8 overflow-y-auto text-foreground space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-border text-primary font-bold text-xs uppercase tracking-wider">
                    <FileText size={16} /> Theory Revision Notes
                  </div>
                  <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap font-sans">
                    {activeLesson.content || 'Comprehensive textbook concept notes and model exam breakdown for this chapter.'}
                  </div>
                </div>
              )}

              {/* LESSON TYPE 4: PDF NOTE */}
              {activeLesson.type === 'pdf_note' && (
                <div className="w-full h-full bg-card flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <FileText size={48} className="text-primary" />
                  <h4 className="text-base font-bold text-foreground">Lecture PDF Handout</h4>
                  <p className="text-xs text-muted-foreground max-w-sm">
                    Review formula sheets, textbook exercises, and verified model rubrics in the official handout.
                  </p>
                  {activeLesson.pdfUrl && (
                    <a
                      href={activeLesson.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary text-xs font-bold py-2.5 px-5 rounded-2xl flex items-center gap-2"
                    >
                      <Download size={14} />
                      <span>Download / Open PDF Handout</span>
                    </a>
                  )}
                </div>
              )}

              {/* LESSON TYPE 5: QUIZ */}
              {activeLesson.type === 'quiz' && (
                <div className="w-full h-full bg-card flex flex-col items-center justify-center p-6 text-center space-y-4 text-foreground">
                  <Zap size={44} className="text-amber-500" />
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-foreground">Chapter Practice Quiz</h4>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      Solve 10 high-yield questions to test your conceptual accuracy and identify weak traps.
                    </p>
                  </div>
                  <Link
                    href={`/practice?subject=${encodeURIComponent(activeLesson.subjectDisplayName || 'science')}`}
                    className="btn-primary text-xs font-bold py-2.5 px-6 rounded-2xl flex items-center gap-2"
                  >
                    <Play size={14} fill="currentColor" />
                    <span>Launch Quiz Session</span>
                  </Link>
                </div>
              )}

              {/* LESSON TYPE 6: ASSIGNMENT */}
              {activeLesson.type === 'assignment' && (
                <div className="w-full h-full bg-card flex flex-col items-center justify-center p-6 text-center space-y-4 text-foreground">
                  <BookOpen size={44} className="text-emerald-600" />
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-foreground">Subjective Handwritten Paper</h4>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      Write your derivation on paper, take a photo, and get step-by-step CDC marking rubric evaluation from our AI Vision Marker.
                    </p>
                  </div>
                  <Link
                    href="/vision-marker"
                    className="btn-primary text-xs font-bold py-2.5 px-6 rounded-2xl flex items-center gap-2"
                  >
                    <Sparkles size={14} />
                    <span>Open AI Vision Marker</span>
                  </Link>
                </div>
              )}

              {/* LESSON TYPE 7: EXTERNAL RESOURCE */}
              {activeLesson.type === 'external_resource' && (
                <div className="w-full h-full bg-card flex flex-col items-center justify-center p-6 text-center space-y-4 text-foreground">
                  <ExternalLink size={44} className="text-blue-500" />
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-foreground">Approved Curriculum Resource</h4>
                    <p className="text-xs text-muted-foreground max-w-sm">
                      Official Curriculum Development Centre (CDC) model question papers, syllabus specifications, and reference blueprints.
                    </p>
                  </div>
                  <a
                    href={activeLesson.externalUrl || '/free-resources'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary text-xs font-bold py-2.5 px-6 rounded-2xl flex items-center gap-2"
                  >
                    <ExternalLink size={14} />
                    <span>Open Approved Reference</span>
                  </a>
                </div>
              )}
            </div>

            {/* Interactive Lecture Timestamps & Key Concepts */}
            <div className="p-3.5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-[11px] font-black uppercase text-foreground tracking-wider font-mono">
                    Lecture Timestamps &amp; Key Concepts
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">
                  Playback: {formatTime(currentPlaybackSec)}
                </span>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {lectureMilestones.map((m, idx) => {
                  const isCurrent =
                    currentPlaybackSec >= m.sec &&
                    (idx === lectureMilestones.length - 1 || currentPlaybackSec < lectureMilestones[idx + 1].sec);
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setJumpToTime(m.sec);
                        toast.success(`Jumped to ${m.label}`);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-mono shrink-0 transition-all flex items-center gap-1.5 cursor-pointer border ${
                        isCurrent
                          ? 'bg-primary text-white border-primary font-bold shadow-xs'
                          : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted/80 hover:text-foreground'
                      }`}
                      title={`Click to seek to ${formatTime(m.sec)}`}
                    >
                      <Play size={10} fill="currentColor" />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PW-Style Daily Pedagogy Action Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => setActiveTab('dpp')}
                className="p-3.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center justify-between gap-2 transition-all cursor-pointer shadow-xs active:scale-98"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <Zap size={16} className="fill-current" />
                  </div>
                  <div className="text-left">
                    <p className="leading-tight">Today&apos;s DPP Practice</p>
                    <span className="text-[10px] text-muted-foreground font-normal">10 Post-Lecture MCQs</span>
                  </div>
                </div>
                <ChevronRight size={16} />
              </button>

              <button
                onClick={() => setActiveTab('pdf_notes')}
                className="p-3.5 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-between gap-2 transition-all cursor-pointer shadow-xs active:scale-98"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <FileText size={16} />
                  </div>
                  <div className="text-left">
                    <p className="leading-tight">Class Notes PDF</p>
                    <span className="text-[10px] text-muted-foreground font-normal">Smartboard Slides Deck</span>
                  </div>
                </div>
                <Download size={15} />
              </button>

              <button
                onClick={() => setActiveTab('doubt')}
                className="p-3.5 rounded-2xl bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary font-bold text-xs flex items-center justify-between gap-2 transition-all cursor-pointer shadow-xs active:scale-98"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center">
                    <MessageSquare size={16} />
                  </div>
                  <div className="text-left">
                    <p className="leading-tight">Ask Doubt on Timestamp</p>
                    <span className="text-[10px] text-muted-foreground font-normal">at {formatTime(currentPlaybackSec)}</span>
                  </div>
                </div>
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Teacher Information Card */}
            <div className="p-5 rounded-3xl bg-card border border-border/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm shrink-0">
                  {curriculumData?.batch?.instructor_name?.[0] || 'S'}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    {curriculumData?.batch?.instructor_name || 'Samyak Senior Faculty'}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Senior Subject Specialist · Batch: <span className="font-semibold text-foreground">{curriculumData?.batch?.title}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('doubt')}
                className="text-xs font-bold text-primary px-3.5 py-2 rounded-xl border border-primary/30 hover:bg-primary/5 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <MessageSquare size={13} />
                <span>Ask Faculty Doubt</span>
              </button>
            </div>
          </div>

          {/* Right Column: Playlist, DPP, Notes, Resources, and Doubts Drawer */}
          <div className={`${isTheatreMode ? 'lg:col-span-12' : 'lg:col-span-4'} bg-card border border-border/80 rounded-3xl overflow-hidden shadow-sm flex flex-col ${isTheatreMode ? 'min-h-[500px]' : 'h-[640px]'} transition-all duration-300`}>
            {/* Tab Headers — PW 5-Pillar Architecture */}
            <div className="flex items-center border-b border-border/80 p-1.5 bg-muted/20 overflow-x-auto gap-1">
              <button
                onClick={() => setActiveTab('playlist')}
                className={`py-2 px-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 shrink-0 cursor-pointer ${
                  activeTab === 'playlist' ? 'bg-card text-primary shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <ListVideo size={13} />
                <span>Playlist</span>
              </button>
              <button
                onClick={() => setActiveTab('dpp')}
                className={`py-2 px-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 shrink-0 cursor-pointer ${
                  activeTab === 'dpp' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-black shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Zap size={13} className="fill-current text-amber-500" />
                <span>DPP ({dppQuestions.length})</span>
                {dppScore.correct > 0 && (
                  <span className="text-[10px] bg-emerald-500 text-white px-1 rounded-full ml-0.5">
                    {dppScore.correct}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('pdf_notes')}
                className={`py-2 px-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 shrink-0 cursor-pointer ${
                  activeTab === 'pdf_notes' ? 'bg-card text-blue-600 shadow-xs font-bold' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <FileText size={13} />
                <span>PDF Notes</span>
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                className={`py-2 px-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 shrink-0 cursor-pointer ${
                  activeTab === 'notes' ? 'bg-card text-primary shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Bookmark size={13} />
                <span>Notes ({notes.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('doubt')}
                className={`py-2 px-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 shrink-0 cursor-pointer ${
                  activeTab === 'doubt' ? 'bg-card text-primary shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <HelpCircle size={13} />
                <span>Doubts</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* 1. PLAYLIST TAB */}
              {activeTab === 'playlist' && (
                <div className="space-y-4">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Chapter Curriculum Tree
                  </div>

                  {(curriculumData?.subjects || []).map((sub: any) => (
                    <div key={sub.id} className="space-y-2">
                      <h4 className="text-xs font-black text-foreground">{sub.displayName}</h4>
                      {sub.units.map((unit: any) => (
                        <div key={unit.id} className="space-y-1.5 pl-2 border-l-2 border-border">
                          {unit.chapters.map((chap: any) => (
                            <div key={chap.id} className="space-y-1">
                              <span className="text-[11px] font-bold text-muted-foreground block">
                                {chap.title}
                              </span>
                              <div className="space-y-1 pl-1">
                                {chap.lessons.map((les: any) => {
                                  const isCurrent = les.id === activeLesson.id;
                                  return (
                                    <Link
                                      key={les.id}
                                      href={`/learn/${les.id}`}
                                      className={`p-2.5 rounded-xl text-xs font-medium flex items-center justify-between gap-2 transition-all block cursor-pointer ${
                                        isCurrent
                                          ? 'bg-primary/10 text-primary font-bold border border-primary/30'
                                          : 'hover:bg-muted/40 text-foreground'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 truncate">
                                        {les.type === 'recorded_video' && <Play size={12} fill="currentColor" />}
                                        {les.type === 'live_class' && <Radio size={12} className="text-red-500" />}
                                        {les.type === 'text_lesson' && <FileText size={12} />}
                                        {les.type === 'pdf_note' && <Download size={12} />}
                                        {les.type === 'quiz' && <Zap size={12} className="text-amber-500" />}
                                        {les.type === 'assignment' && <Sparkles size={12} className="text-emerald-500" />}
                                        {les.type === 'external_resource' && <ExternalLink size={12} className="text-blue-500" />}
                                        <span className="truncate">{les.title}</span>
                                      </div>
                                      {les.isCompleted && (
                                        <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                                      )}
                                    </Link>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {/* 2. DPP TAB — PHYSICS WALLAH STYLE POST-LECTURE DAILY PRACTICE PROBLEMS */}
              {activeTab === 'dpp' && (
                <div className="space-y-4">
                  {/* DPP Header Banner */}
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-mono">
                        DAILY PRACTICE PROBLEMS (DPP)
                      </span>
                      <button
                        onClick={handleResetDpp}
                        className="text-[10px] font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw size={10} />
                        <span>Reset Drill</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <h4 className="text-xs font-black text-foreground">
                          {activeLesson.chapterTitle || activeLesson.title}
                        </h4>
                        <p className="text-[10px] text-muted-foreground">
                          {dppQuestions.length} High-Yield Concept Drill Questions
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-amber-600 font-mono">
                          {dppScore.score > 0 ? `+${dppScore.score.toFixed(2)}` : dppScore.score.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-muted-foreground block font-mono">
                          {dppScore.correct}/{dppQuestions.length} Solved
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-muted/60 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-500 h-full transition-all duration-300"
                        style={{
                          width: `${(Object.keys(dppSubmitted).length / Math.max(1, dppQuestions.length)) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-muted-foreground font-mono">
                      <span>+1.0 Correct · -0.25 Incorrect (CEE Standard)</span>
                      <span>{Object.keys(dppSubmitted).length} of {dppQuestions.length} Answered</span>
                    </div>
                  </div>

                  {/* Questions List */}
                  <div className="space-y-3">
                    {dppQuestions.map((q, qIdx) => {
                      const isAnswered = Boolean(dppSubmitted[q.id]);
                      const userChoice = dppAnswers[q.id];
                      const isUserCorrect = userChoice === q.correctOption;

                      return (
                        <div
                          key={q.id}
                          className={`p-3.5 rounded-2xl border transition-all text-xs space-y-2.5 ${
                            isAnswered
                              ? isUserCorrect
                                ? 'bg-emerald-500/5 border-emerald-500/30'
                                : 'bg-rose-500/5 border-rose-500/30'
                              : 'bg-card border-border/80 hover:border-primary/40'
                          }`}
                        >
                          {/* Question Header */}
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-mono font-bold text-primary text-[10px] px-1.5 py-0.5 rounded-md bg-primary/10 shrink-0">
                              Q{qIdx + 1}
                            </span>
                            <p className="text-foreground font-medium flex-1 leading-snug">
                              {q.questionText}
                            </p>
                          </div>

                          {/* 4 Options Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                            {(['a', 'b', 'c', 'd'] as const).map((opt) => {
                              const optText =
                                opt === 'a' ? q.optionA :
                                opt === 'b' ? q.optionB :
                                opt === 'c' ? q.optionC : q.optionD;

                              const isSelected = userChoice === opt;
                              const isThisCorrect = q.correctOption === opt;

                              let optStyle = 'bg-muted/40 border-border text-foreground hover:bg-muted/80';
                              if (isAnswered) {
                                if (isThisCorrect) {
                                  optStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold';
                                } else if (isSelected && !isThisCorrect) {
                                  optStyle = 'bg-rose-500/20 border-rose-500 text-rose-700 dark:text-rose-300 line-through';
                                } else {
                                  optStyle = 'opacity-50 border-border text-muted-foreground';
                                }
                              }

                              return (
                                <button
                                  key={opt}
                                  onClick={() => handleSelectDppOption(q.id, opt, q.correctOption)}
                                  disabled={isAnswered}
                                  className={`p-2 rounded-xl border text-[11px] text-left flex items-start gap-1.5 transition-all cursor-pointer ${optStyle}`}
                                >
                                  <span className="font-mono font-bold uppercase shrink-0 text-[10px] w-4">
                                    {opt})
                                  </span>
                                  <span className="leading-tight flex-1">{optText}</span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Explanation & Solution */}
                          {isAnswered && (
                            <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 text-[11px] space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-primary flex items-center gap-1 text-[10px] uppercase font-mono">
                                  <Sparkles size={11} /> Conceptual Explanation:
                                </span>
                                <button
                                  onClick={() => handleSaveToMistakeNotebook(q)}
                                  disabled={savedMistakes[q.id]}
                                  className={`text-[10px] font-bold py-1 px-2.5 rounded-lg border flex items-center gap-1 transition-all cursor-pointer ${
                                    savedMistakes[q.id]
                                      ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30 font-bold'
                                      : 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
                                  }`}
                                  title="Add to your personal mistake notebook for spaced revision"
                                >
                                  <Bookmark size={11} className={savedMistakes[q.id] ? 'fill-emerald-600' : ''} />
                                  <span>{savedMistakes[q.id] ? 'In Galti Sudhar ✓' : 'Save to Galti Sudhar'}</span>
                                </button>
                              </div>
                              <p className="text-muted-foreground leading-relaxed">{q.explanation}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. PDF NOTES TAB — CLASS SMARTBOARD NOTES */}
              {activeTab === 'pdf_notes' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <FileText size={20} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 font-mono">
                          LECTURE SMARTBOARD SLIDES
                        </span>
                        <h4 className="text-xs font-black text-foreground truncate">
                          {activeLesson.title} — Master Class Slides
                        </h4>
                        <p className="text-[10px] text-muted-foreground">
                          Complete handwritten derivations, board diagrams &amp; formula digests
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        onClick={() => setShowPdfPreview(!showPdfPreview)}
                        className="py-2.5 px-3.5 rounded-xl text-xs font-bold bg-card border border-border hover:bg-muted text-foreground flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        {showPdfPreview ? <EyeOff size={13} /> : <Eye size={13} />}
                        <span>{showPdfPreview ? 'Hide Inline Slide Deck' : 'Preview Slides Inline'}</span>
                      </button>

                      <a
                        href={activeLesson.pdfUrl || (chapterResources[0]?.url) || '/free-resources'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Download size={13} />
                        <span>Download PDF Deck (~2.4 MB)</span>
                      </a>
                    </div>
                  </div>

                  {/* Inline PDF / Slides Viewer */}
                  {showPdfPreview && (
                    <div className="rounded-2xl overflow-hidden border border-border bg-slate-950 aspect-[4/3] w-full relative shadow-inner">
                      <iframe
                        src={activeLesson.pdfUrl || (chapterResources[0]?.url) || '/free-resources'}
                        title="Class Notes PDF Viewer"
                        className="w-full h-full border-0"
                      />
                    </div>
                  )}

                  {/* Quick Formula Highlights */}
                  <div className="p-4 rounded-2xl bg-card border border-border space-y-2.5">
                    <h5 className="text-xs font-black text-foreground uppercase tracking-wider font-mono">
                      High-Yield Blueprint Highlights
                    </h5>
                    <ul className="text-xs space-y-2 text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-500 font-bold shrink-0">✓</span>
                        <span>Official CDC / MEC High-Yield Syllabus Focus</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-500 font-bold shrink-0">✓</span>
                        <span>Solved Model Questions &amp; Step-by-Step Marking Breakdown</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-500 font-bold shrink-0">✓</span>
                        <span>Mnemonics, Traps &amp; Common Calculation Pitfalls</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {/* 4. NOTES TAB */}
              {activeTab === 'notes' && (
                <div className="space-y-4 flex flex-col h-full justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                      <span>Personal Timestamped Notes</span>
                      <span className="font-mono text-[10px] text-primary">{formatTime(currentPlaybackSec)}</span>
                    </div>

                    <div className="space-y-2">
                      <textarea
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                        placeholder="Write a formula, reminder or key exam takeaway..."
                        className="w-full text-xs p-3 rounded-xl border border-border bg-background text-foreground resize-none h-20 focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button
                        onClick={handleAddNote}
                        className="btn-primary text-xs font-bold py-2 px-4 rounded-xl w-full flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Send size={12} />
                        <span>Add Note at {formatTime(currentPlaybackSec)}</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 overflow-y-auto flex-1 pt-2">
                    {notes.length > 0 ? (
                      notes.map((n) => (
                        <div key={n.id} className="p-3 rounded-xl bg-muted/20 border border-border/60 space-y-1.5 text-xs group">
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => {
                                setJumpToTime(n.timeSec);
                                toast.success(`Jumped to ${formatTime(n.timeSec)}`);
                              }}
                              className="font-mono font-bold text-primary hover:underline text-[10px] flex items-center gap-1 cursor-pointer"
                              title="Click to jump playback"
                            >
                              <Play size={10} fill="currentColor" />
                              <span>{formatTime(n.timeSec)}</span>
                            </button>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-muted-foreground">{n.createdAt}</span>
                              <button
                                onClick={() => handleDeleteNote(n.id)}
                                className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                title="Delete note"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                          <p className="text-foreground leading-relaxed">{n.text}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-8">
                        No notes yet. Type above to record important points while studying. Click timestamps to seek video.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* 3. RESOURCES TAB */}
              {activeTab === 'resources' && (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Chapter Study Materials
                  </div>
                  <div className="space-y-2">
                    {chapterResources.map((res) => (
                      <div
                        key={res.id}
                        className="p-3.5 rounded-2xl bg-card border border-border/80 flex items-center justify-between gap-3 shadow-2xs hover:border-primary/40 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <FileText size={15} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground truncate">{res.title}</p>
                            <span className="text-[10px] text-muted-foreground font-mono">{res.type}</span>
                          </div>
                        </div>

                        <a
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white text-[11px] font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                        >
                          <Download size={12} />
                          <span>Open</span>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. DOUBT TAB — PW SAARTHI AI + FACULTY DOUBTS */}
              {activeTab === 'doubt' && (
                <div className="space-y-4">
                  {/* PW Saarthi Instant AI Solver Card */}
                  <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-primary font-mono">
                        PW SAARTHI 24/7 DOUBT ENGINE
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        at {formatTime(currentPlaybackSec)}
                      </span>
                    </div>
                    <h4 className="text-xs font-black text-foreground">
                      Stuck on this concept? Get instant guidance
                    </h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Ask an AI doubt on this exact timestamp for instant step-by-step resolution, or submit directly to your faculty mentor.
                    </p>

                    {/* 1-Click AI Saarthi CTA */}
                    <Link
                      href={`/ai-tutor?prompt=${encodeURIComponent(
                        `In lecture "${activeLesson.title}", at timestamp ${formatTime(currentPlaybackSec)}: ${doubtText || 'Explain this concept and key derivations step-by-step.'}`
                      )}&subject=${encodeURIComponent(activeLesson.subjectDisplayName || activeLesson.subjectName || 'science')}`}
                      className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                      <Sparkles size={13} />
                      <span>Solve Instantly with AI Saarthi Tutor</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>

                  {doubtSent ? (
                    <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
                      <CheckCircle2 size={24} className="mx-auto text-emerald-600" />
                      <h5 className="text-xs font-bold text-emerald-700">Doubt Submitted to Senior Faculty</h5>
                      <p className="text-[10px] text-muted-foreground">
                        Your mentor has been notified with the timestamp {formatTime(currentPlaybackSec)}. Response guaranteed within 24 hours.
                      </p>
                      <button
                        onClick={() => setDoubtSent(false)}
                        className="text-xs font-bold text-primary underline pt-1 cursor-pointer"
                      >
                        Ask another doubt
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-primary font-bold">Timestamp: {formatTime(currentPlaybackSec)}</span>
                        <span className="text-muted-foreground">24-hr Faculty Mentor Response</span>
                      </div>
                      <textarea
                        value={doubtText}
                        onChange={(e) => setDoubtText(e.target.value)}
                        placeholder="Explain your confusion clearly (e.g. 'Why did we multiply by 9.8 in step 3?')..."
                        className="w-full text-xs p-3 rounded-xl border border-border bg-background text-foreground resize-none h-28 focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button
                        onClick={handleSubmitFacultyDoubt}
                        disabled={submittingDoubt || !doubtText.trim()}
                        className="btn-primary text-xs font-bold py-2.5 px-4 rounded-xl w-full flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {submittingDoubt ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                        <span>{submittingDoubt ? 'Submitting to Faculty...' : 'Submit Question to Senior Faculty'}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
