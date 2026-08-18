'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Zap, ArrowRight, Loader2, Sparkles, PartyPopper } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const SUBJECT_STYLES: Record<string, { color: string; bg: string }> = {
  biology: { color: 'text-bio', bg: 'bg-bio-light' },
  chemistry: { color: 'text-chem', bg: 'bg-chem-light' },
  physics: { color: 'text-physics', bg: 'bg-physics-light' },
  mental_agility: { color: 'text-ma', bg: 'bg-ma-light' },
};

interface RecTask {
  id: string;
  icon: React.ElementType;
  title: string;
  subjectLabel: string;
  color: string;
  bg: string;
  href: string;
}

export default function StudyPlanTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<RecTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const masteryRes = await supabase
        .from('topic_mastery')
        .select('chapter_id, mastery_level, accuracy, chapters(title, subjects(name, display_name))')
        .eq('student_id', user.id)
        .order('accuracy', { ascending: true })
        .limit(10);

      if (cancelled) return;

      const weakChapterTasks: RecTask[] = (masteryRes.data ?? [])
        .filter(
          (m: any) =>
            m.chapters &&
            (m.mastery_level === 'not_attempted' ||
              m.mastery_level === 'critical' ||
              m.mastery_level === 'weak' ||
              (m.accuracy != null && m.accuracy < 60))
        )
        .slice(0, 4)
        .map((m: any) => {
          const style = SUBJECT_STYLES[m.chapters.subjects?.name] ?? SUBJECT_STYLES.biology;
          return {
            id: `mastery-${m.chapter_id}`,
            icon: Zap,
            title: `Practice: ${m.chapters.title}`,
            subjectLabel: m.chapters.subjects?.display_name ?? 'General',
            color: style.color,
            bg: style.bg,
            href: `/practice?subject=${encodeURIComponent(m.chapters.subjects?.display_name ?? '')}&chapter=${m.chapter_id}`,
          };
        });

      setTasks(weakChapterTasks);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return (
    <div className="card-base h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-semibold text-foreground">Recommended for You</p>
          <p className="text-xs text-muted-foreground mt-0.5">Based on your weak topics &amp; mastery accuracy</p>
        </div>
        <Link href="/subjects" className="text-xs text-primary font-medium hover:underline flex items-center gap-0.5">
          Browse all <ArrowRight size={11} />
        </Link>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center py-6">
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
          <PartyPopper size={26} className="text-success opacity-70 mb-2" />
          <p className="text-sm text-foreground font-medium">You're all caught up!</p>
          <p className="text-xs text-muted-foreground mt-1">No weak topics recorded yet. Start practicing MCQs!</p>
        </div>
      ) : (
        <div className="space-y-2 flex-1">
          {tasks.map((task) => (
            <Link
              key={task.id}
              href={task.href}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-150 hover:bg-muted group"
            >
              <div className={`w-7 h-7 rounded-lg ${task.bg} flex items-center justify-center shrink-0`}>
                <task.icon size={13} className={task.color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-tight truncate text-foreground">{task.title}</p>
                <span className={`text-xs ${task.color}`}>{task.subjectLabel}</span>
              </div>
              <ArrowRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </Link>
          ))}
        </div>
      )}

      {!loading && tasks.length > 0 && (
        <div className="mt-3 flex items-start gap-2 bg-secondary/50 rounded-xl p-2.5">
          <Sparkles size={13} className="text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">Picked from your chapter accuracy — updates automatically as you complete MCQ sets.</p>
        </div>
      )}
    </div>
  );
}
