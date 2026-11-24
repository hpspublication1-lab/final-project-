'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles, Plus, Search, ExternalLink, RefreshCw, GitBranch,
  CheckCircle2, Clock, AlertTriangle, ShieldCheck, ArrowRight, BookOpen
} from 'lucide-react';
import { toast } from 'sonner';

interface LessonAdminItem {
  id: string;
  title: string;
  slug: string;
  subject: string;
  chapter: string;
  topic: string;
  currentRevisionNumber: number;
  status: 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'SUPERSEDED' | 'ARCHIVED';
  publicationId?: string;
  publishedAt?: string;
  createdAt: string;
}

export default function VisualLessonsManagerClient() {
  const [lessons, setLessons] = useState<LessonAdminItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // New Lesson Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newSlug, setNewSlug] = useState<string>('');
  const [newSubject, setNewSubject] = useState<string>('Biology — Zoology');
  const [newChapter, setNewChapter] = useState<string>('Human Physiology');
  const [newTopic, setNewTopic] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchLessons = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/cee/admin/lessons');
      const data = await res.json();
      if (res.ok && data.data) {
        setLessons(data.data);
      } else {
        toast.error(data.error?.message || 'Failed to fetch visual lessons');
      }
    } catch {
      toast.error('Network error loading visual lessons.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLessons();
  }, []);

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSlug.trim()) {
      toast.error('Please provide a lesson title and slug.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/cee/admin/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          slug: newSlug.trim(),
          subject: newSubject,
          chapter: newChapter,
          topic: newTopic.trim() || newTitle.trim(),
        }),
      });

      const json = await res.json();
      if (res.ok && json.data) {
        toast.success(`Draft lesson '${json.data.title}' created (Revision 1).`);
        setIsModalOpen(false);
        setNewTitle('');
        setNewSlug('');
        setNewTopic('');
        fetchLessons();
      } else {
        toast.error(json.error?.message || 'Failed to create lesson.');
      }
    } catch {
      toast.error('Failed to create lesson due to a network error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBranchRevision = async (lesson: LessonAdminItem) => {
    try {
      const res = await fetch(`/api/cee/admin/lessons/${lesson.id}/revisions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const json = await res.json();
      if (res.ok && json.data) {
        toast.success(`Branched new Revision ${json.data.revisionNumber} (DRAFT) for '${lesson.title}'.`);
        fetchLessons();
      } else {
        toast.error(json.error?.message || 'Failed to branch revision.');
      }
    } catch {
      toast.error('Network error while branching revision.');
    }
  };

  const handleSubmitForReview = async (lesson: LessonAdminItem) => {
    try {
      const revId = `rev_${lesson.id}_v${lesson.currentRevisionNumber}`;
      const res = await fetch(`/api/cee/admin/lesson-revisions/${revId}/submit`, {
        method: 'POST',
      });
      const json = await res.json();
      if (res.ok && json.data) {
        toast.success(`Submitted '${lesson.title}' Revision ${lesson.currentRevisionNumber} to Academic Review Queue.`);
        fetchLessons();
      } else {
        toast.error(json.error?.message || 'Failed to submit for review.');
      }
    } catch {
      toast.error('Network error submitting revision.');
    }
  };

  const filteredLessons = lessons.filter((l) => {
    const matchesSearch =
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.topic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: LessonAdminItem['status']) => {
    switch (status) {
      case 'PUBLISHED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> Published
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <ShieldCheck className="w-3.5 h-3.5" /> Approved
          </span>
        );
      case 'IN_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" /> In Review
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            <GitBranch className="w-3.5 h-3.5" /> Draft
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-900 text-slate-400 border border-slate-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 mb-1">
              <Link href="/admin" className="hover:underline text-slate-400">Admin</Link>
              <span>/</span>
              <span className="text-emerald-400">CEE Visual Intelligence Studio</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <Sparkles className="w-7 h-7 text-emerald-400" />
              CEE Visual Lessons Studio
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Author, branch, review, and publish interactive 3D simulations and anatomical models for Nepal Medical Education Commission CEE Entrance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/cee-visual/reviews"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Review Queue
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4" />
              New Visual Lesson
            </button>
          </div>
        </div>

        {/* Quick KPI Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur">
            <p className="text-xs text-slate-400 font-medium">Total Visual Lessons</p>
            <p className="text-2xl font-black text-white mt-1">{lessons.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur">
            <p className="text-xs text-emerald-400 font-medium">Published & Active</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">
              {lessons.filter((l) => l.status === 'PUBLISHED').length}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur">
            <p className="text-xs text-amber-400 font-medium">In Academic Review</p>
            <p className="text-2xl font-black text-amber-400 mt-1">
              {lessons.filter((l) => l.status === 'IN_REVIEW').length}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur">
            <p className="text-xs text-slate-400 font-medium">Draft Revisions</p>
            <p className="text-2xl font-black text-slate-300 mt-1">
              {lessons.filter((l) => l.status === 'DRAFT').length}
            </p>
          </div>
        </div>

        {/* Search, Filter & Refresh Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/40 border border-slate-800">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search lessons by title, slug, or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="APPROVED">Approved</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="DRAFT">Draft</option>
            </select>
            <button
              onClick={fetchLessons}
              title="Refresh lessons"
              className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Lessons List Table */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Lesson Title & Topic</th>
                  <th className="py-3 px-4">Subject & Chapter</th>
                  <th className="py-3 px-4">Revision</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredLessons.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No visual lessons found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredLessons.map((lesson) => (
                    <tr key={lesson.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{lesson.title}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          slug: {lesson.slug}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-200">{lesson.subject}</div>
                        <div className="text-[11px] text-slate-500">{lesson.chapter}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-300">
                        Rev {lesson.currentRevisionNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        {getStatusBadge(lesson.status)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/learn/visual/${lesson.slug}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] transition"
                            title="Preview lesson in player"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Preview
                          </Link>

                          {lesson.status === 'DRAFT' && (
                            <button
                              onClick={() => handleSubmitForReview(lesson)}
                              className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-medium transition"
                            >
                              Submit Review
                            </button>
                          )}

                          <button
                            onClick={() => handleBranchRevision(lesson)}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition"
                            title="Branch a new draft revision"
                          >
                            Branch Rev
                          </button>
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

      {/* New Visual Lesson Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                Create New CEE Visual Lesson
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLesson} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Lesson Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ear: Cochlear Ultrastructure & Organ of Corti"
                  value={newTitle}
                  onChange={(e) => {
                    setNewTitle(e.target.value);
                    if (!newSlug) {
                      setNewSlug(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, '-')
                          .replace(/^-|-$/g, '')
                      );
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">URL Slug</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ear-cochlea"
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Subject</label>
                  <select
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Biology — Zoology">Biology — Zoology</option>
                    <option value="Biology — Botany">Biology — Botany</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Physics">Physics</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Chapter</label>
                  <input
                    type="text"
                    value={newChapter}
                    onChange={(e) => setNewChapter(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Curriculum Topic</label>
                <input
                  type="text"
                  placeholder="e.g. Sensory Reception & Mechanotransduction"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Draft Lesson'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
