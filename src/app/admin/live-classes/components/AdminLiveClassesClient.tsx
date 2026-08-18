'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, RefreshCw, Loader2, AlertCircle, Plus, Radio, Play, Square,
  Trash2, Video, Info, CheckCircle2, X,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface LiveClass {
  id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  duration_min: number | null;
  meeting_url: string | null;
  recording_url: string | null;
  status: string;
  subject_id: string | null;
  is_premium: boolean;
}

interface Subject { id: string; display_name: string }

const STATUS_STYLE: Record<string, string> = {
  live: 'bg-error text-white animate-pulse',
  scheduled: 'bg-primary/10 text-primary',
  ended: 'bg-muted text-muted-foreground',
  completed: 'bg-success/15 text-success',
  cancelled: 'bg-error-light text-error',
};

export default function AdminLiveClassesClient() {
  const [rows, setRows] = useState<LiveClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '', description: '', subjectId: '', scheduledAt: '', durationMin: 60, streamUrl: '', isPremium: true,
  });

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [res, subs] = await Promise.all([
        fetch('/api/admin/live-classes'),
        createClient().from('subjects').select('id, display_name').eq('is_active', true),
      ]);
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Could not load classes.'); return; }
      setRows(data.classes ?? []);
      setSubjects(subs.data ?? []);
    } catch { setError('Network error.'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    setSaving(true); setError(null);
    try {
      const res = await fetch('/api/admin/live-classes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Could not create.'); return; }
      setShowForm(false);
      setForm({ title: '', description: '', subjectId: '', scheduledAt: '', durationMin: 60, streamUrl: '', isPremium: true });
      load();
    } catch { setError('Network error.'); } finally { setSaving(false); }
  };

  const patch = async (id: string, body: Record<string, unknown>) => {
    setBusyId(id);
    try {
      await fetch('/api/admin/live-classes', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...body }),
      });
      await load();
    } finally { setBusyId(null); }
  };

  const remove = async (id: string) => {
    setBusyId(id);
    try {
      await fetch(`/api/admin/live-classes?id=${id}`, { method: 'DELETE' });
      await load();
    } finally { setBusyId(null); }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="w-9 h-9 flex items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-muted transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-extrabold text-foreground flex items-center gap-2">
                <Radio size={20} className="text-primary" /> Live Classes
              </h1>
              <p className="text-sm text-muted-foreground">Schedule &amp; control Bunny.net live streams.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} className="btn-secondary text-sm py-2 px-3 gap-1.5">
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
            <button onClick={() => setShowForm((s) => !s)} className="btn-primary text-sm py-2 px-3 gap-1.5">
              {showForm ? <X size={15} /> : <Plus size={15} />} {showForm ? 'Close' : 'New Class'}
            </button>
          </div>
        </div>

        {/* Bunny how-to */}
        <div className="mb-5 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
          <p className="font-semibold text-foreground flex items-center gap-1.5 mb-1"><Info size={15} className="text-primary" /> How to go live with Bunny.net</p>
          <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside leading-relaxed">
            <li>In Bunny.net → <strong>Stream</strong>, create a <strong>Live Stream</strong>. Copy the <strong>HLS playback URL</strong> (ends in <code>.m3u8</code>) and the <strong>RTMP URL + Stream Key</strong>.</li>
            <li>Paste the HLS URL below when creating a class. Broadcast from <strong>OBS</strong> using the RTMP URL + key.</li>
            <li>When you start streaming in OBS, click <strong>Go Live</strong> here — students watch it in-app instantly.</li>
          </ol>
        </div>

        {error && (
          <div className="mb-4 bg-error-light border border-error/20 text-error text-sm px-4 py-3 rounded-xl flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Create form */}
        {showForm && (
          <div className="mb-6 bg-card border border-border rounded-2xl p-5 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Class title *</label>
                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Physics — Rotational Motion (Live)" className="input-field" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Description</label>
                <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="What this class covers" className="input-field" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Subject</label>
                <select value={form.subjectId} onChange={(e) => setForm((f) => ({ ...f, subjectId: e.target.value }))} className="input-field">
                  <option value="">— None —</option>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.display_name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Duration (min)</label>
                <input type="number" value={form.durationMin} onChange={(e) => setForm((f) => ({ ...f, durationMin: parseInt(e.target.value) || 60 }))} className="input-field" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Scheduled time *</label>
                <input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))} className="input-field" />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input type="checkbox" checked={form.isPremium} onChange={(e) => setForm((f) => ({ ...f, isPremium: e.target.checked }))} className="w-4 h-4 rounded border-border accent-primary" />
                  Premium only (Pro / prebook)
                </label>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Bunny HLS playback URL (.m3u8)</label>
                <input value={form.streamUrl} onChange={(e) => setForm((f) => ({ ...f, streamUrl: e.target.value }))} placeholder="https://vz-xxxx.b-cdn.net/xxxxx/playlist.m3u8" className="input-field font-mono text-xs" />
                <p className="text-[11px] text-muted-foreground mt-1">Leave empty to schedule now and add the URL before going live. YouTube live links also work.</p>
              </div>
            </div>
            <button onClick={create} disabled={saving} className="btn-primary w-full justify-center py-2.5 text-sm font-bold disabled:opacity-60">
              {saving ? <><Loader2 size={16} className="animate-spin" /> Creating…</> : <><Plus size={16} /> Create Class</>}
            </button>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-primary" /></div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Radio size={32} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">No live classes yet. Create your first one above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((c) => (
              <div key={c.id} className="bg-card border border-border rounded-2xl p-4 flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase ${STATUS_STYLE[c.status] ?? 'bg-muted text-muted-foreground'}`}>{c.status}</span>
                    {c.is_premium && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-ma-light text-ma">PRO</span>}
                    <p className="font-bold text-foreground truncate">{c.title}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(c.scheduled_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    {' · '}{c.duration_min ?? 60} min
                  </p>
                  {c.meeting_url ? (
                    <p className="text-[11px] text-muted-foreground mt-1 font-mono truncate flex items-center gap-1"><Video size={11} /> {c.meeting_url}</p>
                  ) : (
                    <p className="text-[11px] text-warning mt-1 flex items-center gap-1"><Info size={11} /> No stream URL yet — add one before going live.</p>
                  )}
                  {/* Recording — surfaced on the Lecture Videos page once set. */}
                  {(c.status === 'ended' || c.status === 'completed') && (
                    c.recording_url ? (
                      <p className="text-[11px] text-success mt-1 flex items-center gap-1"><CheckCircle2 size={11} /> Recording added — live on Lecture Videos.</p>
                    ) : (
                      <button
                        onClick={() => {
                          const url = window.prompt('Paste the Bunny recording URL (.m3u8 or .mp4). It will appear under this subject on the Lecture Videos page.');
                          if (url && url.trim()) patch(c.id, { recordingUrl: url.trim() });
                        }}
                        className="text-[11px] text-primary hover:underline mt-1 flex items-center gap-1"
                      >
                        <Plus size={11} /> Add recording URL
                      </button>
                    )
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {c.status !== 'live' ? (
                    <button
                      onClick={() => patch(c.id, { status: 'live' })}
                      disabled={busyId === c.id || !c.meeting_url}
                      title={!c.meeting_url ? 'Add a stream URL first' : 'Go live'}
                      className="btn-primary text-xs py-2 px-3 gap-1.5 disabled:opacity-50"
                    >
                      {busyId === c.id ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />} Go Live
                    </button>
                  ) : (
                    <button onClick={() => patch(c.id, { status: 'ended' })} disabled={busyId === c.id} className="btn-secondary text-xs py-2 px-3 gap-1.5 border-error/30 text-error">
                      {busyId === c.id ? <Loader2 size={13} className="animate-spin" /> : <Square size={13} />} End
                    </button>
                  )}
                  <button onClick={() => remove(c.id)} disabled={busyId === c.id} className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-error hover:border-error/30 transition-colors">
                    <Trash2 size={14} />
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
