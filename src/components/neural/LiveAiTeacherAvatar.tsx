'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic, MicOff, Volume2, Sparkles, Brain, BookOpen, MessageSquare,
  Play, Square, CheckCircle2, ShieldCheck, RefreshCw, Zap, Award
} from 'lucide-react';
import toast from 'react-hot-toast';

interface LiveAiTeacherAvatarProps {
  initialPersona?: 'coach_aria' | 'dr_neuro' | 'prof_sigma';
  subject?: string;
}

export default function LiveAiTeacherAvatar({
  initialPersona = 'coach_aria',
  subject = 'IELTS Speaking & Masterclass',
}: LiveAiTeacherAvatarProps) {
  const [persona, setPersona] = useState(initialPersona);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Live Subtitles & Blackboard Notes
  const [currentSubtitle, setCurrentSubtitle] = useState('');
  const [blackboardNotes, setBlackboardNotes] = useState<string[]>([
    '• Welcome to 1-on-1 Live AI Classroom!',
    '• Focus: Band 8.5+ Coherence, Fluency & Accent Precision',
    '• Ask any question or start speaking naturally...',
  ]);

  const [sessionId, setSessionId] = useState<string | null>(null);

  // Audio Equalizer Spectrum simulation
  const [spectrum, setSpectrum] = useState<number[]>([20, 40, 60, 80, 50, 30, 70, 90, 40, 20]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSpeaking) {
      interval = setInterval(() => {
        setSpectrum(Array.from({ length: 10 }, () => Math.floor(Math.random() * 80) + 20));
      }, 100);
    } else {
      setSpectrum([15, 20, 15, 25, 20, 15, 25, 20, 15, 20]);
    }
    return () => clearInterval(interval);
  }, [isSpeaking]);

  const startSession = async () => {
    try {
      const res = await fetch('/api/ai/realtime/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona, subject }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start session');

      setSessionId(data.sessionId);
      setIsConnected(true);
      setIsListening(true);
      toast.success(`Connected to Live Teacher (${persona.replace('_', ' ').toUpperCase()})`);

      // Initial Welcome Voice
      speakWithElevenLabs(`Hello! I am your live AI teacher, ${persona === 'coach_aria' ? 'Coach Aria' : 'Dr. Neuro'}. Let us begin our session on ${subject}. How may I help you today?`);
    } catch (err: any) {
      toast.error(err.message || 'Connection failed.');
    }
  };

  const endSession = () => {
    setIsConnected(false);
    setIsListening(false);
    setIsSpeaking(false);
    setSessionId(null);
    setCurrentSubtitle('');
    toast.success('Live AI session ended.');
  };

  const speakWithElevenLabs = async (text: string) => {
    setCurrentSubtitle(text);
    setIsSpeaking(true);
    setBlackboardNotes((prev) => [...prev.slice(-3), `• AI Teacher: "${text.slice(0, 70)}..."`]);

    try {
      const res = await fetch('/api/ai/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, persona }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const audio = new Audio(URL.createObjectURL(blob));
        audio.onended = () => setIsSpeaking(false);
        audio.onerror = () => setIsSpeaking(false);
        await audio.play();
        return;
      }
    } catch {
      // Fallback
    }

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsSpeaking(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
            <Brain size={20} />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase text-amber-600">
              <Sparkles size={12} /> OpenAI Realtime + ElevenLabs + HeyGen Avatar Engine
            </div>
            <h3 className="text-lg font-black text-foreground flex items-center gap-2">
              1-on-1 Live AI Teacher Classroom
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 border border-violet-500/20">HEYGEN VIDEO READY</span>
            </h3>
          </div>
        </div>

        {/* Persona Switcher */}
        <div className="flex items-center gap-2">
          {[
            { id: 'coach_aria', label: '🇬🇧 Coach Aria' },
            { id: 'dr_neuro', label: '🔬 Dr. Neuro' },
            { id: 'prof_sigma', label: '📐 Prof. Sigma' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setPersona(p.id as any);
                if (isConnected) endSession();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                persona === p.id
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Classroom Canvas Grid */}
      <div className="grid lg:grid-cols-12 gap-6 items-stretch">

        {/* Left Column: Live AI Avatar & Equalizer Visualizer */}
        <div className="lg:col-span-7 bg-slate-950 text-white rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[360px] border border-slate-800 shadow-inner">
          
          {/* Top Status Bar */}
          <div className="flex items-center justify-between z-10">
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-white/10 text-white flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success animate-ping' : 'bg-red-500'}`} />
              {isConnected ? 'LIVE SESSION ACTIVE' : 'DISCONNECTED'}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {sessionId || 'Ready to negotiate WebRTC'}
            </span>
          </div>

          {/* Center AI Teacher Avatar Graphic */}
          <div className="my-auto text-center space-y-4 relative z-10 py-6">
            <div className="relative w-28 h-28 mx-auto">
              <div className={`absolute -inset-3 rounded-full bg-gradient-to-r from-amber-500 to-cyan-500 opacity-75 blur-md transition-all duration-300 ${
                isSpeaking ? 'scale-110 opacity-100' : 'scale-100 opacity-40'
              }`} />
              <div className="relative w-28 h-28 rounded-full bg-slate-900 border-2 border-amber-500/50 flex items-center justify-center text-4xl font-black text-amber-400 shadow-2xl overflow-hidden">
                {persona === 'coach_aria' ? '👩🏫' : persona === 'dr_neuro' ? '👨🔬' : '👨🏫'}
              </div>
            </div>

            <div>
              <h4 className="text-xl font-black text-white">
                {persona === 'coach_aria' ? 'Coach Aria (IELTS Senior Examiner)' : persona === 'dr_neuro' ? 'Dr. Neuro (Science & CEE Professor)' : 'Prof. Sigma (Mathematics Mentor)'}
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {isSpeaking ? '🔊 Speaking using ElevenLabs Studio Audio...' : isListening ? '🎤 Listening for your response...' : 'Click "Start Live Class" to begin'}
              </p>
            </div>

            {/* Audio Frequency Equalizer Spectrum */}
            <div className="flex items-end justify-center gap-1 h-8 pt-2">
              {spectrum.map((h, i) => (
                <div
                  key={i}
                  style={{ height: `${h}%` }}
                  className={`w-1.5 rounded-full transition-all duration-100 ${
                    isSpeaking ? 'bg-amber-400' : 'bg-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Subtitle Ticker */}
          {currentSubtitle && (
            <div className="z-10 p-3 rounded-xl bg-black/60 backdrop-blur border border-white/10 text-xs font-medium text-amber-200 text-center animate-fadeIn">
              &ldquo;{currentSubtitle}&rdquo;
            </div>
          )}
        </div>

        {/* Right Column: Live Interactive Blackboard & Notes (RAG Knowledge) */}
        <div className="lg:col-span-5 bg-card border border-border rounded-3xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h4 className="text-xs font-black uppercase text-amber-600 tracking-wider flex items-center gap-1.5">
                <BookOpen size={14} /> Live Blackboard Notes (RAG Context)
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground">REALTIME</span>
            </div>

            <div className="p-4 rounded-2xl bg-muted/40 border border-border font-mono text-xs text-foreground space-y-2 min-h-[180px]">
              {blackboardNotes.map((note, i) => (
                <p key={i} className="leading-relaxed">{note}</p>
              ))}
            </div>
          </div>

          {/* Controller Action Buttons */}
          <div className="space-y-2 pt-2">
            {!isConnected ? (
              <button
                onClick={startSession}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 hover:bg-amber-700 transition-all"
              >
                <Play size={16} />
                <span>Start 1-on-1 Live Class Session</span>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => speakWithElevenLabs("Let us summarize the key formula for today's topic.")}
                  className="py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 font-bold text-xs hover:bg-amber-500/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <MessageSquare size={14} />
                  <span>Ask Question</span>
                </button>
                <button
                  onClick={endSession}
                  className="py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 font-bold text-xs hover:bg-red-500/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <Square size={14} />
                  <span>End Session</span>
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
