'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Layers,
  ToggleLeft,
  ToggleRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Lock,
  Unlock,
  Users,
} from 'lucide-react';

interface Subject {
  id: string;
  name: string;
  display_name: string;
}

interface Batch {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  subject_id: string | null;
  cee_year: number | null;
  instructor_name: string | null;
  thumbnail_url: string | null;
  start_date: string | null;
  end_date: string | null;
  price_npr: number;
  is_premium: boolean;
  is_active: boolean;
  created_at: string;
  subjects?: { display_name: string; name: string } | null;
}

interface FormState {
  title: string;
  slug: string;
  description: string;
  subject_id: string;
  cee_year: string;
  instructor_name: string;
  thumbnail_url: string;
  start_date: string;
  end_date: string;
  price_npr: string;
  is_premium: boolean;
  is_active: boolean;
}

const defaultForm: FormState = {
  title: '',
  slug: '',
  description: '',
  subject_id: '',
  cee_year: '',
  instructor_name: '',
  thumbnail_url: '',
  start_date: '',
  end_date: '',
  price_npr: '0',
  is_premium: false,
  is_active: true,
};

const SUBJECT_COLORS: Record<string, string> = {
  biology: 'bg-bio-light text-bio',
  chemistry: 'bg-chem-light text-chem',
  physics: 'bg-physics-light text-physics',
  mental_agility: 'bg-ma-light text-ma',
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function AdminBatchesClient() {
  const supabase = createClient();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [enrollCounts, setEnrollCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [subsResult, batchesResult, enrollResult] = await Promise.all([
      supabase.from('subjects').select('id, name, display_name').order('name'),
      supabase.from('batches').select('*, subjects(display_name, name)').order('created_at', { ascending: false }),
      supabase.from('batch_enrollments').select('batch_id'),
    ]);

    if (batchesResult.error) setError(batchesResult.error.message);
    setSubjects(subsResult.data || []);
    setBatches((batchesResult.data as unknown as Batch[]) || []);

    const counts: Record<string, number> = {};
    (enrollResult.data || []).forEach((row: { batch_id: string }) => {
      counts[row.batch_id] = (counts[row.batch_id] || 0) + 1;
    });
    setEnrollCounts(counts);

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(defaultForm);
    setSlugTouched(false);
    setShowForm(true);
  };

  const openEdit = (batch: Batch) => {
    setEditingId(batch.id);
    setForm({
      title: batch.title,
      slug: batch.slug,
      description: batch.description || '',
      subject_id: batch.subject_id || '',
      cee_year: batch.cee_year?.toString() || '',
      instructor_name: batch.instructor_name || '',
      thumbnail_url: batch.thumbnail_url || '',
      start_date: batch.start_date || '',
      end_date: batch.end_date || '',
      price_npr: batch.price_npr?.toString() || '0',
      is_premium: batch.is_premium,
      is_active: batch.is_active,
    });
    setSlugTouched(true);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(defaultForm);
    setSlugTouched(false);
  };

  const handleTitleChange = (title: string) => {
    setForm((f) => ({ ...f, title, slug: slugTouched ? f.slug : slugify(title) }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Title is required'); return; }
    if (!form.slug.trim()) { setError('Slug is required'); return; }
    setSaving(true);
    setError(null);

    const payload = {
      title: form.title.trim(),
      slug: slugify(form.slug),
      description: form.description.trim() || null,
      subject_id: form.subject_id || null,
      cee_year: form.cee_year ? parseInt(form.cee_year) : null,
      instructor_name: form.instructor_name.trim() || null,
      thumbnail_url: form.thumbnail_url.trim() || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      price_npr: form.price_npr ? parseInt(form.price_npr) : 0,
      is_premium: form.is_premium,
      is_active: form.is_active,
    };

    if (editingId) {
      const { error: err } = await supabase.from('batches').update(payload).eq('id', editingId);
      if (err) setError(err.message);
      else { showSuccess('Batch updated'); closeForm(); fetchData(); }
    } else {
      const { error: err } = await supabase.from('batches').insert(payload);
      if (err) setError(err.message);
      else { showSuccess('Batch created'); closeForm(); fetchData(); }
    }
    setSaving(false);
  };

  const handleToggleActive = async (batch: Batch) => {
    const { error: err } = await supabase.from('batches').update({ is_active: !batch.is_active }).eq('id', batch.id);
    if (err) setError(err.message);
    else { showSuccess(`Batch ${batch.is_active ? 'deactivated' : 'activated'}`); fetchData(); }
  };

  const handleDelete = async (id: string) => {
    const { error: err } = await supabase.from('batches').delete().eq('id', id);
    if (err) setError(err.message);
    else { showSuccess('Batch deleted'); setDeleteConfirm(null); fetchData(); }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-foreground">Batches Management</h1>
            <p className="text-xs text-muted-foreground">Structured courses · {batches.length} total</p>
          </div>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors">
          <Plus size={16} /> Add Batch
        </button>
      </div>

      <div className="max-w-6xl mx-auto p-6">
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

        {/* Form */}
        {showForm && (
          <div className="mb-6 bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-foreground text-sm">{editingId ? 'Edit Batch' : 'Add New Batch'}</h2>
              <button onClick={closeForm} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"><X size={16} /></button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Batch Title *</label>
                <input
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary"
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Target CEE 2026 — Full Batch"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">URL Slug *</label>
                <input
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary font-mono"
                  value={form.slug}
                  onChange={(e) => { setSlugTouched(true); setForm((f) => ({ ...f, slug: e.target.value })); }}
                  placeholder="target-cee-2026-full"
                />
                <p className="text-xs text-muted-foreground mt-1">Shown at /batches/{form.slug || '...'}</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Subject</label>
                <select
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary"
                  value={form.subject_id}
                  onChange={(e) => setForm((f) => ({ ...f, subject_id: e.target.value }))}
                >
                  <option value="">All Subjects (Full Batch)</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.display_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">CEE Target Year</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary"
                  value={form.cee_year}
                  onChange={(e) => setForm((f) => ({ ...f, cee_year: e.target.value }))}
                  placeholder="2026"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Instructor Name</label>
                <input
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary"
                  value={form.instructor_name}
                  onChange={(e) => setForm((f) => ({ ...f, instructor_name: e.target.value }))}
                  placeholder="e.g. Dr. Sunita Poudel"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Price (NPR)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary"
                  value={form.price_npr}
                  onChange={(e) => setForm((f) => ({ ...f, price_npr: e.target.value }))}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Start Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary"
                  value={form.start_date}
                  onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">End Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary"
                  value={form.end_date}
                  onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Thumbnail URL</label>
                <input
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary"
                  value={form.thumbnail_url}
                  onChange={(e) => setForm((f) => ({ ...f, thumbnail_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Description</label>
                <textarea
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary resize-none"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="What does this batch cover?"
                />
              </div>
              <div className="flex items-center gap-4 sm:col-span-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-muted-foreground">Premium</label>
                  <button onClick={() => setForm((f) => ({ ...f, is_premium: !f.is_premium }))} className={`transition-colors ${form.is_premium ? 'text-chem' : 'text-muted-foreground'}`}>
                    {form.is_premium ? <Lock size={18} /> : <Unlock size={18} />}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-muted-foreground">Active</label>
                  <button onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))} className={`transition-colors ${form.is_active ? 'text-success' : 'text-muted-foreground'}`}>
                    {form.is_active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={closeForm} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-xl hover:bg-muted transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {editingId ? 'Save Changes' : 'Create Batch'}
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-primary" /></div>
        ) : batches.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-2xl">
            <Layers size={40} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-sm font-semibold text-foreground">No batches yet</p>
            <p className="text-xs text-muted-foreground mt-1">Click &quot;Add Batch&quot; to create the first one</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Batch</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Subject</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Price</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Enrolled</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => (
                  <tr key={batch.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-foreground">{batch.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 font-mono">/{batch.slug}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${SUBJECT_COLORS[batch.subjects?.name || ''] || 'bg-muted text-muted-foreground'}`}>
                        {batch.subjects?.display_name || 'All Subjects'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-xs text-foreground font-semibold">{batch.price_npr > 0 ? `Rs. ${batch.price_npr.toLocaleString()}` : 'Free'}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users size={12} /> {enrollCounts[batch.id] || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {batch.is_premium && <span className="text-xs bg-chem-light text-chem px-1.5 py-0.5 rounded-full font-semibold">PRO</span>}
                        <button onClick={() => handleToggleActive(batch)} className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full transition-colors ${batch.is_active ? 'bg-success-light text-success' : 'bg-muted text-muted-foreground'}`}>
                          {batch.is_active ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                          {batch.is_active ? 'Active' : 'Off'}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(batch)} className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="Edit">
                          <Pencil size={14} />
                        </button>
                        {deleteConfirm === batch.id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleDelete(batch.id)} className="px-2 py-1 text-xs font-semibold bg-error text-white rounded-lg">Confirm</button>
                            <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 text-xs text-muted-foreground border border-border rounded-lg">Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteConfirm(batch.id)} className="p-2 rounded-lg text-muted-foreground hover:text-error hover:bg-error-light transition-colors" title="Delete">
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
