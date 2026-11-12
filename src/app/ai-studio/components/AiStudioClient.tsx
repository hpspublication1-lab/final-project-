'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowLeft,
  Sliders,
  Database,
  Headphones,
  Maximize2,
  Minimize2,
  ShieldCheck,
  Bot,
  Zap,
} from 'lucide-react';
import GroundingMatrixPanel from './GroundingMatrixPanel';
import InteractiveChatStream from './InteractiveChatStream';
import SourceInspectorPanel from './SourceInspectorPanel';
import {
  GroundingSource,
  WorkstationMessage,
  SourceFactBlock,
  AudioPodcastEpisode,
} from '../types';

const INITIAL_SOURCES: GroundingSource[] = [
  {
    id: 'src-1',
    title: 'Morrison & Boyd Organic Chemistry (CEE Ed)',
    type: 'pdf',
    authorOrOrigin: 'Pearson / IOM Medical Syllabus Review',
    tokenCount: 48900,
    pageCount: 840,
    active: true,
    indexedAt: '2026-11-10',
    reliabilityScore: 99.4,
  },
  {
    id: 'src-2',
    title: 'IOM CEE Past Questions & Detailed Keys (2070–2081)',
    type: 'pdf',
    authorOrOrigin: 'Tribhuvan University Medical Faculty',
    tokenCount: 32400,
    pageCount: 320,
    active: true,
    indexedAt: '2026-11-11',
    reliabilityScore: 98.8,
  },
  {
    id: 'src-3',
    title: 'Dr. Sunil Pokhrel Handwritten Reaction Cheatsheet',
    type: 'ocr_notes',
    authorOrOrigin: 'Verified Faculty Vault',
    tokenCount: 14200,
    active: true,
    indexedAt: '2026-11-09',
    reliabilityScore: 97.6,
  },
  {
    id: 'src-4',
    title: 'YouTube Lecture: Aldol vs Cannizzaro Deep-Dive',
    type: 'youtube',
    authorOrOrigin: 'Samyak CEE Masterclass Series',
    tokenCount: 8500,
    durationMin: 45,
    active: false,
    indexedAt: '2026-11-08',
    reliabilityScore: 96.2,
  },
];

const INITIAL_MESSAGES: WorkstationMessage[] = [
  {
    id: 'msg-1',
    role: 'assistant',
    timestamp: '11:14 AM',
    userQuery: 'Compare Aldol Condensation vs Cannizzaro Reaction for CEE 2026. Highlight selectivity, alpha-hydrogen criteria, and negative marking trap.',
    blocks: [
      {
        type: 'source_fact',
        text: 'Aldol Condensation strictly requires carbonyl compounds having at least one $\\alpha$-hydrogen atom in the presence of dilute base (e.g. $10\\%\\text{ NaOH}$). In contrast, Cannizzaro Reaction is a self oxidation-reduction (disproportionation) characteristic exclusively of aldehydes **lacking** an $\\alpha$-hydrogen atom (e.g., Formaldehyde $\\text{HCHO}$ and Benzaldehyde $\\text{C}_6\\text{H}_5\\text{CHO}$) treated with concentrated alkali ($50\\%\\text{ NaOH}$).',
        sourceId: 'src-1',
        sourceTitle: 'Morrison & Boyd Organic Chem',
        pageNumber: 742,
        verbatimExcerpt: 'Aldehydes with no alpha-hydrogen undergo disproportionation in concentrated base (Cannizzaro reaction). One molecule is oxidized to a carboxylic acid salt while the second molecule is reduced to an alcohol.',
        semanticSimilarityScore: 98.2,
      },
      {
        type: 'model_heuristic',
        title: 'CEE 30-Second MCQ Elimination Heuristic',
        text: 'When facing an organic aldehyde question with $50\\%\\text{ NaOH}$, immediately check for $\\alpha$-hydrogens. If zero $\\alpha$-H $\\to$ eliminate all options mentioning $\\beta$-hydroxy aldehydes or enolates. One product MUST be an alcohol, and the other a carboxylate salt.',
        eliminationTactic: 'Eliminate options predicting Aldol addition for benzaldehyde. For Cross-Cannizzaro with Formaldehyde (HCHO), Formaldehyde is ALWAYS oxidized to formate, reducing the other aldehyde to alcohol.',
        timeSavingsSec: 35,
        examPillar: 'Chemistry',
      },
      {
        type: 'evidence_warning',
        message: 'The indexed textbook does not contain recent 2081 CEE question variations on intramolecular Cannizzaro of glyoxal without selecting TU Past Papers source.',
        missingTopic: 'Intramolecular Cannizzaro Kinetics & Glyoxal Transformations',
        suggestedSource: 'TU Medical Past Paper Archive 2081',
      },
    ],
  },
];

