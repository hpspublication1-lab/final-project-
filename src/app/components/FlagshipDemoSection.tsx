'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Stethoscope, GraduationCap, CheckCircle2, XCircle, RotateCcw, ArrowRight, Sparkles, BookOpen, Clock } from 'lucide-react';

const CEE_QUESTIONS = [
  {
    subject: 'Botany · Photosynthesis & C4 Pathway',
    badge: 'MEC ENTRANCE 2025 PATTERN',
    question: 'Which enzyme is responsible for primary CO₂ fixation in C₄ plants during photosynthesis?',
    options: [
      { id: 'a', text: 'RuBisCO' },
      { id: 'b', text: 'PEP carboxylase (PEPcase)' },
      { id: 'c', text: 'ATP synthase' },
      { id: 'd', text: 'Carbonic anhydrase' },
    ],
    correctId: 'b',
    explanation: 'PEP carboxylase fixes CO₂ in the mesophyll cells of C₄ plants into oxaloacetate (4-carbon acid). It has a very high affinity for CO₂ and does not bind O₂, avoiding wasteful photorespiration.',
  },
  {
    subject: 'Physics · Mechanics & Energy',
    badge: 'MEC ENTRANCE HIGH-YIELD',
    question: 'If the velocity of a moving body is doubled, its kinetic energy becomes:',
    options: [
      { id: 'a', text: 'Doubled (2×)' },
      { id: 'b', text: 'Quadrupled (4×)' },
      { id: 'c', text: 'Halved (½×)' },
      { id: 'd', text: 'Unchanged' },
    ],
    correctId: 'b',
    explanation: 'Kinetic Energy KE = ½ mv². Since KE is directly proportional to the square of velocity (v²), doubling velocity multiplies KE by (2)² = 4 times.',
  },
];

const SEE_QUESTIONS = [
  {
    subject: 'Science · Physics (Force & Gravitation)',
    badge: 'NEB BOARD 4-MARK QUESTION',
    question: 'State Newton\'s Universal Law of Gravitation. Prove that the gravitational force between two bodies quadruples when the distance between their centers is halved. [1 + 3 = 4 Marks]',
    rubrics: [
      { mark: '1 Mark', label: 'Definition', desc: 'Accurate statement: Gravitational force is directly proportional to product of masses and inversely proportional to square of distance.' },
      { mark: '1 Mark', label: 'Formula', desc: 'F = G(m₁·m₂)/d² where G is gravitational constant.' },
      { mark: '2 Marks', label: 'Derivation', desc: 'When new distance d\' = d/2, then F\' = G(m₁·m₂)/(d/2)² = G(m₁·m₂)/(d²/4) = 4·[G(m₁·m₂)/d²] = 4F.' },
    ],
    tips: 'Board Examiner Note: Always write the unit of G (N·m²/kg²) and state that force quadruples in a clear final concluding sentence.',
  },
];

