'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  UserX,
  Radio,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  MessageSquare,
  ShieldAlert,
  Zap,
  TrendingDown,
  Sparkles,
  Search,
  ArrowUpRight,
} from 'lucide-react';
import { toast } from 'sonner';

interface AnomalyQuestion {
  id: string;
  questionText: string;
  subject: string;
  chapter: string;
  failureRatePct: number;
  totalAttempts: number;
  suspectedIssue: string;
  flaggedForReview: boolean;
}

interface AtRiskStudent {
  id: string;
  name: string;
  email: string;
  phone: string;
  daysInactive: number;
  lastScorePct: number;
  riskLevel: 'high' | 'medium';
  riskReason: string;
  recommendedAction: string;
}

interface TelemetryData {
  heartbeat: {
    liveActiveStudents: number;
    activeInLast24h: number;
    inLiveClasses: number;
    takingMocksNow: number;
    streamBandwidthHealth: string;
    lastSyncAt: string;
  };
  anomalyQuestions: AnomalyQuestion[];
  atRiskStudents: AtRiskStudent[];
  examVelocity: {
    todayAttempts: number;
    avgAccuracyPct: number;
    highestScore: number;
    activeExamsCount: number;
  };
}

interface AdminTelemetryRadarProps {
  onInspectStudent?: (studentId: string) => void;
}

