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
  Headphones,
  Radio,
  Sparkles,
} from 'lucide-react';

import DynamicDrmWatermark from './DynamicDrmWatermark';

interface BunnyHlsPlayerProps {
  videoUrl: string; // e.g. https://vz-11253e6e-275.b-cdn.net/guid/playlist.m3u8
  thumbnailUrl?: string;
  title?: string;
  autoPlay?: boolean;
  initialTime?: number; // Seek here on initial load for resume playback
  seekTo?: number; // Seek here when triggered from timestamped note
  captionsUrl?: string;
  enableWatermark?: boolean;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onPause?: (currentTime: number) => void;
  onPlay?: () => void;
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
  enableWatermark = true,
  onEnded,
  onTimeUpdate,
  onPause,
  onPlay,
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
  const [qualityLevels, setQualityLevels] = useState<{ id: number; height: number; bitrate: number }[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1); // -1 = Auto

  // Mobile-friendly menu toggles
  const [showSpeedMenu, setShowSpeedMenu] = useState<boolean>(false);
  const [showQualityMenu, setShowQualityMenu] = useState<boolean>(false);
  const [captionsEnabled, setCaptionsEnabled] = useState<boolean>(false);
  const [resumeNotice, setResumeNotice] = useState<string | null>(null);
  const [isAudioOnly, setIsAudioOnly] = useState<boolean>(false);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasAppliedInitialTime = useRef<boolean>(false);
  const prevQualityRef = useRef<number>(-1);

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

    // Detect slow mobile connection (2G / 3G / OS Data Saver) to cap initial HLS stream
    const navConn = typeof navigator !== 'undefined' ? (navigator as any).connection : null;
    const isSlowNetwork = Boolean(
      navConn?.saveData ||
      navConn?.effectiveType === 'slow-2g' ||
      navConn?.effectiveType === '2g' ||
      navConn?.effectiveType === '3g'
    );

