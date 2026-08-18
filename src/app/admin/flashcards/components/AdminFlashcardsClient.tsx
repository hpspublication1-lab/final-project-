'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Plus, Trash2, Loader2, AlertCircle, CheckCircle2, X, Layers, Sparkles, RefreshCw,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getChatCompletion } from '@/lib/ai/chatCompletion';

interface Subject { id: string; name: string; display_name: string }
interface Chapter { id: string; subject_id: string; title: string }
interface Flashcard {
  id: string; front: string; back: string; hint: string | null;
  subject_id: string | null; chapter_id: string | null; is_premium: boolean; is_active: boolean;
}

const empty = { front: '', back: '', hint: '', subject_id: '', chapter_id: '', is_premium: false };

export default function AdminFlashcardsClient() {
  const supabase = createClient();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  // AI generation
  const [aiOpen, setAiOpen] = useState(false);
  const [aiSubject, setAiSubject] = useState('');
  const [aiTopic, setAiTopic] = useState('');
  const [aiCount, setAiCount] = useState(10);
  const [aiBusy, setAiBusy] = useState(false);

  const flash = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(null), 2500); };

  const load = useCallback(async () => {
    setLoading(true);
    const [subsRes, chRes, cardsRes] = await Promise.all([
      supabase.from('subjects').select('id, name, display_name').eq('is_active', true),
      supabase.from('chapters').select('id, subject_id, title').eq('is_active', true),
      supabase.from('flashcards').select('*').order('created_at', { ascending: false }).limit(500),
    ]);
    setSubjects(subsRes.data ?? []);
    setChapters(chRes.data ?? []);
    if (cardsRes.error) setError(cardsRes.error.message);
    setCards((cardsRes.data as Flashcard[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!form.front.trim() || !form.back.trim()) { setError('Front and back are required.'); return; }
    setSaving(true); setError(null);
    const { error: err } = await supabase.from('flashcards').insert({
      front: form.front.trim(), back: form.back.trim(), hint: form.hint.trim() || null,
      subject_id: form.subject_id || null, chapter_id: form.chapter_id || null,
      is_premium: form.is_premium, is_active: true,
    });
    if (err) setError(err.message);
    else { flash('Flashcard created'); setForm(empty); load(); }
    setSaving(false);
  };

  const remove = async (id: string) => {
    setBusyId(id);
    await supabase.from('flashcards').delete().eq('id', id);
    setBusyId(null);
    load();
  };

  const generateAI = async () => {
    if (!aiSubject) { setError('Pick a subject for AI generation.'); return; }
    setAiBusy(true); setError(null);
    try {
      const subjName = subjects.find((s) => s.id === aiSubject)?.display_name ?? 'CEE';
      const prompt = `Generate ${Math.min(20, Math.max(1, aiCount))} concise study flashcards for ${subjName}${aiTopic ? ` on the topic "${aiTopic}"` : ''} for the Nepal CEE medical entrance exam. Return ONLY JSON: {"cards":[{"front":"question/term","back":"answer/definition","hint":"optional short hint"}]}. Keep front short, back accurate.`;
      const res = await getChatCompletion('OPEN_AI', 'gpt-4o', [
        { role: 'system', content: 'You are an expert CEE tutor. Respond with valid JSON only.' },
        { role: 'user', content: prompt },
      ], { max_completion_tokens: 3000 });
      const content = res.choices?.[0]?.message?.content ?? '{}';
      const parsed = JSON.parse(content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
      const list = Array.isArray(parsed) ? parsed : (parsed.cards || parsed.flashcards || []);
      const rows = list
        .filter((c: any) => c.front && c.back)
        .map((c: any) => ({
          front: String(c.front).trim(), back: String(c.back).trim(), hint: c.hint ? String(c.hint).trim() : null,
          subject_id: aiSubject, chapter_id: null, is_premium: true, is_active: true,
        }));
      if (rows.length === 0) { setError('AI returned no usable flashcards. Try again.'); setAiBusy(false); return; }
      const { error: err } = await supabase.from('flashcards').insert(rows);
      if (err) setError(err.message);
      else { flash(`${rows.length} AI flashcards added`); setAiOpen(false); setAiTopic(''); load(); }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI generation failed.');
    }
    setAiBusy(false);
  };

  const subjName = (id: string | null) => subjects.find((s) => s.id === id)?.display_name ?? '—';
  const formChapters = chapters.filter((c) => c.subject_id === form.subject_id);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="w-9 h-9 flex items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-muted transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-extrabold text-foreground flex items-center gap-2"><Layers size={20} className="text-primary" /> Flashcards</h1>
              <p className="text-sm text-muted-foreground">Create spaced-repetition cards students review in the app.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setAiOpen((v) => !v)} className="btn-secondary text-sm py-2 px-3 gap-1.5"><Sparkles size={15} /> Generate with AI</button>
            <button onClick={load} className="btn-secondary text-sm py-2 px-3 gap-1.5"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh</button>
          </div>
        </div>

        {error && <div className="mb-4 bg-error-light border border-error/20 text-error text-sm px-4 py-3 rounded-xl flex items-center gap-2"><AlertCircle size={16} /> {error}</div>}
        {success && <div className="mb-4 bg-success-light border border-success/20 text-success text-sm px-4 py-3 rounded-xl flex items-center gap-2"><CheckCircle2 size={16} /> {success}</div>}

        {/* AI generate panel */}
        {aiOpen && (
          <div className="mb-6 bg-card border border-primary/20 rounded-2xl p-5 space-y-3">
            <p className="font-semibold text-foreground flex items-center gap-1.5"><Sparkles size={16} className="text-primary" /> Generate flashcards with SamyakGURU</p>
            <div className="grid sm:grid-cols-3 gap-3">
              <select value={aiSubject} onChange={(e) => setAiSubject(e.target.value)} className="input-field">
                <option value="">Select subject *</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.display_name}</option>)}
              </select>
              <input value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} placeholder="Topic (optional)" className="input-field" />
              <input type="number" min={1} max={20} value={aiCount} onChange={(e) => setAiCount(parseInt(e.target.value) || 10)} className="input-field" />
            </div>
            <button onClick={generateAI} disabled={aiBusy} className="btn-primary text-sm py-2.5 px-4 gap-1.5 disabled:opacity-60">
              {aiBusy ? <><Loader2 size={15} className="animate-spin" /> Generating…</> : <><Sparkles size={15} /> Generate &amp; Save</>}
            </button>
          </div>
        )}

        {/* Manual create */}
        <div className="mb-6 bg-card border border-border rounded-2xl p-5 space-y-3">
          <p className="font-semibold text-foreground">Add a flashcard</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <textarea value={form.front} onChange={(e) => setForm((f) => ({ ...f, front: e.target.value }))} placeholder="Front (question / term) *" className="input-field min-h-[70px]" />
            <textarea value={form.back} onChange={(e) => setForm((f) => ({ ...f, back: e.target.value }))} placeholder="Back (answer / definition) *" className="input-field min-h-[70px]" />
          </div>
          <input value={form.hint} onChange={(e) => setForm((f) => ({ ...f, hint: e.target.value }))} placeholder="Hint (optional)" className="input-field" />
          <div className="grid sm:grid-cols-2 gap-3">
            <select value={form.subject_id} onChange={(e) => setForm((f) => ({ ...f, subject_id: e.target.value, chapter_id: '' }))} className="input-field">
              <option value="">Subject (optional)</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.display_name}</option>)}
            </select>
            <select value={form.chapter_id} onChange={(e) => setForm((f) => ({ ...f, chapter_id: e.target.value }))} className="input-field" disabled={!form.subject_id}>
              <option value="">Chapter (optional)</option>
              {formChapters.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input type="checkbox" checked={form.is_premium} onChange={(e) => setForm((f) => ({ ...f, is_premium: e.target.checked }))} className="w-4 h-4 rounded accent-primary" />
            Premium (Pro only)
          </label>
          <button onClick={create} disabled={saving} className="btn-primary text-sm py-2.5 px-4 gap-1.5 disabled:opacity-60">
            {saving ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : <><Plus size={15} /> Add Flashcard</>}
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={26} className="animate-spin text-primary" /></div>
        ) : cards.length === 0 ? (
          <div className="text-center py-14 text-muted-foreground"><Layers size={30} className="mx-auto mb-3 opacity-40" /><p className="font-medium">No flashcards yet. Add one above or generate with AI.</p></div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground mb-1">{cards.length} flashcards</p>
            {cards.map((c) => (
              <div key={c.id} className="bg-card border border-border rounded-xl p-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground text-sm">{c.front}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{c.back}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{subjName(c.subject_id)}</span>
                    {c.is_premium && <span className="text-[11px] px-2 py-0.5 rounded-full bg-ma-light text-ma font-semibold">PRO</span>}
                  </div>
                </div>
                <button onClick={() => remove(c.id)} disabled={busyId === c.id} className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-error hover:border-error/30 transition-colors shrink-0">
                  {busyId === c.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
