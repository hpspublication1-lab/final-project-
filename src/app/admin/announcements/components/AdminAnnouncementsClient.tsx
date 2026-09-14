'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Megaphone, Plus, RefreshCw, Loader2, Pin,
  Archive, CheckCircle2, AlertCircle, Users, Radio
} from 'lucide-react';
import { toast } from 'sonner';

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  target_audience: 'all' | 'see' | 'cee' | 'batch';
  batch_id?: string;
  is_pinned: boolean;
  created_at: string;
}

export default function AdminAnnouncementsClient() {
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  
  // Compose modal
  const [composeOpen, setComposeOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetAudience, setTargetAudience] = useState<'all' | 'see' | 'cee'>('all');
  const [isPinned, setIsPinned] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);

  // Archive state
  const [archiveTarget, setArchiveTarget] = useState<AnnouncementItem | null>(null);
  const [archiving, setArchiving] = useState(false);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/announcements');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load announcements');
      setAnnouncements(data.announcements || []);
    } catch (err: any) {
      toast.error(err.message || 'Error fetching announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setBroadcasting(true);
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          targetAudience,
          isPinned,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to broadcast announcement');
      toast.success('Announcement broadcasted and audit logged!');
      setComposeOpen(false);
      setTitle('');
      setContent('');
      setIsPinned(false);
      fetchAnnouncements();
    } catch (err: any) {
      toast.error(err.message || 'Broadcast failed');
    } finally {
      setBroadcasting(false);
    }
  };

  const handleArchive = async () => {
    if (!archiveTarget) return;
    setArchiving(true);
    try {
      const res = await fetch(`/api/admin/announcements?id=${archiveTarget.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to archive');
      toast.success('Announcement archived.');
      setArchiveTarget(null);
      fetchAnnouncements();
    } catch (err: any) {
      toast.error(err.message || 'Archival failed');
    } finally {
      setArchiving(false);
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
                <Megaphone size={22} className="text-primary" /> Bulletins &amp; Announcements
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Broadcast vital exam notifications, scheduling alerts, and grand mock updates.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setComposeOpen(true)}
              className="btn-primary py-2 px-3 text-xs font-bold gap-1.5 flex items-center"
            >
              <Plus size={14} /> New Announcement
            </button>
            <button onClick={fetchAnnouncements} className="btn-secondary py-2 px-3 text-xs font-bold gap-1.5">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        {/* Announcements List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-primary" />
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-2xl text-muted-foreground">
            <Megaphone size={32} className="mx-auto mb-2 opacity-40" />
            <p className="font-semibold text-sm">No announcements posted yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((a) => (
              <div
                key={a.id}
                className={`bg-card border rounded-2xl p-5 shadow-sm transition-all ${
                  a.is_pinned ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {a.is_pinned && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-primary text-primary-foreground flex items-center gap-1">
                          <Pin size={10} /> PINNED
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-muted text-muted-foreground">
                        Target: {a.target_audience}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(a.created_at).toLocaleString()}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-foreground">{a.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{a.content}</p>
                  </div>

                  <button
                    onClick={() => setArchiveTarget(a)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-error hover:bg-error-light transition-colors shrink-0"
                    title="Archive announcement"
                  >
                    <Archive size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Compose Modal */}
        {composeOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <form onSubmit={handleBroadcast} className="bg-card border border-border rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Megaphone size={16} className="text-primary" /> Post Student Announcement
                </h3>
                <button type="button" onClick={() => setComposeOpen(false)} className="text-muted-foreground hover:text-foreground">
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-foreground mb-1">Target Audience:</label>
                  <select
                    value={targetAudience}
                    onChange={(e: any) => setTargetAudience(e.target.value)}
                    className="input-field w-full py-2 text-xs"
                  >
                    <option value="all">All Enrolled Students</option>
                    <option value="cee">CEE Medical Entrance Students</option>
                    <option value="see">SEE Class 10 Board Students</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">Announcement Headline:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Grand Mock 2 Starts this Saturday at 11:00 AM"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="input-field w-full py-2 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">Detailed Message:</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Provide full instructions, links, or notice details..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="input-field w-full py-2 text-xs leading-relaxed"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="pinned-check"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <label htmlFor="pinned-check" className="font-semibold text-foreground cursor-pointer">
                    Pin announcement to the top of student dashboards
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setComposeOpen(false)}
                  className="btn-secondary py-1.5 px-3 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={broadcasting}
                  className="btn-primary py-1.5 px-4 text-xs font-bold flex items-center gap-1.5"
                >
                  {broadcasting ? <Loader2 size={13} className="animate-spin" /> : <Radio size={13} />}
                  Broadcast Notice
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Archive Confirmation Modal */}
        {archiveTarget && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Archive size={16} className="text-error" /> Archive Notice
                </h3>
                <button onClick={() => setArchiveTarget(null)} className="text-muted-foreground hover:text-foreground">
                  ✕
                </button>
              </div>

              <p className="text-xs text-muted-foreground">
                Are you sure you want to archive <strong>"{archiveTarget.title}"</strong>? It will no longer appear on active student dashboards.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button onClick={() => setArchiveTarget(null)} className="btn-secondary py-1.5 px-3 text-xs font-semibold">
                  Cancel
                </button>
                <button
                  onClick={handleArchive}
                  disabled={archiving}
                  className="px-4 py-1.5 rounded-xl bg-error hover:bg-error/90 text-white text-xs font-bold transition-colors"
                >
                  {archiving ? 'Archiving...' : 'Confirm Archive'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
