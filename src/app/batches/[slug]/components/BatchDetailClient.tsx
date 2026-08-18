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

// Video Player Modal Component for Bunny.net HLS streams
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
          hls.on(Hls.Events.MANIFEST_PARSED, () => setLoading(false));
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
        className="bg-card border border-border rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="min-w-0">
            <p className="font-semibold text-foreground text-sm truncate">{video.title}</p>
            <p className="text-xs text-muted-foreground">{formatDuration(video.duration_sec)} duration</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="relative aspect-video bg-black flex items-center justify-center">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
          <video
            ref={videoElRef}
            controls
            autoPlay
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
    const bVideos = videoRes.data || [];
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

  const filteredVideos = videos.filter(v => 
    v.title.toLowerCase().includes(videoSearch.toLowerCase())
  );

  if (loading) {
    return (
      <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
        <div className="flex items-center justify-center py-32">
          <Loader2 size={28} className="animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (notFound || !batch) {
    return (
      <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <GraduationCap size={32} className="text-muted-foreground mx-auto mb-3" />
          <h1 className="text-xl font-bold text-foreground">Batch not found</h1>
          <p className="text-sm text-muted-foreground mt-1">This batch may have been removed or is no longer active.</p>
          <Link href="/batches" className="btn-primary inline-flex mt-6">
            <ArrowLeft size={15} /> Back to Batches
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const subject = getSubject(batch);
  const dateRange = formatDateRange(batch.start_date, batch.end_date);

  return (
    <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
      <div className="max-w-screen-lg mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Link
          href="/batches"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft size={15} /> Back to Batches
        </Link>

        {/* Header card */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-4 min-w-0">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl shrink-0">
                {subject?.icon || <GraduationCap size={26} className="text-primary" />}
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-snug">{batch.title}</h1>
                {batch.description && (
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{batch.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-xs text-muted-foreground">
                  {subject?.display_name && (
                    <span className="flex items-center gap-1.5">
                      <GraduationCap size={13} /> {subject.display_name}
                      {batch.cee_year ? ` · CEE ${batch.cee_year}` : ''}
                    </span>
                  )}
                  {batch.instructor_name && (
                    <span className="flex items-center gap-1.5">
                      <UserRound size={13} /> {batch.instructor_name}
                    </span>
                  )}
                  {dateRange && (
                    <span className="flex items-center gap-1.5">
                      <Calendar size={13} /> {dateRange}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
              <span className="text-lg font-bold text-foreground">
                {batch.price_npr > 0 ? `Rs. ${batch.price_npr.toLocaleString()}` : 'Free'}
              </span>
              {batch.is_premium && (
                <span className="text-xs bg-warning-light text-warning px-2 py-0.5 rounded-full font-semibold">⭐ Pro</span>
              )}
              {enrolled ? (
                <span className="flex items-center gap-1.5 text-sm font-semibold text-success bg-success-light px-4 py-2 rounded-xl">
                  <CheckCircle2 size={15} /> Enrolled
                </span>
              ) : (
                <button onClick={handleEnroll} disabled={enrolling} className="btn-primary py-2 px-5 text-sm">
                  {enrolling ? <Loader2 size={15} className="animate-spin" /> : 'Enroll Now'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content sections */}
        <div className="space-y-5">
          {/* Bunny.net Video Lectures Section */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <div>
                <h2 className="font-bold text-foreground text-base flex items-center gap-2">
                  <Video size={18} className="text-primary" /> Video Lectures ({videos.length})
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">Streamed in adaptive HD via Bunny.net CDN</p>
              </div>

              {videos.length > 5 && (
                <div className="relative min-w-[200px]">
                  <Search size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search videos..."
                    value={videoSearch}
                    onChange={(e) => setVideoSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-muted/50 border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              )}
            </div>

            {filteredVideos.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">No video lectures found for this batch.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto pr-1">
                {filteredVideos.map((v) => (
                  <div
                    key={v.id}
                    onClick={() => setActiveVideo(v)}
                    className="group relative bg-muted/30 border border-border rounded-xl p-3 hover:bg-muted/70 transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative w-16 h-12 bg-slate-900 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                        {v.thumbnail_url ? (
                          <img src={v.thumbnail_url} alt={v.title} className="w-full h-full object-cover" />
                        ) : (
                          <Video size={18} className="text-slate-400" />
                        )}
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 flex items-center justify-center transition-colors">
                          <PlayCircle size={20} className="text-white drop-shadow-md group-hover:scale-110 transition-transform" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                          {v.title}
                        </p>
                        {v.duration_sec > 0 && (
                          <span className="inline-block mt-1 text-[10px] font-mono text-muted-foreground bg-muted/80 px-1.5 py-0.5 rounded">
                            {formatDuration(v.duration_sec)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-foreground text-sm flex items-center gap-2">
                <FileText size={16} className="text-bio" /> Notes
              </h2>
            </div>
            {notes.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3">No notes assigned to this batch yet.</p>
            ) : (
              <div className="space-y-2">
                {notes.map((n) => (
                  <a
                    key={n.id}
                    href={n.pdf_url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-muted/40 hover:bg-muted transition-colors"
                  >
                    <p className="text-sm font-medium text-foreground truncate">{n.title}</p>
                    <Download size={14} className="text-muted-foreground shrink-0" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Mock Tests */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-foreground text-sm flex items-center gap-2">
                <ClipboardList size={16} className="text-chem" /> Mock Tests
              </h2>
              <Link href="/mock-tests" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                Take a test <ExternalLink size={11} />
              </Link>
            </div>
            {exams.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3">No mock tests assigned to this batch yet.</p>
            ) : (
              <div className="space-y-2">
                {exams.map((e) => (
                  <div key={e.id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-muted/40">
                    <p className="text-sm font-medium text-foreground truncate">{e.title}</p>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {e.duration_minutes}m · {e.total_marks} marks
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Video Player Modal */}
      {activeVideo && (
        <BatchVideoModal video={activeVideo} onClose={() => setActiveVideo(null)} />
      )}
    </DashboardLayout>
  );
}
