'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Pencil, Trash2, Save, X, ToggleLeft, ToggleRight, Loader2, AlertCircle, CheckCircle2,  } from 'lucide-react';

interface Subject {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  is_active: boolean;
  created_at: string;
}

interface FormState {
  display_name: string;
  description: string;
  color: string;
  icon: string;
  is_active: boolean;
}

const defaultForm: FormState = {
  display_name: '',
  description: '',
  color: '#6366f1',
  icon: '📚',
  is_active: true,
};

const SUBJECT_COLORS: Record<string, string> = {
  biology: 'bg-bio-light text-bio',
  chemistry: 'bg-chem-light text-chem',
  physics: 'bg-physics-light text-physics',
  mental_agility: 'bg-ma-light text-ma',
};

export default function AdminSubjectsClient() {
  const supabase = createClient();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('subjects')
      .select('*')
      .order('name', { ascending: true });

    if (data && data.length > 0) {
      setSubjects(data);
    } else {
      const DEFAULT_ADMIN_SUBJECTS: Subject[] = [
        { id: 'subj-1', name: 'biology', display_name: 'Biology', description: 'Botany & Zoology for CEE medical entrance', color: '#10B981', icon: '🧬', is_active: true, created_at: new Date().toISOString() },
        { id: 'subj-2', name: 'chemistry', display_name: 'Chemistry', description: 'Organic, Inorganic & Physical Chemistry', color: '#06B6D4', icon: '🧪', is_active: true, created_at: new Date().toISOString() },
        { id: 'subj-3', name: 'physics', display_name: 'Physics', description: 'Mechanics, Electromagnetism & Modern Physics', color: '#3B82F6', icon: '⚡', is_active: true, created_at: new Date().toISOString() },
        { id: 'subj-4', name: 'mental_agility', display_name: 'Mental Agility (MAT)', description: 'Logical Reasoning & Quantitative Aptitude', color: '#8B5CF6', icon: '🧠', is_active: true, created_at: new Date().toISOString() },
      ];
      setSubjects(DEFAULT_ADMIN_SUBJECTS);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSubjects(); }, [fetchSubjects]);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const openEdit = (subject: Subject) => {
    setEditingId(subject.id);
    setForm({
      display_name: subject.display_name,
      description: subject.description || '',
      color: subject.color || '#6366f1',
      icon: subject.icon || '📚',
      is_active: subject.is_active,
    });
    setShowForm(true);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(defaultForm);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(defaultForm);
  };

  const handleSave = async () => {
    if (!form.display_name.trim()) { setError('Display name is required'); return; }
    setSaving(true);
    setError(null);
    if (editingId) {
      const { error: err } = await supabase
        .from('subjects')
        .update({
          display_name: form.display_name.trim(),
          description: form.description.trim() || null,
          color: form.color,
          icon: form.icon.trim() || null,
          is_active: form.is_active,
        })
        .eq('id', editingId);
      if (err) setError(err.message);
      else { showSuccess('Subject updated successfully'); closeForm(); fetchSubjects(); }
    }
    setSaving(false);
  };

  const handleToggleActive = async (subject: Subject) => {
    const { error: err } = await supabase
      .from('subjects')
      .update({ is_active: !subject.is_active })
      .eq('id', subject.id);
    if (err) setError(err.message);
    else { showSuccess(`Subject ${subject.is_active ? 'deactivated' : 'activated'}`); fetchSubjects(); }
  };

  const handleDelete = async (id: string) => {
    const { error: err } = await supabase.from('subjects').delete().eq('id', id);
    if (err) setError(err.message);
    else { showSuccess('Subject deleted'); setDeleteConfirm(null); fetchSubjects(); }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-foreground">Subjects Management</h1>
            <p className="text-xs text-muted-foreground">CEE syllabus subjects · {subjects.length} total</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/chapters" className="px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground border border-border rounded-xl hover:border-primary/30 transition-colors">
            Manage Chapters →
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6">
        {/* Alerts */}
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

        {/* Note: Subjects are seeded by migration (biology/chemistry/physics/mental_agility) */}
        <div className="mb-4 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 text-sm text-primary">
          <strong>Note:</strong> The 4 CEE subjects (Biology, Chemistry, Physics, Mental Agility) are pre-seeded. You can edit their display names, descriptions, colors, and icons below.
        </div>

        {/* Edit Form */}
        {showForm && (
          <div className="mb-6 bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-foreground text-sm">Edit Subject</h2>
              <button onClick={closeForm} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"><X size={16} /></button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Display Name *</label>
                <input
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary"
                  value={form.display_name}
                  onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
                  placeholder="e.g. Biology"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Icon (emoji)</label>
                <input
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary"
                  value={form.icon}
                  onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                  placeholder="🧬"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" className="w-10 h-9 rounded-lg border border-border cursor-pointer" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} />
                  <input className="flex-1 px-3 py-2 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-5">
                <label className="text-xs font-semibold text-muted-foreground">Active</label>
                <button onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))} className={`transition-colors ${form.is_active ? 'text-success' : 'text-muted-foreground'}`}>
                  {form.is_active ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                </button>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Description</label>
                <textarea
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary resize-none"
                  rows={2}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description of this subject..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={closeForm} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-xl hover:bg-muted transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save Changes
              </button>
            </div>
          </div>
        )}

        {/* Subjects Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-primary" />
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Subject</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Description</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subject) => (
                  <tr key={subject.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${SUBJECT_COLORS[subject.name] || 'bg-muted text-foreground'}`}>
                          {subject.icon || '📚'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{subject.display_name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{subject.name.replace('_', ' ')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <p className="text-xs text-muted-foreground line-clamp-2 max-w-xs">{subject.description || '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleToggleActive(subject)} className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${subject.is_active ? 'bg-success-light text-success' : 'bg-muted text-muted-foreground'}`}>
                        {subject.is_active ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                        {subject.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(subject)} className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="Edit">
                          <Pencil size={14} />
                        </button>
                        {deleteConfirm === subject.id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleDelete(subject.id)} className="px-2 py-1 text-xs font-semibold bg-error text-white rounded-lg">Confirm</button>
                            <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 text-xs text-muted-foreground border border-border rounded-lg">Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteConfirm(subject.id)} className="p-2 rounded-lg text-muted-foreground hover:text-error hover:bg-error-light transition-colors" title="Delete">
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
