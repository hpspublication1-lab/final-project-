'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { programTypeField } from '@/lib/courses/programColumn';
import { CourseSelect, courseLabel } from '@/components/admin/CourseSelect';
import { parseCourseId, resolveRowCourse, storedProgramValue } from '@/lib/courses/courseIds';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  ArrowLeft, Plus, Pencil, Trash2, Save, X, FileText,
  ToggleLeft, ToggleRight, Loader2, AlertCircle, CheckCircle2,
  Lock, Unlock, Clock, Hash, Calendar, Award, Shield, BookOpen, Layers,
  Sparkles, RefreshCw, ArrowRight, Check, Search, Eye, Edit3, Send
} from 'lucide-react';
import { CANONICAL_EXAM_CATALOG, ExamCategory } from '@/lib/exams/examRegistry';
import { MathText } from '@/components/MathText';

interface Subject { id: string; name: string; display_name: string; }

interface Exam {
  id: string;
  title: string;
  description: string | null;
  subject_id: string | null;
  duration_minutes: number;
  total_marks: number;
  negative_marking: boolean;
  positive_marks?: number;
  negative_marks?: number;
  category?: ExamCategory;
  is_premium: boolean;
  is_free_diagnostic?: boolean;
  is_active: boolean;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  created_at: string;
  subjects?: { display_name: string; name: string };
}

interface FormState {
  title: string;
  description: string;
  subject_id: string;
  duration_minutes: string;
  total_marks: string;
  category: ExamCategory;
  positive_marks: string;
  negative_marks: string;
  negative_marking: boolean;
  is_premium: boolean;
  is_free_diagnostic: boolean;
  is_active: boolean;
  scheduled_start: string;
  scheduled_end: string;
}

const defaultForm: FormState = {
  title: '',
  description: '',
  subject_id: '',
  duration_minutes: '180',
  total_marks: '200',
  category: 'cee_full_200',
  positive_marks: '1.0',
  negative_marks: '0.25',
  negative_marking: true,
  is_premium: false,
  is_free_diagnostic: false,
  is_active: true,
  scheduled_start: '',
  scheduled_end: '',
};

const CATEGORIES: Array<{ id: ExamCategory; label: string }> = [
  { id: 'cee_full_200', label: 'CEE Full-Length 200-Q Examination' },
  { id: 'cee_subject', label: 'CEE Subject Sprint' },
  { id: 'see_model', label: 'SEE Model Examination' },
  { id: 'see_subject', label: 'SEE Subject Test' },
  { id: 'chapter_test', label: 'Chapter Assessment Drill' },
  { id: 'scheduled_test', label: 'Scheduled Grand Mock' },
  { id: 'practice_test', label: 'Self-Paced Practice Test' },
  { id: 'diagnostic_free', label: 'Free Diagnostic Assessment' },
];

