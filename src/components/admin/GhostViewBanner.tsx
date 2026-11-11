'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Eye, LogOut, ShieldAlert, Loader2, Clock, AlertTriangle, FileText } from 'lucide-react';

interface GhostSession {
  active: boolean;
  impersonationId?: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  adminId?: string;
  adminEmail?: string;
  reason?: string;
  ticketId?: string;
  startedAt?: number;
  expiresAt?: number;
  maxDurationMinutes?: number;
  readOnly?: boolean;
}

export default function GhostViewBanner() {
  const [session, setSession] = useState<GhostSession | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [exiting, setExiting] = useState(false);

  const handleExit = useCallback(async () => {
    if (exiting) return;
    setExiting(true);
    try {
      await fetch('/api/admin/impersonate/exit', { method: 'POST' });
      document.cookie = 'samyak_ghost_session=; Path=/; Max-Age=0;';
      window.location.href = '/admin/users';
    } catch {
      window.location.href = '/admin/users';
    }
  }, [exiting]);

  // Read session cookie
  useEffect(() => {
    function readCookie() {
      try {
        const cookies = document.cookie.split(';');
        for (const c of cookies) {
          const [key, val] = c.trim().split('=');
          if (key === 'samyak_ghost_session' && val) {
            const raw = val.startsWith('%7B') ? decodeURIComponent(val) : val;
            const parsed = JSON.parse(raw);
            if (parsed && parsed.active) {
              setSession(parsed);
              if (parsed.expiresAt) {
                const diff = Math.max(0, Math.floor((parsed.expiresAt - Date.now()) / 1000));
                setRemainingSeconds(diff);
              }
              return;
            }
          }
        }
      } catch {}
      setSession(null);
      setRemainingSeconds(null);
    }

    readCookie();
    const interval = setInterval(readCookie, 10000);
    return () => clearInterval(interval);
  }, []);

  // Live countdown timer ticking every second
  useEffect(() => {
    if (!session || remainingSeconds === null) return;

    if (remainingSeconds <= 0) {
      handleExit();
      return;
    }

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          handleExit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [session, remainingSeconds, handleExit]);

  if (!session) return null;

  const minutes = remainingSeconds !== null ? Math.floor(remainingSeconds / 60) : 0;
  const seconds = remainingSeconds !== null ? remainingSeconds % 60 : 0;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isExpiringSoon = remainingSeconds !== null && remainingSeconds < 120; // under 2 mins

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-amber-700 via-orange-600 to-amber-700 text-white shadow-2xl px-4 py-2 text-xs font-semibold flex flex-wrap items-center justify-between gap-2 border-b-2 border-amber-300 animate-in slide-in-from-top-4 duration-200"
    >
      <div className="flex items-center gap-3 truncate max-w-[75%]">
        <span className="relative flex h-3 w-3 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
        </span>

        <div className="flex items-center gap-1.5 shrink-0">
          <Eye size={16} className="text-amber-200 shrink-0 animate-pulse" />
          <span className="font-black uppercase tracking-wider text-amber-200">
            Ghost Diagnostic View
          </span>
        </div>

        <div className="hidden sm:inline-block h-3.5 w-px bg-white/30" />

        <div className="truncate flex items-center gap-1.5">
          <span>Student:</span>
          <strong className="text-white font-black underline underline-offset-2">
            {session.studentName}
          </strong>
          <span className="text-amber-100/90 text-[11px] hidden md:inline">
            ({session.studentEmail || session.studentId})
          </span>
        </div>

        {session.reason && (
          <div className="hidden lg:flex items-center gap-1 text-[11px] text-amber-100/90 bg-black/20 px-2 py-0.5 rounded border border-white/10 max-w-xs truncate">
            <FileText size={12} className="shrink-0 text-amber-300" />
            <span className="truncate" title={session.reason}>
              {session.ticketId ? `[#${session.ticketId}] ` : ''}{session.reason}
            </span>
          </div>
        )}

        <span className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/30 text-[10px] font-mono text-amber-200 border border-amber-400/40">
          <ShieldAlert size={11} /> Read-Only Enforcement Active
        </span>
      </div>

      <div className="flex items-center gap-2.5 shrink-0 ml-auto">
        {remainingSeconds !== null && (
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold border transition-colors ${
              isExpiringSoon
                ? 'bg-rose-950/80 text-rose-200 border-rose-400 animate-pulse'
                : 'bg-black/30 text-amber-100 border-amber-300/40'
            }`}
            title="Time remaining until automatic session expiration"
          >
            {isExpiringSoon ? <AlertTriangle size={13} className="text-rose-400" /> : <Clock size={13} className="text-amber-300" />}
            <span>{timeFormatted}</span>
          </div>
        )}

        <button
          onClick={handleExit}
          disabled={exiting}
          className="px-3 py-1 rounded-lg bg-black/50 hover:bg-black/75 text-white font-bold transition-all flex items-center gap-1.5 shrink-0 border border-white/40 cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
        >
          {exiting ? <Loader2 size={13} className="animate-spin" /> : <LogOut size={13} />}
          <span>Exit Ghost View</span>
        </button>
      </div>
    </div>
  );
}
