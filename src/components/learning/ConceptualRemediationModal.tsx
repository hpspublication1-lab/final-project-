'use client';

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  HelpCircle,
  Award,
} from 'lucide-react';
import {
  generateFiveStageRemediation,
  FiveStageRemediationPlan,
} from '@/lib/learning/conceptualChangeEngine';
import toast from 'react-hot-toast';

interface ConceptualRemediationModalProps {
  misconceptionId?: string;
  conceptName: string;
  onClose: () => void;
}

export default function ConceptualRemediationModal({
  misconceptionId = 'misc-grav-mass-dependent',
  conceptName,
  onClose,
}: ConceptualRemediationModalProps) {
  // Resolve or fallback to gravitation misconception
  const [plan] = useState<FiveStageRemediationPlan | null>(() => {
    return (
      generateFiveStageRemediation(misconceptionId) ||
      generateFiveStageRemediation('misc-grav-mass-dependent')
    );
  });

  const [activeStage, setActiveStage] = useState<number>(1);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [transferPassed, setTransferPassed] = useState<boolean>(false);

  if (!plan) return null;

  const handleOptionSelect = (idx: number) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(idx);
  };

  const handleCheckTransfer = () => {
    if (selectedOption === null) {
      toast.error('Please select an answer to test your conceptual understanding.');
      return;
    }

    const isCorrect = selectedOption === plan.stage4_immediateTransfer.correctOptionIndex;
    setIsAnswerSubmitted(true);
    setTransferPassed(isCorrect);

    if (isCorrect) {
      toast.success('Conceptual transfer successful! 7-day retention check scheduled.');
      setActiveStage(5);
    } else {
      toast.error('Not quite. Review the contrastive distinction and worked example.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-card border border-border w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Sparkles size={18} />
            </div>
            <div>
              <span className="text-[10px] font-mono font-black uppercase tracking-wider text-primary">
                Cognitive Change Loop (DOI:10.1016/j.learninstruc.2026.102395)
              </span>
              <h3 className="text-base font-bold text-foreground">
                Targeted Remediation: {plan.stage1_identification.name}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress Step Indicators */}
        <div className="grid grid-cols-5 gap-1.5 text-center text-[10px] font-mono font-bold">
          {[
            { num: 1, label: '1. Identify' },
            { num: 2, label: '2. Contrast' },
            { num: 3, label: '3. Example' },
            { num: 4, label: '4. Transfer' },
            { num: 5, label: '5. Retain' },
          ].map((st) => (
            <button
              key={st.num}
              onClick={() => setActiveStage(st.num)}
              className={`py-1.5 px-1 rounded-lg border transition-all cursor-pointer ${
                activeStage === st.num
                  ? 'bg-primary text-primary-foreground border-primary font-black shadow-xs'
                  : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* STAGE 1: IDENTIFY */}
        {activeStage === 1 && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                The Intuitive Belief (Everyday Fallacy)
              </span>
              <p className="text-sm font-semibold text-foreground">
                "{plan.stage1_identification.intuitiveBelief}"
              </p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              In everyday experience, heavy objects appear to behave differently due to ambient friction and air resistance. However, physical laws require separating environmental effects from fundamental mechanics.
            </p>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveStage(2)}
                className="btn-primary text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer font-bold"
              >
                <span>Examine Scientific Reality</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* STAGE 2: CONTRASTIVE DISTINCTION */}
        {activeStage === 2 && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                Scientific Reality &amp; Contrast
              </span>
              <p className="text-sm font-bold text-foreground">
                {plan.stage2_contrastiveDistinction.scientificReality}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-muted/40 border border-border text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground block pb-1">Why your intuition misled you:</strong>
              {plan.stage2_contrastiveDistinction.contrastiveExplanation}
            </div>
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setActiveStage(1)}
                className="btn-secondary text-xs py-2 px-3 rounded-xl cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={() => setActiveStage(3)}
                className="btn-primary text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer font-bold"
              >
                <span>View Worked Example</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* STAGE 3: WORKED COGNITIVE EXAMPLE */}
        {activeStage === 3 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold text-primary uppercase">Scenario</span>
              <p className="text-xs font-bold text-foreground bg-muted/40 p-3 rounded-xl border border-border">
                {plan.stage3_workedExample.scenario}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs">
              <span className="font-bold text-red-600 dark:text-red-400 block">Incorrect Intuitive Step:</span>
              <span className="text-muted-foreground">{plan.stage3_workedExample.fallaciousIntuition}</span>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-mono font-bold text-foreground uppercase">Correct Step-by-Step Derivation:</span>
              <div className="space-y-1 font-mono text-xs bg-muted/20 p-3 rounded-xl border border-border">
                {plan.stage3_workedExample.correctReasoningSteps.map((step, idx) => (
                  <div key={idx} className="text-foreground">{step}</div>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-foreground font-semibold">
              <strong>Takeaway:</strong> {plan.stage3_workedExample.coreTakeaway}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setActiveStage(2)}
                className="btn-secondary text-xs py-2 px-3 rounded-xl cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={() => setActiveStage(4)}
                className="btn-primary text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer font-bold"
              >
                <span>Attempt Immediate Transfer Question</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* STAGE 4: IMMEDIATE ISOMORPHIC TRANSFER */}
        {activeStage === 4 && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                <HelpCircle size={14} />
                <span>Immediate Transfer Problem</span>
              </span>
              <p className="text-xs sm:text-sm font-semibold text-foreground leading-relaxed">
                {plan.stage4_immediateTransfer.questionText}
              </p>
            </div>

            {/* Options */}
            <div className="space-y-2">
              {plan.stage4_immediateTransfer.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === plan.stage4_immediateTransfer.correctOptionIndex;

                let btnStyle = 'bg-card border-border hover:bg-muted text-foreground';
                if (isAnswerSubmitted) {
                  if (isCorrect) {
                    btnStyle = 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-400 font-bold';
                  } else if (isSelected) {
                    btnStyle = 'bg-red-500/15 border-red-500 text-red-700 dark:text-red-400 font-bold';
                  }
                } else if (isSelected) {
                  btnStyle = 'bg-primary/10 border-primary text-primary font-bold';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleOptionSelect(idx)}
                    className={`w-full text-left p-3.5 rounded-xl border text-xs flex items-center justify-between transition-all cursor-pointer ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {isAnswerSubmitted && isCorrect && <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />}
                    {isAnswerSubmitted && !isCorrect && isSelected && <AlertCircle size={16} className="text-red-600 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Post-Submit Feedback */}
            {isAnswerSubmitted && (
              <div className={`p-4 rounded-xl text-xs space-y-1.5 ${
                transferPassed ? 'bg-emerald-500/10 border border-emerald-500/20 text-foreground' : 'bg-red-500/10 border border-red-500/20 text-foreground'
              }`}>
                <div className="font-bold flex items-center gap-1.5">
                  {transferPassed ? (
                    <>
                      <CheckCircle2 size={14} className="text-emerald-600" />
                      <span className="text-emerald-600 dark:text-emerald-400">Correct! Mental Model Restructured</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={14} className="text-red-600" />
                      <span className="text-red-600 dark:text-red-400">Misconception Persists</span>
                    </>
                  )}
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {plan.stage4_immediateTransfer.explanation}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setActiveStage(3)}
                className="btn-secondary text-xs py-2 px-3 rounded-xl cursor-pointer"
              >
                Back to Example
              </button>
              {!isAnswerSubmitted ? (
                <button
                  onClick={handleCheckTransfer}
                  className="btn-primary text-xs py-2.5 px-5 rounded-xl font-bold cursor-pointer"
                >
                  Verify My Answer
                </button>
              ) : (
                <button
                  onClick={() => setActiveStage(5)}
                  className="btn-primary text-xs py-2.5 px-5 rounded-xl font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <span>Continue to 7-Day Tracking</span>
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* STAGE 5: LONGITUDINAL TRACKING & 7-DAY REASSESSMENT */}
        {activeStage === 5 && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
              <Award size={36} className="text-emerald-600 mx-auto" />
              <h4 className="text-base font-bold text-foreground">
                Immediate Transfer Passed!
              </h4>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                {plan.stage5_delayedReassessment.rationale}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-primary" />
                <span className="font-bold text-foreground">Scheduled 7-Day Reassessment:</span>
              </div>
              <span className="font-mono font-bold text-primary">
                {new Date(plan.stage5_delayedReassessment.targetReassessmentDate).toLocaleDateString()}
              </span>
            </div>

            <div className="pt-2">
              <button
                onClick={onClose}
                className="w-full btn-primary py-3 rounded-xl font-black text-xs cursor-pointer shadow-md"
              >
                Return to Evaluation Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