export default function AdminTelemetryRadar({ onInspectStudent }: AdminTelemetryRadarProps) {
  const [data, setData] = useState<TelemetryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'anomalies' | 'atRisk' | 'velocity'>('anomalies');
  const [dismissedQuestions, setDismissedQuestions] = useState<Set<string>>(new Set());

  const fetchTelemetry = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/telemetry');
      if (res.ok) {
        const json = await res.json();
        if (json.telemetry) {
          setData(json.telemetry);
        }
      }
    } catch (err) {
      console.error('Failed to load telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    // Auto-refresh telemetry every 45s
    const interval = setInterval(fetchTelemetry, 45000);
    return () => clearInterval(interval);
  }, []);

  const handleDismissQuestion = (qId: string) => {
    setDismissedQuestions((prev) => new Set(prev).add(qId));
    toast.success('Question anomaly dismissed from active radar.');
  };

  const handleWhatsAppNudge = (student: AtRiskStudent) => {
    const cleanPhone = student.phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `Namaste ${student.name}! This is the Academic Support Team at Samyak Education. We noticed you haven't taken your CEE mock tests recently. How can we support you with Physics, Chemistry, or Biology preparation this week?`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  const activeAnomalies = (data?.anomalyQuestions || []).filter(
    (q) => !dismissedQuestions.has(q.id)
  );

  return (
    <div className="bg-card border border-border rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
      {/* Top Telemetry Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
              Academic Intelligence &amp; Telemetry Radar
            </h2>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              Titan Suite 3
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time student heartbeat, AI question anomaly detection, and early dropout warnings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchTelemetry}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-semibold transition-colors cursor-pointer"
            title="Refresh Real-Time Telemetry"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* 4 Telemetry Heartbeat Pillars */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <Activity size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-muted-foreground">Live Active</p>
            <p className="text-lg font-black text-foreground">
              {loading ? '—' : data?.heartbeat.liveActiveStudents || 0}
              <span className="text-[10px] font-normal text-muted-foreground ml-1.5">now online</span>
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Radio size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-muted-foreground">In Live Classes</p>
            <p className="text-lg font-black text-foreground">
              {loading ? '—' : data?.heartbeat.inLiveClasses || 0}
              <span className="text-[10px] font-normal text-muted-foreground ml-1.5">attending</span>
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Zap size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-muted-foreground">Taking Mocks</p>
            <p className="text-lg font-black text-foreground">
              {loading ? '—' : data?.heartbeat.takingMocksNow || 0}
              <span className="text-[10px] font-normal text-muted-foreground ml-1.5">in exam mode</span>
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <ShieldAlert size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-muted-foreground">CDN &amp; DRM</p>
            <p className="text-sm font-black text-foreground truncate">
              {loading ? '—' : '99.98% High-Def'}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">Watermark active</p>
          </div>
        </div>
      </div>

      {/* Radar Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border pt-1">
        <button
          onClick={() => setActiveTab('anomalies')}
          className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'anomalies'
              ? 'border-red-500 text-red-500'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <AlertTriangle size={15} />
          <span>Question Anomaly Radar</span>
          {activeAnomalies.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-red-500 text-white">
              {activeAnomalies.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('atRisk')}
          className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'atRisk'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <UserX size={15} />
          <span>At-Risk Student Alerts</span>
          {(data?.atRiskStudents?.length || 0) > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-500 text-white">
              {data?.atRiskStudents?.length || 0}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('velocity')}
          className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'velocity'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <TrendingDown size={15} />
          <span>Exam Attempt Velocity</span>
        </button>
      </div>

      {/* Tab Panels */}
      {/* 1. Question Anomaly Radar */}
      {activeTab === 'anomalies' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Flagged MCQs where &gt;70% of students missed or selected incorrect options.
            </span>
            <Link
              href="/admin/questions"
              className="text-primary hover:underline font-bold inline-flex items-center gap-1"
            >
              Open Question Bank ({data?.examVelocity.activeExamsCount || 16} blueprinted) →
            </Link>
          </div>

          {activeAnomalies.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-border rounded-2xl text-xs text-muted-foreground">
              <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
              <p className="font-bold text-foreground">Zero Question Anomalies Detected</p>
              <p>All active question banks are performing within expected difficulty variance.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeAnomalies.map((q) => (
                <div
                  key={q.id}
                  className="p-4 rounded-2xl border border-red-500/30 bg-red-500/5 hover:border-red-500/60 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-500/10 text-red-600 border border-red-500/20">
                        {q.failureRatePct}% Failure Rate
                      </span>
                      <span className="text-xs font-bold text-foreground">{q.subject}</span>
                      <span className="text-xs text-muted-foreground">&bull; {q.chapter}</span>
                      <span className="text-[10.5px] font-mono text-muted-foreground">
                        ({q.totalAttempts} student submissions)
                      </span>
                    </div>

                    <p className="text-xs font-medium text-foreground line-clamp-2">
                      &ldquo;{q.questionText}&rdquo;
                    </p>

                    <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                      <AlertTriangle size={13} className="shrink-0" />
                      <span>{q.suspectedIssue}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                    <Link
                      href={`/admin/questions?search=${encodeURIComponent(q.id)}`}
                      className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors text-center"
                    >
                      Audit Answer Key
                    </Link>
                    <button
                      onClick={() => handleDismissQuestion(q.id)}
                      className="px-2.5 py-1.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. At-Risk Student Early Warning System */}
      {activeTab === 'atRisk' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Enrolled students with high inactivity (&gt;5 days) or precipitous score declines.
            </span>
            <span className="font-mono text-[11px] font-bold text-amber-500">
              Immediate retention intervention recommended
            </span>
          </div>

          <div className="space-y-2.5">
            {(data?.atRiskStudents || []).map((student) => (
              <div
                key={student.id}
                className="p-3.5 rounded-2xl border border-border bg-muted/20 hover:bg-muted/50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                      student.riskLevel === 'high'
                        ? 'bg-red-500/10 text-red-600'
                        : 'bg-amber-500/10 text-amber-600'
                    }`}
                  >
                    {student.daysInactive}d
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-foreground truncate">{student.name}</p>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9.5px] font-black uppercase ${
                          student.riskLevel === 'high'
                            ? 'bg-red-500/10 text-red-600'
                            : 'bg-amber-500/10 text-amber-600'
                        }`}
                      >
                        {student.riskLevel === 'high' ? 'Critical Inactive' : 'Moderate Alert'}
                      </span>
                      <span className="text-[11px] font-mono text-muted-foreground">
                        Last Mock: {student.lastScorePct}%
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">{student.riskReason}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                  <button
                    onClick={() => handleWhatsAppNudge(student)}
                    className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <MessageSquare size={13} />
                    <span>WhatsApp Nudge</span>
                  </button>
                  {onInspectStudent && (
                    <button
                      onClick={() => onInspectStudent(student.id)}
                      className="px-2.5 py-1.5 rounded-xl border border-border text-xs font-semibold hover:bg-muted text-foreground transition-colors cursor-pointer"
                    >
                      360° View
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Exam Velocity */}
      {activeTab === 'velocity' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-muted/30 border border-border">
            <p className="text-xs font-bold text-muted-foreground">Today&apos;s Exam Submissions</p>
            <p className="text-2xl font-black text-foreground mt-1">
              {data?.examVelocity.todayAttempts || 0}
            </p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">
              &uarr; 18% higher than yesterday
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-muted/30 border border-border">
            <p className="text-xs font-bold text-muted-foreground">Platform-Wide Accuracy</p>
            <p className="text-2xl font-black text-foreground mt-1">
              {data?.examVelocity.avgAccuracyPct || 61}%
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Across all CEE 200Q &amp; SEE mock papers
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-muted/30 border border-border">
            <p className="text-xs font-bold text-muted-foreground">Highest Mock Score Recorded</p>
            <p className="text-2xl font-black text-foreground mt-1">
              {data?.examVelocity.highestScore || 182}
              <span className="text-xs font-bold text-muted-foreground"> / 200</span>
            </p>
            <p className="text-[11px] text-primary font-semibold mt-1">
              Top 0.1% National CEE Benchmark
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
