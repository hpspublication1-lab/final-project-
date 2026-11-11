'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import {
  Play, Pause, Volume2, VolumeX, Maximize2, Minimize2,
  ChevronLeft, ChevronRight, CheckCircle2, FileText, Download,
  ArrowRight, Clock, Sparkles, BookOpen, Loader2, Bookmark,
  MessageSquare, HelpCircle, Target, Award, Subtitles, Layers, Check,
  RotateCcw, RotateCw, ListVideo, Send, Trash2, Video, RefreshCw, Zap
} from 'lucide-react';
import toast from 'react-hot-toast';
import { FALLBACK_PRACTICE_QUESTIONS, FallbackQuestion } from '@/lib/data/practiceQuestionsFallback';

interface Lesson {
  id: string;
  course_id: string;
  subject_slug: string;
  chapter_name: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  duration_sec: number;
  lesson_order: number;
  pdf_url?: string;
  downloadable_resources?: any[];
  is_free: boolean;
}

interface Progress {
  watched_seconds: number;
  total_duration_sec: number;
  percentage: number;
  is_completed: boolean;
}

interface AdjacentLesson {
  id: string;
  title: string;
  lesson_order: number;
}

interface SeeVideoPlayerProps {
  lessonId: string;
}

interface NoteItem {
  id: string;
  time: number;
  text: string;
  createdAt: string;
}

const SAMPLE_TRANSCRIPT = [
  { time: 15, text: '00:15 - Core Concept & Learning Objectives' },
  { time: 120, text: '02:00 - Theory Explanation & Theoretical Derivation' },
  { time: 360, text: '06:00 - Step-by-Step Formula Applications & Key Theorems' },
  { time: 680, text: '11:20 - Solved SEE Board Exam Numerical & Model Questions' },
  { time: 940, text: '15:40 - Common Traps, Marking Scheme & Summary Revision' },
];

const SAMPLE_QUIZ_QUESTIONS = [
  { id: 1, q: 'What is the most important exam takeaway from this lesson?', options: ['Conceptual understanding and step-by-step formula application', 'Memorizing values without units', 'Skipping board model questions', 'Only solving simple examples'], correct: 0 },
  { id: 2, q: 'When solving SEE numericals in this topic, what gives maximum partial marks?', options: ['Writing given data, correct formula, and final unit', 'Only writing the final answer', 'Guessing equations', 'Skipping steps'], correct: 0 },
  { id: 3, q: 'Which method is recommended for regular revision?', options: ['Re-solving model paper questions and writing formula sheets', 'Passive watching only', 'Skipping quizzes', 'Cramming on exam day'], correct: 0 },
];

