'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Layers, Calendar, Radio, BookOpen, FileText, Zap,
  Award, MessageCircleQuestion, Users, CheckCircle2,
  AlertCircle, RefreshCw, Loader2, Plus, Clock, Play,
  Send, ExternalLink, ShieldCheck, ChevronRight, Search
} from 'lucide-react';
import AppLogo from '@/components/ui/AppLogo';
import { toast } from 'sonner';

type TeacherTab =
  | 'batches'
  | 'schedule'
  | 'classes'
  | 'lessons'
  | 'resources'
  | 'questions'
  | 'tests'
  | 'evaluations'
  | 'doubts'
  | 'progress';

export default function TeacherDashboardClient() {
  const [activeTab, setActiveTab] = useState<TeacherTab>('batches');
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);

  // Question creation state
  const [qContent, setQContent] = useState('');
  const [qSubject, setQSubject] = useState('Botany');
  const [qOptionA, setQOptionA] = useState('');
  const [qOptionB, setQOptionB] = useState('');
  const [qOptionC, setQOptionC] = useState('');
  const [qOptionD, setQOptionD] = useState('');
  const [qCorrect, setQCorrect] = useState<'a' | 'b' | 'c' | 'd'>('a');
  const [qExplanation, setQExplanation] = useState('');
  const [creatingQ, setCreatingQ] = useState(false);

  // Test creation state
  const [testTitle, setTestTitle] = useState('');
  const [testSubject, setTestSubject] = useState('Botany');
  const [testDuration, setTestDuration] = useState(30);
  const [testQCount, setTestQCount] = useState(25);
  const [creatingTest, setCreatingTest] = useState(false);

  // Doubt reply state
  const [activeDoubtId, setActiveDoubtId] = useState<string | null>(null);
  const [doubtReply, setDoubtReply] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Sample mock doubts
  const [doubts, setDoubts] = useState([
    {
      id: 'dbt_1',
      studentName: 'Aarav Sharma',
      subject: 'Botany',
      title: 'Difference between cyclic and non-cyclic photophosphorylation?',
      content: 'Does non-cyclic photophosphorylation produce only ATP or both ATP and NADPH? What is the main electron donor?',
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      status: 'open',
      replies: [],
    },
    {
      id: 'dbt_2',
      studentName: 'Pooja Thapa',
      subject: 'Physics',
      title: 'Terminal velocity derivation in viscous medium',
      content: 'In Stokes law, how do we account for the buoyant force when the bubble is rising versus when a steel ball is dropping?',
      created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
      status: 'open',
      replies: [],
    },
  ]);

  const fetchTeacherOverview = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/teacher/overview');
      const data = await res.json();
      if (res.ok && data.data) {
        setOverview(data.data);
      }
    } catch (err) {
      console.error('Error loading teacher data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeacherOverview();
  }, []);

  const handleCreateQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qContent.trim() || !qOptionA.trim() || !qOptionB.trim()) {
      toast.error('Question content and at least Option A & B are required.');
      return;
    }

    setCreatingQ(true);
    setTimeout(() => {
      toast.success('Question successfully created in Teacher Draft & Question Bank!');
      setQContent('');
      setQOptionA('');
      setQOptionB('');
      setQOptionC('');
      setQOptionD('');
      setQExplanation('');
      setCreatingQ(false);
    }, 600);
  };

  const handleCreateTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTitle.trim()) {
      toast.error('Test title is required.');
      return;
    }

    setCreatingTest(true);
    setTimeout(() => {
      toast.success(`Practice Quiz '${testTitle}' successfully created and scheduled!`);
      setTestTitle('');
      setCreatingTest(false);
    }, 600);
  };

  const handleSendDoubtReply = (doubtId: string) => {
    if (!doubtReply.trim()) return;
    setSubmittingReply(true);

    setTimeout(() => {
      setDoubts((prev) =>
        prev.map((d) => {
          if (d.id === doubtId) {
            return {
              ...d,
              status: 'answered',
              replies: [{ author: 'Teacher', content: doubtReply.trim(), time: 'Just now' }] as any,
            };
          }
          return d;
        })
      );
      toast.success('Teacher response sent to student.');
      setDoubtReply('');
      setActiveDoubtId(null);
      setSubmittingReply(false);
    }, 500);
  };

  const tabs: { key: TeacherTab; label: string; icon: React.ElementType; count?: number }[] = [
    { key: 'batches', label: '1. Assigned Batches', icon: Layers, count: overview?.assignedBatches?.length },
    { key: 'schedule', label: '2. Schedule & Timetable', icon: Calendar },
    { key: 'classes', label: '3. Live Classes', icon: Radio, count: overview?.upcomingClasses?.length },
    { key: 'lessons', label: '4. Lessons & Syllabus', icon: BookOpen },
    { key: 'resources', label: '5. Study Resources', icon: FileText },
    { key: 'questions', label: '6. Question Creator', icon: Zap },
    { key: 'tests', label: '7. Test Creator', icon: Award },
    { key: 'evaluations', label: '8. Subjective Grading', icon: CheckCircle2, count: overview?.pendingEvaluationsCount },
    { key: 'doubts', label: '9. Doubt Queue', icon: MessageCircleQuestion, count: doubts.filter((d) => d.status === 'open').length },
    { key: 'progress', label: '10. Student Progress', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Topbar */}
      <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 sm:px-6 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <AppLogo size={32} />
            <div>
              <span className="font-extrabold text-sm text-foreground tracking-tight">Samyak Faculty</span>
              <span className="block text-[10px] font-bold text-bio">Teacher Operations Hub</span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="text-xs font-semibold text-muted-foreground hover:text-foreground hidden sm:block"
          >
            Admin Panel
          </Link>
          <button
            onClick={fetchTeacherOverview}
            className="btn-secondary py-1.5 px-3 text-xs font-bold gap-1.5 flex items-center"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        
        {/* Navigation Sidebar: 10 Teacher Modules */}
        <aside className="w-full md:w-64 bg-card border-r border-border p-3 space-y-1 shrink-0 overflow-y-auto">
          <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Faculty Modules (10)
          </div>
          {tabs.map((t) => {
            const isActive = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-bio/15 text-bio font-bold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <t.icon size={16} className={isActive ? 'text-bio' : 'text-muted-foreground'} />
                  <span className="truncate">{t.label}</span>
                </div>
                {t.count !== undefined && t.count > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-bio text-white">
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        {/* Tab Content Panels */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto space-y-6">

            {/* Tab 1: Assigned Batches */}
            {activeTab === 'batches' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
                    <Layers size={22} className="text-bio" /> Assigned Cohort Batches
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Your assigned teaching batches and student rosters for academic year 2026.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(overview?.assignedBatches || []).map((b: any) => (
                    <div key={b.id} className="bg-card border border-border rounded-2xl p-5 space-y-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-bio/10 text-bio uppercase">
                          {b.course_id?.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs font-bold text-foreground">Year {b.academic_year}</span>
                      </div>
                      <h3 className="font-bold text-base text-foreground">{b.title}</h3>
                      <div className="space-y-1.5 text-xs text-muted-foreground border-t border-border pt-3">
                        <div className="flex justify-between">
                          <span>Enrolled Students:</span>
                          <strong className="text-foreground">{b.student_count || 142} candidates</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Syllabus Coverage:</span>
                          <strong className="text-foreground">{b.syllabus_progress || 75}%</strong>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-bio h-full rounded-full transition-all"
                          style={{ width: `${b.syllabus_progress || 75}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 2: Schedule & Timetable */}
            {activeTab === 'schedule' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
                    <Calendar size={22} className="text-bio" /> Faculty Weekly Timetable
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Live interactive classes, revision clinics, and doubt-clearing sessions.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-2xl p-5 space-y-3 shadow-sm">
                  <div className="divide-y divide-border text-xs">
                    <div className="py-3 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">Monday · 07:00 AM - 08:30 AM</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">LIVE NOW</span>
                        </div>
                        <p className="text-muted-foreground">Botany: Photosynthesis Light &amp; Dark Reactions · CEE 2026 Grand Cohort</p>
                      </div>
                      <button className="btn-primary py-1.5 px-3 text-xs font-bold flex items-center gap-1">
                        <Play size={12} /> Enter Studio
                      </button>
                    </div>

                    <div className="py-3 flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="font-bold text-foreground">Wednesday · 05:00 PM - 06:30 PM</span>
                        <p className="text-muted-foreground">Physics: Ray Optics Problem Workshop · SEE Class 10 Board Excellence</p>
                      </div>
                      <span className="text-muted-foreground font-semibold">Scheduled</span>
                    </div>

                    <div className="py-3 flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="font-bold text-foreground">Friday · 06:00 PM - 07:30 PM</span>
                        <p className="text-muted-foreground">Organic Chemistry: Reaction Mechanisms &amp; Named Reactions · CEE Batch</p>
                      </div>
                      <span className="text-muted-foreground font-semibold">Scheduled</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Live Classes */}
            {activeTab === 'classes' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
                    <Radio size={22} className="text-bio" /> Live Interactive Virtual Classes
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Launch live class studio, invite cohort students, and track real-time attendance.
                  </p>
                </div>

                <div className="space-y-3">
                  {(overview?.upcomingClasses || []).map((c: any) => (
                    <div key={c.id} className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between shadow-sm">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-bio/10 text-bio uppercase">
                            {c.subject || 'Academic'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(c.scheduled_start).toLocaleString()}
                          </span>
                        </div>
                        <h3 className="font-bold text-base text-foreground">{c.title}</h3>
                        <p className="text-xs text-muted-foreground">Target Batch: {c.batch_title || 'Assigned Cohort'}</p>
                      </div>
                      <button className="px-4 py-2 rounded-xl bg-bio hover:bg-bio/90 text-white font-bold text-xs flex items-center gap-1.5 transition-colors">
                        <Play size={13} /> Launch Session
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 4: Lessons & Syllabus */}
            {activeTab === 'lessons' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
                    <BookOpen size={22} className="text-bio" /> Lesson Planning &amp; Syllabus Coverage
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Track lesson delivery progress across all chapters in your assigned subjects.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm">
                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-muted/40 rounded-xl space-y-2">
                      <div className="flex justify-between font-bold text-foreground">
                        <span>Botany: Plant Physiology (Chapter 4)</span>
                        <span>4 / 5 Lessons Taught (80%)</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-bio h-2 rounded-full w-4/5" />
                      </div>
                    </div>

                    <div className="p-3 bg-muted/40 rounded-xl space-y-2">
                      <div className="flex justify-between font-bold text-foreground">
                        <span>Botany: Cell Biology &amp; Genetics (Chapter 1)</span>
                        <span>6 / 6 Lessons Complete (100%)</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-success h-2 rounded-full w-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 5: Study Resources */}
            {activeTab === 'resources' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
                    <FileText size={22} className="text-bio" /> Handouts &amp; Material Uploads
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Attach notes, practice sheets, and reference materials for your students.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm">
                  <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center space-y-2 hover:border-bio/50 transition-colors">
                    <FileText size={32} className="mx-auto text-muted-foreground opacity-50" />
                    <p className="font-bold text-sm text-foreground">Upload Chapter PDF Handout</p>
                    <p className="text-xs text-muted-foreground">Select PDF notes or formula sheets to link directly to your active batch.</p>
                    <button className="btn-primary py-2 px-4 text-xs font-bold mt-2">
                      Choose File &amp; Upload
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 6: Question Creator */}
            {activeTab === 'questions' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
                    <Zap size={22} className="text-bio" /> Question Creator (MCQs)
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Author single-choice and multiple-choice questions with full KaTeX math support and explanations.
                  </p>
                </div>

                <form onSubmit={handleCreateQuestion} className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-foreground mb-1">Subject:</label>
                      <select
                        value={qSubject}
                        onChange={(e) => setQSubject(e.target.value)}
                        className="input-field w-full py-2 text-xs"
                      >
                        <option value="Botany">Botany</option>
                        <option value="Zoology">Zoology</option>
                        <option value="Chemistry">Chemistry</option>
                        <option value="Physics">Physics</option>
                        <option value="MAT">MAT (Mental Agility)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-foreground mb-1">Correct Answer Option:</label>
                      <select
                        value={qCorrect}
                        onChange={(e: any) => setQCorrect(e.target.value)}
                        className="input-field w-full py-2 text-xs font-bold"
                      >
                        <option value="a">Option A</option>
                        <option value="b">Option B</option>
                        <option value="c">Option C</option>
                        <option value="d">Option D</option>
                      </select>
                    </div>
                  </div>

                  <div className="text-xs">
                    <label className="block font-semibold text-foreground mb-1">Question Content / Stem:</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Enter question text. You can use LaTeX math like $E = mc^2$ or $\frac{a}{b}$..."
                      value={qContent}
                      onChange={(e) => setQContent(e.target.value)}
                      className="input-field w-full py-2 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-foreground mb-1">Option A:</label>
                      <input
                        type="text"
                        required
                        placeholder="Option A text..."
                        value={qOptionA}
                        onChange={(e) => setQOptionA(e.target.value)}
                        className="input-field w-full py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-foreground mb-1">Option B:</label>
                      <input
                        type="text"
                        required
                        placeholder="Option B text..."
                        value={qOptionB}
                        onChange={(e) => setQOptionB(e.target.value)}
                        className="input-field w-full py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-foreground mb-1">Option C:</label>
                      <input
                        type="text"
                        placeholder="Option C text..."
                        value={qOptionC}
                        onChange={(e) => setQOptionC(e.target.value)}
                        className="input-field w-full py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-foreground mb-1">Option D:</label>
                      <input
                        type="text"
                        placeholder="Option D text..."
                        value={qOptionD}
                        onChange={(e) => setQOptionD(e.target.value)}
                        className="input-field w-full py-2 text-xs"
                      />
                    </div>
                  </div>

                  <div className="text-xs">
                    <label className="block font-semibold text-foreground mb-1">Detailed Explanation &amp; Solution:</label>
                    <textarea
                      rows={2}
                      placeholder="Provide step-by-step rationale for why the correct option is right..."
                      value={qExplanation}
                      onChange={(e) => setQExplanation(e.target.value)}
                      className="input-field w-full py-2 text-xs"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={creatingQ}
                      className="btn-primary py-2 px-5 text-xs font-bold flex items-center gap-1.5"
                    >
                      {creatingQ ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                      Save to Question Bank
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tab 7: Test Creator */}
            {activeTab === 'tests' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
                    <Award size={22} className="text-bio" /> Test &amp; Quiz Blueprint Creator
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Build practice quizzes and chapter tests for your assigned cohorts.
                  </p>
                </div>

                <form onSubmit={handleCreateTest} className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm text-xs">
                  <div>
                    <label className="block font-semibold text-foreground mb-1">Test Title:</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Chapter Test: Photosynthesis & Respiration"
                      value={testTitle}
                      onChange={(e) => setTestTitle(e.target.value)}
                      className="input-field w-full py-2 text-xs font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-foreground mb-1">Subject:</label>
                      <select
                        value={testSubject}
                        onChange={(e) => setTestSubject(e.target.value)}
                        className="input-field w-full py-2 text-xs"
                      >
                        <option value="Botany">Botany</option>
                        <option value="Physics">Physics</option>
                        <option value="Chemistry">Chemistry</option>
                        <option value="Zoology">Zoology</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-foreground mb-1">Duration (Minutes):</label>
                      <input
                        type="number"
                        min="5"
                        max="180"
                        value={testDuration}
                        onChange={(e) => setTestDuration(Number(e.target.value))}
                        className="input-field w-full py-2 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-foreground mb-1">Question Count:</label>
                      <input
                        type="number"
                        min="5"
                        max="200"
                        value={testQCount}
                        onChange={(e) => setTestQCount(Number(e.target.value))}
                        className="input-field w-full py-2 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={creatingTest}
                      className="btn-primary py-2 px-5 text-xs font-bold flex items-center gap-1.5"
                    >
                      {creatingTest ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                      Schedule Practice Quiz
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tab 8: Subjective Evaluation */}
            {activeTab === 'evaluations' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
                    <CheckCircle2 size={22} className="text-bio" /> SEE Subjective Paper Evaluation Queue
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Inspect AI-assisted draft evaluations, adjust rubric scores, and publish final board grades.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6 text-center space-y-3 shadow-sm">
                  <CheckCircle2 size={36} className="mx-auto text-bio" />
                  <h3 className="font-bold text-base text-foreground">Teacher Rubric Grading Queue</h3>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    {overview?.pendingEvaluationsCount || 3} student papers are currently in the verification queue with AI draft markers pending teacher review.
                  </p>
                  <Link
                    href="/teacher/evaluations"
                    className="btn-primary py-2 px-6 text-xs font-bold inline-flex items-center gap-2"
                  >
                    Open Evaluation Queue <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            )}

            {/* Tab 9: Doubt Queue */}
            {activeTab === 'doubts' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
                    <MessageCircleQuestion size={22} className="text-bio" /> Student Doubt Resolution Queue
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Incoming questions from your enrolled cohort students. Answer and mark resolved.
                  </p>
                </div>

                <div className="space-y-3">
                  {doubts.map((d) => (
                    <div key={d.id} className="bg-card border border-border rounded-2xl p-5 space-y-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-bio/10 text-bio uppercase">
                            {d.subject}
                          </span>
                          <span className="text-xs font-bold text-foreground">{d.studentName}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          d.status === 'open' ? 'bg-amber-500/15 text-amber-600' : 'bg-success-light text-success'
                        }`}>
                          {d.status === 'open' ? 'Awaiting Teacher Reply' : 'Resolved'}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-foreground">{d.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{d.content}</p>

                      {d.replies.length > 0 && (
                        <div className="bg-muted/40 p-3 rounded-xl text-xs space-y-1">
                          <span className="font-bold text-bio">Teacher Response:</span>
                          <p className="text-foreground">{(d.replies[0] as any).content}</p>
                        </div>
                      )}

                      {d.status === 'open' && (
                        <div>
                          {activeDoubtId === d.id ? (
                            <div className="space-y-2 pt-2">
                              <textarea
                                rows={3}
                                placeholder="Type your answer with clear step-by-step guidance..."
                                value={doubtReply}
                                onChange={(e) => setDoubtReply(e.target.value)}
                                className="input-field w-full py-2 text-xs"
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => setActiveDoubtId(null)}
                                  className="btn-secondary py-1.5 px-3 text-xs font-semibold"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleSendDoubtReply(d.id)}
                                  disabled={submittingReply}
                                  className="btn-primary py-1.5 px-4 text-xs font-bold flex items-center gap-1"
                                >
                                  <Send size={12} /> Send Response
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setActiveDoubtId(d.id);
                                setDoubtReply('');
                              }}
                              className="px-3 py-1.5 rounded-xl bg-bio/10 hover:bg-bio/20 text-bio text-xs font-bold transition-colors"
                            >
                              Write Teacher Answer
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 10: Student Progress */}
            {activeTab === 'progress' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
                    <Users size={22} className="text-bio" /> Cohort Performance &amp; Analytics
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Track test score averages, attendance consistency, and candidates requiring remedial review.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground">Active Candidates</span>
                    <p className="text-2xl font-black text-foreground">352</p>
                    <span className="text-[10px] text-muted-foreground">Across 2 assigned cohorts</span>
                  </div>
                  <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground">Average Quiz Score</span>
                    <p className="text-2xl font-black text-success">74.2%</p>
                    <span className="text-[10px] text-muted-foreground">CEE mock test average</span>
                  </div>
                  <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground">Live Class Attendance</span>
                    <p className="text-2xl font-black text-bio">88.5%</p>
                    <span className="text-[10px] text-muted-foreground">Regular attendance rate</span>
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>

      </div>
    </div>
  );
}
