'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PublicNav from '@/components/PublicNav';
import { useProgram } from '@/contexts/ProgramContext';
import { Languages, Mic, Award, Sparkles, BookOpen, CheckCircle, ArrowRight, Play, Volume2, Star, Trophy, MessageSquare, Camera } from 'lucide-react';

export default function EnglishLearningPage() {
  const { setProgram } = useProgram();
  const [isDark, setIsDark] = useState(false);
  const [activeTab, setActiveTab] = useState<'spoken' | 'ielts' | 'pte' | 'grammar'>('spoken');
  const [speakingText, setSpeakingText] = useState('Welcome to Samyak English Mastery! Practice speaking with AI.');
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  React.useEffect(() => {
    if (isDark) {
      document.documentElement?.classList?.add('dark');
    } else {
      document.documentElement?.classList?.remove('dark');
    }
  }, [isDark]);

  const handleSimulatePractice = () => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      setAiFeedback(
        '🌟 Pronunciation Accuracy: 94% | Fluency Band: 8.5 | Feedback: Excellent intonation and clear vowel sounds! Try pacing slightly slower on complex sentences.'
      );
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <PublicNav isDark={isDark} onToggleDark={() => setIsDark(!isDark)} />

      {/* Hero Section */}
      <section className="relative pt-28 pb-16 bg-gradient-to-b from-amber-500/10 via-card to-background border-b border-border overflow-hidden">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            {/* Left Col */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-600 text-xs font-bold border border-amber-500/20">
                <Languages size={14} /> English Learning &amp; Test Preparation Vertical
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight leading-tight">
                Master Spoken English, <br className="hidden sm:inline" />
                <span className="text-amber-600">IELTS Band 8.0+ &amp; PTE 79+</span>
              </h1>
              <p className="text-base text-muted-foreground leading-relaxed max-w-xl">
                Nepal&apos;s premier English fluency hub. Interactive AI speaking evaluation, real IELTS mock exams, PTE task templates, and live conversation practice.
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  href="/english/classroom"
                  className="px-6 py-3.5 rounded-2xl bg-amber-600 text-white font-extrabold text-sm flex items-center gap-2 shadow-lg shadow-amber-600/20 hover:bg-amber-700 transition-all"
                >
                  <Sparkles size={16} />
                  <span>Launch 10-Module IELTS AI Classroom</span>
                </Link>
                <Link
                  href="/vision-marker"
                  className="px-6 py-3.5 rounded-2xl bg-card border border-border font-bold text-sm text-foreground flex items-center gap-2 hover:bg-muted transition-all"
                >
                  <Camera size={16} className="text-amber-600" />
                  <span>📸 Handwritten Paper AI Marker</span>
                </Link>
              </div>
            </div>

            {/* Right Card / Live AI Speaking Engine Launcher */}
            <div className="lg:col-span-5">
              <div id="ai-speaking-demo" className="bg-card border border-border rounded-3xl p-6 shadow-xl relative overflow-hidden space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                      <Mic size={16} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">Coach Aria — IELTS Speaking Engine</h3>
                      <p className="text-[10px] text-muted-foreground">Real-time voice speech recognition &amp; band scoring</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-success/10 text-success">ENGINE LIVE</span>
                </div>

                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs font-medium text-foreground space-y-1.5">
                  <p className="text-[10px] uppercase font-bold text-amber-600">Sample Cue Card Topic:</p>
                  <p className="font-bold text-sm text-foreground">&ldquo;Describe a goal or achievement you reached after hard work&rdquo;</p>
                  <p className="text-[11px] text-muted-foreground">Speech recognition · Official Band Descriptors (FC, LR, GRA, PR) · Voice output</p>
                </div>

                <Link
                  href="/english/speaking"
                  className="w-full py-4 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-600/20 transition-all"
                >
                  <Mic size={18} />
                  <span>Start Live Speaking Test Engine</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modules Tabs & Content */}
      <section className="py-14 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 w-full">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-foreground">Complete English Learning Curriculum</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-2">
            Structured modules designed by certified ESL educators &amp; ex-examiners
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          <button
            onClick={() => setActiveTab('spoken')}
            className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all ${
              activeTab === 'spoken' ? 'bg-amber-600 text-white shadow-md' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            🗣️ Spoken English &amp; Fluency
          </button>
          <button
            onClick={() => setActiveTab('ielts')}
            className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all ${
              activeTab === 'ielts' ? 'bg-amber-600 text-white shadow-md' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            🎓 IELTS Academic &amp; General (Band 8+)
          </button>
          <button
            onClick={() => setActiveTab('pte')}
            className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all ${
              activeTab === 'pte' ? 'bg-amber-600 text-white shadow-md' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            🎧 PTE Academic Express
          </button>
          <button
            onClick={() => setActiveTab('grammar')}
            className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all ${
              activeTab === 'grammar' ? 'bg-amber-600 text-white shadow-md' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            ✍️ Grammar &amp; Vocabulary Masterclass
          </button>
        </div>

        {/* Interactive Specialization Modules Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Card 1: Duolingo DET IT Engine */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm hover:border-cyan-500/40 transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center font-bold text-xl">
                💻
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground">Duolingo DET (IT Sector)</h3>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600">SCALE 10-160</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Adaptive Duolingo English Test practice for US/UK Computer Science MS applicants and remote IT developers.
              </p>
              <ul className="space-y-2 text-xs font-medium text-foreground pt-1">
                <li className="flex items-center gap-2"><CheckCircle size={14} className="text-cyan-600" /> Read &amp; Select Real Word Matrix</li>
                <li className="flex items-center gap-2"><CheckCircle size={14} className="text-cyan-600" /> 5-Min Interactive IT Essay</li>
                <li className="flex items-center gap-2"><CheckCircle size={14} className="text-cyan-600" /> US/UK CS MS Admission Benchmarks</li>
              </ul>
            </div>
            <Link
              href="/english/duolingo"
              className="w-full py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all mt-4"
            >
              <span>Launch Duolingo DET Engine</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Card 2: Cambridge Books 1-19 Vault */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm hover:border-violet-500/40 transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-violet-500/10 text-violet-600 flex items-center justify-center font-bold text-xl">
                📚
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground">Cambridge Books 1–19 Vault</h3>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-600">BAND 9.0</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Official Cambridge Academic Reading passages, True/False/Not Given solvers, and Band 9 examiner model essays.
              </p>
              <ul className="space-y-2 text-xs font-medium text-foreground pt-1">
                <li className="flex items-center gap-2"><CheckCircle size={14} className="text-violet-600" /> Academic Reading Passages (C1/C2)</li>
                <li className="flex items-center gap-2"><CheckCircle size={14} className="text-violet-600" /> True / False / Not Given Solvers</li>
                <li className="flex items-center gap-2"><CheckCircle size={14} className="text-violet-600" /> Band 9 Examiner Model Essays</li>
              </ul>
            </div>
            <Link
              href="/english/cambridge"
              className="w-full py-3 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all mt-4"
            >
              <span>Open Cambridge Vault</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Card 3: IT Sector Tech Interview Masterclass */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm hover:border-blue-500/40 transition-all space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-xl">
                👨‍💻
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground">IT &amp; Tech Interview English</h3>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600">GLOBAL JOBS</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Specialized English fluency for software engineers, IT job interviews, technical terminology, and pull request communication.
              </p>
              <ul className="space-y-2 text-xs font-medium text-foreground pt-1">
                <li className="flex items-center gap-2"><CheckCircle size={14} className="text-blue-600" /> Silicon Valley Recruiter AI Feedback</li>
                <li className="flex items-center gap-2"><CheckCircle size={14} className="text-blue-600" /> STAR Tech Interview Method</li>
                <li className="flex items-center gap-2"><CheckCircle size={14} className="text-blue-600" /> Software Terms Vocabulary Vault</li>
              </ul>
            </div>
            <Link
              href="/english/it-english"
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all mt-4"
            >
              <span>Start IT English Masterclass</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="mt-14 rounded-3xl bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="space-y-2 max-w-xl">
            <h3 className="text-2xl sm:text-3xl font-black">Ready to Speak English with Confidence?</h3>
            <p className="text-xs sm:text-sm text-amber-100">Join over 9,000+ students across Nepal who transformed their English skills with Samyak.</p>
          </div>
          <Link
            href="/courses?sector=english"
            onClick={() => setProgram('english')}
            className="px-8 py-4 rounded-2xl bg-white text-amber-900 font-black text-sm hover:bg-amber-50 transition-colors shadow-lg shrink-0"
          >
            Enroll in English Batch Now
          </Link>
        </div>
      </section>
    </div>
  );
}