const INITIAL_PODCAST: AudioPodcastEpisode = {
  id: 'pod-1',
  title: 'Aldol vs Cannizzaro Selectivity & CEE Elimination Tactics',
  topic: 'CEE Organic Chemistry Disproportionation Masterclass',
  durationSec: 185,
  speakers: {
    speakerA: { name: 'Dr. Sunil Pokhrel', title: 'CEE Lead Chemistry Faculty' },
    speakerB: { name: 'Er. Ramesh Shrestha', title: 'Academic Examination Reviewer' },
  },
  transcript: [
    {
      id: 't-1',
      speaker: 'Dr. Sunil Pokhrel',
      speakerRole: 'CEE Chemistry Lead',
      avatarColor: 'text-cyan-400',
      timeSec: 0,
      text: 'Namaste CEE scholars! Today we resolve one of the most high-yield confusion points: Aldol vs Cannizzaro selectivity.',
    },
    {
      id: 't-2',
      speaker: 'Er. Ramesh Shrestha',
      speakerRole: 'Academic Reviewer',
      avatarColor: 'text-[#ff2d78]',
      timeSec: 15,
      text: 'Students constantly lose -0.25 negative marks because they forget the alpha-hydrogen prerequisite. Ramesh, why do examiners love Benzaldehyde here?',
    },
    {
      id: 't-3',
      speaker: 'Dr. Sunil Pokhrel',
      speakerRole: 'CEE Chemistry Lead',
      avatarColor: 'text-cyan-400',
      timeSec: 32,
      text: 'Because Benzaldehyde has zero alpha-hydrogens! It cannot form an enolate ion. Therefore, in 50% sodium hydroxide, hydride transfer occurs directly, yielding benzyl alcohol and sodium benzoate.',
    },
    {
      id: 't-4',
      speaker: 'Er. Ramesh Shrestha',
      speakerRole: 'Academic Reviewer',
      avatarColor: 'text-[#ff2d78]',
      timeSec: 54,
      text: 'And remember the golden 30-second rule: in Cross-Cannizzaro between Benzaldehyde and Formaldehyde, Formaldehyde is oxidized first to formic acid. Keep that locked in your exam memory!',
    },
  ],
};

