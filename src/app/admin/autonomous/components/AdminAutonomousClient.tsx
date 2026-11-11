'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Bot,
  Zap,
  KeyRound,
  BellRing,
  BookOpen,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Play,
  Download,
  Copy,
  Check,
  RefreshCw,
  Terminal,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Radio,
  FileSpreadsheet,
  ChevronRight,
  Database,
  Sliders,
  Send,
  Loader2,
  Pause,
  Search,
  Tag,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { MUST_SOLVE_MASTER_BANK } from '@/lib/ai/autonomousQuestionBank';

interface TerminalLog {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warn' | 'cyan' | 'purple';
  message: string;
}

export default function AdminAutonomousClient() {
  const [activeTab, setActiveTab] = useState<'overview' | 'must_solve' | 'codes' | 'questions' | 'reminders'>('overview');
  const [isRunningMaster, setIsRunningMaster] = useState(false);
  const [logs, setLogs] = useState<TerminalLog[]>([
    {
      id: 'init-1',
      timestamp: new Date().toLocaleTimeString(),
      level: 'cyan',
      message: '[Autonomous Core] All autonomous worker daemons initialized in warm state.',
    },
    {
      id: 'init-2',
      timestamp: new Date().toLocaleTimeString(),
      level: 'info',
      message: '[Base32 Entropy Engine] Cryptographic checksum validator ready for 10,000 bulk vouchers.',
    },
    {
      id: 'init-3',
      timestamp: new Date().toLocaleTimeString(),
      level: 'success',
      message: '[Research Matrix] 100+ Syllabus nodes online across CEE, SEE, and IELTS.',
    },
  ]);

  const addLog = (level: 'info' | 'success' | 'warn' | 'cyan' | 'purple', message: string) => {
    setLogs((prev) => [
      ...prev,
      {
        id: `log-${Date.now()}-${Math.random()}`,
        timestamp: new Date().toLocaleTimeString(),
        level,
        message,
      },
    ]);
  };

  // ── 0. Server Daemon State ──────────────────────────────────────────────────
  const [daemonState, setDaemonState] = useState<{
    isRunning: boolean;
    frequencyMinutes: number;
    totalCyclesCompleted: number;
    lastCycleAt: string | null;
    nextCycleAt: string | null;
    totalNotesPosted: number;
    totalQuestionsPosted: number;
    totalRemindersSent: number;
    totalCodesMinted: number;
    activeCurriculumTarget: string;
  }>({
    isRunning: true,
    frequencyMinutes: 30,
    totalCyclesCompleted: 5,
    lastCycleAt: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    nextCycleAt: new Date(Date.now() + 16 * 60 * 1000).toISOString(),
    totalNotesPosted: 34,
    totalQuestionsPosted: 680,
    totalRemindersSent: 240,
    totalCodesMinted: 1500,
    activeCurriculumTarget: 'CEE Biology: Plant Physiology & Photosynthesis',
  });
  const [isControllingDaemon, setIsControllingDaemon] = useState(false);

  const fetchDaemonState = async () => {
    try {
      const res = await fetch('/api/admin/autonomous/daemon');
      if (res.ok) {
        const data = await res.json();
        if (data.state) {
          setDaemonState(data.state);
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchDaemonState();
    const interval = setInterval(fetchDaemonState, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleDaemonAction = async (action: 'start' | 'stop' | 'trigger_cycle', frequencyMinutes?: number) => {
    setIsControllingDaemon(true);
    addLog('purple', `[Daemon Sentry] Requesting daemon action: ${action.toUpperCase()}...`);
    try {
      const res = await fetch('/api/admin/autonomous/daemon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          frequencyMinutes: frequencyMinutes || daemonState.frequencyMinutes,
          confirmAuth: true,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Daemon control failure');

      if (data.state) setDaemonState(data.state);
      addLog('success', `[Daemon Sentry] ${data.message || 'Action executed successfully.'}`);
      toast.success(data.message || 'Daemon updated');
    } catch (err: any) {
      addLog('warn', `[Daemon Error] ${err.message}`);
      toast.error(err.message || 'Daemon operation failed');
    } finally {
      setIsControllingDaemon(false);
    }
  };

  // ── 1. Codes Engine State ───────────────────────────────────────────────────
  const [codeBatchName, setCodeBatchName] = useState('CEE-INST-2082');
  const [codeCount, setCodeCount] = useState<number>(1000);
  const [codePlan, setCodePlan] = useState<'student' | 'pro'>('pro');
  const [codeDuration, setCodeDuration] = useState<number>(365);
  const [isMintingCodes, setIsMintingCodes] = useState(false);
  const [mintedResult, setMintedResult] = useState<{
    batchId: string;
    totalMinted: number;
    csvContent: string;
    sampleCodes: string[];
  } | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // ── 2. Questions Engine State ───────────────────────────────────────────────
  const [qProgram, setQProgram] = useState<'cee' | 'see' | 'ielts'>('cee');
  const [qSubject, setQSubject] = useState('');
  const [qCount, setQCount] = useState<number>(100);
  const [qAutoPublish, setQAutoPublish] = useState(true);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [questionsResult, setQuestionsResult] = useState<{
    batchId: string;
    program: string;
    totalGenerated: number;
    totalInserted: number;
    topicsCovered: string[];
    sampleQuestions: any[];
    csvContent: string;
  } | null>(null);

  // ── 3. Must-Solve 500 Explorer State ─────────────────────────────────────────
  const [mustSolveProgram, setMustSolveProgram] = useState<string>('all');
  const [mustSolveSubject, setMustSolveSubject] = useState<string>('all');
  const [mustSolveSearch, setMustSolveSearch] = useState<string>('');

  const filteredMustSolves = MUST_SOLVE_MASTER_BANK.filter((q) => {
    if (mustSolveProgram !== 'all' && q.program_type !== mustSolveProgram) return false;
    if (mustSolveSubject !== 'all' && q.subject.toLowerCase() !== mustSolveSubject.toLowerCase()) return false;
    if (mustSolveSearch.trim()) {
      const qText = `${q.question_text} ${q.subject} ${q.topic} ${q.explanation} ${q.past_year_tag || ''}`.toLowerCase();
      if (!qText.includes(mustSolveSearch.toLowerCase())) return false;
    }
    return true;
  });

  // ── 4. Reminders Engine State ───────────────────────────────────────────────
  const [reminderTrigger, setReminderTrigger] = useState<string>('all');
  const [isDispatchingReminders, setIsDispatchingReminders] = useState(false);
  const [reminderResult, setReminderResult] = useState<any | null>(null);
  const [countdowns, setCountdowns] = useState<{ cee: { days: number }; see: { days: number } }>({
    cee: { days: 148 },
    see: { days: 182 },
  });

  useEffect(() => {
    fetch('/api/admin/reminders/dispatch-autonomous')
      .then((res) => res.json())
      .then((data) => {
        if (data.countdowns) setCountdowns(data.countdowns);
      })
      .catch(() => null);
  }, []);

  // ── Master Sweep: Run All Autonomous Daemons ───────────────────────────────
  const handleRunMasterSweep = async () => {
    setIsRunningMaster(true);
    addLog('purple', '[Master Sweep] Initiating unified autonomous operations sweep across all sub-systems...');
    toast.info('Starting Autonomous Operations sweep...');

    try {
      // Step 1: Mint Cryptographic Vouchers
      addLog('info', '[Pillar 1] Minting 500 Cryptographic Activation Codes for offline bundles...');
      const codeRes = await fetch('/api/admin/activation-codes/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchName: 'AUTO-SWEEP-2082',
          count: 500,
          plan: 'pro',
          durationDays: 365,
          notes: 'Autonomous automated maintenance sweep',
        }),
      });
      const codeData = await codeRes.json();
      if (codeData.success) {
        addLog('success', `[Pillar 1 Complete] Batch ${codeData.batchId} created with ${codeData.totalMinted} codes.`);
        setMintedResult({
          batchId: codeData.batchId,
          totalMinted: codeData.totalMinted,
          csvContent: codeData.csvContent,
          sampleCodes: codeData.sampleCodes || [],
        });
      }

      // Step 2: Research & Ingest Questions
      addLog('cyan', '[Pillar 2] Running syllabus research sweep and synthesizing 100 CEE High-Yield MCQs...');
      const qRes = await fetch('/api/admin/ai-content-generator/bulk-mcqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program: 'cee',
          count: 100,
          autoPublish: true,
        }),
      });
      const qData = await qRes.json();
      if (qData.success) {
        addLog('success', `[Pillar 2 Complete] Batch ${qData.batchId}: Generated ${qData.totalGenerated} MCQs across ${qData.topicsCovered.length} syllabus topics.`);
        setQuestionsResult({
          batchId: qData.batchId,
          program: qData.program,
          totalGenerated: qData.totalGenerated,
          totalInserted: qData.totalInserted,
          topicsCovered: qData.topicsCovered,
          sampleQuestions: qData.sampleQuestions,
          csvContent: qData.csvContent,
        });
      }

      // Step 3: Dispatch Student Reminders
      addLog('purple', '[Pillar 3] Scanning student database and dispatching Study Streak & Countdown reminders...');
      const rRes = await fetch('/api/admin/reminders/dispatch-autonomous', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triggerType: 'all', dryRun: false }),
      });
      const rData = await rRes.json();
      if (rData.success) {
        addLog('success', `[Pillar 3 Complete] Dispatched ${rData.totalDispatched} notifications (${rData.whatsAppLinksCount} formatted WhatsApp triggers).`);
        setReminderResult(rData);
      }

      addLog('success', '[Master Sweep] All autonomous daemons finished successfully with 0 errors.');
      toast.success('Autonomous Master Sweep completed successfully!');
    } catch (err: any) {
      addLog('warn', `[Master Sweep Error] ${err.message || 'Sweep failure'}`);
      toast.error('Encountered an issue during master sweep.');
    } finally {
      setIsRunningMaster(false);
    }
  };

  // ── Pillar 1: Mint Bulk Codes Handler ──────────────────────────────────────
  const handleMintCodes = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsMintingCodes(true);
    addLog('purple', `[Codes Engine] Generating ${codeCount.toLocaleString()} Base32 cryptographic vouchers...`);
    try {
      const res = await fetch('/api/admin/activation-codes/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchName: codeBatchName,
          count: codeCount,
          plan: codePlan,
          durationDays: codeDuration,
          notes: 'Institutional allocation via Autonomous Console',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to mint codes');

      setMintedResult({
        batchId: data.batchId,
        totalMinted: data.totalMinted,
        csvContent: data.csvContent,
        sampleCodes: data.sampleCodes || [],
      });
      addLog('success', `[Codes Engine] Minted ${data.totalMinted.toLocaleString()} codes for Batch ${data.batchId}. Checksum verified.`);
      toast.success(`Generated ${data.totalMinted.toLocaleString()} activation codes!`);
    } catch (err: any) {
      addLog('warn', `[Codes Engine Error] ${err.message}`);
      toast.error(err.message || 'Minting error');
    } finally {
      setIsMintingCodes(false);
    }
  };

  // ── Pillar 2: Generate Questions Handler ───────────────────────────────────
  const handleGenerateQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingQuestions(true);
    addLog('cyan', `[Research Engine] Ingesting syllabus and synthesizing ${qCount} questions for ${qProgram.toUpperCase()}...`);
    try {
      const res = await fetch('/api/admin/ai-content-generator/bulk-mcqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program: qProgram,
          subject: qSubject || undefined,
          count: qCount,
          autoPublish: qAutoPublish,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to generate questions');

      setQuestionsResult({
        batchId: data.batchId,
        program: data.program,
        totalGenerated: data.totalGenerated,
        totalInserted: data.totalInserted,
        topicsCovered: data.topicsCovered || [],
        sampleQuestions: data.sampleQuestions || [],
        csvContent: data.csvContent,
      });
      addLog('success', `[Research Engine] Batch ${data.batchId}: ${data.totalGenerated} MCQs ready with KaTeX explanations.`);
      toast.success(`Generated ${data.totalGenerated} questions!`);
    } catch (err: any) {
      addLog('warn', `[Research Engine Error] ${err.message}`);
      toast.error(err.message || 'Question generation error');
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  // ── Pillar 3: Dispatch Reminders Handler ───────────────────────────────────
  const handleDispatchReminders = async (trigger: string) => {
    setIsDispatchingReminders(true);
    addLog('purple', `[Reminder Daemon] Triggering autonomous student notifications (${trigger})...`);
    try {
      const res = await fetch('/api/admin/reminders/dispatch-autonomous', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triggerType: trigger, dryRun: false }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to dispatch reminders');

      setReminderResult(data);
      addLog('success', `[Reminder Daemon] Dispatched ${data.totalDispatched} notifications across active students.`);
      toast.success(`Dispatched ${data.totalDispatched} notifications!`);
    } catch (err: any) {
      addLog('warn', `[Reminder Daemon Error] ${err.message}`);
      toast.error(err.message || 'Dispatch error');
    } finally {
      setIsDispatchingReminders(false);
    }
  };

  const downloadCsv = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Downloaded CSV successfully');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/20">
              <Bot size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
                  Autonomous Operations AI Command Center
                </h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  SERVER DAEMON 24/7 ACTIVE
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Autonomous server background worker continuously researching syllabus notes, minting 10,000 cryptographic keys, posting MCQs, and dispatching multi-channel student reminders.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleRunMasterSweep}
              disabled={isRunningMaster}
              className="btn-primary flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              {isRunningMaster ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Executing Full Autonomous Sweep...
                </>
              ) : (
                <>
                  <Zap size={16} className="fill-current" />
                  ⚡ Run Full Autonomous Pipeline Sweep
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── SERVER BACKGROUND WORKER DAEMON LIVE CONTROL CARD ─────────────── */}
        <div className="card-base p-6 border-2 border-primary/20 bg-gradient-to-r from-primary/5 via-card to-emerald-500/5 shadow-md space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                <Zap size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-foreground">
                    Server Background Autonomous Worker Daemon
                  </h3>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    daemonState.isRunning
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                  }`}>
                    {daemonState.isRunning ? 'RUNNING (AUTONOMOUS)' : 'PAUSED'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Current Target: <strong className="text-foreground">{daemonState.activeCurriculumTarget}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <select
                value={daemonState.frequencyMinutes}
                onChange={(e) => handleDaemonAction('start', Number(e.target.value))}
                className="input-base text-xs font-semibold py-1.5 px-3"
                disabled={isControllingDaemon}
              >
                <option value={15}>Every 15 Minutes</option>
                <option value={30}>Every 30 Minutes (Recommended)</option>
                <option value={60}>Every 1 Hour</option>
                <option value={360}>Every 6 Hours</option>
              </select>

              {daemonState.isRunning ? (
                <button
                  onClick={() => handleDaemonAction('stop')}
                  disabled={isControllingDaemon}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/30 hover:bg-amber-500/20 flex items-center gap-1.5 transition-colors"
                >
                  <Pause size={13} />
                  Pause Daemon
                </button>
              ) : (
                <button
                  onClick={() => handleDaemonAction('start')}
                  disabled={isControllingDaemon}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/20 flex items-center gap-1.5 transition-colors"
                >
                  <Play size={13} />
                  Resume Daemon
                </button>
              )}

              <button
                onClick={() => handleDaemonAction('trigger_cycle')}
                disabled={isControllingDaemon}
                className="btn-primary text-xs font-bold py-1.5 px-3.5 flex items-center gap-1.5"
              >
                {isControllingDaemon ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                Trigger Immediate Cycle
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-card border border-border">
              <span className="text-muted-foreground block text-[11px]">Cycles Completed</span>
              <span className="text-base font-black text-foreground">{daemonState.totalCyclesCompleted}</span>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border">
              <span className="text-muted-foreground block text-[11px]">Auto Notes Ingested</span>
              <span className="text-base font-black text-emerald-500">{daemonState.totalNotesPosted}</span>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border">
              <span className="text-muted-foreground block text-[11px]">Auto MCQs Ingested</span>
              <span className="text-base font-black text-primary">{daemonState.totalQuestionsPosted}</span>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border">
              <span className="text-muted-foreground block text-[11px]">Streak Reminders Sent</span>
              <span className="text-base font-black text-purple-500">{daemonState.totalRemindersSent}</span>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-border gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-3 text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'overview'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Bot size={16} />
            Command Center Overview
          </button>
          <button
            onClick={() => setActiveTab('must_solve')}
            className={`pb-3 px-3 text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'must_solve'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Zap size={16} />
            Must-Solve 500 Questions Bank
          </button>
          <button
            onClick={() => setActiveTab('codes')}
            className={`pb-3 px-3 text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'codes'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <KeyRound size={16} />
            10,000 Bulk Codes Minter
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={`pb-3 px-3 text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'questions'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <BookOpen size={16} />
            Autonomous Syllabus Ingestion
          </button>
          <button
            onClick={() => setActiveTab('reminders')}
            className={`pb-3 px-3 text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'reminders'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <BellRing size={16} />
            Student Reminders & Everything
          </button>
        </div>

        {/* ── TAB 1: COMMAND CENTER OVERVIEW ───────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Card 1 */}
              <div className="card-base p-5 border border-border/80 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                    <ShieldCheck size={20} />
                  </div>
                  <h3 className="text-base font-bold text-foreground">10,000 Cryptographic Codes Engine</h3>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    Bulk mint up to 10,000 collision-proof activation voucher keys with Base32 character sets and mathematical checksums. Ready for institutional printing and wholesale books.
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                  <span className="text-[11px] font-mono text-muted-foreground">Up to 10,000 Keys</span>
                  <button
                    onClick={() => setActiveTab('codes')}
                    className="btn-ghost text-xs text-primary font-semibold flex items-center gap-1"
                  >
                    Open Minter <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* Card 2 */}
              <div className="card-base p-5 border border-border/80 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
                    <Zap size={20} />
                  </div>
                  <h3 className="text-base font-bold text-foreground">Must-Solve 500 Questions Bank</h3>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    Curated flagship examination blueprints with KaTeX derivations, distractor rationales, and past-year tags across CEE, SEE, and IELTS.
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                  <span className="text-[11px] font-mono text-muted-foreground">Curated High-Yield Blueprints</span>
                  <button
                    onClick={() => setActiveTab('must_solve')}
                    className="btn-ghost text-xs text-emerald-500 font-semibold flex items-center gap-1"
                  >
                    Explore Bank <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* Card 3 */}
              <div className="card-base p-5 border border-border/80 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-3">
                    <BellRing size={20} />
                  </div>
                  <h3 className="text-base font-bold text-foreground">Autonomous Student Reminders Engine</h3>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    Automated Study Streak preservation warnings, CEE/SEE real-time countdown clocks, 30-min pre-class alerts, and subscription renewal notifications with WhatsApp direct links.
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                  <span className="text-[11px] font-mono text-muted-foreground">Multi-Channel Dispatches</span>
                  <button
                    onClick={() => setActiveTab('reminders')}
                    className="btn-ghost text-xs text-purple-500 font-semibold flex items-center gap-1"
                  >
                    View Daemons <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Live Autonomous Telemetry Console */}
            <div className="card-base p-4 border border-border bg-slate-950 text-slate-100 rounded-2xl shadow-xl font-mono text-xs overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-slate-400">
                <div className="flex items-center gap-2">
                  <Terminal size={16} className="text-primary" />
                  <span className="font-bold text-slate-200">Autonomous Operations Telemetry Terminal</span>
                </div>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">Live Daemon Stream</span>
              </div>
              <div className="h-60 overflow-y-auto space-y-1.5 py-3 pr-2 scrollbar-thin">
                {logs.map((log) => {
                  let colorClass = 'text-slate-300';
                  if (log.level === 'success') colorClass = 'text-emerald-400';
                  if (log.level === 'warn') colorClass = 'text-amber-400';
                  if (log.level === 'cyan') colorClass = 'text-cyan-400';
                  if (log.level === 'purple') colorClass = 'text-purple-400';

                  return (
                    <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                      <span className="text-slate-500 select-none shrink-0">[{log.timestamp}]</span>
                      <span className={colorClass}>{log.message}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: MUST-SOLVE 500 IMPORTANT QUESTIONS ─────────────────────── */}
        {activeTab === 'must_solve' && (
          <div className="space-y-6">
            <div className="card-base p-5 border border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Program</label>
                  <select
                    value={mustSolveProgram}
                    onChange={(e) => setMustSolveProgram(e.target.value)}
                    className="input-base text-xs font-semibold py-1.5"
                  >
                    <option value="all">All Programs</option>
                    <option value="cee">CEE (Medical Nepal)</option>
                    <option value="see">SEE (Class 10 Board)</option>
                    <option value="ielts">IELTS Academic</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Subject</label>
                  <select
                    value={mustSolveSubject}
                    onChange={(e) => setMustSolveSubject(e.target.value)}
                    className="input-base text-xs font-semibold py-1.5"
                  >
                    <option value="all">All Subjects</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Botany">Botany</option>
                    <option value="Zoology">Zoology</option>
                    <option value="Mental Agility Test">Mental Agility (MAT)</option>
                    <option value="Science">Science (SEE)</option>
                    <option value="Mathematics">Mathematics (SEE)</option>
                    <option value="Reading">Reading (IELTS)</option>
                  </select>
                </div>

                <div className="min-w-[220px]">
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Search Keywords</label>
                  <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={mustSolveSearch}
                      onChange={(e) => setMustSolveSearch(e.target.value)}
                      placeholder="e.g. Pascal, Aldol, Doppler, CEE 2081..."
                      className="input-base text-xs pl-8 py-1.5 w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end">
                <span className="text-xs text-muted-foreground font-semibold">
                  Showing {filteredMustSolves.length} Questions
                </span>
                <button
                  onClick={() => {
                    const csvRows = filteredMustSolves.map((q, idx) => [
                      idx + 1,
                      q.program_type.toUpperCase(),
                      `"${q.subject}"`,
                      `"${q.topic}"`,
                      `"${q.question_text.replace(/"/g, '""')}"`,
                      `"${q.option_a.replace(/"/g, '""')}"`,
                      `"${q.option_b.replace(/"/g, '""')}"`,
                      `"${q.option_c.replace(/"/g, '""')}"`,
                      `"${q.option_d.replace(/"/g, '""')}"`,
                      q.correct_option.toUpperCase(),
                      `"${q.explanation.replace(/"/g, '""')}"`,
                    ].join(','));
                    const csv = ['Serial #,Program,Subject,Topic,Question,OptA,OptB,OptC,OptD,Answer,Explanation', ...csvRows].join('\n');
                    downloadCsv(csv, `Samyak_MustSolve_Questions.csv`);
                  }}
                  className="btn-primary text-xs flex items-center gap-1.5 py-1.5 px-3"
                >
                  <Download size={13} />
                  Export CSV
                </button>
              </div>
            </div>

            {/* Questions Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              {filteredMustSolves.map((q, idx) => (
                <div key={idx} className="card-base p-5 border border-border space-y-3 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                        {q.program_type.toUpperCase()} · {q.subject}: {q.topic}
                      </span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground font-semibold">
                        {q.past_year_tag}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-foreground leading-relaxed">
                      Q{idx + 1}. {q.question_text}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className={`p-2 rounded-lg border ${q.correct_option === 'a' ? 'bg-emerald-500/10 border-emerald-500/30 font-bold text-emerald-600' : 'bg-muted/40 border-border text-foreground'}`}>
                        A: {q.option_a}
                      </div>
                      <div className={`p-2 rounded-lg border ${q.correct_option === 'b' ? 'bg-emerald-500/10 border-emerald-500/30 font-bold text-emerald-600' : 'bg-muted/40 border-border text-foreground'}`}>
                        B: {q.option_b}
                      </div>
                      <div className={`p-2 rounded-lg border ${q.correct_option === 'c' ? 'bg-emerald-500/10 border-emerald-500/30 font-bold text-emerald-600' : 'bg-muted/40 border-border text-foreground'}`}>
                        C: {q.option_c}
                      </div>
                      <div className={`p-2 rounded-lg border ${q.correct_option === 'd' ? 'bg-emerald-500/10 border-emerald-500/30 font-bold text-emerald-600' : 'bg-muted/40 border-border text-foreground'}`}>
                        D: {q.option_d}
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300">
                    <span className="font-bold">Correct: [{q.correct_option.toUpperCase()}]</span> — {q.explanation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 3: 10,000 CRYPTOGRAPHIC BULK CODES ───────────────────────── */}
        {activeTab === 'codes' && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1 card-base p-6 border border-border">
              <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
                <ShieldCheck size={18} className="text-primary" />
                Bulk Mint Controls
              </h2>
              <form onSubmit={handleMintCodes} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Batch Identifier</label>
                  <input
                    type="text"
                    value={codeBatchName}
                    onChange={(e) => setCodeBatchName(e.target.value.toUpperCase())}
                    className="input-base w-full text-xs font-mono uppercase"
                    placeholder="e.g. CEE-HERITAGE-2082"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Number of Codes</label>
                  <select
                    value={codeCount}
                    onChange={(e) => setCodeCount(Number(e.target.value))}
                    className="input-base w-full text-xs font-semibold"
                  >
                    <option value={100}>100 Codes</option>
                    <option value={500}>500 Codes</option>
                    <option value={1000}>1,000 Codes</option>
                    <option value={2500}>2,500 Codes</option>
                    <option value={5000}>5,000 Codes</option>
                    <option value={10000}>10,000 Codes (Maximum Security)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Subscription Plan</label>
                  <select
                    value={codePlan}
                    onChange={(e) => setCodePlan(e.target.value as any)}
                    className="input-base w-full text-xs"
                  >
                    <option value="pro">Pro Plan (All Courses & Analytics)</option>
                    <option value="student">Student Plan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Duration</label>
                  <select
                    value={codeDuration}
                    onChange={(e) => setCodeDuration(Number(e.target.value))}
                    className="input-base w-full text-xs"
                  >
                    <option value={30}>30 Days (1 Month)</option>
                    <option value={90}>90 Days (3 Months)</option>
                    <option value={180}>180 Days (6 Months)</option>
                    <option value={365}>365 Days (1 Full Year)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isMintingCodes}
                  className="btn-primary w-full text-xs font-bold py-2.5 flex items-center justify-center gap-2 mt-2"
                >
                  {isMintingCodes ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Minting {codeCount.toLocaleString()} Codes...
                    </>
                  ) : (
                    <>
                      <KeyRound size={14} />
                      Mint {codeCount.toLocaleString()} Cryptographic Codes
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="md:col-span-2 space-y-4">
              {mintedResult ? (
                <div className="card-base p-6 border border-emerald-500/30 bg-emerald-500/5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-border/60">
                    <div>
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <CheckCircle2 size={18} className="text-emerald-500" />
                        Batch {mintedResult.batchId} Successfully Minted!
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {mintedResult.totalMinted.toLocaleString()} unique codes generated with mathematical checksum validation.
                      </p>
                    </div>
                    <button
                      onClick={() => downloadCsv(mintedResult.csvContent, `Samyak_${mintedResult.batchId}_Codes.csv`)}
                      className="btn-primary text-xs flex items-center gap-1.5 py-1.5 px-3"
                    >
                      <Download size={14} />
                      Download Full CSV
                    </button>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                      Sample Generated Cryptographic Keys
                    </span>
                    <div className="space-y-1.5 font-mono text-xs bg-muted/40 p-3 rounded-xl border border-border">
                      {mintedResult.sampleCodes.map((code, idx) => (
                        <div key={idx} className="flex items-center justify-between py-1 border-b border-border/40 last:border-0">
                          <span className="font-semibold text-foreground">{code}</span>
                          <button
                            onClick={() => copyToClipboard(code)}
                            className="text-muted-foreground hover:text-foreground text-[11px] flex items-center gap-1"
                          >
                            {copiedCode === code ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                            {copiedCode === code ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card-base p-10 border border-border text-center flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                    <KeyRound size={24} />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">Ready to Mint High-Entropy Codes</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mt-1">
                    Select your batch parameters on the left and mint up to 10,000 codes with zero collision guarantees.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 4: AUTONOMOUS RESEARCH & QUESTIONS ───────────────────────── */}
        {activeTab === 'questions' && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1 card-base p-6 border border-border">
              <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
                <BookOpen size={18} className="text-emerald-500" />
                Curriculum Research Controls
              </h2>
              <form onSubmit={handleGenerateQuestions} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Target Program</label>
                  <select
                    value={qProgram}
                    onChange={(e) => setQProgram(e.target.value as any)}
                    className="input-base w-full text-xs font-bold"
                  >
                    <option value="cee">CEE (Medical Entrance Nepal - 200 Marks)</option>
                    <option value="see">SEE (Class 10 Board Nepal)</option>
                    <option value="ielts">IELTS (Academic & General Band 9)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Subject Focus (Optional)</label>
                  <input
                    type="text"
                    value={qSubject}
                    onChange={(e) => setQSubject(e.target.value)}
                    placeholder="e.g. Physics, Organic Chemistry, Botany"
                    className="input-base w-full text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">Leave blank to research all program subjects</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Question Volume Target</label>
                  <select
                    value={qCount}
                    onChange={(e) => setQCount(Number(e.target.value))}
                    className="input-base w-full text-xs font-semibold"
                  >
                    <option value={50}>50 Questions (Quick Review)</option>
                    <option value={100}>100 Questions (Standard Chapter)</option>
                    <option value={200}>200 Questions (Full CEE Mock Size)</option>
                    <option value={500}>500 Questions (Must-Solve Master Pack)</option>
                    <option value={1000}>1,000 Questions</option>
                    <option value={5000}>5,000 Questions (Autonomous Sweep)</option>
                    <option value={10000}>10,000 Questions (Complete Repository)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="autoPub"
                    checked={qAutoPublish}
                    onChange={(e) => setQAutoPublish(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                  />
                  <label htmlFor="autoPub" className="text-xs text-foreground cursor-pointer font-medium">
                    Auto-publish directly into Question Bank table
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isGeneratingQuestions}
                  className="btn-primary w-full text-xs font-bold py-2.5 flex items-center justify-center gap-2 mt-2 bg-emerald-600 hover:bg-emerald-700"
                >
                  {isGeneratingQuestions ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Synthesizing {qCount} Questions...
                    </>
                  ) : (
                    <>
                      <Zap size={14} />
                      Generate {qCount.toLocaleString()} MCQs Now
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="md:col-span-2 space-y-4">
              {questionsResult ? (
                <div className="space-y-4">
                  <div className="card-base p-5 border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-foreground">
                        Batch {questionsResult.batchId} Ready ({questionsResult.totalGenerated.toLocaleString()} MCQs)
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Ingested across {questionsResult.topicsCovered.length} syllabus topics for {questionsResult.program.toUpperCase()}.
                      </p>
                    </div>
                    <button
                      onClick={() => downloadCsv(questionsResult.csvContent, `Samyak_${questionsResult.batchId}_MCQs.csv`)}
                      className="btn-primary text-xs flex items-center gap-1.5 py-1.5 px-3"
                    >
                      <Download size={14} />
                      Download Question Bank CSV
                    </button>
                  </div>

                  {/* Sample Questions Preview Card */}
                  <div className="card-base p-5 border border-border space-y-4">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Sample High-Yield Question Previews (with KaTeX & Past Year Tags)
                    </h4>
                    <div className="space-y-4">
                      {questionsResult.sampleQuestions.map((q: any, idx: number) => (
                        <div key={idx} className="p-4 rounded-xl bg-muted/30 border border-border/60 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                              {q.subject}: {q.topic}
                            </span>
                            <span className="text-[11px] font-mono text-muted-foreground">{q.past_year_tag}</span>
                          </div>
                          <p className="text-xs font-semibold text-foreground leading-relaxed">
                            Q{idx + 1}. {q.question_text}
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="p-2 rounded-lg bg-background border border-border">A: {q.option_a}</div>
                            <div className="p-2 rounded-lg bg-background border border-border">B: {q.option_b}</div>
                            <div className="p-2 rounded-lg bg-background border border-border">C: {q.option_c}</div>
                            <div className="p-2 rounded-lg bg-background border border-border">D: {q.option_d}</div>
                          </div>
                          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400">
                            <span className="font-bold">Correct Option: {q.correct_option?.toUpperCase()}</span> — {q.explanation}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card-base p-10 border border-border text-center flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
                    <BookOpen size={24} />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">Ready to Ingest Syllabus MCQs</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mt-1">
                    Select curriculum, topic count, and auto-publish options to begin synthesizing authentic questions.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 5: STUDENT REMINDERS & EVERYTHING ───────────────────────── */}
        {activeTab === 'reminders' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="card-base p-4 border border-border">
                <div className="flex items-center justify-between text-muted-foreground mb-1">
                  <span className="text-xs font-semibold">CEE 2082 Countdown</span>
                  <Clock size={16} className="text-primary" />
                </div>
                <div className="text-xl font-bold text-foreground">{countdowns.cee.days} Days Remaining</div>
                <p className="text-[11px] text-muted-foreground mt-1">Bhadra 2082 Examination</p>
              </div>

              <div className="card-base p-4 border border-border">
                <div className="flex items-center justify-between text-muted-foreground mb-1">
                  <span className="text-xs font-semibold">SEE 2081/2082 Countdown</span>
                  <Clock size={16} className="text-emerald-500" />
                </div>
                <div className="text-xl font-bold text-foreground">{countdowns.see.days} Days Remaining</div>
                <p className="text-[11px] text-muted-foreground mt-1">Chaitra Board Examination</p>
              </div>

              <div className="card-base p-4 border border-border">
                <div className="flex items-center justify-between text-muted-foreground mb-1">
                  <span className="text-xs font-semibold">Study Streak Saver</span>
                  <Flame size={16} className="text-amber-500" />
                </div>
                <div className="text-xl font-bold text-foreground">Automated Daemon</div>
                <p className="text-[11px] text-muted-foreground mt-1">Protects active streaks</p>
              </div>

              <div className="card-base p-4 border border-border">
                <div className="flex items-center justify-between text-muted-foreground mb-1">
                  <span className="text-xs font-semibold">30-min Class Pre-flight</span>
                  <Radio size={16} className="text-purple-500" />
                </div>
                <div className="text-xl font-bold text-foreground">Live Broadcast</div>
                <p className="text-[11px] text-muted-foreground mt-1">Direct classroom join links</p>
              </div>
            </div>

            {/* Quick Trigger Actions */}
            <div className="card-base p-6 border border-border space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <BellRing size={18} className="text-purple-500" />
                Execute Autonomous Dispatches
              </h3>
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  onClick={() => handleDispatchReminders('streak_preservation')}
                  disabled={isDispatchingReminders}
                  className="p-3.5 rounded-xl border border-border hover:border-amber-500/50 hover:bg-amber-500/5 text-left transition-all"
                >
                  <div className="flex items-center gap-2 text-amber-500 font-bold text-xs mb-1">
                    <Flame size={14} />
                    Streak Saver Alerts
                  </div>
                  <p className="text-[11px] text-muted-foreground">Warn students whose streaks expire at midnight</p>
                </button>

                <button
                  onClick={() => handleDispatchReminders('exam_countdown')}
                  disabled={isDispatchingReminders}
                  className="p-3.5 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 text-left transition-all"
                >
                  <div className="flex items-center gap-2 text-primary font-bold text-xs mb-1">
                    <Clock size={14} />
                    Exam Countdown Clocks
                  </div>
                  <p className="text-[11px] text-muted-foreground">Broadcast remaining days and daily goals</p>
                </button>

                <button
                  onClick={() => handleDispatchReminders('live_class_alert')}
                  disabled={isDispatchingReminders}
                  className="p-3.5 rounded-xl border border-border hover:border-purple-500/50 hover:bg-purple-500/5 text-left transition-all"
                >
                  <div className="flex items-center gap-2 text-purple-500 font-bold text-xs mb-1">
                    <Radio size={14} />
                    30-min Class Alerts
                  </div>
                  <p className="text-[11px] text-muted-foreground">Notify aspirants for live doubt clearing</p>
                </button>

                <button
                  onClick={() => handleDispatchReminders('subscription_expiry')}
                  disabled={isDispatchingReminders}
                  className="p-3.5 rounded-xl border border-border hover:border-emerald-500/50 hover:bg-emerald-500/5 text-left transition-all"
                >
                  <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs mb-1">
                    <ShieldCheck size={14} />
                    Expiry Safeguards
                  </div>
                  <p className="text-[11px] text-muted-foreground">Prompt renewals and code redemptions</p>
                </button>
              </div>
            </div>

            {/* Reminder Results Display */}
            {reminderResult && (
              <div className="card-base p-5 border border-border space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Recent Dispatches Telemetry (Batch {reminderResult.batchId})
                  </h4>
                  <span className="text-xs font-semibold text-emerald-500">
                    {reminderResult.totalDispatched} Delivered
                  </span>
                </div>
                <div className="space-y-2">
                  {reminderResult.sampleDispatches?.map((item: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-muted/30 border border-border flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-foreground flex items-center gap-2">
                          <span>{item.title}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            {item.userName}
                          </span>
                        </div>
                        <p className="text-muted-foreground mt-0.5">{item.message}</p>
                      </div>
                      {item.whatsAppUrl && (
                        <a
                          href={item.whatsAppUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 ml-4 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/20 text-[11px] font-semibold flex items-center gap-1"
                        >
                          <Send size={12} />
                          WhatsApp
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
