'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import CoursePortalHeader from './CoursePortalHeader';
import { COURSE_PORTAL_CONFIGS } from '@/lib/config/courseFeatures';
import {
  Sparkles,
  ArrowRight,
  Code,
  Layers,
  Download,
  Zap,
  CheckCircle2,
  Terminal,
  Play,
  Cpu,
} from 'lucide-react';

interface PortalViewProps {
  displayName: string;
  isEnrolled?: boolean;
  isPro?: boolean;
  onOpenCourseSelector?: () => void;
}

export default function AiPortalView({
  displayName,
  isEnrolled = true,
  isPro = false,
  onOpenCourseSelector,
}: PortalViewProps) {
  const config = COURSE_PORTAL_CONFIGS.artificial_intelligence;
  const [promptInput, setPromptInput] = useState(
    'Act as a Senior AI Solutions Architect. Create a step-by-step proposal for automating customer lead qualification using Python, Supabase, and Claude 3.5 Sonnet.'
  );
  const [framework, setFramework] = useState<'rtf' | 'cot' | 'fewshot'>('rtf');
  const [aiOutput, setAiOutput] = useState<string | null>(null);
  const [isGrading, setIsGrading] = useState(false);

  const handleTestPrompt = () => {
    setIsGrading(true);
    setTimeout(() => {
      setIsGrading(false);
      setAiOutput(
        '🤖 Prompt Quality Score: 98/100 · Role: Senior Architect (Clear) · Context: High · Constraints: Defined. Output Format: Structured Proposal.'
      );
    }, 1400);
  };

  const codingProjects = [
    { id: 'cp-1', title: '1. Web Scraping & Data Extraction Bot', tech: 'Python · BeautifulSoup · Pandas', status: 'Completed · 100%' },
    { id: 'cp-2', title: '2. Custom RAG Chatbot with Vector Embeddings', tech: 'Python · LangChain · Vector DB', status: 'In Progress · 65%' },
    { id: 'cp-3', title: '3. Automated Telegram/Discord Content Bot', tech: 'Node / Python · Webhooks', status: 'Next Up' },
    { id: 'cp-4', title: '4. Autonomous Multi-Agent Research Assistant', tech: 'CrewAI · Claude 3.5 API', status: 'Locked' },
    { id: 'cp-5', title: '5. End-to-End SaaS AI Wrapper Deployment', tech: 'Next.js · Supabase · Fonepay', status: 'Capstone' },
  ];

  const promptVaults = [
    { title: 'Top 300 Business & Sales Prompts', tag: 'Sales Funnels', count: '300 Prompts' },
    { title: 'Top 250 Coding & Debugging Prompts', tag: 'Python / JS', count: '250 Prompts' },
    { title: 'Top 200 Midjourney v6 Prompts', tag: 'Image Gen', count: '200 Prompts' },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header Identity */}
      <CoursePortalHeader
        displayName={displayName}
        isEnrolled={isEnrolled}
        isPro={isPro}
        onOpenCourseSelector={onOpenCourseSelector}
      />

      {/* 2. Interactive Prompt Engineering Studio Sandbox */}
      <div className="p-4 sm:p-5 rounded-2xl bg-card border border-purple-500/30 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 border border-purple-500/20">
                Live Studio Sandbox
              </span>
              <span className="text-xs text-muted-foreground font-semibold">Real-Time AI Grader</span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-foreground">Interactive Prompt Engineering Lab</h3>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-muted border border-border self-start sm:self-auto text-xs">
            <button
              onClick={() => setFramework('rtf')}
              className={`px-2.5 py-1 font-bold rounded-lg transition-all ${
                framework === 'rtf' ? 'bg-purple-600 text-white shadow-xs' : 'text-muted-foreground'
              }`}
            >
              RTF
            </button>
            <button
              onClick={() => setFramework('cot')}
              className={`px-2.5 py-1 font-bold rounded-lg transition-all ${
                framework === 'cot' ? 'bg-purple-600 text-white font-bold shadow-xs' : 'text-muted-foreground'
              }`}
            >
              Chain-of-Thought
            </button>
            <button
              onClick={() => setFramework('fewshot')}
              className={`px-2.5 py-1 font-bold rounded-lg transition-all ${
                framework === 'fewshot' ? 'bg-purple-600 text-white font-bold shadow-xs' : 'text-muted-foreground'
              }`}
            >
              Few-Shot
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <textarea
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            rows={2}
            className="w-full p-3 rounded-xl bg-muted/40 border border-border focus:border-purple-500 font-mono text-xs text-foreground focus:outline-none transition-colors"
            placeholder="Type your system prompt or task instructions here..."
          />

          <div className="flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground">Framework: Role, Task, Format constraints evaluated</p>
            <button
              onClick={handleTestPrompt}
              disabled={isGrading}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-70"
            >
              <Play size={13} />
              <span>{isGrading ? 'Evaluating Prompt...' : 'Evaluate Prompt'}</span>
            </button>
          </div>

          {aiOutput && (
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-foreground">
              {aiOutput}
            </div>
          )}
        </div>
      </div>

      {/* 3. Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Tracks & Projects (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Specialized AI Tracks */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                <Sparkles size={16} className="text-purple-500" /> Specialized AI Learning Tracks ({config.defaultSubjects.length})
              </h3>
              <Link href="/courses" className="text-xs font-bold text-purple-600 hover:underline">
                All Tracks →
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {config.defaultSubjects.map((track) => (
                <div
                  key={track.id}
                  className="p-4 rounded-2xl bg-card border border-border hover:border-purple-500/40 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xl">{track.icon}</span>
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600">
                        {track.weightage}
                      </span>
                    </div>
                    <h4 className="text-xs font-extrabold text-foreground">{track.name}</h4>
                    <p className="text-[10px] text-muted-foreground">{track.chaptersCount} Modules &amp; Video Labs</p>
                  </div>

                  <Link
                    href="/courses"
                    className="text-[10px] font-bold text-purple-600 hover:text-purple-700 flex items-center justify-between pt-2 border-t border-border/50"
                  >
                    <span>Launch Track</span>
                    <ArrowRight size={11} />
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* 5 Real-World Python AI Projects */}
          <div className="p-5 rounded-2xl bg-card border border-border space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                  <Code size={16} className="text-emerald-500" /> 5 Real-World Python AI &amp; Agent Projects
                </h3>
                <p className="text-[11px] text-muted-foreground">Build a portfolio of working production AI applications.</p>
              </div>
              <span className="text-[10px] font-bold text-emerald-600">1 of 5 Completed</span>
            </div>

            <div className="space-y-2.5">
              {codingProjects.map((proj) => (
                <div
                  key={proj.id}
                  className="p-3.5 rounded-xl bg-muted/40 border border-border/60 hover:border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
                >
                  <div className="space-y-0.5">
                    <h5 className="text-xs font-bold text-foreground">{proj.title}</h5>
                    <p className="text-[10px] font-mono text-muted-foreground">{proj.tech}</p>
                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{proj.status}</p>
                  </div>

                  <Link
                    href="/courses"
                    className="px-3 py-1.5 rounded-xl bg-card border border-border hover:bg-purple-600 hover:text-white font-bold text-xs flex items-center justify-center gap-1 transition-colors shrink-0"
                  >
                    <span>Open Repo</span>
                    <ArrowRight size={11} />
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* 1,000+ Prompt Vault Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-800 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold">
                <Layers size={12} /> 1,000+ System Prompts
              </div>
              <h3 className="text-base sm:text-lg font-black">Curated Prompt Vault for Devs &amp; Creators</h3>
              <p className="text-xs text-purple-100 leading-relaxed">
                Instant copy-paste system prompts for coding, automated research, sales copy, and AI agents.
              </p>
            </div>

            <Link
              href="/courses"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white text-purple-900 font-black text-xs hover:bg-purple-50 transition-all shadow-sm shrink-0 flex items-center justify-center gap-2"
            >
              <span>Open Vault</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Downloadable Toolkits */}
          <div className="p-5 rounded-2xl bg-card border border-border space-y-3">
            <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
              <Download size={16} className="text-purple-500" /> Curated Prompt Packs &amp; Cheat Sheets
            </h3>
            <div className="grid sm:grid-cols-3 gap-3">
              {promptVaults.map((vault) => (
                <div
                  key={vault.title}
                  className="p-3.5 rounded-xl bg-muted/30 border border-border hover:border-purple-500/30 flex items-center justify-between gap-2 transition-all"
                >
                  <div>
                    <p className="text-xs font-bold text-foreground line-clamp-1">{vault.title}</p>
                    <p className="text-[10px] text-muted-foreground">{vault.tag} · {vault.count}</p>
                  </div>
                  <Link
                    href="/courses"
                    className="p-1.5 rounded-lg bg-card border border-border hover:bg-purple-500/10 hover:text-purple-600 text-muted-foreground transition-colors shrink-0"
                  >
                    <Download size={13} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Tasks & AI Milestones (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Today's Action Plan */}
          <div className="p-5 rounded-2xl bg-card border border-border space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                <Zap size={15} className="text-purple-500" /> Today&apos;s AI Sprint
              </h3>
              <span className="text-[10px] font-bold text-emerald-600">1 of 3 Done</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  <span className="font-semibold text-foreground line-through text-muted-foreground">Setup LangChain Vector Index</span>
                </div>
                <span className="text-[10px] text-muted-foreground">Done</span>
              </div>

              <div className="p-2.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between hover:border-purple-500/30 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border border-border shrink-0" />
                  <span className="font-semibold text-foreground">Build RAG Retrieval Node</span>
                </div>
                <Link href="/courses" className="text-[10px] font-bold text-purple-600 hover:underline">
                  Start →
                </Link>
              </div>

              <div className="p-2.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between hover:border-purple-500/30 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border border-border shrink-0" />
                  <span className="font-semibold text-foreground">Test Few-Shot Prompt in Sandbox</span>
                </div>
                <button onClick={() => setFramework('fewshot')} className="text-[10px] font-bold text-purple-600 hover:underline">
                  Test →
                </button>
              </div>
            </div>
          </div>

          {/* AI Architecture Milestones */}
          <div className="p-5 rounded-2xl bg-card border border-border space-y-3">
            <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
              <Cpu size={15} className="text-purple-500" /> Architecture Milestones
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <span className="text-muted-foreground">Prompt Engineering Specialist</span>
                <span className="font-bold text-emerald-600">Passed</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <span className="text-muted-foreground">RAG &amp; Vector Search Engineer</span>
                <span className="font-bold text-purple-600">In Progress</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <span className="text-muted-foreground">Multi-Agent Systems Architect</span>
                <span className="font-bold text-muted-foreground">Locked</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
