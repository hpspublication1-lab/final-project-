'use client';

import React from 'react';
import Link from 'next/link';
import {
  Brain, Bot, Video, Camera, Target, ShieldAlert, RotateCcw, Zap, Sparkles, ArrowRight
} from 'lucide-react';

const INTELLIGENCE_MODULES = [
  { id: 'teacher', icon: Video, title: '👩‍🏫 AI Teacher', desc: '1-on-1 spoken avatar & live blackboard stage', route: '/live-teacher', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { id: 'tutor', icon: Bot, title: '🤖 AI Tutor Agent', desc: '24/7 instant doubt & formula solver', route: '/ai-tutor', color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { id: 'evaluator', icon: Camera, title: '📸 AI Evaluator', desc: 'Handwritten exam paper OCR red-pen marker', route: '/vision-marker', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 'planner', icon: Target, title: '🎯 AI Study Planner', desc: '8-week personalized curriculum roadmap', route: '/study-plan', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { id: 'weakness', icon: ShieldAlert, title: '🛡️ Weakness Detection', desc: 'Sub-chapter accuracy bottleneck analyzer', route: '/mistake-analyser', color: 'text-rose-500', bg: 'bg-rose-500/10' },
  { id: 'revision', icon: RotateCcw, title: '🔄 Personalized Revision', desc: 'Next best exercise recommendation engine', route: '/practice', color: 'text-teal-500', bg: 'bg-teal-500/10' },
  { id: 'generator', icon: Zap, title: '⚡ Question Generator', desc: 'Instant custom MCQ & model test generator', route: '/mcq-generator', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  { id: 'memory', icon: Brain, title: '🧠 Student Memory', desc: 'Persistent Supabase AI learning profile database', route: '/student-dashboard', color: 'text-amber-600', bg: 'bg-amber-500/10' },
];

export default function SamyakIntelligenceSection() {
  return (
    <section className="py-20 bg-muted/20 border-y border-border relative overflow-hidden">
      
      {/* Glow Orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-purple-500/10 blur-3xl pointer-events-none" />

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 relative z-10 space-y-12">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 text-purple-600 text-xs font-black border border-purple-500/20">
            <Brain size={14} /> Universal Platform Layer
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight">
            🧠 SAMYAK INTELLIGENCE
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Not just an AI course. <span className="text-foreground font-bold">Samyak Intelligence</span> is the universal AI engine powering evaluation, weakness detection, teacher avatars, and student memory across all 5 portals.
          </p>
        </div>

        {/* 8-Module Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {INTELLIGENCE_MODULES.map((mod) => (
            <Link
              key={mod.id}
              href={mod.route}
              className="bg-card border border-border rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl ${mod.bg} ${mod.color} flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                  <mod.icon size={22} />
                </div>

                <div>
                  <h3 className="text-base font-black text-foreground group-hover:text-purple-600 transition-colors">
                    {mod.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {mod.desc}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-black text-purple-600 pt-2 border-t border-border/60">
                <span>Launch Engine</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
