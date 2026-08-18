'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeft,
  Loader2,
  MessageCircleQuestion,
  Send,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RotateCcw,
} from 'lucide-react';

type DoubtStatus = 'open' | 'answered' | 'closed';

interface Doubt {
  id: string;
  title: string;
  question_text: string;
  status: DoubtStatus;
  created_at: string;
  student_id: string;
  subjects?: { display_name: string } | null;
  user_profiles?: { full_name: string; email: string } | null;
}

interface DoubtReply {
  id: string;
  doubt_id: string;
  user_id: string;
  reply_text: string;
  is_staff_reply: boolean;
  created_at: string;
}

const STATUS_STYLES: Record<DoubtStatus, string> = {
  open: 'bg-warning-light text-warning',
  answered: 'bg-success-light text-success',
  closed: 'bg-muted text-muted-foreground',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function AdminDoubtsClient() {
  const { user } = useAuth();
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | DoubtStatus>('open');

  const [selected, setSelected] = useState<Doubt | null>(null);
  const [replies, setReplies] = useState<DoubtReply[]>([]);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);

  const fetchDoubts = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('doubts')
      .select('*, subjects(display_name), user_profiles(full_name, email)')
      .order('created_at', { ascending: false });
    if (error) toast.error(error.message);
    setDoubts((data as unknown as Doubt[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDoubts();
  }, [fetchDoubts]);

  // Live updates for new doubts coming in
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('admin-doubts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'doubts' }, () => {
        fetchDoubts();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDoubts]);

  const openThread = async (doubt: Doubt) => {
    setSelected(doubt);
    setRepliesLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('doubt_replies')
      .select('*')
      .eq('doubt_id', doubt.id)
      .order('created_at', { ascending: true });
    setReplies(data || []);
    setRepliesLoading(false);
  };

  useEffect(() => {
    if (!selected) return;
    const supabase = createClient();
    const channel = supabase
      .channel('admin-doubt-thread-' + selected.id)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'doubt_replies', filter: `doubt_id=eq.${selected.id}` },
        (payload) => setReplies((prev) => [...prev, payload.new as DoubtReply])
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [selected?.id]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [replies.length]);

  const handleReply = async () => {
    if (!user || !selected || !replyText.trim()) return;
    setSending(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('doubt_replies').insert({
        doubt_id: selected.id,
        user_id: user.id,
        reply_text: replyText.trim(),
        is_staff_reply: true,
      });
      if (error) throw error;
      setReplyText('');
      if (selected.status === 'open') {
        await updateStatus('answered');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not send reply');
    } finally {
      setSending(false);
    }
  };

  const updateStatus = async (status: DoubtStatus) => {
    if (!selected) return;
    setUpdatingStatus(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('doubts').update({ status }).eq('id', selected.id);
      if (error) throw error;
      setSelected((prev) => (prev ? { ...prev, status } : prev));
      setDoubts((prev) => prev.map((d) => (d.id === selected.id ? { ...d, status } : d)));
      toast.success(`Marked as ${status}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const counts = {
    all: doubts.length,
    open: doubts.filter((d) => d.status === 'open').length,
    answered: doubts.filter((d) => d.status === 'answered').length,
    closed: doubts.filter((d) => d.status === 'closed').length,
  };
  const filtered = filter === 'all' ? doubts : doubts.filter((d) => d.status === filter);

  // ─── Thread view ───────────────────────────────────────────────────────────
  if (selected) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-card border-b border-border px-6 py-4 flex items-center gap-3">
          <button onClick={() => setSelected(null)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-foreground">{selected.title}</h1>
            <p className="text-xs text-muted-foreground">
              {selected.user_profiles?.full_name || 'Student'} · {selected.user_profiles?.email}
            </p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto p-6">
          <div className="bg-card border border-border rounded-2xl p-5 mb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                {selected.subjects?.display_name && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">{selected.subjects.display_name}</span>
                )}
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[selected.status]}`}>{selected.status}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {selected.status !== 'answered' && (
                  <button onClick={() => updateStatus('answered')} disabled={updatingStatus} className="flex items-center gap-1 text-xs font-semibold text-success bg-success-light px-2.5 py-1.5 rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50">
                    <CheckCircle2 size={12} /> Answered
                  </button>
                )}
                {selected.status !== 'closed' && (
                  <button onClick={() => updateStatus('closed')} disabled={updatingStatus} className="flex items-center gap-1 text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1.5 rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50">
                    <XCircle size={12} /> Close
                  </button>
                )}
                {selected.status === 'closed' && (
                  <button onClick={() => updateStatus('open')} disabled={updatingStatus} className="flex items-center gap-1 text-xs font-semibold text-warning bg-warning-light px-2.5 py-1.5 rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50">
                    <RotateCcw size={12} /> Reopen
                  </button>
                )}
              </div>
            </div>
            <p className="text-sm text-foreground mt-3 leading-relaxed whitespace-pre-wrap">{selected.question_text}</p>
            <p className="text-xs text-muted-foreground mt-2">Asked {timeAgo(selected.created_at)}</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Replies</h2>
            {repliesLoading ? (
              <div className="flex justify-center py-8"><Loader2 size={22} className="animate-spin text-primary" /></div>
            ) : replies.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No replies yet — be the first to answer.</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {replies.map((r) => (
                  <div key={r.id} className={`rounded-xl p-3 text-sm ${r.is_staff_reply ? 'bg-primary/5 border border-primary/20' : 'bg-muted/50'}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      {r.is_staff_reply && <ShieldCheck size={12} className="text-primary" />}
                      <span className={`text-xs font-semibold ${r.is_staff_reply ? 'text-primary' : 'text-foreground'}`}>
                        {r.is_staff_reply ? 'Staff' : selected.user_profiles?.full_name || 'Student'}
                      </span>
                      <span className="text-xs text-muted-foreground">· {timeAgo(r.created_at)}</span>
                    </div>
                    <p className="text-foreground whitespace-pre-wrap leading-relaxed">{r.reply_text}</p>
                  </div>
                ))}
                <div ref={threadEndRef} />
              </div>
            )}

            <div className="flex items-end gap-2 mt-4 pt-4 border-t border-border">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write your answer..."
                rows={3}
                className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary resize-none"
              />
              <button onClick={handleReply} disabled={sending || !replyText.trim()} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors shrink-0">
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Reply
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── List view ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border px-6 py-4 flex items-center gap-3">
        <Link href="/admin" className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-foreground">Doubts</h1>
          <p className="text-xs text-muted-foreground">Student questions · {doubts.length} total</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          {(['open', 'answered', 'closed', 'all'] as const).map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full capitalize transition-colors ${
                filter === key ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {key} ({counts[key]})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-2xl">
            <MessageCircleQuestion size={40} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-sm font-semibold text-foreground">No {filter !== 'all' ? filter : ''} doubts</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((doubt) => (
              <button
                key={doubt.id}
                onClick={() => openThread(doubt)}
                className="w-full text-left bg-card border border-border rounded-2xl p-4 hover:border-primary/30 hover:shadow-card-hover transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold text-foreground text-sm">{doubt.title}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLES[doubt.status]}`}>{doubt.status}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{doubt.question_text}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground flex-wrap">
                  <span className="font-medium text-foreground">{doubt.user_profiles?.full_name || 'Student'}</span>
                  {doubt.subjects?.display_name && <span>· {doubt.subjects.display_name}</span>}
                  <span>· {timeAgo(doubt.created_at)}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