export default function AdminExamsClient() {
  const supabase = createClient();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [course, setCourse] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'blueprints' | 'evaluations'>('blueprints');

  // Teacher Evaluation Queue state
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [evalLoading, setEvalLoading] = useState(false);
  const [evalStatusFilter, setEvalStatusFilter] = useState<'all' | 'pending_review' | 'published'>('pending_review');
  const [evalSearch, setEvalSearch] = useState('');
  const [selectedEval, setSelectedEval] = useState<any | null>(null);
  const [activeRubric, setActiveRubric] = useState<any[]>([]);
  const [teacherFeedbackText, setTeacherFeedbackText] = useState('');
  const [evalSaving, setEvalSaving] = useState(false);

  const fetchEvaluations = useCallback(async () => {
    setEvalLoading(true);
    try {
      const res = await fetch('/api/exams/subjective');
      const data = await res.json();
      if (res.ok && data.evaluations) {
        setEvaluations(data.evaluations);
      }
    } catch (err) {
      console.warn('Error fetching evaluations:', err);
    } finally {
      setEvalLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'evaluations') {
      fetchEvaluations();
    }
  }, [activeTab, fetchEvaluations]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [subsResult, exsResult] = await Promise.all([
      supabase.from('subjects').select('id, name, display_name').order('name'),
      supabase.from('exams').select('*, subjects(display_name, name)').order('created_at', { ascending: false }),
    ]);
    const subs = subsResult.data;
    const exs = exsResult.data;
    const err = exsResult.error;
    if (err) setError(err.message);
    setSubjects(subs || []);

    const mappedExams: Exam[] = (exs || []).map((e: any) => {
      const isSee = (e.title || '').toLowerCase().includes('see');
      return {
        ...e,
        is_active: e.is_published ?? false,
        is_premium: e.is_premium ?? false,
        negative_marking: e.negative_marking ?? !isSee,
        positive_marks: 1.0,
        negative_marks: isSee ? 0.0 : 0.25,
        category: (isSee ? 'see_model' : 'cee_full_200') as ExamCategory,
      };
    });

    setExams(mappedExams);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const showSuccess = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(null), 3000); };

  const openCreate = () => {
    setEditingId(null);
    setForm(defaultForm);
    setCourse('');
    setShowForm(true);
  };

  const openEdit = (exam: Exam) => {
    setEditingId(exam.id);
    setCourse(resolveRowCourse(exam as any) ?? '');
    setForm({
      title: exam.title,
      description: exam.description || '',
      subject_id: exam.subject_id || '',
      duration_minutes: exam.duration_minutes.toString(),
      total_marks: exam.total_marks.toString(),
      category: exam.category || 'cee_full_200',
      positive_marks: (exam.positive_marks ?? 1.0).toString(),
      negative_marks: (exam.negative_marks ?? 0.25).toString(),
      negative_marking: exam.negative_marking,
      is_premium: exam.is_premium,
      is_free_diagnostic: exam.is_free_diagnostic || false,
      is_active: exam.is_active,
      scheduled_start: exam.scheduled_start || '',
      scheduled_end: exam.scheduled_end || '',
    });
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(defaultForm); };

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Title is required'); return; }
    const dur = parseInt(form.duration_minutes);
    const marks = parseInt(form.total_marks);
    if (isNaN(dur) || dur < 1) { setError('Duration must be a positive number'); return; }
    if (isNaN(marks) || marks < 1) { setError('Total marks must be a positive number'); return; }
    const examCourse = parseCourseId(course);
    if (!examCourse) { setError('Choose the course this exam belongs to'); return; }

    setSaving(true);
    setError(null);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      subject_id: form.subject_id || null,
      ...(await programTypeField(supabase, 'exams', storedProgramValue(examCourse))),
      duration_minutes: dur,
      total_marks: marks,
      negative_marking: form.negative_marking,
      is_premium: form.is_premium,
      is_published: form.is_active,
    };

    if (editingId) {
      const { error: err } = await supabase.from('exams').update(payload).eq('id', editingId);
      if (err) setError(err.message);
      else { showSuccess('Exam updated successfully'); closeForm(); fetchData(); }
    } else {
      const { error: err } = await supabase.from('exams').insert(payload);
      if (err) setError(err.message);
      else { showSuccess('Exam created successfully'); closeForm(); fetchData(); }
    }
    setSaving(false);
  };

  const handleOpenReview = (item: any) => {
    setSelectedEval(item);
    setActiveRubric(
      (item.aiRubricBreakdown || []).map((r: any) => ({
        ...r,
        score: r.score !== undefined ? r.score : r.maxMarks,
      }))
    );
    setTeacherFeedbackText(item.teacherFeedback || item.aiDraftFeedback || '');
  };

  const handleRubricScoreChange = (index: number, newScore: number) => {
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

  const handleSaveEvaluation = async (publish: boolean) => {
    if (!selectedEval) return;
    setEvalSaving(true);
    const sumMarks = activeRubric.reduce((acc, r) => acc + (Number(r.score) || 0), 0);
    try {
      const res = await fetch('/api/exams/subjective', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evaluationId: selectedEval.id,
          teacherScore: Math.round(sumMarks * 10) / 10,
          teacherFeedback: teacherFeedbackText,
          rubricBreakdown: activeRubric,
          publish,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showSuccess(publish ? 'Evaluation published to student report!' : 'Teacher draft review saved.');
        await fetchEvaluations();
        setSelectedEval(null);
      } else {
        setError(data.error || 'Failed to update evaluation');
      }
    } catch (err: any) {
      setError(err.message || 'Error updating evaluation');
    } finally {
      setEvalSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error: err } = await supabase.from('exams').delete().eq('id', id);
    if (err) setError(err.message);
    else { showSuccess('Exam deleted'); setDeleteConfirm(null); fetchData(); }
  };

  const handleToggleActive = async (exam: Exam) => {
    const { error: err } = await supabase.from('exams').update({ is_published: !exam.is_active }).eq('id', exam.id);
    if (err) setError(err.message);
    else { showSuccess(`Exam ${exam.is_active ? 'deactivated' : 'activated'}`); fetchData(); }
  };

  const filtered = filterCategory === 'all'
    ? exams
    : exams.filter((e) => e.category === filterCategory);

  const filteredEvaluations = evaluations.filter((item) => {
    if (evalStatusFilter !== 'all' && item.status !== evalStatusFilter) return false;
    if (evalSearch) {
      const q = evalSearch.toLowerCase();
      return (
        item.studentName?.toLowerCase().includes(q) ||
        item.subject?.toLowerCase().includes(q) ||
        item.questionText?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-lg font-black text-foreground">Examination Blueprint &amp; Mock Manager</h1>
            <p className="text-xs text-muted-foreground">Manage CEE 200-Q Mocks, SEE Model Sets, Chapter Drills &amp; Schedules</p>
          </div>
        </div>
        <button onClick={openCreate} className="btn-primary text-xs py-2.5 px-4 rounded-xl font-bold flex items-center gap-2 shadow-xs">
          <Plus size={16} /> Create Examination Blueprint
        </button>
      </div>

      {/* Dual Tab Switcher */}
      <div className="border-b border-border bg-card px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('blueprints')}
            className={`px-4 py-3 text-xs font-black border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'blueprints'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <BookOpen size={15} />
            <span>Examination Blueprints ({exams.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('evaluations')}
            className={`px-4 py-3 text-xs font-black border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'evaluations'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sparkles size={15} />
            <span>Teacher Evaluation Queue</span>
            {evaluations.filter((e) => e.status === 'pending_review').length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                {evaluations.filter((e) => e.status === 'pending_review').length}
              </span>
            )}
          </button>
        </div>

        <Link
          href="/teacher/evaluations"
          className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
        >
          <span>Dedicated Teacher Portal</span>
          <ArrowRight size={12} />
        </Link>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {error && (
          <div className="flex items-center gap-2 bg-error-light text-error px-4 py-3 rounded-2xl text-xs font-semibold">
            <AlertCircle size={16} /> {error}
            <button onClick={() => setError(null)} className="ml-auto"><X size={14} /></button>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 bg-success-light text-success px-4 py-3 rounded-2xl text-xs font-semibold">
            <CheckCircle2 size={16} /> {success}
          </div>
        )}

        {activeTab === 'blueprints' ? (
          <>
            {/* Category Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              filterCategory === 'all' ? 'bg-primary text-white shadow-xs' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            All Blueprints ({exams.length})
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                filterCategory === cat.id ? 'bg-primary text-white shadow-xs' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Create / Edit Form Modal / Drawer */}
        {showForm && (
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="font-black text-foreground text-base">
                  {editingId ? 'Edit Examination Blueprint' : 'Configure New Examination Blueprint'}
                </h2>
                <p className="text-xs text-muted-foreground">Define questions, time duration, and marking policy</p>
              </div>
              <button onClick={closeForm} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted">
                <X size={18} />
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-foreground mb-1.5">Exam Title *</label>
                <input
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-2xl text-xs text-foreground focus:outline-hidden focus:border-primary"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. MEC CEE Grand Mock Examination #3 (Full 200 MCQs)"
                />
              </div>

              <CourseSelect
                value={course}
                onChange={setCourse}
                labelClassName="block text-xs font-bold text-foreground mb-1.5"
                selectClassName="w-full px-3.5 py-2.5 bg-background border border-border rounded-2xl text-xs text-foreground focus:outline-hidden focus:border-primary"
              />

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">Category *</label>
                <select
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-2xl text-xs text-foreground focus:outline-hidden focus:border-primary"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as ExamCategory }))}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">Subject (Optional)</label>
                <select
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-2xl text-xs text-foreground focus:outline-hidden focus:border-primary"
                  value={form.subject_id}
                  onChange={(e) => setForm((f) => ({ ...f, subject_id: e.target.value }))}
                >
                  <option value="">Comprehensive / Multi-Subject</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.display_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">Duration (Minutes) *</label>
                <input
                  type="number"
                  min="5"
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-2xl text-xs text-foreground focus:outline-hidden focus:border-primary"
                  value={form.duration_minutes}
                  onChange={(e) => setForm((f) => ({ ...f, duration_minutes: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">Total Marks *</label>
                <input
                  type="number"
                  min="1"
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-2xl text-xs text-foreground focus:outline-hidden focus:border-primary"
                  value={form.total_marks}
                  onChange={(e) => setForm((f) => ({ ...f, total_marks: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">Positive Marks Per Question</label>
                <input
                  type="number"
                  step="0.5"
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-2xl text-xs text-foreground focus:outline-hidden focus:border-primary"
                  value={form.positive_marks}
                  onChange={(e) => setForm((f) => ({ ...f, positive_marks: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">Negative Marks Per Wrong Answer</label>
                <input
                  type="number"
                  step="0.05"
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-2xl text-xs text-foreground focus:outline-hidden focus:border-primary"
                  value={form.negative_marks}
                  onChange={(e) => setForm((f) => ({ ...f, negative_marks: e.target.value }))}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-foreground mb-1.5">Description &amp; Syllabus Covered</label>
                <textarea
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-2xl text-xs text-foreground focus:outline-hidden focus:border-primary"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Specify units, syllabus coverage, and candidate instructions..."
                />
              </div>

              {/* Toggles */}
              <div className="sm:col-span-2 flex flex-wrap gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-foreground">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                  />
                  <span>Published to Student Portal</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-foreground">
                  <input
                    type="checkbox"
                    checked={form.is_free_diagnostic}
                    onChange={(e) => setForm((f) => ({ ...f, is_free_diagnostic: e.target.checked }))}
                    className="rounded border-border text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                  <span>Open Free Diagnostic (No subscription required)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-foreground">
                  <input
                    type="checkbox"
                    checked={form.is_premium}
                    onChange={(e) => setForm((f) => ({ ...f, is_premium: e.target.checked }))}
                    className="rounded border-border text-amber-600 focus:ring-amber-500 h-4 w-4"
                  />
                  <span>Pro Only Subscription Required</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button onClick={closeForm} className="btn-secondary py-2.5 px-4 rounded-xl text-xs font-bold">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary py-2.5 px-6 rounded-xl text-xs font-black flex items-center gap-2 shadow-sm"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                <span>{editingId ? 'Save Changes' : 'Publish Blueprint'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Blueprint List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 size={28} className="animate-spin text-primary" />
            <p className="text-xs text-muted-foreground font-semibold">Loading examination blueprints...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-3xl p-8">
            <FileText size={36} className="text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm font-bold text-foreground">No examinations configured yet</p>
            <p className="text-xs text-muted-foreground mt-1">Click &quot;Create Examination Blueprint&quot; above to add one.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((exam) => (
              <div
                key={exam.id}
                className="bg-card border border-border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs hover:border-primary/30 transition-all"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                      {exam.category}
                    </span>
                    {exam.is_active ? (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md">Live</span>
                    ) : (
                      <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">Draft</span>
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-foreground">{exam.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    <span>{exam.duration_minutes} mins</span>
                    <span>•</span>
                    <span>{exam.total_marks} Marks</span>
                    <span>•</span>
                    <span>{exam.negative_marking ? '-0.25 Negative' : 'No Negative'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleActive(exam)}
                    className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
                    title={exam.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {exam.is_active ? <ToggleRight size={20} className="text-emerald-500" /> : <ToggleLeft size={20} />}
                  </button>
                  <button
                    onClick={() => openEdit(exam)}
                    className="btn-secondary text-xs py-2 px-3 rounded-xl font-bold flex items-center gap-1.5"
                  >
                    <Pencil size={13} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(exam.id)}
                    className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors"
                    title="Delete Exam"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            </div>
          )}
        </>
      ) : (
        /* ========================================================================= */
        /* TAB 2: TEACHER EVALUATION QUEUE                                           */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-card border border-border rounded-3xl p-6 shadow-xs">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                  Faculty Grading Queue
                </span>
                <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                  <Shield size={12} className="text-primary" /> SEE Subjective Evaluations
                </span>
              </div>
              <h2 className="text-xl font-black text-foreground">Teacher Evaluation &amp; Rubric Scoring Queue</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Review AI-drafted step marks, override rubric criteria, provide qualitative guidance, and publish final board grades.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={fetchEvaluations}
                disabled={evalLoading}
                className="btn-secondary text-xs py-2 px-3.5 rounded-xl font-bold flex items-center gap-1.5"
              >
                <RefreshCw size={13} className={evalLoading ? 'animate-spin' : ''} />
                <span>Refresh Queue</span>
              </button>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-card border border-border">
              <button
                onClick={() => setEvalStatusFilter('pending_review')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  evalStatusFilter === 'pending_review'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Pending Verification ({evaluations.filter((e) => e.status === 'pending_review').length})
              </button>
              <button
                onClick={() => setEvalStatusFilter('published')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  evalStatusFilter === 'published'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Published ({evaluations.filter((e) => e.status === 'published').length})
              </button>
              <button
                onClick={() => setEvalStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  evalStatusFilter === 'all'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All ({evaluations.length})
              </button>
            </div>

            <div className="relative max-w-xs w-full">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search candidate, subject, question..."
                value={evalSearch}
                onChange={(e) => setEvalSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-2xl border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary"
              />
            </div>
          </div>

          {/* Submissions List */}
          {evalLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 size={28} className="animate-spin text-primary" />
              <p className="text-xs text-muted-foreground font-semibold">Loading subjective evaluation items...</p>
            </div>
          ) : filteredEvaluations.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-3xl p-8">
              <Sparkles size={36} className="text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm font-bold text-foreground">No submissions in this queue</p>
              <p className="text-xs text-muted-foreground mt-1">
                When students submit handwritten or typed answers for SEE subjective questions, they will appear here.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredEvaluations.map((item) => (
                <div
                  key={item.id}
                  className="bg-card border border-border rounded-3xl p-6 shadow-xs hover:border-primary/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                        {item.subject}
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                        {item.totalMarks} Marks Question
                      </span>
                      {item.status === 'published' ? (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Check size={10} /> Published Grade
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Clock size={10} /> Pending Review
                        </span>
                      )}
                      {item.isAiDraft && (
                        <span className="text-[10px] font-bold text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Sparkles size={10} /> AI Draft
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-sm text-foreground leading-snug">
                      <MathText text={item.questionText} />
                    </h3>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap pt-1">
                      <span>Candidate: <strong className="text-foreground">{item.studentName || 'Student'}</strong></span>
                      <span>•</span>
                      <span>
                        AI Draft Score: <strong className="text-purple-600 font-mono">{item.aiDraftScore} / {item.totalMarks}</strong>
                      </span>
                      {item.teacherScore !== undefined && (
                        <>
                          <span>•</span>
                          <span>
                            Teacher Score: <strong className="text-emerald-600 font-mono">{item.teacherScore} / {item.totalMarks}</strong>
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleOpenReview(item)}
                      className="btn-primary text-xs py-2.5 px-5 rounded-2xl font-black flex items-center gap-2 shadow-xs cursor-pointer"
                    >
                      <Edit3 size={14} />
                      <span>{item.status === 'published' ? 'View / Edit Grade' : 'Evaluate & Score'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Active Evaluation Modal / Review Drawer */}
          {selectedEval && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-card border border-border rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl animate-scaleIn overflow-hidden">
                {/* Modal Header */}
                <div className="p-6 border-b border-border flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                        {selectedEval.subject}
                      </span>
                      <span className="text-xs text-muted-foreground font-bold">
                        Candidate: {selectedEval.studentName || 'Student'}
                      </span>
                    </div>
                    <h3 className="text-base font-black text-foreground mt-1">Teacher Rubric Verification</h3>
                  </div>
                  <button
                    onClick={() => setSelectedEval(null)}
                    className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto space-y-6">
                  {/* Question & Solution */}
                  <div className="bg-muted/20 border border-border rounded-2xl p-4 space-y-2">
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Exam Question ({selectedEval.totalMarks}M):</p>
                    <div className="text-xs font-bold text-foreground leading-relaxed">
                      <MathText text={selectedEval.questionText} />
                    </div>
                    <div className="pt-2 border-t border-border/60">
                      <p className="text-[10px] font-black uppercase text-emerald-600">Model Solution / Scheme:</p>
                      <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans mt-1">
                        {selectedEval.sampleSolution}
                      </pre>
                    </div>
                  </div>

                  {/* Student Answer */}
                  <div className="bg-muted/10 border border-border rounded-2xl p-4 space-y-2">
                    <p className="text-[10px] font-black uppercase text-foreground">Candidate's Submitted Answer:</p>
                    <div className="text-xs text-foreground leading-relaxed whitespace-pre-wrap bg-card p-3 rounded-xl border border-border/80 font-mono">
                      {selectedEval.studentAnswerText || '(Handwritten submission uploaded)'}
                    </div>
                  </div>

                  {/* AI-Assisted Evaluation Banner */}
                  <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-start gap-3">
                    <Sparkles size={18} className="text-purple-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-purple-700 dark:text-purple-300">
                        🤖 AI-Assisted Draft Evaluation (Pending Faculty Verification)
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedEval.aiDraftFeedback}
                      </p>
                    </div>
                  </div>

                  {/* Rubric Criteria Evaluation */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-foreground uppercase tracking-wider">
                        CDC Marking Rubric Breakdown:
                      </h4>
                      <span className="text-xs font-mono font-bold text-primary">
                        Score: {Math.round(activeRubric.reduce((acc, r) => acc + (Number(r.score) || 0), 0) * 10) / 10} / {selectedEval.totalMarks} Marks
                      </span>
                    </div>

                    <div className="space-y-3">
                      {activeRubric.map((criterion, idx) => (
                        <div key={idx} className="p-3.5 rounded-2xl border border-border bg-muted/20 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-foreground flex-1">{criterion.criterion}</span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-xs text-muted-foreground font-bold">Marks:</span>
                              <input
                                type="number"
                                step="0.25"
                                min="0"
                                max={criterion.maxMarks}
                                value={criterion.score}
                                onChange={(e) => handleRubricScoreChange(idx, parseFloat(e.target.value) || 0)}
                                className="w-16 px-2 py-1 text-xs font-mono font-black text-center bg-card border border-border rounded-lg text-foreground focus:outline-hidden focus:border-primary"
                              />
                              <span className="text-xs text-muted-foreground font-bold">/ {criterion.maxMarks}</span>
                            </div>
                          </div>
                          {criterion.feedback && (
                            <p className="text-[11px] text-muted-foreground italic pl-1 border-l-2 border-primary/40">
                              {criterion.feedback}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Official Teacher Comments */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-foreground">
                      Teacher Feedback &amp; Examiner Notes:
                    </label>
                    <textarea
                      rows={3}
                      value={teacherFeedbackText}
                      onChange={(e) => setTeacherFeedbackText(e.target.value)}
                      placeholder="Enter detailed constructive feedback for candidate..."
                      className="w-full px-3.5 py-2.5 bg-background border border-border rounded-2xl text-xs text-foreground focus:outline-hidden focus:border-primary leading-relaxed"
                    />
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-5 border-t border-border bg-muted/10 flex items-center justify-between gap-3">
                  <button
                    onClick={() => setSelectedEval(null)}
                    className="btn-secondary py-2.5 px-4 rounded-xl text-xs font-bold"
                  >
                    Close
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSaveEvaluation(false)}
                      disabled={evalSaving}
                      className="btn-secondary py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5"
                    >
                      <Save size={14} />
                      <span>Save Review Draft</span>
                    </button>
                    <button
                      onClick={() => handleSaveEvaluation(true)}
                      disabled={evalSaving}
                      className="btn-primary py-2.5 px-6 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm"
                    >
                      {evalSaving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      <span>Publish Final Evaluation</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
