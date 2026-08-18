'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ProgramSwitcher from '@/components/ProgramSwitcher';
import { useProgram, ProgramType } from '@/contexts/ProgramContext';
import { ArrowRight, Star, Zap, CheckCircle2, Sparkles, Brain, Check, X, RotateCcw, RefreshCw } from 'lucide-react';



function useCEECountdown() {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    setMounted(true);
    const target = new Date('2026-04-15T08:00:00');
    const tick = () => {
      const now = new Date();
      const diff = target.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (!mounted) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return timeLeft;
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center bg-card/80 backdrop-blur-md rounded-xl border border-primary/20 px-3 py-2.5 sm:px-4 sm:py-3 min-w-[56px] sm:min-w-[72px] shadow-xs">
      <span className="font-mono text-xl sm:text-2xl font-bold text-foreground tabular-nums leading-none" suppressHydrationWarning>
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-[10px] sm:text-[11px] uppercase tracking-wide text-muted-foreground mt-1.5 font-semibold">{label}</span>
    </div>
  );
}

const SECTOR_HIGHLIGHTS: Record<ProgramType, { key: string; text: string }[]> = {
  cee: [
    { key: 'hl-mcq', text: '15,000+ CEE MCQs with detailed explanations' },
    { key: 'hl-notes', text: 'Sub-chapter high-yield notes (Bio, Chem, Physics)' },
    { key: 'hl-live', text: 'Live MEC mock exams on Samyak Guru App' },
    { key: 'hl-battle', text: 'Real-time 2-player entrance battle arena' },
  ],
  see: [
    { key: 'hl-see-sci', text: 'Complete Grade 10 Science & Opt Math solved' },
    { key: 'hl-see-board', text: 'Previous 10 Years NEB Board Question Bank' },
    { key: 'hl-see-notes', text: 'Chapter-wise HD Video lectures & summary notes' },
    { key: 'hl-see-gpa', text: 'Target 4.0 GPA step-by-step guidance' },
  ],
  english: [
    { key: 'hl-eng-spk', text: 'Daily AI Spoken English fluency practice' },
    { key: 'hl-eng-ielts', text: 'IELTS Academic & GT Band 8.0+ strategies' },
    { key: 'hl-eng-pte', text: 'PTE 79+ Express templates & mock scoring' },
    { key: 'hl-eng-cert', text: 'Job interview & email communication skills' },
  ],
  digital: [
    { key: 'hl-dig-ai', text: 'ChatGPT, Claude & Midjourney Prompt Engineering' },
    { key: 'hl-dig-py', text: 'Python programming from scratch to 5 real projects' },
    { key: 'hl-dig-mkt', text: 'Canva graphic design & Facebook/TikTok ads' },
    { key: 'hl-dig-free', text: 'Upwork & Fiverr freelancing gig setup guide' },
  ],
};

interface HeroMCQ {
  subject: string;
  badgeColor: string;
  badgeBg: string;
  question: string;
  options: { id: string; text: string }[];
  correctId: string;
  explanation: string;
}

