'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PublicNav from '@/components/PublicNav';
import {
  BookOpen, Award, Sparkles, CheckCircle2, FileText, ArrowRight,
  RefreshCw, Check, X, HelpCircle, Download, ExternalLink, Code
} from 'lucide-react';
import toast from 'react-hot-toast';
import { CambridgeReadingPassage } from '@/app/api/english/cambridge/reading/route';

const CAMBRIDGE_BOOKS = [
  { vol: '19', year: '2024', type: 'Academic & General', status: 'Official Test Bank' },
  { vol: '18', year: '2023', type: 'Academic & General', status: 'High-Yield Bank' },
  { vol: '17', year: '2022', type: 'Academic & General', status: 'High-Yield Bank' },
  { vol: '16', year: '2021', type: 'Academic & General', status: 'Core Vault' },
  { vol: '15', year: '2020', type: 'Academic & General', status: 'Core Vault' },
  { vol: '14', year: '2019', type: 'Academic & General', status: 'Core Vault' },
];

const CAMBRIDGE_WRITING_TASK1 = [
  {
    title: '📊 Global IT Freelancing & Remote Work Growth (2015 - 2025)',
    type: 'Line Graph & Data Comparison',
    prompt: 'The chart below shows the growth of remote software engineering positions across North America, Europe, and Asia-Pacific between 2015 and 2025.',
    band9Model: 'The line graph illustrates the proportion of remote software engineering roles across three global regions over a ten-year period from 2015 to 2025. Overall, it is evident that remote IT employment experienced a dramatic upward trajectory in all regions, with Asia-Pacific exhibiting the most significant relative growth.',
  },
  {
    title: '⚙️ Automated Software Deployment Pipeline (CI/CD)',
    type: 'Process Diagram',
    prompt: 'The diagram illustrates the sequential stages involved in an automated continuous integration and deployment (CI/CD) software engineering pipeline.',
    band9Model: 'The flow chart delineates the multi-stage process through which computer source code transitions from initial commit to production deployment. Overall, the system relies on automated validation gates, encompassing compilation, unit testing, and artifact deployment.',
  },
];

