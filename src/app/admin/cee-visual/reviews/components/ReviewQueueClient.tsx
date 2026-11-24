'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck, CheckCircle2, Clock, AlertTriangle, RefreshCw,
  Search, ArrowLeft, MessageSquare, Send, Award, FileCheck2
} from 'lucide-react';
import { toast } from 'sonner';

interface ReviewTask {
  id: string;
  revisionId: string;
  lessonId: string;
  lessonTitle: string;
  revisionNumber: number;
  reviewType: 'SCIENTIFIC' | 'VISUAL' | 'RIGHTS_ACCESSIBILITY';
  status: 'PENDING' | 'APPROVED' | 'CHANGES_REQUESTED';
  requestedAt: string;
  reviewedAt?: string;
  reviewerComments?: string;
}

export default function ReviewQueueClient() {
  const [tasks, setTasks] = useState<ReviewTask[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [gateFilter, setGateFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Decision Modal State
  const [activeTask, setActiveTask] = useState<ReviewTask | null>(null);
  const [decision, setDecision] = useState<'APPROVED' | 'CHANGES_REQUESTED'>('APPROVED');
  const [comments, setComments] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/cee/admin/reviews');
      const data = await res.json();
      if (res.ok && data.data) {
        setTasks(data.data);
      } else {
        toast.error(data.error?.message || 'Failed to fetch review queue');
      }
    } catch {
      toast.error('Network error loading review queue.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleOpenDecisionModal = (task: ReviewTask) => {
    setActiveTask(task);
    setDecision('APPROVED');
    setComments(task.reviewerComments || '');
  };

  const handleSubmitDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTask) return;

    if (decision === 'CHANGES_REQUESTED' && comments.trim().length < 5) {
      toast.error('Please provide at least 5 characters of feedback when requesting changes.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/cee/admin/reviews/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: activeTask.id,
          decision,
          comments: comments.trim(),
        }),
      });

      const json = await res.json();
      if (res.ok && json.data) {
        toast.success(`Review decision '${decision}' successfully recorded.`);
        setActiveTask(null);
        fetchReviews();
      } else {
        toast.error(json.error?.message || 'Failed to record decision.');
      }
    } catch {
      toast.error('Network error while recording decision.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublishLesson = async (task: ReviewTask) => {
    try {
      const res = await fetch('/api/cee/admin/publications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: task.lessonId,
          revisionId: task.revisionId,
          idempotencyKey: `pub_idem_${Date.now()}`,
        }),
      });
      const json = await res.json();
      if (res.ok && json.data) {
        toast.success(`Lesson '${task.lessonTitle}' published successfully!`);
        fetchReviews();
      } else {
        toast.error(json.error?.message || 'Failed to publish lesson.');
      }
    } catch {
      toast.error('Network error publishing lesson.');
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesGate = gateFilter === 'ALL' || t.reviewType === gateFilter;
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesGate && matchesStatus;
  });

  const getGateBadge = (gate: ReviewTask['reviewType']) => {
    switch (gate) {
      case 'SCIENTIFIC':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            Scientific Accuracy
          </span>
        );
      case 'VISUAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            Visual & 3D Geometry
          </span>
        );
      case 'RIGHTS_ACCESSIBILITY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/30">
            Rights & Accessibility
          </span>
        );
    }
  };

  const getStatusBadge = (status: ReviewTask['status']) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" /> Approved
          </span>
        );
      case 'CHANGES_REQUESTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400">
            <AlertTriangle className="w-3.5 h-3.5" /> Changes Requested
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400">
            <Clock className="w-3.5 h-3.5" /> Pending Review
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 mb-1">
              <Link href="/admin/cee-visual/lessons" className="hover:underline text-slate-400 flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Lessons Studio
              </Link>
              <span>/</span>
              <span className="text-emerald-400">Academic Review Queue</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <ShieldCheck className="w-7 h-7 text-emerald-400" />
              Academic Multi-Gate Review Queue
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Independent sign-offs for Scientific Accuracy, Visual Geometry, and Rights & Accessibility before immutable publication.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchReviews}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Queue
            </button>
          </div>
        </div>

        {/* Gate Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <p className="text-xs text-slate-400 font-medium">Total Review Tasks</p>
            <p className="text-2xl font-black text-white mt-1">{tasks.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <p className="text-xs text-emerald-400 font-medium">Scientific Gates</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">
              {tasks.filter((t) => t.reviewType === 'SCIENTIFIC').length}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <p className="text-xs text-cyan-400 font-medium">Visual & 3D Gates</p>
            <p className="text-2xl font-black text-cyan-400 mt-1">
              {tasks.filter((t) => t.reviewType === 'VISUAL').length}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <p className="text-xs text-purple-400 font-medium">Rights & Accessibility</p>
            <p className="text-2xl font-black text-purple-400 mt-1">
              {tasks.filter((t) => t.reviewType === 'RIGHTS_ACCESSIBILITY').length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-slate-900/40 border border-slate-800">
          <div>
            <label className="text-slate-500 text-[11px] uppercase tracking-wider block mb-1 font-mono">
              Review Gate
            </label>
            <select
              value={gateFilter}
              onChange={(e) => setGateFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Review Gates</option>
              <option value="SCIENTIFIC">Scientific Accuracy</option>
              <option value="VISUAL">Visual & 3D Geometry</option>
              <option value="RIGHTS_ACCESSIBILITY">Rights & Accessibility</option>
            </select>
          </div>

          <div>
            <label className="text-slate-500 text-[11px] uppercase tracking-wider block mb-1 font-mono">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="CHANGES_REQUESTED">Changes Requested</option>
            </select>
          </div>
        </div>

        {/* Task Table */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Lesson & Revision</th>
                  <th className="py-3 px-4">Review Gate</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Reviewer Notes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No review tasks found matching the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{task.lessonTitle}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          Rev {task.revisionNumber} ({task.revisionId})
                        </div>
                      </td>
                      <td className="py-3.5 px-4">{getGateBadge(task.reviewType)}</td>
                      <td className="py-3.5 px-4">{getStatusBadge(task.status)}</td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-[11px] text-slate-400 italic line-clamp-2">
                          {task.reviewerComments || 'No comments logged.'}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenDecisionModal(task)}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition"
                          >
                            Review
                          </button>

                          {task.status === 'APPROVED' && (
                            <button
                              onClick={() => handlePublishLesson(task)}
                              className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-semibold transition"
                              title="Publish Approved Lesson Snapshot"
                            >
                              Publish
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Decision Modal */}
      {activeTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  Academic Review Decision
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  {activeTask.lessonTitle} — Rev {activeTask.revisionNumber}
                </p>
              </div>
              <button
                onClick={() => setActiveTask(null)}
                className="text-slate-400 hover:text-slate-200 text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitDecision} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Review Gate</label>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-emerald-400">
                  {activeTask.reviewType}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Decision</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDecision('APPROVED')}
                    className={`py-2 px-3 rounded-lg border font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                      decision === 'APPROVED'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecision('CHANGES_REQUESTED')}
                    className={`py-2 px-3 rounded-lg border font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                      decision === 'CHANGES_REQUESTED'
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Request Changes
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Explanatory Comments & Criteria Audit{' '}
                  {decision === 'CHANGES_REQUESTED' && <span className="text-rose-400">*</span>}
                </label>
                <textarea
                  rows={4}
                  required={decision === 'CHANGES_REQUESTED'}
                  placeholder={
                    decision === 'APPROVED'
                      ? 'Note verified syllabus standards, textbook citations, or geometry checks...'
                      : 'Provide explicit reasons and requested revisions for the author...'
                  }
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTask(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Recording...' : 'Record Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
