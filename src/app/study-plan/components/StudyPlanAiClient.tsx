'use client';

import React, { useState, useEffect } from 'react';
import { useChat } from '@/lib/hooks/useChat';
import DashboardLayout from '@/components/DashboardLayout';
import { ClipboardList, Loader2, BookOpen, FlaskConical, Atom, Brain, Calendar, CheckSquare, Square, Sparkles, FileText, ChevronDown, ChevronUp, TrendingDown, Target } from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Icon from '@/components/ui/AppIcon';


interface StudyTask {
  day: string;
  subject: string;
  topic: string;
  duration: string;
  type: 'Revision' | 'Practice' | 'Mock Test' | 'Weak Topic';
  done: boolean;
}

interface RevisionSummary {
  chapter: string;
  subject: string;
  keyPoints: string[];
  memoryTricks: string[];
  formulae?: string[];
}

interface StudyPlan {
  weeklyGoal: string;
  tasks: StudyTask[];
  tips: string[];
}

interface LivePerformanceData {
  weakTopics: { topic: string; subject: string; accuracy: number }[];
  subjectAccuracy: Record<string, number>;
  totalAttempts: number;
  recentExamScore?: number;
}

const SUBJECTS = ['Biology', 'Chemistry', 'Physics', 'Mental Agility'];
const SUBJECT_ICONS: Record<string, React.ElementType> = {
  Biology: BookOpen,
  Chemistry: FlaskConical,
  Physics: Atom,
  'Mental Agility': Brain,
};
const SUBJECT_COLORS: Record<string, string> = {
  Biology: 'text-bio',
  Chemistry: 'text-chem',
  Physics: 'text-physics',
  'Mental Agility': 'text-ma',
};
const SUBJECT_BG: Record<string, string> = {
  Biology: 'bg-bio-light',
  Chemistry: 'bg-chem-light',
  Physics: 'bg-physics-light',
  'Mental Agility': 'bg-ma-light',
};

const CHAPTERS: Record<string, string[]> = {
  Biology: ['Cell Biology', 'Genetics', 'Evolution', 'Ecology', 'Human Physiology', 'Plant Physiology'],
  Chemistry: ['Atomic Structure', 'Chemical Bonding', 'Thermodynamics', 'Organic Chemistry', 'Equilibrium', 'Electrochemistry'],
  Physics: ['Mechanics', 'Thermodynamics', 'Waves & Optics', 'Electrostatics', 'Magnetism', 'Modern Physics'],
  'Mental Agility': ['Number Series', 'Logical Reasoning', 'Blood Relations', 'Coding-Decoding', 'Analogies', 'Data Interpretation'],
};

function parsePlan(raw: string): StudyPlan | null {
  try {
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
  } catch {}
  return null;
}

function parseSummary(raw: string): RevisionSummary | null {
  try {
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
  } catch {}
  return null;
}

const TASK_TYPE_COLORS: Record<string, string> = {
  Revision: 'bg-secondary text-primary',
  Practice: 'bg-bio-light text-bio',
  'Mock Test': 'bg-error-light text-error',
  'Weak Topic': 'bg-ma-light text-ma',
};

const subjectNameMap: Record<string, string> = {
  biology: 'Biology',
  chemistry: 'Chemistry',
  physics: 'Physics',
  mental_agility: 'Mental Agility',
};

