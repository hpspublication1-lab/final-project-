'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import CoursePortalHeader from './CoursePortalHeader';
import { COURSE_PORTAL_CONFIGS } from '@/lib/config/courseFeatures';
import {
  Cpu,
  Bot,
  Code,
  Sparkles,
  CheckCircle,
  ArrowRight,
  Play,
  Terminal,
  Award,
  Zap,
  Layers,
  FileCode,
  CheckSquare,
  Wrench,
  Download,
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
    { id: 'cp-1', title: '1. Intelligent Web Scraping & Data Extraction Bot', tech: 'Python · BeautifulSoup · Pandas', status: 'Completed · 100%' },
    { id: 'cp-2', title: '2. Custom Retrieval-Augmented Generation (RAG) Chatbot', tech: 'Python · LangChain · Vector Embeddings', status: 'In Progress · 65%' },
    { id: 'cp-3', title: '3. Automated Telegram/Discord Content Bot with OpenAI API', tech: 'Node / Python · Webhooks', status: 'Next Up' },
    { id: 'cp-4', title: '4. Autonomous Multi-Agent Research Assistant', tech: 'CrewAI · Claude 3.5 API', status: 'Locked' },
    { id: 'cp-5', title: '5. End-to-End SaaS AI Wrapper Deployment', tech: 'Next.js · Supabase · Stripe/Fonepay', status: 'Capstone' },
  ];

  const promptVaults = [
    { title: 'Top 300 Business & Sales Prompts', tag: 'Sales Funnels', count: '300 Prompts' },
    { title: 'Top 250 Coding & Debugging Prompts', tag: 'Python / JS', count: '250 Prompts' },
    { title: 'Top 200 Midjourney v6 Photorealistic Prompts', tag: 'Image Gen', count: '200 Prompts' },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header Identity: SOUMYA GURU - AI ACADEMY Dashboard */}
      <CoursePortalHeader
        displayName={displayName}
        isEnrolled={isEnrolled}
        isPro={isPro}
        onOpenCourseSelector={onOpenCourseSelector}
      />

      {/* 2. Interactive Live Prompt Engineering Studio Sandbox */}
      <div className="p-6 rounded-3xl bg-card border border-purple-500/30 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 border border-purple-500/20">
                Live Studio Sandbox
              </span>
              <span className="text-xs text-muted-foreground font-semibold">Real-Time AI Grader</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-foreground">Interactive Prompt Engineering Lab</h3>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted border border-border self-start sm:self-auto">
            <button
              onClick={() => setFramework('rtf')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                framework === 'rtf' ? 'bg-purple-600 text-white shadow-xs' : 'text-muted-foreground'
              }`}
            >
              RTF Framework
            </button>
            <button
              onClick={() => setFramework('cot')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                framework === 'cot' ? 'bg-purple-600 text-white shadow-xs' : 'text-muted-foreground'
              }`}
            >
              Chain-of-Thought
            </button>
            <button
              onClick={() => setFramework('fewshot')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                framework === 'fewshot' ? 'bg-purple-600 text-white shadow-xs' : 'text-muted-foreground'
              }`}
            >
              Few-Shot
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <textarea
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            rows={3}
            className="w-full p-4 rounded-2xl bg-muted/40 border border-border focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-xs sm:text-sm font-mono text-foreground resize-none"
            placeholder="Type or paste your prompt here to test and grade its structure..."
          />

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <span className="text-[11px] text-muted-foreground">
              Evaluates: <strong>Role, Task, Context, Negative Constraints &amp; Formatting</strong>
            </span>
            <button
              onClick={handleTestPrompt}
              disabled={isGrading}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-600/20 transition-all disabled:opacity-60"
            >
              <Sparkles size={14} />
              <span>{isGrading ? 'Grading Prompt Quality...' : 'Evaluate & Grade Prompt'}</span>
            </button>
          </div>

          {aiOutput && (
            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-xs font-semibold text-purple-900 dark:text-purple-200 animate-fadeIn">
              {aiOutput}
            </div>
          )}
        </div>
      </div>

      {/* 3. Core Specialized AI Tracks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm sm:text-base font-extrabold text-foreground flex items-center gap-2">
            <Sparkles size={16} className="text-purple-500" /> Specialized AI Learning Tracks ({config.defaultSubjects.length})
          </h3>
          <Link href="/courses?sector=artificial_intelligence" className="text-xs font-bold text-purple-600 hover:underline">
            All Tracks →
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {config.defaultSubjects.map((track) => (
            <div
              key={track.id}
              className="p-5 rounded-3xl bg-card border border-border hover:border-purple-500/40 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{track.icon}</span>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600">
                    {track.weightage}
                  </span>
                </div>
                <h4 className="text-sm font-extrabold text-foreground">{track.name}</h4>
                <p className="text-[11px] text-muted-foreground">{track.chaptersCount} Hands-On Modules &amp; Video Labs</p>
              </div>

              <div className="pt-3 border-t border-border/50 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Interactive Practice</span>
                <Link
                  href="/courses?sector=artificial_intelligence"
                  className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
                >
                  <span>Launch Track</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. 5 Real-World Hands-On Python AI Projects */}
      <div className="p-6 rounded-3xl bg-card border border-border space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-foreground flex items-center gap-2">
              <Code size={16} className="text-emerald-500" /> 5 Real-World Python AI &amp; Agent Projects
            </h3>
            <p className="text-xs text-muted-foreground">Build a portfolio of working production AI applications from scratch.</p>
          </div>
          <span className="text-xs font-bold text-emerald-600">1 of 5 Completed</span>
        </div>

        <div className="space-y-3">
          {codingProjects.map((proj) => (
            <div
              key={proj.id}
              className="p-4 rounded-2xl bg-muted/40 border border-border/60 hover:border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
            >
              <div className="space-y-1">
                <h5 className="text-xs font-bold text-foreground">{proj.title}</h5>
                <p className="text-[11px] font-mono text-muted-foreground">{proj.tech}</p>
                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{proj.status}</p>
              </div>

              <Link
                href="/courses?sector=artificial_intelligence"
                className="px-4 py-2 rounded-xl bg-card border border-border hover:bg-purple-600 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shrink-0"
              >
                <span>Open Project Repo</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* 5. 1,000+ Prompt Vault Download */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-800 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-bold">
            <Layers size={13} /> 1,000+ System Prompt Library
          </div>
          <h3 className="text-xl sm:text-2xl font-black">Curated Prompt Vault for Business &amp; Devs</h3>
          <p className="text-xs sm:text-sm text-purple-100 leading-relaxed">
            Instant copy-paste system prompts for coding, automated research, sales copy generation, and data visualization.
          </p>
        </div>

        <Link
          href="/digital"
          className="px-6 py-3.5 rounded-2xl bg-white text-purple-900 font-black text-xs sm:text-sm hover:bg-purple-50 transition-all shadow-lg shrink-0 flex items-center gap-2"
        >
          <span>Open Prompt Vault</span>
          <ArrowRight size={16} />
        </Link>
      </div>

      {/* 6. Downloadable AI Resource Toolkits */}
      <div className="p-6 rounded-3xl bg-card border border-border space-y-4">
        <h3 className="text-sm sm:text-base font-extrabold text-foreground flex items-center gap-2">
          <Download size={16} className="text-purple-500" /> Curated Prompt Packs &amp; Cheat Sheets
        </h3>
        <div className="grid sm:grid-cols-3 gap-3">
          {promptVaults.map((vault) => (
            <div
              key={vault.title}
              className="p-4 rounded-2xl bg-muted/30 border border-border hover:border-purple-500/30 flex items-center justify-between gap-3 transition-all"
            >
              <div>
                <p className="text-xs font-bold text-foreground line-clamp-1">{vault.title}</p>
                <p className="text-[10px] text-muted-foreground">{vault.tag} · {vault.count}</p>
              </div>
              <Link
                href="/digital"
                className="p-2 rounded-xl bg-card border border-border hover:bg-purple-500/10 hover:text-purple-600 text-muted-foreground transition-colors shrink-0"
              >
                <Download size={14} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
