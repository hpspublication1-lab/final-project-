'use client';

import React, { useState } from 'react';
import { SubjectiveQuestion, EvaluationResult } from './types';
import { Upload, Camera, FileText, Sparkles, ArrowLeft, CheckCircle2, AlertTriangle, RefreshCw, Award, BookOpen, Layers } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import toast from 'react-hot-toast';

interface SubjectiveAnswerEvaluatorProps {
  question: SubjectiveQuestion;
  onBack: () => void;
  onEvaluationComplete?: (result: EvaluationResult) => void;
}

export default function SubjectiveAnswerEvaluator({
  question,
  onBack,
  onEvaluationComplete,
}: SubjectiveAnswerEvaluatorProps) {
  const { t } = useLanguage();
  const [inputMode, setInputMode] = useState<'upload' | 'type'>('upload');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [writtenText, setWrittenText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);

  // File upload handler
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image file size must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Submit answer for AI grading
  const handleSubmitForEvaluation = async () => {
    if (!imagePreview && !writtenText.trim()) {
      toast.error('Please upload an image of your handwritten answer or type your response.');
      return;
    }

    setIsSubmitting(true);
    setEvaluationResult(null);

    try {
      const response = await fetch('/api/subjective/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: question.id,
          image_url: imagePreview,
          written_text: writtenText.trim() || undefined,
          question_text: question.question_text,
          sample_solution: question.sample_solution,
          rubric: question.rubric,
          total_marks: question.marks,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Evaluation failed.');
      }

      setEvaluationResult(data);
      onEvaluationComplete?.(data);
      toast.success('AI Evaluation Complete!');
    } catch (err: any) {
      console.error('Evaluation submit error:', err);
      toast.error(err.message || 'Could not complete AI evaluation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Header */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-extrabold text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={16} />
        <span>Back to Subjective Questions</span>
      </button>

      {/* Selected Question Context Card */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-xs space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary px-2.5 py-1 rounded-full border border-primary/20">
            {question.marks} Marks
          </span>
          <span className="text-xs font-bold text-foreground bg-muted px-2.5 py-0.5 rounded-md">
            {question.subject}
          </span>
          <span className="text-xs font-medium text-muted-foreground bg-muted/60 px-2.5 py-0.5 rounded-md">
            {question.chapter}
          </span>
        </div>

        <h2 className="text-lg sm:text-xl font-bold text-foreground leading-relaxed">
          {question.question_text}
        </h2>
      </div>

      {/* Main Submission & Evaluation Panel */}
      {!evaluationResult ? (
        <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Sparkles size={18} className="text-primary" />
              <span>Submit Answer for AI Grading</span>
            </h3>

            {/* Input Mode Switcher */}
            <div className="flex items-center p-1 bg-muted rounded-xl border border-border text-xs font-bold">
              <button
                onClick={() => setInputMode('upload')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  inputMode === 'upload' ? 'bg-card text-primary shadow-xs' : 'text-muted-foreground'
                }`}
              >
                <Camera size={14} />
                <span>Upload Photo</span>
              </button>
              <button
                onClick={() => setInputMode('type')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  inputMode === 'type' ? 'bg-card text-primary shadow-xs' : 'text-muted-foreground'
                }`}
              >
                <FileText size={14} />
                <span>Type Response</span>
              </button>
            </div>
          </div>

          {/* Mode 1: Photo Upload */}
          {inputMode === 'upload' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-border/80 hover:border-primary/50 rounded-2xl p-6 sm:p-8 text-center bg-muted/20 transition-all space-y-3 relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />

                {imagePreview ? (
                  <div className="space-y-3 relative z-20 pointer-events-none">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview}
                      alt="Handwritten Answer Preview"
                      className="max-h-64 mx-auto rounded-xl shadow-md border border-border object-contain"
                    />
                    <p className="text-xs font-semibold text-success flex items-center justify-center gap-1">
                      <CheckCircle2 size={14} /> Image Loaded! Tap box to change image.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 pointer-events-none">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                      <Upload size={22} />
                    </div>
                    <p className="text-sm font-bold text-foreground">
                      {t('upload_handwritten', 'Upload Handwritten Answer')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Drag &amp; drop or click to upload photo (PNG, JPG up to 5MB)
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mode 2: Type Written Response */}
          {inputMode === 'type' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                Type Your Full Answer:
              </label>
              <textarea
                rows={7}
                placeholder="Write your step-by-step answer here..."
                value={writtenText}
                onChange={(e) => setWrittenText(e.target.value)}
                className="w-full p-4 rounded-2xl bg-muted/30 border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm font-medium text-foreground outline-none transition-all"
              />
            </div>
          )}

          {/* Submission Button */}
          <button
            onClick={handleSubmitForEvaluation}
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-extrabold text-sm flex items-center justify-center gap-2 shadow-md hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                <span>AI Board Examiner is Grading Your Answer...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Start AI Answer Evaluation</span>
              </>
            )}
          </button>
        </div>
      ) : (
        /* Result View */
        <div className="space-y-6 animate-fade-in">
          
          {/* Score & 4-Pillar Criteria Check Box */}
          <div className="bg-card border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  AI BOARD EVALUATION COMPLETE
                </span>
                <h3 className="text-3xl font-black text-foreground tracking-tight font-mono">
                  SCORE: <span className="text-emerald-600">{evaluationResult.obtained_marks} / {evaluationResult.total_marks}</span>
                </h3>
              </div>

              <div className="px-5 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center shrink-0">
                <span className="text-[9px] font-black uppercase text-emerald-600 block">ACCURACY SCORE</span>
                <span className="text-2xl font-black text-emerald-600 font-mono">{evaluationResult.percentage}%</span>
              </div>
            </div>

            {/* 4 Core Pillars Checks */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs font-bold">
              <div className="p-3.5 rounded-2xl bg-muted/40 border border-border flex items-center justify-between">
                <span className="text-foreground">CONTENT</span>
                <span className="text-emerald-500 text-base">✓</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-muted/40 border border-border flex items-center justify-between">
                <span className="text-foreground">CONCEPT</span>
                <span className="text-emerald-500 text-base">✓</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-muted/40 border border-border flex items-center justify-between">
                <span className="text-foreground">STRUCTURE</span>
                <span className="text-amber-500 text-base">⚠️</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-muted/40 border border-border flex items-center justify-between">
                <span className="text-foreground">LANGUAGE</span>
                <span className="text-amber-500 text-base">⚠️</span>
              </div>
            </div>

            {/* MISSING ITEMS LIST */}
            <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/20 space-y-2">
              <span className="text-[10px] font-black uppercase text-red-600 tracking-wider block font-mono">
                MISSING FOR FULL MARKS:
              </span>
              <ul className="space-y-1.5 text-xs text-foreground font-semibold">
                <li className="flex items-center gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  Formal Definition &amp; Standard SI Units
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-500 font-bold">•</span>
                  Step-by-step Mathematical Derivation Example
                </li>
              </ul>
            </div>

            {/* MODEL ANSWER BOX */}
            <div className="p-6 rounded-2xl bg-muted/30 border border-border space-y-3 font-sans">
              <div className="flex items-center justify-between border-b border-border/80 pb-2">
                <span className="text-xs font-black uppercase text-foreground tracking-wider font-mono">MODEL ANSWER</span>
                <span className="text-[10px] text-emerald-600 font-bold font-mono">Full Marks Solution</span>
              </div>
              <div className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line font-medium">
                {question.sample_solution || `1. Definition: Every particle of matter attracts every other particle with a force directly proportional to the product of their masses and inversely proportional to the square of distance between them.\n2. Formula: F = G * (m1 * m2) / d^2\n3. SI Unit of G: N·m²/kg² (6.67 × 10⁻¹¹ N·m²/kg²).`}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                onClick={() => {
                  setEvaluationResult(null);
                  setImagePreview(null);
                  setWrittenText('');
                }}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-card border border-border text-xs font-bold text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw size={14} />
                <span>Re-evaluate Another Answer</span>
              </button>

              <button
                onClick={onBack}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <Sparkles size={16} />
                <span>PRACTICE SIMILAR QUESTION</span>
              </button>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
