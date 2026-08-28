'use client';

import React, { useState, useEffect } from 'react';
import SamyakAvatarRenderer, { ExpressionType } from './SamyakAvatarRenderer';
import {
  BookOpen, FileText, Target, Award, PenTool, Mic, Play, Square,
  Sparkles, CheckCircle2, RefreshCw, Volume2, HelpCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SamyakClassroomWorkspace() {
  const [persona, setPersona] = useState<'coach_aria' | 'dr_neuro' | 'prof_sigma'>('coach_aria');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [expression, setExpression] = useState<ExpressionType>('explaining');
  const [currentSubtitle, setCurrentSubtitle] = useState('');

  // Classroom State
  const [lessonTitle, setLessonTitle] = useState('IELTS Band 8.5 Task 2 Essay Masterclass');
  const [objective, setObjective] = useState('Master Coherence & Paragraph Linker Syntax');
  const [studentScore, setStudentScore] = useState<number>(8.0);

  // Live Whiteboard Notes
  const [whiteboardNotes, setWhiteboardNotes] = useState<Array<{ id: number; text: string; type: 'heading' | 'note' | 'formula' }>>([
    { id: 1, text: '📖 Lesson: Advanced Essay Cohesion & Topic Sentences', type: 'heading' },
    { id: 2, text: '1. Use transitional adverbs: "notwithstanding", "conversely", "consequently"', type: 'note' },
    { id: 3, text: '2. Formula: [Main Claim] + [Subordinating Conjunction] + [Evidence]', type: 'formula' },
  ]);

  const [studentQuestion, setStudentQuestion] = useState('');

  const speakTeacherResponse = async (text: string, expr: ExpressionType = 'explaining') => {
    setCurrentSubtitle(text);
    setExpression(expr);
    setIsSpeaking(true);

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
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsSpeaking(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!studentQuestion.trim()) return;
    const q = studentQuestion;
    setStudentQuestion('');
    setIsListening(true);
    setExpression('thinking');

    // Add student question to whiteboard
    setWhiteboardNotes((prev) => [
      ...prev,
      { id: Date.now(), text: `❓ Student: "${q}"`, type: 'note' },
    ]);

    try {
      const res = await fetch('/api/ai/heygen/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentInput: q,
          persona,
        }),
      });

      const data = await res.json();
      setIsListening(false);

      if (data.responseText) {
        // Add teacher response formula to whiteboard
        setWhiteboardNotes((prev) => [
          ...prev,
          { id: Date.now() + 1, text: `✍️ ${persona.toUpperCase()}: ${data.responseText}`, type: 'formula' },
        ]);
        await speakTeacherResponse(data.responseText, 'praising');
      }
    } catch {
      setIsListening(false);
      await speakTeacherResponse("That is an excellent question. Let us break down the answer step-by-step.", 'explaining');
    }
  };

  return (
    <div className="space-y-8">

      {/* Top Banner Control Panel */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-lg space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left Lesson Metadata */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                🧑‍🏫 SAMYAK AI TEACHER ENGINE
              </span>
              <span className="text-xs font-bold text-muted-foreground">• Active Learning Loop</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-foreground">{lessonTitle}</h2>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
              <Target size={14} className="text-amber-600" />
              Current Objective: <span className="text-foreground font-bold">{objective}</span>
            </p>
          </div>

          {/* Right Score & Persona Selection */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
              <span className="text-[9px] font-extrabold uppercase text-amber-600 block">MASTERY SCORE</span>
              <span className="text-xl font-black text-amber-600">{studentScore.toFixed(1)}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-muted/40 p-1.5 rounded-2xl border border-border">
              {[
                { id: 'coach_aria', label: '👩‍🏫 Coach Aria' },
                { id: 'dr_neuro', label: '👨‍🔬 Dr. Neuro' },
                { id: 'prof_sigma', label: '👨‍🏫 Prof. Sigma' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPersona(p.id as any)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    persona === p.id ? 'bg-amber-600 text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 7-Step AI Teacher Interactive Loop Indicator */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
            <Sparkles size={13} /> Active 7-Step AI Teacher Loop:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-[11px] font-bold text-foreground text-center">
            <div className="p-2 rounded-xl bg-card border border-border">1. See Goal</div>
            <div className="p-2 rounded-xl bg-card border border-border">2. Explain</div>
            <div className="p-2 rounded-xl bg-card border border-border">3. Ask</div>
            <div className="p-2 rounded-xl bg-card border border-border">4. Listen</div>
            <div className="p-2 rounded-xl bg-card border border-border">5. Correct</div>
            <div className="p-2 rounded-xl bg-card border border-border">6. Exercise</div>
            <div className="p-2 rounded-xl bg-amber-600 text-white border border-amber-600">7. Remember</div>
          </div>
        </div>

      </div>

      {/* Main Split Classroom Workspace Grid */}
      <div className="grid lg:grid-cols-12 gap-8 items-stretch">

        {/* Left Column: Samyak 2D/3D Animated Teacher Stage */}
        <div className="lg:col-span-6 flex flex-col space-y-4">
          <div className="flex-1 min-h-[420px]">
            <SamyakAvatarRenderer
              persona={persona}
              isSpeaking={isSpeaking}
              isListening={isListening}
              expression={expression}
              currentSubtitle={currentSubtitle}
            />
          </div>

          {/* Quick Voice Prompt Trigger */}
          <div className="p-4 rounded-2xl bg-card border border-border flex items-center gap-3">
            <input
              type="text"
              value={studentQuestion}
              onChange={(e) => setStudentQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
              placeholder="Type your question or topic to discuss with Coach Aria..."
              className="flex-1 bg-muted/50 border border-border p-3 rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
            />
            <button
              onClick={handleAskQuestion}
              className="px-5 py-3 rounded-xl bg-amber-600 text-white font-extrabold text-xs hover:bg-amber-700 transition-all flex items-center gap-1.5 shrink-0 shadow-sm"
            >
              <Mic size={14} />
              <span>Ask Teacher</span>
            </button>
          </div>
        </div>

        {/* Right Column: Interactive Whiteboard, Notes, Objective & Score */}
        <div className="lg:col-span-6 bg-card border border-border rounded-3xl p-6 flex flex-col justify-between space-y-6 shadow-sm">
          
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h3 className="text-sm font-black text-foreground uppercase tracking-wider flex items-center gap-2">
              <PenTool size={16} className="text-amber-600" />
              Interactive Whiteboard &amp; Live Notes
            </h3>
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-success/10 text-success">
              LIVE SYNCHRONIZED
            </span>
          </div>

          {/* Whiteboard Display Area */}
          <div className="flex-1 p-5 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-xs space-y-3 min-h-[280px] border border-slate-800 shadow-inner overflow-y-auto">
            {whiteboardNotes.map((item) => (
              <div
                key={item.id}
                className={`p-2.5 rounded-xl border ${
                  item.type === 'heading'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 font-bold text-sm'
                    : item.type === 'formula'
                    ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-200'
                }`}
              >
                {item.text}
              </div>
            ))}
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => speakTeacherResponse("In IELTS Task 2, aim for at least 2 complex sentences per paragraph.", 'explaining')}
              className="py-3 px-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 font-bold text-xs hover:bg-amber-500/20 transition-all flex items-center justify-center gap-1"
            >
              <BookOpen size={14} />
              <span>Grammar Tip</span>
            </button>

            <button
              onClick={() => speakTeacherResponse("Outstanding effort! Your coherence score is approaching Band 8.5.", 'praising')}
              className="py-3 px-2 rounded-xl bg-success/10 border border-success/20 text-success font-bold text-xs hover:bg-success/20 transition-all flex items-center justify-center gap-1"
            >
              <Award size={14} />
              <span>Score Evaluation</span>
            </button>

            <button
              onClick={() => setWhiteboardNotes([{ id: 1, text: '📖 Live Class Reset. Ready for new topic!', type: 'heading' }])}
              className="py-3 px-2 rounded-xl bg-muted border border-border text-muted-foreground font-bold text-xs hover:text-foreground transition-all flex items-center justify-center gap-1"
            >
              <RefreshCw size={14} />
              <span>Clear Board</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
