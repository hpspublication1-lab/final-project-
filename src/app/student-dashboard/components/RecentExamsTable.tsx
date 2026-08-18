'use client';

import React, { useState, useEffect } from 'react';
import { FileText, TrendingUp, TrendingDown, Eye, BarChart2, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ExamRow {
  id: string;
  name: string;
  type: string;
  date: string;
  score: number;
  total: number;
  pct: number;
  percentile: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  accuracy: number;
  timeTaken: string;
  trend: 'up' | 'down';
}

const typeColors: Record<string, string> = {
  'Full Mock': 'bg-secondary text-primary',
  'Chapter Test': 'bg-bio-light text-bio',
  'Unit Test': 'bg-chem-light text-chem',
  'Subject Test': 'bg-physics-light text-physics',
  'Practice': 'bg-ma-light text-ma',
};

function formatTimeTaken(seconds: number | null): string {
  if (!seconds) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

type SortKey = 'date' | 'pct' | 'percentile' | 'accuracy';

export default function RecentExamsTable() {
  const { user } = useAuth();
  const [exams, setExams] = useState<ExamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const perPage = 5;

  useEffect(() => {
    if (!user?.id) return;

    const fetchExams = async () => {
      setLoading(true);
      try {
        const supabase = createClient();

        const { data, error } = await supabase
          .from('exam_attempts')
          .select('id, score, total_marks, correct_answers, incorrect_answers, unattempted, percentage, percentile, time_taken_seconds, completed_at, created_at, exams(title, total_marks, subjects(display_name))')
          .eq('student_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error || !data?.length) {
          setExams([]);
          return;
        }

        const rows: ExamRow[] = data.map((row: any, idx: number) => {
          const prevRow = data[idx + 1];
          const pct = Math.round(Number(row.percentage) || 0);
          const prevPct = prevRow ? Math.round(Number(prevRow.percentage) || 0) : pct;
          const subjectDisplay = row.exams?.subjects?.display_name;
          const examTitle = row.exams?.title || 'Exam';
          const type = subjectDisplay ? `${subjectDisplay} Test` : 'Full Mock';

          return {
            id: row.id,
            name: examTitle,
            type,
            date: new Date(row.completed_at || row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            score: Math.round(Number(row.score) || 0),
            total: row.total_marks || row.exams?.total_marks || 100,
            pct,
            percentile: Math.round(Number(row.percentile) || 0),
            correct: row.correct_answers || 0,
            incorrect: row.incorrect_answers || 0,
            unattempted: row.unattempted || 0,
            accuracy: row.correct_answers && (row.correct_answers + row.incorrect_answers) > 0
              ? Math.round((row.correct_answers / (row.correct_answers + row.incorrect_answers)) * 100)
              : 0,
            timeTaken: formatTimeTaken(row.time_taken_seconds),
            trend: pct >= prevPct ? 'up' : 'down',
          };
        });

        setExams(rows);
      } catch {
        setExams([]);
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, [user?.id]);

  const sorted = [...exams].sort((a, b) => {
    const av = a[sortKey] as number;
    const bv = b[sortKey] as number;
    return sortDir === 'desc' ? bv - av : av - bv;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const paged = sorted.slice((page - 1) * perPage, page * perPage);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
    setPage(1);
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronUp size={13} className="text-border" />;
    return sortDir === 'desc' ? <ChevronDown size={13} className="text-primary" /> : <ChevronUp size={13} className="text-primary" />;
  };

  return (
    <div className="card-base">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-primary" />
          <p className="font-semibold text-foreground">Recent Exam Results</p>
          {!loading && (
            <span className="text-xs bg-secondary text-primary font-bold px-1.5 py-0.5 rounded-full">{exams.length}</span>
          )}
        </div>
        <button className="text-xs text-primary font-medium hover:underline">View all results</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      ) : exams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
          <FileText size={32} className="text-muted-foreground/40" />
          <p className="text-sm font-semibold text-foreground">No exam results yet</p>
          <p className="text-xs text-muted-foreground">Complete a mock test to see your results here.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-border">
                  {[
                    { key: null, label: 'Exam Name' },
                    { key: null, label: 'Type' },
                    { key: 'date', label: 'Date' },
                    { key: 'pct', label: 'Score' },
                    { key: 'percentile', label: 'Percentile' },
                    { key: 'accuracy', label: 'Accuracy' },
                    { key: null, label: 'Actions' },
                  ].map((col, i) => (
                    <th
                      key={`th-${i}`}
                      className={`py-2.5 px-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide ${
                        col.key ? 'cursor-pointer hover:text-foreground select-none' : ''
                      }`}
                      onClick={() => col.key && handleSort(col.key as SortKey)}
                    >
                      <div className="flex items-center gap-1">
                        {col.label}
                        {col.key && <SortIcon col={col.key as SortKey} />}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((exam, i) => (
                  <tr
                    key={exam.id}
                    className={`border-b border-border hover:bg-muted/50 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/20'}`}
                  >
                    <td className="py-3 px-2">
                      <p className="text-sm font-semibold text-foreground truncate max-w-[200px]">{exam.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {exam.correct}✓ {exam.incorrect}✗ {exam.unattempted}—
                      </p>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeColors[exam.type] || 'bg-muted text-muted-foreground'}`}>
                        {exam.type}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <p className="text-sm text-foreground">{exam.date}</p>
                      <p className="text-xs text-muted-foreground">{exam.timeTaken}</p>
                    </td>
                    <td className="py-3 px-2">
                      <p className="text-sm font-bold text-foreground tabular-nums">
                        {exam.score}/{exam.total}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${exam.pct >= 70 ? 'bg-success' : exam.pct >= 50 ? 'bg-ma' : 'bg-error'}`}
                            style={{ width: `${exam.pct}%` }}
                          />
                        </div>
                        <span className={`text-xs font-semibold tabular-nums ${exam.pct >= 70 ? 'text-success' : exam.pct >= 50 ? 'text-ma' : 'text-error'}`}>
                          {exam.pct}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-1">
                        {exam.trend === 'up' ? (
                          <TrendingUp size={13} className="text-success" />
                        ) : (
                          <TrendingDown size={13} className="text-error" />
                        )}
                        <span className={`text-sm font-bold tabular-nums ${exam.percentile >= 70 ? 'text-success' : exam.percentile >= 50 ? 'text-ma' : 'text-error'}`}>
                          {exam.percentile}th
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <p className="text-sm font-bold tabular-nums text-foreground">{exam.accuracy}%</p>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-1">
                        <button
                          className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-colors"
                          title="View result details"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-colors"
                          title="View analytics"
                        >
                          <BarChart2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, exams.length)} of {exams.length} results
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={`page-${i + 1}`}
                  onClick={() => setPage(i + 1)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${
                    page === i + 1
                      ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground hover:bg-muted border border-border'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}