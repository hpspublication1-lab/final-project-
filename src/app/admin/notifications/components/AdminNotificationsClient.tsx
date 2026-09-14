'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, BellRing, Send, CheckCircle2, AlertCircle,
  Users, Radio, Clock
} from 'lucide-react';
import { toast } from 'sonner';

interface NotificationLog {
  id: string;
  title: string;
  body: string;
  recipient: string;
  link_url?: string;
  created_at: string;
}

export default function AdminNotificationsClient() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [targetType, setTargetType] = useState<'all' | 'see' | 'cee'>('all');
  const [sending, setSending] = useState(false);

  const [recentDispatches, setRecentDispatches] = useState<NotificationLog[]>([
    {
      id: 'notif_1',
      title: 'Grand Mock 1 Ready for Review',
      body: 'Your full score card and KaTeX solutions are now available.',
      recipient: 'All CEE Candidates',
      link_url: '/mock-tests',
      created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: 'notif_2',
      title: 'Live Doubt Clearing Class in 30 Mins',
      body: 'Join the interactive botany session with teacher discussion.',
      recipient: 'CEE 2026 Batch',
      link_url: '/live-class',
      created_at: new Date(Date.now() - 3600000 * 20).toISOString(),
    },
  ]);

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    setSending(true);
    setTimeout(() => {
      const newDispatch: NotificationLog = {
        id: `notif_${Date.now()}`,
        title: title.trim(),
        body: body.trim(),
        recipient: targetType === 'all' ? 'All Registered Students' : targetType === 'cee' ? 'CEE Candidates' : 'SEE Candidates',
        link_url: linkUrl.trim() || undefined,
        created_at: new Date().toISOString(),
      };
      setRecentDispatches((prev) => [newDispatch, ...prev]);
      toast.success('In-app notification dispatched to student notification trays!');
      setTitle('');
      setBody('');
      setLinkUrl('');
      setSending(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="w-9 h-9 flex items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-muted transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-extrabold text-foreground flex items-center gap-2">
                <BellRing size={22} className="text-primary" /> In-App Notification Dispatcher
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Send direct in-app notifications and deep-links to candidate dashboards.
              </p>
            </div>
          </div>
        </div>

        {/* Dispatch Form */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
            <Send size={16} className="text-primary" /> Compose &amp; Send Notification
          </h2>

          <form onSubmit={handleDispatch} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-foreground mb-1">Target Candidates:</label>
                <select
                  value={targetType}
                  onChange={(e: any) => setTargetType(e.target.value)}
                  className="input-field w-full py-2 text-xs"
                >
                  <option value="all">All Registered Students</option>
                  <option value="cee">CEE Medical Aspirants</option>
                  <option value="see">SEE Class 10 Students</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">Deep Link Target (Optional):</label>
                <input
                  type="text"
                  placeholder="e.g. /mock-tests or /live-class"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="input-field w-full py-2 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">Notification Title:</label>
              <input
                type="text"
                required
                placeholder="e.g. Grand Mock 2 Live: All Nepal Leaderboard is Open"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field w-full py-2 text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">Notification Body:</label>
              <textarea
                rows={3}
                required
                placeholder="Enter alert message to appear in candidate top notification bell..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="input-field w-full py-2 text-xs"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={sending}
                className="btn-primary py-2 px-5 text-xs font-bold flex items-center gap-1.5"
              >
                <Send size={13} /> {sending ? 'Dispatching...' : 'Dispatch Notification'}
              </button>
            </div>
          </form>
        </div>

        {/* Recent Dispatches */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
            <Clock size={16} className="text-primary" /> Recent Dispatches
          </h2>

          <div className="divide-y divide-border">
            {recentDispatches.map((n) => (
              <div key={n.id} className="py-3 flex items-start justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">{n.title}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground">
                      {n.recipient}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{n.body}</p>
                  {n.link_url && (
                    <span className="text-[11px] text-primary font-mono font-semibold">Link: {n.link_url}</span>
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                  {new Date(n.created_at).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
