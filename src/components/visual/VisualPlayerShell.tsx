'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  FastForward,
  RotateCcw,
  BookOpen,
  Sparkles,
  Layers,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import { type VisualAssetManifest, type Hotspot } from '@/lib/cee/visual/manifestSchema';
import SimulationStageRenderer from './SimulationStageRenderer';
import AccessibleDiagramViewer from './AccessibleDiagramViewer';
import VisualQuizCard, { type PracticeQuestion } from './VisualQuizCard';

export type PlayerMode = 'SIMULATION_2D' | 'ACCESSIBLE_DIAGRAM';
export type PlayerState = 'LOADING' | 'READY' | 'INTERACTING' | 'COMPLETED' | 'ERROR';

export interface VisualPlayerShellProps {
  lessonId: string;
  lessonTitle: string;
  objectives: string[];
  manifest: VisualAssetManifest;
  practiceQuestions?: PracticeQuestion[];
  onProgressUpdate?: (percentage: number, completed: boolean) => void;
}

export default function VisualPlayerShell({
  lessonId,
  lessonTitle,
  objectives,
  manifest,
  practiceQuestions = [],
  onProgressUpdate,
}: VisualPlayerShellProps) {
  const [playerState, setPlayerState] = useState<PlayerState>('LOADING');
  const [activeMode, setActiveMode] = useState<PlayerMode>('SIMULATION_2D');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);
  const [inspectedHotspotIds, setInspectedHotspotIds] = useState<Set<string>>(new Set());
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'EXPLORE' | 'QUIZ' | 'NOTES'>('EXPLORE');

  const steps = manifest.simulation?.steps || [
    { label: 'Normal Phase', note: manifest.accessibility.description, drift: 'along' },
  ];

  // Initialize player state
  useEffect(() => {
    if (manifest && manifest.sourceUrl) {
      setPlayerState('READY');
    } else {
      setPlayerState('ERROR');
    }
  }, [manifest]);

  // Compute student progress
  const updateProgress = useCallback(() => {
    const totalItems = manifest.hotspots.length + (practiceQuestions.length || 1);
    const completedItems = inspectedHotspotIds.size + answeredQuestionIds.size;
    const percentage = Math.min(100, Math.round((completedItems / totalItems) * 100));
    const isCompleted = percentage >= 80;

    if (onProgressUpdate) {
      onProgressUpdate(percentage, isCompleted);
    }
  }, [manifest.hotspots.length, practiceQuestions.length, inspectedHotspotIds.size, answeredQuestionIds.size, onProgressUpdate]);

  // Automatic playback timer across stages
  useEffect(() => {
    if (!isPlaying || activeMode !== 'SIMULATION_2D' || steps.length <= 1) return;

    const intervalMs = (4000 / speed);
    const timer = setInterval(() => {
      setCurrentStepIndex((prev) => (prev + 1) % steps.length);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, speed, activeMode, steps.length]);

  const handleSelectHotspot = (hp: Hotspot) => {
    setActiveHotspot(hp);
    setInspectedHotspotIds((prev) => {
      const next = new Set(prev).add(hp.id);
      return next;
    });
    setPlayerState('INTERACTING');
  };

  useEffect(() => {
    updateProgress();
  }, [inspectedHotspotIds, answeredQuestionIds, updateProgress]);

  const handleSelectHotspotById = (hotspotId: string) => {
    const found = manifest.hotspots.find((h) => h.id === hotspotId);
    if (found) {
      handleSelectHotspot(found);
      setActiveTab('EXPLORE');
    }
  };

  const handleAnswerQuestion = (questionId: string) => {
    setAnsweredQuestionIds((prev) => new Set(prev).add(questionId));
  };

  const handleCycleSpeed = () => {
    setSpeed((s) => (s === 1 ? 1.5 : s === 1.5 ? 2 : 1));
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-4 text-slate-100 select-none">
      {/* Top Header & Mode Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-bold uppercase rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Verified CEE Biology
            </span>
            <span className="text-xs text-slate-400">Published Revision 1.0</span>
          </div>
          <h2 className="text-lg md:text-xl font-bold text-slate-100">{lessonTitle}</h2>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-950 border border-slate-800">
          <button
            onClick={() => setActiveMode('SIMULATION_2D')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition ${
              activeMode === 'SIMULATION_2D'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>2D Simulation</span>
          </button>
          <button
            onClick={() => setActiveMode('ACCESSIBLE_DIAGRAM')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition ${
              activeMode === 'ACCESSIBLE_DIAGRAM'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Accessible Diagram</span>
          </button>
        </div>
      </div>

      {/* Main Learning Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Visual Viewport (8 Columns on desktop) */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl min-h-[420px] flex items-center justify-center p-2">
            {activeMode === 'SIMULATION_2D' ? (
              <SimulationStageRenderer
                backgroundImageUrl={manifest.sourceUrl}
                steps={steps}
                currentStepIndex={currentStepIndex}
                isPlaying={isPlaying}
                speed={speed}
                hotspots={manifest.hotspots}
                activeHotspotId={activeHotspot?.id || null}
                onSelectHotspot={handleSelectHotspot}
              />
            ) : (
              <AccessibleDiagramViewer
                sourceUrl={manifest.sourceUrl}
                fallbackUrl={manifest.fallbackUrl}
                title={manifest.title}
                hotspots={manifest.hotspots}
                activeHotspotId={activeHotspot?.id || null}
                onSelectHotspot={handleSelectHotspot}
                description={manifest.accessibility.description}
                keyPoints={manifest.accessibility.screenReaderKeyPoints}
              />
            )}
          </div>

          {/* Simulation Timeline & Playback Bar */}
          {activeMode === 'SIMULATION_2D' && steps.length > 1 && (
            <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-1.5 rounded bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition"
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleCycleSpeed}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono transition"
                >
                  {speed}x
                </button>
                <button
                  onClick={() => setCurrentStepIndex(0)}
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
                  title="Restart"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Step Badges */}
              <div className="hidden sm:flex items-center gap-1.5">
                {steps.map((st, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentStepIndex(idx)}
                    className={`h-2 rounded-full transition-all ${
                      idx === currentStepIndex
                        ? 'w-6 bg-emerald-500 shadow-emerald-500/50 shadow'
                        : 'w-2 bg-slate-800 hover:bg-slate-700'
                    }`}
                    title={st.label}
                  />
                ))}
              </div>

              <span className="text-[11px] font-mono text-slate-400">
                Phase {currentStepIndex + 1}/{steps.length}
              </span>
            </div>
          )}
        </div>

        {/* Sidebar: Inspector, Quiz & Objectives (4 Columns on desktop) */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          {/* Tab Navigation */}
          <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('EXPLORE')}
              className={`py-2 rounded font-semibold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'EXPLORE'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Inspect</span>
            </button>
            <button
              onClick={() => setActiveTab('QUIZ')}
              className={`py-2 rounded font-semibold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'QUIZ'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Practice</span>
            </button>
            <button
              onClick={() => setActiveTab('NOTES')}
              className={`py-2 rounded font-semibold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'NOTES'
                  ? 'bg-purple-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Objectives</span>
            </button>
          </div>

          {/* Tab Content Panes */}
          <div className="flex-1 min-h-[380px]">
            {activeTab === 'EXPLORE' && (
              <div className="h-full rounded-xl bg-slate-900 border border-slate-800 p-4 flex flex-col justify-between">
                {activeHotspot ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-emerald-500/10 text-emerald-400">
                        Selected Structure
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        {inspectedHotspotIds.size}/{manifest.hotspots.length} inspected
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-100">{activeHotspot.label}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                      {activeHotspot.explanation || 'No structural notes available for this node.'}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-2 text-slate-400">
                    <Sparkles className="w-8 h-8 text-emerald-400/60 mb-2 animate-pulse" />
                    <h4 className="text-sm font-semibold text-slate-200">Interactive Hotspots Active</h4>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
                      Click on any glowing coordinate pin on the anatomical diagram to isolate structures and inspect clinical notes.
                    </p>
                  </div>
                )}

                {/* Hotspot quick list */}
                <div className="pt-4 border-t border-slate-800/80">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                    Key Anatomical Landmarks:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {manifest.hotspots.map((hp) => {
                      const isInspected = inspectedHotspotIds.has(hp.id);
                      const isCurrent = activeHotspot?.id === hp.id;
                      return (
                        <button
                          key={hp.id}
                          onClick={() => handleSelectHotspot(hp)}
                          className={`px-2 py-1 rounded text-[11px] font-medium transition flex items-center gap-1 ${
                            isCurrent
                              ? 'bg-emerald-500 text-slate-950 font-bold'
                              : isInspected
                              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                          }`}
                        >
                          {isInspected && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                          <span>{hp.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'QUIZ' && (
              <VisualQuizCard
                questions={practiceQuestions}
                onAnswerQuestion={handleAnswerQuestion}
                onSelectHotspotById={handleSelectHotspotById}
              />
            )}

            {activeTab === 'NOTES' && (
              <div className="h-full rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400 block pb-1 border-b border-slate-800">
                  Official Learning Objectives (MEC CEE)
                </span>
                <ul className="space-y-2.5">
                  {objectives.map((obj, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold mt-0.5">
                        {i + 1}
                      </span>
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
