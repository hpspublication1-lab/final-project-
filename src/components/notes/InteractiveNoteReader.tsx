'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  X, BookOpen, Sparkles, Zap, Download, Bookmark, BookmarkCheck,
  Clock, Share2, Check, Copy, ArrowRight, HelpCircle, Layers, Award
} from 'lucide-react';
import { MathText } from '@/components/MathText';
import toast from 'react-hot-toast';

export interface NoteDetailPayload {
  id: string;
  title: string;
  subjectName: string;
  chapterTitle: string;
  readingTimeMins?: number;
  contentMarkdown: string;
  summaryKeyPoints?: string[];
  formulaSheetLatex?: string;
  pdfUrl?: string | null;
  isPremium?: boolean;
}

interface InteractiveNoteReaderProps {
  note: NoteDetailPayload;
  onClose: () => void;
  onAskCopilot?: (concept: string) => void;
}

export default function InteractiveNoteReader({
  note,
  onClose,
  onAskCopilot,
}: InteractiveNoteReaderProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [copiedFormula, setCopiedFormula] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'formulas' | 'summary'>('content');

  const handleCopyFormula = () => {
    if (!note.formulaSheetLatex) return;
    navigator.clipboard.writeText(note.formulaSheetLatex);
    setCopiedFormula(true);
    toast.success('Formula LaTeX copied to clipboard!');
    setTimeout(() => setCopiedFormula(false), 2000);
  };

  const handleBookmarkToggle = () => {
    setIsBookmarked((prev) => {
      const next = !prev;
      toast.success(next ? 'Note saved to your bookmarks' : 'Note removed from bookmarks');
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-card border border-border rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/80 bg-card/95 sticky top-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <BookOpen size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {note.subjectName} · CEE High-Yield
                </span>
                {note.readingTimeMins && (
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                    <Clock size={11} /> {note.readingTimeMins} min read
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-foreground truncate mt-0.5">
                {note.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleBookmarkToggle}
              className={`p-2 rounded-xl border transition-colors ${
                isBookmarked
                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                  : 'bg-muted/50 text-muted-foreground border-border hover:text-foreground'
              }`}
              title="Bookmark Note"
            >
              {isBookmarked ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
            </button>
            {note.pdfUrl && (
              <a
                href={note.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-muted/50 text-muted-foreground border border-border hover:text-primary transition-colors hidden sm:inline-flex"
                title="Download PDF"
              >
                <Download size={18} />
              </a>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Reader Sub-Tabs */}
        <div className="flex items-center gap-2 px-5 py-2.5 border-b border-border/60 bg-muted/30 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('content')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === 'content'
                ? 'bg-primary text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Conceptual Notes
          </button>
          {note.formulaSheetLatex && (
            <button
              onClick={() => setActiveTab('formulas')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'formulas'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>Formula Sheet</span>
              <span className="text-[10px] bg-white/20 px-1 rounded">LaTeX</span>
            </button>
          )}
          {note.summaryKeyPoints && note.summaryKeyPoints.length > 0 && (
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'summary'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>Must-Know Facts</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-1 rounded font-bold">
                {note.summaryKeyPoints.length}
              </span>
            </button>
          )}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 text-foreground leading-relaxed text-sm sm:text-base">
          
          {/* TAB 1: Main Markdown & LaTeX Content */}
          {activeTab === 'content' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-muted/30 border border-border/80 text-xs text-muted-foreground flex items-center justify-between">
                <span>Chapter: <strong className="text-foreground">{note.chapterTitle}</strong></span>
                <span className="text-primary font-bold">MECEE High-Yield Curriculum</span>
              </div>

              <div className="prose dark:prose-invert max-w-none">
                <MathText text={note.contentMarkdown} />
              </div>
            </div>
          )}

          {/* TAB 2: Formula Sheet & Derivations */}
          {activeTab === 'formulas' && note.formulaSheetLatex && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground">High-Yield Formulae & Rapid Derivations</h3>
                <button
                  onClick={handleCopyFormula}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-xl hover:bg-primary hover:text-white transition-colors"
                >
                  {copiedFormula ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedFormula ? 'Copied!' : 'Copy Formulas'}</span>
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-muted/40 border border-border/80 font-mono text-sm overflow-x-auto">
                <MathText text={note.formulaSheetLatex} />
              </div>
            </div>
          )}

          {/* TAB 3: Summary Key Points / Important Exam Facts */}
          {activeTab === 'summary' && note.summaryKeyPoints && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-foreground">Exam Traps & Crucial Points</h3>
              <div className="grid gap-2.5">
                {note.summaryKeyPoints.map((point, index) => (
                  <div
                    key={index}
                    className="p-3.5 rounded-2xl bg-card border border-border/80 flex items-start gap-3 shadow-xs"
                  >
                    <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <div className="text-xs sm:text-sm text-foreground/90 font-medium">
                      <MathText text={point} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border/80 bg-card/95 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={() => onAskCopilot?.(note.title)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 font-bold text-xs border border-purple-500/30 transition-all"
          >
            <Sparkles size={15} />
            <span>Ask Samyak AI Copilot About This Note</span>
          </button>

          <div className="w-full sm:w-auto flex items-center gap-2">
            <Link
              href={`/practice?chapter=${encodeURIComponent(note.chapterTitle)}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-black text-xs shadow-md transition-all"
            >
              <Zap size={14} />
              <span>Practice Chapter MCQs</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
