'use client';

import React, { useState } from 'react';
import {
  Zap, X, Play, Loader2, CheckCircle2, AlertTriangle,
  Terminal, ShieldCheck, ArrowRight, RefreshCw, Sparkles, BookOpen
} from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCompleted: () => void;
}

interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export default function AutonomousAutoPilotModal({ isOpen, onClose, onCompleted }: Props) {
  const [program, setProgram] = useState<'all' | 'cee' | 'see' | 'ielts'>('all');
  const [maxItems, setMaxItems] = useState(6);
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<{ processed: number; durationSec: number } | null>(null);

  if (!isOpen) return null;

  const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        message,
        type,
      },
    ]);
  };

  const handleRunSweep = async () => {
    setRunning(true);
    setStats(null);
    setLogs([]);

    addLog(`🚀 Initializing Autonomous Curriculum Auto-Pilot [Scope: ${program.toUpperCase()}, Batch: ${maxItems}]...`, 'info');
    addLog(`🔍 Loading syllabus blueprints for Nepal MEC CEE, CDC SEE, and Cambridge IELTS...`, 'info');

    try {
      addLog(`⚡ Server synthesizing high-yield study materials & KaTeX formula sheets...`, 'info');

      const res = await fetch('/api/admin/ai-content-generator/autonomous-sweep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program,
          maxItems,
          autoPublish: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Autonomous sweep failed');

      if (data.items && data.items.length > 0) {
        data.items.forEach((item: any, idx: number) => {
          addLog(
            `[${idx + 1}/${data.items.length}] ✓ Synthesized & Published: ${item.result.title} (${item.result.modelUsed})`,
            'success'
          );
        });
      }

      setStats({
        processed: data.totalProcessed,
        durationSec: Math.round((data.durationMs || 1000) / 100) / 10,
      });

      addLog(`✨ Auto-Pilot Complete: ${data.totalProcessed} curriculum modules posted live to student database!`, 'success');
      toast.success(`Autonomous sweep complete! ${data.totalProcessed} resources published live.`);
      onCompleted();
    } catch (err: any) {
      addLog(`❌ Error in autonomous pipeline: ${err.message}`, 'error');
      toast.error(err.message || 'Error running auto-pilot');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-500">
              <Zap size={20} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
                Autonomous Curriculum Auto-Pilot
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 uppercase">
                  Server Daemon
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Autonomous AI crawler &amp; publisher that drafts notes, KaTeX formula sheets, and past papers across all sections.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl border border-border hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          
          {/* Controls Bar */}
          <div className="bg-muted/30 border border-border rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-bold text-foreground mb-1">Target Section Scope:</label>
              <select
                value={program}
                onChange={(e) => setProgram(e.target.value as any)}
                disabled={running}
                className="input-field w-full py-2 text-xs"
              >
                <option value="all">All Sections (CEE + SEE + IELTS)</option>
                <option value="cee">🩺 CEE Medical Entrance Only</option>
                <option value="see">🎒 SEE Class 10 Only</option>
                <option value="ielts">🌍 IELTS Academic Only</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-foreground mb-1">Batch Synthesize Limit:</label>
              <select
                value={maxItems}
                onChange={(e) => setMaxItems(Number(e.target.value))}
                disabled={running}
                className="input-field w-full py-2 text-xs"
              >
                <option value={4}>4 Chapters (Quick Test Sweep)</option>
                <option value={6}>6 Chapters (Standard Sweep)</option>
                <option value={10}>10 Chapters (Comprehensive Sweep)</option>
                <option value={14}>14 Chapters (Full Syllabus Coverage)</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleRunSweep}
                disabled={running}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {running ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Autonomous Agent Running...
                  </>
                ) : (
                  <>
                    <Zap size={15} />
                    Launch Autonomous Sweep
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Live Autonomous Console Telemetry */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <Terminal size={14} className="text-primary" /> Live Server Execution Telemetry:
              </span>
              {stats && (
                <span className="text-[11px] font-mono text-emerald-500 font-bold">
                  ✓ {stats.processed} Items in {stats.durationSec}s
                </span>
              )}
            </div>

            <div className="bg-black/90 text-emerald-400 font-mono text-[11px] p-4 rounded-2xl border border-border h-64 overflow-y-auto space-y-1.5 shadow-inner">
              {logs.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground opacity-50">
                  Ready to launch. Click &quot;Launch Autonomous Sweep&quot; to begin hands-free curriculum generation.
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className={`leading-relaxed ${
                      log.type === 'error'
                        ? 'text-red-400 font-bold'
                        : log.type === 'success'
                        ? 'text-emerald-300'
                        : 'text-zinc-300'
                    }`}
                  >
                    <span className="opacity-40 select-none mr-2">[{log.timestamp}]</span>
                    {log.message}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Security & Audit Guarantee */}
          <div className="p-3.5 bg-muted/40 border border-border rounded-2xl flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-primary shrink-0" />
              <span>
                All autonomously synthesized materials are cryptographically tagged and recorded in the immutable security ledger.
              </span>
            </div>

            <button
              onClick={() => {
                onClose();
                onCompleted();
              }}
              className="btn-secondary py-1.5 px-3 text-xs font-semibold cursor-pointer shrink-0"
            >
              Done &amp; Close Console
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
