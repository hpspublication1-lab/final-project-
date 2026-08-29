'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, BookOpen, Zap, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface WeakTopic {
  id: string;
  topic: string;
  subject: string;
  subjectColor: string;
  subjectBg: string;
  severity: string;
  severityClass: string;
  accuracy: number;
  attempts: number;
  lastAttempted: string;
}

const subjectStyleMap: Record<string, { color: string; bg: string }> = {
  biology: { color: 'text-bio', bg: 'bg-bio-light' },
  chemistry: { color: 'text-chem', bg: 'bg-chem-light' },
  physics: { color: 'text-physics', bg: 'bg-physics-light' },
  mental_agility: { color: 'text-ma', bg: 'bg-ma-light' },
};

const masteryToSeverity: Record<string, { label: string; cls: string }> = {
  critical: { label: 'Critical', cls: 'badge-critical' },
  weak: { label: 'Weak', cls: 'badge-weak' },
  developing: { label: 'Developing', cls: 'badge-developing' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return '1d ago';
  return `${days}d ago`;
}

export default function WeakTopicsPanel() {
  const { user } = useAuth();
  const [topics, setTopics] = useState<WeakTopic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const fetchWeakTopics = async () => {
      setLoading(true);
      try {
        const supabase = createClient();

        const { data, error } = await supabase
          .from('topic_mastery')
          .select('id, mastery_level, questions_attempted, accuracy, last_practiced_at, chapters(title, subjects(name, display_name))')
          .eq('student_id', user.id)
          .in('mastery_level', ['critical', 'weak', 'developing'])
          .order('accuracy', { ascending: true })
          .limit(5);

        if (error || !data?.length) {
          setTopics([]);
          return;
        }

        const mapped: WeakTopic[] = data.map((row: any) => {
          const subjectName = row.chapters?.subjects?.name as string || 'biology';
          const displayName = row.chapters?.subjects?.display_name as string || subjectName;
          const style = subjectStyleMap[subjectName] || subjectStyleMap.biology;
          const severity = masteryToSeverity[row.mastery_level] || masteryToSeverity.weak;

          return {
            id: row.id,
            topic: row.chapters?.title || 'Unknown Topic',
            subject: displayName,
            subjectColor: style.color,
            subjectBg: style.bg,
            severity: severity.label,
            severityClass: severity.cls,
            accuracy: Math.round(Number(row.accuracy)),
            attempts: row.questions_attempted || 0,
            lastAttempted: row.last_practiced_at ? timeAgo(row.last_practiced_at) : 'Never',
          };
        });

        setTopics(mapped);
      } catch {
        setTopics([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWeakTopics();
  }, [user?.id]);

  return (
    <div className="card-luxury p-5 sm:p-6 shadow-luxury h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle size={17} className="text-error" />
          <p className="text-sm font-extrabold text-foreground">AI Weakness Diagnostic</p>
          {!loading && (
            <span className="text-[10px] bg-rose-500/10 text-rose-600 border border-rose-500/20 font-black px-2 py-0.5 rounded-full font-mono">{topics.length}</span>
          )}
        </div>
        <Link href="/mistake-analyser" className="text-xs text-primary font-bold hover:underline">View analysis</Link>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center py-6">
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
        </div>
      ) : topics.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center py-6">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <Zap size={18} className="text-emerald-500" />
          </div>
          <p className="text-sm font-bold text-foreground">No weak topics detected!</p>
          <p className="text-xs text-muted-foreground">Keep practicing MCQs to track your topic mastery.</p>
        </div>
      ) : (
        <div className="space-y-3 flex-1">
          {topics.map((t) => (
            <div key={t.id} className="flex items-start gap-3 p-3.5 rounded-2xl bg-muted/40 hover:bg-muted/70 transition-all border border-border/60 group">
              <div className={`w-8 h-8 rounded-xl ${t.subjectBg} flex items-center justify-center shrink-0 mt-0.5 border border-current/20`}>
                <BookOpen size={14} className={t.subjectColor} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-xs font-extrabold text-foreground leading-tight truncate">{t.topic}</p>
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full shrink-0 font-mono ${t.severityClass}`}>
                    {t.severity}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className={`font-bold ${t.subjectColor}`}>{t.subject}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground font-mono tabular-nums">{t.accuracy}% acc</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{t.attempts} tests</span>
                </div>
                <div className="mt-2 h-1.5 bg-border/60 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-500"
                    style={{ width: `${Math.max(10, t.accuracy)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Link
        href="/mistake-analyser"
        className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-extrabold hover:bg-rose-500/20 transition-all border border-rose-500/25 active:scale-95 shadow-xs"
      >
        <Zap size={14} />
        <span>Fix Weak Topics with AI</span>
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}