'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  KeyRound, Plus, Copy, Check, Trash2, Loader2, AlertCircle,
  ArrowLeft, RefreshCw, CheckCircle2, Clock, XCircle
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface ActivationCode {
  id: string;
  code: string;
  plan: string;
  duration_days: number;
  is_active: boolean;
  used_by: string | null;
  used_at: string | null;
  expires_at: string | null;
  notes: string | null;
  created_at: string;
}

const PLAN_OPTIONS = [
  { value: 'student', label: 'Student Plan', color: 'text-primary bg-primary/10' },
  { value: 'pro', label: 'Pro Plan', color: 'text-ma bg-ma-light' },
];

const DURATION_OPTIONS = [
  { value: 30, label: '1 Month' },
  { value: 90, label: '3 Months' },
  { value: 180, label: '6 Months' },
  { value: 365, label: '1 Year' },
];

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const seg = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `SAMYAK-${seg()}-${seg()}`;
}

export default function AdminActivationCodesClient() {
  const [codes, setCodes] = useState<ActivationCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'used'>('all');

  // Form state
  const [newPlan, setNewPlan] = useState('student');
  const [newDuration, setNewDuration] = useState(30);
  const [newNotes, setNewNotes] = useState('');
  const [newExpiry, setNewExpiry] = useState('');
  const [showForm, setShowForm] = useState(false);

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from('activation_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setCodes(data ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load codes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      const code = generateCode();

      const { error: insertError } = await supabase.from('activation_codes').insert({
        code,
        plan: newPlan,
        duration_days: newDuration,
        notes: newNotes.trim() || null,
        expires_at: newExpiry ? new Date(newExpiry).toISOString() : null,
        created_by: userData.user?.id ?? null,
      });

      if (insertError) throw insertError;

      setNewNotes('');
      setNewExpiry('');
      setShowForm(false);
      await fetchCodes();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate code');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this activation code? This cannot be undone.')) return;
    try {
      const supabase = createClient();
      const { error: deleteError } = await supabase
        .from('activation_codes')
        .delete()
        .eq('id', id);
      if (deleteError) throw deleteError;
      setCodes((prev) => prev.filter((c) => c.id !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete code');
    }
  };

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const filtered = codes.filter((c) => {
    if (filterStatus === 'active') return c.is_active && !c.used_by;
    if (filterStatus === 'used') return !!c.used_by;
    return true;
  });

  const planBadge = (plan: string) => {
    const opt = PLAN_OPTIONS.find((p) => p.value === plan);
    return (
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${opt?.color ?? 'bg-muted text-muted-foreground'}`}>
        {opt?.label ?? plan}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <KeyRound size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Activation Codes</h1>
            <p className="text-sm text-muted-foreground">Generate and manage plan activation codes for students</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={fetchCodes} className="btn-ghost p-2" title="Refresh">
              <RefreshCw size={16} />
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={16} />
              Generate Code
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-error-light border border-error/20 rounded-xl p-4 flex items-start gap-3 mb-6">
            <AlertCircle size={18} className="text-error shrink-0 mt-0.5" />
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        {/* Generate Form */}
        {showForm && (
          <div className="card-base p-6 mb-6 border-2 border-primary/20">
            <h2 className="font-semibold text-foreground mb-4">Generate New Code</h2>
            <form onSubmit={handleGenerate} className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Plan</label>
                <select
                  value={newPlan}
                  onChange={(e) => setNewPlan(e.target.value)}
                  className="input-base w-full"
                >
                  {PLAN_OPTIONS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Duration</label>
                <select
                  value={newDuration}
                  onChange={(e) => setNewDuration(Number(e.target.value))}
                  className="input-base w-full"
                >
                  {DURATION_OPTIONS.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Expires On (optional)</label>
                <input
                  type="date"
                  value={newExpiry}
                  onChange={(e) => setNewExpiry(e.target.value)}
                  className="input-base w-full"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Notes (optional)</label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. Student name or order ref"
                  className="input-base w-full"
                />
              </div>
              <div className="sm:col-span-2 flex gap-3">
                <button
                  type="submit"
                  disabled={generating}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  {generating ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                  {generating ? 'Generating...' : 'Generate & Save'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Codes', value: codes.length, icon: KeyRound, color: 'text-primary' },
            { label: 'Active', value: codes.filter((c) => c.is_active && !c.used_by).length, icon: CheckCircle2, color: 'text-success' },
            { label: 'Used', value: codes.filter((c) => !!c.used_by).length, icon: Clock, color: 'text-muted-foreground' },
          ].map((stat) => (
            <div key={stat.label} className="card-base p-4 text-center">
              <stat.icon size={20} className={`${stat.color} mx-auto mb-1`} />
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-4">
          {(['all', 'active', 'used'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilterStatus(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${filterStatus === f ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Codes Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card-base p-12 text-center">
            <KeyRound size={36} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No codes found. Generate your first activation code.</p>
          </div>
        ) : (
          <div className="card-base overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Code</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Plan</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Duration</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Notes</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Created</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-xs bg-muted px-2 py-1 rounded text-foreground tracking-wider">
                            {c.code}
                          </code>
                          <button
                            onClick={() => handleCopy(c.code, c.id)}
                            className="text-muted-foreground hover:text-primary transition-colors"
                            title="Copy code"
                          >
                            {copiedId === c.id ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">{planBadge(c.plan)}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {DURATION_OPTIONS.find((d) => d.value === c.duration_days)?.label ?? `${c.duration_days}d`}
                      </td>
                      <td className="px-4 py-3">
                        {c.used_by ? (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <CheckCircle2 size={13} className="text-success" /> Used
                          </span>
                        ) : c.is_active ? (
                          <span className="flex items-center gap-1 text-xs text-success">
                            <CheckCircle2 size={13} /> Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-error">
                            <XCircle size={13} /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-[120px] truncate">
                        {c.notes ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {!c.used_by && (
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="text-muted-foreground hover:text-error transition-colors"
                            title="Delete code"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