export default function AiStudioClient() {
  const [sources, setSources] = useState<GroundingSource[]>(INITIAL_SOURCES);
  const [messages, setMessages] = useState<WorkstationMessage[]>(INITIAL_MESSAGES);
  const [selectedProof, setSelectedProof] = useState<SourceFactBlock | null>(
    INITIAL_MESSAGES[0].blocks[0] as SourceFactBlock
  );
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  // Mobile layout panel tab: 'matrix' | 'stream' | 'inspector'
  const [mobileTab, setMobileTab] = useState<'matrix' | 'stream' | 'inspector'>('stream');

  const handleToggleSource = (id: string) => {
    setSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
    );
  };

  const handleAddSource = (newSrc: Omit<GroundingSource, 'id' | 'indexedAt'>) => {
    const fullSource: GroundingSource = {
      ...newSrc,
      id: `src-${Date.now()}`,
      indexedAt: new Date().toISOString().slice(0, 10),
    };
    setSources((prev) => [fullSource, ...prev]);
  };

  const handleSendMessage = (query: string) => {
    setIsSynthesizing(true);

    const activeList = sources.filter((s) => s.active);
    const chosenSource = activeList[0] || sources[0];

    // Simulate multi-agent grounding synthesis
    setTimeout(() => {
      const newMsg: WorkstationMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        userQuery: query,
        blocks: [
          {
            type: 'source_fact',
            text: `Based on verified textbook data from **${chosenSource.title}**, the mathematical formulation and physical principles for "${query}" are rigorously derived under standard Nepal entrance syllabus standards.`,
            sourceId: chosenSource.id,
            sourceTitle: chosenSource.title,
            pageNumber: 156,
            verbatimExcerpt: `Experimental derivation verified in ${chosenSource.title}. Standard deviations remain within 0.05% error margin.`,
            semanticSimilarityScore: 97.8,
          },
          {
            type: 'model_heuristic',
            title: 'Samyak High-Yield Heuristic',
            text: `Step 1: Check boundary conditions immediately. Step 2: In physics numerical calculations, verify SI units before cross-multiplying. Step 3: Eliminate extreme outliers outside standard 1-sigma range.`,
            eliminationTactic: 'Eliminate unit conversion traps. Standard CEE questions test g = 9.8 m/s² vs 10 m/s² rounding.',
            timeSavingsSec: 30,
            examPillar: 'Physics',
          },
        ],
      };

      setMessages((prev) => [...prev, newMsg]);
      setSelectedProof(newMsg.blocks[0] as SourceFactBlock);
      setIsSynthesizing(false);
    }, 900);
  };

  return (
    <div className="flex flex-col h-screen bg-[#060913] text-slate-100 overflow-hidden font-sans">
      {/* Top Studio Chrome */}
      <header className="h-14 px-4 sm:px-6 bg-[#0A0D14] border-b border-white/[0.08] flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Link
            href="/student-dashboard"
            className="p-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-slate-400 hover:text-slate-100 transition-colors"
            title="Return to Dashboard"
          >
            <ArrowLeft size={16} />
          </Link>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4]" />
            <h1 className="text-sm font-black uppercase tracking-wider text-slate-100 font-mono">
              SAMYAK AI Studio
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold">
              v2.4 Production Standard
            </span>
          </div>
        </div>

        {/* Mobile Tab Pills (visible only on small screens) */}
        <div className="flex md:hidden items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08]">
          <button
            onClick={() => setMobileTab('matrix')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold ${
              mobileTab === 'matrix' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
            }`}
          >
            Sources
          </button>
          <button
            onClick={() => setMobileTab('stream')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold ${
              mobileTab === 'stream' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
            }`}
          >
            Chat
          </button>
          <button
            onClick={() => setMobileTab('inspector')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold ${
              mobileTab === 'inspector' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
            }`}
          >
            Proofs
          </button>
        </div>

        {/* Desktop Quick Telemetry */}
        <div className="hidden md:flex items-center gap-4 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
            <ShieldCheck size={14} />
            <span>Verifiable RAG</span>
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-[#ff2d78] font-bold flex items-center gap-1">
            <Zap size={14} />
            <span>Dual-Agent Audio</span>
          </span>
        </div>
      </header>

      {/* Main Three-Panel Split Workstation */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Left Panel: Grounding Matrix (~280px) */}
        <div
          className={`w-full md:w-72 lg:w-80 shrink-0 h-full ${
            mobileTab === 'matrix' ? 'block' : 'hidden md:block'
          }`}
        >
          <GroundingMatrixPanel
            sources={sources}
            onToggleSource={handleToggleSource}
            onAddSource={handleAddSource}
          />
        </div>

        {/* Center Panel: Interactive Chat Stream (flex-1) */}
        <div
          className={`flex-1 h-full flex flex-col ${
            mobileTab === 'stream' ? 'block' : 'hidden md:flex'
          }`}
        >
          <InteractiveChatStream
            messages={messages}
            onSendMessage={handleSendMessage}
            onSelectProof={(proof) => {
              setSelectedProof(proof);
              setMobileTab('inspector');
            }}
            isLoading={isSynthesizing}
          />
        </div>

        {/* Right Panel: Source Inspector & Proofs (~340px) */}
        <div
          className={`w-full md:w-80 lg:w-96 shrink-0 h-full ${
            mobileTab === 'inspector' ? 'block' : 'hidden md:block'
          }`}
        >
          <SourceInspectorPanel
            selectedProof={selectedProof}
            onClearProof={() => setSelectedProof(null)}
            podcastEpisode={INITIAL_PODCAST}
          />
        </div>
      </main>
    </div>
  );
}
