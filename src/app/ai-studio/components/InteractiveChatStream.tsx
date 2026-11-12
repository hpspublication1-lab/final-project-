'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  ShieldCheck,
  Zap,
  AlertTriangle,
  BookmarkPlus,
  ArrowRight,
  Search,
  ExternalLink,
  ChevronRight,
  BookOpen,
  Check,
  RefreshCw,
  Copy,
} from 'lucide-react';
import { MathText } from '@/components/MathText';
import { WorkstationMessage, SourceFactBlock, ModelHeuristicBlock, EvidenceWarningBlock } from '../types';

interface InteractiveChatStreamProps {
  messages: WorkstationMessage[];
  onSendMessage: (query: string) => void;
  onSelectProof: (fact: SourceFactBlock) => void;
  isLoading?: boolean;
}

const QUICK_PROMPTS = [
  'Aldol vs Cannizzaro Selectivity & Mechanisms',
  'Kirchhoff’s Loop Law Sign Conventions with Numerical Steps',
  'Cramer’s Rule 3x3 Determinant Shortcut for SEE/Class 11',
  'Acceleration due to Gravity: Depth vs Altitude Proof',
];

export default function InteractiveChatStream({
  messages,
  onSendMessage,
  onSelectProof,
  isLoading = false,
}: InteractiveChatStreamProps) {
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const streamEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    streamEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <section className="flex-1 flex flex-col h-full bg-[#07090E] text-slate-100 overflow-hidden">
      {/* Top stream banner */}
      <div className="px-6 py-3 border-b border-white/[0.08] bg-[#0A0D14]/80 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
            SAMYAK Grounded RAG Workstation • 3-Tier Verifiable Stream
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
          <span className="flex items-center gap-1 text-cyan-400">
            <ShieldCheck size={13} />
            <span>100% Citation Backed</span>
          </span>
        </div>
      </div>

      {/* Messages stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-4 text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
              <Bot size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-100">
                Grounded Research &amp; Exam Workstation
              </h3>
              <p className="text-xs leading-relaxed text-slate-400">
                Ask any high-stakes question. Every claim is verified against indexed textbooks, model papers, and lecture transcripts with direct page-level proof tags.
              </p>
            </div>

            <div className="w-full grid grid-cols-1 gap-2 pt-2 text-left">
              {QUICK_PROMPTS.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(qp)}
                  className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.08] hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all text-xs font-medium text-slate-300 flex items-center justify-between group cursor-pointer"
                >
                  <span>{qp}</span>
                  <ChevronRight size={14} className="text-slate-500 group-hover:text-cyan-400 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className="space-y-3">
            {/* User message */}
            {msg.userQuery && (
              <div className="flex justify-end">
                <div className="max-w-xl p-3.5 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 text-slate-100 text-xs sm:text-sm font-medium shadow-md">
                  <p>{msg.userQuery}</p>
                  <span className="text-[10px] font-mono text-indigo-300/60 block text-right mt-1">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            )}

            {/* Assistant multi-block response with Triple Visual Distinction */}
            {msg.blocks.length > 0 && (
              <div className="space-y-3 max-w-3xl">
                {msg.blocks.map((block, bIdx) => {
                  if (block.type === 'source_fact') {
                    // 1. Source-Supported Fact (Cyan frosted glass)
                    return (
                      <div
                        key={bIdx}
                        className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.06)] space-y-2 relative"
                      >
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="flex items-center gap-1.5 text-cyan-400 font-bold uppercase tracking-wider">
                            <ShieldCheck size={14} />
                            <span>Source-Supported Grounded Fact</span>
                          </span>

                          <button
                            onClick={() => onSelectProof(block)}
                            className="px-2 py-0.5 rounded-md bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <span>Inspect Proof</span>
                            <ChevronRight size={11} />
                          </button>
                        </div>

                        <div className="text-xs sm:text-sm text-cyan-100 leading-relaxed font-sans">
                          <MathText text={block.text} />
                        </div>

                        {/* Explicit inline citation pill */}
                        <div className="pt-1 flex items-center gap-2">
                          <button
                            onClick={() => onSelectProof(block)}
                            className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <BookOpen size={12} />
                            <span>
                              [{block.sourceTitle}, p.{block.pageNumber}]
                            </span>
                            <span className="text-[10px] text-cyan-400/70 font-normal">
                              ({block.semanticSimilarityScore}% match)
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  }

                  if (block.type === 'model_heuristic') {
                    // 2. Model-Generated Interpretation (Purple/Indigo frosted glass)
                    return (
                      <div
                        key={bIdx}
                        className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.06)] space-y-2"
                      >
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="flex items-center gap-1.5 text-indigo-400 font-bold uppercase tracking-wider">
                            <Zap size={14} />
                            <span>{block.title || 'Model Heuristic & Elimination Tactic'}</span>
                          </span>

                          <span className="px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold">
                            ⚡ Saves ~{block.timeSavingsSec}s in exam
                          </span>
                        </div>

                        <div className="text-xs sm:text-sm text-indigo-100 leading-relaxed font-sans">
                          <MathText text={block.text} />
                        </div>

                        <div className="p-2.5 rounded-xl bg-indigo-900/30 border border-indigo-500/30 text-xs text-indigo-200 flex items-start gap-2">
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 uppercase shrink-0">
                            CEE Tactic
                          </span>
                          <p className="font-medium">{block.eliminationTactic}</p>
                        </div>
                      </div>
                    );
                  }

                  if (block.type === 'evidence_warning') {
                    // 3. Insufficient Evidence Warning (Amber container)
                    return (
                      <div
                        key={bIdx}
                        className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/40 space-y-2"
                      >
                        <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs uppercase tracking-wider font-mono">
                          <AlertTriangle size={15} />
                          <span>Insufficient Evidence Warning</span>
                        </div>

                        <p className="text-xs sm:text-sm text-amber-200/90 leading-relaxed">
                          {block.message}
                        </p>

                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="text-amber-300/80 font-mono text-[11px]">
                            Missing context: {block.missingTopic}
                          </span>

                          <button
                            onClick={() => onSendMessage(`Search unindexed literature for ${block.missingTopic}`)}
                            className="px-3 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-mono text-[11px] font-bold transition-all cursor-pointer"
                          >
                            Auto-Query Web Literature →
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] text-slate-300 text-xs font-mono max-w-sm">
            <RefreshCw size={15} className="animate-spin text-cyan-400" />
            <span>Synthesizing multi-agent citations...</span>
          </div>
        )}

        <div ref={streamEndRef} />
      </div>

      {/* Input bar */}
      <div className="p-4 border-t border-white/[0.08] bg-[#0A0D14]/90 backdrop-blur-xl">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything (e.g. Compare Aldol vs Cannizzaro with mechanism & CEE traps)..."
            className="w-full py-3.5 pl-4 pr-24 rounded-2xl bg-[#060913] border border-white/10 text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-cyan-500 transition-colors"
          />

          <div className="absolute right-2 flex items-center gap-1.5">
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:hover:bg-cyan-500 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
            >
              <span>Verify</span>
              <Send size={13} />
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
