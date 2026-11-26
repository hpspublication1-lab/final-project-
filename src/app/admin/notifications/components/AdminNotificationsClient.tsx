'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, BellRing, Send, CheckCircle2, AlertCircle,
  Users, Radio, Clock, Loader2, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface NotificationLog {
  id: string;
  title: string;
  body: string;
  recipient: string;
  link_url?: string;
  count?: number;
  created_at: string;
}

export default function AdminNotificationsClient() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [targetType, setTargetType] = useState<'all' | 'see' | 'cee'>('all');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recentDispatches, setRecentDispatches] = useState<NotificationLog[]>([]);

  const loadDispatches = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/notifications');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.dispatches)) {
          setRecentDispatches(data.dispatches);
        }
      }
    } catch (err) {
      console.error('[AdminNotifications] Failed to load dispatches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDispatches();
  }, []);

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error('Title and message body are required.');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          targetType,
          linkUrl: linkUrl.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to dispatch notification.');
      }

      const newDispatch: NotificationLog = data.dispatch || {
        id: `notif_${Date.now()}`,
        title: title.trim(),
        body: body.trim(),
        recipient:
          targetType === 'all'
            ? 'All Registered Students'
            : targetType === 'cee'
            ? 'CEE Candidates'
            : 'SEE Candidates',
        link_url: linkUrl.trim() || undefined,
        count: data.count || 0,
        created_at: new Date().toISOString(),
      };

      setRecentDispatches((prev) => [newDispatch, ...prev]);
      toast.success(data.message || `Dispatched to ${data.count ?? 'all'} student notification trays!`);
      setTitle('');
      setBody('');
      setLinkUrl('');
    } catch (err: any) {
      console.error('[AdminNotifications] Dispatch error:', err);
      toast.error(err.message || 'Failed to dispatch notification.');
    } finally {
      setSending(false);
    }
  };

  const testDeviceNotification = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      toast.error('Device notifications are not supported in this browser.');
      return;
    }

    try {
      let perm = Notification.permission;
      if (perm !== 'granted') {
        perm = await Notification.requestPermission();
      }

      if (perm === 'granted') {
        const testTitle = 'Samyak Guru Admin Test Alert 🔔';
        const testBody = 'This is a real system notification delivered to your operating system.';

        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification(testTitle, {
              body: testBody,
              icon: '/favicon.ico',
              badge: '/favicon.ico',
              tag: 'admin-test-alert',
              data: { url: '/admin/notifications' },
            });
          }).catch(() => {
            new Notification(testTitle, { body: testBody, icon: '/favicon.ico' });
          });
        } else {
          new Notification(testTitle, { body: testBody, icon: '/favicon.ico' });
        }
        toast.success('Native device notification triggered on your screen!');
        import('@/lib/firebase/messaging').then(({ registerFCMDevice }) => {
          registerFCMDevice().catch(() => {});
        }).catch(() => {});
      } else {
        toast.error('Device notification permission was not granted. Please allow notifications in site settings.');
      }
    } catch (err) {
      console.error('Test notification error:', err);
    }
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
          <div className="flex items-center gap-2">
            <button
              onClick={testDeviceNotification}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
            >
              <BellRing size={12} />
              <span>Test Device Alert</span>
            </button>
            <button
              onClick={loadDispatches}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-border bg-card hover:bg-muted text-foreground transition-colors"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              <span>Refresh Logs</span>
            </button>
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
                  placeholder="e.g. /mock-tests or /live-classes"
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
                {sending ? (
                  <>
                    <Loader2 size={13} className="animate-spin" /> Dispatching...
                  </>
                ) : (
                  <>
                    <Send size={13} /> Dispatch Notification
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Recent Dispatches */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Clock size={16} className="text-primary" /> Recent Dispatches
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {recentDispatches.length} Total
            </span>
          </div>

          {loading ? (
            <div className="py-8 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
              <Loader2 size={20} className="animate-spin text-primary" />
              <span className="text-xs">Loading dispatch history...</span>
            </div>
          ) : recentDispatches.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground space-y-1">
              <Clock size={24} className="mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-xs font-semibold text-foreground">No Dispatches Yet</p>
              <p className="text-[11px]">Compose and dispatch your first in-app notification above.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentDispatches.map((n) => (
                <div key={n.id} className="py-3 flex items-start justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-foreground">{n.title}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground">
                        {n.recipient}
                      </span>
                      {typeof n.count === 'number' && n.count > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          {n.count} recipients
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground">{n.body}</p>
                    {n.link_url && (
                      <span className="text-[11px] text-primary font-mono font-semibold block">
                        Link: {n.link_url}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">
                    {new Date(n.created_at).toLocaleDateString()} {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
