'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  RotateCcw,
  ArrowRight,
  Flame,
  Award,
  Zap,
  BookOpen,
  Filter
} from 'lucide-react';

interface TopicMcq {
  id: string;
  subject: string;
  chapter: string;
  question: string;
  questionNepali?: string;
  options: { key: 'a' | 'b' | 'c' | 'd'; text: string }[];
  correctAnswer: 'a' | 'b' | 'c' | 'd';
  explanation: string;
}

const SEE_MCQ_BANK: TopicMcq[] = [
  {
    id: 'mcq-sci-1',
    subject: 'science',
    chapter: 'Force & Gravitation',
    question: 'What is the value of Universal Gravitational Constant (G) in SI unit?',
    questionNepali: 'एस.आई. एकाइमा गुरुत्वाकर्षणको अचर राशि (G) को मान कति हुन्छ ?',
    options: [
      { key: 'a', text: '6.67 × 10⁻¹¹ N·m²/kg²' },
      { key: 'b', text: '9.8 m/s²' },
      { key: 'c', text: '6.67 × 10¹¹ N·m²/kg²' },
      { key: 'd', text: '3.84 × 10⁸ m' },
    ],
    correctAnswer: 'a',
    explanation: 'The value of G was determined experimentally by Henry Cavendish and is equal to 6.67 × 10⁻¹¹ N·m²/kg² everywhere in the universe.',
  },
  {
    id: 'mcq-sci-2',
    subject: 'science',
    chapter: 'Pressure',
    question: 'On which scientific principle is a hydraulic lift or hydraulic brake based?',
    questionNepali: 'हाइड्रोलिक लिफ्ट कुन वैज्ञानिक नियममा आधारित हुन्छ ?',
    options: [
      { key: 'a', text: "Archimedes' Principle" },
      { key: 'b', text: "Pascal's Law" },
      { key: 'c', text: "Newton's Law of Motion" },
      { key: 'd', text: "Boyle's Law" },
    ],
    correctAnswer: 'b',
    explanation: 'Pascal\'s law states that pressure exerted anywhere in a confined liquid is transmitted equally and undiminished in all directions. Hydraulic press and brakes utilize this principle.',
  },
  {
    id: 'mcq-sci-3',
    subject: 'science',
    chapter: 'Chemical Reactions',
    question: 'What type of chemical reaction is: 2Mg + O₂ → 2MgO?',
    questionNepali: '2Mg + O₂ → 2MgO कुन प्रकारको रासायनिक प्रतिक्रिया हो ?',
    options: [
      { key: 'a', text: 'Decomposition Reaction' },
      { key: 'b', text: 'Combination (Synthesis) Reaction' },
      { key: 'c', text: 'Single Displacement Reaction' },
      { key: 'd', text: 'Neutralization Reaction' },
    ],
    correctAnswer: 'b',
    explanation: 'Two or more simple reactants combine to form a single compound, hence it is a Combination / Synthesis reaction.',
  },
  {
    id: 'mcq-math-1',
    subject: 'math',
    chapter: 'Compound Interest',
    question: 'If principal P is compounded half-yearly at rate R% per annum for T years, what is the compound amount?',
    options: [
      { key: 'a', text: 'P [ 1 + R / 100 ]ᵀ' },
      { key: 'b', text: 'P [ 1 + R / 200 ]²ᵀ' },
      { key: 'c', text: 'P [ 1 + R / 400 ]⁴ᵀ' },
      { key: 'd', text: 'P [ 1 + 2R / 100 ]ᵀ' },
    ],
    correctAnswer: 'b',
    explanation: 'For half-yearly compounding, the annual rate R is halved (R/2) and the number of periods is doubled (2T), yielding CA = P [ 1 + R / 200 ]²ᵀ.',
  },
  {
    id: 'mcq-math-2',
    subject: 'math',
    chapter: 'Geometry (Theorems)',
    question: 'The angle formed in a semi-circle is always equal to:',
    questionNepali: 'अर्धवृत्तमा बनेको परिधिको कोण कति हुन्छ ?',
    options: [
      { key: 'a', text: '45°' },
      { key: 'b', text: '60°' },
      { key: 'c', text: '90° (Right Angle)' },
      { key: 'd', text: '180°' },
    ],
    correctAnswer: 'c',
    explanation: 'The central angle of a semicircle is a straight line measuring 180°. Since an inscribed angle is half of the central angle standing on the same arc, 180° / 2 = 90°.',
  },
  {
    id: 'mcq-opt-1',
    subject: 'opt_math',
    chapter: 'Matrices',
    question: 'For a 2x2 matrix A = [a, b; c, d], the determinant |A| is equal to:',
    options: [
      { key: 'a', text: 'ad + bc' },
      { key: 'b', text: 'ad - bc' },
      { key: 'c', text: 'ac - bd' },
      { key: 'd', text: 'a + d - b - c' },
    ],
    correctAnswer: 'b',
    explanation: 'The determinant of a second-order square matrix is the product of elements of the main diagonal minus the product of elements of the secondary diagonal: |A| = ad - bc.',
  }
];

