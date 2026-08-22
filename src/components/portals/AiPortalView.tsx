'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Cpu, Bot, Code, Sparkles, CheckCircle, ArrowRight, Play, Terminal, Award, Zap, Layers } from 'lucide-react';

interface PortalViewProps {
  displayName: string;
  isPro: boolean;
}

const aiTracks = [
  {
    id: 'prompt-studio',
    title: 'Prompt Engineering Studio',
    icon: Bot,
    desc: 'Master structured prompt frameworks (RTF, Chain-of-Thought) with instant AI grading feedback.',
    badge: 'INTERACTIVE SANDBOX',
    color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    link: '/digital',
    actionText: 'Open Prompt Studio',
  },
  {
    id: 'ai-tools',
    title: 'Modern AI Tools & Workflows',
    icon: Zap,
    desc: 'Automate content generation, data analysis, and image generation using Midjourney, Claude & ChatGPT.',
    badge: '10X PRODUCTIVITY',
    color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
    link: '/digital',
    actionText: 'Explore Workflows',
  },
  {
    id: 'python-ai',
    title: 'Python for AI & Automation',
    icon: Code,
    desc: 'From zero coding to web scraping bots, API integrations, and building custom LLM agents.',
    badge: '5 REAL PROJECTS',
    color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    link: '/courses?sector=digital',
    actionText: 'Write Code',
  },
  {
    id: 'ai-agents',
    title: 'No-Code AI Automation & Agents',
    icon: Terminal,
    desc: 'Connect tools with Make.com, n8n, and webhooks to build self-running business automations.',
    badge: 'NO-CODE AUTOMATION',
    color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
    link: '/courses?sector=digital',
    actionText: 'Build Automations',
  },
];

export default function AiPortalView({ displayName }: PortalViewProps) {
  const [prompt, setPrompt] = useState('Create a step-by-step cold email pitch for a high-ticket AI automation agency.');
  const [aiOutput, setAiOutput] = useState<string | null>(null);
  const [isGrading, setIsGrading] = useState(false);

  const handleTestPrompt = () => {
    setIsGrading(true);
    setTimeout(() => {
      setIsGrading(false);
      setAiOutput('🤖 Prompt Score: 96/100 (High Context, Clear Role, Specific Constraints). Generated Cold Email Outline Ready!');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* AI Portal Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-purple-500/15 via-card to-indigo-500/10 border border-purple-500/20 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold flex items-center gap-1 shadow-xs">
              <Cpu size={15} /> Artificial Intelligence Academy
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 border border-purple-500/20">
              Future-Proof Skills
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Build with AI, {displayName} 🤖
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Master Prompt Engineering, ChatGPT Automation, Python for AI &amp; custom LLM applications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-card border border-purple-500/30 text-xs font-bold text-purple-600">
            <Award size={16} className="text-purple-500" />
            <span>AI Specialist Track</span>
          </div>
          <Link
            href="/digital"
            className="px-4.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition-all"
          >
            <span>Launch AI Studio</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Core AI Tracks Grid */}
      <div>
        <h2 className="text-base font-extrabold text-foreground mb-4 flex items-center gap-2">
          <Sparkles size={17} className="text-purple-500" /> Specialized AI Learning Tracks
        </h2>
        <div className="grid md:grid-cols-2 gap-5">
          {aiTracks.map((track) => {
            const Icon = track.icon;
            return (
              <div
                key={track.id}
                className="p-6 rounded-3xl bg-card border border-border hover:border-purple-500/40 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${track.color}`}>
                      <Icon size={20} />
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-muted border border-border text-foreground">
                      {track.badge}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-foreground">{track.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{track.desc}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/50 flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Hands-on Practice</span>
                  <Link
                    href={track.link}
                    className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
                  >
                    <span>{track.actionText}</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive AI Prompt Grading Sandbox */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-800 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-bold">
            <Bot size={13} /> Live Prompt Engineering Sandbox
          </div>
          <h3 className="text-xl sm:text-2xl font-black">Test and Optimize Prompts with Real-Time AI Grading</h3>
          <p className="text-xs sm:text-sm text-purple-100 leading-relaxed">
            Write or test any prompt instruction to evaluate context clarity, role definition, and output precision.
          </p>
          {aiOutput && (
            <div className="p-3 rounded-xl bg-white/20 border border-white/30 text-xs font-semibold mt-2 animate-fadeIn">
              ✨ {aiOutput}
            </div>
          )}
        </div>

        <button
          onClick={handleTestPrompt}
          disabled={isGrading}
          className="px-6 py-3.5 rounded-2xl bg-white text-purple-900 font-black text-xs sm:text-sm hover:bg-purple-50 transition-all shadow-lg shrink-0 flex items-center gap-2 disabled:opacity-70"
        >
          <Sparkles size={16} />
          <span>{isGrading ? 'Grading Prompt Quality...' : 'Grade Sample Prompt'}</span>
        </button>
      </div>
    </div>
  );
}
