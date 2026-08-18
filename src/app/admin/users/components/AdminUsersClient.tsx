'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, RefreshCw, Loader2, AlertCircle, Download, Search,
  Users, Crown, Rocket, Activity, UserX, GraduationCap,
} from 'lucide-react';

interface Row {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  college: string;
  cee_year: number | null;
  plan: string;
  plan_expires_at: string | null;
  is_subscriber: boolean;
  is_admin: boolean;
  prebook_status: string | null;
  is_prebooker: boolean;
  battle_rating: number;
  total_points: number;
  last_sign_in_at: string | null;
  active: boolean;
  created_at: string | null;
}

interface Summary {
  total: number; subscribers: number; prebookers: number; free: number; active: number; inactive: number;
}

type Filter = 'all' | 'subscribers' | 'prebookers' | 'free' | 'active' | 'inactive';

const PLAN_STYLE: Record<string, string> = {
  pro: 'bg-ma-light text-ma',
  student: 'bg-primary/10 text-primary',
  institution: 'bg-chem-light text-chem',
  free: 'bg-muted text-muted-foreground',
};

function fmt(iso: string | null): string {
  if (!iso) return 'Never';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AdminUsersClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Could not load users.'); return; }
      setRows(data.users ?? []);
      setSummary(data.summary ?? null);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => rows.filter((r) => {
    if (filter === 'subscribers' && !r.is_subscriber) return false;
    if (filter === 'prebookers' && !r.is_prebooker) return false;
    if (filter === 'free' && r.is_subscriber) return false;
    if (filter === 'active' && !r.active) return false;
    if (filter === 'inactive' && r.active) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return r.full_name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) ||
           r.phone.includes(q) || r.college.toLowerCase().includes(q);
  }), [rows, filter, query]);

  const exportCsv = () => {
    const headers = ['Name', 'Email', 'Phone', 'College', 'CEE Year', 'Plan', 'Subscriber', 'Prebook', 'Active', 'Last Sign In', 'Points', 'Rating', 'Joined'];
    const lines = filtered.map((r) => [
      r.full_name, r.email, r.phone, r.college, r.cee_year ?? '', r.plan,
      r.is_subscriber ? 'yes' : 'no', r.prebook_status ?? '', r.active ? 'active' : 'inactive',
      r.last_sign_in_at ?? '', r.total_points, r.battle_rating, r.created_at ?? '',
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));
    const csv = [headers.join(','), ...lines].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url; a.download = `students-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const cards = summary ? [
    { label: 'Total students', value: summary.total, icon: Users, color: 'text-primary', bg: 'bg-primary/10', f: 'all' as Filter },
    { label: 'Subscribers', value: summary.subscribers, icon: Crown, color: 'text-ma', bg: 'bg-ma-light', f: 'subscribers' as Filter },
    { label: 'Presale (paid)', value: summary.prebookers, icon: Rocket, color: 'text-chem', bg: 'bg-chem-light', f: 'prebookers' as Filter },
    { label: 'Free plan', value: summary.free, icon: GraduationCap, color: 'text-muted-foreground', bg: 'bg-muted', f: 'free' as Filter },
    { label: 'Active (30d)', value: summary.active, icon: Activity, color: 'text-success', bg: 'bg-success-light', f: 'active' as Filter },
    { label: 'Inactive', value: summary.inactive, icon: UserX, color: 'text-error', bg: 'bg-error-light', f: 'inactive' as Filter },
  ] : [];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="w-9 h-9 flex items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-muted transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-extrabold text-foreground flex items-center gap-2">
                <Users size={20} className="text-primary" /> Students &amp; Subscribers
              </h1>
              <p className="text-sm text-muted-foreground">Everyone on the platform — plans, presale, and activity.</p>
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

        {cards.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
            {cards.map((c) => (
              <button
                key={c.label}
                onClick={() => setFilter(c.f)}
                className={`bg-card border rounded-2xl p-4 text-left transition-all ${filter === c.f ? 'border-primary ring-1 ring-primary/30' : 'border-border hover:border-primary/30'}`}
              >
                <div className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center mb-2`}>
                  <c.icon size={18} className={c.color} />
                </div>
                <p className="text-2xl font-extrabold text-foreground tabular-nums">{c.value}</p>
                <p className="text-xs text-muted-foreground">{c.label}</p>
              </button>
            ))}
          </div>
        )}

        <div className="relative mb-4 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email, phone, college…" className="input-field pl-9" />
        </div>

        {error ? (
          <div className="bg-error-light border border-error/20 text-error text-sm px-4 py-3 rounded-xl flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Users size={32} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">No students match.</p>
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
                    <th className="px-4 py-3 font-semibold">Plan</th>
                    <th className="px-4 py-3 font-semibold">Presale</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Last Seen</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-semibold text-foreground flex items-center gap-1.5">
                          {r.full_name || '—'}
                          {r.is_admin && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">ADMIN</span>}
                        </div>
                        <div className="text-xs text-muted-foreground">{r.email}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">{r.phone || '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                        <div>{r.college || '—'}</div>
                        {r.cee_year && <div>CEE {r.cee_year}</div>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full capitalize ${PLAN_STYLE[r.plan] ?? PLAN_STYLE.free}`}>{r.plan}</span>
                        {r.is_subscriber && r.plan_expires_at && (
                          <div className="text-[10px] text-muted-foreground mt-0.5">until {fmt(r.plan_expires_at)}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {r.prebook_status ? (
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${r.is_prebooker ? 'bg-success/15 text-success' : 'bg-ma-light text-ma'}`}>
                            {r.is_prebooker ? 'Paid' : r.prebook_status.replace('_', ' ')}
                          </span>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${r.active ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${r.active ? 'bg-success' : 'bg-muted-foreground'}`} />
                          {r.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{fmt(r.last_sign_in_at)}</td>
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
