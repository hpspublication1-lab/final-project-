'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import {
  FileText, CheckCircle2, AlertCircle, Clock, Search, ArrowLeft,
  Sparkles, Check, Edit3, Send, Shield, User, Award, Eye,
  BookOpen, RefreshCw, Loader2, Filter, AlertTriangle
} from 'lucide-react';
import { MathText } from '@/components/MathText';
import toast from 'react-hot-toast';
import { toast as sonnerToast } from 'sonner';

interface RubricCriterion {
  criterion: string;
  score: number;
  maxMarks: number;
  feedback: string;
}

interface SubjectiveSubmission {
  id: string;
  questionId: string;
  studentId: string;
  studentName?: string;
  subject: string;
  questionText: string;
  sampleSolution: string;
  studentAnswerText?: string;
  studentImageUrl?: string;
  totalMarks: number;
  aiDraftScore: number;
  aiDraftFeedback: string;
  aiRubricBreakdown: RubricCriterion[];
  teacherScore?: number;
  teacherFeedback?: string;
  status: 'pending_review' | 'teacher_reviewed' | 'published';
  isAiDraft: boolean;
  publishedAt?: string;
  createdAt: string;
  hasPendingAppeal?: boolean;
  appealDetails?: {
    appealId: string;
    category: string;
    studentRationale: string;
    createdAt: string;
  };
}

