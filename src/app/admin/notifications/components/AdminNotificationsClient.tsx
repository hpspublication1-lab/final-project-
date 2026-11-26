'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, BellRing, Send, CheckCircle2, AlertCircle,
  Users, Radio, Clock, Loader2, RefreshCw, Volume2, ShieldAlert
} from 'lucide-react';
import { toast } from 'sonner';
import {
  triggerDeviceNotification,
  playNotificationChime,
  getNotificationPermissionStatus,
  requestNotificationPermission,
} from '@/lib/notifications/deviceNotification';

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
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported'>('default');

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
    setPermissionStatus(getNotificationPermissionStatus());
  }, []);

  const handleRequestPermission = async () => {
    const perm = await requestNotificationPermission();
    setPermissionStatus(perm);
    if (perm === 'granted') {
      toast.success('Device notifications allowed! You will now receive system alerts.');
      await triggerDeviceNotification({
        title: 'Samyak Guru Alerts Enabled 🔔',
        body: 'You will now receive real-time notifications on this device.',
      });
      import('@/lib/firebase/messaging').then(({ registerFCMDevice }) => {
        registerFCMDevice().catch(() => {});
      }).catch(() => {});
    } else if (perm === 'denied') {
      toast.error('Notifications are blocked by your browser settings.');
    }
  };

  const testDeviceAlert = async () => {
    const res = await triggerDeviceNotification({
      title: '🔴 Samyak Guru Live Alert',
      body: 'Real device notification triggered successfully on your operating system!',
      actionUrl: '/admin/notifications',
    });

    setPermissionStatus(getNotificationPermissionStatus());

    if (res.success) {
      toast.success('Device notification alert triggered on your screen!');
      import('@/lib/firebase/messaging').then(({ registerFCMDevice }) => {
        registerFCMDevice().catch(() => {});
      }).catch(() => {});
    } else if (res.reason === 'denied') {
      toast.error('Device notifications are blocked in your browser site permissions.');
    } else if (res.reason === 'unsupported') {
      toast.error('Browser does not support native system notifications.');
    } else {
      toast.error('Notification was not displayed. Please check your browser permissions.');
    }
  };

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

      // Trigger instant preview on admin's own device with audio chime!
      await triggerDeviceNotification({
        title: title.trim(),
        body: body.trim(),
        actionUrl: linkUrl.trim() || undefined,
      });

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
                <BellRing size={22} className="text-primary" /> In-App &amp; Device Notification Dispatcher
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Send direct in-app notifications and real operating system push alerts to candidate dashboards.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={testDeviceAlert}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 transition-colors shadow-sm"
              title="Test native OS pop-up alert and audio chime on your device"
            >
              <BellRing size={13} />
              <span>Test Device Alert</span>
            </button>
            <button
              type="button"
              onClick={playNotificationChime}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-border bg-card hover:bg-muted text-foreground transition-colors"
              title="Test audio chime"
            >
              <Volume2 size={13} />
              <span>Chime</span>
            </button>
            <button
              type="button"
              onClick={loadDispatches}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-border bg-card hover:bg-muted text-foreground transition-colors"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              <span>Refresh Logs</span>
            </button>
          </div>
        </div>

        {/* Browser Permission Status Banner */}
        {permissionStatus === 'denied' && (
          <div className="bg-red-500/10 border-2 border-red-500/30 rounded-2xl p-4 flex items-start gap-3 text-xs text-red-600 dark:text-red-400">
            <ShieldAlert size={18} className="shrink-0 mt-0.5 text-red-600" />
            <div className="space-y-1">
              <p className="font-bold text-sm">Browser Notifications are Blocked</p>
              <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">
                Your browser is currently set to block notifications for this site. To receive real system pop-ups on your desktop or phone:
              </p>
              <ol className="list-decimal list-inside space-y-0.5 font-medium pl-1 text-[11px]">
                <li>Click the tune / lock icon <span className="font-mono bg-red-500/10 px-1 rounded">🔒</span> on the far left of your address bar (next to the URL).</li>
                <li>Find <strong>Notifications</strong> and change it from <em>Block</em> to <strong>Allow</strong>.</li>
                <li>Click the <strong>Test Device Alert</strong> button above to verify.</li>
              </ol>
            </div>
          </div>
        )}

        {permissionStatus === 'default' && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-300">
            <div className="flex items-center gap-2.5">
              <BellRing size={18} className="shrink-0 text-amber-600" />
              <div>
                <p className="font-bold">Device Notifications Not Yet Allowed</p>
                <p className="text-[11px] text-amber-700 dark:text-amber-400">
                  Allow browser notifications to receive real OS popups on your device.
                </p>
              </div>
            </div>
            <button
              onClick={handleRequestPermission}
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-all shrink-0"
            >
              Allow Alerts
            </button>
          </div>
        )}

        {permissionStatus === 'granted' && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-4 py-2 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
            <CheckCircle2 size={15} className="text-emerald-600" />
            <span>Real Operating System &amp; Device Notifications Active on this Device</span>
          </div>
        )}

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
                placeholder="Enter alert message to appear in candidate notification trays and system popups..."
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
