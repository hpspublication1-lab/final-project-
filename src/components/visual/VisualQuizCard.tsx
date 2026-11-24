'use client';

import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, ArrowRight } from 'lucide-react';

export interface PracticeQuestion {
  id: string;
  prompt: string;
  choices: { id: string; text: string }[];
  correctAnswer: string;
  explanation: string;
  linkedHotspotId?: string;
}

interface VisualQuizCardProps {
  questions: PracticeQuestion[];
  onAnswerQuestion: (questionId: string, answerId: string, isCorrect: boolean) => void;
  onSelectHotspotById?: (hotspotId: string) => void;
}

export default function VisualQuizCard({
  questions,
  onAnswerQuestion,
  onSelectHotspotById,
}: VisualQuizCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const currentQ = questions[currentIndex];
  if (!currentQ) return null;

  const handleSelectOption = (optId: string) => {
    if (isSubmitted) return;
    setSelectedOption(optId);
  };

  const handleSubmit = () => {
    if (!selectedOption || isSubmitted) return;
    const isCorrect = selectedOption.toLowerCase() === currentQ.correctAnswer.toLowerCase();
    setIsSubmitted(true);
    onAnswerQuestion(currentQ.id, selectedOption, isCorrect);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setIsSubmitted(false);
    }
  };

  const isCorrect = selectedOption?.toLowerCase() === currentQ.correctAnswer.toLowerCase();

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl text-slate-100 flex flex-col justify-between h-full">
      {/* Question Header */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            CEE Visual MCQ {currentIndex + 1} of {questions.length}
          </span>
          {currentQ.linkedHotspotId && onSelectHotspotById && (
            <button
              onClick={() => onSelectHotspotById(currentQ.linkedHotspotId!)}
              className="text-xs text-emerald-400 hover:text-emerald-300 underline font-medium"
            >
              Highlight Structure
            </button>
          )}
        </div>

        <h4 className="text-sm md:text-base font-semibold leading-relaxed mb-4 text-slate-100">
          {currentQ.prompt}
        </h4>

        {/* Options */}
        <div className="space-y-2 mb-4">
          {currentQ.choices.map((choice) => {
            const isChosen = selectedOption === choice.id;
            const isRight = choice.id.toLowerCase() === currentQ.correctAnswer.toLowerCase();

            let optionStyles = 'border-slate-800 bg-slate-950/60 hover:bg-slate-800/80 text-slate-300';
            if (isSubmitted) {
              if (isRight) {
                optionStyles = 'border-emerald-500 bg-emerald-500/10 text-emerald-300';
              } else if (isChosen) {
                optionStyles = 'border-rose-500 bg-rose-500/10 text-rose-300';
              } else {
                optionStyles = 'border-slate-800/40 opacity-50 text-slate-500';
              }
            } else if (isChosen) {
              optionStyles = 'border-blue-500 bg-blue-500/10 text-blue-200 ring-2 ring-blue-500/30';
            }

            return (
              <button
                key={choice.id}
                onClick={() => handleSelectOption(choice.id)}
                disabled={isSubmitted}
                className={`w-full text-left px-3.5 py-2.5 rounded-lg border text-xs md:text-sm font-medium transition flex items-start gap-2.5 ${optionStyles}`}
              >
                <span className="font-bold uppercase tracking-wider text-slate-400 shrink-0 mt-0.5">
                  {choice.id})
                </span>
                <span className="flex-1">{choice.text}</span>
                {isSubmitted && isRight && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
                {isSubmitted && isChosen && !isRight && <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Answer Explanation & Navigation */}
      <div>
        {isSubmitted && (
          <div
            className={`p-3 rounded-lg mb-4 text-xs leading-relaxed border ${
              isCorrect
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
                : 'bg-rose-950/40 border-rose-500/30 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold mb-1">
              {isCorrect ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Correct Answer!</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <span>Incorrect. Key Rationale:</span>
                </>
              )}
            </div>
            <p className="text-slate-300 text-[11px]">{currentQ.explanation}</p>
          </div>
        )}

        <div className="flex items-center justify-end gap-2">
          {!isSubmitted ? (
            <button
              onClick={handleSubmit}
              disabled={!selectedOption}
              className="px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Submit Answer
            </button>
          ) : (
            currentIndex < questions.length - 1 && (
              <button
                onClick={handleNext}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 transition flex items-center gap-1"
              >
                <span>Next Question</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
