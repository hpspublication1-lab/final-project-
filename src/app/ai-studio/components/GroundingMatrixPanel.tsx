'use client';

import React, { useState } from 'react';
import {
  FileText,
  Globe,
  Video,
  Sparkles,
  Plus,
  CheckCircle2,
  Database,
  Cpu,
  Layers,
  Filter,
  Trash2,
  X,
  UploadCloud,
  FileCode,
} from 'lucide-react';
import { GroundingSource, SourceType } from '../types';

interface GroundingMatrixPanelProps {
  sources: GroundingSource[];
  onToggleSource: (id: string) => void;
  onAddSource: (source: Omit<GroundingSource, 'id' | 'indexedAt'>) => void;
  maxContextTokens?: number;
}

const SOURCE_TYPE_CONFIG: Record<
  SourceType,
  { label: string; icon: React.ElementType; color: string; badge: string }
> = {
  pdf: { label: 'Textbook / PDF', icon: FileText, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30', badge: 'PDF' },
  web: { label: 'Web Scraper', icon: Globe, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30', badge: 'WEB' },
  youtube: { label: 'Audio Transcript', icon: Video, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30', badge: 'AUDIO' },
  ocr_notes: { label: 'OCR Handwritten', icon: FileCode, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', badge: 'OCR' },
};

export default function GroundingMatrixPanel({
  sources,
  onToggleSource,
  onAddSource,
  maxContextTokens = 128000,
}: GroundingMatrixPanelProps) {
  const [filterType, setFilterType] = useState<'all' | SourceType>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New source form state
  const [newTitle, setNewTitle] = useState('');
  const [newOrigin, setNewOrigin] = useState('');
  const [newType, setNewType] = useState<SourceType>('pdf');
  const [newTokenEstimate, setNewTokenEstimate] = useState(12400);

  // Calculate live context token budget
  const activeSources = sources.filter((s) => s.active);
  const activeTokens = activeSources.reduce((sum, s) => sum + s.tokenCount, 0);
  const budgetPct = Math.min(100, Math.round((activeTokens / maxContextTokens) * 100));

  const filteredSources = filterType === 'all'
    ? sources
    : sources.filter((s) => s.type === filterType);

  const handleCreateSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddSource({
      title: newTitle.trim(),
      authorOrOrigin: newOrigin.trim() || 'Verified Nepal Academic Corpus',
      type: newType,
      tokenCount: newTokenEstimate,
      active: true,
      reliabilityScore: 98.4,
      pageCount: newType === 'pdf' ? 24 : undefined,
    });

    setNewTitle('');
    setNewOrigin('');
    setIsModalOpen(false);
  };

  return (
    <aside className="w-full flex flex-col h-full bg-[#060913] border-r border-white/[0.08] text-slate-200">
      {/* Header */}
      <div className="p-4 border-b border-white/[0.08] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Database size={15} />
            </div>
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-100 font-mono">
                Grounding Matrix
              </h2>
              <p className="text-[10px] text-slate-400">Multi-format RAG Vector Vault</p>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-2.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus size={13} />
            <span>Ingest</span>
          </button>
        </div>

        {/* Live Context Token Budget Bar */}
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Cpu size={12} className="text-cyan-400" />
              <span>Token Budget</span>
            </span>
            <span className="font-mono font-bold text-cyan-300">
              {(activeTokens / 1000).toFixed(1)}k / {(maxContextTokens / 1000).toFixed(0)}k ctx
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden relative border border-white/[0.05]">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-[#ff2d78] rounded-full transition-all duration-500"
              style={{ width: `${budgetPct}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>{activeSources.length} Sources Active</span>
            <span className={budgetPct > 80 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
              {budgetPct}% Capacity
            </span>
          </div>
        </div>

        {/* Source Type Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pt-1">
          {(['all', 'pdf', 'ocr_notes', 'youtube', 'web'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold uppercase transition-all shrink-0 cursor-pointer ${
                filterType === t
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Sources List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
        {filteredSources.map((source) => {
          const cfg = SOURCE_TYPE_CONFIG[source.type];
          const Icon = cfg.icon;

          return (
            <div
              key={source.id}
              onClick={() => onToggleSource(source.id)}
              className={`p-3 rounded-xl border transition-all cursor-pointer select-none space-y-2 ${
                source.active
                  ? 'bg-cyan-950/20 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.08)]'
                  : 'bg-white/[0.02] border-white/[0.06] opacity-60 hover:opacity-100 hover:border-white/[0.12]'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 border ${cfg.color}`}>
                    <Icon size={13} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-slate-200 truncate leading-snug">
                      {source.title}
                    </h3>
                    <p className="text-[10px] text-slate-400 truncate">{source.authorOrOrigin}</p>
                  </div>
                </div>

                <div
                  className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                    source.active
                      ? 'bg-cyan-500 border-cyan-400 text-slate-950'
                      : 'border-white/20 bg-transparent'
                  }`}
                >
                  {source.active && <CheckCircle2 size={12} className="stroke-[3]" />}
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-white/[0.04]">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" />
                  {(source.tokenCount / 1000).toFixed(1)}k tokens
                </span>
                <span className="text-cyan-400/80 font-bold">
                  {source.reliabilityScore}% verified
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ingest Source Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0A0D14] border border-cyan-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UploadCloud size={18} className="text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-100 font-mono uppercase tracking-wide">
                  Ingest New Academic Source
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSource} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400">Source Title / Reference</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CEE Organic Chemistry — Morrison & Boyd Notes"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400">Author / Publisher Origin</label>
                <input
                  type="text"
                  placeholder="e.g. IOM Maharajgunj Faculty Council"
                  value={newOrigin}
                  onChange={(e) => setNewOrigin(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400">Source Format</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['pdf', 'ocr_notes', 'youtube', 'web'] as const).map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setNewType(t)}
                      className={`p-2.5 rounded-xl border text-left font-mono font-bold capitalize transition-all cursor-pointer ${
                        newType === t
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                          : 'bg-slate-900/50 border-white/10 text-slate-400'
                      }`}
                    >
                      {t.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black cursor-pointer shadow-lg shadow-cyan-500/20"
                >
                  Confirm &amp; Index
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}