    // Use HLS.js for Chrome, Firefox, Edge, Android
    (async () => {
      try {
        const HlsModule = (await import('hls.js')).default;
        if (destroyed) return;

        if (HlsModule.isSupported()) {
          hls = new HlsModule({
            enableWorker: true,
            capLevelToPlayerSize: true,
            backBufferLength: isSlowNetwork ? 30 : 90,
            maxBufferLength: isSlowNetwork ? 15 : 30,
            startLevel: isSlowNetwork ? 0 : -1, // Start at lowest level on 2G/3G/DataSaver, otherwise Auto
          });

          hlsRef.current = hls;
          hls.loadSource(videoUrl);
          hls.attachMedia(video);

          hls.on(HlsModule.Events.MANIFEST_PARSED, (event: any, data: any) => {
            setIsBuffering(false);
            if (data.levels) {
              const levels = data.levels.map((l: any, idx: number) => ({
                id: idx,
                height: l.height || 0,
                bitrate: l.bitrate || 0,
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

  const handleSkip = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + seconds));
  }, []);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const val = parseFloat(e.target.value);
    video.volume = val;
    setVolume(val);
    setIsMuted(val === 0);
  };

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isMuted) {
      video.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      video.volume = 0;
      setIsMuted(true);
    }
  }, [isMuted, volume]);

  const changePlaybackRate = useCallback((rate: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  // Global Keyboard Shortcuts (PW Classroom Standard with Input Focus Guard)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Guard against typing in forms/inputs/textareas/contenteditable
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          (activeEl as HTMLElement).isContentEditable)
      ) {
        return;
      }

      const video = videoRef.current;
      if (!video) return;

      switch (e.key) {
        case ' ':
        case 'k':
        case 'K':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'ArrowLeft':
        case 'j':
        case 'J':
          e.preventDefault();
          handleSkip(-10);
          break;
        case 'ArrowRight':
        case 'l':
        case 'L':
          e.preventDefault();
          handleSkip(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          video.volume = Math.min(1, Math.round((video.volume + 0.05) * 100) / 100);
          setVolume(video.volume);
          setIsMuted(false);
          break;
        case 'ArrowDown':
          e.preventDefault();
          video.volume = Math.max(0, Math.round((video.volume - 0.05) * 100) / 100);
          setVolume(video.volume);
          setIsMuted(video.volume === 0);
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case '<':
        case ',': {
          e.preventDefault();
          const speeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
          const currIdx = speeds.indexOf(playbackRate);
          if (currIdx > 0) {
            changePlaybackRate(speeds[currIdx - 1]);
          }
          break;
        }
        case '>':
        case '.': {
          e.preventDefault();
          const speeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
          const currIdx = speeds.indexOf(playbackRate);
          if (currIdx >= 0 && currIdx < speeds.length - 1) {
            changePlaybackRate(speeds[currIdx + 1]);
          }
          break;
        }
        case '1':
          e.preventDefault();
          changePlaybackRate(1);
          break;
        case '2':
          e.preventDefault();
          changePlaybackRate(1.25);
          break;
        case '3':
          e.preventDefault();
          changePlaybackRate(1.5);
          break;
        case '4':
          e.preventDefault();
          changePlaybackRate(2);
          break;
        case '0':
          e.preventDefault();
          video.currentTime = 0;
          setCurrentTime(0);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePlayPause, handleSkip, toggleMute, toggleFullscreen, changePlaybackRate, playbackRate]);

  const changeQuality = (levelId: number) => {
    setIsAudioOnly(false);
    setCurrentQuality(levelId);
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelId;
      if (hlsRef.current.config) {
        hlsRef.current.config.maxBufferLength = 30;
      }
    }
    setShowQualityMenu(false);
  };

  // Find lowest bitrate/resolution HLS level and calculate genuine bandwidth reduction
  const lowestLevelInfo = React.useMemo(() => {
    if (qualityLevels.length === 0) return null;
    let lowest = qualityLevels[0];
    let highest = qualityLevels[0];
    for (const lvl of qualityLevels) {
      const mLow = lowest.bitrate || lowest.height || Infinity;
      const mCurr = lvl.bitrate || lvl.height || Infinity;
      if (mCurr < mLow) lowest = lvl;
      if ((lvl.bitrate || lvl.height) > (highest.bitrate || highest.height)) highest = lvl;
    }
    const savingsPct =
      highest.bitrate > 0 && lowest.bitrate > 0 && highest.bitrate > lowest.bitrate
        ? Math.round((1 - lowest.bitrate / highest.bitrate) * 100)
        : null;
    return {
      id: lowest.id,
      height: lowest.height,
      kbps: lowest.bitrate > 0 ? Math.round(lowest.bitrate / 1000) : null,
      savingsPct,
    };
  }, [qualityLevels]);

  const toggleLowDataMode = useCallback(
    (enable: boolean) => {
      if (enable) {
        prevQualityRef.current = currentQuality;
        setIsAudioOnly(true);
        if (hlsRef.current && lowestLevelInfo !== null) {
          hlsRef.current.currentLevel = lowestLevelInfo.id;
          hlsRef.current.nextLevel = lowestLevelInfo.id;
          if (hlsRef.current.config) {
            hlsRef.current.config.maxBufferLength = 10;
          }
          setCurrentQuality(lowestLevelInfo.id);
        }
      } else {
        setIsAudioOnly(false);
        const restoreLevel = prevQualityRef.current;
        setCurrentQuality(restoreLevel);
        if (hlsRef.current) {
          hlsRef.current.currentLevel = restoreLevel;
          if (hlsRef.current.config) {
            hlsRef.current.config.maxBufferLength = 30;
          }
        }
      }
    },
    [currentQuality, lowestLevelInfo]
  );

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
      onContextMenu={(e) => e.preventDefault()}
      onMouseLeave={() => isPlaying && !showSpeedMenu && !showQualityMenu && setShowControls(false)}
      className={`relative bg-black rounded-3xl overflow-hidden aspect-video flex items-center justify-center select-none group ${className}`}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        poster={thumbnailUrl}
        playsInline
        controlsList="nodownload"
        onContextMenu={(e) => e.preventDefault()}
        onPlay={() => {
          setIsPlaying(true);
          if (onPlay) onPlay();
        }}
        onPause={() => {
          setIsPlaying(false);
          if (onPause && videoRef.current) onPause(videoRef.current.currentTime);
        }}
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

      {/* Dynamic Anti-Piracy DRM Watermark */}
      {enableWatermark && !isAudioOnly && (
        <DynamicDrmWatermark />
      )}

      {/* Low-Data / Audio Focus Overlay */}
      {isAudioOnly && (
        <div className="absolute inset-0 z-15 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/40 flex flex-col items-center justify-center p-6 text-center select-none backdrop-blur-md">
          {/* Ambient Glow */}
          <div className="absolute w-64 h-64 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none animate-pulse" />
          
          {/* Animated Waveform Equalizer */}
          <div className="relative z-10 flex items-center justify-center gap-1.5 mb-4 h-14">
            {[35, 65, 90, 55, 80, 100, 75, 45, 85, 60, 75, 40].map((h, i) => (
              <div
                key={i}
                className={`w-1.5 rounded-full bg-gradient-to-t from-emerald-500 to-teal-300 transition-all ${
                  isPlaying ? 'animate-pulse' : 'opacity-40'
                }`}
                style={{
                  height: isPlaying ? `${Math.max(20, h * 0.85)}%` : '20%',
                  animationDelay: `${i * 80}ms`,
                  animationDuration: '800ms',
                }}
              />
            ))}
          </div>

          {/* Mode Pill & Honest Stream Metrics */}
          <div className="relative z-10 space-y-2 max-w-sm">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold tracking-wide">
              <Headphones size={13} />
              <span>
                {lowestLevelInfo
                  ? `Low-Data Stream Active (${lowestLevelInfo.height ? `${lowestLevelInfo.height}p` : 'Min Bitrate'}${
                      lowestLevelInfo.savingsPct ? ` • ~${lowestLevelInfo.savingsPct}% Less Data` : ''
                    })`
                  : 'Audio Focus Mode Active'}
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium line-clamp-1">
              {title || 'Lecture Stream'}
            </p>
            <p className="text-[11px] text-slate-400">
              {lowestLevelInfo
                ? `Locked to lowest available HLS stream${lowestLevelInfo.kbps ? ` (${lowestLevelInfo.kbps} kbps)` : ''} with reduced pre-buffering`
                : 'Video display hidden for distraction-free listening'}
            </p>
            <button
              onClick={() => toggleLowDataMode(false)}
              className="mt-2 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>Restore Video Display</span>
            </button>
          </div>
        </div>
      )}

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

          {/* Right Controls: Data Saver, Captions, Speed, Quality, Fullscreen */}
          <div className="flex items-center gap-1.5 sm:gap-2 relative">
            
            {/* Low-Data / Audio Focus Button */}
            <button
              onClick={() => toggleLowDataMode(!isAudioOnly)}
              title={
                isAudioOnly
                  ? 'Restore Video Display'
                  : lowestLevelInfo
                  ? `Lock to lowest HLS stream (${lowestLevelInfo.height || 'min'}p) & hide video`
                  : 'Hide video for distraction-free audio listening'
              }
              className={`p-1.5 sm:px-2 sm:py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                isAudioOnly
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                  : 'bg-white/10 hover:bg-white/20 text-white/90'
              }`}
            >
              <Headphones size={13} />
              <span className="hidden md:inline">
                {isAudioOnly
                  ? lowestLevelInfo?.savingsPct
                    ? `Low-Data (-${lowestLevelInfo.savingsPct}%)`
                    : 'Audio Focus'
                  : 'Data Saver'}
              </span>
            </button>

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

            {/* Quality / Resolution Selector */}
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
                <span>
                  {isAudioOnly
                    ? 'Low-Data'
                    : currentQuality === -1
                    ? 'Auto'
                    : qualityLevels[currentQuality]?.height
                    ? `${qualityLevels[currentQuality].height}p`
                    : 'Auto'}
                </span>
              </button>

              {showQualityMenu && (
                <div className="absolute bottom-full right-0 mb-2 flex flex-col bg-slate-900 border border-slate-700 rounded-xl overflow-hidden p-1 shadow-2xl z-50 min-w-[150px]">
                  <span className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">Stream Quality</span>
                  
                  {/* Auto Quality */}
                  <button
                    onClick={() => changeQuality(-1)}
                    className={`px-3 py-1.5 text-xs font-mono text-left rounded-lg transition-colors flex items-center justify-between cursor-pointer ${
                      !isAudioOnly && currentQuality === -1 ? 'bg-emerald-600 text-white font-bold' : 'text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <span>Auto (Adaptive)</span>
                    {!isAudioOnly && currentQuality === -1 && <Check size={12} />}
                  </button>

                  {/* Low-Data / Audio Focus */}
                  <button
                    onClick={() => {
                      toggleLowDataMode(true);
                      setShowQualityMenu(false);
                    }}
                    className={`px-3 py-1.5 text-xs font-mono text-left rounded-lg transition-colors flex items-center justify-between cursor-pointer ${
                      isAudioOnly ? 'bg-emerald-600 text-white font-bold' : 'text-emerald-400 hover:bg-white/10'
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      <Headphones size={11} />
                      <span>
                        {lowestLevelInfo
                          ? `Low-Data (${lowestLevelInfo.height || 'Min'}p)`
                          : 'Audio Focus'}
                      </span>
                    </span>
                    {isAudioOnly && <Check size={12} />}
                  </button>

                  {/* Actual parsed HLS quality levels only */}
                  {qualityLevels.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => changeQuality(l.id)}
                      className={`px-3 py-1.5 text-xs font-mono text-left rounded-lg transition-colors flex items-center justify-between cursor-pointer ${
                        !isAudioOnly && currentQuality === l.id ? 'bg-emerald-600 text-white font-bold' : 'text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <span>
                        {l.height ? `${l.height}p` : `Level ${l.id + 1}`}
                        {l.bitrate ? ` (${Math.round(l.bitrate / 1000)} kbps)` : ''}
                      </span>
                      {!isAudioOnly && currentQuality === l.id && <Check size={12} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

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
