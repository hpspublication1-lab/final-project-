'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Bookmark,
  BookmarkCheck,
  RotateCcw,
  Lightbulb,
  AlertTriangle,
  Flame,
  Award,
  HelpCircle,
  ArrowRight,
  Clock,
  BookOpen,
  Edit3,
  Calculator,
  Eraser,
} from 'lucide-react';
import { SeeQuestion } from '@/lib/data/seeQuestionBankData';
import MathRenderer from '@/components/common/MathRenderer';

interface SeePracticeSessionModalProps {
  questions: SeeQuestion[];
  sessionTitle: string;
  onClose: () => void;
  onBookmarkToggle?: (id: string) => void;
  bookmarkedIds?: Set<string>;
  onRecordMistake?: (question: SeeQuestion) => void;
}

export default function SeePracticeSessionModal({
  questions,
  sessionTitle,
  onClose,
  onBookmarkToggle,
  bookmarkedIds = new Set(),
  onRecordMistake,
}: SeePracticeSessionModalProps) {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [userAnswers, setUserAnswers] = useState<Record<string, 'correct' | 'wrong' | 'skipped'>>({});
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [aiExplainMode, setAiExplainMode] = useState<'simple' | 'hint' | 'secret' | null>(null);

  // Scratchpad State
  const [isScratchpadOpen, setIsScratchpadOpen] = useState<boolean>(false);
  const [scratchNotes, setScratchNotes] = useState<string>('');

  // Rubric step completion state for current question
  const [checkedRubrics, setCheckedRubrics] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (isCompleted) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isCompleted]);

  // Reset rubrics on next question
  useEffect(() => {
    setCheckedRubrics({});
  }, [currentIndex]);

  if (!questions || questions.length === 0) return null;

  const currentQ = questions[currentIndex];
  const isBookmarked = bookmarkedIds.has(currentQ.id);

  const handleMarkAnswer = (status: 'correct' | 'wrong' | 'skipped') => {
    setUserAnswers((prev) => ({ ...prev, [currentQ.id]: status }));
    if (status === 'wrong' && onRecordMistake) {
      onRecordMistake(currentQ);
    }
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setIsRevealed(false);
      setAiExplainMode(null);
    } else {
      setIsCompleted(true);
    }
  };

  const toggleRubricCheck = (idx: number) => {
    setCheckedRubrics((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Results calculation
  const total = questions.length;
  const correctCount = Object.values(userAnswers).filter((v) => v === 'correct').length;
  const wrongCount = Object.values(userAnswers).filter((v) => v === 'wrong').length;
  const percentage = Math.round((correctCount / total) * 100);

  const restartSession = () => {
    setCurrentIndex(0);
    setIsRevealed(false);
    setUserAnswers({});
    setIsCompleted(false);
    setTimerSeconds(0);
    setAiExplainMode(null);
    setScratchNotes('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[94vh]">
        
        {/* Top Session Header */}
        <div className="p-4 sm:p-5 bg-muted/60 border-b border-border flex items-center justify-between gap-3 shrink-0">
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-mono">
                Interactive Practice
              </span>
              <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                <Clock size={12} /> {formatTimer(timerSeconds)}
              </span>
            </div>
            <h3 className="text-xs sm:text-sm font-black text-foreground truncate">
              {sessionTitle}
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isCompleted && (
              <>
                <button
                  onClick={() => setIsScratchpadOpen(!isScratchpadOpen)}
                  className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                    isScratchpadOpen
                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300'
                      : 'bg-card border-border text-muted-foreground hover:text-foreground'
                  }`}
                  title="Toggle Rough Sheet / Scratchpad"
                >
                  <Edit3 size={13} />
                  <span className="hidden sm:inline">Rough Sheet</span>
                </button>

                <span className="text-xs font-mono font-black text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-xl">
                  Q {currentIndex + 1} / {total}
                </span>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scratchpad Collapsible Drawer */}
        {isScratchpadOpen && !isCompleted && (
          <div className="p-4 bg-amber-500/5 border-b border-amber-500/20 space-y-2 animate-scale-in">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-amber-800 dark:text-amber-300 font-mono flex items-center gap-1.5">
                <Edit3 size={13} /> STUDENT ROUGH CALCULATION SHEET (रफ पाना)
              </span>
              <button
                onClick={() => setScratchNotes('')}
                className="text-[10px] text-muted-foreground hover:text-red-500 flex items-center gap-1 transition-colors"
              >
                <Eraser size={12} /> Clear Notes
              </button>
            </div>
            <textarea
              rows={3}
              placeholder="Type rough calculations, formulas, or numbers here while solving..."
              value={scratchNotes}
              onChange={(e) => setScratchNotes(e.target.value)}
              className="w-full p-3 rounded-xl bg-card border border-border text-xs text-foreground font-mono focus:outline-none focus:border-amber-500"
            />
          </div>
        )}

        {/* Progress Bar */}
        {!isCompleted && (
          <div className="w-full bg-muted h-1.5 shrink-0">
            <div
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
            />
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 sm:p-8 overflow-y-auto space-y-6 flex-1">
          {!isCompleted ? (
            <div className="space-y-6">
              
              {/* Question Metadata */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-purple-500/10 text-purple-600 border border-purple-500/20 font-mono">
                    {currentQ.section} • {currentQ.marks} Mark{currentQ.marks > 1 ? 's' : ''}
                  </span>
                  <span className="text-xs font-bold text-foreground bg-muted/60 px-2.5 py-1 rounded-lg">
                    {currentQ.subjectName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    📂 {currentQ.chapter}
                  </span>
                </div>

                {onBookmarkToggle && (
                  <button
                    onClick={() => onBookmarkToggle(currentQ.id)}
                    className={`p-2 rounded-xl border transition-all ${
                      isBookmarked
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-600'
                        : 'bg-card border-border text-muted-foreground hover:text-foreground'
                    }`}
                    title={isBookmarked ? 'Saved in Bookmarks' : 'Bookmark this question'}
                  >
                    {isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                  </button>
                )}
              </div>

              {/* Question Text with KaTeX Math */}
              <div className="space-y-2 p-5 rounded-2xl bg-muted/30 border border-border">
                <div className="text-sm sm:text-base font-black text-foreground leading-relaxed">
                  <span className="text-emerald-600 font-mono mr-2">Q{currentIndex + 1}.</span>
                  <MathRenderer text={currentQ.question} className="inline" />
                </div>
                {currentQ.questionNepali && (
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground leading-relaxed pl-6">
                    🇳🇵 {currentQ.questionNepali}
                  </p>
                )}
              </div>

              {/* Action Buttons Before Revealing Solution */}
              {!isRevealed ? (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border">
                  <button
                    onClick={() => handleMarkAnswer('skipped')}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground text-xs font-bold transition-all"
                  >
                    Skip Question →
                  </button>

                  <button
                    onClick={() => setIsRevealed(true)}
                    className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <BookOpen size={16} />
                    <span>Reveal Model Solution &amp; Answer</span>
                  </button>
                </div>
              ) : (
                /* Revealed Solution Container */
                <div className="space-y-5 animate-fade-in">
                  
                  {/* Self-Assessment Quick Bar */}
                  <div className="p-4 rounded-2xl bg-muted/60 border border-border flex flex-col sm:flex-row items-center justify-between gap-3">
                    <span className="text-xs font-black text-foreground">
                      Self Assessment (Check your result):
                    </span>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleMarkAnswer('correct')}
                        className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-sm transition-all"
                      >
                        <CheckCircle2 size={15} />
                        <span>✅ Got It Right</span>
                      </button>
                      <button
                        onClick={() => handleMarkAnswer('wrong')}
                        className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-sm transition-all"
                      >
                        <XCircle size={15} />
                        <span>❌ Made a Mistake</span>
                      </button>
                    </div>
                  </div>

                  {/* AI Explain Helper Bar */}
                  <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs">
                    <span className="font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1 font-mono text-[11px]">
                      <Sparkles size={13} /> AI TUTOR:
                    </span>
                    <button
                      onClick={() => setAiExplainMode(aiExplainMode === 'simple' ? null : 'simple')}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                        aiExplainMode === 'simple'
                          ? 'bg-purple-600 text-white'
                          : 'bg-card border border-purple-500/30 text-purple-600 hover:bg-purple-500/20'
                      }`}
                    >
                      💡 Explain Simply (Like I'm 15)
                    </button>
                    <button
                      onClick={() => setAiExplainMode(aiExplainMode === 'hint' ? null : 'hint')}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                        aiExplainMode === 'hint'
                          ? 'bg-purple-600 text-white'
                          : 'bg-card border border-purple-500/30 text-purple-600 hover:bg-purple-500/20'
                      }`}
                    >
                      🔍 Exam Hint
                    </button>
                    <button
                      onClick={() => setAiExplainMode(aiExplainMode === 'secret' ? null : 'secret')}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                        aiExplainMode === 'secret'
                          ? 'bg-purple-600 text-white'
                          : 'bg-card border border-purple-500/30 text-purple-600 hover:bg-purple-500/20'
                      }`}
                    >
                      🎯 Examiner Secret
                    </button>
                  </div>

                  {/* AI Explain Box Content */}
                  {aiExplainMode === 'simple' && (
                    <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-xs space-y-1.5 animate-scale-in text-purple-900 dark:text-purple-200">
                      <span className="font-black flex items-center gap-1">
                        <Sparkles size={14} className="text-purple-500" /> Simplified Everyday Analogy:
                      </span>
                      <p className="leading-relaxed">
                        {"Whenever an object is pulled by gravity without air friction, its acceleration is always constant (9.8 m/s²). In your exam, always state the standard definition and underline the SI unit to ensure zero mark deductions!"}
                      </p>
                    </div>
                  )}

                  {aiExplainMode === 'hint' && (
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1.5 animate-scale-in text-amber-900 dark:text-amber-200">
                      <span className="font-black flex items-center gap-1">
                        <Lightbulb size={14} className="text-amber-500" /> Calculation Pointer:
                      </span>
                      <p className="leading-relaxed">
                        Look at the given values. Convert any non-SI units (like km to m or minutes to seconds) before substituting into the main equation!
                      </p>
                    </div>
                  )}

                  {aiExplainMode === 'secret' && (
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-1.5 animate-scale-in text-emerald-900 dark:text-emerald-200">
                      <span className="font-black flex items-center gap-1">
                        <Award size={14} className="text-emerald-500" /> NEB Examiner Grading Secret:
                      </span>
                      <p className="leading-relaxed">
                        Examiners award step marks for each correct formula statement. Even if your calculation has an arithmetic slip, writing the formula guarantees partial credit!
                      </p>
                    </div>
                  )}

                  {/* Step-by-Step Model Solution with MathRenderer */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-black uppercase tracking-wider text-muted-foreground font-mono">
                      ✍️ Official Step-by-Step Model Solution
                    </h5>
                    <div className="p-5 rounded-2xl bg-card border border-border text-xs sm:text-sm text-foreground/90 whitespace-pre-line leading-relaxed font-sans">
                      <MathRenderer text={currentQ.solution} block={true} />
                    </div>
                  </div>

                  {/* Interactive NEB Rubric Self-Checklist */}
                  {currentQ.markingScheme && currentQ.markingScheme.length > 0 && (
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-2">
                      <span className="font-black text-emerald-700 dark:text-emerald-300 block">
                        🎯 NEB Marking Scheme Breakdown ({currentQ.marks} Marks) — Check what you wrote:
                      </span>
                      <div className="space-y-1.5">
                        {currentQ.markingScheme.map((m, idx) => (
                          <button
                            key={idx}
                            onClick={() => toggleRubricCheck(idx)}
                            className="w-full flex items-center justify-between p-2 rounded-xl bg-card/80 border border-emerald-500/20 text-left hover:bg-card transition-colors"
                          >
                            <span className="flex items-center gap-2 text-foreground font-medium">
                              <CheckCircle2
                                size={14}
                                className={checkedRubrics[idx] ? 'text-emerald-500' : 'text-muted-foreground/40'}
                              />
                              {m.step}
                            </span>
                            <span className="font-mono font-bold text-emerald-600">+{m.marks}M</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Common Exam Mistake */}
                  {currentQ.examTip && (
                    <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2">
                      <AlertTriangle size={14} className="shrink-0 mt-0.5 text-amber-500" />
                      <span>
                        <strong>Common Student Mistake:</strong> {currentQ.examTip}
                      </span>
                    </div>
                  )}

                </div>
              )}

            </div>
          ) : (
            /* Session Completed Screen */
            <div className="text-center py-6 space-y-6 animate-scale-in">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                <Award size={36} />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xl sm:text-2xl font-black text-foreground">
                  Practice Session Completed! 🎉
                </h3>
                <p className="text-xs text-muted-foreground font-mono">
                  Time taken: {formatTimer(timerSeconds)}
                </p>
              </div>

              {/* Score Grid */}
              <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
                <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
                  <span className="text-xs text-muted-foreground font-bold block">Score</span>
                  <span className="text-lg sm:text-xl font-black text-emerald-600 font-mono">
                    {percentage}%
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
                  <span className="text-xs text-muted-foreground font-bold block">Correct</span>
                  <span className="text-lg sm:text-xl font-black text-foreground font-mono">
                    {correctCount} / {total}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
                  <span className="text-xs text-muted-foreground font-bold block">Mistakes</span>
                  <span className="text-lg sm:text-xl font-black text-red-500 font-mono">
                    {wrongCount}
                  </span>
                </div>
              </div>

              {/* Next Step Guidance */}
              {wrongCount > 0 ? (
                <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/20 max-w-md mx-auto text-left space-y-2">
                  <span className="text-xs font-black text-red-600 flex items-center gap-1.5">
                    <Flame size={14} /> You have {wrongCount} question{wrongCount > 1 ? 's' : ''} to review
                  </span>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    These questions have been saved to your <strong>My Mistakes</strong> tracker so you can master them before the board exams.
                  </p>
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 max-w-md mx-auto text-left space-y-1">
                  <span className="text-xs font-black text-emerald-600 flex items-center gap-1.5">
                    <Sparkles size={14} /> Outstanding Mastery!
                  </span>
                  <p className="text-xs text-muted-foreground">
                    You answered all questions with high precision. Ready for a full chapter test?
                  </p>
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
                <button
                  onClick={restartSession}
                  className="px-5 py-2.5 rounded-2xl border border-border text-foreground font-bold text-xs flex items-center gap-1.5 hover:bg-muted transition-all"
                >
                  <RotateCcw size={14} />
                  <span>Practice Again</span>
                </button>

                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all"
                >
                  Return to Dashboard
                </button>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