const SECTOR_MCQ_POOLS: Record<ProgramType, HeroMCQ[]> = {
  cee: [
    {
      subject: 'Botany · Photosynthesis',
      badgeColor: 'text-bio',
      badgeBg: 'bg-bio-light',
      question: 'Which enzyme is responsible for primary CO₂ fixation in C₄ plants during photosynthesis?',
      options: [
        { id: 'a', text: 'RuBisCO' },
        { id: 'b', text: 'PEP carboxylase (PEPcase)' },
        { id: 'c', text: 'ATP synthase' },
        { id: 'd', text: 'Carbonic anhydrase' },
      ],
      correctId: 'b',
      explanation: 'PEP carboxylase fixes CO₂ in mesophyll cells of C₄ plants into oxaloacetate (4C acid), having high affinity for CO₂.',
    },
    {
      subject: 'Physics · Mechanics',
      badgeColor: 'text-physics',
      badgeBg: 'bg-physics-light',
      question: 'If the velocity of a moving body is doubled, its kinetic energy becomes:',
      options: [
        { id: 'a', text: 'Doubled (2x)' },
        { id: 'b', text: 'Quadrupled (4x)' },
        { id: 'c', text: 'Halved (1/2x)' },
        { id: 'd', text: 'Unchanged' },
      ],
      correctId: 'b',
      explanation: 'Kinetic energy KE = ½ mv². Since KE ∝ v², doubling velocity increases KE by (2)² = 4 times.',
    },
    {
      subject: 'Chemistry · Organic',
      badgeColor: 'text-chem',
      badgeBg: 'bg-chem-light',
      question: 'Which of the following compounds gives a positive Tollens\' reagent test (silver mirror)?',
      options: [
        { id: 'a', text: 'Acetone (Propanone)' },
        { id: 'b', text: 'Acetaldehyde (Ethanal)' },
        { id: 'c', text: 'Ethanol' },
        { id: 'd', text: 'Acetic acid' },
      ],
      correctId: 'b',
      explanation: 'Aldehydes like acetaldehyde reduce Tollens\' reagent [Ag(NH₃)₂]⁺ to metallic silver. Ketones like acetone do not.',
    },
  ],
  see: [
    {
      subject: 'Science · Physics & Energy',
      badgeColor: 'text-bio',
      badgeBg: 'bg-bio-light',
      question: 'What happens to the gravitational force between two masses if the distance between them is halved?',
      options: [
        { id: 'a', text: 'Halved (1/2)' },
        { id: 'b', text: 'Doubled (2x)' },
        { id: 'c', text: 'Increases 4 times (4x)' },
        { id: 'd', text: 'Decreases 4 times (1/4x)' },
      ],
      correctId: 'c',
      explanation: 'Newton\'s Law of Gravitation: F = G(m₁m₂)/d². Halving distance d makes F 4 times larger.',
    },
    {
      subject: 'Opt Math · Trigonometry',
      badgeColor: 'text-chem',
      badgeBg: 'bg-chem-light',
      question: 'If sin A = 3/5 in a right-angled triangle, what is the value of cos A?',
      options: [
        { id: 'a', text: '4/5' },
        { id: 'b', text: '5/4' },
        { id: 'c', text: '3/4' },
        { id: 'd', text: '5/3' },
      ],
      correctId: 'a',
      explanation: 'Using cos A = √(1 - sin² A) = √(1 - 9/25) = √(16/25) = 4/5.',
    },
  ],
  english: [
    {
      subject: 'Grammar · Subject-Verb Agreement',
      badgeColor: 'text-amber-600',
      badgeBg: 'bg-amber-500/10',
      question: 'Choose the correct option: "Neither the manager nor the employees _____ present at the meeting."',
      options: [
        { id: 'a', text: 'was' },
        { id: 'b', text: 'were' },
        { id: 'c', text: 'is' },
        { id: 'd', text: 'has been' },
      ],
      correctId: 'b',
      explanation: 'With "neither... nor...", the verb agrees with the subject closest to it ("employees" is plural → "were").',
    },
    {
      subject: 'IELTS Vocabulary · Academic',
      badgeColor: 'text-amber-600',
      badgeBg: 'bg-amber-500/10',
      question: 'What is the closest synonym for the academic word "METICULOUS"?',
      options: [
        { id: 'a', text: 'Careless' },
        { id: 'b', text: 'Painstaking / Very Thorough' },
        { id: 'c', text: 'Rapid' },
        { id: 'd', text: 'Vague' },
      ],
      correctId: 'b',
      explanation: '"Meticulous" means showing great attention to detail; very careful and precise.',
    },
  ],
  digital: [
    {
      subject: 'AI & Prompts · ChatGPT Basics',
      badgeColor: 'text-purple-600',
      badgeBg: 'bg-purple-500/10',
      question: 'In AI prompt engineering, what does "Zero-Shot Prompting" mean?',
      options: [
        { id: 'a', text: 'Giving AI no examples before asking a task' },
        { id: 'b', text: 'Training a model with 0 parameters' },
        { id: 'c', text: 'Writing a prompt with 0 words' },
        { id: 'd', text: 'Generating images without text' },
      ],
      correctId: 'a',
      explanation: 'Zero-shot prompting means providing a task description to the model without giving any prior examples or demonstrations.',
    },
    {
      subject: 'Python · Data Types',
      badgeColor: 'text-purple-600',
      badgeBg: 'bg-purple-500/10',
      question: 'What will be the output of print(type([1, 2, 3])) in Python?',
      options: [
        { id: 'a', text: '<class \'tuple\'>' },
        { id: 'b', text: '<class \'list\'>' },
        { id: 'c', text: '<class \'dict\'>' },
        { id: 'd', text: '<class \'set\'>' },
      ],
      correctId: 'b',
      explanation: 'Square brackets [ ] define a list object in Python.',
    },
  ],
};

