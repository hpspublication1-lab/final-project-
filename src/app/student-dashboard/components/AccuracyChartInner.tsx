'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine
} from 'recharts';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ChartPoint {
  day: string;
  bio: number | null;
  chem: number | null;
  physics: number | null;
  ma: number | null;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ color: string; name: string; value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  const subjectNames: Record<string, string> = { bio: 'Biology', chem: 'Chemistry', physics: 'Physics', ma: 'Mental Agility' };
  return (
    <div className="bg-card border border-border rounded-xl shadow-card-hover px-4 py-3 min-w-[160px]">
      <p className="text-xs font-semibold text-muted-foreground mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={`tt-${entry.name}`} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-xs text-foreground">{subjectNames[entry.name] || entry.name}</span>
          </div>
          <span className="text-xs font-bold text-foreground tabular-nums">{entry.value}%</span>
        </div>
      ))}
    </div>
  );
}

export default function AccuracyChartInner() {
  const { user } = useAuth();
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccuracyTrend = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('practice_attempts')
        .select('is_correct, created_at, subject_id, subjects(name)')
        .eq('student_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      if (error || !data?.length) {
        setChartData([]);
        return;
      }

      const subjectKeyMap: Record<string, string> = {
        biology: 'bio',
        chemistry: 'chem',
        physics: 'physics',
        mental_agility: 'ma',
      };

      const dateMap: Record<string, Record<string, { correct: number; total: number }>> = {};

      data.forEach((row: any) => {
        const date = new Date(row.created_at);
        const dayOfMonth = date.getDate();
        const bucket = Math.floor(dayOfMonth / 2) * 2;
        const bucketDate = new Date(date.getFullYear(), date.getMonth(), bucket || 1);
        const dateKey = bucketDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        const subjectName = row.subjects?.name as string;
        const subjectKey = subjectKeyMap[subjectName];
        if (!subjectKey) return;

        if (!dateMap[dateKey]) dateMap[dateKey] = {};
        if (!dateMap[dateKey][subjectKey]) dateMap[dateKey][subjectKey] = { correct: 0, total: 0 };

        dateMap[dateKey][subjectKey].total += 1;
        if (row.is_correct) dateMap[dateKey][subjectKey].correct += 1;
      });

      const points: ChartPoint[] = Object.entries(dateMap).map(([day, subjects]) => ({
        day,
        bio: subjects.bio ? Math.round((subjects.bio.correct / subjects.bio.total) * 100) : null,
        chem: subjects.chem ? Math.round((subjects.chem.correct / subjects.chem.total) * 100) : null,
        physics: subjects.physics ? Math.round((subjects.physics.correct / subjects.physics.total) * 100) : null,
        ma: subjects.ma ? Math.round((subjects.ma.correct / subjects.ma.total) * 100) : null,
      }));

      setChartData(points);
    } catch {
      setChartData([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    fetchAccuracyTrend();
  }, [fetchAccuracyTrend, user?.id]);

  // Realtime: re-fetch when new practice_attempts or exam_attempts are inserted for this user
  useEffect(() => {
    if (!user?.id) return;
    const supabase = createClient();

    const practiceChannel = supabase
      .channel(`accuracy-trend-practice-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'practice_attempts',
          filter: `student_id=eq.${user.id}`,
        },
        () => { fetchAccuracyTrend(); }
      )
      .subscribe();

    const examChannel = supabase
      .channel(`accuracy-trend-exam-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'exam_attempts',
          filter: `student_id=eq.${user.id}`,
        },
        () => { fetchAccuracyTrend(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(practiceChannel);
      supabase.removeChannel(examChannel);
    };
  }, [user?.id, fetchAccuracyTrend]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[220px]">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">
        No practice data yet — start practicing to see your trend!
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          interval={2}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={75} stroke="var(--border)" strokeDasharray="4 4" label={{ value: 'Target 75%', fill: 'var(--muted-foreground)', fontSize: 10, position: 'insideTopRight' }} />
        <Line type="monotone" dataKey="bio" stroke="var(--bio)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} connectNulls />
        <Line type="monotone" dataKey="chem" stroke="var(--chem)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} connectNulls />
        <Line type="monotone" dataKey="physics" stroke="var(--physics)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} connectNulls />
        <Line type="monotone" dataKey="ma" stroke="var(--ma)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  );
}