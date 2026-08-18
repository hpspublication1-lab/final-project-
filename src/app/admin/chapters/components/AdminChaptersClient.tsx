'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Plus, Pencil, Trash2, Save, X, BookOpen, ToggleLeft, ToggleRight, Loader2, AlertCircle, CheckCircle2, Lock, Unlock,  } from 'lucide-react';

interface Subject {
  id: string;
  name: string;
  display_name: string;
}

interface Chapter {
  id: string;
  subject_id: string;
  title: string;
  description: string | null;
  chapter_number: number | null;
  is_premium: boolean;
  is_active: boolean;
  created_at: string;
  subjects?: { display_name: string; name: string };
}

interface FormState {
  subject_id: string;
  title: string;
  description: string;
  chapter_number: string;
  is_premium: boolean;
  is_active: boolean;
}

const defaultForm: FormState = {
  subject_id: '',
  title: '',
  description: '',
  chapter_number: '',
  is_premium: false,
  is_active: true,
};

const SUBJECT_COLORS: Record<string, string> = {
  biology: 'bg-bio-light text-bio',
  chemistry: 'bg-chem-light text-chem',
  physics: 'bg-physics-light text-physics',
  mental_agility: 'bg-ma-light text-ma',
};

export default function AdminChaptersClient() {
  const supabase = createClient();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [filterSubject, setFilterSubject] = useState<string>('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const subsResult = await supabase.from('subjects').select('id, name, display_name').order('name');
    setSubjects(subsResult.data || []);

    // Gracefully attempt ordering by chapter_number, fallback to sort_order or created_at
    let chapsResult = await supabase.from('chapters').select('*, subjects(display_name, name)').order('chapter_number', { ascending: true });
    if (chapsResult.error) {
      chapsResult = await supabase.from('chapters').select('*, subjects(display_name, name)').order('sort_order', { ascending: true });
      if (chapsResult.error) {
        chapsResult = await supabase.from('chapters').select('*, subjects(display_name, name)').order('created_at', { ascending: true });
      }
    }

    if (chapsResult.error) {
      setError(chapsResult.error.message);
    } else {
      // Map chapter_number if sort_order exists
      const normalized = (chapsResult.data || []).map((ch: any) => ({
        ...ch,
        chapter_number: ch.chapter_number ?? ch.sort_order ?? null,
      }));
      setChapters(normalized);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...defaultForm, subject_id: filterSubject !== 'all' ? filterSubject : '' });
    setShowForm(true);
  };

  const openEdit = (chapter: Chapter) => {
    setEditingId(chapter.id);
    setForm({
      subject_id: chapter.subject_id,
      title: chapter.title,
      description: chapter.description || '',
      chapter_number: (chapter.chapter_number ?? (chapter as any).sort_order)?.toString() || '',
      is_premium: chapter.is_premium,
      is_active: chapter.is_active,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(defaultForm);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Title is required'); return; }
    if (!form.subject_id) { setError('Subject is required'); return; }
    setSaving(true);
    setError(null);
    
    const num = form.chapter_number ? parseInt(form.chapter_number) : null;
    const payload: Record<string, any> = {
      subject_id: form.subject_id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      chapter_number: num,
      sort_order: num,
      is_premium: form.is_premium,
      is_active: form.is_active,
    };

    let { error: err } = editingId
      ? await supabase.from('chapters').update(payload).eq('id', editingId)
      : await supabase.from('chapters').insert(payload);

    // Self-healing fallback if column chapter_number or sort_order does not exist
    if (err && err.message.includes('chapter_number')) {
      delete payload.chapter_number;
      err = (editingId
        ? await supabase.from('chapters').update(payload).eq('id', editingId)
        : await supabase.from('chapters').insert(payload)).error;
    }
    if (err && err.message.includes('sort_order')) {
      delete payload.sort_order;
      err = (editingId
        ? await supabase.from('chapters').update(payload).eq('id', editingId)
        : await supabase.from('chapters').insert(payload)).error;
    }

    if (err) setError(err.message);
    else {
      showSuccess(editingId ? 'Chapter updated' : 'Chapter created');
      closeForm();
      fetchData();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error: err } = await supabase.from('chapters').delete().eq('id', id);
    if (err) setError(err.message);
    else { showSuccess('Chapter deleted'); setDeleteConfirm(null); fetchData(); }
  };

  const filtered = filterSubject === 'all' ? chapters : chapters.filter(c => c.subject_id === filterSubject);

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-foreground">Chapters Management</h1>
            <p className="text-xs text-muted-foreground">CEE syllabus chapters · {chapters.length} total</p>
          </div>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors">
          <Plus size={16} /> Add Chapter
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
            All ({chapters.length})
          </button>
          {subjects.map(s => (
            <button key={s.id} onClick={() => setFilterSubject(s.id)} className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${filterSubject === s.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
              {s.display_name} ({chapters.filter(c => c.subject_id === s.id).length})
            </button>
          ))}
        </div>

        {/* Form */}
        {showForm && (
          <div className="mb-6 bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-foreground text-sm">{editingId ? 'Edit Chapter' : 'Add New Chapter'}</h2>
              <button onClick={closeForm} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"><X size={16} /></button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Subject *</label>
                <select
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary"
                  value={form.subject_id}
                  onChange={e => setForm(f => ({ ...f, subject_id: e.target.value }))}
                >
                  <option value="">Select subject...</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.display_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Chapter Number</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary"
                  value={form.chapter_number}
                  onChange={e => setForm(f => ({ ...f, chapter_number: e.target.value }))}
                  placeholder="1"
                  min="1"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Chapter Title *</label>
                <input
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Cell Biology and Cell Division"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Description</label>
                <textarea
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary resize-none"
                  rows={2}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description..."
                />
              </div>
              <div className="flex items-center gap-4">
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
                {editingId ? 'Save Changes' : 'Create Chapter'}
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-2xl">
            <BookOpen size={40} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-sm font-semibold text-foreground">No chapters yet</p>
            <p className="text-xs text-muted-foreground mt-1">Click "Add Chapter" to create the first one</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Chapter</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Subject</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Flags</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((chapter) => (
                  <tr key={chapter.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{chapter.chapter_number ?? '—'}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-foreground">{chapter.title}</p>
                      {chapter.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{chapter.description}</p>}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${SUBJECT_COLORS[chapter.subjects?.name || ''] || 'bg-muted text-muted-foreground'}`}>
                        {chapter.subjects?.display_name || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {chapter.is_premium && <span className="text-xs bg-chem-light text-chem px-1.5 py-0.5 rounded-full font-semibold">PRO</span>}
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${chapter.is_active ? 'bg-success-light text-success' : 'bg-muted text-muted-foreground'}`}>
                          {chapter.is_active ? 'Active' : 'Off'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(chapter)} className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                          <Pencil size={14} />
                        </button>
                        {deleteConfirm === chapter.id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleDelete(chapter.id)} className="px-2 py-1 text-xs font-semibold bg-error text-white rounded-lg">Confirm</button>
                            <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 text-xs text-muted-foreground border border-border rounded-lg">Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteConfirm(chapter.id)} className="p-2 rounded-lg text-muted-foreground hover:text-error hover:bg-error-light transition-colors">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
