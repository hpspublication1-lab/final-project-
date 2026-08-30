'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Copy,
  Check,
  Bookmark,
  BookmarkCheck,
  AlertTriangle,
  Lightbulb,
  FileCheck,
  Trash2,
  ArrowRight,
  HelpCircle,
  Zap,
} from 'lucide-react';
import { SeeQuestion } from '@/lib/data/seeQuestionBankData';
import MathRenderer from '@/components/common/MathRenderer';

interface SeeQuestionCard2Props {
  question: SeeQuestion;
  index: number;
  isBookmarked?: boolean;
  onToggleBookmark?: (id: string) => void;
  onDeleteCustom?: (id: string) => void;
}

export default function SeeQuestionCard2({
  question,
  index,
  isBookmarked = false,
  onToggleBookmark,
  onDeleteCustom,
}: SeeQuestionCard2Props) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'solution' | 'rubric' | 'steps' | 'ai'>('solution');
  const [aiSubTab, setAiSubTab] = useState<'analogy' | 'hint' | 'secret'>('analogy');

  const isCustom = question.id.startsWith('custom-');

  const handleCopy = () => {
    const text = `[SEE Board Question - ${question.marks} Mark${question.marks > 1 ? 's' : ''} | ${question.chapter} (${question.year})]

Q: ${question.question}

Solution:
${question.solution}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const markBadgeColors: Record<number, string> = {
    1: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    2: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30',
    3: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    4: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
    5: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
    6: 'bg-rose-500/10 text-rose-600 border-rose-500/30',
    8: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30',
    10: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40',
  };

  return (
    <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all">
      {/* Header Info */}
      <div className="p-5 sm:p-6 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          
          {/* Tags */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-[11px] font-black px-3 py-1 rounded-xl border font-mono ${
                markBadgeColors[question.marks] || 'bg-muted text-muted-foreground'
              }`}
            >
              {question.section} • {question.marks} Mark{question.marks > 1 ? 's' : ''}
            </span>
            <span className="text-xs font-bold text-foreground bg-muted/60 px-2.5 py-1 rounded-lg">
              {question.subjectName}
            </span>
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              📂 {question.chapter}
              {question.subtopic && <span className="text-muted-foreground/70">› {question.subtopic}</span>}
            </span>
            {isCustom && (
              <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                ✍️ Custom
              </span>
            )}
          </div>

          {/* Right meta */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              {question.year}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
              {question.difficulty}
            </span>

            {/* Bookmark */}
            {onToggleBookmark && (
              <button
                onClick={() => onToggleBookmark(question.id)}
                className={`p-1.5 rounded-xl border transition-colors ${
                  isBookmarked
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-600'
                    : 'bg-card border-border text-muted-foreground hover:text-foreground'
                }`}
                title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Question'}
              >
                {isBookmarked ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
              </button>
            )}

            {/* Delete custom question */}
            {isCustom && onDeleteCustom && (
              <button
                onClick={() => onDeleteCustom(question.id)}
                className="p-1.5 rounded-xl bg-card border border-border text-red-500 hover:text-red-700 hover:bg-red-500/10 transition-colors"
                title="Delete Question"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Question Text with KaTeX Math Rendering */}
        <div className="space-y-1.5 pt-1">
          <div className="text-sm sm:text-base font-black text-foreground leading-relaxed">
            <span className="text-emerald-600 mr-2 font-mono">Q{index + 1}.</span>
            <MathRenderer text={question.question} className="inline" />
          </div>
          {question.questionNepali && (
            <p className="text-xs sm:text-sm font-medium text-muted-foreground leading-relaxed pl-6">
              🇳🇵 {question.questionNepali}
            </p>
          )}
        </div>

        {/* Exam Tip Callout */}
        {question.examTip && (
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2">
            <Lightbulb size={14} className="text-amber-500 shrink-0 mt-0.5" />
            <span>
              <strong>NEB Board Strategy:</strong> {question.examTip}
            </span>
          </div>
        )}

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/50">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            {isExpanded ? (
              <>
                <ChevronUp size={14} /> Hide Solution
              </>
            ) : (
              <>
                <ChevronDown size={14} /> View Step-by-Step Solution
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-2 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-bold flex items-center gap-1.5 transition-colors border border-border"
            >
              {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <Link
              href="/practice/subjective"
              className="px-3 py-2 rounded-xl bg-purple-600/10 hover:bg-purple-600/20 text-purple-600 border border-purple-500/30 text-xs font-black flex items-center gap-1.5 transition-all"
            >
              <Sparkles size={13} />
              <span>Practice in AI Marker →</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Expandable Multi-Modal Solution Drawer */}
      {isExpanded && (
        <div className="p-6 bg-muted/30 border-t border-border space-y-4 animate-fade-in">
          
          {/* Solution Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-3">
            <button
              onClick={() => setActiveTab('solution')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                activeTab === 'solution'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-card text-muted-foreground hover:text-foreground border border-border'
              }`}
            >
              Step-by-Step Model Solution
            </button>

            {question.numericalSteps && (
              <button
                onClick={() => setActiveTab('steps')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                  activeTab === 'steps'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-card text-muted-foreground hover:text-foreground border border-border'
                }`}
              >
                Given / Formula / Calculation
              </button>
            )}

            {question.markingScheme && question.markingScheme.length > 0 && (
              <button
                onClick={() => setActiveTab('rubric')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                  activeTab === 'rubric'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-card text-muted-foreground hover:text-foreground border border-border'
                }`}
              >
                Marking Rubric ({question.marks}M)
              </button>
            )}

            <button
              onClick={() => setActiveTab('ai')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 transition-all ${
                activeTab === 'ai'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-card text-purple-600 hover:bg-purple-500/10 border border-purple-500/30'
              }`}
            >
              <Sparkles size={12} />
              <span>AI Explainer (Like I'm 15)</span>
            </button>
          </div>

          {/* TAB 1: Written Solution with MathRenderer */}
          {activeTab === 'solution' && (
            <div className="bg-card p-5 rounded-2xl border border-border text-xs sm:text-sm text-foreground/90 whitespace-pre-line leading-relaxed font-sans">
              <MathRenderer text={question.solution} block={true} />
            </div>
          )}

          {/* TAB 2: Numerical Steps Breakdown */}
          {activeTab === 'steps' && question.numericalSteps && (
            <div className="bg-card p-5 rounded-2xl border border-border space-y-3 text-xs leading-relaxed">
              {question.numericalSteps.given && (
                <div className="p-2.5 rounded-xl bg-muted/40 border border-border/70">
                  <span className="font-bold text-foreground block mb-0.5">1. Given Quantities:</span>
                  <MathRenderer text={question.numericalSteps.given} className="text-muted-foreground" />
                </div>
              )}
              {question.numericalSteps.formula && (
                <div className="p-2.5 rounded-xl bg-muted/40 border border-border/70">
                  <span className="font-bold text-foreground block mb-0.5">2. Working Formula:</span>
                  <MathRenderer text={question.numericalSteps.formula} className="font-mono text-emerald-600 dark:text-emerald-400 font-bold" />
                </div>
              )}
              {question.numericalSteps.substitution && (
                <div className="p-2.5 rounded-xl bg-muted/40 border border-border/70">
                  <span className="font-bold text-foreground block mb-0.5">3. Value Substitution:</span>
                  <MathRenderer text={question.numericalSteps.substitution} className="text-muted-foreground font-mono" />
                </div>
              )}
              {question.numericalSteps.calculation && (
                <div className="p-2.5 rounded-xl bg-muted/40 border border-border/70">
                  <span className="font-bold text-foreground block mb-0.5">4. Calculation Steps:</span>
                  <MathRenderer text={question.numericalSteps.calculation} className="text-muted-foreground" />
                </div>
              )}
              {question.numericalSteps.finalAnswer && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-black">
                  <span>5. Final Answer with Units: </span>
                  <MathRenderer text={question.numericalSteps.finalAnswer} className="inline font-bold" />
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Marking Scheme Rubric */}
          {activeTab === 'rubric' && (
            <div className="p-5 rounded-2xl bg-card border border-border space-y-2">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider font-mono block mb-2">
                📋 Official NEB Board Step-wise Mark Distribution:
              </span>
              <div className="space-y-2">
                {question.markingScheme.map((rubric, rIdx) => (
                  <div
                    key={rIdx}
                    className="flex items-center justify-between text-xs py-1.5 border-b border-border/40 last:border-0"
                  >
                    <span className="text-muted-foreground flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      {rubric.step}
                    </span>
                    <span className="font-mono font-bold text-foreground shrink-0 ml-2">
                      +{rubric.marks} Mark{rubric.marks > 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: AI Explainer "Like I'm 15" */}
          {activeTab === 'ai' && (
            <div className="p-5 rounded-2xl bg-purple-500/10 border border-purple-500/25 space-y-4 animate-scale-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-purple-700 dark:text-purple-300 flex items-center gap-1.5 font-mono">
                  <Sparkles size={14} /> AI TEACHING ASSISTANT
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setAiSubTab('analogy')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      aiSubTab === 'analogy' ? 'bg-purple-600 text-white' : 'bg-card text-purple-700 hover:bg-purple-500/20'
                    }`}
                  >
                    💡 Simple Analogy
                  </button>
                  <button
                    onClick={() => setAiSubTab('hint')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      aiSubTab === 'hint' ? 'bg-purple-600 text-white' : 'bg-card text-purple-700 hover:bg-purple-500/20'
                    }`}
                  >
                    🔍 Exam Hint
                  </button>
                  <button
                    onClick={() => setAiSubTab('secret')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      aiSubTab === 'secret' ? 'bg-purple-600 text-white' : 'bg-card text-purple-700 hover:bg-purple-500/20'
                    }`}
                  >
                    🎯 Examiner Secret
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-card border border-purple-500/20 text-xs text-foreground leading-relaxed">
                {aiSubTab === 'analogy' && (
                  <p>
                    <strong>Intuition:</strong> Always break the problem down into what the examiner gave you versus what formula connects those quantities. For example, if you know mass and distance, the universal law formula connects both directly!
                  </p>
                )}
                {aiSubTab === 'hint' && (
                  <p>
                    <strong>Calculation Pointer:</strong> {"Double check your SI units before plugging them in. If distance is given in kilometers, remember to multiply by 1,000 to convert to meters (1 km = 1000 m)."}
                  </p>
                )}
                {aiSubTab === 'secret' && (
                  <p>
                    <strong>Examiner Note:</strong> NEB board examiners reward the initial formula statement even if your final calculation arithmetic is slightly off. Always write the standard formula clearly first!
                  </p>
                )}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
