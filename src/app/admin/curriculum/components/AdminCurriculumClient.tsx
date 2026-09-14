'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Layers, BookOpen, Video, FileText, Plus, Save, Trash2, ArrowLeft,
  Calendar, CheckCircle2, AlertCircle, Loader2, Search, Eye, Edit3,
  ToggleLeft, ToggleRight, ArrowUpDown, Clock, Shield, Sparkles, Upload,
  Paperclip, ExternalLink, Download, ChevronUp, ChevronDown, Check, X
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminCurriculumClient() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<'lessons' | 'hierarchy' | 'batches' | 'resources'>('lessons');
  const [loading, setLoading] = useState(true);

  // Core Data
  const [batches, setBatches] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');

  // Modals
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any>(null);

  // New Course Form State
  const [courseForm, setCourseForm] = useState({
    title: '',
    slug: '',
    program_type: 'see',
    description: '',
    price_npr: 4990,
  });

  // New Batch Form State
  const [batchForm, setBatchForm] = useState({
    title: '',
    slug: '',
    description: '',
    program_type: 'cee',
    price_npr: 4990,
    instructor_name: 'Samyak Faculty Team',
    start_date: '',
    end_date: '',
  });

  // Lesson Form State (Video / Live / Text / Quiz)
  const [lessonForm, setLessonForm] = useState({
    title: '',
    subject_id: '',
    chapter_id: '',
    batch_id: '',
    video_url: '',
    duration_sec: 1800,
    is_premium: true,
    is_active: true,
    lesson_type: 'recorded_video',
    scheduled_at: '',
  });

  // Resource Upload / Attachment Form State
  const [resourceForm, setResourceForm] = useState({
    title: '',
    subject_id: '',
    chapter_id: '',
    pdf_url: '',
    content: '',
    is_premium: true,
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login?redirect=/admin/curriculum');
      return;
    }

    async function loadData() {
      try {
        setLoading(true);
        const [batchesRes, subjectsRes, chaptersRes, videosRes, notesRes] = await Promise.all([
          supabase.from('batches').select('*').order('created_at', { ascending: false }),
          supabase.from('subjects').select('*').order('sort_order', { ascending: true }),
          supabase.from('chapters').select('*').order('sort_order', { ascending: true }),
          supabase.from('video_lectures').select('*, subjects(display_name), chapters(title)').order('created_at', { ascending: false }).limit(100),
          supabase.from('notes').select('*, subjects(display_name), chapters(title)').order('created_at', { ascending: false }),
        ]);

        setBatches(batchesRes.data || []);
        setSubjects(subjectsRes.data || []);
        setChapters(chaptersRes.data || []);
        setVideos(videosRes.data || []);
        setResources(notesRes.data || []);
      } catch (err) {
        console.error('Error loading curriculum data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, authLoading, router]);

  // Create Course (Program / Catalog registration)
  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseForm.title.trim() || !courseForm.slug.trim()) {
      toast.error('Title and slug are required');
      return;
    }

    try {
      // Register or update course batch track
      const { data, error } = await supabase.from('batches').insert({
        title: courseForm.title.trim(),
        slug: courseForm.slug.trim().toLowerCase().replace(/\s+/g, '-'),
        description: courseForm.description.trim() || null,
        program_type: courseForm.program_type,
        price_npr: Number(courseForm.price_npr) || 0,
        instructor_name: 'Samyak Academic Board',
        is_active: true,
        is_premium: Number(courseForm.price_npr) > 0,
      }).select().single();

      if (error) throw error;
      toast.success('Course created and added to active catalogue!');
      setBatches((prev) => [data, ...prev]);
      setShowCourseModal(false);
      setCourseForm({ title: '', slug: '', program_type: 'see', description: '', price_npr: 4990 });
    } catch (err: any) {
      toast.error(err.message || 'Could not create course');
    }
  };

  // Create Batch
  const handleSaveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchForm.title.trim() || !batchForm.slug.trim()) {
      toast.error('Title and slug are required');
      return;
    }

    try {
      const { data, error } = await supabase.from('batches').insert({
        title: batchForm.title.trim(),
        slug: batchForm.slug.trim().toLowerCase().replace(/\s+/g, '-'),
        description: batchForm.description.trim() || null,
        program_type: batchForm.program_type,
        price_npr: Number(batchForm.price_npr) || 0,
        instructor_name: batchForm.instructor_name.trim() || 'Samyak Faculty Team',
        start_date: batchForm.start_date || null,
        end_date: batchForm.end_date || null,
        is_active: true,
        is_premium: Number(batchForm.price_npr) > 0,
      }).select().single();

      if (error) throw error;
      toast.success('Batch cohort created successfully!');
      setBatches((prev) => [data, ...prev]);
      setShowBatchModal(false);
      setBatchForm({
        title: '',
        slug: '',
        description: '',
        program_type: 'cee',
        price_npr: 4990,
        instructor_name: 'Samyak Faculty Team',
        start_date: '',
        end_date: '',
      });
    } catch (err: any) {
      toast.error(err.message || 'Could not create batch');
    }
  };

  // Create / Update Lesson (with scheduling support)
  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonForm.title.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      if (editingLesson) {
        const { error } = await supabase
          .from('video_lectures')
          .update({
            title: lessonForm.title.trim(),
            subject_id: lessonForm.subject_id || null,
            chapter_id: lessonForm.chapter_id || null,
            batch_id: lessonForm.batch_id || null,
            video_url: lessonForm.video_url.trim() || null,
            duration_sec: Number(lessonForm.duration_sec) || 1800,
            is_premium: lessonForm.is_premium,
            is_active: lessonForm.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingLesson.id);

        if (error) throw error;
        toast.success('Lesson updated successfully!');
        setVideos((prev) =>
          prev.map((v) =>
            v.id === editingLesson.id
              ? {
                  ...v,
                  title: lessonForm.title.trim(),
                  subject_id: lessonForm.subject_id,
                  chapter_id: lessonForm.chapter_id,
                  video_url: lessonForm.video_url.trim(),
                  is_premium: lessonForm.is_premium,
                  is_active: lessonForm.is_active,
                }
              : v
          )
        );
      } else {
        const { data, error } = await supabase
          .from('video_lectures')
          .insert({
            title: lessonForm.title.trim(),
            subject_id: lessonForm.subject_id || null,
            chapter_id: lessonForm.chapter_id || null,
            batch_id: lessonForm.batch_id || null,
            video_url: lessonForm.video_url.trim() || 'https://vz-11253e6e-275.b-cdn.net/sample/playlist.m3u8',
            duration_sec: Number(lessonForm.duration_sec) || 1800,
            is_premium: lessonForm.is_premium,
            is_active: lessonForm.is_active,
          })
          .select()
          .single();

        if (error) throw error;
        toast.success('Lesson published successfully!');
        setVideos((prev) => [data, ...prev]);
      }

      setShowLessonModal(false);
      setEditingLesson(null);
    } catch (err: any) {
      toast.error(err.message || 'Could not save lesson');
    }
  };

  // Upload / Attach Resource Handout
  const handleSaveResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resourceForm.title.trim()) {
      toast.error('Resource title is required');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notes')
        .insert({
          title: resourceForm.title.trim(),
          subject_id: resourceForm.subject_id || subjects[0]?.id || null,
          chapter_id: resourceForm.chapter_id || chapters[0]?.id || null,
          pdf_url: resourceForm.pdf_url.trim() || null,
          content: resourceForm.content.trim() || null,
          is_premium: resourceForm.is_premium,
          is_active: true,
        })
        .select('*, subjects(display_name), chapters(title)')
        .single();

      if (error) throw error;
      toast.success('Resource handout attached to curriculum!');
      setResources((prev) => [data, ...prev]);
      setShowResourceModal(false);
      setResourceForm({
        title: '',
        subject_id: '',
        chapter_id: '',
        pdf_url: '',
        content: '',
        is_premium: true,
      });
    } catch (err: any) {
      toast.error(err.message || 'Could not attach resource');
    }
  };

  // Reorder Subject Sequence
  const handleMoveSubject = async (subjectId: string, currentOrder: number, direction: 'up' | 'down') => {
    const newOrder = direction === 'up' ? Math.max(1, currentOrder - 1) : currentOrder + 1;
    try {
      await supabase.from('subjects').update({ sort_order: newOrder }).eq('id', subjectId);
      setSubjects((prev) =>
        prev
          .map((s) => (s.id === subjectId ? { ...s, sort_order: newOrder } : s))
          .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      );
      toast.success('Subject order updated');
    } catch {
      toast.error('Failed to update subject order');
    }
  };

  // Reorder Chapter Sequence
  const handleMoveChapter = async (chapterId: string, currentOrder: number, direction: 'up' | 'down') => {
    const newOrder = direction === 'up' ? Math.max(1, currentOrder - 1) : currentOrder + 1;
    try {
      await supabase.from('chapters').update({ sort_order: newOrder }).eq('id', chapterId);
      setChapters((prev) =>
        prev
          .map((c) => (c.id === chapterId ? { ...c, sort_order: newOrder } : c))
          .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      );
      toast.success('Chapter order updated');
    } catch {
      toast.error('Failed to update chapter order');
    }
  };

  // Toggle Published State (Draft vs Published)
  const togglePublish = async (lesson: any) => {
    try {
      const nextState = !lesson.is_active;
      await supabase.from('video_lectures').update({ is_active: nextState }).eq('id', lesson.id);
      setVideos((prev) => prev.map((v) => (v.id === lesson.id ? { ...v, is_active: nextState } : v)));
      toast.success(nextState ? 'Published' : 'Moved to Drafts');
    } catch {
      toast.error('Failed to update state');
    }
  };

  // Toggle Free Preview State (Free Preview vs Paid Only)
  const toggleFreePreview = async (lesson: any) => {
    try {
      const nextPremium = !lesson.is_premium;
      await supabase.from('video_lectures').update({ is_premium: nextPremium }).eq('id', lesson.id);
      setVideos((prev) => prev.map((v) => (v.id === lesson.id ? { ...v, is_premium: nextPremium } : v)));
      toast.success(nextPremium ? 'Set as Paid Only' : 'Set as Free Preview');
    } catch {
      toast.error('Failed to toggle free preview');
    }
  };

  const filteredVideos = videos.filter((v) => {
    const matchesSearch = v.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubjectId === 'all' || v.subject_id === selectedSubjectId;
    return matchesSearch && matchesSubject;
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/admin" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              <ArrowLeft size={14} /> Back to Admin
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-2">
            <Layers size={28} className="text-primary" />
            <span>Course &amp; Curriculum Management</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Authoritative hierarchy: Course &rarr; Batch &rarr; Subject &rarr; Unit &rarr; Chapter &rarr; Lesson.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => setShowCourseModal(true)}
            className="text-xs font-bold px-3 py-2.5 rounded-xl border border-border bg-card hover:bg-muted/40 text-foreground flex items-center gap-1.5 cursor-pointer"
          >
            <BookOpen size={14} />
            <span>New Course</span>
          </button>

          <button
            onClick={() => {
              setBatchForm({
                title: '',
                slug: '',
                description: '',
                program_type: 'cee',
                price_npr: 4990,
                instructor_name: 'Samyak Faculty Team',
                start_date: '',
                end_date: '',
              });
              setShowBatchModal(true);
            }}
            className="text-xs font-bold px-3 py-2.5 rounded-xl border border-border bg-card hover:bg-muted/40 text-foreground flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} />
            <span>New Batch</span>
          </button>

          <button
            onClick={() => {
              setResourceForm({
                title: '',
                subject_id: subjects[0]?.id || '',
                chapter_id: chapters[0]?.id || '',
                pdf_url: '',
                content: '',
                is_premium: true,
              });
              setShowResourceModal(true);
            }}
            className="text-xs font-bold px-3 py-2.5 rounded-xl border border-border bg-card hover:bg-muted/40 text-foreground flex items-center gap-1.5 cursor-pointer"
          >
            <Paperclip size={14} />
            <span>Attach Resource</span>
          </button>

          <button
            onClick={() => {
              setEditingLesson(null);
              setLessonForm({
                title: '',
                subject_id: subjects[0]?.id || '',
                chapter_id: chapters[0]?.id || '',
                batch_id: batches[0]?.id || '',
                video_url: '',
                duration_sec: 1800,
                is_premium: true,
                is_active: true,
                lesson_type: 'recorded_video',
                scheduled_at: '',
              });
              setShowLessonModal(true);
            }}
            className="btn-primary text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus size={14} />
            <span>Publish Lesson</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-border gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('lessons')}
          className={`pb-3 px-3.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'lessons' ? 'border-primary text-primary font-black' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Lessons &amp; Video Publishing ({videos.length})
        </button>
        <button
          onClick={() => setActiveTab('hierarchy')}
          className={`pb-3 px-3.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'hierarchy' ? 'border-primary text-primary font-black' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Subjects &amp; Chapters Ordering ({chapters.length})
        </button>
        <button
          onClick={() => setActiveTab('batches')}
          className={`pb-3 px-3.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'batches' ? 'border-primary text-primary font-black' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Batch Cohorts ({batches.length})
        </button>
        <button
          onClick={() => setActiveTab('resources')}
          className={`pb-3 px-3.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'resources' ? 'border-primary text-primary font-black' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Resource Uploads &amp; Handouts ({resources.length})
        </button>
      </div>

      {/* TAB 1: LESSONS & VIDEO PUBLISHING */}
      {activeTab === 'lessons' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-3 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search lessons by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="bg-card border border-border text-xs rounded-xl px-3 py-2 text-foreground focus:outline-none cursor-pointer"
              >
                <option value="all">All Subjects</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.display_name} ({s.program_type?.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 text-muted-foreground border-b border-border font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">Title</th>
                    <th className="py-3.5 px-4">Subject &amp; Chapter</th>
                    <th className="py-3.5 px-4">Access Tier</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredVideos.slice(0, 30).map((v) => (
                    <tr key={v.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 font-bold text-foreground">
                        <div className="flex items-center gap-2">
                          <Video size={14} className="text-primary shrink-0" />
                          <span className="truncate max-w-xs">{v.title}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        <span>{v.subjects?.display_name || 'Subject'}</span>
                        <span className="mx-1.5">&rarr;</span>
                        <span className="text-foreground">{v.chapters?.title || 'General'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => toggleFreePreview(v)}
                          className={`px-2.5 py-1 rounded-full font-bold text-[10px] cursor-pointer ${
                            v.is_premium
                              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          }`}
                        >
                          {v.is_premium ? 'Paid Only' : 'Free Preview'}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => togglePublish(v)}
                          className={`px-2.5 py-1 rounded-full font-bold text-[10px] cursor-pointer ${
                            v.is_active
                              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                              : 'bg-muted text-muted-foreground border border-border'
                          }`}
                        >
                          {v.is_active ? 'Published' : 'Draft'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <Link
                          href={`/learn/${v.id}`}
                          target="_blank"
                          className="px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted/40 text-foreground font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye size={12} />
                          <span>Preview</span>
                        </Link>
                        <button
                          onClick={() => {
                            setEditingLesson(v);
                            setLessonForm({
                              title: v.title,
                              subject_id: v.subject_id || '',
                              chapter_id: v.chapter_id || '',
                              batch_id: v.batch_id || '',
                              video_url: v.video_url || '',
                              duration_sec: v.duration_sec || 1800,
                              is_premium: v.is_premium,
                              is_active: v.is_active,
                              lesson_type: 'recorded_video',
                              scheduled_at: '',
                            });
                            setShowLessonModal(true);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 size={12} />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HIERARCHY ORDERING (SUBJECTS & CHAPTERS) */}
      {activeTab === 'hierarchy' && (
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Subjects Ordering Column */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <BookOpen size={16} className="text-primary" />
              <span>Subject Sequence Ordering</span>
            </h3>
            <div className="bg-card border border-border rounded-3xl p-4 space-y-2.5">
              {subjects.map((sub, idx) => (
                <div
                  key={sub.id}
                  className="p-3 rounded-2xl bg-muted/20 border border-border/70 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-foreground">{sub.display_name}</p>
                      <span className="text-[10px] text-muted-foreground uppercase font-mono">{sub.program_type}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMoveSubject(sub.id, sub.sort_order || idx + 1, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-30 cursor-pointer"
                      title="Move Up"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      onClick={() => handleMoveSubject(sub.id, sub.sort_order || idx + 1, 'down')}
                      disabled={idx === subjects.length - 1}
                      className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-30 cursor-pointer"
                      title="Move Down"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chapters Ordering Column */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Layers size={16} className="text-emerald-500" />
                <span>Chapter Hierarchy Ordering</span>
              </h3>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="bg-card border border-border text-xs rounded-xl px-3 py-1.5 text-foreground cursor-pointer"
              >
                <option value="all">All Subjects</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.display_name}</option>
                ))}
              </select>
            </div>

            <div className="bg-card border border-border rounded-3xl p-4 space-y-2.5 max-h-[600px] overflow-y-auto">
              {chapters
                .filter((c) => selectedSubjectId === 'all' || c.subject_id === selectedSubjectId)
                .map((ch, idx) => (
                  <div
                    key={ch.id}
                    className="p-3 rounded-2xl bg-muted/20 border border-border/70 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <p className="text-xs font-bold text-foreground truncate">{ch.title}</p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleMoveChapter(ch.id, ch.sort_order || idx + 1, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-30 cursor-pointer"
                        title="Move Up"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        onClick={() => handleMoveChapter(ch.id, ch.sort_order || idx + 1, 'down')}
                        className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-30 cursor-pointer"
                        title="Move Down"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BATCH COHORTS */}
      {activeTab === 'batches' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {batches.map((b) => (
            <div key={b.id} className="p-5 rounded-3xl bg-card border border-border shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {b.program_type?.toUpperCase()}
                  </span>
                  <h4 className="text-sm font-bold text-foreground mt-2">{b.title}</h4>
                </div>
                <span className="text-xs font-bold font-mono text-emerald-500">
                  NPR {b.price_npr?.toLocaleString() || 0}
                </span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{b.description || 'Full cohort curriculum.'}</p>
              <div className="text-[11px] text-muted-foreground pt-2 border-t border-border flex items-center justify-between">
                <span>Instructor: {b.instructor_name || 'Senior Faculty'}</span>
                <Link href={`/batches/${b.slug}`} className="text-primary font-bold hover:underline cursor-pointer">
                  View Batch &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: RESOURCE UPLOADS & HANDOUTS */}
      {activeTab === 'resources' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Paperclip size={16} className="text-primary" />
              <span>Chapter Formula Sheets, PDF Handouts &amp; CDC Blueprint Guides</span>
            </h3>
            <button
              onClick={() => setShowResourceModal(true)}
              className="btn-primary text-xs font-bold py-2 px-3.5 rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} />
              <span>Attach New Resource</span>
            </button>
          </div>

          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 text-muted-foreground border-b border-border font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">Handout Title</th>
                    <th className="py-3.5 px-4">Subject &amp; Chapter</th>
                    <th className="py-3.5 px-4">Access Tier</th>
                    <th className="py-3.5 px-4 text-right">Download / Open</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {resources.map((res) => (
                    <tr key={res.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 font-bold text-foreground">
                        <div className="flex items-center gap-2">
                          <FileText size={14} className="text-primary shrink-0" />
                          <span className="truncate max-w-xs">{res.title}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        <span>{res.subjects?.display_name || 'Subject'}</span>
                        <span className="mx-1.5">&rarr;</span>
                        <span className="text-foreground">{res.chapters?.title || 'Handout'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          res.is_premium
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                        }`}>
                          {res.is_premium ? 'Paid Batch' : 'Free Preview'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {res.pdf_url ? (
                          <a
                            href={res.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Download size={12} />
                            <span>Download PDF</span>
                          </a>
                        ) : (
                          <span className="text-muted-foreground">Concept Note</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: COURSE CREATION */}
      {showCourseModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <BookOpen size={18} className="text-primary" />
                <span>Create New Course Track</span>
              </h3>
              <button onClick={() => setShowCourseModal(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-foreground">Course Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SEE 2026 Board Topper Batch"
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-border bg-background mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-foreground">Course Slug</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. see-2026-board-topper"
                    value={courseForm.slug}
                    onChange={(e) => setCourseForm({ ...courseForm, slug: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-border bg-background mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground">Program Track</label>
                  <select
                    value={courseForm.program_type}
                    onChange={(e) => setCourseForm({ ...courseForm, program_type: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-border bg-background mt-1 cursor-pointer"
                  >
                    <option value="see">SEE Class 10</option>
                    <option value="cee">CEE Medical Entrance</option>
                    <option value="ielts">IELTS Masterclass</option>
                    <option value="digital">Digital Marketing</option>
                    <option value="ai">AI &amp; Python</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">Price (NPR)</label>
                <input
                  type="number"
                  value={courseForm.price_npr}
                  onChange={(e) => setCourseForm({ ...courseForm, price_npr: Number(e.target.value) })}
                  className="w-full text-xs p-2.5 rounded-xl border border-border bg-background mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">Curriculum Description</label>
                <textarea
                  rows={3}
                  placeholder="Target outcome, exam details, syllabus coverage..."
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-border bg-background mt-1 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-border hover:bg-muted cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-5 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Create Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: BATCH COHORT CREATION */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Plus size={18} className="text-primary" />
                <span>Create Batch Cohort</span>
              </h3>
              <button onClick={() => setShowBatchModal(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveBatch} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-foreground">Batch Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CEE 2026 Morning Super-30 Batch"
                  value={batchForm.title}
                  onChange={(e) => setBatchForm({ ...batchForm, title: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-border bg-background mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-foreground">Batch Slug</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. cee-2026-morning-batch"
                    value={batchForm.slug}
                    onChange={(e) => setBatchForm({ ...batchForm, slug: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-border bg-background mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground">Program Track</label>
                  <select
                    value={batchForm.program_type}
                    onChange={(e) => setBatchForm({ ...batchForm, program_type: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-border bg-background mt-1 cursor-pointer"
                  >
                    <option value="cee">CEE Medical</option>
                    <option value="see">SEE Class 10</option>
                    <option value="ielts">IELTS</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-foreground">Price (NPR)</label>
                  <input
                    type="number"
                    value={batchForm.price_npr}
                    onChange={(e) => setBatchForm({ ...batchForm, price_npr: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl border border-border bg-background mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground">Instructor / Faculty</label>
                  <input
                    type="text"
                    value={batchForm.instructor_name}
                    onChange={(e) => setBatchForm({ ...batchForm, instructor_name: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-border bg-background mt-1"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-border hover:bg-muted cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-5 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Create Batch Cohort
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: LESSON PUBLISHING & SCHEDULING */}
      {showLessonModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Video size={18} className="text-primary" />
                <span>{editingLesson ? 'Edit Lesson' : 'Publish New Video Lecture'}</span>
              </h3>
              <button onClick={() => setShowLessonModal(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveLesson} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-foreground">Lecture Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Thermodynamics — First Law &amp; Numerical Traps"
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-border bg-background mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-foreground">Subject</label>
                  <select
                    value={lessonForm.subject_id}
                    onChange={(e) => setLessonForm({ ...lessonForm, subject_id: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-border bg-background mt-1 cursor-pointer"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.display_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground">Chapter</label>
                  <select
                    value={lessonForm.chapter_id}
                    onChange={(e) => setLessonForm({ ...lessonForm, chapter_id: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-border bg-background mt-1 cursor-pointer"
                  >
                    <option value="">Select Chapter</option>
                    {chapters.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">Bunny CDN HLS Stream URL</label>
                <input
                  type="url"
                  placeholder="https://vz-11253e6e-275.b-cdn.net/guid/playlist.m3u8"
                  value={lessonForm.video_url}
                  onChange={(e) => setLessonForm({ ...lessonForm, video_url: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-border bg-background mt-1 font-mono"
                />
                <p className="text-[10px] text-muted-foreground mt-0.5">Stream is automatically protected via /api/video/sign with expiring SHA256 tokens.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-foreground">Duration (Seconds)</label>
                  <input
                    type="number"
                    value={lessonForm.duration_sec}
                    onChange={(e) => setLessonForm({ ...lessonForm, duration_sec: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl border border-border bg-background mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground">Access Tier</label>
                  <select
                    value={lessonForm.is_premium ? 'paid' : 'free'}
                    onChange={(e) => setLessonForm({ ...lessonForm, is_premium: e.target.value === 'paid' })}
                    className="w-full text-xs p-2.5 rounded-xl border border-border bg-background mt-1 cursor-pointer"
                  >
                    <option value="paid">Paid Only</option>
                    <option value="free">Free Preview</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lessonForm.is_active}
                    onChange={(e) => setLessonForm({ ...lessonForm, is_active: e.target.checked })}
                    className="rounded text-primary"
                  />
                  <span>Publish Immediately (Active)</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLessonModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-border hover:bg-muted cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-5 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  {editingLesson ? 'Save Changes' : 'Publish Lesson'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ATTACH RESOURCE */}
      {showResourceModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Paperclip size={18} className="text-primary" />
                <span>Attach Resource or PDF Handout</span>
              </h3>
              <button onClick={() => setShowResourceModal(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveResource} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-foreground">Resource Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Plant Physiology Complete Formula &amp; Concept Sheet"
                  value={resourceForm.title}
                  onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-border bg-background mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-foreground">Subject</label>
                  <select
                    value={resourceForm.subject_id}
                    onChange={(e) => setResourceForm({ ...resourceForm, subject_id: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-border bg-background mt-1 cursor-pointer"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.display_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground">Chapter</label>
                  <select
                    value={resourceForm.chapter_id}
                    onChange={(e) => setResourceForm({ ...resourceForm, chapter_id: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-border bg-background mt-1 cursor-pointer"
                  >
                    <option value="">Select Chapter</option>
                    {chapters.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">PDF Document URL / Storage Link</label>
                <input
                  type="url"
                  placeholder="https://.../handout.pdf"
                  value={resourceForm.pdf_url}
                  onChange={(e) => setResourceForm({ ...resourceForm, pdf_url: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-border bg-background mt-1 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">Key Concept Notes / Formula Summary (Markdown)</label>
                <textarea
                  rows={3}
                  placeholder="High-yield equations, definitions, or exam reminders..."
                  value={resourceForm.content}
                  onChange={(e) => setResourceForm({ ...resourceForm, content: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-border bg-background mt-1 resize-none"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!resourceForm.is_premium}
                    onChange={(e) => setResourceForm({ ...resourceForm, is_premium: !e.target.checked })}
                    className="rounded text-primary"
                  />
                  <span>Mark as Free Preview Resource (Publicly accessible)</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResourceModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-border hover:bg-muted cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-5 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Attach Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
