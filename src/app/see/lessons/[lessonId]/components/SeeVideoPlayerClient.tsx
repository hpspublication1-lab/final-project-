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
  MessageSquare, HelpCircle, Target, Award, Subtitles, Layers, Check
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

const SAMPLE_TRANSCRIPT = [
  { time: 15, text: '00:15 - Introduction to Force, Mass and Universal Acceleration.' },
  { time: 220, text: '03:40 - Newton\'s Universal Law of Gravitation Explained.' },
  { time: 492, text: '08:12 - Step-by-Step Formula Derivation: F = G · (m₁ · m₂) / d².' },
  { time: 860, text: '14:20 - Solved SEE Board Numerical Question on Gravitational Constant G.' },
];

const SAMPLE_QUIZ_QUESTIONS = [
  { id: 1, q: 'What is the value of Universal Gravitational Constant G?', options: ['6.67 × 10⁻¹¹ N m²/kg²', '9.8 m/s²', '6.022 × 10²³', '3 × 10⁸ m/s'], correct: 0 },
  { id: 2, q: 'If distance between two masses is doubled, the gravitational force becomes:', options: ['Double', 'Four times', 'One-fourth (1/4)', 'Half'], correct: 2 },
  { id: 3, q: 'What is the acceleration due to gravity (g) at the center of Earth?', options: ['9.8 m/s²', '0 m/s²', '10 m/s²', '9.77 m/s²'], correct: 1 },
  { id: 4, q: 'Weight of an object on the Moon is approx:', options: ['Same as Earth', '1/6th of Earth weight', '6 times Earth weight', 'Zero'], correct: 1 },
  { id: 5, q: 'Which instrument is used to measure weight?', options: ['Beam Balance', 'Spring Balance', 'Barometer', 'Thermometer'], correct: 1 },
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
  const [captionsOn, setCaptionsOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [resumeSeconds, setResumeSeconds] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Tabs & Features
  const [activeTab, setActiveTab] = useState<'transcript' | 'notes' | 'bookmarks' | 'ai' | 'question' | 'mcq'>('transcript');
  const [bookmarks, setBookmarks] = useState<{ id: string; time: number; label: string }[]>([]);
  const [userQuestion, setUserQuestion] = useState('');

  // Post-Video Quiz Modal State
  const [showPostQuiz, setShowPostQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Fetch lesson details
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
    } catch (err: any) {
      setError(err?.message || 'Error fetching video lesson');
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    fetchLessonData();
  }, [fetchLessonData]);

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

  const handleAddBookmark = () => {
    const time = currentTime;
    const label = `Bookmark at ${formatTime(time)}`;
    setBookmarks((prev) => [...prev, { id: Date.now().toString(), time, label }]);
    toast.success(`Bookmarked moment at ${formatTime(time)}!`);
  };

  const handleMarkCompleted = async () => {
    setIsCompleted(true);
    toast.success('Lesson completed! Starting post-video diagnostic drill...');
    setShowPostQuiz(true);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading) {
    return (
      <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
        <div className="flex flex-col items-center justify-center py-28 space-y-4">
          <Loader2 size={36} className="animate-spin text-emerald-500" />
          <p className="text-sm font-bold text-muted-foreground font-mono">Loading Video Lesson &amp; AI Player...</p>
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
            This premium video lesson is locked. Enroll in the SEE Class 10 Board Master Batch for full 147-chapter access.
          </p>
          <Link href="/see/checkout" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg">
            <span>Unlock Full SEE Course</span>
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
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Link href="/see" className="hover:text-emerald-600 font-bold">SEE Dashboard</Link>
            <span>/</span>
            <span className="capitalize font-bold text-foreground">{lesson?.subject_slug}</span>
            <span>/</span>
            <span className="line-clamp-1">{lesson?.chapter_name}</span>
          </div>
          <button onClick={() => setShowPostQuiz(true)} className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 font-black border border-emerald-500/20 text-xs">
            🎯 Test What You Learned
          </button>
        </div>

        {/* Video Player & Interactive Tabbed Interface */}
        <div className="grid lg:grid-cols-12 gap-6">
          
          {/* Main Video Player Column */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Player Container */}
            <div ref={playerContainerRef} className="relative aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 group select-none">
              
              <video
                ref={videoRef}
                src={lesson?.video_url || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'}
                poster={lesson?.thumbnail_url || undefined}
                className="w-full h-full object-contain cursor-pointer"
                onClick={togglePlay}
                onTimeUpdate={() => videoRef.current && setCurrentTime(videoRef.current.currentTime)}
                onLoadedMetadata={() => videoRef.current && setDuration(videoRef.current.duration)}
                onEnded={() => {
                  setIsPlaying(false);
                  handleMarkCompleted();
                }}
              />

              {/* Subtitles Overlay */}
              {captionsOn && isPlaying && (
                <div className="absolute bottom-16 inset-x-0 text-center pointer-events-none px-6">
                  <span className="px-3 py-1 rounded-lg bg-black/80 text-yellow-300 font-bold text-xs sm:text-sm border border-yellow-500/20">
                    🇳🇵 [Subtitles] Universal Gravitational Law: F = G · (m₁ · m₂) / d²
                  </span>
                </div>
              )}

              {/* Player Controls Bar */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 flex flex-col gap-2">
                
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
                    >
                      <Subtitles size={12} className="inline mr-1" />
                      CC
                    </button>

                    {/* Speed Selector */}
                    <div className="flex items-center gap-1 bg-white/10 rounded-xl px-2 py-0.5 text-[10px] font-bold">
                      {[0.5, 1, 1.25, 1.5, 2].map((spd) => (
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

                    <button onClick={handleAddBookmark} title="Bookmark Moment" className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
                      <Bookmark size={16} />
                    </button>

                    <button onClick={toggleFullscreen} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
                      {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>
                  </div>
                </div>

              </div>

            </div>

            {/* Lesson Title & Main Info */}
            <div className="p-6 rounded-3xl bg-card border border-border space-y-4">
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
                </div>

                <button
                  onClick={handleMarkCompleted}
                  className={`px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shrink-0 ${
                    isCompleted
                      ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                  }`}
                >
                  <CheckCircle2 size={16} />
                  <span>{isCompleted ? 'Completed ✓' : 'Mark as Completed'}</span>
                </button>
              </div>
            </div>

          </div>

          {/* Sidebar Column: Interactive Player Tabs */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Tab Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 font-mono">
              {[
                { id: 'transcript', label: '📜 Transcript' },
                { id: 'notes', label: '📝 Notes' },
                { id: 'bookmarks', label: '🔖 Bookmarks' },
                { id: 'ai', label: '🤖 AI Summary' },
                { id: 'question', label: '❓ Ask Question' },
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
            <div className="p-6 rounded-3xl bg-card border border-border min-h-[360px] space-y-4">
              
              {/* TRANSCRIPT TAB */}
              {activeTab === 'transcript' && (
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase text-foreground font-mono">Interactive Timestamped Transcript</h3>
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

              {/* NOTES TAB */}
              {activeTab === 'notes' && (
                <div className="space-y-4 text-xs">
                  <h3 className="text-xs font-black uppercase text-foreground font-mono">Chapter Formula Sheet &amp; PDF Notes</h3>
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                    <p className="font-bold text-foreground">📄 Official Force &amp; Gravity Formula Sheet.pdf</p>
                    <p className="text-muted-foreground">Includes all 10-year NEB past question derivations &amp; numerical steps.</p>
                    <a
                      href="#"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:underline pt-1"
                    >
                      <Download size={14} /> Download PDF Note
                    </a>
                  </div>
                </div>
              )}

              {/* BOOKMARKS TAB */}
              {activeTab === 'bookmarks' && (
                <div className="space-y-3 text-xs">
                  <h3 className="text-xs font-black uppercase text-foreground font-mono">Saved Video Moments</h3>
                  {bookmarks.length === 0 ? (
                    <p className="text-muted-foreground italic">No bookmarked moments yet. Click the bookmark icon in player controls to save moments.</p>
                  ) : (
                    <div className="space-y-2">
                      {bookmarks.map((bm) => (
                        <div
                          key={bm.id}
                          onClick={() => jumpToTime(bm.time)}
                          className="p-3 rounded-2xl bg-muted/40 hover:bg-emerald-500/10 border border-border text-foreground font-bold cursor-pointer flex items-center justify-between"
                        >
                          <span>{bm.label}</span>
                          <Play size={12} className="text-emerald-600" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* AI EXPLANATION TAB */}
              {activeTab === 'ai' && (
                <div className="space-y-3 text-xs">
                  <h3 className="text-xs font-black uppercase text-emerald-600 font-mono flex items-center gap-1.5">
                    <Sparkles size={14} /> AI Concept Explanation
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    This video covers <strong>Universal Gravitation</strong>. Remember: Gravitational force decreases with the square of distance (F ∝ 1/d²). If distance doubles, force decreases to 1/4th.
                  </p>
                </div>
              )}

              {/* ASK QUESTION TAB */}
              {activeTab === 'question' && (
                <div className="space-y-3 text-xs">
                  <h3 className="text-xs font-black uppercase text-foreground font-mono">Ask Samyak AI Teacher</h3>
                  <textarea
                    value={userQuestion}
                    onChange={(e) => setUserQuestion(e.target.value)}
                    placeholder="Type your question about this video..."
                    className="w-full h-24 p-3 rounded-2xl bg-muted/40 border border-border text-foreground font-medium focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={() => {
                      if (!userQuestion.trim()) return;
                      toast.success('Question submitted to Samyak AI Teacher!');
                      setUserQuestion('');
                    }}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                  >
                    Submit Question
                  </button>
                </div>
              )}

            </div>

          </div>

        </div>

      </div>

      {/* POST-VIDEO DIAGNOSTIC DRILL MODAL ("Now test what you learned.") */}
      {showPostQuiz && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-card border-2 border-emerald-500 rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-6 shadow-2xl animate-fade-in">
            
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-mono">
                  POST-VIDEO DIAGNOSTIC DRILL
                </span>
                <h2 className="text-xl font-black text-foreground mt-1">Now Test What You Learned!</h2>
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
                  toast.success('Diagnostic Test Submitted!');
                }}
                className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-lg"
              >
                {quizSubmitted ? 'Score Verified ✓' : 'Submit Diagnostic Answers'}
              </button>

              <button
                onClick={() => setShowPostQuiz(false)}
                className="text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                Close &amp; Continue Lesson
              </button>
            </div>

          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
