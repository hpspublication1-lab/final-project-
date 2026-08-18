'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTrial } from '@/contexts/TrialContext';
import { Video, CheckCircle2, ChevronDown, ChevronUp, Search, StickyNote, Save, X, PlayCircle, Lock, TrendingUp, Loader2 } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface VideoNote {
  id: string;
  videoId: string;
  timestamp: number;
  text: string;
  createdAt: string;
}

interface LectureVideo {
  id: string;
  title: string;
  description: string;
  duration: number; // seconds
  thumbnailUrl: string | null;
  videoUrl: string | null;
  isPremium: boolean;
  watchedSeconds: number;
  isCompleted: boolean;
}

interface ChapterGroup {
  id: string;
  title: string;
  chapterNumber: number | null;
  videos: LectureVideo[];
}

interface SubjectGroup {
  id: string;
  name: string;
  displayName: string;
  icon: string;
  color: string;
  bgLight: string;
  textColor: string;
  chapters: ChapterGroup[];
}

// ─── Style maps (matches Subjects / Chapter Detail pages) ─────────────────────

const SUBJECT_STYLES: Record<string, { bgLight: string; textColor: string }> = {
  biology: { bgLight: 'bg-bio-light', textColor: 'text-bio' },
  chemistry: { bgLight: 'bg-chem-light', textColor: 'text-chem' },
  physics: { bgLight: 'bg-physics-light', textColor: 'text-physics' },
  mental_agility: { bgLight: 'bg-ma-light', textColor: 'text-ma' },
};

const SUBJECT_ORDER: Record<string, number> = { biology: 0, chemistry: 1, physics: 2, mental_agility: 3 };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function getProgressPercent(video: LectureVideo): number {
  if (video.duration === 0) return 0;
  return Math.min(100, Math.round((video.watchedSeconds / video.duration) * 100));
}

function getAllVideos(subjects: SubjectGroup[]): LectureVideo[] {
  return subjects.flatMap((s) => s.chapters.flatMap((c) => c.videos));
}

// ─── VideoPlayer Component ────────────────────────────────────────────────────

interface VideoPlayerProps {
  video: LectureVideo;
  subjectColor: string;
  notes: VideoNote[];
  notesLoading: boolean;
  onAddNote: (timestamp: number, text: string) => void;
  onDeleteNote: (id: string) => void;
  onClose: () => void;
  onMarkWatched: (videoId: string, seconds: number, durationSec: number) => void;
}

