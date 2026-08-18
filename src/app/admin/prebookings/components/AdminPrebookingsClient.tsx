'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, RefreshCw, Loader2, AlertCircle, Download, Search,
  Users, CheckCircle2, Clock, Wallet, Rocket,
} from 'lucide-react';

interface Prebooking {
  id: string;
  reference: string;
  full_name: string;
  phone: string;
  email: string | null;
  college: string | null;
  cee_year: number | null;
  amount_paisa: number;
  status: string;
  payment_method: string | null;
  payment_ref: string | null;
  utm_source: string | null;
  created_at: string;
}

interface Summary {
  total: number;
  confirmed: number;
  pending: number;
  revenueNpr: number;
}

const STATUS_STYLES: Record<string, string> = {
  confirmed: 'bg-success/15 text-success',
  reserved: 'bg-ma-light text-ma',
  payment_claimed: 'bg-primary/10 text-primary',
  cancelled: 'bg-error-light text-error',
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdminPrebookingsClient() {
  const [rows, setRows] = useState<Prebooking[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'pending'>('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/prebookings');
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Could not load prebookings.');
        return;
      }
      setRows(data.prebookings ?? []);
      setSummary(data.summary ?? null);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter === 'confirmed' && r.status !== 'confirmed') return false;
      if (statusFilter === 'pending' && (r.status === 'confirmed' || r.status === 'cancelled')) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        r.full_name?.toLowerCase().includes(q) ||
        r.phone?.includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.reference?.toLowerCase().includes(q) ||
        r.college?.toLowerCase().includes(q)
      );
    });
  }, [rows, query, statusFilter]);

  const exportCsv = () => {
    const headers = ['Reference', 'Name', 'Phone', 'Email', 'College', 'CEE Year', 'Amount (NPR)', 'Status', 'Method', 'Payment Ref', 'Source', 'Created'];
    const lines = filtered.map((r) => [
      r.reference, r.full_name, r.phone, r.email ?? '', r.college ?? '', r.cee_year ?? '',
      (r.amount_paisa / 100).toFixed(0), r.status, r.payment_method ?? '', r.payment_ref ?? '', r.utm_source ?? '', r.created_at,
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));
    const csv = [headers.join(','), ...lines].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `prebookings-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const cards = summary
    ? [
        { label: 'Total leads', value: summary.total, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
        { label: 'Paid & confirmed', value: summary.confirmed, icon: CheckCircle2, color: 'text-success', bg: 'bg-success-light' },
        { label: 'Pending payment', value: summary.pending, icon: Clock, color: 'text-ma', bg: 'bg-ma-light' },
        { label: 'Revenue (NPR)', value: summary.revenueNpr.toLocaleString('en-IN'), icon: Wallet, color: 'text-chem', bg: 'bg-chem-light' },
      ]
    : [];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="w-9 h-9 flex items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-muted transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-extrabold text-foreground flex items-center gap-2">
                <Rocket size={20} className="text-primary" /> Presale / Prebookings
              </h1>
              <p className="text-sm text-muted-foreground">Crash-course prebooking leads &amp; Fonepay payments.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportCsv} disabled={!filtered.length} className="btn-secondary text-sm py-2 px-3 gap-1.5 disabled:opacity-50">
              <Download size={15} /> Export CSV
            </button>
            <button onClick={load} className="btn-secondary text-sm py-2 px-3 gap-1.5">
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        {/* Summary cards */}
        {cards.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {cards.map((c) => (
              <div key={c.label} className="bg-card border border-border rounded-2xl p-4">
                <div className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center mb-2`}>
                  <c.icon size={18} className={c.color} />
                </div>
                <p className="text-2xl font-extrabold text-foreground tabular-nums">{c.value}</p>
                <p className="text-xs text-muted-foreground">{c.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, phone, email, reference…"
              className="input-field pl-9"
            />
          </div>
          <div className="flex rounded-xl bg-muted p-1 gap-1">
            {(['all', 'confirmed', 'pending'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg capitalize transition-all ${
                  statusFilter === s ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        {error ? (
          <div className="bg-error-light border border-error/20 text-error text-sm px-4 py-3 rounded-xl flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 size={28} className="animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Rocket size={32} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">No prebookings match.</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-left text-xs text-muted-foreground uppercase tracking-wide">
                    <th className="px-4 py-3 font-semibold">Student</th>
                    <th className="px-4 py-3 font-semibold">Contact</th>
                    <th className="px-4 py-3 font-semibold">College · Year</th>
                    <th className="px-4 py-3 font-semibold">Amount</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Reference</th>
                    <th className="px-4 py-3 font-semibold">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-semibold text-foreground whitespace-nowrap">{r.full_name}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        <div>{r.phone}</div>
                        {r.email && <div className="text-xs">{r.email}</div>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        <div>{r.college || '—'}</div>
                        {r.cee_year && <div className="text-xs">CEE {r.cee_year}</div>}
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground whitespace-nowrap">Rs {(r.amount_paisa / 100).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_STYLES[r.status] ?? 'bg-muted text-muted-foreground'}`}>
                          {r.status.replace('_', ' ')}
                        </span>
                        {r.payment_method && <div className="text-[11px] text-muted-foreground mt-0.5 capitalize">{r.payment_method}</div>}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-primary whitespace-nowrap">{r.reference}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{fmtDate(r.created_at)}</td>
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
