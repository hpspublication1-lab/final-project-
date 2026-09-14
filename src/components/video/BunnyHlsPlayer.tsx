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
  Subtitles,
  Check,
} from 'lucide-react';

interface BunnyHlsPlayerProps {
  videoUrl: string; // e.g. https://vz-11253e6e-275.b-cdn.net/guid/playlist.m3u8
  thumbnailUrl?: string;
  title?: string;
  autoPlay?: boolean;
  initialTime?: number; // Seek here on initial load for resume playback
  seekTo?: number; // Seek here when triggered from timestamped note
  captionsUrl?: string;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  className?: string;
}

export default function BunnyHlsPlayer({
  videoUrl,
  thumbnailUrl,
  title,
  autoPlay = true,
  initialTime = 0,
  seekTo,
  captionsUrl,
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

  // Mobile-friendly menu toggles
  const [showSpeedMenu, setShowSpeedMenu] = useState<boolean>(false);
  const [showQualityMenu, setShowQualityMenu] = useState<boolean>(false);
  const [captionsEnabled, setCaptionsEnabled] = useState<boolean>(false);
  const [resumeNotice, setResumeNotice] = useState<string | null>(null);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasAppliedInitialTime = useRef<boolean>(false);

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return '0:00';
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Seek handler when seekTo prop changes (e.g., clicking timestamped note)
  useEffect(() => {
    if (typeof seekTo === 'number' && videoRef.current && !isNaN(seekTo)) {
      videoRef.current.currentTime = Math.max(0, seekTo);
      setCurrentTime(seekTo);
      if (!isPlaying) {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }
  }, [seekTo]);

  // Apply initial resume position once duration is ready
  const applyResumeTime = useCallback((video: HTMLVideoElement) => {
    if (!hasAppliedInitialTime.current && initialTime > 5) {
      hasAppliedInitialTime.current = true;
      try {
        video.currentTime = initialTime;
        setCurrentTime(initialTime);
        setResumeNotice(`Resumed playback from ${formatTime(initialTime)}`);
        setTimeout(() => setResumeNotice(null), 3500);
      } catch (err) {
        console.warn('Could not seek to initial time:', err);
      }
    }
  }, [initialTime]);

  // Initialize HLS / Native Video
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    setHasError(false);
    setIsBuffering(true);
    hasAppliedInitialTime.current = false;

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
            applyResumeTime(video);
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
  }, [videoUrl, autoPlay, applyResumeTime]);

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
    applyResumeTime(video);
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
    setShowSpeedMenu(false);
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
    setShowQualityMenu(false);
  };

  const toggleCaptions = () => {
    setCaptionsEnabled((prev) => !prev);
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !showSpeedMenu && !showQualityMenu) {
        setShowControls(false);
      }
    }, 3000);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onTouchStart={handleMouseMove}
      onMouseLeave={() => isPlaying && !showSpeedMenu && !showQualityMenu && setShowControls(false)}
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
      >
        {captionsUrl && (
          <track
            kind="subtitles"
            src={captionsUrl}
            srcLang="en"
            label="English / Nepali"
            default={captionsEnabled}
          />
        )}
      </video>

      {/* Resume Notice Indicator */}
      {resumeNotice && (
        <div className="absolute top-4 left-4 z-40 bg-slate-900/90 text-white border border-emerald-500/40 px-3.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md flex items-center gap-2 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>{resumeNotice}</span>
        </div>
      )}

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
          aria-label="Play Video"
          className="absolute z-20 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-500/90 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95 cursor-pointer"
        >
          <Play size={32} className="fill-slate-950 ml-1" />
        </button>
      )}

      {/* Bottom Controls Overlay */}
      <div
        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-3 sm:p-5 space-y-2.5 z-30 transition-opacity duration-300 ${
          showControls || !isPlaying || showSpeedMenu || showQualityMenu ? 'opacity-100' : 'opacity-0 pointer-events-none'
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
            aria-label="Video scrubber"
            className="w-full h-1.5 bg-white/20 accent-emerald-400 rounded-full appearance-none cursor-pointer"
          />
        </div>

        {/* Control Buttons Row */}
        <div className="flex items-center justify-between gap-2 text-white">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Play/Pause */}
            <button
              onClick={handlePlayPause}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="p-2 hover:bg-white/15 rounded-xl transition-colors cursor-pointer"
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} className="fill-white" />}
            </button>

            {/* Skip Backward 10s */}
            <button
              onClick={() => handleSkip(-10)}
              className="p-2 hover:bg-white/15 rounded-xl transition-colors hidden sm:block cursor-pointer"
              title="Rewind 10s"
            >
              <RotateCcw size={16} />
            </button>

            {/* Skip Forward 10s */}
            <button
              onClick={() => handleSkip(10)}
              className="p-2 hover:bg-white/15 rounded-xl transition-colors hidden sm:block cursor-pointer"
              title="Forward 10s"
            >
              <RotateCw size={16} />
            </button>

            {/* Volume */}
            <div className="flex items-center gap-1.5 group/vol">
              <button
                onClick={toggleMute}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
                className="p-2 hover:bg-white/15 rounded-xl transition-colors cursor-pointer"
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
                aria-label="Volume slider"
                className="w-14 sm:w-20 h-1 bg-white/20 accent-emerald-400 rounded-full appearance-none cursor-pointer hidden group-hover/vol:block sm:block"
              />
            </div>

            {/* Time Stamp */}
            <span className="text-xs font-mono text-white/85 select-none">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Right Controls: Captions, Speed, Quality, Fullscreen */}
          <div className="flex items-center gap-1.5 sm:gap-2 relative">
            
            {/* Captions Toggle */}
            <button
              onClick={toggleCaptions}
              title="Subtitles / Captions (CC)"
              aria-label="Subtitles"
              className={`p-1.5 sm:px-2 sm:py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                captionsEnabled
                  ? 'bg-emerald-500 text-slate-950 shadow-xs'
                  : 'bg-white/10 hover:bg-white/20 text-white/90'
              }`}
            >
              <Subtitles size={14} />
              <span className="hidden sm:inline">CC</span>
            </button>

            {/* Speed Selector (Touch + Click menu) */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowSpeedMenu(!showSpeedMenu);
                  setShowQualityMenu(false);
                }}
                aria-label="Playback speed"
                className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer"
              >
                {playbackRate}x
              </button>

              {showSpeedMenu && (
                <div className="absolute bottom-full right-0 mb-2 flex flex-col bg-slate-900 border border-slate-700 rounded-xl overflow-hidden p-1 shadow-2xl z-50 min-w-[90px]">
                  <span className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">Speed</span>
                  {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((r) => (
                    <button
                      key={r}
                      onClick={() => changePlaybackRate(r)}
                      className={`px-3 py-1.5 text-xs font-mono text-left rounded-lg transition-colors flex items-center justify-between cursor-pointer ${
                        playbackRate === r ? 'bg-emerald-600 text-white font-bold' : 'text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <span>{r}x</span>
                      {playbackRate === r && <Check size={12} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quality Selector (Touch + Click menu) */}
            {qualityLevels.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => {
                    setShowQualityMenu(!showQualityMenu);
                    setShowSpeedMenu(false);
                  }}
                  aria-label="Video quality"
                  className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-mono font-bold transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Settings size={12} />
                  <span>{currentQuality === -1 ? 'Auto' : `${qualityLevels[currentQuality]?.height}p`}</span>
                </button>

                {showQualityMenu && (
                  <div className="absolute bottom-full right-0 mb-2 flex flex-col bg-slate-900 border border-slate-700 rounded-xl overflow-hidden p-1 shadow-2xl z-50 min-w-[100px]">
                    <span className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">Quality</span>
                    <button
                      onClick={() => changeQuality(-1)}
                      className={`px-3 py-1.5 text-xs font-mono text-left rounded-lg transition-colors flex items-center justify-between cursor-pointer ${
                        currentQuality === -1 ? 'bg-emerald-600 text-white font-bold' : 'text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <span>Auto</span>
                      {currentQuality === -1 && <Check size={12} />}
                    </button>
                    {qualityLevels.map((l) => (
                      <button
                        key={l.id}
                        onClick={() => changeQuality(l.id)}
                        className={`px-3 py-1.5 text-xs font-mono text-left rounded-lg transition-colors flex items-center justify-between cursor-pointer ${
                          currentQuality === l.id ? 'bg-emerald-600 text-white font-bold' : 'text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <span>{l.height}p</span>
                        {currentQuality === l.id && <Check size={12} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              className="p-2 hover:bg-white/15 rounded-xl transition-colors cursor-pointer"
            >
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
