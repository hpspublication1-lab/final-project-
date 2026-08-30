'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Loader2,
  GraduationCap,
  UserRound,
  Calendar,
  CheckCircle2,
  Radio,
  Video,
  FileText,
  ClipboardList,
  ArrowLeft,
  ExternalLink,
  Download,
  PlayCircle,
  X,
  Search,
  Sparkles,
  Globe,
  Tv
} from 'lucide-react';

interface Batch {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  cee_year: number | null;
  instructor_name: string | null;
  thumbnail_url: string | null;
  start_date: string | null;
  end_date: string | null;
  price_npr: number;
  is_premium: boolean;
  subject: { display_name: string; icon: string | null } | { display_name: string; icon: string | null }[] | null;
}

interface LiveClass {
  id: string;
  title: string;
  scheduled_at: string;
  duration_min: number;
  meeting_url: string | null;
  status: string;
}

interface VideoLecture {
  id: string;
  title: string;
  video_url: string | null;
  thumbnail_url?: string | null;
  duration_sec: number;
}

interface Note {
  id: string;
  title: string;
  pdf_url: string | null;
}

interface Exam {
  id: string;
  title: string;
  duration_minutes: number;
  total_marks: number;
}

function getSubject(batch: Batch) {
  if (!batch.subject) return null;
  return Array.isArray(batch.subject) ? batch.subject[0] ?? null : batch.subject;
}

function formatDateRange(start: string | null, end: string | null): string | null {
  if (!start && !end) return null;
  const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  if (start && end) return `${fmt(start)} — ${fmt(end)}`;
  return fmt(start || end!);
}

function formatDuration(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  if (mins < 60) return `${mins}:${secs.toString().padStart(2, '0')}`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

// Video Player Modal Component for direct Bunny.net HLS streams
function BatchVideoModal({ video, onClose }: { video: VideoLecture; onClose: () => void }) {
  const videoElRef = useRef<HTMLVideoElement>(null);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!video.video_url) return;
    (async () => {
      try {
        const res = await fetch(`/api/video/sign?video=${video.id}`);
        const data = await res.json().catch(() => null);
        if (!cancelled) setResolvedUrl(res.ok && data?.url ? data.url : video.video_url);
      } catch {
        if (!cancelled) setResolvedUrl(video.video_url);
      }
    })();
    return () => { cancelled = true; };
  }, [video.id, video.video_url]);

  useEffect(() => {
    const el = videoElRef.current;
    if (!el || !resolvedUrl) return;
    const url = resolvedUrl;
    const isHls = /\.m3u8(\?|$)/i.test(url) || url.includes('playlist.m3u8');
    let hls: any = null;
    let destroyed = false;

    if (!isHls) {
      el.src = url;
      setLoading(false);
      return;
    }
    if (el.canPlayType('application/vnd.apple.mpegurl')) {
      el.src = url;
      setLoading(false);
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
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setLoading(false);
            el.play().catch(() => {});
          });
        } else {
          el.src = url;
          setLoading(false);
        }
      } catch {
        el.src = url;
        setLoading(false);
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
        className="bg-card border border-border rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <div className="min-w-0">
            <p className="font-bold text-foreground text-sm truncate">{video.title}</p>
            <p className="text-xs text-muted-foreground">{formatDuration(video.duration_sec)} duration</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="relative aspect-video bg-black flex items-center justify-center">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
          )}
          <video
            ref={videoElRef}
            controls
            autoPlay
            playsInline
            className="w-full h-full object-contain"
          />
        </div>
      </div>
    </div>
  );
}

