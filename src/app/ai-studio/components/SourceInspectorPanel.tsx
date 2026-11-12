'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Headphones,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Sliders,
  ChevronRight,
  X,
  FileCode,
} from 'lucide-react';
import { SourceFactBlock, AudioPodcastEpisode } from '../types';

interface SourceInspectorPanelProps {
  selectedProof: SourceFactBlock | null;
  onClearProof: () => void;
  podcastEpisode: AudioPodcastEpisode;
}

export default function SourceInspectorPanel({
  selectedProof,
  onClearProof,
  podcastEpisode,
}: SourceInspectorPanelProps) {
  const [activeTab, setActiveTab] = useState<'proofs' | 'audio'>('proofs');

  // Audio player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeSec, setCurrentTimeSec] = useState(14);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.2);
  const [showPdfModal, setShowPdfModal] = useState(false);

  // Playback timer simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTimeSec((prev) => {
          if (prev >= podcastEpisode.durationSec) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000 / playbackSpeed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, podcastEpisode.durationSec]);

  // If a new proof is selected, switch to proofs tab
  useEffect(() => {
    if (selectedProof) {
      setActiveTab('proofs');
    }
  }, [selectedProof]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <aside className="w-full flex flex-col h-full bg-[#060913] border-l border-white/[0.08] text-slate-200">
      {/* Tab Switcher */}
      <div className="p-3 border-b border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <button
            onClick={() => setActiveTab('proofs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'proofs'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck size={13} />
            <span>Proofs &amp; OCR</span>
          </button>

          <button
            onClick={() => setActiveTab('audio')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'audio'
                ? 'bg-[#ff2d78]/20 text-[#ff2d78] border border-[#ff2d78]/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Headphones size={13} />
            <span>Audio Deep-Dive</span>
          </button>
        </div>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {activeTab === 'proofs' ? (
          <div className="space-y-4">
            {selectedProof ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 uppercase">
                    Cited Excerpt (Page {selectedProof.pageNumber})
                  </span>

                  <button
                    onClick={onClearProof}
                    className="text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-100">{selectedProof.sourceTitle}</span>
                    <span className="font-mono text-cyan-400 font-bold text-[11px]">
                      {selectedProof.semanticSimilarityScore}% Similarity
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/[0.05] font-mono text-xs text-cyan-200/90 leading-relaxed">
                    &ldquo;{selectedProof.verbatimExcerpt}&rdquo;
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-slate-400">Section 4.12 • Medical Organic Chemistry</span>

                    <button
                      onClick={() => setShowPdfModal(true)}
                      className="px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 font-bold flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <ExternalLink size={12} />
                      <span>View PDF Page</span>
                    </button>
                  </div>
                </div>

                {/* Additional context metrics */}
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2 text-xs">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                    Source Provenance Telemetry
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="p-2 rounded-lg bg-slate-900 border border-white/[0.04]">
                      <span className="text-slate-500 block text-[9px]">Corpus Hash</span>
                      <span className="text-cyan-400 font-bold">sha256:7f81a...</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900 border border-white/[0.04]">
                      <span className="text-slate-500 block text-[9px]">OCR Confidence</span>
                      <span className="text-emerald-400 font-bold">99.1% High</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <FileText size={32} className="mx-auto text-slate-600" />
                <p className="text-xs">
                  Click any <span className="text-cyan-400 font-mono">[Source X, p.Y]</span> tag in the chat stream to inspect the exact verbatim proof.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Audio Deep-Dive Studio */
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#ff2d78]/15 via-purple-900/10 to-indigo-900/15 border border-[#ff2d78]/30 space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#ff2d78]/20 text-[#ff2d78] border border-[#ff2d78]/30 uppercase tracking-wider">
                  Dual-Agent Debate Podcast
                </span>
                <h3 className="text-sm font-black text-slate-100 pt-1 leading-snug">
                  {podcastEpisode.title}
                </h3>
                <p className="text-xs text-slate-400">
                  {podcastEpisode.speakers.speakerA.name} vs {podcastEpisode.speakers.speakerB.name}
                </p>
              </div>

              {/* Scrubber */}
              <div className="space-y-1.5">
                <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden relative cursor-pointer">
                  <div
                    className="h-full bg-gradient-to-r from-[#ff2d78] to-cyan-400 rounded-full"
                    style={{
                      width: `${(currentTimeSec / podcastEpisode.durationSec) * 100}%`,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>{formatTime(currentTimeSec)}</span>
                  <span>{formatTime(podcastEpisode.durationSec)}</span>
                </div>
              </div>

              {/* Playback Controls */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5">
                  {[1.0, 1.2, 1.5].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => setPlaybackSpeed(speed)}
                      className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold transition-all cursor-pointer ${
                        playbackSpeed === speed
                          ? 'bg-[#ff2d78]/30 text-[#ff2d78] border border-[#ff2d78]/50'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-10 h-10 rounded-full bg-[#ff2d78] hover:bg-[#ff2d78]/90 text-white flex items-center justify-center shadow-lg shadow-[#ff2d78]/30 transition-transform active:scale-95 cursor-pointer"
                >
                  {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                </button>

                <button
                  onClick={() => setCurrentTimeSec(0)}
                  className="p-2 text-slate-400 hover:text-slate-200 cursor-pointer"
                  title="Rewind to start"
                >
                  <RotateCcw size={15} />
                </button>
              </div>
            </div>

            {/* Synchronized Interactive Transcript */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                Synchronized Transcript
              </span>

              <div className="space-y-2">
                {podcastEpisode.transcript.map((line) => {
                  const isActive =
                    currentTimeSec >= line.timeSec &&
                    currentTimeSec < line.timeSec + 12;

                  return (
                    <div
                      key={line.id}
                      onClick={() => setCurrentTimeSec(line.timeSec)}
                      className={`p-3 rounded-xl border text-xs leading-relaxed transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#ff2d78]/15 border-[#ff2d78]/40 text-slate-100 shadow-sm'
                          : 'bg-white/[0.01] border-white/[0.04] text-slate-400 hover:text-slate-300 hover:bg-white/[0.03]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                        <span className={`font-bold ${line.avatarColor}`}>
                          {line.speaker} ({line.speakerRole})
                        </span>
                        <span>{formatTime(line.timeSec)}</span>
                      </div>
                      <p>{line.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PDF Modal */}
      {showPdfModal && selectedProof && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#0A0D14] border border-cyan-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-100 font-mono">
                  {selectedProof.sourceTitle} • Page {selectedProof.pageNumber}
                </h3>
              </div>
              <button
                onClick={() => setShowPdfModal(false)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 rounded-xl bg-slate-900/60 border border-white/10 font-mono text-xs text-slate-300 leading-relaxed min-h-60 flex flex-col justify-center">
              <p className="bg-cyan-500/10 p-4 rounded-lg border border-cyan-500/20 text-cyan-200">
                &ldquo;{selectedProof.verbatimExcerpt}&rdquo;
              </p>
              <span className="text-[10px] text-slate-500 mt-3 block">
                Grounded via PyMuPDF OCR Vector Extraction • Verified Nepal CEE Curriculum 2026
              </span>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowPdfModal(false)}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer"
              >
                Close Proof Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
