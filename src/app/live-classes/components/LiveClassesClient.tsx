'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { Radio, Clock, MessageSquare, Send, ThumbsUp, PlayCircle, Calendar, Lock, Search, ArrowLeft, ExternalLink, Download, FileText, Loader2, Video } from 'lucide-react';
import { useRealtimeChat } from '@/lib/hooks/useRealtimeChat';
import { useTypingIndicator } from '@/lib/hooks/useTypingIndicator';
import { useLiveAttendance, useLiveReactions } from '@/lib/hooks/useLivePresence';
import { useAuth } from '@/contexts/AuthContext';
import { useTrial } from '@/contexts/TrialContext';
import { createClient } from '@/lib/supabase/client';
import LiveStreamPlayer from '@/components/LiveStreamPlayer';

// ─── Types ────────────────────────────────────────────────────────────────────

interface QAMessage {
  id: string;
  author: string;
  authorInitial: string;
  authorColor: string;
  text: string;
  timestamp: string;
  likes: number;
  liked: boolean;
}

interface LiveClass {
  id: string;
  title: string;
  description: string;
  subjectDisplayName: string | null;
  subjectBg: string;
  subjectText: string;
  subjectIcon: string;
  scheduledAt: string;
  scheduledLabel: string;
  durationMin: number;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  meetingUrl: string | null;
  recordingUrl: string | null;
  resourceUrls: string[];
  isPremium: boolean;
  streamProvider: 'youtube' | 'hls' | 'zoom' | '100ms' | null;
  playbackUrl: string | null;
}

/** Infer the in-app player from a stream URL. Bunny Stream Live and any HLS
 *  source expose a `.m3u8` playlist → play in-app via the HLS player. YouTube
 *  links embed. 100ms links/room IDs mount WebRTC room. Meet/Zoom links stay as external button. */
function deriveStream(url?: string | null): { streamProvider: LiveClass['streamProvider']; playbackUrl: string | null } {
  if (!url) return { streamProvider: null, playbackUrl: null };
  const u = url.trim();
  const lower = u.toLowerCase();
  if (lower.includes('100ms.live') || lower.startsWith('100ms:') || /^[a-f0-9]{24}$/i.test(u)) {
    const roomId = u.includes('/') ? u.split('/').pop()?.split('?')[0] : u.replace('100ms:', '');
    return { streamProvider: '100ms', playbackUrl: roomId || u };
  }
  if (lower.includes('.m3u8') || lower.includes('b-cdn.net') || lower.includes('mediadelivery.net')) {
    return { streamProvider: 'hls', playbackUrl: u };
  }
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
    return { streamProvider: 'youtube', playbackUrl: u };
  }
  return { streamProvider: null, playbackUrl: null };
}

// ─── Style map (matches Subjects / Lecture Videos pages) ──────────────────────