export default function BatchDetailClient({ slug }: { slug: string }) {
  const [isDark, setIsDark] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const [batch, setBatch] = useState<Batch | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [videos, setVideos] = useState<VideoLecture[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [activeVideo, setActiveVideo] = useState<VideoLecture | null>(null);
  const [videoSearch, setVideoSearch] = useState('');

  const isNepaliMedium = slug.includes('nepali') || batch?.title.includes('नेपाली') || batch?.title.includes('Nepali');
  const playerId = isNepaliMedium ? '367785' : '379737';

  const fetchData = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    const { data: batchData, error } = await supabase
      .from('batches')
      .select(
        'id, title, slug, description, cee_year, instructor_name, thumbnail_url, start_date, end_date, price_npr, is_premium, subject:subjects(display_name, icon)'
      )
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error || !batchData) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const typedBatch = batchData as unknown as Batch;
    setBatch(typedBatch);

    const [liveRes, videoRes, fallbackVidRes, notesRes, examsRes] = await Promise.all([
      supabase
        .from('live_classes')
        .select('id, title, scheduled_at, duration_min, meeting_url, status')
        .eq('batch_id', typedBatch.id)
        .order('scheduled_at', { ascending: true }),
      supabase
        .from('video_lectures')
        .select('id, title, video_url, duration_sec, thumbnail_url')
        .eq('batch_id', typedBatch.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('video_lectures')
        .select('id, title, video_url, duration_sec, thumbnail_url')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('notes')
        .select('id, title, pdf_url')
        .eq('batch_id', typedBatch.id)
        .eq('is_active', true),
      supabase
        .from('exams')
        .select('id, title, duration_minutes, total_marks')
        .eq('batch_id', typedBatch.id)
        .eq('is_published', true),
    ]);

    setLiveClasses(liveRes.data || []);
    let bVideos = videoRes.data || [];

    // If batch has no videos in database, automatically fetch all Bunny Stream playlist lectures
    if (bVideos.length === 0) {
      try {
        const libId = slug.includes('nepali') ? '367785' : '379737';
        const bunnyRes = await fetch(`/api/bunny/videos?libraryId=${libId}`);
        if (bunnyRes.ok) {
          const bunnyData = await bunnyRes.json();
          if (bunnyData.videos && bunnyData.videos.length > 0) {
            bVideos = bunnyData.videos.map((bv: any) => ({
              id: bv.id,
              title: bv.title,
              video_url: bv.videoUrl,
              duration_sec: bv.durationSec,
              thumbnail_url: bv.thumbnailUrl,
            }));
          }
        }
      } catch (err) {
        console.warn('Failed to load Bunny videos in batch:', err);
      }
    }

    setVideos(bVideos.length > 0 ? bVideos : fallbackVidRes.data || []);
    setNotes(notesRes.data || []);
    setExams(examsRes.data || []);

    if (user?.id) {
      const { data: enrollment } = await supabase
        .from('batch_enrollments')
        .select('id')
        .eq('batch_id', typedBatch.id)
        .eq('student_id', user.id)
        .maybeSingle();
      setEnrolled(!!enrollment);
    }

    setLoading(false);
  }, [slug, user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEnroll = async () => {
    if (!user) {
      router.push('/sign-up-login-screen');
      return;
    }
    if (!batch) return;
    setEnrolling(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('batch_enrollments')
        .insert({ batch_id: batch.id, student_id: user.id });
      if (error) throw error;
      setEnrolled(true);
      toast.success('Enrolled! This batch now shows up in "My Batches".');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not enroll in this batch');
    } finally {
      setEnrolling(false);
    }
  };

  const filteredVideos = videos.filter((v) =>
    v.title.toLowerCase().includes(videoSearch.toLowerCase())
  );

  if (loading) {
    return (
      <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
        <div className="flex items-center justify-center py-32 space-y-3">
          <Loader2 size={32} className="animate-spin text-emerald-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (notFound || !batch) {
    return (
      <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
        <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-3">
          <GraduationCap size={36} className="text-muted-foreground mx-auto" />
          <h1 className="text-xl font-black text-foreground">Batch Not Found</h1>
          <p className="text-xs text-muted-foreground">This batch may have been updated or moved.</p>
          <Link href="/batches" className="inline-flex px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs">
            <ArrowLeft size={15} className="mr-1.5" /> Back to Batches
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const subject = getSubject(batch);
  const dateRange = formatDateRange(batch.start_date, batch.end_date);

  return (
    <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Breadcrumb & Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <Link
            href="/batches"
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors font-bold"
          >
            <ArrowLeft size={14} /> Back to Batches
          </Link>

          {/* Quick Medium Switcher */}
          {slug.includes('see') && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground font-medium">Other Medium:</span>
              {isNepaliMedium ? (
                <Link
                  href="/batches/see-2026-english-medium"
                  className="px-3 py-1 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 font-bold border border-blue-500/30 transition-all flex items-center gap-1"
                >
                  <span>🇬🇧 Switch to English Medium (379737)</span>
                </Link>
              ) : (
                <Link
                  href="/batches/see-2026-nepali-medium"
                  className="px-3 py-1 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 font-bold border border-red-500/30 transition-all flex items-center gap-1"
                >
                  <span>🇳🇵 Switch to Nepali Medium (367785)</span>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Header Card */}
        <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                {isNepaliMedium ? (
                  <span className="px-3 py-1 rounded-xl bg-red-500/10 text-red-600 border border-red-500/30 text-xs font-black">
                    🇳🇵 नेपाली माध्यम (Nepali Medium)
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/30 text-xs font-black">
                    🇬🇧 English Medium
                  </span>
                )}
                <span className="px-2.5 py-1 rounded-xl bg-muted text-muted-foreground font-mono text-[10px] font-bold border border-border">
                  Player Library: {playerId}
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 text-xs font-bold font-mono">
                  Target {batch.cee_year || 2026}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-foreground leading-tight">
                {batch.title}
              </h1>

              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {batch.description}
              </p>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-2 text-xs text-muted-foreground font-mono">
                <span className="flex items-center gap-1.5 text-foreground font-sans font-bold">
                  <UserRound size={14} className={isNepaliMedium ? 'text-red-500' : 'text-blue-500'} />
                  {batch.instructor_name || 'Faculty Team'}
                </span>
                {dateRange && (
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} /> {dateRange}
                  </span>
                )}
              </div>
            </div>

            {/* Enroll CTA */}
            <div className="flex flex-col sm:items-end gap-3 bg-muted/40 p-5 rounded-2xl border border-border shrink-0 sm:min-w-[220px]">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground block">ONE-TIME FEE</span>
                <span className="text-2xl font-black text-foreground">
                  {batch.price_npr > 0 ? `Rs. ${batch.price_npr.toLocaleString()}` : 'Free'}
                </span>
              </div>

              {enrolled ? (
                <div className="px-5 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 font-black text-xs border border-emerald-500/30 flex items-center gap-2">
                  <CheckCircle2 size={16} /> Enrolled
                </div>
              ) : (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className={`w-full py-3 px-6 rounded-xl font-black text-xs text-white shadow-lg flex items-center justify-center gap-2 transition-all ${
                    isNepaliMedium ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {enrolling ? <Loader2 size={15} className="animate-spin" /> : 'Enroll in Batch'}
                </button>
              )}

              <Link
                href="/lecture-videos"
                className="text-[11px] text-emerald-600 font-bold hover:underline flex items-center gap-1"
              >
                <Video size={13} /> Open Lecture Portal →
              </Link>
            </div>
          </div>
        </div>

        {/* Batch Question Bank & Digest Quick Resources */}
        <div className="p-5 rounded-3xl bg-muted/30 border border-border space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2">
              <Sparkles size={16} className="text-emerald-500" />
              <span>Batch Resources: 4-Way Question Bank &amp; Formula Capsules</span>
            </h3>
            <span className="text-[10px] font-mono text-muted-foreground">Included with this Batch</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Link
              href="/see/question-bank"
              className="p-3.5 rounded-2xl bg-card border border-border hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-1.5 shadow-xs group"
            >
              <div className="flex items-center justify-between text-xs font-bold text-emerald-600">
                <span>4-Way Question Bank</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10">1-4 MARKS</span>
              </div>
              <p className="text-xs font-black text-foreground group-hover:underline">10-Year Solved Questions</p>
              <p className="text-[10px] text-muted-foreground">Section 1, 2, 3 &amp; 4 step solutions</p>
            </Link>

            <Link
              href="/see/question-bank"
              className="p-3.5 rounded-2xl bg-card border border-border hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-1.5 shadow-xs group"
            >
              <div className="flex items-center justify-between text-xs font-bold text-amber-600">
                <span>Digestion Capsules</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10">PDF</span>
              </div>
              <p className="text-xs font-black text-foreground group-hover:underline">Formula &amp; Proof Booklets</p>
              <p className="text-[10px] text-muted-foreground">All math theorems &amp; physics formulas</p>
            </Link>

            <Link
              href="/practice/subjective"
              className="p-3.5 rounded-2xl bg-card border border-border hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-1.5 shadow-xs group"
            >
              <div className="flex items-center justify-between text-xs font-bold text-purple-600">
                <span>AI Subjective Grader</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/10">AI OCR</span>
              </div>
              <p className="text-xs font-black text-foreground group-hover:underline">Handwritten Paper Marker</p>
              <p className="text-[10px] text-muted-foreground">Instant photo check with NEB rubrics</p>
            </Link>

            <Link
              href="/mock-tests"
              className="p-3.5 rounded-2xl bg-card border border-border hover:border-blue-500/40 transition-all flex flex-col justify-between space-y-1.5 shadow-xs group"
            >
              <div className="flex items-center justify-between text-xs font-bold text-blue-600">
                <span>Full Board Mock Tests</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10">TIMED</span>
              </div>
              <p className="text-xs font-black text-foreground group-hover:underline">36 Solved Model Sets</p>
              <p className="text-[10px] text-muted-foreground">Board standard timing &amp; scoring</p>
            </Link>
          </div>
        </div>

        {/* Video Lectures Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-foreground">
                Batch HD Video Lectures ({filteredVideos.length})
              </h3>
              <p className="text-xs text-muted-foreground">
                Streaming via Bunny.net Stream (Library ID: {playerId})
              </p>
            </div>

            <div className="relative sm:w-64">
              <Search size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search lectures..."
                value={videoSearch}
                onChange={(e) => setVideoSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVideos.slice(0, 12).map((v, idx) => (
              <div
                key={v.id}
                onClick={() => setActiveVideo(v)}
                className="p-4 rounded-2xl bg-card border border-border hover:border-emerald-500/40 transition-all cursor-pointer flex flex-col justify-between space-y-3 group shadow-xs hover:shadow-md"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                    <span className="font-bold text-emerald-600">Lecture {idx + 1}</span>
                    <span>{formatDuration(v.duration_sec)}</span>
                  </div>
                  <h4 className="text-xs font-black text-foreground group-hover:text-emerald-600 transition-colors line-clamp-2">
                    {v.title}
                  </h4>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px] font-bold text-emerald-600">
                  <span>Watch Stream</span>
                  <PlayCircle size={14} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Video Player Modal */}
        {activeVideo && (
          <BatchVideoModal
            video={activeVideo}
            onClose={() => setActiveVideo(null)}
          />
        )}

      </div>
    </DashboardLayout>
  );
}
