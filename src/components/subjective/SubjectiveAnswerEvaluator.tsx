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
          {/* Score Summary Banner */}
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
            <div className="grid md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-8 space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success-light text-success text-xs font-extrabold">
                  <CheckCircle2 size={14} /> Evaluation Complete
                </div>
                <h3 className="text-2xl font-black text-foreground">
                  Score: {evaluationResult.obtained_marks} / {evaluationResult.total_marks} Marks ({evaluationResult.percentage}%)
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {evaluationResult.feedback}
                </p>
              </div>

              {/* Score Circular Gauge Badge */}
              <div className="md:col-span-4 flex items-center justify-center md:justify-end">
                <div className="w-28 h-28 rounded-full bg-primary/10 border-4 border-primary flex flex-col items-center justify-center text-center shadow-xs">
                  <span className="text-2xl font-black text-primary leading-none">
                    {evaluationResult.percentage}%
                  </span>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mt-1">
                    {evaluationResult.obtained_marks}/{evaluationResult.total_marks} Marks
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Criteria & Step Marks Breakdown */}
          {evaluationResult.rubric_breakdown && evaluationResult.rubric_breakdown.length > 0 && (
            <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
              <h4 className="text-base font-extrabold text-foreground flex items-center gap-2 border-b border-border pb-3">
                <Layers size={18} className="text-primary" />
                <span>Step Marks &amp; Criteria Breakdown</span>
              </h4>

              <div className="space-y-3">
                {evaluationResult.rubric_breakdown.map((r, idx) => {
                  const pct = Math.round((r.score / r.max_marks) * 100);
                  return (
                    <div key={idx} className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-foreground">{r.criterion}</span>
                        <span className="text-primary font-black">
                          {r.score} / {r.max_marks} Marks
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            pct >= 80 ? 'bg-success' : pct >= 50 ? 'bg-amber-500' : 'bg-error'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                        />
                      </div>

                      {r.feedback && (
                        <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                          {r.feedback}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Suggestions for Full Marks */}
          {evaluationResult.suggestions && evaluationResult.suggestions.length > 0 && (
            <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
              <h4 className="text-base font-extrabold text-foreground flex items-center gap-2 border-b border-border pb-3">
                <Award size={18} className="text-amber-500" />
                <span>How to Get Full {evaluationResult.total_marks}/{evaluationResult.total_marks} Marks in NEB Board</span>
              </h4>

              <ul className="space-y-2.5">
                {evaluationResult.suggestions.map((sug, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs font-semibold text-foreground bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                    <Sparkles size={15} className="text-amber-600 shrink-0 mt-0.5" />
                    <span>{sug}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Reset Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => {
                setEvaluationResult(null);
                setImagePreview(null);
                setWrittenText('');
              }}
              className="px-5 py-2.5 rounded-xl bg-card border border-border text-xs font-bold text-foreground hover:bg-muted transition-colors flex items-center gap-2"
            >
              <RefreshCw size={14} />
              <span>Re-evaluate Another Answer</span>
            </button>

            <button
              onClick={onBack}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md hover:bg-primary/90 transition-all"
            >
              Back to Subjective Questions List
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
