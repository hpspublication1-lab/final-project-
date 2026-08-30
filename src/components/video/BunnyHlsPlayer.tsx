'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  Loader2,
  AlertCircle,
  Settings,
} from 'lucide-react';

interface BunnyHlsPlayerProps {
  videoUrl: string; // e.g. https://vz-11253e6e-275.b-cdn.net/guid/playlist.m3u8
  thumbnailUrl?: string;
  title?: string;
  autoPlay?: boolean;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  className?: string;
}

export default function BunnyHlsPlayer({
  videoUrl,
  thumbnailUrl,
  title,
  autoPlay = true,
  onEnded,
  onTimeUpdate,
  className = '',
}: BunnyHlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<any>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [qualityLevels, setQualityLevels] = useState<{ id: number; height: number }[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1); // -1 = Auto

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize HLS / Native Video
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    setHasError(false);
    setIsBuffering(true);

    let hls: any = null;
    let destroyed = false;

    const isHls = videoUrl.includes('.m3u8') || videoUrl.includes('playlist.m3u8');

    if (!isHls) {
      video.src = videoUrl;
      if (autoPlay) {
        video.play().catch(() => setIsPlaying(false));
      }
      return;
    }

    // Native HLS support (Safari / iOS)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = videoUrl;
      if (autoPlay) {
        video.play().catch(() => setIsPlaying(false));
      }
      return;
    }

    // Use HLS.js for Chrome, Firefox, Edge, Android
    (async () => {
      try {
        const HlsModule = (await import('hls.js')).default;
        if (destroyed) return;

        if (HlsModule.isSupported()) {
          hls = new HlsModule({
            enableWorker: true,
            capLevelToPlayerSize: true,
            backBufferLength: 90,
            maxBufferLength: 30,
            startLevel: -1, // Auto
          });

          hlsRef.current = hls;
          hls.loadSource(videoUrl);
          hls.attachMedia(video);

          hls.on(HlsModule.Events.MANIFEST_PARSED, (event: any, data: any) => {
            setIsBuffering(false);
            if (data.levels) {
              const levels = data.levels.map((l: any, idx: number) => ({
                id: idx,
                height: l.height,
              }));
              setQualityLevels(levels);
            }
            if (autoPlay) {
              video.play().catch(() => setIsPlaying(false));
            }
          });

          hls.on(HlsModule.Events.ERROR, (event: any, data: any) => {
            if (data.fatal) {
              switch (data.type) {
                case HlsModule.ErrorTypes.NETWORK_ERROR:
                  console.warn('HLS Network error, recovering...');
                  hls.startLoad();
                  break;
                case HlsModule.ErrorTypes.MEDIA_ERROR:
                  console.warn('HLS Media error, recovering...');
                  hls.recoverMediaError();
                  break;
                default:
                  console.error('Fatal HLS error:', data);
                  setHasError(true);
                  hls.destroy();
                  break;
              }
            }
          });
        } else {
          video.src = videoUrl;
        }
      } catch (err) {
        console.error('Failed to load HLS.js:', err);
        video.src = videoUrl;
      }
    })();

    return () => {
      destroyed = true;
      if (hls) {
        hls.destroy();
        hlsRef.current = null;
      }
    };
  }, [videoUrl, autoPlay]);

  // Video Event Handlers
  const handlePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
    if (onTimeUpdate) {
      onTimeUpdate(video.currentTime, video.duration || 0);
    }
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration || 0);
    setIsBuffering(false);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const time = parseFloat(e.target.value);
    video.currentTime = time;
    setCurrentTime(time);
  };

  const handleSkip = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + seconds));
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const val = parseFloat(e.target.value);
    video.volume = val;
    setVolume(val);
    setIsMuted(val === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isMuted) {
      video.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      video.volume = 0;
      setIsMuted(true);
    }
  };

  const changePlaybackRate = (rate: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const changeQuality = (levelId: number) => {
    setCurrentQuality(levelId);
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelId;
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const formatTime = (time: number) => {
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className={`relative bg-black rounded-3xl overflow-hidden aspect-video flex items-center justify-center select-none group ${className}`}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        poster={thumbnailUrl}
        playsInline
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => {
          setIsPlaying(false);
          if (onEnded) onEnded();
        }}
        onClick={handlePlayPause}
        className="w-full h-full object-contain cursor-pointer"
      />

      {/* Buffering Spinner */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none z-20">
          <Loader2 size={48} className="animate-spin text-emerald-400" />
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-6 space-y-3 z-30">
          <AlertCircle size={40} className="text-red-400" />
          <p className="text-sm font-bold text-center">Unable to stream video</p>
          <button
            onClick={() => {
              if (videoRef.current) videoRef.current.load();
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-xs font-bold transition-all"
          >
            Retry Streaming
          </button>
        </div>
      )}

      {/* Big Center Play Button (When Paused) */}
      {!isPlaying && !isBuffering && (
        <button
          onClick={handlePlayPause}
          className="absolute z-20 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-500/90 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95"
        >
          <Play size={32} className="fill-slate-950 ml-1" />
        </button>
      )}

      {/* Bottom Controls Overlay */}
      <div
        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 sm:p-5 space-y-2 z-30 transition-opacity duration-300 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Progress Scrubber */}
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-white/20 accent-emerald-400 rounded-full appearance-none cursor-pointer"
          />
        </div>

        {/* Control Buttons Row */}
        <div className="flex items-center justify-between gap-2 text-white">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Play/Pause */}
            <button
              onClick={handlePlayPause}
              className="p-2 hover:bg-white/15 rounded-xl transition-colors"
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} className="fill-white" />}
            </button>

            {/* Skip Backward 10s */}
            <button
              onClick={() => handleSkip(-10)}
              className="p-2 hover:bg-white/15 rounded-xl transition-colors hidden sm:block"
              title="Rewind 10s"
            >
              <RotateCcw size={16} />
            </button>

            {/* Skip Forward 10s */}
            <button
              onClick={() => handleSkip(10)}
              className="p-2 hover:bg-white/15 rounded-xl transition-colors hidden sm:block"
              title="Forward 10s"
            >
              <RotateCw size={16} />
            </button>

            {/* Volume */}
            <div className="flex items-center gap-1.5 group/vol">
              <button
                onClick={toggleMute}
                className="p-2 hover:bg-white/15 rounded-xl transition-colors"
              >
                {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-14 sm:w-20 h-1 bg-white/20 accent-emerald-400 rounded-full appearance-none cursor-pointer hidden group-hover/vol:block sm:block"
              />
            </div>

            {/* Time Stamp */}
            <span className="text-xs font-mono text-white/80 select-none">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Right Controls: Quality, Speed, Fullscreen */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Speed Selector */}
            <div className="relative group/speed">
              <button className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-mono font-bold transition-colors">
                {playbackRate}x
              </button>
              <div className="absolute bottom-full right-0 mb-2 hidden group-hover/speed:flex flex-col bg-slate-900 border border-slate-700 rounded-xl overflow-hidden p-1 shadow-xl z-40">
                {[0.75, 1, 1.25, 1.5, 1.75, 2].map((r) => (
                  <button
                    key={r}
                    onClick={() => changePlaybackRate(r)}
                    className={`px-3 py-1 text-xs font-mono text-left rounded-lg transition-colors ${
                      playbackRate === r ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {r}x
                  </button>
                ))}
              </div>
            </div>

            {/* Quality Selector (If HLS levels available) */}
            {qualityLevels.length > 0 && (
              <div className="relative group/qual hidden sm:block">
                <button className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-mono font-bold transition-colors flex items-center gap-1">
                  <Settings size={12} />
                  <span>{currentQuality === -1 ? 'Auto' : `${qualityLevels[currentQuality]?.height}p`}</span>
                </button>
                <div className="absolute bottom-full right-0 mb-2 hidden group-hover/qual:flex flex-col bg-slate-900 border border-slate-700 rounded-xl overflow-hidden p-1 shadow-xl z-40">
                  <button
                    onClick={() => changeQuality(-1)}
                    className={`px-3 py-1 text-xs font-mono text-left rounded-lg transition-colors ${
                      currentQuality === -1 ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    Auto
                  </button>
                  {qualityLevels.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => changeQuality(l.id)}
                      className={`px-3 py-1 text-xs font-mono text-left rounded-lg transition-colors ${
                        currentQuality === l.id ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {l.height}p
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-white/15 rounded-xl transition-colors"
            >
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