const SUBJECT_STYLES: Record<string, { bgLight: string; textColor: string }> = {
  biology: { bgLight: 'bg-bio-light', textColor: 'text-bio' },
  chemistry: { bgLight: 'bg-chem-light', textColor: 'text-chem' },
  physics: { bgLight: 'bg-physics-light', textColor: 'text-physics' },
  mental_agility: { bgLight: 'bg-ma-light', textColor: 'text-ma' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

function formatScheduledAt(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (sameDay(date, now)) return `Today, ${timeStr}`;
  if (sameDay(date, tomorrow)) return `Tomorrow, ${timeStr}`;
  if (sameDay(date, yesterday)) return `Yesterday, ${timeStr}`;
  return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${timeStr}`;
}

function statusConfig(status: LiveClass['status']) {
  switch (status) {
    case 'live':
      return { label: 'LIVE NOW', className: 'bg-error text-white animate-pulse', dot: 'bg-white' };
    case 'scheduled':
      return { label: 'Upcoming', className: 'bg-secondary text-primary', dot: 'bg-primary' };
    case 'completed':
      return { label: 'Recording', className: 'bg-muted text-muted-foreground', dot: 'bg-muted-foreground' };
    case 'cancelled':
      return { label: 'Cancelled', className: 'bg-error-light text-error', dot: 'bg-error' };
  }
}

// ─── ClassCard ────────────────────────────────────────────────────────────────

interface ClassCardProps {
  cls: LiveClass;
  isLocked: boolean;
  onJoin: (cls: LiveClass) => void;
  onUpgrade: () => void;
}

function ClassCard({ cls, isLocked, onJoin, onUpgrade }: ClassCardProps) {
  const status = statusConfig(cls.status);

  return (
    <div
      className={`card-base group cursor-pointer hover:shadow-card-hover transition-all duration-200 border ${
      cls.status === 'live' ? 'border-error/30 bg-error/5' : 'border-border'}`
      }
      onClick={() => isLocked ? onUpgrade() : onJoin(cls)}>

      {/* Thumbnail */}
      <div className="relative rounded-xl overflow-hidden mb-3 aspect-video bg-muted flex items-center justify-center">
        <div className={`w-full h-full flex items-center justify-center ${cls.subjectBg}`}>
          <Radio size={28} className={`${cls.subjectText} opacity-50`} />
        </div>

        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          {isLocked ?
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Lock size={20} className="text-white" />
            </div> :
          cls.status === 'completed' ?
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <PlayCircle size={28} className="text-white" />
            </div> :
          cls.status === 'live' ?
          <div className="w-12 h-12 rounded-full bg-error/80 backdrop-blur-sm flex items-center justify-center">
              <Radio size={22} className="text-white" />
            </div> :

          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Calendar size={20} className="text-white" />
            </div>
          }
        </div>
        {/* Status badge */}
        <div className="absolute top-2 left-2">
          <span className={`text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 ${status.className}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
        </div>
        {isLocked &&
        <div className="absolute top-2 right-2 bg-black/60 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
            <Lock size={10} />
            Pro
          </div>
        }
      </div>

      {/* Info */}
      <div className="flex items-start gap-2 mb-2">
        <div className={`w-7 h-7 rounded-lg ${cls.subjectBg} flex items-center justify-center shrink-0 mt-0.5`}>
          <span className="text-sm">{cls.subjectIcon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">{cls.title}</p>
          {cls.subjectDisplayName && <p className={`text-xs font-medium mt-0.5 ${cls.subjectText}`}>{cls.subjectDisplayName}</p>}
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{cls.description || 'No description available.'}</p>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock size={11} />
          <span>{cls.scheduledLabel}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock size={11} />
          <span>{formatDuration(cls.durationMin)}</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-border flex items-center justify-end">
        {isLocked ?
        <span className="text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 bg-muted text-muted-foreground">
            <Lock size={11} /> Upgrade to Unlock
          </span> :

        <button
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors ${
          cls.status === 'live' ? 'bg-error text-white hover:bg-error/90' :
          cls.status === 'completed' ? 'bg-secondary text-primary hover:bg-secondary/80' :
          cls.status === 'cancelled' ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-muted text-muted-foreground cursor-not-allowed'}`
          }
          disabled={cls.status === 'scheduled' || cls.status === 'cancelled'}>

            {cls.status === 'live' ?
          <><Radio size={11} /> Join Live</> :
          cls.status === 'completed' ?
          <><PlayCircle size={11} /> Watch Recording</> :
          cls.status === 'cancelled' ?
          <>Cancelled</> :

          <><Calendar size={11} /> Scheduled</>
          }
          </button>
        }
      </div>
    </div>);

}

// ─── LiveClassRoom ────────────────────────────────────────────────────────────

interface LiveClassRoomProps {
  cls: LiveClass;
  onBack: () => void;
}

function LiveClassRoom({ cls, onBack }: LiveClassRoomProps) {
  const [messages, setMessages] = useState<QAMessage[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [activeTab, setActiveTab] = useState<'qa' | 'resources'>('qa');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isRecording = cls.status === 'completed';

  const { user } = useAuth();
  const authorName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'You';

  // Load chat history (now safe: messages RLS is scoped to room members or
  // open live-class rooms, see 20260721030000 migration)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setHistoryLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('messages')
        .select('id,user_id,author,body,created_at')
        .eq('room_id', cls.id)
        .neq('author', '__battle_progress__')
        .order('created_at', { ascending: true })
        .limit(200);
      if (cancelled) return;
      if (error) {
        console.error('Failed to load class chat history:', error.message);
      } else {
        setMessages((data ?? []).map((m: any) => ({
          id: m.id,
          author: m.author,
          authorInitial: (m.author ?? 'U').charAt(0).toUpperCase(),
          authorColor: m.user_id === user?.id ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground',
          text: m.body,
          timestamp: new Date(m.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          likes: 0,
          liked: false,
        })));
      }
      setHistoryLoading(false);
    })();
    return () => { cancelled = true; };
  }, [cls.id, user?.id]);

  // Realtime chat via Broadcast + DB trigger
  const { messages: realtimeMessages, sendMessage: broadcastMessage, isConnected } = useRealtimeChat({
    roomId: cls.id,
    enabled: cls.status === 'live' || cls.status === 'scheduled',
    userId: user?.id,
    authorName,
  });

  // Typing indicator via Presence
  const { typingLabel, onTyping, onStopTyping } = useTypingIndicator({
    roomId: cls.id,
    enabled: cls.status === 'live' || cls.status === 'scheduled',
    userId: user?.id,
    userName: authorName,
  });

  // Real live attendance + emoji reactions (broadcast, throttled)
  const { viewerCount } = useLiveAttendance({ classId: cls.id, enabled: cls.status === 'live', userId: user?.id });
  const { floaters, sendReaction } = useLiveReactions({ classId: cls.id, enabled: cls.status === 'live' });
  const REACTIONS = ['❤️', '🔥', '👏', '🤯', '✋'];

  // Merge realtime messages into local QA list (deduped by id)
  useEffect(() => {
    if (realtimeMessages.length === 0) return;
    setMessages((prev) => {
      const existingIds = new Set(prev.map((m) => m.id));
      const newMsgs = realtimeMessages
        .filter((rm) => !existingIds.has(rm.id))
        .map((rm) => ({
          id: rm.id,
          author: rm.author,
          authorInitial: rm.authorInitial,
          authorColor: rm.user_id === user?.id ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground',
          text: rm.body,
          timestamp: rm.timestamp,
          likes: 0,
          liked: false,
        }));
      return newMsgs.length > 0 ? [...prev, ...newMsgs] : prev;
    });
  }, [realtimeMessages, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || !user?.id) return;
    onStopTyping();
    await broadcastMessage(inputText.trim());
    setInputText('');
  };

  const handleLike = (id: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, liked: !m.liked, likes: m.liked ? m.likes - 1 : m.likes + 1 } : m
      )
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Back bar */}
      <div className="flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-border bg-card shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={16} />
          <span>All Classes</span>
        </button>
        <span className="text-border">·</span>
        <div className={`w-5 h-5 rounded-md ${cls.subjectBg} flex items-center justify-center`}>
          <span className="text-xs">{cls.subjectIcon}</span>
        </div>
        <p className="text-sm font-semibold text-foreground truncate flex-1">{cls.title}</p>
        {cls.status === 'live' && (
          <span className="text-xs font-bold px-2 py-1 rounded-full bg-error text-white animate-pulse flex items-center gap-1 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            LIVE{viewerCount > 0 ? ` · ${viewerCount.toLocaleString()} watching` : ''}
          </span>
        )}
        {cls.status === 'completed' && (
          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-muted text-muted-foreground shrink-0 flex items-center gap-1">
            <PlayCircle size={11} />
            Recording
          </span>
        )}
      </div>

      {/* Main layout */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Video area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="relative bg-black flex-shrink-0" style={{ aspectRatio: '16/9', maxHeight: '65vh' }}>
            {cls.status === 'live' ? (
              // In-app broadcast player (HLS/YouTube) — scales to thousands of
              // students over a CDN. Falls back to an external meeting link,
              // then to a "starting soon" placeholder.
              cls.playbackUrl && (cls.streamProvider === 'hls' || cls.streamProvider === 'youtube') ? (
                <LiveStreamPlayer provider={cls.streamProvider} src={cls.playbackUrl} autoPlay />
              ) : cls.meetingUrl ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 gap-3">
                  <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center animate-pulse">
                    <Radio size={32} className="text-error" />
                  </div>
                  <p className="text-white font-bold text-lg">This class is live</p>
                  <a
                    href={cls.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-error text-white rounded-xl text-sm font-semibold hover:bg-error/90 transition-colors">
                    <ExternalLink size={14} /> Join Meeting
                  </a>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
                  <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mb-4 animate-pulse">
                    <Radio size={32} className="text-error" />
                  </div>
                  <p className="text-white font-bold text-lg">Live Now</p>
                  <p className="text-gray-400 text-sm mt-1">The stream is being set up — check back shortly</p>
                </div>
              )
            ) : cls.status === 'scheduled' ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                  <Calendar size={32} className="text-primary" />
                </div>
                <p className="text-white font-bold text-lg">Class Not Started Yet</p>
                <p className="text-gray-400 text-sm mt-1">Scheduled for {cls.scheduledLabel}</p>
              </div>
            ) : cls.status === 'completed' ? (
              cls.recordingUrl ? (
                <video controls src={cls.recordingUrl} className="w-full h-full" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
                  <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mb-4">
                    <Video size={32} className="text-gray-400" />
                  </div>
                  <p className="text-white font-bold text-lg">Recording Not Uploaded Yet</p>
                  <p className="text-gray-400 text-sm mt-1">Check back soon</p>
                </div>
              )
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
                <p className="text-white font-bold text-lg">This class was cancelled</p>
              </div>
            )}

            {/* Floating emoji reactions */}
            {cls.status === 'live' && floaters.length > 0 && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {floaters.map((f) => (
                  <span
                    key={f.id}
                    className="absolute bottom-2 text-2xl animate-float-up"
                    style={{ left: `${f.x}%` }}
                  >
                    {f.emoji}
                  </span>
                ))}
              </div>
            )}

            {/* Reaction bar */}
            {cls.status === 'live' && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/55 backdrop-blur rounded-full px-2.5 py-1.5">
                {REACTIONS.map((e) => (
                  <button
                    key={e}
                    onClick={() => sendReaction(e)}
                    className="text-lg hover:scale-125 transition-transform leading-none px-0.5"
                    aria-label={`React ${e}`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Class info below video */}
          <div className="px-4 sm:px-5 py-4 border-b border-border bg-card shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-foreground text-base leading-snug">{cls.title}</h2>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  {cls.subjectDisplayName && <span className={`text-xs font-semibold ${cls.subjectText}`}>{cls.subjectDisplayName}</span>}
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock size={11} />
                    {cls.scheduledLabel} · {formatDuration(cls.durationMin)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Q&A / Resources panel */}
        <div className="w-80 xl:w-96 flex flex-col border-l border-border bg-card shrink-0 hidden lg:flex">
          {/* Panel tabs */}
          <div className="flex border-b border-border shrink-0">
            <button
              onClick={() => setActiveTab('qa')}
              className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                activeTab === 'qa' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'
              }`}>
              <MessageSquare size={14} />
              {isRecording ? 'Class Chat' : 'Live Q&A'}
              {(cls.status === 'live' || cls.status === 'scheduled') && isConnected && (
                <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0" title="Realtime connected" />
              )}
              <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold">
                {messages.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('resources')}
              className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                activeTab === 'resources' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'
              }`}>
              <FileText size={14} />
              Resources
            </button>
          </div>

          {/* Q&A messages */}
          {activeTab === 'qa' && (
            <>
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {historyLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={20} className="animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare size={28} className="text-muted-foreground mx-auto mb-2 opacity-40" />
                    <p className="text-sm text-muted-foreground">No messages yet.</p>
                    <p className="text-xs text-muted-foreground mt-1">Be the first to ask a question!</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className="rounded-xl p-3 bg-muted/50">
                      <div className="flex items-start gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${msg.authorColor}`}>
                          {msg.authorInitial}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-xs font-bold text-foreground">{msg.author}</span>
                            <span className="text-xs text-muted-foreground ml-auto">{msg.timestamp}</span>
                          </div>
                          <p className="text-xs text-foreground leading-relaxed">{msg.text}</p>
                          <button
                            onClick={() => handleLike(msg.id)}
                            className={`flex items-center gap-1 mt-1.5 text-xs transition-colors ${
                              msg.liked ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                            }`}>
                            <ThumbsUp size={11} className={msg.liked ? 'fill-primary' : ''} />
                            {msg.likes}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Typing indicator */}
              {typingLabel && (cls.status === 'live' || cls.status === 'scheduled') && (
                <div className="px-3 py-1.5 border-t border-border">
                  <p className="text-xs text-muted-foreground italic flex items-center gap-1.5">
                    <span className="flex gap-0.5">
                      <span className="w-1 h-1 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1 h-1 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1 h-1 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                    {typingLabel}
                  </p>
                </div>
              )}

              {/* Input */}
              {!isRecording && cls.status !== 'cancelled' && user?.id && (
                <div className="p-3 border-t border-border shrink-0">
                  <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => {
                        setInputText(e.target.value);
                        onTyping();
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Ask a question..."
                      className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!inputText.trim()}
                      className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white disabled:opacity-40 hover:bg-primary/90 transition-colors shrink-0">
                      <Send size={13} />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 text-center">
                    Press Enter to send · Be respectful
                  </p>
                </div>
              )}

              {(isRecording || cls.status === 'cancelled') && (
                <div className="p-3 border-t border-border shrink-0 text-center">
                  <p className="text-xs text-muted-foreground">
                    {isRecording ? 'This is a recording — chat is read-only' : 'This class was cancelled'}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Resources tab */}
          {activeTab === 'resources' && (
            <div className="flex-1 overflow-y-auto p-4">
              <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">Class Resources</p>
              {cls.resourceUrls.length === 0 ? (
                <div className="text-center py-8">
                  <FileText size={28} className="text-muted-foreground mx-auto mb-2 opacity-40" />
                  <p className="text-sm text-muted-foreground">No resources uploaded yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cls.resourceUrls.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                      <Download size={16} className="text-primary shrink-0" />
                      <span className="text-sm text-foreground truncate flex-1">
                        {decodeURIComponent(url.split('/').pop() ?? 'resource')}
                      </span>
                    </a>
                  ))}
                </div>
              )}

              <div className="mt-4 p-3 rounded-xl bg-muted/50">
                <p className="text-xs font-semibold text-foreground mb-1">About this class</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{cls.description || 'No description available.'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LiveClassesClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [activeClass, setActiveClass] = useState<LiveClass | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'live' | 'upcoming' | 'ended'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const deepLinkAppliedRef = useRef(false);

  const { isTrialActive } = useTrial();

  // Real premium status via the service-role route (AuthContext.profile is null
  // under the user_profiles RLS recursion, which used to lock out real Pro users
  // and let free users in during the trial). Pro/prebook/admin = premium.
  const [isPremiumUser, setIsPremiumUser] = useState<boolean | null>(null);
  useEffect(() => {
    let active = true;
    fetch('/api/profile/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((me) => {
        if (!active || !me) { if (active) setIsPremiumUser(false); return; }
        const exp = me.subscription_expires_at;
        const planActive = !exp || new Date(exp) > new Date();
        const paid = ['student', 'pro', 'institution'].includes(me.subscription_plan);
        setIsPremiumUser(!!me.is_admin || (paid && planActive));
      })
      .catch(() => { if (active) setIsPremiumUser(false); });
    return () => { active = false; };
  }, []);

  // Locked only once we KNOW they're not premium (avoid a lock flash while loading).
  const isFree = isPremiumUser === false && !isTrialActive;

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    setIsDark(stored === 'dark');
  }, []);

  const handleToggleDark = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', next);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadState('loading');
      const supabase = createClient();
      const [subjectsRes, classesRes] = await Promise.all([
        supabase.from('subjects').select('id,name,display_name,color,icon').eq('is_active', true),
        supabase.from('live_classes').select('id,subject_id,title,description,scheduled_at,duration_min,meeting_url,recording_url,resources_urls,status,is_premium').order('scheduled_at', { ascending: false }),
      ]);

      if (cancelled) return;

      if (subjectsRes.error || classesRes.error) {
        console.error('Failed to load live classes:', subjectsRes.error || classesRes.error);
        setLoadState('error');
        return;
      }

      const subjectsMap = new Map((subjectsRes.data ?? []).map((s: any) => [s.id, s]));

      const built: LiveClass[] = (classesRes.data ?? []).map((c: any) => {
        const subj = c.subject_id ? subjectsMap.get(c.subject_id) : null;
        const style = subj ? SUBJECT_STYLES[subj.name] ?? SUBJECT_STYLES.biology : { bgLight: 'bg-muted', textColor: 'text-muted-foreground' };
        return {
          id: c.id,
          title: c.title,
          description: c.description ?? '',
          subjectDisplayName: subj?.display_name ?? null,
          subjectBg: style.bgLight,
          subjectText: style.textColor,
          subjectIcon: subj?.icon ?? '📚',
          scheduledAt: c.scheduled_at,
          scheduledLabel: formatScheduledAt(c.scheduled_at),
          durationMin: c.duration_min ?? 60,
          status: c.status,
          meetingUrl: c.meeting_url,
          recordingUrl: c.recording_url,
          resourceUrls: c.resources_urls ?? [],
          isPremium: c.is_premium,
          // Derive the player from the stream URL (no dedicated columns on this
          // DB): a Bunny/HLS .m3u8 → hls player; a YouTube link → youtube embed;
          // anything else (Meet/Zoom) → external "Join" link.
          ...deriveStream(c.meeting_url ?? c.recording_url),
        };
      });

      if (built.length === 0) {
        // Fallback default classes so live streaming features are immediately playable
        const DEFAULT_FALLBACK_CLASSES: LiveClass[] = [
          {
            id: 'live-demo-1',
            title: 'Cell Division & Mitosis — High-Yield CEE Discussion',
            description: 'Interactive live session covering chromosome behavior, spindle formation, and past CEE MCQs with 1-on-1 Q&A.',
            subjectDisplayName: 'Biology',
            subjectBg: 'bg-bio-light',
            subjectText: 'text-bio',
            subjectIcon: '🧬',
            scheduledAt: new Date().toISOString(),
            scheduledLabel: 'Today, Live Now',
            durationMin: 60,
            status: 'live',
            meetingUrl: null,
            recordingUrl: null,
            resourceUrls: ['https://example.com/cell-division-notes.pdf'],
            isPremium: false,
            streamProvider: 'youtube',
            playbackUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          },
          {
            id: 'live-demo-2',
            title: 'Organic Chemistry Reaction Mechanisms & Tricks',
            description: 'Master electrophilic substitution, nucleophilic addition, and reaction pathways for CEE 2026.',
            subjectDisplayName: 'Chemistry',
            subjectBg: 'bg-chem-light',
            subjectText: 'text-chem',
            subjectIcon: '🧪',
            scheduledAt: new Date(Date.now() + 7200000).toISOString(),
            scheduledLabel: 'Today, 6:00 PM',
            durationMin: 90,
            status: 'scheduled',
            meetingUrl: null,
            recordingUrl: null,
            resourceUrls: [],
            isPremium: true,
            streamProvider: 'youtube',
            playbackUrl: null,
          },
          {
            id: 'live-demo-3',
            title: "Newton's Laws & Rotational Dynamics Masterclass",
            description: 'Solving complex mechanics numericals with shortcuts and formula cheat-sheets.',
            subjectDisplayName: 'Physics',
            subjectBg: 'bg-physics-light',
            subjectText: 'text-physics',
            subjectIcon: '⚡',
            scheduledAt: new Date(Date.now() + 86400000).toISOString(),
            scheduledLabel: 'Tomorrow, 5:00 PM',
            durationMin: 75,
            status: 'scheduled',
            meetingUrl: null,
            recordingUrl: null,
            resourceUrls: [],
            isPremium: false,
            streamProvider: 'youtube',
            playbackUrl: null,
          },
          {
            id: 'live-demo-4',
            title: 'Human Circulation & Blood Physiology Recording',
            description: 'Full lecture recording covering ECG analysis, blood pressure regulation, and cardiac cycle.',
            subjectDisplayName: 'Biology',
            subjectBg: 'bg-bio-light',
            subjectText: 'text-bio',
            subjectIcon: '🫀',
            scheduledAt: new Date(Date.now() - 86400000).toISOString(),
            scheduledLabel: 'Yesterday',
            durationMin: 80,
            status: 'completed',
            meetingUrl: null,
            recordingUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            resourceUrls: [],
            isPremium: false,
            streamProvider: null,
            playbackUrl: null,
          },
        ];
        setClasses(DEFAULT_FALLBACK_CLASSES);
      } else {
        setClasses(built);
      }
      setLoadState('ready');
    })();
    return () => { cancelled = true; };
  }, []);

  // Deep link: ?class=<id> auto-opens a class room
  useEffect(() => {
    if (loadState !== 'ready' || deepLinkAppliedRef.current || classes.length === 0) return;
    deepLinkAppliedRef.current = true;
    const qClass = searchParams.get('class');
    if (qClass) {
      const found = classes.find((c) => c.id === qClass);
      if (found && !(found.isPremium && isFree)) {
        setActiveClass(found);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadState, classes]);

  const filtered = classes.filter((cls) => {
    const matchesStatus =
      filterStatus === 'all' ||
      filterStatus === 'live' && cls.status === 'live' ||
      filterStatus === 'upcoming' && cls.status === 'scheduled' ||
      filterStatus === 'ended' && cls.status === 'completed';
    const matchesSearch =
      !searchQuery ||
      cls.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cls.subjectDisplayName ?? '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const liveCount = classes.filter((c) => c.status === 'live').length;
  const upcomingCount = classes.filter((c) => c.status === 'scheduled').length;
  const endedCount = classes.filter((c) => c.status === 'completed').length;

  if (loadState === 'loading') {
    return (
      <DashboardLayout isDark={isDark} onToggleDark={handleToggleDark}>
        <div className="flex items-center justify-center py-24">
          <Loader2 size={28} className="animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (loadState === 'error') {
    return (
      <DashboardLayout isDark={isDark} onToggleDark={handleToggleDark}>
        <div className="text-center py-24">
          <Radio size={36} className="text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium text-foreground">Couldn't load live classes</p>
          <p className="text-xs text-muted-foreground mt-1">Please refresh the page to try again.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout isDark={isDark} onToggleDark={handleToggleDark}>
      {activeClass ?
      <LiveClassRoom cls={activeClass} onBack={() => setActiveClass(null)} /> :

      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Radio size={20} className="text-error" />
              <h1 className="text-xl font-bold text-foreground">Live Classes</h1>
              {liveCount > 0 &&
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-error text-white animate-pulse">
                  {liveCount} LIVE
                </span>
            }
            </div>
            <p className="text-sm text-muted-foreground">Join live sessions, ask questions, and watch recordings</p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="card-base text-center py-3">
              <p className="text-2xl font-extrabold text-error">{liveCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Live Now</p>
            </div>
            <div className="card-base text-center py-3">
              <p className="text-2xl font-extrabold text-primary">{upcomingCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Upcoming</p>
            </div>
            <div className="card-base text-center py-3">
              <p className="text-2xl font-extrabold text-foreground">{endedCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Recordings</p>
            </div>
          </div>

          {/* Search + Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex-1 relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search classes or subjects..."
              className="w-full pl-9 pr-4 py-2.5 bg-muted rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {(['all', 'live', 'upcoming', 'ended'] as const).map((s) =>
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors capitalize ${
              filterStatus === s ?
              s === 'live' ? 'bg-error text-white' : 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground'}`
              }>
                  {s === 'all' ? 'All' : s === 'ended' ? 'Recordings' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
            )}
            </div>
          </div>

          {/* Classes grid */}
          {filtered.length === 0 ?
        <div className="text-center py-16">
              <Radio size={40} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-foreground font-semibold">{classes.length === 0 ? 'No classes scheduled yet' : 'No classes found'}</p>
              <p className="text-sm text-muted-foreground mt-1">{classes.length === 0 ? 'Check back soon for new sessions' : 'Try adjusting your search or filter'}</p>
            </div> :

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((cls) =>
          <ClassCard
            key={cls.id}
            cls={cls}
            isLocked={cls.isPremium && isFree}
            onJoin={setActiveClass}
            onUpgrade={() => router.push('/checkout?plan=pro-monthly')} />

          )}
            </div>
        }
        </div>
      }
    </DashboardLayout>);

}
