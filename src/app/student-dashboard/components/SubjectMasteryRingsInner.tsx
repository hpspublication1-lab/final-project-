'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

import { useProgram } from '@/contexts/ProgramContext';

interface SubjectData {
  key: string;
  name: string;
  value: number;
  fill: string;
  chapters: string;
  color: string;
  bg: string;
}

const SUBJECT_META: Record<string, { key: string; fill: string; color: string; bg: string }> = {
  biology: { key: 'ring-bio', fill: 'var(--bio)', color: 'text-bio', bg: 'bg-bio-light' },
  chemistry: { key: 'ring-chem', fill: 'var(--chem)', color: 'text-chem', bg: 'bg-chem-light' },
  physics: { key: 'ring-phys', fill: 'var(--physics)', color: 'text-physics', bg: 'bg-physics-light' },
  mental_agility: { key: 'ring-ma', fill: 'var(--ma)', color: 'text-ma', bg: 'bg-ma-light' },
  compulsory_science: { key: 'ring-sci', fill: 'var(--bio)', color: 'text-bio', bg: 'bg-bio-light' },
  compulsory_math: { key: 'ring-math', fill: 'var(--chem)', color: 'text-chem', bg: 'bg-chem-light' },
  optional_math: { key: 'ring-opt', fill: 'var(--physics)', color: 'text-physics', bg: 'bg-physics-light' },
  english: { key: 'ring-eng', fill: 'var(--ma)', color: 'text-ma', bg: 'bg-ma-light' },
  social_studies: { key: 'ring-soc', fill: 'var(--primary)', color: 'text-primary', bg: 'bg-primary/10' },
};

const DISPLAY_NAMES: Record<string, string> = {
  biology: 'Biology',
  chemistry: 'Chemistry',
  physics: 'Physics',
  mental_agility: 'Mental Agility',
  compulsory_science: 'Compulsory Science',
  compulsory_math: 'Compulsory Math',
  optional_math: 'Optional Math',
  english: 'English',
  social_studies: 'Social Studies',
};


function RingCard({ subject }: { subject: SubjectData }) {
  const data = [
    { name: subject.name, value: subject.value, fill: subject.fill },
    { name: 'remaining', value: 100 - subject.value, fill: 'var(--border)' },
  ];

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="65%"
            outerRadius="100%"
            data={data}
            startAngle={90}
            endAngle={-270}
            barSize={8}
          >
            <RadialBar dataKey="value" cornerRadius={4} background={{ fill: 'var(--border)' }} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-mono text-lg font-bold tabular-nums ${subject.color}`}>{subject.value}%</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-foreground">{subject.name}</p>
        <p className="text-xs text-muted-foreground">{subject.chapters} chapters</p>
      </div>
      <div className="w-full">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-muted-foreground">Progress</span>
          <span className={`font-semibold ${subject.color}`}>{subject.value}%</span>
        </div>
        <div className="h-1.5 bg-border rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${subject.value}%`, backgroundColor: subject.fill }}
          />
        </div>
      </div>
    </div>
  );
}

export default function SubjectMasteryRingsInner() {
  const { user } = useAuth();
  const { program } = useProgram();
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMastery = useCallback(async () => {
    if (!user?.id) return;
    try {
      const supabase = createClient();

      // Fetch accuracy per subject from practice_attempts
      const { data: practiceData } = await supabase
        .from('practice_attempts')
        .select('is_correct, subject_id, subjects(name)')
        .eq('student_id', user.id);

      // Fetch chapter completion counts per subject
      const { data: chapterData } = await supabase
        .from('subjects')
        .select('id, name, chapters(id)');

      // Fetch completed chapters from topic_mastery
      const { data: masteryData } = await supabase
        .from('topic_mastery')
        .select('subject_id, mastery_level')
        .eq('student_id', user.id);

      // Build accuracy map per subject
      const accuracyMap: Record<string, { correct: number; total: number }> = {};
      (practiceData || []).forEach((row: any) => {
        const name = (row.subjects?.name as string)?.toLowerCase();
        if (!name) return;
        if (!accuracyMap[name]) accuracyMap[name] = { correct: 0, total: 0 };
        accuracyMap[name].total += 1;
        if (row.is_correct) accuracyMap[name].correct += 1;
      });

      // Build mastery chapter count per subject
      const masteredMap: Record<string, number> = {};
      (masteryData || []).forEach((row: any) => {
        const sid = row.subject_id as string;
        if (!masteredMap[sid]) masteredMap[sid] = 0;
        if (row.mastery_level === 'strong' || row.mastery_level === 'proficient') {
          masteredMap[sid] += 1;
        }
      });

      // Build subject list based on active program (CEE vs SEE)
      const ceeOrder = ['biology', 'chemistry', 'physics', 'mental_agility'];
      const seeOrder = ['compulsory_science', 'compulsory_math', 'optional_math', 'english', 'social_studies'];
      const subjectOrder = program === 'see' ? seeOrder : ceeOrder;

      const result: SubjectData[] = subjectOrder.map((key) => {

        const meta = SUBJECT_META[key];
        const acc = accuracyMap[key];
        const accuracy = acc && acc.total > 0 ? Math.round((acc.correct / acc.total) * 100) : 0;

        // Find chapter counts from chapterData
        const subjectRow = (chapterData || []).find(
          (s: any) => (s.name as string)?.toLowerCase() === key
        );
        const totalChapters = subjectRow?.chapters?.length || 0;
        const masteredChapters = subjectRow ? (masteredMap[subjectRow.id] || 0) : 0;

        return {
          key: meta.key,
          name: DISPLAY_NAMES[key],
          value: accuracy,
          fill: meta.fill,
          chapters: totalChapters > 0 ? `${masteredChapters}/${totalChapters}` : '—',
          color: meta.color,
          bg: meta.bg,
        };
      });

      setSubjects(result);
    } catch {
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, program]);


  useEffect(() => {
    if (!user?.id) return;
    fetchMastery();
  }, [fetchMastery, user?.id]);

  // Realtime: re-fetch when new exam_attempts or practice_attempts are inserted
  useEffect(() => {
    if (!user?.id) return;
    const supabase = createClient();

    const examChannel = supabase
      .channel(`mastery-rings-exam-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'exam_attempts',
          filter: `student_id=eq.${user.id}`,
        },
        () => { fetchMastery(); }
      )
      .subscribe();

    const practiceChannel = supabase
      .channel(`mastery-rings-practice-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'practice_attempts',
          filter: `student_id=eq.${user.id}`,
        },
        () => { fetchMastery(); }
      )
      .subscribe();

    const masteryChannel = supabase
      .channel(`mastery-rings-topic-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'topic_mastery',
          filter: `student_id=eq.${user.id}`,
        },
        () => { fetchMastery(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(examChannel);
      supabase.removeChannel(practiceChannel);
      supabase.removeChannel(masteryChannel);
    };
  }, [user?.id, fetchMastery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[180px]">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!subjects.length) {
    return (
      <div className="flex items-center justify-center h-[180px] text-sm text-muted-foreground">
        No data yet — complete practice or exams to see mastery!
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {subjects.map((s) => (
        <RingCard key={s.key} subject={s} />
      ))}
    </div>
  );
}