export default function SeeVideoPlayerClient({ lessonId }: SeeVideoPlayerProps) {
  const [isDark, setIsDark] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<Progress>({
    watched_seconds: 0,
    total_duration_sec: 0,
    percentage: 0,
    is_completed: false,
  });
  const [navigation, setNavigation] = useState<{
    prevLesson: AdjacentLesson | null;
    nextLesson: AdjacentLesson | null;
  }>({ prevLesson: null, nextLesson: null });

  // Playlist State
  const [playlistLessons, setPlaylistLessons] = useState<Lesson[]>([]);
  const [playlistSearch, setPlaylistSearch] = useState('');

  // Player controls
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [availableQualities, setAvailableQualities] = useState<string[]>(['Auto']);
  const [selectedQuality, setSelectedQuality] = useState<string>('Auto');
  const [captionsOn, setCaptionsOn] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsTimeoutRef = useRef<any>(null);

  // Tabs & Features — PW 5-Pillar Pedagogy
  const [activeTab, setActiveTab] = useState<'playlist' | 'dpp' | 'pdf_notes' | 'transcript' | 'notes' | 'ai'>('playlist');
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [userQuestion, setUserQuestion] = useState('');
  const [aiAnswers, setAiAnswers] = useState<{ q: string; a: string; time: string }[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  // Daily Practice Problems (DPP) State for Class 10
  const [dppQuestions, setDppQuestions] = useState<FallbackQuestion[]>([]);
  const [dppAnswers, setDppAnswers] = useState<Record<string, string>>({});
  const [dppSubmitted, setDppSubmitted] = useState<Record<string, boolean>>({});
  const [dppScore, setDppScore] = useState<{ correct: number; incorrect: number; total: number; score: number }>({
    correct: 0,
    incorrect: 0,
    total: 0,
    score: 0,
  });

  // Post-Video Quiz Modal State
  const [showPostQuiz, setShowPostQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Load saved notes from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`notes_${lessonId}`);
      if (saved) setNotes(JSON.parse(saved));
    } catch {}
  }, [lessonId]);

  // Fetch lesson details & playlist
  const fetchLessonData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/see/lessons/${lessonId}`);
      const data = await res.json();

      if (!res.ok || data.error || !data.lesson) {
        setError(data.error || 'Failed to load video lesson');
        setLoading(false);
        return;
      }

      setLesson(data.lesson);
      if (data.progress) {
        setProgress(data.progress);
        setIsCompleted(data.progress.is_completed);
      }
      setNavigation(data.navigation || { prevLesson: null, nextLesson: null });
      setLoading(false);

      // Fetch playlist for this subject
      if (data.lesson?.subject_slug) {
        fetch(`/api/see/lessons?subject=${data.lesson.subject_slug}`)
          .then((r) => r.json())
          .then((pData) => {
            if (pData.lessons && Array.isArray(pData.lessons)) {
              setPlaylistLessons(pData.lessons);
            }
          })
          .catch(() => {});
      }
    } catch (err: any) {
      setError(err?.message || 'Error fetching video lesson');
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    fetchLessonData();
  }, [fetchLessonData]);

  // Direct HLS Video Stream Integration (Unrestricted Bunny CDN Pull Zone)
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !lesson?.video_url) return;

    const url = lesson.video_url;
    let destroyed = false;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Native Safari / iOS HLS
    if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
      videoEl.src = url;
      videoEl.load();
      return;
    }

    // Modern Browsers with Hls.js
    (async () => {
      try {
        const HlsModule = await import('hls.js');
        const Hls = HlsModule.default;

        if (destroyed) return;

        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            capLevelToPlayerSize: true,
            backBufferLength: 90,
            autoStartLoad: true,
          });

          hlsRef.current = hls;
          hls.loadSource(url);
          hls.attachMedia(videoEl);

          hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
            if (destroyed) return;
            const levels = data.levels || [];
            const qualLabels = ['Auto', ...levels.map((l: any) => `${l.height}p`)];
            setAvailableQualities(Array.from(new Set(qualLabels)));
            videoEl.play().then(() => setIsPlaying(true)).catch(() => {});
          });

          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  hls.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  hls.recoverMediaError();
                  break;
                default:
                  hls.destroy();
                  break;
              }
            }
          });
        } else {
          videoEl.src = url;
        }
      } catch (e) {
        console.warn('Hls.js init fallback:', e);
        videoEl.src = url;
      }
    })();

    return () => {
      destroyed = true;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [lesson?.video_url]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'Space' || e.code === 'KeyK') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowLeft' || e.code === 'KeyJ') {
        e.preventDefault();
        seekRelative(-10);
      } else if (e.code === 'ArrowRight' || e.code === 'KeyL') {
        e.preventDefault();
        seekRelative(10);
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        adjustVolume(0.1);
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        adjustVolume(-0.1);
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        toggleMute();
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const handleMouseMove = () => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setControlsVisible(false);
    }, 3000);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const seekRelative = (delta: number) => {
    if (!videoRef.current) return;
    const target = Math.max(0, Math.min(videoRef.current.currentTime + delta, duration || 100));
    videoRef.current.currentTime = target;
    setCurrentTime(target);
    toast.success(`${delta > 0 ? '+10s' : '-10s'}`, { duration: 700, position: 'bottom-center' });
  };

  const adjustVolume = (delta: number) => {
    if (!videoRef.current) return;
    const newVol = Math.max(0, Math.min(1, volume + delta));
    setVolume(newVol);
    videoRef.current.volume = newVol;
    setIsMuted(newVol === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const next = !isMuted;
    setIsMuted(next);
    videoRef.current.muted = next;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    toast.success(`Speed: ${speed}x`, { duration: 800 });
  };

  const handleQualityChange = (qual: string) => {
    setSelectedQuality(qual);
    if (hlsRef.current) {
      if (qual === 'Auto') {
        hlsRef.current.currentLevel = -1;
      } else {
        const height = parseInt(qual.replace('p', ''), 10);
        const idx = hlsRef.current.levels.findIndex((l: any) => l.height === height);
        if (idx !== -1) {
          hlsRef.current.currentLevel = idx;
        }
      }
    }
    toast.success(`Quality set to ${qual}`, { duration: 800 });
  };

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const jumpToTime = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      setCurrentTime(seconds);
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleAddNote = () => {
    if (!newNoteText.trim()) return;
    const note: NoteItem = {
      id: Date.now().toString(),
      time: Math.floor(currentTime),
      text: newNoteText.trim(),
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    const updated = [...notes, note];
    setNotes(updated);
    localStorage.setItem(`notes_${lessonId}`, JSON.stringify(updated));
    setNewNoteText('');
    toast.success('Note saved at timestamp!');
  };

  const handleDeleteNote = (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    localStorage.setItem(`notes_${lessonId}`, JSON.stringify(updated));
  };

  const handleAskAI = (prompt?: string) => {
    const query = prompt || userQuestion;
    if (!query.trim()) return;
    setAiLoading(true);

    setTimeout(() => {
      const resp = `Based on this lecture (${lesson?.title || 'Topic'}), the key concept involves applying standard NEB formulas step-by-step. Make sure to define given parameters, show formula substitutions with units, and write concluding remarks for full credit on board examinations.`;
      setAiAnswers((prev) => [{ q: query, a: resp, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }, ...prev]);
      setAiLoading(false);
      setUserQuestion('');
    }, 500);
  };

  // Populate curriculum-aligned DPP questions for Class 10 SEE lesson
  useEffect(() => {
    if (!lesson) return;
    const targetSubj = (lesson.subject_slug || '').toLowerCase();
    const targetChap = (lesson.chapter_name || lesson.title || '').toLowerCase();

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
  }, [lesson]);

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

    // SEE Board marking scheme: +1 mark for correct, 0 negative marks
    const netScore = c * 1.0;
    setDppScore({
      correct: c,
      incorrect: inc,
      total: dppQuestions.length,
      score: netScore,
    });

    if (isCorrect) {
      toast.success('🎯 Correct Answer! +1.0 Mark');
    } else {
      toast.error(`✕ Incorrect. Correct: Option ${correctOption.toUpperCase()}`);
    }
  };

  const handleResetDpp = () => {
    setDppAnswers({});
    setDppSubmitted({});
    setDppScore({ correct: 0, incorrect: 0, total: dppQuestions.length, score: 0 });
    toast.success('SEE DPP Practice session reset');
  };

  const handleMarkCompleted = async () => {
    setIsCompleted(true);
    toast.success('Lesson completed! Starting knowledge drill...');
    setShowPostQuiz(true);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const filteredPlaylist = playlistLessons.filter((l) =>
    l.title.toLowerCase().includes(playlistSearch.toLowerCase()) ||
    l.chapter_name?.toLowerCase().includes(playlistSearch.toLowerCase())
  );

  if (loading) {
    return (
      <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
        <div className="flex flex-col items-center justify-center py-28 space-y-4">
          <Loader2 size={36} className="animate-spin text-emerald-500" />
          <p className="text-sm font-bold text-muted-foreground font-mono">Loading HD Video Lesson...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !lesson) {
    return (
      <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
        <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 text-red-500 flex items-center justify-center mx-auto">
            <Video size={28} />
          </div>
          <h2 className="text-xl font-black text-foreground">Lecture Not Found</h2>
          <p className="text-xs text-muted-foreground">{error || 'Unable to retrieve this video lecture.'}</p>
          <Link href="/lecture-videos" className="inline-flex px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs">
            Browse All Video Lectures
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Navigation Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Link href="/student-dashboard" className="hover:text-emerald-600 font-bold">Student Dashboard</Link>
            <span>/</span>
            <Link href="/lecture-videos" className="hover:text-emerald-600 font-bold">Lectures</Link>
            <span>/</span>
            <Link href={`/see/subject/${lesson?.subject_slug || 'science'}`} className="capitalize font-bold text-foreground hover:text-emerald-600">
              {lesson?.subject_slug?.replace('_', ' ')}
            </Link>
            <span>/</span>
            <span className="line-clamp-1 text-emerald-600 font-semibold">{lesson?.chapter_name}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 font-mono text-[10px] font-bold border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              1080P DIRECT STREAM
            </span>
            <button onClick={() => setShowPostQuiz(true)} className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 font-black border border-emerald-500/20 text-xs hover:bg-emerald-500/20 transition-all">
              🎯 Knowledge Drill
            </button>
          </div>
        </div>

        {/* Video Player & Interactive Tabbed Interface */}
        <div className="grid lg:grid-cols-12 gap-6">
          
          {/* Main Video Player Column */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Player Container with Ambient Lighting */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600/20 via-primary/20 to-blue-600/20 rounded-[28px] blur-xl opacity-70 pointer-events-none" />

              <div
                ref={playerContainerRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => isPlaying && setControlsVisible(false)}
                className="relative aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 group select-none"
              >
                <video
                  ref={videoRef}
                  poster={lesson?.thumbnail_url || undefined}
                  className="w-full h-full object-contain cursor-pointer"
                  onClick={togglePlay}
                  onTimeUpdate={() => videoRef.current && setCurrentTime(videoRef.current.currentTime)}
                  onLoadedMetadata={() => videoRef.current && setDuration(videoRef.current.duration)}
                  onWaiting={() => setIsBuffering(true)}
                  onPlaying={() => {
                    setIsBuffering(false);
                    setIsPlaying(true);
                  }}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => {
                    setIsPlaying(false);
                    handleMarkCompleted();
                  }}
                  playsInline
                />

                {/* Buffering Indicator */}
                {isBuffering && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
                    <Loader2 size={40} className="animate-spin text-emerald-500" />
                  </div>
                )}

                {/* Big Center Play/Pause Button */}
                {!isPlaying && !isBuffering && (
                  <div
                    onClick={togglePlay}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer backdrop-blur-[2px] transition-all"
                  >
                    <div className="w-20 h-20 rounded-full bg-emerald-500/90 text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
                      <Play size={36} className="ml-1 fill-white" />
                    </div>
                  </div>
                )}

                {/* Subtitles Overlay */}
                {captionsOn && isPlaying && (
                  <div className="absolute bottom-16 inset-x-0 text-center pointer-events-none px-6">
                    <span className="px-3.5 py-1.5 rounded-xl bg-black/85 text-yellow-300 font-bold text-xs sm:text-sm border border-yellow-500/30 backdrop-blur">
                      🇳🇵 [Smart Captions] {lesson?.chapter_name}: Key concept &amp; step-by-step derivation.
                    </span>
                  </div>
                )}

                {/* Custom Video Controls Overlay */}
                <div
                  className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-4 flex flex-col gap-2 transition-opacity duration-300 ${
                    controlsVisible || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
                >
                  {/* Progress Scrubber */}
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:h-2 transition-all"
                  />

                  <div className="flex items-center justify-between text-white text-xs">
                    <div className="flex items-center gap-3">
                      <button onClick={togglePlay} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
                        {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                      </button>
                      <button onClick={() => seekRelative(-10)} className="p-1 rounded-lg hover:bg-white/20 transition-colors" title="Rewind 10s (J / Left)">
                        <RotateCcw size={15} />
                      </button>
                      <button onClick={() => seekRelative(10)} className="p-1 rounded-lg hover:bg-white/20 transition-colors" title="Forward 10s (L / Right)">
                        <RotateCw size={15} />
                      </button>

                      {/* Volume Slider */}
                      <div className="flex items-center gap-1.5 group/vol">
                        <button onClick={toggleMute} className="p-1 rounded-lg hover:bg-white/20 transition-colors">
                          {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                        </button>
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.05}
                          value={isMuted ? 0 : volume}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setVolume(val);
                            if (videoRef.current) {
                              videoRef.current.volume = val;
                              videoRef.current.muted = val === 0;
                            }
                            setIsMuted(val === 0);
                          }}
                          className="w-16 h-1 bg-white/30 rounded accent-emerald-500 cursor-pointer hidden group-hover/vol:inline-block"
                        />
                      </div>

                      <span className="font-mono text-[11px] text-white/80">
                        {formatTime(currentTime)} / {formatTime(duration || lesson?.duration_sec || 0)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Quality Switcher */}
                      {availableQualities.length > 1 && (
                        <select
                          value={selectedQuality}
                          onChange={(e) => handleQualityChange(e.target.value)}
                          className="bg-white/10 text-white rounded-lg px-2 py-1 text-[10px] font-bold focus:outline-none cursor-pointer"
                        >
                          {availableQualities.map((q) => (
                            <option key={q} value={q} className="text-black">{q}</option>
                          ))}
                        </select>
                      )}

                      {/* Captions Toggle */}
                      <button
                        onClick={() => setCaptionsOn(!captionsOn)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                          captionsOn ? 'bg-emerald-600 text-white' : 'bg-white/10 text-white/70'
                        }`}
                        title="Captions (C)"
                      >
                        <Subtitles size={12} className="inline mr-1" /> CC
                      </button>

                      {/* Speed Options */}
                      <div className="hidden sm:flex items-center gap-1 bg-white/10 rounded-xl px-2 py-0.5 text-[10px] font-bold">
                        {[0.75, 1, 1.25, 1.5, 2].map((spd) => (
                          <button
                            key={spd}
                            onClick={() => handleSpeedChange(spd)}
                            className={`px-1.5 py-0.5 rounded-md transition-colors ${
                              playbackSpeed === spd ? 'bg-emerald-600 text-white' : 'text-white/70 hover:text-white'
                            }`}
                          >
                            {spd}x
                          </button>
                        ))}
                      </div>

                      <button onClick={toggleFullscreen} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors" title="Fullscreen (F)">
                        {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Lesson Title & Main Info */}
            <div className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-mono">
                      Part {lesson?.lesson_order}
                    </span>
                    <span className="text-xs text-muted-foreground font-semibold">
                      {lesson?.chapter_name}
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-foreground">{lesson?.title}</h1>
                  <p className="text-xs text-muted-foreground">{lesson?.description}</p>
                </div>

                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  {/* Previous Lesson */}
                  {navigation.prevLesson && (
                    <Link
                      href={`/see/lessons/${navigation.prevLesson.id}`}
                      className="px-3.5 py-2.5 rounded-2xl border border-border hover:bg-muted font-bold text-xs flex items-center gap-1.5 transition-colors text-foreground"
                      title={navigation.prevLesson.title}
                    >
                      <ChevronLeft size={16} />
                      <span className="hidden sm:inline">Prev</span>
                    </Link>
                  )}

                  {/* Next Lesson */}
                  {navigation.nextLesson && (
                    <Link
                      href={`/see/lessons/${navigation.nextLesson.id}`}
                      className="px-3.5 py-2.5 rounded-2xl border border-border hover:bg-muted font-bold text-xs flex items-center gap-1.5 transition-colors text-foreground"
                      title={navigation.nextLesson.title}
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight size={16} />
                    </Link>
                  )}

                  {/* Mark Completed Button */}
                  <button
                    onClick={handleMarkCompleted}
                    className={`px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                      isCompleted
                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                    }`}
                  >
                    <CheckCircle2 size={16} />
                    <span>{isCompleted ? 'Completed ✓' : 'Mark Completed'}</span>
                  </button>

                  {/* Practice This Chapter CTA */}
                  <Link
                    href={`/see/question-bank?subject=${lesson?.subject_slug || 'science'}&chapter=${encodeURIComponent(lesson?.chapter_name || '')}`}
                    className="px-4 py-2.5 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-xs flex items-center gap-2 shadow-md transition-all active:scale-95"
                  >
                    <Zap size={14} className="fill-current" />
                    <span>Practice This Chapter</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>

              {/* Resource & Tools Action Bar — PW Pedagogy Standard */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 border-t border-border/60">
                <button
                  onClick={() => setActiveTab('dpp')}
                  className="px-3.5 py-2.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center justify-between gap-2 transition-all cursor-pointer shadow-xs active:scale-98"
                >
                  <div className="flex items-center gap-2">
                    <Zap size={15} className="fill-current text-amber-500" />
                    <span className="font-bold">Today&apos;s Board DPP</span>
                  </div>
                  <span className="text-[10px] font-mono bg-amber-500/20 px-1.5 py-0.5 rounded-md">10 Qs</span>
                </button>

                <button
                  onClick={() => setActiveTab('pdf_notes')}
                  className="px-3.5 py-2.5 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-between gap-2 transition-all cursor-pointer shadow-xs active:scale-98"
                >
                  <div className="flex items-center gap-2">
                    <FileText size={15} />
                    <span className="font-bold">Class Notes PDF</span>
                  </div>
                  <Download size={13} />
                </button>

                <button
                  onClick={() => setActiveTab('ai')}
                  className="px-3.5 py-2.5 rounded-2xl bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary font-bold text-xs flex items-center justify-between gap-2 transition-all cursor-pointer shadow-xs active:scale-98"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles size={15} />
                    <span className="font-bold">Ask AI Tutor</span>
                  </div>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

          </div>

          {/* Sidebar Tabs Column */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Tab Buttons Header */}
            <div className="flex items-center gap-1 p-1 bg-card rounded-2xl border border-border overflow-x-auto">
              {[
                { id: 'playlist', label: 'Playlist', icon: ListVideo },
                { id: 'dpp', label: `DPP (${dppQuestions.length})`, icon: Zap },
                { id: 'pdf_notes', label: 'PDF Notes', icon: FileText },
                { id: 'notes', label: 'Notes', icon: Bookmark },
                { id: 'ai', label: 'AI Tutor', icon: Sparkles },
                { id: 'transcript', label: 'Outline', icon: Clock },
              ].map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`py-2 px-2.5 rounded-xl text-center text-xs font-bold flex items-center justify-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                      activeTab === t.id
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <Icon size={13} className={t.id === 'dpp' ? 'text-amber-400 fill-current' : ''} />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB 1: In-Player Playlist Drawer */}
            {activeTab === 'playlist' && (
              <div className="p-4 rounded-3xl bg-card border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-foreground font-mono">
                    Subject Video Lectures ({playlistLessons.length})
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold font-mono">
                    1080p HD
                  </span>
                </div>

                <input
                  type="text"
                  placeholder="Search lectures or units..."
                  value={playlistSearch}
                  onChange={(e) => setPlaylistSearch(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-muted/60 border border-border focus:outline-none focus:border-emerald-500"
                />

                <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                  {filteredPlaylist.map((pl, idx) => {
                    const isCur = pl.id === lessonId;
                    return (
                      <button
                        key={pl.id}
                        onClick={() => {
                          router.push(`/see/lessons/${pl.id}`);
                        }}
                        className={`w-full text-left p-3 rounded-2xl border transition-all flex items-start gap-3 ${
                          isCur
                            ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm'
                            : 'bg-muted/30 border-border hover:bg-muted/60'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-black font-mono ${
                          isCur ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'
                        }`}>
                          {isCur ? <Play size={10} className="fill-white ml-0.5" /> : idx + 1}
                        </div>
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <p className={`text-xs font-bold line-clamp-2 ${isCur ? 'text-emerald-600 font-black' : 'text-foreground'}`}>
                            {pl.title}
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                            <span className="line-clamp-1">{pl.chapter_name}</span>
                            <span>{Math.round((pl.duration_sec || 900) / 60)}m</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB: DPP (Daily Practice Problems) — Class 10 Board Exam Standard */}
            {activeTab === 'dpp' && (
              <div className="p-4 rounded-3xl bg-card border border-border space-y-4">
                {/* Header Banner */}
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-mono">
                      SEE BOARD DAILY PRACTICE PROBLEMS
                    </span>
                    <button
                      onClick={handleResetDpp}
                      className="text-[10px] font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw size={10} />
                      <span>Reset</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <h4 className="text-xs font-black text-foreground">
                        {lesson?.chapter_name || lesson?.title}
                      </h4>
                      <p className="text-[10px] text-muted-foreground">
                        {dppQuestions.length} Board Exam Practice Questions
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-emerald-600 font-mono">
                        {dppScore.correct}/{dppQuestions.length}
                      </span>
                      <span className="text-[10px] text-muted-foreground block font-mono">
                        Score: {dppScore.score} Marks
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-muted/60 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-300"
                      style={{
                        width: `${(Object.keys(dppSubmitted).length / Math.max(1, dppQuestions.length)) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-muted-foreground font-mono">
                    <span>SEE Marking: +1.0 Mark Per Correct (No Negative Marking)</span>
                    <span>{Object.keys(dppSubmitted).length} of {dppQuestions.length} Answered</span>
                  </div>
                </div>

                {/* Questions List */}
                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
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
                            : 'bg-card border-border/80 hover:border-emerald-500/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-mono font-bold text-emerald-600 text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/10 shrink-0">
                            Q{qIdx + 1}
                          </span>
                          <p className="text-foreground font-medium flex-1 leading-snug">
                            {q.questionText}
                          </p>
                        </div>

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

                        {isAnswered && (
                          <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 text-[11px] space-y-1">
                            <span className="font-bold text-emerald-600 flex items-center gap-1 text-[10px] uppercase font-mono">
                              <Sparkles size={11} /> CDC Model Explanation:
                            </span>
                            <p className="text-muted-foreground leading-relaxed">{q.explanation}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB: Class Notes PDF */}
            {activeTab === 'pdf_notes' && (
              <div className="p-4 rounded-3xl bg-card border border-border space-y-4">
                <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <FileText size={20} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 font-mono">
                        SEE BOARD HANDOUT
                      </span>
                      <h4 className="text-xs font-black text-foreground truncate">
                        {lesson?.title} — Class Notes
                      </h4>
                      <p className="text-[10px] text-muted-foreground">
                        CDC formula sheets, theorem proofs &amp; diagrams
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href={lesson?.pdf_url || '/free-resources'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Download size={13} />
                      <span>Download PDF Notes (~1.8 MB)</span>
                    </a>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-2.5">
                  <h5 className="text-xs font-black text-foreground uppercase tracking-wider font-mono">
                    Curriculum Invariants
                  </h5>
                  <ul className="text-xs space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold shrink-0">✓</span>
                      <span>100% Aligned with Nepal CDC 2081/2082 Curriculum</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold shrink-0">✓</span>
                      <span>Mark Distribution: 1 Mark (Knowledge), 2 Mark (Understanding), 4 Mark (Higher Ability)</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* TAB 2: Transcript Timestamps */}
            {activeTab === 'transcript' && (
              <div className="p-4 rounded-3xl bg-card border border-border space-y-3">
                <span className="text-xs font-black uppercase text-foreground font-mono">
                  Lecture Chapters &amp; Timestamps
                </span>
                <div className="space-y-2">
                  {SAMPLE_TRANSCRIPT.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => jumpToTime(item.time)}
                      className="w-full text-left p-3 rounded-2xl bg-muted/40 hover:bg-emerald-500/10 border border-border hover:border-emerald-500/30 transition-all flex items-center justify-between group"
                    >
                      <span className="text-xs font-bold text-foreground group-hover:text-emerald-600">
                        {item.text}
                      </span>
                      <Play size={12} className="text-muted-foreground group-hover:text-emerald-600 shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: Timestamped Notes */}
            {activeTab === 'notes' && (
              <div className="p-4 rounded-3xl bg-card border border-border space-y-3">
                <span className="text-xs font-black uppercase text-foreground font-mono">
                  Personal Study Notes ({notes.length})
                </span>

                <div className="space-y-2">
                  <textarea
                    rows={2}
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Write a formula, theorem, or question..."
                    className="w-full p-2.5 rounded-xl bg-muted/60 border border-border text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={handleAddNote}
                    className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Bookmark size={13} />
                    <span>Save Note at Current Time</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {notes.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">No saved notes yet.</p>
                  ) : (
                    notes.map((n) => (
                      <div key={n.id} className="p-3 rounded-2xl bg-muted/30 border border-border space-y-1 relative group">
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                          <button
                            onClick={() => jumpToTime(n.time)}
                            className="font-bold text-emerald-600 hover:underline flex items-center gap-1"
                          >
                            <Clock size={10} /> {formatTime(n.time)}
                          </button>
                          <button
                            onClick={() => handleDeleteNote(n.id)}
                            className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                        <p className="text-xs text-foreground font-medium">{n.text}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: Instant AI Doubt Tutor */}
            {activeTab === 'ai' && (
              <div className="p-4 rounded-3xl bg-card border border-border space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Sparkles size={14} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-foreground">AI Doubt Tutor</h4>
                    <p className="text-[10px] text-muted-foreground">Ask anything about this lecture topic</p>
                  </div>
                </div>

                {/* Quick Prompts */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Explain core formula',
                    'Show SEE marking criteria',
                    'Give a similar practice problem',
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAskAI(p)}
                      className="px-2.5 py-1 rounded-lg bg-muted/60 hover:bg-muted text-foreground text-[10px] font-bold border border-border/60 transition-colors"
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={userQuestion}
                    onChange={(e) => setUserQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
                    placeholder="Ask a question..."
                    className="flex-1 px-3 py-2 text-xs rounded-xl bg-muted/60 border border-border focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={() => handleAskAI()}
                    disabled={aiLoading || !userQuestion.trim()}
                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50"
                  >
                    {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  </button>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {aiAnswers.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-2xl bg-muted/30 border border-border space-y-1.5">
                      <p className="text-[11px] font-bold text-emerald-600 font-mono">Q: {item.q}</p>
                      <p className="text-xs text-foreground leading-relaxed">{item.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Post-Video Knowledge Drill Modal */}
      {showPostQuiz && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-card rounded-3xl w-full max-w-lg p-6 space-y-6 border border-border shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎯</span>
                <h3 className="text-base font-black text-foreground">Post-Lesson Knowledge Drill</h3>
              </div>
              <button
                onClick={() => setShowPostQuiz(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {SAMPLE_QUIZ_QUESTIONS.map((q, idx) => (
                <div key={q.id} className="space-y-2">
                  <p className="text-xs font-bold text-foreground">
                    {idx + 1}. {q.q}
                  </p>
                  <div className="space-y-1.5">
                    {q.options.map((opt, oIdx) => {
                      const isSel = quizAnswers[q.id] === oIdx;
                      const isCorr = q.correct === oIdx;
                      let btnCls = 'bg-muted/40 border-border text-foreground hover:bg-muted';
                      if (quizSubmitted) {
                        if (isCorr) btnCls = 'bg-emerald-500/20 border-emerald-500 text-emerald-600 font-black';
                        else if (isSel) btnCls = 'bg-red-500/20 border-red-500 text-red-600';
                      } else if (isSel) {
                        btnCls = 'bg-emerald-600 text-white font-bold';
                      }

                      return (
                        <button
                          key={oIdx}
                          disabled={quizSubmitted}
                          onClick={() => setQuizAnswers((prev) => ({ ...prev, [q.id]: oIdx }))}
                          className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all ${btnCls}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {!quizSubmitted ? (
              <button
                onClick={() => {
                  setQuizSubmitted(true);
                  toast.success('Quiz submitted! Review your score above.');
                }}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-lg"
              >
                Submit Drill Answers
              </button>
            ) : (
              <button
                onClick={() => setShowPostQuiz(false)}
                className="w-full py-3 rounded-2xl bg-muted text-foreground font-black text-xs hover:bg-muted/80"
              >
                Done &amp; Continue Watching
              </button>
            )}
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
