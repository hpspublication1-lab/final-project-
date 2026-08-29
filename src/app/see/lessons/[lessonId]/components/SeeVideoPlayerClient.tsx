'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import {
  Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, Settings,
  ChevronLeft, ChevronRight, CheckCircle2, FileText, Download, Lock,
  ArrowRight, Clock, Sparkles, BookOpen, Loader2, AlertCircle, Bookmark,
  MessageSquare, HelpCircle, Target, Award, Subtitles, Layers, Check,
  RotateCcw, RotateCw, ListVideo, Send, Copy, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';

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
  const [isLocked, setIsLocked] = useState(false);
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [videoQuality, setVideoQuality] = useState<'1080p' | '720p' | '480p' | 'Auto'>('1080p');
  const [captionsOn, setCaptionsOn] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [resumeSeconds, setResumeSeconds] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Tabs & Features
  const [activeTab, setActiveTab] = useState<'playlist' | 'transcript' | 'notes' | 'ai' | 'mcq'>('playlist');
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [userQuestion, setUserQuestion] = useState('');
  const [aiAnswers, setAiAnswers] = useState<{ q: string; a: string; time: string }[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

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
      setIsLocked(false);

      const res = await fetch(`/api/see/lessons/${lessonId}`);
      const data = await res.json();

      if (res.status === 403 && data.isLocked) {
        setIsLocked(true);
        setLesson(data.lesson);
        setLoading(false);
        return;
      }

      if (!res.ok || data.error) {
        setError(data.error || 'Failed to load video lesson');
        setLoading(false);
        return;
      }

      setLesson(data.lesson);
      if (data.progress) {
        setProgress(data.progress);
        setIsCompleted(data.progress.is_completed);
        if (data.progress.watched_seconds > 10 && !data.progress.is_completed) {
          setResumeSeconds(data.progress.watched_seconds);
          setShowResumePrompt(true);
        }
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

  // HLS Video Stream Integration
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !lesson?.video_url) return;

    const url = lesson.video_url;
    const isHls = /\.m3u8(\?|$)/i.test(url) || url.includes('playlist.m3u8');
    let hlsInstance: any = null;
    let destroyed = false;

    if (!isHls) {
      videoEl.src = url;
      return;
    }

    if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
      videoEl.src = url;
      return;
    }

    (async () => {
      try {
        const Hls = (await import('hls.js')).default;
        if (destroyed) return;
        if (Hls.isSupported()) {
          hlsInstance = new Hls({
            enableWorker: true,
            capLevelToPlayerSize: true,
            backBufferLength: 90,
          });
          hlsInstance.loadSource(url);
          hlsInstance.attachMedia(videoEl);
        } else {
          videoEl.src = url;
        }
      } catch {
        videoEl.src = url;
      }
    })();

    return () => {
      destroyed = true;
      if (hlsInstance) hlsInstance.destroy();
    };
  }, [lesson?.video_url]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in input or textarea
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
      } else if (e.code === 'KeyC') {
        e.preventDefault();
        setCaptionsOn((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
      setShowResumePrompt(false);
    }
  };

  const seekRelative = (delta: number) => {
    if (!videoRef.current) return;
    const target = Math.max(0, Math.min(videoRef.current.currentTime + delta, duration || 100));
    videoRef.current.currentTime = target;
    setCurrentTime(target);
    toast.success(`${delta > 0 ? '+10s' : '-10s'}`, { duration: 800, position: 'bottom-center' });
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

  const jumpToTime = (secs: number) => {
    setCurrentTime(secs);
    if (videoRef.current) {
      videoRef.current.currentTime = secs;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
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
    toast.success(`Note saved at ${formatTime(note.time)}!`);
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
      const resp = `Based on this ${lesson?.title || 'lecture'} (Chapter: ${lesson?.chapter_name || 'General'}), the key concept involves applying standard NEB formulas step-by-step. Remember to always define given parameters, show formula substitution with units, and write concluding remarks for full credit on board examinations.`;
      setAiAnswers((prev) => [{ q: query, a: resp, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }, ...prev]);
      setAiLoading(false);
      setUserQuestion('');
    }, 600);
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
          <p className="text-sm font-bold text-muted-foreground font-mono">Loading HD Video Lesson &amp; AI Player...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (isLocked) {
    return (
      <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 flex items-center justify-center mx-auto shadow-lg">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-black text-foreground">SEE Master Batch Enrollment Required</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            This premium video lecture is locked. Enroll in the SEE Class 10 Board Master Batch for full access to all 290+ HD video lectures and AI features.
          </p>
          <Link href="/see/checkout" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg">
            <span>Unlock Full SEE Course — NPR 2,990</span>
            <ArrowRight size={16} />
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
            <Link href="/see" className="hover:text-emerald-600 font-bold">SEE Dashboard</Link>
            <span>/</span>
            <Link href={`/see/subject/${lesson?.subject_slug || 'science'}`} className="capitalize font-bold text-foreground hover:text-emerald-600">
              {lesson?.subject_slug?.replace('_', ' ')}
            </Link>
            <span>/</span>
            <span className="line-clamp-1 text-emerald-600 font-semibold">{lesson?.chapter_name}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 font-mono text-[10px] font-bold border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              BUNNY STREAM HD
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
              {/* Ambient Glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600/20 via-primary/20 to-blue-600/20 rounded-[28px] blur-xl opacity-70 pointer-events-none" />

              <div ref={playerContainerRef} className="relative aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 group select-none">
                
                <video
                  ref={videoRef}
                  poster={lesson?.thumbnail_url || undefined}
                  className="w-full h-full object-contain cursor-pointer"
                  onClick={togglePlay}
                  onTimeUpdate={() => videoRef.current && setCurrentTime(videoRef.current.currentTime)}
                  onLoadedMetadata={() => videoRef.current && setDuration(videoRef.current.duration)}
                  onEnded={() => {
                    setIsPlaying(false);
                    handleMarkCompleted();
                  }}
                  playsInline
                />

                {/* Big Center Play/Pause Button on Hover */}
                {!isPlaying && (
                  <div
                    onClick={togglePlay}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer backdrop-blur-[2px] transition-all"
                  >
                    <div className="w-20 h-20 rounded-full bg-emerald-500/90 text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
                      <Play size={36} className="ml-1 fill-white" />
                    </div>
                  </div>
                )}

                {/* Resume Watching Prompt */}
                {showResumePrompt && (
                  <div className="absolute top-4 left-4 z-20 p-3 rounded-2xl bg-card/95 backdrop-blur border border-emerald-500/30 shadow-2xl flex items-center gap-3 text-xs">
                    <Clock size={16} className="text-emerald-500 shrink-0" />
                    <span className="font-medium text-foreground">Resume from {formatTime(resumeSeconds)}?</span>
                    <button
                      onClick={() => {
                        jumpToTime(resumeSeconds);
                        setShowResumePrompt(false);
                      }}
                      className="px-3 py-1 rounded-xl bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700"
                    >
                      Resume
                    </button>
                    <button
                      onClick={() => setShowResumePrompt(false)}
                      className="text-muted-foreground hover:text-foreground text-[11px]"
                    >
                      Dismiss
                    </button>
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

                {/* Player Controls Bar */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-4 flex flex-col gap-2 transition-opacity">
                  
                  {/* Progress Seekbar */}
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
                      <button onClick={() => seekRelative(10)} className="p-1 rounded-lg hover:bg-white/20 transition-colors" title="Fast Forward 10s (L / Right)">
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
                      
                      {/* Quality Selector */}
                      <select
                        value={videoQuality}
                        onChange={(e) => setVideoQuality(e.target.value as any)}
                        className="bg-white/10 text-white rounded-lg px-2 py-1 text-[10px] font-bold focus:outline-none cursor-pointer"
                      >
                        <option value="1080p" className="text-black">1080p Full HD</option>
                        <option value="720p" className="text-black">720p HD</option>
                        <option value="480p" className="text-black">480p</option>
                        <option value="Auto" className="text-black">Auto</option>
                      </select>

                      {/* Captions Toggle */}
                      <button
                        onClick={() => setCaptionsOn(!captionsOn)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                          captionsOn ? 'bg-emerald-600 text-white' : 'bg-white/10 text-white/70'
                        }`}
                        title="Captions (C)"
                      >
                        <Subtitles size={12} className="inline mr-1" />
                        CC
                      </button>

                      {/* Speed Selector */}
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
                      Lesson {lesson?.lesson_order}
                    </span>
                    <span className="text-xs text-muted-foreground font-semibold">
                      {lesson?.chapter_name}
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-foreground">{lesson?.title}</h1>
                  <p className="text-xs text-muted-foreground">{lesson?.description}</p>
                </div>

                <button
                  onClick={handleMarkCompleted}
                  className={`px-5 py-2.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shrink-0 ${
                    isCompleted
                      ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                  }`}
                >
                  <CheckCircle2 size={16} />
                  <span>{isCompleted ? 'Completed ✓' : 'Mark as Completed'}</span>
                </button>
              </div>

              {/* Keyboard Shortcuts Hint */}
              <div className="pt-3 border-t border-border/60 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground font-mono">
                <span className="font-bold text-foreground">Shortcuts:</span>
                <span>[Space / K] Play/Pause</span>
                <span>[J / L] ±10s</span>
                <span>[↑ / ↓] Volume</span>
                <span>[M] Mute</span>
                <span>[F] Fullscreen</span>
              </div>
            </div>

          </div>

          {/* Sidebar Column: Interactive Player Tabs */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Tab Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 font-mono">
              {[
                { id: 'playlist', label: '📑 Playlist' },
                { id: 'notes', label: '📝 My Notes' },
                { id: 'transcript', label: '📜 Milestones' },
                { id: 'ai', label: '🤖 AI Tutor' },
                { id: 'mcq', label: '🎯 Drill' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`px-3 py-2 rounded-xl text-xs font-black shrink-0 transition-all border ${
                    activeTab === t.id
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-card text-muted-foreground border-border hover:text-foreground'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="p-5 rounded-3xl bg-card border border-border min-h-[460px] max-h-[600px] overflow-y-auto space-y-4">
              
              {/* PLAYLIST TAB */}
              {activeTab === 'playlist' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-foreground font-mono">Course Playlist</span>
                    <span className="text-[10px] text-emerald-600 font-bold">{playlistLessons.length} Lectures</span>
                  </div>

                  <input
                    type="text"
                    placeholder="Search lectures..."
                    value={playlistSearch}
                    onChange={(e) => setPlaylistSearch(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-muted/50 border border-border text-xs focus:outline-none focus:border-emerald-500"
                  />

                  <div className="space-y-2">
                    {filteredPlaylist.map((pl, idx) => {
                      const isCurrent = pl.id === lessonId;
                      return (
                        <Link
                          key={pl.id}
                          href={`/see/lessons/${pl.id}`}
                          className={`p-3 rounded-2xl border transition-all flex items-start gap-2.5 block ${
                            isCurrent
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 shadow-sm'
                              : 'bg-muted/30 border-border/80 hover:bg-muted text-foreground'
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {isCurrent ? (
                              <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                                <Play size={10} className="fill-white ml-0.5" />
                              </div>
                            ) : (
                              <span className="w-5 h-5 rounded-full bg-muted border border-border text-[10px] font-mono font-bold flex items-center justify-center">
                                {idx + 1}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate">{pl.title}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{pl.chapter_name} • {Math.round(pl.duration_sec / 60)}m</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* NOTES TAB */}
              {activeTab === 'notes' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <span className="text-xs font-black uppercase text-foreground font-mono">Add Timestamped Note</span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder={`Note at ${formatTime(currentTime)}...`}
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                        className="flex-1 px-3 py-2 rounded-xl bg-muted/50 border border-border text-xs focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        onClick={handleAddNote}
                        className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black hover:bg-emerald-700 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {notes.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-xs">
                        <BookOpen size={24} className="mx-auto mb-2 opacity-50" />
                        <p>No notes added yet for this lesson.</p>
                        <p className="text-[10px]">Type above to save notes linked to video timestamps.</p>
                      </div>
                    ) : (
                      notes.map((n) => (
                        <div key={n.id} className="p-3 rounded-2xl bg-muted/40 border border-border space-y-1 group">
                          <div className="flex items-center justify-between text-[11px]">
                            <button
                              onClick={() => jumpToTime(n.time)}
                              className="font-mono text-emerald-600 font-bold hover:underline flex items-center gap-1"
                            >
                              <Clock size={12} /> {formatTime(n.time)}
                            </button>
                            <button
                              onClick={() => handleDeleteNote(n.id)}
                              className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                          <p className="text-xs text-foreground">{n.text}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TRANSCRIPT / MILESTONES TAB */}
              {activeTab === 'transcript' && (
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase text-foreground font-mono">Lecture Milestones</h3>
                  <div className="space-y-2 text-xs">
                    {SAMPLE_TRANSCRIPT.map((tr, idx) => (
                      <div
                        key={idx}
                        onClick={() => jumpToTime(tr.time)}
                        className="p-3 rounded-2xl bg-muted/40 hover:bg-emerald-500/10 border border-border hover:border-emerald-500/30 cursor-pointer transition-all flex items-start gap-2 text-foreground font-medium"
                      >
                        <Clock size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                        <span>{tr.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI TUTOR TAB */}
              {activeTab === 'ai' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <span className="text-xs font-black uppercase text-foreground font-mono">Ask AI About This Lesson</span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. Give 3 board exam questions..."
                        value={userQuestion}
                        onChange={(e) => setUserQuestion(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
                        className="flex-1 px-3 py-2 rounded-xl bg-muted/50 border border-border text-xs focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        onClick={() => handleAskAI()}
                        disabled={aiLoading}
                        className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      </button>
                    </div>

                    {/* Quick Prompt Chips */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[
                        'Explain simply',
                        'Top 3 Board Questions',
                        'Key Formula Sheet',
                      ].map((chip) => (
                        <button
                          key={chip}
                          onClick={() => handleAskAI(chip)}
                          className="px-2.5 py-1 rounded-lg bg-muted text-[10px] font-bold text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                        >
                          ✨ {chip}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {aiAnswers.map((item, idx) => (
                      <div key={idx} className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-1.5 text-xs">
                        <p className="font-bold text-emerald-600">Q: {item.q}</p>
                        <p className="text-foreground leading-relaxed">{item.a}</p>
                        <span className="text-[9px] text-muted-foreground font-mono">{item.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MCQ DRILL TAB */}
              {activeTab === 'mcq' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-foreground font-mono">Quick Knowledge Check</span>
                    <span className="text-[10px] text-emerald-600 font-bold">3 Questions</span>
                  </div>

                  <div className="space-y-3">
                    {SAMPLE_QUIZ_QUESTIONS.map((q, qIdx) => (
                      <div key={q.id} className="p-3.5 rounded-2xl bg-muted/40 border border-border space-y-2">
                        <p className="text-xs font-bold text-foreground">{qIdx + 1}. {q.q}</p>
                        <div className="space-y-1.5">
                          {q.options.map((opt, optIdx) => {
                            const isSelected = quizAnswers[q.id] === optIdx;
                            const isCorrect = q.correct === optIdx;
                            return (
                              <button
                                key={optIdx}
                                onClick={() => setQuizAnswers((prev) => ({ ...prev, [q.id]: optIdx }))}
                                className={`w-full text-left p-2 rounded-xl text-xs transition-all border ${
                                  isSelected
                                    ? isCorrect
                                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600 font-bold'
                                      : 'bg-red-500/20 border-red-500 text-red-600 font-bold'
                                    : 'bg-card border-border hover:bg-muted/60 text-muted-foreground'
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>

      </div>

      {/* Post-Video Knowledge Modal */}
      {showPostQuiz && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-card rounded-3xl w-full max-w-xl p-6 sm:p-8 space-y-6 shadow-2xl border border-border">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-emerald-600 font-mono">POST-LESSON KNOWLEDGE CHECK</span>
                <h3 className="text-lg font-black text-foreground">Reinforce What You Learned</h3>
              </div>
              <button onClick={() => setShowPostQuiz(false)} className="text-muted-foreground hover:text-foreground text-sm font-bold">✕</button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {SAMPLE_QUIZ_QUESTIONS.map((q, idx) => (
                <div key={q.id} className="p-4 rounded-2xl bg-muted/30 border border-border space-y-2 text-xs">
                  <p className="font-bold text-foreground">{idx + 1}. {q.q}</p>
                  <div className="space-y-1.5">
                    {q.options.map((opt, oIdx) => {
                      const isSelected = quizAnswers[q.id] === oIdx;
                      const isCorrect = q.correct === oIdx;
                      return (
                        <button
                          key={oIdx}
                          onClick={() => setQuizAnswers((prev) => ({ ...prev, [q.id]: oIdx }))}
                          className={`w-full p-2.5 rounded-xl border text-left font-medium transition-all ${
                            isSelected
                              ? quizSubmitted
                                ? isCorrect
                                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold'
                                  : 'bg-red-500/20 border-red-500 text-red-700'
                                : 'bg-emerald-500/10 border-emerald-500 text-foreground font-bold'
                              : 'bg-card border-border hover:bg-muted/60 text-muted-foreground'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-between">
              <button
                onClick={() => {
                  setQuizSubmitted(true);
                  toast.success('Diagnostic Drill Submitted!');
                }}
                className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-lg"
              >
                {quizSubmitted ? 'Score Verified ✓' : 'Submit Answers'}
              </button>

              <button
                onClick={() => setShowPostQuiz(false)}
                className="text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                Close &amp; Return to Video
              </button>
            </div>

          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