export default function TeacherEvaluationsClient() {
  const [isDark, setIsDark] = useState(false);
  const [evaluations, setEvaluations] = useState<SubjectiveSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending_review' | 'published'>('pending_review');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<SubjectiveSubmission | null>(null);

  // Active review editing states
  const [activeRubric, setActiveRubric] = useState<RubricCriterion[]>([]);
  const [teacherFeedback, setTeacherFeedback] = useState('');
  const [saving, setSaving] = useState(false);

  // Fetch queue from API
  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/exams/subjective');
      const data = await res.json();
      if (res.ok && data.evaluations) {
        setEvaluations(data.evaluations);
      }
    } catch (err) {
      console.error('Failed to fetch subjective queue:', err);
      toast.error('Failed to load evaluation queue.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Open item in review drawer
  const handleOpenReview = (item: SubjectiveSubmission) => {
    setSelectedItem(item);
    setActiveRubric(
      item.aiRubricBreakdown.map((r) => ({
        ...r,
        score: item.teacherScore !== undefined ? r.score : r.score, // initial score from AI or past edit
      }))
    );
    setTeacherFeedback(item.teacherFeedback || item.aiDraftFeedback || '');
  };

  // Update criterion score
  const handleScoreChange = (index: number, newScore: number) => {
    setActiveRubric((prev) => {
      const next = [...prev];
      const max = next[index].maxMarks;
      next[index] = {
        ...next[index],
        score: Math.max(0, Math.min(max, Math.round(newScore * 10) / 10)),
      };
      return next;
    });
  };

  // Update criterion teacher feedback
  const handleCriterionFeedbackChange = (index: number, feedback: string) => {
    setActiveRubric((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], feedback };
      return next;
    });
  };

  // Calculated overall teacher score
  const computedTotalScore = activeRubric.reduce((sum, r) => sum + r.score, 0);

  // Save / Publish handler
  const handleSaveEvaluation = async (publish: boolean) => {
    if (!selectedItem) return;
    setSaving(true);

    try {
      const res = await fetch('/api/exams/subjective', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evaluationId: selectedItem.id,
          teacherScore: Math.round(computedTotalScore * 10) / 10,
          teacherFeedback,
          rubricBreakdown: activeRubric,
          publish,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        sonnerToast.success(
          publish
            ? 'Final score published! Student report updated.'
            : 'Evaluation draft saved successfully.'
        );
        // Refresh queue
        await fetchQueue();
        setSelectedItem(null);
      } else {
        throw new Error(data.error || 'Failed to save evaluation');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error updating evaluation');
    } finally {
      setSaving(false);
    }
  };

  // Filter queue
  const filteredItems = evaluations.filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.studentName?.toLowerCase().includes(q) ||
        item.subject.toLowerCase().includes(q) ||
        item.questionText.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-primary/10 text-primary">
                Teacher Dashboard
              </span>
              <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                <Shield size={12} className="text-primary" /> Official Board Evaluation
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-2.5">
              <FileText className="text-primary" size={28} /> SEE Subjective Evaluation Queue
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
              Verify AI-assisted draft grading, adjust rubric marks, provide handwritten notes/feedback, and
              publish authoritative board scores.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={fetchQueue}
              disabled={loading}
              className="btn-secondary text-xs py-2.5 px-4 rounded-2xl font-bold flex items-center gap-2"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh Queue</span>
            </button>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-card border border-border">
            <button
              onClick={() => setStatusFilter('pending_review')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                statusFilter === 'pending_review'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Pending Verification ({evaluations.filter((e) => e.status === 'pending_review').length})
            </button>
            <button
              onClick={() => setStatusFilter('published')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                statusFilter === 'published'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Published ({evaluations.filter((e) => e.status === 'published').length})
            </button>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All Submissions ({evaluations.length})
            </button>
          </div>

          <div className="relative max-w-xs w-full">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search student, subject, question..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-2xl border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary"
            />
          </div>
        </div>

        {/* Submissions List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 size={32} className="animate-spin text-primary" />
            <p className="text-xs text-muted-foreground font-semibold">Loading subjective submissions...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 bg-card border border-border rounded-3xl p-8">
            <CheckCircle2 size={40} className="text-emerald-500 mx-auto mb-3 opacity-80" />
            <p className="text-base font-bold text-foreground">Queue is completely clear!</p>
            <p className="text-xs text-muted-foreground mt-1">
              No pending subjective evaluations matching this filter.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredItems.map((item) => {
              const isPending = item.status === 'pending_review';
              return (
                <div
                  key={item.id}
                  className="bg-card border border-border hover:border-primary/40 rounded-3xl p-6 transition-all shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-xs font-black px-3 py-0.5 rounded-full bg-primary/10 text-primary">
                        {item.subject}
                      </span>
                      {isPending ? (
                        <span className="text-xs font-bold px-3 py-0.5 rounded-full bg-amber-500/10 text-amber-600 flex items-center gap-1">
                          <Sparkles size={11} /> AI-Drafted (Needs Teacher Review)
                        </span>
                      ) : (
                        <span className="text-xs font-bold px-3 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center gap-1">
                          <Check size={11} /> Verified &amp; Published
                        </span>
                      )}
                      {item.hasPendingAppeal && (
                        <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 flex items-center gap-1">
                          <AlertTriangle size={11} /> Student Appeal: {item.appealDetails?.category || 'Dispute'}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        Submitted by: <strong className="text-foreground">{item.studentName}</strong>
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2">
                      <MathText text={item.questionText} />
                    </h3>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                      <span>Total: <strong>{item.totalMarks} Marks</strong></span>
                      <span>
                        AI Draft Score:{' '}
                        <strong className="text-primary">{item.aiDraftScore} / {item.totalMarks}</strong>
                      </span>
                      {item.teacherScore !== undefined && (
                        <span>
                          Final Faculty Score:{' '}
                          <strong className="text-emerald-600">{item.teacherScore} / {item.totalMarks}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-3">
                    <button
                      onClick={() => handleOpenReview(item)}
                      className="btn-primary py-2.5 px-5 rounded-2xl text-xs font-black flex items-center gap-2 shadow-xs"
                    >
                      <Edit3 size={14} />
                      <span>{isPending ? 'Verify & Grade' : 'View / Edit Score'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review & Grading Drawer / Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setSelectedItem(null)} />
          <div className="relative bg-card border-l border-border w-full max-w-3xl h-full flex flex-col shadow-2xl overflow-hidden">
            {/* Drawer Header */}
            <div className="p-6 border-b border-border flex items-center justify-between gap-4 bg-muted/20">
              <div>
                <span className="text-xs font-black uppercase text-primary px-2.5 py-0.5 rounded-full bg-primary/10">
                  {selectedItem.subject}
                </span>
                <h2 className="text-lg font-black text-foreground mt-1">
                  Evaluating: {selectedItem.studentName}
                </h2>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60"
              >
                ✕
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Question Statement */}
              <div className="bg-muted/40 rounded-2xl p-4 border border-border/60 space-y-2">
                <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                  Question Statement ({selectedItem.totalMarks} Marks)
                </p>
                <div className="text-sm font-bold text-foreground leading-relaxed">
                  <MathText text={selectedItem.questionText} />
                </div>
              </div>

              {/* Student's Answer */}
              <div className="bg-card border-2 border-primary/20 rounded-2xl p-5 space-y-2">
                <p className="text-[11px] font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <User size={13} /> Student&apos;s Submitted Solution
                </p>
                <p className="text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-wrap font-mono bg-muted/30 p-3 rounded-xl">
                  {selectedItem.studentAnswerText || 'No text submitted.'}
                </p>
              </div>

              {/* Student Appeal Notice & Dispute Details */}
              {selectedItem.hasPendingAppeal && selectedItem.appealDetails && (
                <div className="bg-red-500/10 border-2 border-red-500/40 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between text-red-700 dark:text-red-400">
                    <span className="text-xs font-black tracking-wide uppercase flex items-center gap-1.5">
                      <AlertTriangle size={15} /> Student Dispute / Appeal Details
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded bg-red-500/20 text-red-700 dark:text-red-300">
                      Category: {selectedItem.appealDetails.category}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-card border border-red-500/20 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block font-mono">
                      Student Explanation:
                    </span>
                    <p className="text-xs font-medium text-foreground leading-relaxed">
                      "{selectedItem.appealDetails.studentRationale}"
                    </p>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Please verify the student's handwritten script against the CDC rubric steps below. Adjusting scores and publishing will resolve this appeal.
                  </p>
                </div>
              )}

              {/* Mandatory AI Draft Label Banner */}
              <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <Sparkles size={16} />
                  <span className="text-xs font-black tracking-wide uppercase">
                    AI-Assisted Draft Evaluation (Pending Teacher Verification)
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {selectedItem.aiDraftFeedback}
                </p>
              </div>

              {/* Rubric Step-by-Step Scoring Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black uppercase tracking-wider text-foreground">
                    Rubric Step Breakdown &amp; Teacher Override
                  </p>
                  <span className="text-xs font-black text-primary">
                    Total: {Math.round(computedTotalScore * 10) / 10} / {selectedItem.totalMarks} Marks
                  </span>
                </div>

                <div className="space-y-3">
                  {activeRubric.map((criterion, idx) => (
                    <div
                      key={idx}
                      className="bg-card border border-border rounded-2xl p-4 space-y-3 shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-xs font-bold text-foreground">
                            Step {idx + 1}: {criterion.criterion}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {criterion.feedback}
                          </p>
                        </div>

                        {/* Marks Input */}
                        <div className="flex items-center gap-2 shrink-0">
                          <label className="text-[10px] uppercase font-bold text-muted-foreground">
                            Score / {criterion.maxMarks}:
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max={criterion.maxMarks}
                            value={criterion.score}
                            onChange={(e) => handleScoreChange(idx, parseFloat(e.target.value) || 0)}
                            className="w-16 p-1.5 rounded-xl border border-primary/40 bg-muted/40 text-center font-black text-xs text-foreground focus:outline-hidden focus:border-primary"
                          />
                        </div>
                      </div>

                      {/* Step Feedback Note */}
                      <input
                        type="text"
                        placeholder="Faculty note on this specific step (optional)..."
                        value={criterion.feedback}
                        onChange={(e) => handleCriterionFeedbackChange(idx, e.target.value)}
                        className="w-full text-xs p-2 rounded-xl border border-border bg-card text-muted-foreground focus:text-foreground focus:outline-hidden focus:border-primary"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Overall Faculty Feedback */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-foreground">
                  Overall Faculty Feedback &amp; Exam Advice
                </label>
                <textarea
                  rows={3}
                  value={teacherFeedback}
                  onChange={(e) => setTeacherFeedback(e.target.value)}
                  placeholder="Provide personalized actionable tips for board exam presentation..."
                  className="w-full text-xs p-3 rounded-2xl border border-border bg-card text-foreground focus:outline-hidden focus:border-primary leading-relaxed"
                />
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-6 border-t border-border bg-muted/20 flex items-center justify-between gap-3">
              <div className="text-xs">
                <p className="text-muted-foreground font-semibold">Calculated Score:</p>
                <p className="text-base font-black text-primary">
                  {Math.round(computedTotalScore * 10) / 10} / {selectedItem.totalMarks} Marks
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => handleSaveEvaluation(false)}
                  disabled={saving}
                  className="btn-secondary py-2.5 px-4 rounded-xl text-xs font-bold"
                >
                  {saving ? <Loader2 size={13} className="animate-spin" /> : 'Save as Draft'}
                </button>
                <button
                  onClick={() => handleSaveEvaluation(true)}
                  disabled={saving}
                  className="btn-primary py-2.5 px-5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md"
                >
                  {saving ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <>
                      <Send size={13} />
                      <span>Publish Final Score</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
