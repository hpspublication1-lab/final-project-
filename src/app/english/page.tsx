'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PublicNav from '@/components/PublicNav';
import { useProgram } from '@/contexts/ProgramContext';
import { Languages, Mic, Award, Sparkles, BookOpen, CheckCircle, ArrowRight, Play, Volume2, Star, Trophy, MessageSquare } from 'lucide-react';

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
                  href="/courses?sector=english"
                  onClick={() => setProgram('english')}
                  className="px-6 py-3.5 rounded-2xl bg-amber-600 text-white font-extrabold text-sm flex items-center gap-2 shadow-lg shadow-amber-600/20 hover:bg-amber-700 transition-all"
                >
                  <span>Explore English Courses</span>
                  <ArrowRight size={16} />
                </Link>
                <a
                  href="#ai-speaking-demo"
                  className="px-6 py-3.5 rounded-2xl bg-card border border-border font-bold text-sm flex items-center gap-2 hover:bg-muted transition-colors"
                >
                  <Mic size={16} className="text-amber-600" />
                  <span>Try Live AI Speaking Practice</span>
                </a>
              </div>
            </div>

            {/* Right Card / Interactive AI Simulator */}
            <div className="lg:col-span-5">
              <div id="ai-speaking-demo" className="bg-card border border-border rounded-3xl p-6 shadow-xl relative overflow-hidden space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                      <Mic size={16} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">AI Speaking Examiner</h3>
                      <p className="text-[10px] text-muted-foreground">Real-time fluency &amp; accent analyzer</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-success/10 text-success">LIVE SIMULATOR</span>
                </div>

                <div className="p-4 rounded-2xl bg-muted/50 border border-border/60 text-xs font-medium text-foreground">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Prompt Sentence to Speak:</p>
                  <p className="italic font-serif text-sm text-amber-600">&ldquo;Continuous practice and exposure are key to achieving English fluency.&rdquo;</p>
                </div>

                <button
                  onClick={handleSimulatePractice}
                  disabled={isRecording}
                  className={`w-full py-3.5 rounded-xl font-extrabold text-xs text-white flex items-center justify-center gap-2 transition-all ${
                    isRecording ? 'bg-error animate-pulse' : 'bg-amber-600 hover:bg-amber-700 shadow-md shadow-amber-600/20'
                  }`}
                >
                  <Mic size={16} />
                  <span>{isRecording ? 'Analyzing Voice Intonation...' : 'Record Voice & Get Instant AI Score'}</span>
                </button>

                {aiFeedback && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs font-medium text-amber-950 dark:text-amber-200 animate-fadeIn">
                    {aiFeedback}
                  </div>
                )}
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

        {/* Tab Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm hover:border-amber-500/40 transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-xl">
              🗣️
            </div>
            <h3 className="text-lg font-bold text-foreground">Live Conversation Rooms</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Practice 1-on-1 and group speaking topics with fellow learners and native mentors every evening.
            </p>
            <ul className="space-y-2 text-xs font-medium text-foreground pt-2">
              <li className="flex items-center gap-2"><CheckCircle size={14} className="text-amber-600" /> Daily Topic Prompts</li>
              <li className="flex items-center gap-2"><CheckCircle size={14} className="text-amber-600" /> Job Interview Preparation</li>
              <li className="flex items-center gap-2"><CheckCircle size={14} className="text-amber-600" /> Public Speaking Drills</li>
            </ul>
          </div>

          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm hover:border-amber-500/40 transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-xl">
              🎓
            </div>
            <h3 className="text-lg font-bold text-foreground">IELTS Band 8.0 Strategy</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Master Writing Task 1 &amp; 2 structures, Academic Reading speed skimming, and Listening keywords.
            </p>
            <ul className="space-y-2 text-xs font-medium text-foreground pt-2">
              <li className="flex items-center gap-2"><CheckCircle size={14} className="text-amber-600" /> Full Mock Tests with Band Score</li>
              <li className="flex items-center gap-2"><CheckCircle size={14} className="text-amber-600" /> Essay Correction by Mentors</li>
              <li className="flex items-center gap-2"><CheckCircle size={14} className="text-amber-600" /> 500 High-Frequency Academic Words</li>
            </ul>
          </div>

          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm hover:border-amber-500/40 transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-xl">
              🤖
            </div>
            <h3 className="text-lg font-bold text-foreground">AI Grammar &amp; Speech Feedback</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Get instant sentence corrections, vocabulary upgrades, and voice pitch analysis powered by AI.
            </p>
            <ul className="space-y-2 text-xs font-medium text-foreground pt-2">
              <li className="flex items-center gap-2"><CheckCircle size={14} className="text-amber-600" /> Instant Error Explanations</li>
              <li className="flex items-center gap-2"><CheckCircle size={14} className="text-amber-600" /> CEFR Level Assessment (A1-C2)</li>
              <li className="flex items-center gap-2"><CheckCircle size={14} className="text-amber-600" /> Certificate of Proficiency</li>
            </ul>
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