export default function HeroSection() {
  const countdown = useCEECountdown();
  const { program, setProgram, programDetails } = useProgram();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'countdown' | 'demo'>('demo');
  const [currentMcqIdx, setCurrentMcqIdx] = useState(0);

  const highlights = SECTOR_HIGHLIGHTS[program] || SECTOR_HIGHLIGHTS.cee;
  const currentMcqPool = SECTOR_MCQ_POOLS[program] || SECTOR_MCQ_POOLS.cee;
  const currentMcq = currentMcqPool[currentMcqIdx % currentMcqPool.length];

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setCurrentMcqIdx((prev) => (prev + 1) % currentMcqPool.length);
  };

  return (
    <section className="relative pt-28 sm:pt-36 pb-16 sm:pb-24 overflow-hidden w-full max-w-full">
      {/* Background Gradient & Animated Glow Orbs */}
      <div className="absolute inset-0 gradient-hero" />
      <div className="absolute top-[-100px] right-[-100px] w-[650px] h-[650px] blob-primary opacity-70 pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-[-100px] left-[-100px] w-[500px] h-[500px] blob-accent opacity-50 pointer-events-none" />

      <div className="relative max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">

          {/* Left Column (7 cols) */}
          <div className="lg:col-span-7 space-y-6 animate-fade-in">
            <div className="flex flex-wrap items-center gap-3">
              <ProgramSwitcher size="md" />

              <div className="inline-flex items-center gap-2 bg-card/90 backdrop-blur-md border border-primary/30 text-foreground text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm">
                <Sparkles size={13} className="text-primary animate-pulse" />
                <span>Nepal #1 {programDetails.shortName} Prep System</span>
              </div>
            </div>

            <h1 className="text-hero-xl text-foreground font-black tracking-tight leading-[1.05]">
              Ace Your Exam{' '}
              <span className="bg-gradient-to-r from-primary via-[#7C6BFF] to-accent bg-clip-text text-transparent drop-shadow-sm">
                {programDetails.name}
              </span>
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl">
              {programDetails.description} Live interactive classes, video lectures, practice MCQs, and past paper solutions on Samyak Guru App.
            </p>


            <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-3">
              {highlights.map((h) => (
                <li key={h.key} className="flex items-center gap-3 text-sm font-bold text-foreground bg-card/70 backdrop-blur-md border border-primary/15 rounded-2xl px-4 py-2.5 shadow-xs hover:border-primary/40 hover:shadow-md transition-all">
                  <CheckCircle2 size={18} className="text-success shrink-0" />
                  {h.text}
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-3 pt-2 items-center">
              <Link href="/sign-up-login-screen" className="btn-primary gap-2.5 text-base py-4 px-8 shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] transition-all font-black rounded-2xl">
                Start Free Today
                <ArrowRight size={19} />
              </Link>
              <Link href="/courses" className="btn-secondary gap-2.5 text-base py-4 px-7 font-bold border-primary/30 hover:border-primary hover:bg-primary/5 rounded-2xl">
                <Sparkles size={17} className="text-primary" />
                Explore 4 Sectors
              </Link>
            </div>

            {/* PW-Grade 4 Sector Quick Bar */}
            <div className="pt-4 border-t border-border/60">
              <p className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground mb-2.5">
                Explore All Learning Sectors:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Link
                  href="/courses?sector=cee"
                  onClick={() => setProgram('cee')}
                  className="p-2.5 rounded-xl bg-card/80 border border-border hover:border-primary/50 text-xs font-bold text-foreground hover:text-primary transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <span>🩺</span>
                  <span className="truncate">CEE Medical</span>
                </Link>
                <Link
                  href="/courses?sector=see"
                  onClick={() => setProgram('see')}
                  className="p-2.5 rounded-xl bg-card/80 border border-border hover:border-bio/50 text-xs font-bold text-foreground hover:text-bio transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <span>🎓</span>
                  <span className="truncate">SEE Class 10</span>
                </Link>
                <Link
                  href="/english"
                  onClick={() => setProgram('english')}
                  className="p-2.5 rounded-xl bg-card/80 border border-border hover:border-amber-500/50 text-xs font-bold text-foreground hover:text-amber-600 transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <span>🗣️</span>
                  <span className="truncate">English &amp; IELTS</span>
                </Link>
                <Link
                  href="/digital"
                  onClick={() => setProgram('digital')}
                  className="p-2.5 rounded-xl bg-card/80 border border-border hover:border-purple-500/50 text-xs font-bold text-foreground hover:text-purple-600 transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <span>💻</span>
                  <span className="truncate">Digital &amp; AI</span>
                </Link>
              </div>
            </div>


            {/* Aspirants Social Proof & Live Ticker */}
            <div className="flex flex-wrap items-center gap-6 pt-2">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-3">
                  {['P', 'A', 'S', 'R', 'M'].map((initial, i) => (
                    <div
                      key={`avatar-${initial}-${i}`}
                      className="w-10 h-10 rounded-full border-2 border-background flex items-center justify-center text-xs font-black text-white shadow-md transition-transform hover:scale-110 cursor-pointer"
                      style={{ backgroundColor: ['#5A45E8','#16A36A','#8B5CF6','#2563EB','#E59A18'][i], zIndex: 5 - i }}
                    >
                      {initial}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1 text-warning">
                    {[...Array(5)].map((_, idx) => (
                      <Star key={`star-${idx}`} size={14} className="fill-warning" />
                    ))}
                    <span className="text-xs font-black text-foreground ml-1">4.9/5</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                    Trusted by <span className="font-bold text-foreground">40,000+ CEE aspirants</span> across Nepal
                  </p>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2 bg-success/10 border border-success/30 px-3.5 py-1.5 rounded-full text-xs font-bold text-success">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span>14,290 MCQs solved today</span>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols) — Interactive Widget Card */}
          <div className="lg:col-span-5 relative flex flex-col items-center">
            {/* Ambient Background Glow Ring */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary via-[#7C6BFF] to-accent rounded-3xl blur-xl opacity-40 animate-pulse pointer-events-none" />

            <div className="bg-card/90 backdrop-blur-2xl border border-primary/20 rounded-3xl p-6 sm:p-7 w-full max-w-md relative z-10 shadow-2xl">
              
              {/* Card Switcher Header */}
              <div className="flex rounded-2xl bg-muted/80 p-1.5 gap-1.5 mb-6 border border-border/40">
                <button
                  onClick={() => setActiveTab('demo')}
                  className={`flex-1 py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'demo' ? 'bg-card text-primary shadow-md border border-primary/20' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Brain size={15} className="text-primary" /> Live MCQ Demo
                </button>
                <button
                  onClick={() => setActiveTab('countdown')}
                  className={`flex-1 py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 ${
                    activeTab === 'countdown' ? 'bg-card text-foreground shadow-md border border-warning/20' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Zap size={15} className="text-warning" /> CEE 2026 Timer
                </button>
              </div>

              {/* TAB 1: Live Interactive MCQ */}
              {activeTab === 'demo' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[11px] font-black uppercase tracking-wider ${currentMcq.badgeColor} ${currentMcq.badgeBg} px-3 py-1 rounded-lg border border-current/20 shadow-xs`}>
                      {currentMcq.subject}
                    </span>

                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {currentMcqPool.map((_: HeroMCQ, idx: number) => (
                          <span
                            key={`mcq-dot-${idx}`}
                            className={`w-2 h-2 rounded-full transition-all ${
                              idx === currentMcqIdx ? 'bg-primary w-4' : 'bg-muted-foreground/30'
                            }`}
                          />
                        ))}
                      </div>

                      <button
                        onClick={handleNextQuestion}
                        className="text-xs font-black text-primary flex items-center gap-1.5 hover:scale-105 active:scale-95 bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-lg transition-all border border-primary/30"
                      >
                        <RotateCcw size={13} /> Next
                      </button>
                    </div>
                  </div>

                  <p className="font-extrabold text-sm sm:text-base text-foreground leading-snug pt-1">
                    {currentMcq.question}
                  </p>

                  <div className="space-y-2.5 pt-1">
                    {currentMcq.options.map((opt) => {
                      const isSelected = selectedOption === opt.id;
                      const isCorrect = opt.id === currentMcq.correctId;
                      let btnStyle = 'border-border/80 bg-card hover:bg-muted/70 text-foreground hover:border-primary/40';
                      
                      if (selectedOption) {
                        if (isCorrect) btnStyle = 'border-success bg-success-light text-success font-black shadow-sm';
                        else if (isSelected && !isCorrect) btnStyle = 'border-error bg-error-light text-error font-black shadow-sm';
                        else btnStyle = 'border-border/40 opacity-40';
                      }

                      return (
                        <button
                          key={opt.id}
                          onClick={() => !selectedOption && setSelectedOption(opt.id)}
                          className={`w-full text-left p-3.5 rounded-2xl border text-xs sm:text-sm transition-all flex items-center justify-between shadow-xs ${btnStyle}`}
                        >
                          <span className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-lg border border-current/30 flex items-center justify-center font-black text-xs uppercase bg-muted/40">
                              {opt.id}
                            </span>
                            <span className="font-semibold">{opt.text}</span>
                          </span>
                          {selectedOption && isCorrect && <Check size={18} className="text-success" />}
                          {selectedOption && isSelected && !isCorrect && <X size={18} className="text-error" />}
                        </button>
                      );
                    })}
                  </div>

                  {selectedOption && (
                    <div className="p-3.5 bg-secondary/90 border border-primary/30 rounded-2xl text-xs space-y-1 animate-fade-in shadow-xs">
                      <p className="font-black text-primary flex items-center gap-1.5">
                        {selectedOption === currentMcq.correctId ? '✨ Correct! (+1.0 Mark)' : '❌ Incorrect (-0.25 Mark)'}
                      </p>
                      <p className="text-muted-foreground font-medium leading-relaxed">{currentMcq.explanation}</p>
                    </div>
                  )}

                  <Link href="/practice" className="btn-primary w-full justify-center text-xs sm:text-sm font-black py-3.5 mt-2 rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.01] transition-all">
                    Practice 15,000+ MCQs →
                  </Link>
                </div>
              )}

              {/* TAB 2: Countdown Timer */}
              {activeTab === 'countdown' && (
                <div className="space-y-5 animate-fade-in text-center py-2">
                  <div>
                    <span className="inline-flex items-center gap-1.5 bg-error-light text-error text-xs font-extrabold px-3 py-1 rounded-full mb-2">
                      <span className="w-2 h-2 rounded-full bg-error animate-pulse" /> Health Sciences Exam
                    </span>
                    <h3 className="font-extrabold text-foreground text-base">CEE 2026 Countdown</h3>
                  </div>

                  <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                    <CountdownUnit value={countdown.days} label="Days" />
                    <span className="text-xl font-bold text-border pb-3">:</span>
                    <CountdownUnit value={countdown.hours} label="Hrs" />
                    <span className="text-xl font-bold text-border pb-3">:</span>
                    <CountdownUnit value={countdown.minutes} label="Min" />
                    <span className="text-xl font-bold text-border pb-3">:</span>
                    <CountdownUnit value={countdown.seconds} label="Sec" />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-bio-light rounded-xl p-3 text-center border border-bio/15">
                      <p className="font-extrabold text-lg text-bio tabular-nums">92%</p>
                      <p className="text-[11px] text-muted-foreground font-medium">Avg. Accuracy Gain</p>
                    </div>
                    <div className="bg-secondary rounded-xl p-3 text-center border border-primary/15">
                      <p className="font-extrabold text-lg text-primary tabular-nums">4.9★</p>
                      <p className="text-[11px] text-muted-foreground font-medium">Student Rating</p>
                    </div>
                  </div>

                  <Link href="/sign-up-login-screen" className="btn-primary w-full justify-center text-xs sm:text-sm font-bold py-2.5">
                    Join 40,000+ Students
                  </Link>
                </div>
              )}

            </div>

            {/* Floating Chip — Battle Arena */}
            <div className="absolute -bottom-4 -left-3 sm:-left-5 bg-card/90 backdrop-blur-md border border-primary/20 rounded-xl px-4 py-2.5 shadow-lg flex items-center gap-2.5 animate-float z-20">
              <span className="w-8 h-8 rounded-lg bg-ma-light flex items-center justify-center shrink-0">
                <Zap size={16} className="text-ma animate-pulse" />
              </span>
              <div>
                <p className="text-xs font-extrabold text-foreground leading-tight">Battle Arena</p>
                <p className="text-[10px] text-muted-foreground font-medium">Real-time 2-player MCQs</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}