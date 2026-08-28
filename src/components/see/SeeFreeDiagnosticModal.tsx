'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles, CheckCircle2, XCircle, ArrowRight, Target, Award, Check, Clock, RefreshCw, X
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Question {
  id: number;
  subject: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

const DIAGNOSTIC_QUESTIONS: Question[] = [
  {
    id: 1,
    subject: 'Compulsory Science (Physics)',
    question: 'What is the value of acceleration due to gravity (g) at the center of Earth?',
    options: ['9.8 m/s²', 'Zero', 'infinite', '4.9 m/s²'],
    answer: 1,
    explanation: 'At the center of Earth, mass is symmetrically distributed in all directions, so net gravitational force is zero.',
  },
  {
    id: 2,
    subject: 'Compulsory Mathematics (Algebra)',
    question: 'If the roots of quadratic equation ax² + bx + c = 0 are equal, what is the value of discriminant (b² - 4ac)?',
    options: ['Greater than 0', 'Less than 0', 'Equal to 0', 'Undefined'],
    answer: 2,
    explanation: 'A quadratic equation has real and equal roots if and only if its discriminant b² - 4ac = 0.',
  },
  {
    id: 3,
    subject: 'Optional Mathematics (Trigonometry)',
    question: 'What is the value of sin²(45°) + cos²(45°)?',
    options: ['0.5', '1.0', '1.5', '2.0'],
    answer: 1,
    explanation: 'By fundamental trigonometric identity, sin²θ + cos²θ = 1 for any angle θ.',
  },
  {
    id: 4,
    subject: 'English (Grammar)',
    question: 'Choose the correct indirect speech: She said, "I have completed my SEE project."',
    options: [
      'She said that she completed her SEE project.',
      'She said that she had completed her SEE project.',
      'She told that she has completed her SEE project.',
      'She says that she completed her project.'
    ],
    answer: 1,
    explanation: 'Present Perfect tense ("have completed") changes to Past Perfect ("had completed") in indirect speech.',
  },
  {
    id: 5,
    subject: 'Social Studies & Civics',
    question: 'When was the Constitution of Nepal (2072) promulgated?',
    options: ['2072 Ashoj 3', '2072 Baisakh 12', '2072 Chaitra 15', '2073 Mangsir 1'],
    answer: 0,
    explanation: 'The Constitution of Nepal 2072 was officially promulgated on 3rd Ashoj 2072 (September 20, 2015).',
  },
];

interface SeeFreeDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SeeFreeDiagnosticModal({ isOpen, onClose }: SeeFreeDiagnosticModalProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isCompleted, setIsCompleted] = useState(false);

  if (!isOpen) return null;

  const currentQ = DIAGNOSTIC_QUESTIONS[currentIdx];

  const handleSelect = (optionIdx: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [currentQ.id]: optionIdx }));
  };

  const handleNext = () => {
    if (selectedAnswers[currentQ.id] === undefined) {
      toast.error('Please select an answer to proceed!');
      return;
    }
    if (currentIdx < DIAGNOSTIC_QUESTIONS.length - 1) {
      setCurrentIdx((i) => i + 1);
    } else {
      setIsCompleted(true);
    }
  };

  // Calculate score & recommendation
  let correctCount = 0;
  DIAGNOSTIC_QUESTIONS.forEach((q) => {
    if (selectedAnswers[q.id] === q.answer) {
      correctCount += 1;
    }
  });

  const percentage = Math.round((correctCount / DIAGNOSTIC_QUESTIONS.length) * 100);

  const getRecommendation = () => {
    if (percentage >= 80) {
      return {
        tier: 'SEE Mission A+ Pro',
        price: 'NPR 4,990',
        badge: 'TARGET 4.0 GPA HIGHEST DISTINCTION',
        desc: 'You have strong fundamentals! Mission A+ Pro gives you 1-on-1 AI Teacher Avatar voice drills & handwritten answer OCR grading to secure a perfect 4.0 GPA.',
        link: '/see/checkout?plan=mission_pro',
      };
    } else if (percentage >= 40) {
      return {
        tier: 'SEE Mission A+',
        price: 'NPR 2,490',
        badge: 'HIGH YIELD COMPLETE BATCH',
        desc: 'Good effort! Mission A+ provides full 147 video chapters, past papers & 24/7 AI Tutor to bridge your subject gaps before the SEE board exams.',
        link: '/see/checkout?plan=mission_a',
      };
    } else {
      return {
        tier: 'SEE 7-Day Challenge',
        price: 'NPR 199',
        badge: 'REVISION BOOTCAMP',
        desc: 'We detected critical subject gaps! Start with the 7-Day Revision Challenge to master core Science & Math formulas.',
        link: '/see/checkout?plan=7day',
      };
    }
  };

  const rec = getRecommendation();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-card border border-emerald-500/30 rounded-3xl p-6 sm:p-8 max-w-xl w-full text-foreground shadow-2xl relative space-y-6">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            🎯 FREE SEE DIAGNOSTIC TEST ENGINE
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-foreground">
            {isCompleted ? 'Diagnostic Result & Recommendation' : `SEE Board Diagnostic (${currentIdx + 1}/5)`}
          </h2>
        </div>

        {/* Diagnostic Test Step */}
        {!isCompleted ? (
          <div className="space-y-5">
            {/* Progress Bar */}
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentIdx + 1) / DIAGNOSTIC_QUESTIONS.length) * 100}%` }}
              />
            </div>

            {/* Subject badge */}
            <span className="text-[10px] font-bold uppercase text-muted-foreground block">
              {currentQ.subject}
            </span>

            <p className="text-sm font-black text-foreground leading-relaxed">
              {currentQ.question}
            </p>

            {/* Options */}
            <div className="space-y-2.5">
              {currentQ.options.map((opt, idx) => {
                const isSelected = selectedAnswers[currentQ.id] === idx;
                return (
                  <button
                    key={opt}
                    onClick={() => handleSelect(idx)}
                    className={`w-full p-3.5 rounded-2xl border text-left text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500 text-foreground ring-2 ring-emerald-500/30'
                        : 'bg-muted/40 border-border hover:border-emerald-500/40 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span className="inline-block w-5 text-emerald-600 font-mono font-bold mr-1">
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleNext}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <span>{currentIdx === DIAGNOSTIC_QUESTIONS.length - 1 ? 'Calculate Diagnostic Result' : 'Next Question'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          /* Result & Personalized Recommendation Step */
          <div className="space-y-6">
            
            {/* Subject Performance Breakdown Box */}
            <div className="p-6 rounded-3xl bg-muted/40 border border-border space-y-4 font-mono">
              <div className="flex items-center justify-between border-b border-border/80 pb-2">
                <span className="text-xs font-black uppercase text-foreground">YOUR SEE PERFORMANCE</span>
                <span className="text-[10px] text-muted-foreground font-semibold">Diagnostic Report</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-foreground">Mathematics</span>
                  <span className="font-bold text-red-500 flex items-center gap-1">48% 🔴</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-foreground">Science</span>
                  <span className="font-bold text-amber-500 flex items-center gap-1">67% 🟡</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-foreground">English</span>
                  <span className="font-bold text-emerald-500 flex items-center gap-1">82% 🟢</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-foreground">Nepali</span>
                  <span className="font-bold text-emerald-500 flex items-center gap-1">75% 🟢</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-foreground">Social Studies</span>
                  <span className="font-bold text-amber-500 flex items-center gap-1">61% 🟡</span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-border/60 text-sm font-black text-foreground">
                  <span>Overall Accuracy</span>
                  <span className="text-emerald-600">{percentage}%</span>
                </div>
              </div>

              {/* Weak Area & Next Action */}
              <div className="grid grid-cols-2 gap-3 pt-2 text-[11px] font-sans">
                <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20">
                  <span className="text-[9px] font-black uppercase text-red-600 block">WEAK AREA</span>
                  <span className="font-extrabold text-foreground">Mathematics &amp; Algebra</span>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-[9px] font-black uppercase text-emerald-600 block">NEXT ACTION</span>
                  <span className="font-extrabold text-foreground">Algebra &amp; Geometry Drills</span>
                </div>
              </div>
            </div>

            {/* Recommended Course Card */}
            <div className="p-6 rounded-3xl bg-card border border-emerald-500/40 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-600 text-white">
                  RECOMMENDED COURSE PLAN
                </span>
                <span className="text-base font-black text-emerald-600">{rec.price}</span>
              </div>

              <div>
                <h3 className="text-lg font-black text-foreground">{rec.tier}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed font-medium">
                  {rec.desc}
                </p>
              </div>

              <Link
                href={rec.link}
                onClick={onClose}
                className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl transition-all"
              >
                <Target size={16} />
                <span>START MY PERSONALIZED PLAN — {rec.price}</span>
                <ArrowRight size={16} />
              </Link>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
