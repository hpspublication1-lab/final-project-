'use client';

import React, { useState } from 'react';
import {
  Sparkles, X, Check, Copy, Loader2, BookOpen, FileText,
  Zap, ArrowRight, ShieldCheck, CheckCircle2, RefreshCw, Send
} from 'lucide-react';
import { toast } from 'sonner';
import type { TargetProgram, ContentGenerationType, GeneratedContentResult } from '@/lib/ai/autonomousContentEngine';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PROGRAM_SUBJECTS: Record<TargetProgram, string[]> = {
  cee: ['Physics', 'Chemistry', 'Botany', 'Zoology', 'Mental Agility Test (MAT)'],
  see: ['Compulsory Science', 'Compulsory Mathematics', 'Optional Mathematics', 'English', 'Social Studies'],
  ielts: ['Writing Task 1 Academic', 'Writing Task 2 Essay', 'Speaking Part 2 Cue Cards', 'Reading Mastery', 'Listening Vocabulary'],
  neb: ['Physics', 'Chemistry', 'Biology', 'Mathematics'],
  ioe: ['Mathematics', 'Physics', 'Chemistry', 'English Aptitude'],
};

export default function AiContentGeneratorModal({ isOpen, onClose, onSuccess }: Props) {
  const [program, setProgram] = useState<TargetProgram>('cee');
  const [subject, setSubject] = useState('Physics');
  const [chapterOrTopic, setChapterOrTopic] = useState('Thermodynamics & Heat Transfer');
  const [generationType, setGenerationType] = useState<ContentGenerationType>('comprehensive_notes');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'adaptive'>('adaptive');
  const [itemCount, setItemCount] = useState(10);
  const [customInstructions, setCustomInstructions] = useState('');

  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<GeneratedContentResult | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleProgramChange = (newProgram: TargetProgram) => {
    setProgram(newProgram);
    const available = PROGRAM_SUBJECTS[newProgram] || [];
    if (available.length > 0) setSubject(available[0]);
  };

  const handleGenerate = async () => {
    if (!chapterOrTopic.trim()) {
      toast.error('Please specify a chapter or topic name');
      return;
    }

    setGenerating(true);
    setResult(null);

    try {
      const res = await fetch('/api/admin/ai-content-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program,
          subject,
          chapterOrTopic,
          generationType,
          difficulty,
          itemCount,
          customInstructions,
          autoPublish: false,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Generation failed');

      setResult(data.generated);
      toast.success(data.message || 'Educational content synthesized successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Error generating content');
    } finally {
      setGenerating(false);
    }
  };

  const handlePublishNow = async () => {
    if (!result) return;
    setPublishing(true);

    try {
      const res = await fetch('/api/admin/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: result.title,
          program_type: result.program,
          file_type: result.generationType === 'formula_sheet' ? 'formula_sheet' : 'pdf_notes',
          content: result.markdownContent,
          is_premium: false,
          is_active: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Publish failed');

      toast.success(`Published "${result.title}" live to students!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Error publishing resource');
    } finally {
      setPublishing(false);
    }
  };

  const handleCopyMarkdown = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.markdownContent);
    setCopied(true);
    toast.success('Markdown copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-3xl max-w-5xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
                Autonomous AI Curriculum Studio
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary uppercase">
                  Multi-Model Engine
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Synthesize high-yield study notes, KaTeX formulas, MCQs, and Band 9 packs across CEE, SEE &amp; IELTS.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl border border-border hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Split Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-y-auto lg:overflow-hidden">
          
          {/* LEFT: Generation Parameters (5 cols) */}
          <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-border p-5 space-y-4 overflow-y-auto bg-muted/10 text-xs">
            
            {/* Target Program Selector */}
            <div>
              <label className="block font-bold text-foreground mb-1.5 uppercase text-[10px] tracking-wider text-muted-foreground">
                Target Section / Academic Program:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { key: 'cee', label: '🩺 CEE Medical' },
                  { key: 'see', label: '🎒 SEE Class 10' },
                  { key: 'ielts', label: '🌍 IELTS' },
                  { key: 'neb', label: '🎓 NEB 11/12' },
                  { key: 'ioe', label: '📐 IOE Eng' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleProgramChange(item.key as TargetProgram)}
                    className={`py-2 px-2.5 rounded-xl font-bold text-center transition-all cursor-pointer ${
                      program === item.key
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-card border border-border text-foreground hover:bg-muted'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject Selector */}
            <div>
              <label className="block font-bold text-foreground mb-1">Subject:</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="input-field w-full py-2 text-xs"
              >
                {(PROGRAM_SUBJECTS[program] || []).map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            {/* Chapter / Topic */}
            <div>
              <label className="block font-bold text-foreground mb-1">Chapter or Curriculum Topic:</label>
              <input
                type="text"
                value={chapterOrTopic}
                onChange={(e) => setChapterOrTopic(e.target.value)}
                placeholder="e.g. Wave Optics, Circle Theorems, Climate Change Essay"
                className="input-field w-full py-2 text-xs"
              />
            </div>

            {/* Generation Format */}
            <div>
              <label className="block font-bold text-foreground mb-1">Content Output Format:</label>
              <select
                value={generationType}
                onChange={(e) => setGenerationType(e.target.value as ContentGenerationType)}
                className="input-field w-full py-2 text-xs"
              >
                <option value="comprehensive_notes">Comprehensive Master Notes (with KaTeX)</option>
                <option value="formula_sheet">Formula Cheat Sheet &amp; Dimensions (KaTeX)</option>
                <option value="mcq_question_bank">Exam MCQ Question Set (with Traps &amp; Solutions)</option>
                <option value="ielts_mastery_pack">IELTS Band 9 Model Pack &amp; Vocabulary</option>
              </select>
            </div>

            {/* Difficulty */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-foreground mb-1">Difficulty:</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="input-field w-full py-1.5 text-xs"
                >
                  <option value="adaptive">Adaptive (Exam Standard)</option>
                  <option value="easy">Easy (Foundational)</option>
                  <option value="medium">Medium (Moderate)</option>
                  <option value="hard">Hard (Top 1% Ranker)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">Item Count:</label>
                <input
                  type="number"
                  min="5"
                  max="30"
                  value={itemCount}
                  onChange={(e) => setItemCount(Number(e.target.value) || 10)}
                  className="input-field w-full py-1.5 text-xs"
                />
              </div>
            </div>

            {/* Custom Instructions */}
            <div>
              <label className="block font-semibold text-foreground mb-1">
                Custom Focus / Examiner Notes (Optional):
              </label>
              <textarea
                rows={2}
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="e.g. Include 2080 past questions, highlight sign conventions..."
                className="input-field w-full py-1.5 text-xs"
              />
            </div>

            {/* Generate Trigger */}
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Synthesizing Curriculum Content...
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  Synthesize with AI Engine
                </>
              )}
            </button>

            <div className="p-3 bg-muted/40 border border-border/70 rounded-xl flex items-center gap-2 text-[10px] text-muted-foreground">
              <ShieldCheck size={16} className="text-primary shrink-0" />
              <span>
                Content strictly grounded in official Nepal MEC, CDC &amp; Cambridge rubrics with KaTeX rendering.
              </span>
            </div>
          </div>

          {/* RIGHT: Live Output Preview & Instant Publishing (7 cols) */}
          <div className="lg:col-span-7 p-5 flex flex-col justify-between overflow-y-auto bg-card">
            {result ? (
              <div className="space-y-4">
                {/* Result Top Info */}
                <div className="flex items-center justify-between border-b border-border pb-3 flex-wrap gap-2">
                  <div>
                    <h3 className="font-extrabold text-foreground text-sm flex items-center gap-1.5">
                      <CheckCircle2 size={16} className="text-success" />
                      {result.title}
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Synthesized via <span className="font-mono text-primary font-bold">{result.modelUsed}</span> ·{' '}
                      {new Date(result.generatedAt).toLocaleTimeString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyMarkdown}
                      className="px-2.5 py-1 rounded-lg border border-border hover:bg-muted text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* Markdown Viewport */}
                <div className="bg-muted/30 border border-border rounded-2xl p-4 max-h-[420px] overflow-y-auto font-sans text-xs leading-relaxed space-y-3 prose dark:prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap font-mono text-[11px] bg-background p-3 rounded-xl border border-border/60">
                    {result.markdownContent}
                  </pre>
                </div>

                {/* Sovereign 1-Click Publish Action */}
                <div className="pt-2 border-t border-border flex items-center justify-between gap-3">
                  <div className="text-[11px] text-muted-foreground">
                    Ready to deliver to all enrolled <strong>{result.program.toUpperCase()}</strong> students.
                  </div>

                  <button
                    onClick={handlePublishNow}
                    disabled={publishing}
                    className="py-2.5 px-5 rounded-xl bg-success hover:bg-success/90 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {publishing ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Send size={14} />
                    )}
                    1-Click Publish Live to Students
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <Sparkles size={28} />
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-sm">Autonomous Content Synthesizer Idle</h4>
                  <p className="text-xs text-muted-foreground max-w-sm mt-1">
                    Select your target section (CEE, SEE, or IELTS), subject, and chapter on the left, then click{' '}
                    <strong>"Synthesize with AI Engine"</strong> to generate lecture notes and formula sheets.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
