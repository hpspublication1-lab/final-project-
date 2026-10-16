'use client';

import React, { useState } from 'react';
import { X, Shield, AlertCircle, Send, CheckCircle2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { DisputeCategory } from '@/lib/security/assessmentIntegrity';

interface StudentAppealModalProps {
  evaluationId: string;
  questionId: string;
  questionText: string;
  currentMarks: number;
  totalMarks: number;
  onClose: () => void;
  onAppealSubmitted: (ticketId: string) => void;
}

export default function StudentAppealModal({
  evaluationId,
  questionId,
  questionText,
  currentMarks,
  totalMarks,
  onClose,
  onAppealSubmitted,
}: StudentAppealModalProps) {
  const [category, setCategory] = useState<DisputeCategory>('ocr_misread');
  const [rationale, setRationale] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubmitAppeal = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rationale.trim() || rationale.trim().length < 10) {
      toast.error('Please describe what was misread or why marks should be adjusted (minimum 10 characters).');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/subjective/appeal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evaluationId,
          questionId,
          studentRationale: rationale.trim(),
          category,
          originalMarksAwarded: currentMarks,
          totalPossibleMarks: totalMarks,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit appeal.');
      }

      toast.success('Appeal submitted! A certified faculty member will re-evaluate your answer.');
      onAppealSubmitted(data.ticket.appealId);
      onClose();
    } catch (err: any) {
      console.error('Submit appeal error:', err);
      toast.error(err.message || 'Could not submit appeal. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-card border border-border w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Shield size={18} />
            </div>
            <div>
              <span className="text-[10px] font-mono font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Assessment Integrity Policy
              </span>
              <h3 className="text-base font-bold text-foreground">
                Request Faculty Re-Evaluation
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

        {/* Current Score Context */}
        <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-1 text-xs">
          <div className="flex justify-between items-center text-foreground font-semibold">
            <span className="line-clamp-1">{questionText}</span>
            <span className="font-mono shrink-0 ml-2">
              Current: <strong>{currentMarks}</strong> / {totalMarks} Marks
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            AI feedback is formative. Certified board examiners review all disputed answers against the official marking scheme.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmitAppeal} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              Reason for Appeal:
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as DisputeCategory)}
              className="w-full p-3 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-hidden focus:border-primary"
            >
              <option value="ocr_misread">
                Handwriting OCR Error (misread numbers, signs, formulas)
              </option>
              <option value="valid_alternate_method">
                Valid Alternate Scientific Method / Derivation Used
              </option>
              <option value="incorrect_rubric_application">
                Rubric Criteria Met But Point Not Awarded
              </option>
              <option value="partial_credit_dispute">
                Partial Step Credit Discrepancy
              </option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">
              Your Explanation:
            </label>
            <textarea
              rows={4}
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="Explain specifically which step or equation was misread (e.g. 'In step 2, my handwriting shows 6800 km, but the transcription read 6000 km...')"
              className="w-full p-3 rounded-xl border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary"
            />
          </div>

          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300 space-y-1">
            <strong>Audit &amp; Verification Notice:</strong>
            <p>
              Your appeal freezes this formative evaluation and sends the original high-resolution handwriting image, the OCR transcript diff, and the rubric breakdown directly to the teacher review queue.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="btn-secondary text-xs py-2.5 px-4 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary text-xs py-2.5 px-5 rounded-xl font-bold flex items-center gap-2 cursor-pointer shadow-md"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>Submit Appeal</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
