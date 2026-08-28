'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Volume2, Smile, Frown, Brain, HelpCircle, CheckCircle2 } from 'lucide-react';

export type ExpressionType = 'explaining' | 'thinking' | 'listening' | 'praising' | 'correcting';

interface SamyakAvatarRendererProps {
  persona?: 'coach_aria' | 'dr_neuro' | 'prof_sigma';
  isSpeaking: boolean;
  isListening: boolean;
  expression?: ExpressionType;
  currentSubtitle?: string;
}

export default function SamyakAvatarRenderer({
  persona = 'coach_aria',
  isSpeaking,
  isListening,
  expression = 'explaining',
  currentSubtitle,
}: SamyakAvatarRendererProps) {
  // Procedural Blinking Timer
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 180);
    }, Math.floor(Math.random() * 3000) + 2500);

    return () => clearInterval(blinkInterval);
  }, []);

  const getPersonaMeta = () => {
    switch (persona) {
      case 'dr_neuro':
        return {
          name: 'Dr. Neuro',
          role: 'Senior CEE Physics & Medical Professor',
          avatarEmoji: '👨🔬',
          gradient: 'from-blue-600 via-cyan-600 to-indigo-700',
        };
      case 'prof_sigma':
        return {
          name: 'Prof. Sigma',
          role: 'Chief Mathematics & SEE Specialist',
          avatarEmoji: '👨🏫',
          gradient: 'from-emerald-600 via-teal-600 to-cyan-700',
        };
      default:
        return {
          name: 'Coach Aria',
          role: 'IELTS Senior British Examiner (Band 9.0)',
          avatarEmoji: '👩🏫',
          gradient: 'from-amber-500 via-amber-600 to-amber-700',
        };
    }
  };

  const meta = getPersonaMeta();

  return (
    <div className="relative w-full h-full min-h-[380px] rounded-3xl bg-slate-950 border border-slate-800/80 overflow-hidden flex flex-col justify-between p-6 text-white shadow-2xl">
      
      {/* Background Mood Lights & Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-amber-500/15 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Top Header Badge */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
            SAMYAK AI TEACHER ENGINE
          </span>
        </div>
        <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/15 text-[10px] font-extrabold uppercase text-slate-200">
          {expression.toUpperCase()} MODE
        </div>
      </div>

      {/* Center Animated Avatar Box */}
      <div className="relative z-10 my-auto text-center space-y-4 py-4">
        <div className="relative w-36 h-36 mx-auto group">
          
          {/* Audio Reactive Glow Aura */}
          <div className={`absolute -inset-4 rounded-full bg-gradient-to-tr ${meta.gradient} blur-xl transition-all duration-300 ${
            isSpeaking ? 'scale-125 opacity-90 animate-pulse' : 'scale-100 opacity-40'
          }`} />

          {/* Avatar Disc Container */}
          <div className="relative w-36 h-36 rounded-full bg-slate-900 border-4 border-amber-500/60 shadow-2xl flex items-center justify-center overflow-hidden transition-all duration-500 animate-float">
            
            {/* Expression Emoji Visualizer */}
            <div className="relative flex flex-col items-center justify-center">
              <span className={`text-6xl transition-transform duration-300 ${
                isSpeaking ? 'scale-110' : 'scale-100'
              }`}>
                {meta.avatarEmoji}
              </span>

              {/* Eyes & Blinking Overlay */}
              {isBlinking && (
                <div className="absolute top-4 flex gap-4 text-xs">
                  <span className="w-3 h-0.5 bg-slate-900 rounded-full" />
                  <span className="w-3 h-0.5 bg-slate-900 rounded-full" />
                </div>
              )}

              {/* Lip-Sync Viseme Mouth Animation */}
              <div className="mt-1 flex items-center justify-center">
                {isSpeaking ? (
                  <div className="w-6 h-3 rounded-full bg-amber-900 border border-amber-500 animate-bounce" />
                ) : (
                  <div className="w-4 h-1 rounded-full bg-slate-700" />
                )}
              </div>
            </div>

          </div>

          {/* Status Indicator Icon */}
          <div className="absolute -bottom-1 -right-1 p-2 rounded-full bg-slate-900 border border-slate-700 text-amber-400 shadow-md">
            {isSpeaking ? <Volume2 size={16} className="animate-bounce" /> : isListening ? <Brain size={16} className="animate-pulse" /> : <Sparkles size={16} />}
          </div>
        </div>

        {/* Name & Role Badge */}
        <div>
          <h3 className="text-xl font-black text-white tracking-tight">{meta.name}</h3>
          <p className="text-xs text-amber-400 font-semibold mt-0.5">{meta.role}</p>
        </div>

        {/* Audio Spectrum Equalizer */}
        <div className="flex items-end justify-center gap-1.5 h-6 pt-1">
          {[30, 60, 90, 45, 75, 55, 85, 40, 65, 35].map((h, idx) => (
            <div
              key={idx}
              style={{ height: isSpeaking ? `${Math.floor(Math.random() * 80) + 20}%` : `${h / 4}%` }}
              className="w-1.5 rounded-full bg-amber-400 transition-all duration-100"
            />
          ))}
        </div>
      </div>

      {/* Subtitles & Synced Caption Ticker */}
      <div className="relative z-10">
        {currentSubtitle ? (
          <div className="p-3.5 rounded-2xl bg-slate-900/90 backdrop-blur border border-amber-500/30 text-xs font-medium text-amber-100 text-center shadow-lg animate-fadeIn">
            &ldquo;{currentSubtitle}&rdquo;
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 text-[11px] font-mono text-slate-400 text-center">
            {isListening ? '🎤 Listening... Speak your question naturally' : 'Click "Start Class" to talk with Coach Aria'}
          </div>
        )}
      </div>

    </div>
  );
}
