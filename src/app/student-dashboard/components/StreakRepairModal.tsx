'use client';

import React, { useState } from 'react';
import { Flame, X, ArrowRight, Zap, Loader2, Award, CheckCircle2 } from 'lucide-react';

interface StreakRepairModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStreak: number;
  onConfirmRepair: () => Promise<void>;
  isRepairing: boolean;
}

const STREAK_REPAIR_QUESTIONS = [
  {
    id: 'srq-1',
    subject: 'Physics',
    question: 'Which of the following physical quantities has the dimensional formula [M L^2 T^-2]?',
    options: ['Force and Momentum', 'Work and Kinetic Energy', 'Power and Pressure', 'Impulse and Surface Tension'],
    correctIndex: 1,
    explanation: 'Work and Kinetic Energy both have the dimension of energy = Force × Displacement = [M L T^-2] × [L] = [M L^2 T^-2].',
  },
  {
    id: 'srq-2',
    subject: 'Biology',
    question: 'Which organelle is semi-autonomous, has its own 70S ribosomes and circular DNA, and generates cellular ATP?',
    options: ['Golgi Complex', 'Lysosome', 'Mitochondria', 'Endoplasmic Reticulum'],
    correctIndex: 2,
    explanation: 'Mitochondria are double-membrane semi-autonomous organelles containing 70S ribosomes and circular DNA that drive oxidative phosphorylation.',
  },
  {
    id: 'srq-3',
    subject: 'Chemistry',
    question: 'According to Le Chatelier’s principle, an exothermic reaction is favoured by which temperature condition?',
    options: ['High Temperature', 'Low Temperature', 'Extreme Pressure only', 'Presence of Inhibitor'],
    correctIndex: 1,
    explanation: 'For an exothermic reaction (ΔH < 0), lowering temperature shifts the equilibrium in the forward direction according to Le Chatelier’s principle.',
  },
];

export default function StreakRepairModal({
  isOpen,
  onClose,
  currentStreak,
  onConfirmRepair,
  isRepairing,
}: StreakRepairModalProps) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  if (!isOpen) return null;

  const currentQ = STREAK_REPAIR_QUESTIONS[questionIndex];

  const handleNext = () => {
    if (selectedOption === null) return;
    if (selectedOption === currentQ.correctIndex) {
      setScore((s) => s + 1);
    }

    if (questionIndex + 1 < STREAK_REPAIR_QUESTIONS.length) {
      setQuestionIndex((i) => i + 1);
      setSelectedOption(null);
    } else {
      setIsCompleted(true);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset state after close
    setTimeout(() => {
      setQuestionIndex(0);
      setSelectedOption(null);
      setScore(0);
      setIsCompleted(false);
    }, 200);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="1-Click Streak Repair Drill"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div className="bg-card border border-border w-full max-w-lg rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
              <Flame size={18} className="fill-amber-500/30" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-black text-foreground">
                1-Click Streak Repair Drill
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Answer 3 rapid-fire revision questions to restore broken momentum
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {!isCompleted ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-primary">
                Question {questionIndex + 1} of {STREAK_REPAIR_QUESTIONS.length}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-muted text-[11px] font-semibold text-muted-foreground">
                Subject: {currentQ.subject}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-muted/30 border border-border/70 space-y-2">
              <p className="text-xs sm:text-sm font-bold text-foreground leading-relaxed">
                {currentQ.question}
              </p>
            </div>

            <div className="space-y-2">
              {currentQ.options.map((opt, optIdx) => {
                const isSelected = selectedOption === optIdx;
                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => setSelectedOption(optIdx)}
                    className={`w-full p-3 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-primary/10 border-primary text-primary font-bold shadow-xs'
                        : 'bg-card border-border/70 hover:bg-muted/40 text-foreground'
                    }`}
                  >
                    <span>{opt}</span>
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-border/60 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={selectedOption === null}
                onClick={handleNext}
                className="btn-primary text-xs font-bold py-2 px-5 rounded-xl flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <span>
                  {questionIndex + 1 < STREAK_REPAIR_QUESTIONS.length
                    ? 'Next Question'
                    : 'Review & Repair'}
                </span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-center py-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 size={28} />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-black text-foreground">
                Drill Completed • {score} / {STREAK_REPAIR_QUESTIONS.length} Correct
              </h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Excellent focus! Confirm below to restore your continuous study streak and claim your +50 XP momentum bonus.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center justify-center gap-1.5">
              <Zap size={14} className="text-amber-500" />
              <span>Streak will be restored to {Math.max((currentStreak || 0) + 1, 7)} Days + 50 XP</span>
            </div>

            <div className="pt-2 border-t border-border/60 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRepairing}
                onClick={onConfirmRepair}
                className="btn-primary text-xs font-bold py-2 px-5 rounded-xl flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isRepairing ? <Loader2 size={14} className="animate-spin" /> : null}
                <span>Claim Restored Streak (+50 XP)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