export default function StudyPlanAiClient() {
  const { user } = useAuth();
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);
  const [activeTab, setActiveTab] = useState<'plan' | 'summary'>('plan');

  // Live performance data
  const [liveData, setLiveData] = useState<LivePerformanceData | null>(null);
  const [liveLoading, setLiveLoading] = useState(false);

  // Study plan state
  const [daysToExam, setDaysToExam] = useState(60);
  const [hoursPerDay, setHoursPerDay] = useState(6);
  const [weakSubjects, setWeakSubjects] = useState<string[]>(['Chemistry']);
  const [strongSubjects, setStrongSubjects] = useState<string[]>(['Biology']);
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [planGenerated, setPlanGenerated] = useState(false);

  // Summary state
  const [summarySubject, setSummarySubject] = useState('Biology');
  const [summaryChapter, setSummaryChapter] = useState('Cell Biology');
  const [summary, setSummary] = useState<RevisionSummary | null>(null);
  const [summaryGenerated, setSummaryGenerated] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['keyPoints']));

  const { response: planResponse, isLoading: planLoading, error: planError, sendMessage: sendPlan } = useChat('OPEN_AI', 'gpt-4o', false);
  const { response: summaryResponse, isLoading: summaryLoading, error: summaryError, sendMessage: sendSummary } = useChat('OPEN_AI', 'gpt-4o', false);

  useEffect(() => { if (planError) toast.error(planError.message); }, [planError]);
  useEffect(() => { if (summaryError) toast.error(summaryError.message); }, [summaryError]);

  useEffect(() => {
    try {
      const savedPlan = localStorage.getItem('samyak-study-plan');
      const savedTasks = localStorage.getItem('samyak-study-tasks');
      if (savedPlan) setStudyPlan(JSON.parse(savedPlan));
      if (savedTasks) setTasks(JSON.parse(savedTasks));
    } catch {}
  }, []);

  // Fetch live performance data from Supabase
  useEffect(() => {
    if (!user?.id) return;
    const fetchLiveData = async () => {
      setLiveLoading(true);
      try {
        const supabase = createClient();

        // Fetch weak topics from topic_mastery
        const { data: masteryData } = await supabase
          .from('topic_mastery')
          .select('mastery_level, accuracy, chapters(title, subjects(name, display_name))')
          .eq('student_id', user.id)
          .in('mastery_level', ['critical', 'weak', 'developing'])
          .order('accuracy', { ascending: true })
          .limit(8);

        // Fetch subject-level accuracy from practice_attempts (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const { data: practiceData } = await supabase
          .from('practice_attempts')
          .select('is_correct, subjects(name)')
          .eq('student_id', user.id)
          .gte('created_at', thirtyDaysAgo.toISOString());

        // Fetch most recent exam score
        const { data: examData } = await supabase
          .from('exam_attempts')
          .select('percentage')
          .eq('student_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);

        // Process weak topics
        const weakTopics = (masteryData || []).map((row: any) => ({
          topic: row.chapters?.title || 'Unknown',
          subject: row.chapters?.subjects?.display_name || row.chapters?.subjects?.name || 'Unknown',
          accuracy: Math.round(Number(row.accuracy)),
        }));

        // Process subject accuracy
        const subjectAccuracy: Record<string, { correct: number; total: number }> = {};
        (practiceData || []).forEach((row: any) => {
          const subjectName = row.subjects?.name as string;
          if (!subjectName) return;
          const displayName = subjectNameMap[subjectName] || subjectName;
          if (!subjectAccuracy[displayName]) subjectAccuracy[displayName] = { correct: 0, total: 0 };
          subjectAccuracy[displayName].total++;
          if (row.is_correct) subjectAccuracy[displayName].correct++;
        });

        const subjectAccuracyPct: Record<string, number> = {};
        Object.entries(subjectAccuracy).forEach(([subj, val]) => {
          const { correct, total } = val;
          subjectAccuracyPct[subj] = total > 0 ? Math.round((correct / total) * 100) : 0;
        });

        // Auto-detect weak/strong subjects from live data
        if (Object.keys(subjectAccuracyPct).length > 0) {
          const sorted = Object.entries(subjectAccuracyPct).sort((a, b) => a[1] - b[1]);
          const autoWeak = sorted.slice(0, 2).map(([s]) => s);
          const autoStrong = sorted.slice(-2).map(([s]) => s);
          setWeakSubjects(autoWeak);
          setStrongSubjects(autoStrong.filter(s => !autoWeak.includes(s)));
        }

        setLiveData({
          weakTopics,
          subjectAccuracy: subjectAccuracyPct,
          totalAttempts: (practiceData || []).length,
          recentExamScore: examData?.[0]?.percentage ? Math.round(Number(examData[0].percentage)) : undefined,
        });
      } catch {
        // silently fail, use manual inputs
      } finally {
        setLiveLoading(false);
      }
    };
    fetchLiveData();
  }, [user?.id]);

  useEffect(() => {
    if (planResponse && !planLoading && planGenerated) {
      const parsed = parsePlan(planResponse);
      if (parsed) {
        setStudyPlan(parsed);
        const newTasks = parsed.tasks?.map((t) => ({ ...t, done: false })) || [];
        setTasks(newTasks);
        localStorage.setItem('samyak-study-plan', JSON.stringify(parsed));
        localStorage.setItem('samyak-study-tasks', JSON.stringify(newTasks));
      } else {
        toast.error('Could not parse study plan. Please try again.');
      }
    }
  }, [planResponse, planLoading]);

  useEffect(() => {
    if (summaryResponse && !summaryLoading && summaryGenerated) {
      const parsed = parseSummary(summaryResponse);
      if (parsed) setSummary(parsed);
      else toast.error('Could not parse summary. Please try again.');
    }
  }, [summaryResponse, summaryLoading]);

  const toggleSubjectWeak = (s: string) => {
    setWeakSubjects((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
    setStrongSubjects((prev) => prev.filter((x) => x !== s));
  };
  const toggleSubjectStrong = (s: string) => {
    setStrongSubjects((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
    setWeakSubjects((prev) => prev.filter((x) => x !== s));
  };

  const handleGeneratePlan = () => {
    setPlanGenerated(true);
    setStudyPlan(null);
    setTasks([]);

    // Build live data context for the prompt
    let liveDataContext = '';
    if (liveData && (liveData.weakTopics.length > 0 || Object.keys(liveData.subjectAccuracy).length > 0)) {
      liveDataContext = `\n\nLIVE PERFORMANCE DATA (from actual practice history):`;
      if (Object.keys(liveData.subjectAccuracy).length > 0) {
        liveDataContext += `\nSubject accuracy (last 30 days):`;
        Object.entries(liveData.subjectAccuracy).forEach(([subj, acc]) => {
          liveDataContext += `\n  - ${subj}: ${acc}%`;
        });
      }
      if (liveData.weakTopics.length > 0) {
        liveDataContext += `\nSpecific weak topics (lowest accuracy):`;
        liveData.weakTopics.slice(0, 5).forEach(t => {
          liveDataContext += `\n  - ${t.topic} (${t.subject}): ${t.accuracy}% accuracy`;
        });
      }
      if (liveData.recentExamScore !== undefined) {
        liveDataContext += `\nMost recent mock exam score: ${liveData.recentExamScore}%`;
      }
      if (liveData.totalAttempts > 0) {
        liveDataContext += `\nTotal questions practiced (last 30 days): ${liveData.totalAttempts}`;
      }
      liveDataContext += `\n\nIMPORTANT: Use this live data to personalise the plan. Allocate MORE time to the specific weak topics listed above.`;
    }

    const prompt = `Create a personalised 7-day study plan for a Nepal CEE medical entrance student.

Student Profile:
- Days until exam: ${daysToExam}
- Study hours per day: ${hoursPerDay}
- Weak subjects (self-reported): ${weakSubjects.join(', ') || 'None specified'}
- Strong subjects (self-reported): ${strongSubjects.join(', ') || 'None specified'}${liveDataContext}

Return ONLY valid JSON (no extra text):
{
  "weeklyGoal": "One sentence describing the week's primary goal",
  "tasks": [
    {
      "day": "Monday",
      "subject": "Biology",
      "topic": "Cell Biology — Mitosis",
      "duration": "90 min",
      "type": "Revision"
    }
  ],
  "tips": ["Tip 1", "Tip 2", "Tip 3"]
}

Rules:
- Create 14-21 tasks spread across 7 days (Mon-Sun)
- Prioritise weak subjects with more tasks
- Include at least 1 Mock Test or Practice session
- Include Weak Topic sessions for weak subjects
- Types: "Revision", "Practice", "Mock Test", "Weak Topic"
- Balance all 4 subjects across the week
- If live weak topics are provided, create specific tasks targeting those exact topics`;

    sendPlan([{ role: 'user', content: prompt }], { max_completion_tokens: 2500 });
  };

  const handleGenerateSummary = () => {
    setSummaryGenerated(true);
    setSummary(null);

    const prompt = `Create a comprehensive revision summary for Nepal CEE medical entrance exam.

Subject: ${summarySubject}
Chapter: ${summaryChapter}

Return ONLY valid JSON (no extra text):
{
  "chapter": "${summaryChapter}",
  "subject": "${summarySubject}",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3", "Key point 4", "Key point 5", "Key point 6"],
  "memoryTricks": ["Memory trick 1 with mnemonic", "Memory trick 2", "Memory trick 3"],
  "formulae": ["Formula 1 (if applicable)", "Formula 2"]
}

Rules:
- Key points must be exam-relevant facts, not generic statements
- Memory tricks must include actual mnemonics or visual associations
- Formulae only for Physics/Chemistry (omit for Biology/Mental Agility)
- Focus on CEE past paper patterns`;

    sendSummary([{ role: 'user', content: prompt }], { max_completion_tokens: 1500 });
  };

  const toggleTask = (i: number) => {
    setTasks((prev) => {
      const next = prev.map((t, idx) => idx === i ? { ...t, done: !t.done } : t);
      localStorage.setItem('samyak-study-tasks', JSON.stringify(next));
      return next;
    });
  };

  const toggleSection = (s: string) => {
    setExpandedSections((prev) => {
      const n = new Set(prev);
      n.has(s) ? n.delete(s) : n.add(s);
      return n;
    });
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const completedCount = tasks.filter((t) => t.done).length;

  return (
    <DashboardLayout isDark={isDark} onToggleDark={() => {
      const next = !isDark;
      document.documentElement.classList.toggle('dark', next);
      setIsDark(next);
      localStorage.setItem('theme', next ? 'dark' : 'light');
    }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center">
            <ClipboardList size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground leading-none">Study Plan & Summaries</h1>
            <p className="text-xs text-muted-foreground mt-0.5">AI-generated plans personalised from your live performance data</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('plan')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'plan' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Calendar size={14} />
            Study Plan
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'summary' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <FileText size={14} />
            Chapter Summaries
          </button>
        </div>

        {/* Study Plan Tab */}
        {activeTab === 'plan' && (
          <div className="space-y-5">
            {/* Live Performance Banner */}
            {liveLoading ? (
              <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
                <Loader2 size={16} className="animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading your live performance data…</p>
              </div>
            ) : liveData && (liveData.weakTopics.length > 0 || Object.keys(liveData.subjectAccuracy).length > 0) ? (
              <div className="bg-secondary border border-primary/20 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Target size={15} className="text-primary" />
                  <p className="text-sm font-bold text-primary">Live Performance Data Loaded</p>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">AI will use this</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {Object.keys(liveData.subjectAccuracy).length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Subject Accuracy (30 days)</p>
                      <div className="space-y-1.5">
                        {Object.entries(liveData.subjectAccuracy).map(([subj, acc]) => (
                          <div key={subj} className="flex items-center gap-2">
                            <span className="text-xs text-foreground w-28 truncate">{subj}</span>
                            <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${acc < 50 ? 'bg-error' : acc < 70 ? 'bg-warning' : 'bg-success'}`}
                                style={{ width: `${acc}%` }}
                              />
                            </div>
                            <span className={`text-xs font-bold w-8 text-right ${acc < 50 ? 'text-error' : acc < 70 ? 'text-warning' : 'text-success'}`}>{acc}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {liveData.weakTopics.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Weak Topics to Target</p>
                      <div className="space-y-1">
                        {liveData.weakTopics.slice(0, 4).map((t, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <TrendingDown size={11} className="text-error shrink-0" />
                            <span className="text-xs text-foreground truncate">{t.topic}</span>
                            <span className="text-xs text-error font-bold ml-auto">{t.accuracy}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {liveData.recentExamScore !== undefined && (
                  <p className="text-xs text-muted-foreground mt-2">Last mock exam: <span className="font-semibold text-foreground">{liveData.recentExamScore}%</span></p>
                )}
              </div>
            ) : null}

            {/* Config */}
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <p className="text-sm font-bold text-foreground">Your Profile</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">Days Until Exam</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range" min={7} max={180} value={daysToExam}
                      onChange={(e) => setDaysToExam(Number(e.target.value))}
                      className="flex-1 accent-primary"
                    />
                    <span className="text-sm font-bold text-primary w-12 text-right">{daysToExam}d</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">Hours Per Day</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range" min={2} max={12} value={hoursPerDay}
                      onChange={(e) => setHoursPerDay(Number(e.target.value))}
                      className="flex-1 accent-primary"
                    />
                    <span className="text-sm font-bold text-primary w-12 text-right">{hoursPerDay}h</span>
                  </div>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">
                    Weak Subjects {liveData && Object.keys(liveData.subjectAccuracy).length > 0 && <span className="text-primary">(auto-detected)</span>}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SUBJECTS.map((s) => (
                      <button key={s} onClick={() => toggleSubjectWeak(s)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${weakSubjects.includes(s) ? 'bg-error-light text-error border-error/20' : 'bg-muted text-muted-foreground border-transparent hover:border-border'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">Strong Subjects</label>
                  <div className="flex flex-wrap gap-2">
                    {SUBJECTS.map((s) => (
                      <button key={s} onClick={() => toggleSubjectStrong(s)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${strongSubjects.includes(s) ? 'bg-success-light text-success border-success/20' : 'bg-muted text-muted-foreground border-transparent hover:border-border'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={handleGeneratePlan} disabled={planLoading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                {planLoading ? <><Loader2 size={15} className="animate-spin" />Generating Personalised Plan…</> : <><Sparkles size={15} />{liveData ? 'Generate AI Plan from Live Data' : 'Generate 7-Day Study Plan'}</>}
              </button>
            </div>

            {/* Plan output */}
            {studyPlan && tasks.length > 0 && (
              <div className="space-y-4">
                <div className="bg-secondary border border-primary/20 rounded-2xl p-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-primary">Weekly Goal</p>
                    <p className="text-sm text-foreground mt-0.5">{studyPlan.weeklyGoal}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-black text-primary">{completedCount}/{tasks.length}</p>
                    <p className="text-xs text-muted-foreground">completed</p>
                  </div>
                </div>

                {days.map((day) => {
                  const dayTasks = tasks.filter((t) => t.day?.toLowerCase().trim() === day.toLowerCase());
                  if (!dayTasks.length) return null;
                  return (
                    <div key={day} className="bg-card border border-border rounded-2xl overflow-hidden">
                      <div className="px-4 py-2.5 border-b border-border bg-muted/50">
                        <p className="text-xs font-bold text-foreground uppercase tracking-wide">{day}</p>
                      </div>
                      <div className="divide-y divide-border">
                        {dayTasks.map((task, i) => {
                          const globalIdx = tasks.findIndex((t) => t === task);
                          const Icon = SUBJECT_ICONS[task.subject] || BookOpen;
                          return (
                            <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                              <button onClick={() => toggleTask(globalIdx)} className="shrink-0">
                                {task.done ? <CheckSquare size={16} className="text-success" /> : <Square size={16} className="text-muted-foreground" />}
                              </button>
                              <Icon size={14} className={`shrink-0 ${SUBJECT_COLORS[task.subject]}`} />
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium leading-snug ${task.done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{task.topic}</p>
                                <p className="text-xs text-muted-foreground">{task.subject} · {task.duration}</p>
                              </div>
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${TASK_TYPE_COLORS[task.type]}`}>{task.type}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {studyPlan.tips?.length > 0 && (
                  <div className="bg-card border border-border rounded-2xl p-4">
                    <p className="text-sm font-bold text-foreground mb-2">Study Tips</p>
                    <div className="space-y-1.5">
                      {studyPlan.tips.map((tip, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-primary text-sm mt-0.5">•</span>
                          <p className="text-sm text-foreground">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Chapter Summary Tab */}
        {activeTab === 'summary' && (
          <div className="space-y-5">
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <p className="text-sm font-bold text-foreground">Select Chapter</p>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Subject</p>
                <div className="flex flex-wrap gap-2">
                  {SUBJECTS.map((s) => {
                    const Icon = SUBJECT_ICONS[s];
                    return (
                      <button key={s} onClick={() => { setSummarySubject(s); setSummaryChapter(CHAPTERS[s][0]); setSummary(null); }}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border transition-all ${summarySubject === s ? `${SUBJECT_BG[s]} ${SUBJECT_COLORS[s]} border-current/20` : 'bg-muted text-muted-foreground border-transparent hover:border-border'}`}>
                        <Icon size={13} />{s}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Chapter</p>
                <div className="flex flex-wrap gap-2">
                  {CHAPTERS[summarySubject]?.map((ch) => (
                    <button key={ch} onClick={() => { setSummaryChapter(ch); setSummary(null); }}
                      className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${summaryChapter === ch ? 'bg-secondary text-primary border-primary/20' : 'bg-muted text-muted-foreground border-transparent hover:border-border'}`}>
                      {ch}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={handleGenerateSummary} disabled={summaryLoading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                {summaryLoading ? <><Loader2 size={15} className="animate-spin" />Generating Summary…</> : <><FileText size={15} />Generate Revision Summary</>}
              </button>
            </div>

            {summary && (
              <div className="space-y-3">
                <div className={`flex items-center gap-2 px-4 py-3 rounded-2xl border ${SUBJECT_BG[summary.subject]}`}>
                  {React.createElement(SUBJECT_ICONS[summary.subject] || BookOpen, { size: 16, className: SUBJECT_COLORS[summary.subject] })}
                  <span className={`text-sm font-bold ${SUBJECT_COLORS[summary.subject]}`}>{summary.subject} · {summary.chapter}</span>
                </div>

                {[
                  { key: 'keyPoints', label: 'Key Points', items: summary.keyPoints, icon: '📌' },
                  { key: 'memoryTricks', label: 'Memory Tricks & Mnemonics', items: summary.memoryTricks, icon: '🧠' },
                  ...(summary.formulae?.length ? [{ key: 'formulae', label: 'Important Formulae', items: summary.formulae, icon: '⚗️' }] : []),
                ].map(({ key, label, items, icon }) => (
                  <div key={key} className="bg-card border border-border rounded-2xl overflow-hidden">
                    <button onClick={() => toggleSection(key)} className="w-full flex items-center justify-between px-5 py-3 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-2">
                        <span>{icon}</span>
                        <p className="text-sm font-bold text-foreground">{label}</p>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{items?.length}</span>
                      </div>
                      {expandedSections.has(key) ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
                    </button>
                    {expandedSections.has(key) && (
                      <div className="px-5 pb-4 space-y-2 border-t border-border pt-3">
                        {items?.map((item, i) => (
                          <div key={i} className="flex items-start gap-2.5">
                            <span className="w-5 h-5 rounded-lg bg-muted text-muted-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                            <p className="text-sm text-foreground leading-relaxed">{item}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