function VideoPlayer({ video, subjectColor, notes, notesLoading, onAddNote, onDeleteNote, onClose, onMarkWatched }: VideoPlayerProps) {
  const videoElRef = useRef<HTMLVideoElement>(null);
  const lastReportedRef = useRef(0);
  const [playerTime, setPlayerTime] = useState(video.watchedSeconds);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [activeTab, setActiveTab] = useState<'notes' | 'description'>('description');

  const handleLoadedMetadata = () => {
    const el = videoElRef.current;
    if (el && video.watchedSeconds > 5 && video.watchedSeconds < (video.duration || el.duration) - 5) {
      el.currentTime = video.watchedSeconds;
    }
  };

  const reportProgress = () => {
    const el = videoElRef.current;
    if (!el) return;
    const t = Math.floor(el.currentTime);
    setPlayerTime(t);
    if (Math.abs(t - lastReportedRef.current) >= 5) {
      lastReportedRef.current = t;
      onMarkWatched(video.id, t, video.duration || el.duration || 0);
    }
  };

  const handlePauseOrEnd = () => {
    const el = videoElRef.current;
    if (!el) return;
    const t = Math.floor(el.ended ? el.duration : el.currentTime);
    lastReportedRef.current = t;
    onMarkWatched(video.id, t, video.duration || el.duration || 0);
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    const t = videoElRef.current ? Math.floor(videoElRef.current.currentTime) : playerTime;
    onAddNote(t, noteText.trim());
    setNoteText('');
    setShowNoteInput(false);
  };

  const progress = video.duration > 0 ? (playerTime / video.duration) * 100 : 0;

  // Attach the video source adaptively. An HLS URL (e.g. Bunny Stream
  // `.../playlist.m3u8`) streams via hls.js with adaptive bitrate (fast on weak
  // connections); native HLS is used on Safari/iOS; anything else (legacy MP4
  // from Supabase Storage) is set as a plain source. No schema change needed —
  // admins just paste the Bunny HLS URL into the existing video field.
  // Signed playback URL (anti link-sharing). Falls back to the raw URL if the
  // signing endpoint isn't configured or errors.
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    setResolvedUrl(null);
    if (!video.videoUrl) return;
    (async () => {
      try {
        const res = await fetch(`/api/video/sign?video=${video.id}`);
        const data = await res.json().catch(() => null);
        if (!cancelled) setResolvedUrl(res.ok && data?.url ? data.url : video.videoUrl);
      } catch {
        if (!cancelled) setResolvedUrl(video.videoUrl);
      }
    })();
    return () => { cancelled = true; };
  }, [video.id, video.videoUrl]);

  useEffect(() => {
    const el = videoElRef.current;
    if (!el || !resolvedUrl) return;
    const url = resolvedUrl;
    const isHls = /\.m3u8(\?|$)/i.test(url) || url.includes('playlist.m3u8');
    let hls: any = null;
    let destroyed = false;

    if (!isHls) {
      el.src = url;
      return;
    }
    if (el.canPlayType('application/vnd.apple.mpegurl')) {
      el.src = url; // native HLS (Safari / iOS)
      return;
    }
    (async () => {
      try {
        const Hls = (await import('hls.js')).default;
        if (destroyed) return;
        if (Hls.isSupported()) {
          hls = new Hls({ enableWorker: true, capLevelToPlayerSize: true, backBufferLength: 60 });
          hls.loadSource(url);
          hls.attachMedia(el);
        } else {
          el.src = url;
        }
      } catch {
        el.src = url;
      }
    })();

    return () => {
      destroyed = true;
      if (hls) hls.destroy();
    };
  }, [resolvedUrl]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-card rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
          <div className="min-w-0">
            <p className="font-semibold text-foreground text-sm truncate">{video.title}</p>
            <p className="text-xs text-muted-foreground">{formatDuration(video.duration)} runtime</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors ml-3 shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Video area */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="relative bg-black aspect-video w-full overflow-hidden">
              {video.videoUrl ? (
                <video
                  ref={videoElRef}
                  poster={video.thumbnailUrl ?? undefined}
                  controls
                  playsInline
                  className="w-full h-full"
                  onLoadedMetadata={handleLoadedMetadata}
                  onTimeUpdate={reportProgress}
                  onPause={handlePauseOrEnd}
                  onEnded={handlePauseOrEnd}
                />
              ) : (
                <div
                  className="w-full h-full flex flex-col items-center justify-center gap-2 text-center px-6"
                  style={{ backgroundColor: `${subjectColor}15` }}>
                  <Video size={32} style={{ color: subjectColor }} className="opacity-70" />
                  <p className="text-sm font-medium text-white/90">Video not uploaded yet</p>
                  <p className="text-xs text-white/50">This lecture's video file hasn't been added yet — check back soon.</p>
                </div>
              )}
            </div>

            {/* Progress + note bar */}
            <div className="px-4 py-3 bg-card border-t border-border shrink-0">
              <div className="w-full h-1.5 bg-muted rounded-full mb-3 overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {video.videoUrl ? `${formatTime(playerTime)} / ${formatTime(video.duration)}` : 'No video file yet'}
                </span>
                <button
                  onClick={() => setShowNoteInput(!showNoteInput)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-primary text-xs font-medium hover:bg-secondary/80 transition-colors">
                  <StickyNote size={13} />
                  Add Note
                </button>
              </div>

              {showNoteInput &&
              <div className="mt-3 flex gap-2 animate-fade-in">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Note at {formatTime(videoElRef.current ? Math.floor(videoElRef.current.currentTime) : playerTime)}</p>
                    <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Write your note here..."
                    className="w-full text-sm bg-muted border border-border rounded-lg px-3 py-2 text-foreground placeholder-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                    rows={2} />
                  </div>
                  <div className="flex flex-col gap-1.5 pt-5">
                    <button onClick={handleAddNote} className="p-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors">
                      <Save size={14} />
                    </button>
                    <button onClick={() => setShowNoteInput(false)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>

          {/* Side panel */}
          <div className="w-72 border-l border-border flex flex-col shrink-0 hidden lg:flex">
            <div className="flex border-b border-border shrink-0">
              {(['description', 'notes'] as const).map((tab) =>
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 text-xs font-semibold capitalize transition-colors ${
                activeTab === tab ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`
                }>
                  {tab} {tab === 'notes' && notes.length > 0 && `(${notes.length})`}
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'description' ?
              <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">About this lecture</p>
                    <p className="text-sm text-foreground leading-relaxed">{video.description || 'No description available yet.'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Your Progress</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${getProgressPercent(video)}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-primary">{getProgressPercent(video)}%</span>
                    </div>
                  </div>
                </div> :

              <div className="space-y-3">
                  {notesLoading ?
                <div className="flex items-center justify-center py-8">
                      <Loader2 size={20} className="animate-spin text-muted-foreground" />
                    </div> :
                notes.length === 0 ?
                <div className="text-center py-8">
                      <StickyNote size={32} className="text-muted-foreground mx-auto mb-2 opacity-40" />
                      <p className="text-sm text-muted-foreground">No notes yet.</p>
                      <p className="text-xs text-muted-foreground mt-1">Pause the video and click "Add Note"</p>
                    </div> :

                notes.map((note) =>
                <div key={note.id} className="bg-muted rounded-xl p-3 group">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            {formatTime(note.timestamp)}
                          </span>
                          <button
                      onClick={() => onDeleteNote(note.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-error/10 text-error transition-all">
                            <X size={12} />
                          </button>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">{note.text}</p>
                        <p className="text-xs text-muted-foreground mt-1.5">{note.createdAt}</p>
                      </div>
                )
                }
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>);

}

// ─── VideoCard Component ──────────────────────────────────────────────────────

interface VideoCardProps {
  video: LectureVideo;
  subjectColor: string;
  isLocked: boolean;
  onPlay: (video: LectureVideo) => void;
}

function VideoCard({ video, subjectColor, isLocked, onPlay }: VideoCardProps) {
  const progress = getProgressPercent(video);
  const isCompleted = progress === 100;

  return (
    <div className={`bg-card border border-border rounded-xl overflow-hidden hover:shadow-card-hover transition-all duration-200 group ${isLocked ? 'opacity-70' : ''}`}>
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-muted">
        {video.thumbnailUrl ?
        <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /> :

        <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: `${subjectColor}15` }}>
            <Video size={26} style={{ color: subjectColor }} className="opacity-60" />
          </div>
        }
        {isLocked ?
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Lock size={24} className="text-white" />
          </div> :

        <button
          onClick={() => onPlay(video)}
          className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/40 flex items-center justify-center">
              <PlayCircle size={20} className="text-white ml-0.5" />
            </div>
          </button>
        }
        {isCompleted &&
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-success flex items-center justify-center">
            <CheckCircle2 size={14} className="text-white" />
          </div>
        }
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded font-medium">
          {video.videoUrl ? formatDuration(video.duration) : 'Coming soon'}
        </div>
        {progress > 0 && progress < 100 &&
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
            <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
          </div>
        }
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-semibold text-foreground leading-snug mb-1 line-clamp-2">{video.title}</p>
        <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{video.description || 'No description yet'}</p>
        {progress > 0 &&
        <div className="flex items-center justify-end">
            <span className={`text-xs font-semibold ${isCompleted ? 'text-success' : 'text-primary'}`}>
              {isCompleted ? 'Done' : `${progress}%`}
            </span>
          </div>
        }
        {isLocked ?
        <Link
          href="/#pricing"
          className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs font-medium hover:bg-muted/80 transition-colors">
            <Lock size={12} />
            Upgrade to Unlock
          </Link> :

        <button
          onClick={() => onPlay(video)}
          className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-secondary text-primary text-xs font-semibold hover:bg-secondary/80 transition-colors">
            <PlayCircle size={13} />
            {progress > 0 && progress < 100 ? 'Continue' : progress === 100 ? 'Rewatch' : 'Watch Now'}
          </button>
        }
      </div>
    </div>);

}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LectureVideosClient() {
  const searchParams = useSearchParams();
  const { user, profile } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [subjectsData, setSubjectsData] = useState<SubjectGroup[]>([]);
  const [activeSubject, setActiveSubject] = useState<string>('');
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterWatched, setFilterWatched] = useState<'all' | 'watched' | 'unwatched'>('all');
  const [playingVideo, setPlayingVideo] = useState<LectureVideo | null>(null);
  const [notes, setNotes] = useState<VideoNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [totalNotesCount, setTotalNotesCount] = useState(0);

  const watchProgressRef = useRef<Map<string, { watched: number; completed: boolean }>>(new Map());
  const deepLinkAppliedRef = useRef(false);

  const { isTrialActive } = useTrial();
  const isFree = !isTrialActive && (profile?.subscription_plan ?? 'free') === 'free';

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    setIsDark(stored === 'dark');
  }, []);

  const handleToggleDark = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', next);
  };

  // ─── Load real data ─────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadState('loading');
      const supabase = createClient();

      let chaptersRes: any = await supabase.from('chapters').select('id,subject_id,title,chapter_number').eq('is_active', true);
      if (chaptersRes.error) {
        chaptersRes = await supabase.from('chapters').select('id,subject_id,title,chapter_number:sort_order').eq('is_active', true);
      }


      const [subjectsRes, videosRes, recordingsRes, progressRes] = await Promise.all([
      supabase.from('subjects').select('id,name,display_name,color,icon').eq('is_active', true),
      supabase.from('video_lectures').select('id,subject_id,chapter_id,title,description,video_url,thumbnail_url,duration_sec,is_premium').eq('is_active', true),
      // Recorded live classes (Bunny auto-saves the stream) → shown as videos.
      supabase.from('live_classes').select('id,subject_id,title,description,recording_url,duration_min,is_premium,scheduled_at,status').in('status', ['ended', 'completed']),
      user ?
      supabase.from('video_watch_progress').select('video_id,watched_seconds,is_completed').eq('student_id', user.id) :
      Promise.resolve({ data: [] as { video_id: string; watched_seconds: number; is_completed: boolean }[], error: null })]
      );

      if (cancelled) return;

      if (subjectsRes.error || chaptersRes.error || videosRes.error) {
        console.error('Failed to load lecture videos:', subjectsRes.error || chaptersRes.error || videosRes.error);
        setLoadState('error');
        return;
      }

      watchProgressRef.current = new Map(
        (progressRes.data ?? []).map((p: any) => [p.video_id, { watched: p.watched_seconds, completed: p.is_completed }])
      );

      const chaptersBySubject = new Map<string, any[]>();
      (chaptersRes.data ?? []).forEach((c: any) => {
        const arr = chaptersBySubject.get(c.subject_id) ?? [];
        arr.push(c);
        chaptersBySubject.set(c.subject_id, arr);
      });

      const videosByChapter = new Map<string, any[]>();
      (videosRes.data ?? []).forEach((v: any) => {
        const key = v.chapter_id ?? `__none__:${v.subject_id}`;
        const arr = videosByChapter.get(key) ?? [];
        arr.push(v);
        videosByChapter.set(key, arr);
      });

      // Class recordings grouped by subject (skip any without a recording URL).
      const recordingsBySubject = new Map<string, LectureVideo[]>();
      (recordingsRes.data ?? []).forEach((r: any) => {
        if (!r.recording_url) return;
        const key = r.subject_id ?? '__unassigned__';
        const arr = recordingsBySubject.get(key) ?? [];
        const p = watchProgressRef.current.get(r.id);
        arr.push({
          id: r.id,
          title: r.title,
          description: r.description ?? 'Recorded live class.',
          duration: (r.duration_min ?? 60) * 60,
          thumbnailUrl: null,
          videoUrl: r.recording_url,
          isPremium: r.is_premium,
          watchedSeconds: p?.watched ?? 0,
          isCompleted: p?.completed ?? false,
        });
        recordingsBySubject.set(key, arr);
      });

      const buildVideo = (v: any): LectureVideo => {
        const p = watchProgressRef.current.get(v.id);
        return {
          id: v.id,
          title: v.title,
          description: v.description ?? '',
          duration: v.duration_sec ?? 0,
          thumbnailUrl: v.thumbnail_url,
          videoUrl: v.video_url,
          isPremium: v.is_premium,
          watchedSeconds: p?.watched ?? 0,
          isCompleted: p?.completed ?? false,
        };
      };

      const groups: SubjectGroup[] = (subjectsRes.data ?? [])
      .slice()
      .sort((a: any, b: any) => (SUBJECT_ORDER[a.name] ?? 99) - (SUBJECT_ORDER[b.name] ?? 99))
      .map((s: any) => {
        const style = SUBJECT_STYLES[s.name] ?? SUBJECT_STYLES.biology;
        const chapters: ChapterGroup[] = (chaptersBySubject.get(s.id) ?? [])
        .slice()
        .sort((a: any, b: any) => (a.chapter_number ?? 99) - (b.chapter_number ?? 99))
        .map((c: any) => ({
          id: c.id,
          title: c.title,
          chapterNumber: c.chapter_number,
          videos: (videosByChapter.get(c.id) ?? []).map(buildVideo),
        }))
        .filter((c) => c.videos.length > 0);

        const looseVideos = (videosByChapter.get(`__none__:${s.id}`) ?? []).map(buildVideo);
        if (looseVideos.length > 0) {
          chapters.push({ id: `general-${s.id}`, title: 'General', chapterNumber: null, videos: looseVideos });
        }

        // Recorded live classes for this subject → their own chapter at the end.
        const recordings = recordingsBySubject.get(s.id) ?? [];
        if (recordings.length > 0) {
          chapters.push({ id: `recordings-${s.id}`, title: '🔴 Live Class Recordings', chapterNumber: 9999, videos: recordings });
        }

        return {
          id: s.id,
          name: s.name,
          displayName: s.display_name,
          icon: s.icon ?? '📘',
          color: s.color ?? '#2563EB',
          bgLight: style.bgLight,
          textColor: style.textColor,
          chapters,
        };
      });

      setSubjectsData(groups);
      setLoadState('ready');
      if (!activeSubject && groups.length > 0) {
        setActiveSubject(groups[0].name);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // ─── Total notes count ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) {
      setTotalNotesCount(0);
      return;
    }
    (async () => {
      const supabase = createClient();
      const { count } = await supabase.from('video_notes').select('id', { count: 'exact', head: true }).eq('student_id', user.id);
      setTotalNotesCount(count ?? 0);
    })();
  }, [user?.id]);

  // ─── Deep link support (?subject=&chapter=&video=) ─────────────────────────
  useEffect(() => {
    if (loadState !== 'ready' || deepLinkAppliedRef.current || subjectsData.length === 0) return;
    deepLinkAppliedRef.current = true;

    const qSubject = searchParams.get('subject');
    const qChapter = searchParams.get('chapter');
    const qVideo = searchParams.get('video');

    let targetSubject = qSubject && subjectsData.some((s) => s.name === qSubject) ? qSubject : subjectsData[0]?.name;

    if (qChapter) {
      const owner = subjectsData.find((s) => s.chapters.some((c) => c.id === qChapter));
      if (owner) {
        targetSubject = owner.name;
        setExpandedChapters((prev) => new Set(prev).add(qChapter));
      }
    }
    if (targetSubject) setActiveSubject(targetSubject);

    if (qVideo) {
      const vid = subjectsData.flatMap((s) => s.chapters).flatMap((c) => c.videos).find((v) => v.id === qVideo);
      if (vid && !(vid.isPremium && isFree)) {
        setPlayingVideo(vid);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadState, subjectsData]);

  const currentSubject = subjectsData.find((s) => s.name === activeSubject) || subjectsData[0];

  const allVideos = getAllVideos(subjectsData);
  const watchedCount = allVideos.filter((v) => v.watchedSeconds > 0).length;
  const completedCount = allVideos.filter((v) => v.isCompleted).length;
  const totalVideos = allVideos.length;

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) next.delete(chapterId);else
      next.add(chapterId);
      return next;
    });
  };

  const handleMarkWatched = useCallback((videoId: string, seconds: number, durationSec: number) => {
    const existing = watchProgressRef.current.get(videoId) ?? { watched: 0, completed: false };
    const mergedSeconds = Math.max(existing.watched, seconds);
    const mergedCompleted = existing.completed || (durationSec > 0 && seconds >= durationSec * 0.9);
    watchProgressRef.current.set(videoId, { watched: mergedSeconds, completed: mergedCompleted });

    setSubjectsData((prev) =>
    prev.map((s) => ({
      ...s,
      chapters: s.chapters.map((c) => ({
        ...c,
        videos: c.videos.map((v) => v.id === videoId ? { ...v, watchedSeconds: mergedSeconds, isCompleted: mergedCompleted } : v),
      })),
    }))
    );
    setPlayingVideo((prev) => prev && prev.id === videoId ? { ...prev, watchedSeconds: mergedSeconds, isCompleted: mergedCompleted } : prev);

    if (user?.id) {
      createClient().
      from('video_watch_progress').
      upsert(
        {
          student_id: user.id,
          video_id: videoId,
          watched_seconds: mergedSeconds,
          is_completed: mergedCompleted,
          last_watched_at: new Date().toISOString(),
        },
        { onConflict: 'student_id,video_id' }
      ).
      then(({ error }: any) => {
        if (error) console.error('Failed to save watch progress:', error.message);
      });
    }
  }, [user?.id]);

  // ─── Notes: lazy-load per opened video ─────────────────────────────────────
  useEffect(() => {
    if (!playingVideo || !user?.id) {
      setNotes([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setNotesLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase.
      from('video_notes').
      select('id,video_id,timestamp_sec,note_text,created_at').
      eq('video_id', playingVideo.id).
      eq('student_id', user.id).
      order('timestamp_sec', { ascending: true });

      if (cancelled) return;
      if (error) {
        console.error('Failed to load notes:', error.message);
        setNotes([]);
      } else {
        setNotes((data ?? []).map((n: any) => ({
          id: n.id,
          videoId: n.video_id,
          timestamp: n.timestamp_sec,
          text: n.note_text,
          createdAt: new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        })));
      }
      setNotesLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [playingVideo?.id, user?.id]);

  const handleAddNote = async (timestamp: number, text: string) => {
    if (!playingVideo || !user?.id) return;
    const supabase = createClient();
    const { data, error } = await supabase.
    from('video_notes').
    insert({ student_id: user.id, video_id: playingVideo.id, timestamp_sec: timestamp, note_text: text }).
    select('id,video_id,timestamp_sec,note_text,created_at').
    single();

    if (error || !data) {
      console.error('Failed to save note:', error?.message);
      return;
    }
    setNotes((prev) => [...prev, {
      id: data.id,
      videoId: data.video_id,
      timestamp: data.timestamp_sec,
      text: data.note_text,
      createdAt: new Date(data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
    setTotalNotesCount((prev) => prev + 1);
  };

  const handleDeleteNote = async (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    setTotalNotesCount((prev) => Math.max(0, prev - 1));
    const supabase = createClient();
    const { error } = await supabase.from('video_notes').delete().eq('id', id);
    if (error) console.error('Failed to delete note:', error.message);
  };

  if (loadState === 'loading') {
    return (
      <DashboardLayout isDark={isDark} onToggleDark={handleToggleDark}>
        <div className="flex items-center justify-center py-24">
          <Loader2 size={28} className="animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>);

  }

  if (loadState === 'error' || !currentSubject) {
    return (
      <DashboardLayout isDark={isDark} onToggleDark={handleToggleDark}>
        <div className="text-center py-24">
          <Video size={36} className="text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium text-foreground">Couldn't load video lectures</p>
          <p className="text-xs text-muted-foreground mt-1">Please refresh the page to try again.</p>
        </div>
      </DashboardLayout>);

  }

  // Filter videos in current subject
  const filteredChapters = currentSubject.chapters.map((chapter) => ({
    ...chapter,
    videos: chapter.videos.filter((v) => {
      const matchesSearch = !searchQuery || v.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterWatched === 'all' || filterWatched === 'watched' && v.watchedSeconds > 0 || filterWatched === 'unwatched' && v.watchedSeconds === 0;
      return matchesSearch && matchesFilter;
    }),
  })).filter((c) => c.videos.length > 0);

  const subjectTotalVideos = currentSubject.chapters.flatMap((c) => c.videos).length;
  const subjectWatched = currentSubject.chapters.flatMap((c) => c.videos).filter((v) => v.isCompleted).length;
  const subjectProgress = subjectTotalVideos > 0 ? Math.round(subjectWatched / subjectTotalVideos * 100) : 0;

  return (
    <DashboardLayout isDark={isDark} onToggleDark={handleToggleDark}>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Video size={20} className="text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Lecture Videos</h1>
              <p className="text-xs text-muted-foreground">Browse, watch, and track your learning progress</p>
            </div>
          </div>
        </div>

        {/* Overall Progress Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
          { label: 'Total Videos', value: totalVideos, icon: Video, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'In Progress', value: Math.max(0, watchedCount - completedCount), icon: TrendingUp, color: 'text-chem', bg: 'bg-chem-light' },
          { label: 'Completed', value: completedCount, icon: CheckCircle2, color: 'text-bio', bg: 'bg-bio-light' },
          { label: 'My Notes', value: totalNotesCount, icon: StickyNote, color: 'text-ma', bg: 'bg-ma-light' }].
          map((stat) =>
          <div key={stat.label} className="bg-card border border-border rounded-xl p-3.5 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center shrink-0`}>
                <stat.icon size={18} className={stat.color} />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground leading-none">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-5">
          {/* Left: Subject tabs */}
          <div className="w-full lg:w-64 shrink-0">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Subjects</p>
              </div>
              <div className="p-2">
                {subjectsData.map((subject) => {
                  const sVideos = subject.chapters.flatMap((c) => c.videos);
                  const sDone = sVideos.filter((v) => v.isCompleted).length;
                  const sProgress = sVideos.length > 0 ? Math.round(sDone / sVideos.length * 100) : 0;
                  const isActive = activeSubject === subject.name;
                  return (
                    <button
                      key={subject.id}
                      onClick={() => setActiveSubject(subject.name)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg mb-1 transition-all text-left ${
                      isActive ? 'bg-secondary' : 'hover:bg-muted'}`
                      }>
                      <div className={`w-7 h-7 rounded-lg ${subject.bgLight} flex items-center justify-center shrink-0`}>
                        <span className="text-sm">{subject.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>{subject.displayName}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="flex-1 h-1 bg-muted rounded-full">
                            <div className="h-full rounded-full" style={{ width: `${sProgress}%`, backgroundColor: subject.color }} />
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">{sProgress}%</span>
                        </div>
                      </div>
                    </button>);

                })}
              </div>
            </div>
          </div>

          {/* Right: Video grid */}
          <div className="flex-1 min-w-0">
            {/* Subject header */}
            <div className="bg-card border border-border rounded-xl p-4 mb-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${currentSubject.bgLight} flex items-center justify-center`}>
                  <span className="text-lg">{currentSubject.icon}</span>
                </div>
                <div>
                  <p className="font-bold text-foreground">{currentSubject.displayName}</p>
                  <p className="text-xs text-muted-foreground">{subjectWatched}/{subjectTotalVideos} completed · {subjectProgress}% done</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-24 h-2 bg-muted rounded-full">
                  <div className="h-full rounded-full transition-all" style={{ width: `${subjectProgress}%`, backgroundColor: currentSubject.color }} />
                </div>
                <span className="text-sm font-bold" style={{ color: currentSubject.color }}>{subjectProgress}%</span>
              </div>
            </div>

            {/* Search + Filter */}
            <div className="flex gap-2 mb-4">
              <div className="flex-1 relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search videos..."
                  className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div className="flex gap-1">
                {(['all', 'watched', 'unwatched'] as const).map((f) =>
                <button
                  key={f}
                  onClick={() => setFilterWatched(f)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium capitalize transition-colors ${
                  filterWatched === f ? 'bg-primary text-white' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`
                  }>
                    {f}
                  </button>
                )}
              </div>
            </div>

            {/* Chapters */}
            {filteredChapters.length === 0 ?
            <div className="bg-card border border-border rounded-xl p-10 text-center">
                <Video size={36} className="text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-sm font-medium text-foreground">
                  {subjectTotalVideos === 0 ? 'No videos for this subject yet' : 'No videos found'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {subjectTotalVideos === 0 ? 'Check back soon — new lectures are added regularly.' : 'Try adjusting your search or filter'}
                </p>
              </div> :

            <div className="space-y-4">
                {filteredChapters.map((chapter) => {
                const isExpanded = expandedChapters.has(chapter.id);
                const chapterDone = chapter.videos.filter((v) => v.isCompleted).length;
                return (
                  <div key={chapter.id} className="bg-card border border-border rounded-xl overflow-hidden">
                      <button
                      onClick={() => toggleChapter(chapter.id)}
                      className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-7 h-7 rounded-lg ${currentSubject.bgLight} flex items-center justify-center shrink-0`}>
                            <Video size={14} className={currentSubject.textColor} />
                          </div>
                          <div className="text-left min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{chapter.title}</p>
                            <p className="text-xs text-muted-foreground">{chapterDone}/{chapter.videos.length} videos completed</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span className="text-xs font-medium text-muted-foreground hidden sm:block">
                            {chapter.videos.length} videos
                          </span>
                          {isExpanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                        </div>
                      </button>

                      {isExpanded &&
                    <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 border-t border-border pt-4">
                          {chapter.videos.map((video) => {
                        const isLocked = video.isPremium && isFree;
                        return (
                          <VideoCard
                            key={video.id}
                            video={video}
                            subjectColor={currentSubject.color}
                            isLocked={isLocked}
                            onPlay={setPlayingVideo} />);


                      })}
                        </div>
                    }
                    </div>);

              })}
              </div>
            }
          </div>
        </div>
      </div>

      {/* Video Player Modal */}
      {playingVideo &&
      <VideoPlayer
        video={playingVideo}
        subjectColor={currentSubject.color}
        notes={notes}
        notesLoading={notesLoading}
        onAddNote={handleAddNote}
        onDeleteNote={handleDeleteNote}
        onClose={() => setPlayingVideo(null)}
        onMarkWatched={handleMarkWatched} />

      }
    </DashboardLayout>);

}
