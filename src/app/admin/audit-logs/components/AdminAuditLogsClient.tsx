'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Shield, RefreshCw, Loader2, Search, Download,
  Activity, Eye, Calendar, FileText, UserCheck, CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { AuditLog } from '@/types/lms';

export default function AdminAuditLogsClient() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [actionFilter, setActionFilter] = useState('all');
  const [resourceFilter, setResourceFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter !== 'all') params.set('action', actionFilter);
      if (resourceFilter !== 'all') params.set('resourceType', resourceFilter);

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch audit logs');
      setLogs(data.logs || []);
    } catch (err: any) {
      toast.error(err.message || 'Error fetching audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, resourceFilter]);

  const filteredLogs = logs.filter((l) => {
    const q = searchQuery.toLowerCase();
    return (
      l.action.toLowerCase().includes(q) ||
      l.resource_type.toLowerCase().includes(q) ||
      l.actor_id.toLowerCase().includes(q) ||
      JSON.stringify(l.changes_diff || {}).toLowerCase().includes(q)
    );
  });

  const exportCsv = () => {
    const headers = ['ID', 'Actor ID', 'Action', 'Resource Type', 'Resource ID', 'Timestamp', 'Diff'];
    const lines = filteredLogs.map((l) => [
      l.id,
      l.actor_id,
      l.action,
      l.resource_type,
      l.resource_id,
      l.created_at,
      JSON.stringify(l.changes_diff || {}),
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));
    const csv = [headers.join(','), ...lines].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="w-9 h-9 flex items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-muted transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-extrabold text-foreground flex items-center gap-2">
                <Shield size={22} className="text-primary" /> Immutable Audit Trail
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Complete record of administrative actions, role assignments, grants, and score modifications.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportCsv}
              disabled={filteredLogs.length === 0}
              className="btn-secondary py-2 px-3 text-xs font-bold gap-1.5 disabled:opacity-50"
            >
              <Download size={14} /> Export CSV
            </button>
            <button onClick={fetchLogs} className="btn-secondary py-2 px-3 text-xs font-bold gap-1.5">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search action, actor, or diff payload..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-9 py-2 text-xs w-full"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="input-field py-2 text-xs"
          >
            <option value="all">All Actions</option>
            <option value="role_assign">role_assign</option>
            <option value="enrollment_grant">enrollment_grant</option>
            <option value="enrollment_revoke">enrollment_revoke</option>
            <option value="order_verify">order_verify</option>
            <option value="order_refund">order_refund</option>
            <option value="settings_update">settings_update</option>
            <option value="announcement_broadcast">announcement_broadcast</option>
          </select>

          <select
            value={resourceFilter}
            onChange={(e) => setResourceFilter(e.target.value)}
            className="input-field py-2 text-xs"
          >
            <option value="all">All Resource Types</option>
            <option value="user_role">user_role</option>
            <option value="enrollment">enrollment</option>
            <option value="order">order</option>
            <option value="platform_settings">platform_settings</option>
            <option value="announcement">announcement</option>
          </select>
        </div>

        {/* Audit Trail Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-primary" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-2xl text-muted-foreground">
            <Shield size={32} className="mx-auto mb-2 opacity-40" />
            <p className="font-semibold text-sm">No audit records match.</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border uppercase font-semibold text-muted-foreground tracking-wider">
                <tr>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Action</th>
                  <th className="p-3.5">Resource</th>
                  <th className="p-3.5">Actor</th>
                  <th className="p-3.5">Summary / Diff</th>
                  <th className="p-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-muted/30 transition-colors font-mono">
                    <td className="p-3.5 whitespace-nowrap text-muted-foreground font-sans text-[11px]">
                      {new Date(l.created_at).toLocaleString()}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary">
                        {l.action}
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap font-sans font-semibold text-foreground">
                      {l.resource_type}
                    </td>
                    <td className="p-3.5 text-muted-foreground text-[11px]">
                      {l.changes_diff?.actor_email || l.actor_id.slice(0, 10)}
                    </td>
                    <td className="p-3.5 font-sans text-muted-foreground text-xs max-w-xs truncate">
                      {JSON.stringify(l.changes_diff || {})}
                    </td>
                    <td className="p-3.5 text-right font-sans">
                      <button
                        onClick={() => setSelectedLog(l)}
                        className="px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold transition-colors flex items-center gap-1 ml-auto"
                      >
                        <Eye size={13} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Diff Inspection Modal */}
        {selectedLog && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl max-w-xl w-full p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <FileText size={16} className="text-primary" /> Audit Event Detail
                </h3>
                <button onClick={() => setSelectedLog(null)} className="text-muted-foreground hover:text-foreground">
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2 bg-muted/40 p-3 rounded-xl">
                  <div>
                    <span className="text-muted-foreground font-semibold">Action:</span>
                    <p className="font-bold text-primary font-mono">{selectedLog.action}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-semibold">Resource:</span>
                    <p className="font-bold text-foreground font-mono">{selectedLog.resource_type} ({selectedLog.resource_id})</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-semibold">Actor:</span>
                    <p className="font-mono text-muted-foreground">{selectedLog.changes_diff?.actor_email || selectedLog.actor_id}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-semibold">Timestamp:</span>
                    <p className="text-muted-foreground">{new Date(selectedLog.created_at).toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <span className="block font-semibold text-foreground mb-1">Audit Changes Payload (JSON Diff):</span>
                  <pre className="p-3 rounded-xl bg-muted/60 border border-border text-[11px] font-mono overflow-x-auto max-h-60 text-foreground">
                    {JSON.stringify(selectedLog.changes_diff, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-border">
                <button onClick={() => setSelectedLog(null)} className="btn-primary py-1.5 px-4 text-xs font-bold">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
