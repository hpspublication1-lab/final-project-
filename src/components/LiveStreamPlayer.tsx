'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Wifi, AlertTriangle } from 'lucide-react';

/**
 * Adaptive in-app live player for broadcast classes (1 teacher → thousands of
 * students). Handles two provider modes:
 *   - 'hls':     low-latency adaptive HLS (.m3u8) via hls.js, with native
 *                fallback on Safari/iOS. Auto-selects bitrate (ABR) so students
 *                on weak connections drop to a lower quality automatically; a
 *                manual "Data saver" selector is exposed too.
 *   - 'youtube': YouTube Live embed (YouTube handles the CDN + ABR).
 *
 * Chat / Q&A / reactions run separately on Supabase Realtime — this component
 * is only responsible for the video, which is what lets it scale to thousands.
 */

import dynamic from 'next/dynamic';

const HMSLiveRoom = dynamic(() => import('@/components/HMSLiveRoom'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center p-12 bg-slate-950 rounded-2xl border border-slate-800 text-slate-400">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
      <p className="text-sm">Loading 100ms Interactive WebRTC Engine...</p>
    </div>
  ),
});

interface LiveStreamPlayerProps {
  provider: 'youtube' | 'hls' | '100ms';
  /** For youtube: video id or URL. For hls: the .m3u8 URL. For 100ms: Room ID or Code */
  src: string;
  poster?: string;
  autoPlay?: boolean;
  role?: string;
}

function extractYouTubeId(input: string): string {
  const m = input.match(/(?:youtu\.be\/|[?&]v=|embed\/|live\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : input;
}

export default function LiveStreamPlayer({ provider, src, poster, autoPlay = true, role }: LiveStreamPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);
  const [status, setStatus] = useState<'loading' | 'playing' | 'error'>('loading');
  const [levels, setLevels] = useState<{ index: number; label: string }[]>([]);
  const [selected, setSelected] = useState<number>(-1); // -1 = Auto (ABR)

  // ── 100ms Interactive WebRTC ─────────────────────────────────────────────
  if (provider === '100ms') {
    return <HMSLiveRoom roomId={src} role={role} />;
  }

  useEffect(() => {
    if (provider !== 'hls') return;
    const video = videoRef.current;
    if (!video) return;
    let destroyed = false;

    // Native HLS (Safari, iOS) — no library needed.
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      video.addEventListener('loadeddata', () => setStatus('playing'), { once: true });
      if (autoPlay) video.play().catch(() => {});
      return () => { video.removeAttribute('src'); video.load(); };
    }

    (async () => {
      try {
        const Hls = (await import('hls.js')).default;
        if (destroyed) return;
        if (!Hls.isSupported()) {
          setStatus('error');
          return;
        }
        const hls = new Hls({
          lowLatencyMode: true,       // LL-HLS for interactive Q&A latency
          enableWorker: true,
          capLevelToPlayerSize: true, // don't fetch 1080p into a small player
          backBufferLength: 30,
        });
        hlsRef.current = hls;
        hls.loadSource(src);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setLevels(
            hls.levels
              .map((l: any, i: number) => ({ index: i, label: l.height ? `${l.height}p` : `${Math.round((l.bitrate || 0) / 1000)}k` }))
              .reverse()
          );
          setStatus('playing');
          if (autoPlay) video.play().catch(() => {});
        });

        hls.on(Hls.Events.ERROR, (_evt: any, data: any) => {
          if (!data?.fatal) return;
          // Auto-recover from transient network/media errors (weak connections).
          if (data.type === 'networkError') {
            hls.startLoad();
          } else if (data.type === 'mediaError') {
            hls.recoverMediaError();
          } else {
            setStatus('error');
          }
        });
      } catch {
        setStatus('error');
      }
    })();

    return () => {
      destroyed = true;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [provider, src, autoPlay]);

  const changeLevel = (idx: number) => {
    setSelected(idx);
    if (hlsRef.current) hlsRef.current.currentLevel = idx; // -1 restores ABR
  };

  // ── YouTube Live ────────────────────────────────────────────────────────
  if (provider === 'youtube') {
    const id = extractYouTubeId(src);
    return (
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=${autoPlay ? 1 : 0}&rel=0&modestbranding=1&playsinline=1`}
        title="Live class"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full border-0"
      />
    );
  }

  // ── HLS ─────────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-full bg-black">
      <video ref={videoRef} poster={poster} controls playsInline className="w-full h-full bg-black" />

      {/* Live badge */}
      {status === 'playing' && (
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-error text-white text-xs font-bold px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
        </div>
      )}

      {/* Quality / data-saver selector */}
      {status === 'playing' && levels.length > 0 && (
        <div className="absolute top-3 right-3">
          <label className="flex items-center gap-1.5 bg-black/60 backdrop-blur text-white text-xs font-medium rounded-lg px-2 py-1.5">
            <Wifi size={13} />
            <select
              value={selected}
              onChange={(e) => changeLevel(parseInt(e.target.value))}
              className="bg-transparent text-white text-xs outline-none cursor-pointer"
            >
              <option className="text-black" value={-1}>Auto</option>
              {levels.map((l) => (
                <option key={l.index} className="text-black" value={l.index}>{l.label}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      {status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/80">
          <Loader2 size={26} className="animate-spin" />
          <p className="text-sm">Connecting to live stream…</p>
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/80 px-6 text-center">
          <AlertTriangle size={26} className="text-error" />
          <p className="text-sm font-medium">Couldn&apos;t load the live stream</p>
          <p className="text-xs text-white/50">Check your connection and refresh. If it persists, the class may not have started yet.</p>
        </div>
      )}
    </div>
  );
}
