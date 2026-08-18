'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import {
  Plus,
  Loader2,
  MessageCircleQuestion,
  Send,
  X,
  ArrowLeft,
  ShieldCheck,
  Camera,
} from 'lucide-react';

function MathText({ text }: { text: string }) {
  const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[^$]+?\$)/);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          return <span key={i} dangerouslySetInnerHTML={{ __html: katex.renderToString(part.slice(2, -2), { throwOnError: false, displayMode: true }) }} />;
        }
        if (part.startsWith('$') && part.endsWith('$')) {
          return <span key={i} dangerouslySetInnerHTML={{ __html: katex.renderToString(part.slice(1, -1), { throwOnError: false }) }} />;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

interface Subject {
  id: string;
  display_name: string;
}

interface Doubt {
  id: string;
  title: string;
  question_text: string;
  status: 'open' | 'answered' | 'closed';
  created_at: string;
  subject_id: string | null;
  subjects?: { display_name: string } | null;
  image_url?: string | null;
}

interface DoubtReply {
  id: string;
  doubt_id: string;
  user_id: string;
  reply_text: string;
  is_staff_reply: boolean;
  created_at: string;
}

const STATUS_STYLES: Record<Doubt['status'], string> = {
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

export default function DoubtsPageClient() {
  const [isDark, setIsDark] = useState(false);
  const { user } = useAuth();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', subject_id: '', question_text: '' });
  const [doubtImage, setDoubtImage] = useState<File | null>(null);

  const [selectedDoubt, setSelectedDoubt] = useState<Doubt | null>(null);
  const [replies, setReplies] = useState<DoubtReply[]>([]);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);

  const fetchDoubts = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('doubts')
      .select('id, title, question_text, status, created_at, subject_id, image_url, subjects(display_name)')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false });
    setDoubts((data as unknown as Doubt[]) || []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    const supabase = createClient();
    supabase.from('subjects').select('id, display_name').order('display_name').then(({ data }) => {
      setSubjects(data || []);
    });
  }, []);

  useEffect(() => {
    fetchDoubts();
  }, [fetchDoubts]);

  const openThread = async (doubt: Doubt) => {
    setSelectedDoubt(doubt);
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

  // Live updates while a thread is open
  useEffect(() => {
    if (!selectedDoubt) return;
    const supabase = createClient();
    const channel = supabase
      .channel('doubt-replies-' + selectedDoubt.id)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'doubt_replies', filter: `doubt_id=eq.${selectedDoubt.id}` },
        (payload) => {
          setReplies((prev) => [...prev, payload.new as DoubtReply]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'doubts', filter: `id=eq.${selectedDoubt.id}` },
        (payload) => {
          const updated = payload.new as Doubt;
          setSelectedDoubt((prev) => (prev ? { ...prev, status: updated.status } : prev));
          setDoubts((prev) => prev.map((d) => (d.id === updated.id ? { ...d, status: updated.status } : d)));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedDoubt?.id]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [replies.length]);

  const handleAsk = async () => {
    if (!user) return;
    if (!form.title.trim() || !form.question_text.trim()) {
      toast.error('Please fill in a title and your question');
      return;
    }
    setSaving(true);
    try {
      const supabase = createClient();
      
      let imageUrl = null;
      if (doubtImage) {
        const fileName = `doubts/${user.id}/${Date.now()}-${doubtImage.name}`;
        const { error: uploadError } = await supabase.storage.from('doubt-images').upload(fileName, doubtImage);
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('doubt-images').getPublicUrl(fileName);
          imageUrl = urlData.publicUrl;
        }
      }

      const { error } = await supabase.from('doubts').insert({
        student_id: user.id,
        title: form.title.trim(),
        subject_id: form.subject_id || null,
        question_text: form.question_text.trim(),
        image_url: imageUrl,
      });
      if (error) throw error;
      toast.success('Doubt posted! A teacher will get back to you soon.');
      setForm({ title: '', subject_id: '', question_text: '' });
      setDoubtImage(null);
      setShowForm(false);
      fetchDoubts();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not post your doubt');
    } finally {
      setSaving(false);
    }
  };

  const handleReply = async () => {
    if (!user || !selectedDoubt || !replyText.trim()) return;
    setSendingReply(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('doubt_replies').insert({
        doubt_id: selectedDoubt.id,
        user_id: user.id,
        reply_text: replyText.trim(),
        is_staff_reply: false,
      });
      if (error) throw error;
      setReplyText('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not send reply');
    } finally {
      setSendingReply(false);
    }
  };

  // ─── Thread view ───────────────────────────────────────────────────────────
  if (selectedDoubt) {
    return (
      <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => setSelectedDoubt(null)}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft size={15} /> Back to Doubts
          </button>

          <div className="bg-card border border-border rounded-2xl p-5 mb-4">
            <div className="flex items-start justify-between gap-3">
              <h1 className="font-bold text-foreground text-base leading-snug">{selectedDoubt.title}</h1>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLES[selectedDoubt.status]}`}>
                {selectedDoubt.status}
              </span>
            </div>
            {selectedDoubt.subjects?.display_name && (
              <p className="text-xs text-primary font-medium mt-1">{selectedDoubt.subjects.display_name}</p>
            )}
            <div className="text-sm text-foreground mt-3 leading-relaxed whitespace-pre-wrap"><MathText text={selectedDoubt.question_text} /></div>
            {selectedDoubt.image_url && (
              <img src={selectedDoubt.image_url} alt="Attached" className="mt-3 max-h-60 rounded-xl object-contain cursor-pointer" />
            )}
            <p className="text-xs text-muted-foreground mt-2">Asked {timeAgo(selectedDoubt.created_at)}</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Replies</h2>
            {repliesLoading ? (
              <div className="flex justify-center py-8"><Loader2 size={22} className="animate-spin text-primary" /></div>
            ) : replies.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No replies yet. A teacher will answer soon.</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {replies.map((r) => (
                  <div
                    key={r.id}
                    className={`rounded-xl p-3 text-sm ${
                      r.is_staff_reply ? 'bg-primary/5 border border-primary/20' : 'bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      {r.is_staff_reply && <ShieldCheck size={12} className="text-primary" />}
                      <span className={`text-xs font-semibold ${r.is_staff_reply ? 'text-primary' : 'text-foreground'}`}>
                        {r.is_staff_reply ? 'Teacher' : 'You'}
                      </span>
                      <span className="text-xs text-muted-foreground">· {timeAgo(r.created_at)}</span>
                    </div>
                    <div className="text-foreground whitespace-pre-wrap leading-relaxed"><MathText text={r.reply_text} /></div>
                  </div>
                ))}
                <div ref={threadEndRef} />
              </div>
            )}

            {selectedDoubt.status !== 'closed' && (
              <div className="flex items-end gap-2 mt-4 pt-4 border-t border-border">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a follow-up..."
                  rows={2}
                  className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary resize-none"
                />
                <button
                  onClick={handleReply}
                  disabled={sendingReply || !replyText.trim()}
                  className="btn-primary py-2 px-3 shrink-0 disabled:opacity-50"
                >
                  {sendingReply ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ─── List view ─────────────────────────────────────────────────────────────
  return (
    <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
      <div className="max-w-screen-lg mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Doubts</h1>
            <p className="text-sm text-muted-foreground mt-1">Ask a question and get it answered by a teacher.</p>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary py-2 px-4 text-sm">
            <Plus size={16} /> Ask a Doubt
          </button>
        </div>

        {showForm && (
          <div className="bg-card border border-border rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-foreground text-sm">Ask a New Doubt</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Title *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Why does the electron transport chain need oxygen?"
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Subject (optional)</label>
                <select
                  value={form.subject_id}
                  onChange={(e) => setForm((f) => ({ ...f, subject_id: e.target.value }))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="">Not sure / general</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.display_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Your Question *</label>
                <textarea
                  value={form.question_text}
                  onChange={(e) => setForm((f) => ({ ...f, question_text: e.target.value }))}
                  rows={4}
                  placeholder="Explain what you're stuck on in as much detail as you can..."
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary resize-none"
                />
                <div className="flex items-center gap-2 mt-3">
                  <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-sm text-muted-foreground cursor-pointer hover:bg-muted/30 transition-colors">
                    <Camera size={16} />
                    {doubtImage ? doubtImage.name : 'Attach Photo'}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => setDoubtImage(e.target.files?.[0] || null)} />
                  </label>
                  {doubtImage && (
                    <button type="button" onClick={() => setDoubtImage(null)} className="text-xs text-error hover:underline">Remove</button>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-xl hover:bg-muted transition-colors">
                Cancel
              </button>
              <button onClick={handleAsk} disabled={saving} className="btn-primary py-2 px-4 text-sm disabled:opacity-60">
                {saving ? <Loader2 size={15} className="animate-spin" /> : 'Post Doubt'}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-primary" />
          </div>
        ) : doubts.length === 0 ? (
          <div className="text-center py-20 bg-card border border-border rounded-2xl">
            <MessageCircleQuestion size={32} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground font-semibold">No doubts yet</p>
            <p className="text-sm text-muted-foreground mt-1">Stuck on something? Ask your first doubt above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {doubts.map((doubt) => (
              <button
                key={doubt.id}
                onClick={() => openThread(doubt)}
                className="w-full text-left bg-card border border-border rounded-2xl p-4 hover:border-primary/30 hover:shadow-card-hover transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold text-foreground text-sm">{doubt.title}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLES[doubt.status]}`}>
                    {doubt.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{doubt.question_text}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  {doubt.subjects?.display_name && <span>{doubt.subjects.display_name} · </span>}
                  <span>{timeAgo(doubt.created_at)}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
