'use client';

import React, { useState, useEffect } from 'react';
import PublicNav from '@/components/PublicNav';
import {
  Headphones, Play, Pause, Volume2, Sparkles, CheckCircle2,
  RefreshCw, Award, ArrowRight, Eye, EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';
import { IELTSListeningTask } from '@/app/api/english/listening/generate/route';

export default function IELTSListeningPage() {
  const [isDark, setIsDark] = useState(false);
  const [activeSection, setActiveSection] = useState<1 | 2 | 3 | 4>(1);
  const [task, setTask] = useState<IELTSListeningTask | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Audio Player
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  // Student Answers
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    fetchTask(activeSection);
  }, [activeSection]);

  const fetchTask = async (sec: number) => {
    setLoading(true);
    setSubmitted(false);
    setUserAnswers({});
    setScore(null);
    try {
      const res = await fetch(`/api/english/listening/generate?section=${sec}`);
      if (res.ok) {
        const data = await res.json();
        setTask(data);
      }
    } catch {
      toast.error('Failed to load listening section.');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayAudio = async () => {
    if (!task) return;
    if (isPlaying) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    try {
      const res = await fetch('/api/ai/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: task.audioTranscript, persona: 'coach_aria' }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const audio = new Audio(URL.createObjectURL(blob));
        audio.onended = () => setIsPlaying(false);
        audio.onerror = () => setIsPlaying(false);
        await audio.play();
        return;
      }
    } catch {
      // Fallback
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(task.audioTranscript);
      utterance.rate = 0.9;
      utterance.onend = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsPlaying(false);
    }
  };

  const handleSubmit = () => {
    if (!task) return;
    let correct = 0;
    task.questions.forEach((q) => {
      if (userAnswers[q.id] === q.correctAnswer) {
        correct += 1;
      }
    });

    const calculatedScore = Math.round((correct / task.questions.length) * 100);
    setScore(calculatedScore);
    setSubmitted(true);
    toast.success(`Submitted! Score: ${correct}/${task.questions.length} (${calculatedScore}%)`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <PublicNav isDark={isDark} onToggleDark={() => setIsDark(!isDark)} />

      {/* Hero Section */}
      <section className="pt-28 pb-8 bg-gradient-to-b from-purple-500/10 via-card to-background border-b border-border">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 text-purple-600 text-xs font-black border border-purple-500/20">
            <Headphones size={14} /> Cambridge IELTS Listening Audio Engine
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight leading-tight">
            IELTS Academic &amp; GT <span className="text-purple-600">Listening Trainer</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Practice Sections 1–4 with authentic ElevenLabs multi-accent audio streams (British, Australian, North American) and instant answer verification.
          </p>
        </div>
      </section>

      {/* Main Workspace */}
      <section className="py-8 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 space-y-8">
        
        {/* Section Selector Bar */}
        <div className="flex items-center justify-center gap-3">
          {[
            { id: 1, label: 'Section 1 (Social Dialogue)' },
            { id: 2, label: 'Section 2 (Monologue)' },
            { id: 3, label: 'Section 3 (Group Discussion)' },
            { id: 4, label: 'Section 4 (Academic Lecture)' },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id as any)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all border ${
                activeSection === s.id
                  ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                  : 'bg-card border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Task Box */}
        {task && (
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-lg space-y-6">
            
            {/* Audio Control Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 bg-purple-500/10 px-2.5 py-0.5 rounded-full">
                  {task.accent} Accent · Section {task.section}
                </span>
                <h3 className="text-lg font-black text-foreground mt-1">{task.title}</h3>
                <p className="text-xs text-muted-foreground">{task.contextDescription}</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handlePlayAudio}
                  className={`px-5 py-3 rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg transition-all ${
                    isPlaying
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                  <span>{isPlaying ? 'Pause Audio' : 'Play ElevenLabs Studio Audio'}</span>
                </button>

                <button
                  onClick={() => setShowTranscript(!showTranscript)}
                  className="p-3 rounded-2xl bg-muted/50 border border-border text-muted-foreground hover:text-foreground transition-all"
                  title="Toggle Audio Transcript"
                >
                  {showTranscript ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Optional Transcript Box */}
            {showTranscript && (
              <div className="p-4 rounded-2xl bg-slate-950 text-purple-300 font-mono text-xs space-y-1 border border-slate-800 animate-fadeIn">
                <span className="text-[10px] uppercase font-bold text-slate-400">Verbatim Audio Transcript:</span>
                <p className="whitespace-pre-line leading-relaxed">{task.audioTranscript}</p>
              </div>
            )}

            {/* Questions Sheet */}
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase text-foreground">Answer the Questions Below:</h4>
              <div className="space-y-4">
                {task.questions.map((q) => (
                  <div key={q.id} className="p-4 rounded-2xl bg-muted/30 border border-border space-y-3">
                    <p className="text-xs font-bold text-foreground">
                      Question {q.id}: {q.questionText}
                    </p>
                    <div className="grid sm:grid-cols-2 gap-2 text-xs">
                      {q.options.map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => !submitted && setUserAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                          className={`p-3 rounded-xl text-left border font-medium transition-all ${
                            userAnswers[q.id] === opt
                              ? 'bg-purple-600 text-white border-purple-600 font-bold'
                              : 'bg-card border-border text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>

                    {submitted && (
                      <div className={`p-3 rounded-xl text-xs space-y-1 ${
                        userAnswers[q.id] === q.correctAnswer ? 'bg-success/10 border border-success/20 text-success' : 'bg-error/10 border border-error/20 text-error'
                      }`}>
                        <p className="font-bold">Correct Answer: {q.correctAnswer}</p>
                        <p className="text-[11px] text-muted-foreground">{q.explanation}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            {!submitted ? (
              <button
                onClick={handleSubmit}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25 hover:bg-purple-700 transition-all"
              >
                <Award size={16} />
                <span>Submit &amp; Grade Listening Section</span>
              </button>
            ) : (
              <div className="p-6 rounded-3xl bg-purple-600 text-white text-center space-y-2">
                <h4 className="text-2xl font-black">Section Score: {score}%</h4>
                <button
                  onClick={() => fetchTask(activeSection)}
                  className="px-6 py-2.5 rounded-xl bg-white text-purple-900 font-extrabold text-xs hover:bg-purple-50 transition-all inline-flex items-center gap-1.5"
                >
                  <RefreshCw size={14} /> Try Next Listening Passage
                </button>
              </div>
            )}

          </div>
        )}
      </section>
    </div>
  );
}