export default function SeeTopicMcqTab() {
  const [selectedSubject, setSelectedSubject] = useState<string>('science');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<'a' | 'b' | 'c' | 'd' | null>(null);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [answeredCount, setAnsweredCount] = useState<number>(0);

  const subjectMcqs = SEE_MCQ_BANK.filter((m) => m.subject === selectedSubject);
  const currentMcq = subjectMcqs[currentIndex] || subjectMcqs[0];

  const handleSelectOption = (key: 'a' | 'b' | 'c' | 'd') => {
    if (selectedOption) return; // already answered this question
    setSelectedOption(key);
    setShowExplanation(true);
    setAnsweredCount((prev) => prev + 1);
    if (key === currentMcq.correctAnswer) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < subjectMcqs.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      // Loop or restart
      setCurrentIndex(0);
      setSelectedOption(null);
      setShowExplanation(false);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setShowExplanation(false);
    setScore(0);
    setAnsweredCount(0);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-black">
            <Zap size={14} /> INSTANT CONCEPT DRILL
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-foreground">
            SEE Topic-Wise MCQ Practice Arena
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Master high-frequency concepts with immediate answer validation, full scientific explanations, and streak tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-4 rounded-2xl bg-muted/40 border border-border text-center">
            <div className="text-xl font-black text-foreground">{score} / {answeredCount}</div>
            <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Score</div>
          </div>
          <Link
            href="/practice"
            className="px-6 py-3.5 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-all"
          >
            <span>Full Practice Bank (10,000+ MCQs)</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Subject Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border">
        {[
          { id: 'science', label: '🔬 Compulsory Science', icon: '🔬' },
          { id: 'math', label: '📐 Compulsory Math', icon: '📐' },
          { id: 'opt_math', label: '📊 Optional Math', icon: '📊' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setSelectedSubject(tab.id);
              handleReset();
            }}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all whitespace-nowrap flex items-center gap-2 ${
              selectedSubject === tab.id
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Interactive MCQ Card */}
      {currentMcq ? (
        <div className="p-6 sm:p-10 rounded-3xl bg-card border border-border shadow-lg space-y-6 max-w-3xl mx-auto">
          {/* Question Meta */}
          <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border/60 pb-3">
            <span className="px-3 py-1 rounded-full bg-muted font-bold text-foreground">
              Chapter: {currentMcq.chapter}
            </span>
            <span className="font-mono font-bold">
              Question {currentIndex + 1} of {subjectMcqs.length}
            </span>
          </div>

          {/* Question Text */}
          <div className="space-y-2">
            <h3 className="text-base sm:text-lg font-black text-foreground leading-snug">
              {currentMcq.question}
            </h3>
            {currentMcq.questionNepali && (
              <p className="text-xs sm:text-sm text-muted-foreground italic bg-muted/20 p-3 rounded-xl border border-border/40">
                {currentMcq.questionNepali}
              </p>
            )}
          </div>

          {/* Options Grid */}
          <div className="space-y-3 pt-2">
            {currentMcq.options.map((opt) => {
              const isChosen = selectedOption === opt.key;
              const isCorrect = currentMcq.correctAnswer === opt.key;
              let style = 'bg-card border-border hover:border-primary/50 text-foreground';

              if (selectedOption) {
                if (isCorrect) {
                  style = 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400 font-bold';
                } else if (isChosen && !isCorrect) {
                  style = 'bg-red-500/10 border-red-500 text-red-700 dark:text-red-400';
                } else {
                  style = 'opacity-50 border-border text-muted-foreground';
                }
              }

              return (
                <button
                  key={opt.key}
                  disabled={selectedOption !== null}
                  onClick={() => handleSelectOption(opt.key)}
                  className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${style}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-muted text-xs font-mono font-black flex items-center justify-center uppercase shrink-0">
                      {opt.key}
                    </span>
                    <span className="text-xs sm:text-sm font-medium">{opt.text}</span>
                  </div>

                  {selectedOption && isCorrect && (
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                  )}
                  {selectedOption && isChosen && !isCorrect && (
                    <XCircle size={18} className="text-red-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation Box */}
          {showExplanation && (
            <div className="p-4 sm:p-5 rounded-2xl bg-muted/30 border border-border space-y-2 animate-fadeIn">
              <div className="text-xs font-black uppercase text-primary tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} /> Solution Explanation
              </div>
              <p className="text-xs sm:text-sm text-foreground leading-relaxed">
                {currentMcq.explanation}
              </p>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw size={14} />
              <span>Restart Drill</span>
            </button>

            <button
              onClick={handleNext}
              disabled={!selectedOption}
              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-40 text-primary-foreground font-black text-xs flex items-center gap-2 shadow-md transition-all"
            >
              <span>{currentIndex === subjectMcqs.length - 1 ? 'Finish & Review' : 'Next Question'}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-muted-foreground">
          No MCQs found for this category.
        </div>
      )}
    </div>
  );
}
