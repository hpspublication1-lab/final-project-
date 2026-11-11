'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, X, HelpCircle } from 'lucide-react';

export default function BatchVideoPlayerModal({
  video,
  onClose,
}: {
  video: { id: string; title: string; videoUrl?: string; durationSec?: number };
  onClose: () => void;
}) {
  const videoElRef = useRef<HTMLVideoElement>(null);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!video.videoUrl) return;

    (async () => {
      try {
        const res = await fetch(`/api/video/sign?video=${video.id}`);
        const data = await res.json().catch(() => null);
        if (!cancelled) setResolvedUrl(res.ok && data?.url ? data.url : video.videoUrl || null);
      } catch {
        if (!cancelled) setResolvedUrl(video.videoUrl || null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [video.id, video.videoUrl]);

  useEffect(() => {
    const el = videoElRef.current;
    if (!el || !resolvedUrl) return;
    const url = resolvedUrl;
    const isHls = /\.m3u8(\?|$)/i.test(url) || url.includes('playlist.m3u8');
    let hlsInstance: any = null;
    let destroyed = false;

    if (!isHls) {
      el.src = url;
      setLoading(false);
      return;
    }

    if (el.canPlayType('application/vnd.apple.mpegurl')) {
      el.src = url;
      setLoading(false);
    } else {
      import('hls.js')
        .then(({ default: Hls }) => {
          if (destroyed || !el) return;
          if (Hls.isSupported()) {
            hlsInstance = new Hls({ enableWorker: true });
            hlsInstance.loadSource(url);
            hlsInstance.attachMedia(el);
            hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => setLoading(false));
            hlsInstance.on(Hls.Events.ERROR, (_: any, data: any) => {
              if (data?.fatal) setLoading(false);
            });
          } else {
            el.src = url;
            setLoading(false);
          }
        })
        .catch(() => {
          if (!destroyed && el) {
            el.src = url;
            setLoading(false);
          }
        });
    }

    return () => {
      destroyed = true;
      if (hlsInstance) hlsInstance.destroy();
    };
  }, [resolvedUrl]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={video.title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-200"
    >
      <div className="bg-card border border-border/90 rounded-2xl overflow-hidden max-w-4xl w-full shadow-2xl relative flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/40">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <h3 className="text-sm font-bold text-foreground line-clamp-1">{video.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="Close Player"
          >
            <X size={18} />
          </button>
        </div>

        {/* Video Area */}
        <div className="relative aspect-video bg-black flex items-center justify-center">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
              <Loader2 size={36} className="animate-spin text-primary" />
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

        {/* Footer controls */}
        <div className="p-3 bg-card border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>Samyak HD Video Player • 1080p Stream</span>
          <div className="flex items-center gap-3">
            <Link
              href="/doubts"
              className="text-primary hover:underline font-bold flex items-center gap-1"
            >
              <HelpCircle size={13} />
              <span>Ask Doubt on this Lecture</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