export default function CambridgeStudyVaultPage() {
  const [isDark, setIsDark] = useState(false);
  const [activeTab, setActiveTab] = useState<'reading' | 'writing' | 'vault'>('reading');

  // Reading Passage State
  const [passage, setPassage] = useState<CambridgeReadingPassage | null>(null);
  const [loadingPassage, setLoadingPassage] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [submittedAnswers, setSubmittedAnswers] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement?.classList?.add('dark');
    } else {
      document.documentElement?.classList?.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    fetchReadingPassage();
  }, []);

  const fetchReadingPassage = async () => {
    setLoadingPassage(true);
    setSubmittedAnswers(false);
    setUserAnswers({});
    try {
      const res = await fetch('/api/english/cambridge/reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: 'Artificial Intelligence & Software Engineering History' }),
      });
      const data = await res.json();
      setPassage(data);
    } catch {
      toast.error('Failed to load Cambridge passage.');
    } font: null;
    setLoadingPassage(false);
  };

  const handleSelectAnswer = (qId: number, ans: string) => {
    setUserAnswers((prev) => ({ ...prev, [qId]: ans }));
  };

  const calculateScore = () => {
    if (!passage) return 0;
    let correct = 0;
    passage.questions.forEach((q) => {
      if (userAnswers[q.id] === q.correctAnswer) correct++;
    });
    return correct;
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <PublicNav isDark={isDark} onToggleDark={() => setIsDark(!isDark)} />

      {/* Hero Banner */}
      <section className="pt-28 pb-10 bg-gradient-to-b from-violet-500/10 via-card to-background border-b border-border">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/10 text-violet-600 text-xs font-bold border border-violet-500/20 mb-3">
                <BookOpen size={14} /> Cambridge IELTS Books 1–19 Official Material Vault
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight flex items-center gap-3">
                Cambridge Level Study Vault
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-600 font-extrabold">BAND 9.0 BENCHMARK</span>
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2 max-w-2xl">
                Authentic Cambridge Academic Reading passages, True/False/Not Given solvers, Cambridge Band 9 Examiner Model Essays, and official IT/Tech essay topic repositories.
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 bg-card p-1.5 border border-border rounded-2xl shadow-sm shrink-0">
              <button
                onClick={() => setActiveTab('reading')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'reading' ? 'bg-violet-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                📖 Academic Reading
              </button>
              <button
                onClick={() => setActiveTab('writing')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'writing' ? 'bg-violet-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                ✍️ Task 1 &amp; 2 Band 9 Essays
              </button>
              <button
                onClick={() => setActiveTab('vault')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'vault' ? 'bg-violet-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                📚 Books 1-19 Vault
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Workspace */}
      <section className="py-8 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 space-y-8">

        {activeTab === 'reading' ? (
          /* CAMBRIDGE ACADEMIC READING SOLVER */
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Left Passage Box */}
            <div className="lg:col-span-7 bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <span className="text-xs font-extrabold uppercase text-violet-600 tracking-wider">
                  {passage?.bookReference || 'Cambridge Academic Reading'}
                </span>
                <button
                  onClick={fetchReadingPassage}
                  disabled={loadingPassage}
                  className="p-2 rounded-xl bg-card border border-border hover:border-violet-500/40 text-muted-foreground hover:text-foreground transition-all"
                  title="Generate New Cambridge Passage"
                >
                  <RefreshCw size={14} className={loadingPassage ? 'animate-spin' : ''} />
                </button>
              </div>

              {loadingPassage ? (
                <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
                  <RefreshCw size={28} className="animate-spin text-violet-600" />
                  <p className="text-xs text-muted-foreground font-semibold">Loading authentic Cambridge C1/C2 Academic Reading Passage...</p>
                </div>
              ) : passage ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-black text-foreground">{passage.title}</h3>
                  <div className="p-5 rounded-2xl bg-muted/40 border border-border/80 text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-line font-serif">
                    {passage.passageText}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Right Question Solver Box */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <h3 className="text-sm font-bold text-foreground">Questions 1–{passage?.questions.length || 4}</h3>
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-600">
                    True / False / Not Given
                  </span>
                </div>

                {passage?.questions.map((q) => {
                  const isCorrect = userAnswers[q.id] === q.correctAnswer;
                  return (
                    <div key={q.id} className="p-4 rounded-2xl bg-muted/40 border border-border/80 space-y-3">
                      <p className="text-xs font-semibold text-foreground">
                        <span className="font-bold text-violet-600 mr-1.5">Q{q.id}.</span>
                        {q.questionText}
                      </p>

                      <div className="grid grid-cols-3 gap-2">
                        {['TRUE', 'FALSE', 'NOT GIVEN'].map((opt) => {
                          const isSelected = userAnswers[q.id] === opt;
                          return (
                            <button
                              key={opt}
                              onClick={() => handleSelectAnswer(q.id, opt)}
                              className={`py-2 rounded-xl text-[11px] font-bold transition-all border ${
                                isSelected
                                  ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                                  : 'bg-card border-border text-muted-foreground hover:border-violet-500/40'
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      {submittedAnswers && (
                        <div className={`p-3 rounded-xl text-xs space-y-1 animate-fadeIn ${
                          isCorrect ? 'bg-success/10 text-success border border-success/20' : 'bg-error/10 text-error border border-error/20'
                        }`}>
                          <div className="flex items-center justify-between font-bold">
                            <span>{isCorrect ? '✓ Correct Answer' : `✗ Incorrect (Correct: ${q.correctAnswer})`}</span>
                          </div>
                          <p className="text-[11px] opacity-90 leading-normal">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}

                <button
                  onClick={() => setSubmittedAnswers(true)}
                  disabled={submittedAnswers || Object.keys(userAnswers).length === 0}
                  className="w-full py-4 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-violet-600/25 transition-all disabled:opacity-50"
                >
                  <CheckCircle2 size={18} />
                  <span>Submit Answers &amp; View Cambridge Explanations</span>
                </button>

                {submittedAnswers && (
                  <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-center animate-fadeIn space-y-1">
                    <p className="text-xl font-black text-violet-600">
                      Score: {calculateScore()} / {passage?.questions.length} Correct
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {calculateScore() === passage?.questions.length
                        ? '🌟 Band 9.0 Reading Performance!'
                        : '💡 Review the paragraph references above to master True/False/Not Given logic.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : activeTab === 'writing' ? (
          /* CAMBRIDGE WRITING TASK 1 & 2 EXAMINER MODEL ESSAYS */
          <div className="space-y-6">
            <h2 className="text-xl font-black text-foreground flex items-center gap-2">
              <Sparkles size={22} className="text-violet-600" />
              Cambridge Band 9 Examiner Model Essays (IT &amp; Technical Topics)
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {CAMBRIDGE_WRITING_TASK1.map((item, idx) => (
                <div key={idx} className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <span className="text-xs font-bold text-violet-600 uppercase tracking-wider">{item.type}</span>
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-600">BAND 9.0 MODEL</span>
                  </div>

                  <h3 className="text-sm font-bold text-foreground">{item.title}</h3>
                  <p className="text-xs text-muted-foreground italic bg-muted/40 p-3 rounded-xl border border-border">
                    &ldquo;{item.prompt}&rdquo;
                  </p>

                  <div className="space-y-2 pt-2">
                    <p className="text-[11px] font-extrabold uppercase text-muted-foreground">Cambridge Examiner Model Overview:</p>
                    <p className="text-xs font-serif text-foreground leading-relaxed bg-violet-500/5 p-4 rounded-2xl border border-violet-500/20">
                      {item.band9Model}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* CAMBRIDGE BOOKS 1-19 VAULT INDEX */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-foreground">Official Cambridge IELTS Books 1–19 Repository</h2>
              <span className="text-xs text-muted-foreground font-semibold">Academic &amp; General Modules</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {CAMBRIDGE_BOOKS.map((b) => (
                <div key={b.vol} className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3 hover:border-violet-500/40 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-violet-600">Book Volume {b.vol}</span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-muted text-muted-foreground">{b.year}</span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-foreground">Cambridge IELTS {b.vol}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{b.type} Practice Tests</p>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-success">{b.status}</span>
                    <button
                      onClick={() => {
                        setActiveTab('reading');
                        fetchReadingPassage();
                      }}
                      className="text-xs font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1"
                    >
                      <span>Practice Now</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
