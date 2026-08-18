'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  ArrowLeft, Plus, Pencil, Trash2, Save, X, FileText,
  ToggleLeft, ToggleRight, Loader2, AlertCircle, CheckCircle2,
  Lock, Unlock, Clock, Hash,
} from 'lucide-react';

interface Subject { id: string; name: string; display_name: string; }

interface Exam {
  id: string;
  title: string;
  description: string | null;
  subject_id: string | null;
  duration_minutes: number;
  total_marks: number;
  negative_marking: boolean;
  is_premium: boolean;
  is_active: boolean;
  created_at: string;
  subjects?: { display_name: string; name: string };
}

interface FormState {
  title: string;
  description: string;
  subject_id: string;
  duration_minutes: string;
  total_marks: string;
  negative_marking: boolean;
  is_premium: boolean;
  is_active: boolean;
}

const defaultForm: FormState = {
  title: '', description: '', subject_id: '',
  duration_minutes: '60', total_marks: '100',
  negative_marking: true, is_premium: false, is_active: true,
};

const SUBJECT_COLORS: Record<string, string> = {
  biology: 'bg-bio-light text-bio', chemistry: 'bg-chem-light text-chem',
  physics: 'bg-physics-light text-physics', mental_agility: 'bg-ma-light text-ma',
};

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
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [filterSubject, setFilterSubject] = useState('all');

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
    // This DB's exams table uses `is_published` and has no is_premium/negative_marking
    // columns — map to the UI's fields so the list renders correctly.
    setExams((exs || []).map((e: any) => ({
      ...e,
      is_active: e.is_published ?? false,
      is_premium: e.is_premium ?? false,
      negative_marking: e.negative_marking ?? true,
    })));
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const showSuccess = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(null), 3000); };

  const openCreate = () => { setEditingId(null); setForm(defaultForm); setShowForm(true); };
  const openEdit = (exam: Exam) => {
    setEditingId(exam.id);
    setForm({
      title: exam.title, description: exam.description || '',
      subject_id: exam.subject_id || '',
      duration_minutes: exam.duration_minutes.toString(),
      total_marks: exam.total_marks.toString(),
      negative_marking: exam.negative_marking,
      is_premium: exam.is_premium, is_active: exam.is_active,
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
    setSaving(true); setError(null);
    // Only columns that exist on this DB's exams table (is_published, not is_active;
    // no is_premium/negative_marking columns — those are enforced app-side).
    const payload = {
      title: form.title.trim(), description: form.description.trim() || null,
      subject_id: form.subject_id || null, duration_minutes: dur, total_marks: marks,
      is_published: form.is_active,
    };
    if (editingId) {
      const { error: err } = await supabase.from('exams').update(payload).eq('id', editingId);
      if (err) setError(err.message);
      else { showSuccess('Exam updated'); closeForm(); fetchData(); }
    } else {
      const { error: err } = await supabase.from('exams').insert(payload);
      if (err) setError(err.message);
      else { showSuccess('Exam created'); closeForm(); fetchData(); }
    }
    setSaving(false);
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

  const filtered = filterSubject === 'all' ? exams : exams.filter(e => e.subject_id === filterSubject);

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-foreground">Exams Management</h1>
            <p className="text-xs text-muted-foreground">Mock tests & exams · {exams.length} total</p>
          </div>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors">
          <Plus size={16} /> Create Exam
        </button>
      </div>

      <div className="max-w-5xl mx-auto p-6">
        {error && (
          <div className="mb-4 flex items-center gap-2 bg-error-light text-error px-4 py-3 rounded-xl text-sm">
            <AlertCircle size={16} /> {error}
            <button onClick={() => setError(null)} className="ml-auto"><X size={14} /></button>
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-center gap-2 bg-success-light text-success px-4 py-3 rounded-xl text-sm">
            <CheckCircle2 size={16} /> {success}
          </div>
        )}

        {/* Filter */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <button onClick={() => setFilterSubject('all')} className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${filterSubject === 'all' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
            All ({exams.length})
          </button>
          <button onClick={() => setFilterSubject('')} className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${filterSubject === '' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
            Full CEE ({exams.filter(e => !e.subject_id).length})
          </button>
          {subjects.map(s => (
            <button key={s.id} onClick={() => setFilterSubject(s.id)} className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${filterSubject === s.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
              {s.display_name} ({exams.filter(e => e.subject_id === s.id).length})
            </button>
          ))}
        </div>

        {/* Form */}
        {showForm && (
          <div className="mb-6 bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-foreground text-sm">{editingId ? 'Edit Exam' : 'Create New Exam'}</h2>
              <button onClick={closeForm} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"><X size={16} /></button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Exam Title *</label>
                <input className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. CEE Full Mock Test 2026 #1" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Subject (optional)</label>
                <select className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary" value={form.subject_id} onChange={e => setForm(f => ({ ...f, subject_id: e.target.value }))}>
                  <option value="">Full CEE (All Subjects)</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.display_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Duration (minutes)</label>
                <input type="number" className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))} min="1" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Total Marks</label>
                <input type="number" className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary" value={form.total_marks} onChange={e => setForm(f => ({ ...f, total_marks: e.target.value }))} min="1" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Description</label>
                <textarea className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary resize-none" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description of this exam..." />
              </div>
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-muted-foreground">Negative Marking</label>
                  <button onClick={() => setForm(f => ({ ...f, negative_marking: !f.negative_marking }))} className={`transition-colors ${form.negative_marking ? 'text-error' : 'text-muted-foreground'}`}>
                    {form.negative_marking ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-muted-foreground">Premium</label>
                  <button onClick={() => setForm(f => ({ ...f, is_premium: !f.is_premium }))} className={`transition-colors ${form.is_premium ? 'text-chem' : 'text-muted-foreground'}`}>
                    {form.is_premium ? <Lock size={18} /> : <Unlock size={18} />}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-muted-foreground">Active</label>
                  <button onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))} className={`transition-colors ${form.is_active ? 'text-success' : 'text-muted-foreground'}`}>
                    {form.is_active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={closeForm} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-xl hover:bg-muted transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {editingId ? 'Save Changes' : 'Create Exam'}
              </button>
            </div>
          </div>
        )}

        {/* Exams Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-2xl">
            <FileText size={40} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-sm font-semibold text-foreground">No exams yet</p>
            <p className="text-xs text-muted-foreground mt-1">Click "Create Exam" to add the first one</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {filtered.map((exam) => (
              <div key={exam.id} className="bg-card border border-border rounded-2xl p-4 hover:border-primary/20 transition-all hover:shadow-card-hover">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-foreground leading-snug">{exam.title}</h3>
                    {exam.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{exam.description}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEdit(exam)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"><Pencil size={13} /></button>
                    {deleteConfirm === exam.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleDelete(exam.id)} className="px-2 py-1 text-xs font-semibold bg-error text-white rounded-lg">Del</button>
                        <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 text-xs text-muted-foreground border border-border rounded-lg">No</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(exam.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-error hover:bg-error-light transition-colors"><Trash2 size={13} /></button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {exam.subjects ? (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${SUBJECT_COLORS[exam.subjects.name] || 'bg-muted text-muted-foreground'}`}>{exam.subjects.display_name}</span>
                  ) : (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">Full CEE</span>
                  )}
                  <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock size={11} /> {exam.duration_minutes}m</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground"><Hash size={11} /> {exam.total_marks} marks</span>
                  {exam.negative_marking && <span className="text-xs text-error font-semibold">-ve</span>}
                  {exam.is_premium && <span className="text-xs bg-chem-light text-chem px-1.5 py-0.5 rounded-full font-semibold">PRO</span>}
                  <button onClick={() => handleToggleActive(exam)} className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full transition-colors ${exam.is_active ? 'bg-success-light text-success' : 'bg-muted text-muted-foreground'}`}>
                    {exam.is_active ? 'Active' : 'Inactive'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