export default function FlagshipDemoSection() {
  const [activeTab, setActiveTab] = useState<'cee' | 'see'>('cee');
  const [ceeIdx, setCeeIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const currentCee = CEE_QUESTIONS[ceeIdx % CEE_QUESTIONS.length];
  const currentSee = SEE_QUESTIONS[0];

  const handleSelectOption = (id: string) => {
    if (selectedOption) return;
    setSelectedOption(id);
  };

  const handleNextCee = () => {
    setSelectedOption(null);
    setCeeIdx((prev) => (prev + 1) % CEE_QUESTIONS.length);
  };

  return (
    <section className="py-20 bg-background border-t border-border/60 relative overflow-hidden">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-wider">
            <Sparkles size={14} />
            <span>Interactive Demo</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Experience How Samyak Prepares You
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            Test a real exam question below and see how our platform breaks down concepts, negative marking, and board rubrics.
          </p>

          {/* Program Toggle */}
          <div className="inline-flex p-1.5 bg-muted/60 border border-border/80 rounded-2xl gap-2 mt-4">
            <button
              onClick={() => { setActiveTab('cee'); setSelectedOption(null); }}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'cee'
                  ? 'bg-card text-primary shadow-sm border border-border/80'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Stethoscope size={15} />
              <span>🩺 CEE Medical MCQ Demo</span>
            </button>
            <button
              onClick={() => setActiveTab('see')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'see'
                  ? 'bg-card text-emerald-600 shadow-sm border border-border/80'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <GraduationCap size={15} />
              <span>🎓 SEE Class 10 Model Question Demo</span>
            </button>
          </div>
        </div>

        {/* Demo Content Container */}
        <div className="max-w-3xl mx-auto">
          {activeTab === 'cee' ? (
            <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-border/60">
                <span className="text-xs font-bold px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                  {currentCee.subject}
                </span>
                <span className="text-[10px] font-mono font-bold text-muted-foreground">
                  {currentCee.badge}
                </span>
              </div>

              <p className="text-base sm:text-lg font-bold text-foreground leading-relaxed">
                {currentCee.question}
              </p>

              {/* Options */}
              <div className="space-y-3">
                {currentCee.options.map((opt) => {
                  let style = 'bg-muted/30 border-border/80 hover:bg-muted/70 text-foreground';
                  let icon = null;

                  if (selectedOption) {
                    if (opt.id === currentCee.correctId) {
                      style = 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold';
                      icon = <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />;
                    } else if (opt.id === selectedOption) {
                      style = 'bg-rose-500/10 border-rose-500 text-rose-700 dark:text-rose-300 font-bold';
                      icon = <XCircle size={16} className="text-rose-500 shrink-0" />;
                    } else {
                      style = 'bg-muted/20 border-border/40 text-muted-foreground opacity-60';
                    }
                  }

                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectOption(opt.id)}
                      disabled={!!selectedOption}
                      className={`w-full p-3.5 sm:p-4 rounded-2xl border text-left text-sm transition-all flex items-center justify-between gap-3 ${style}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-xl bg-card border border-border/80 flex items-center justify-center text-xs font-bold font-mono">
                          {opt.id.toUpperCase()}
                        </span>
                        <span>{opt.text}</span>
                      </div>
                      {icon}
                    </button>
                  );
                })}
              </div>

              {/* Feedback and Explanation */}
              {selectedOption && (
                <div className="pt-4 border-t border-border/60 space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-black uppercase px-2.5 py-1 rounded-lg ${
                      selectedOption === currentCee.correctId
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : 'bg-rose-500/10 text-rose-600'
                    }`}>
                      {selectedOption === currentCee.correctId
                        ? '+1.0 Mark · Correct!'
                        : '-0.25 Mark · Negative Marking Applied'}
                    </span>

                    <button
                      onClick={handleNextCee}
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <span>Try Next Question</span>
                      <RotateCcw size={12} />
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 text-xs text-muted-foreground leading-relaxed">
                    <span className="font-bold text-foreground block mb-1">MEC Rationale:</span>
                    {currentCee.explanation}
                  </div>

                  <div className="flex justify-end pt-2">
                    <Link
                      href="/cee-medical-entrance"
                      className="btn-primary text-xs py-2.5 px-5 rounded-xl font-bold flex items-center gap-2"
                    >
                      <span>Practice 15,000+ CEE Questions</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-border/60">
                <span className="text-xs font-bold px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  {currentSee.subject}
                </span>
                <span className="text-[10px] font-mono font-bold text-muted-foreground">
                  {currentSee.badge}
                </span>
              </div>

              <p className="text-base sm:text-lg font-bold text-foreground leading-relaxed">
                {currentSee.question}
              </p>

              {/* Rubric Breakdown */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  Official Examiner Marking Rubric:
                </span>
                {currentSee.rubrics.map((rubric, rIdx) => (
                  <div
                    key={`rubric-${rIdx}`}
                    className="p-3.5 rounded-2xl bg-muted/30 border border-border/60 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">{rubric.label}</span>
                      <span className="font-mono font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded text-[11px]">
                        {rubric.mark}
                      </span>
                    </div>
                    <p className="text-muted-foreground">{rubric.desc}</p>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                <span className="font-bold block mb-1">💡 4.0 GPA Strategy:</span>
                {currentSee.tips}
              </div>

              <div className="flex justify-end pt-2">
                <Link
                  href="/see"
                  className="btn-primary bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-2.5 px-5 rounded-xl font-bold flex items-center gap-2"
                >
                  <span>Explore SEE Class 10 Question Bank</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
