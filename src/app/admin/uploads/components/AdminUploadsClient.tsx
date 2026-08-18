'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Upload, FileText, Video, Image, BookOpen, Radio, Trash2, Eye, Plus, X, Save, Loader2, AlertCircle, CheckCircle2, Download, Search, File, Zap, ExternalLink, RefreshCw, FolderOpen, Lock } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Subject { id: string; name: string; display_name: string; }
interface Chapter { id: string; subject_id: string; title: string; }

interface Note {
  id: string; title: string; content: string | null; pdf_url: string | null;
  pdf_path: string | null; subject_id: string | null; chapter_id: string | null;
  is_premium: boolean; is_active: boolean; created_at: string;
  subjects?: { display_name: string }; chapters?: { title: string };
}

interface VideoLecture {
  id: string; title: string; description: string | null; video_url: string | null;
  video_path: string | null; thumbnail_url: string | null; duration_sec: number;
  subject_id: string | null; chapter_id: string | null;
  is_premium: boolean; is_active: boolean; created_at: string;
  subjects?: { display_name: string }; chapters?: { title: string };
}

interface StudyMaterial {
  id: string; title: string; description: string | null; file_url: string;
  file_path: string; file_type: string; file_size: number; material_type: string;
  subject_id: string | null; chapter_id: string | null;
  is_premium: boolean; is_active: boolean; created_at: string;
  subjects?: { display_name: string }; chapters?: { title: string };
}

interface LiveClass {
  id: string; title: string; description: string | null; scheduled_at: string;
  duration_min: number; meeting_url: string | null; recording_url: string | null;
  recording_path: string | null; resources_urls: string[]; status: string;
  subject_id: string | null; is_premium: boolean; created_at: string;
  subjects?: { display_name: string };
}

type TabKey = 'notes' | 'videos' | 'materials' | 'live' | 'bulk';

const TABS: { key: TabKey; label: string; icon: React.ElementType; color: string; bg: string }[] = [
  { key: 'notes',     label: 'Notes & PDFs',     icon: FileText, color: 'text-bio',     bg: 'bg-bio-light' },
  { key: 'videos',    label: 'Video Lectures',    icon: Video,    color: 'text-physics', bg: 'bg-physics-light' },
  { key: 'materials', label: 'Study Materials',   icon: BookOpen, color: 'text-chem',    bg: 'bg-chem-light' },
  { key: 'live',      label: 'Live Classes',      icon: Radio,    color: 'text-error',   bg: 'bg-error-light' },
  { key: 'bulk',      label: 'Bulk Import',       icon: Zap,      color: 'text-ma',      bg: 'bg-ma-light' },
];

const SUBJECT_COLORS: Record<string, string> = {
  biology: 'bg-bio-light text-bio', chemistry: 'bg-chem-light text-chem',
  physics: 'bg-physics-light text-physics', mental_agility: 'bg-ma-light text-ma',
};

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  let i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminUploadsClient() {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<TabKey>('notes');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Data states
  const [notes, setNotes] = useState<Note[]>([]);
  const [videos, setVideos] = useState<VideoLecture[]>([]);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSubjects();
    loadChapters();
  }, []);

  useEffect(() => {
    if (activeTab === 'notes') loadNotes();
    else if (activeTab === 'videos') loadVideos();
    else if (activeTab === 'materials') loadMaterials();
    else if (activeTab === 'live') loadLiveClasses();
  }, [activeTab]);

  const showSuccess = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(null), 3500); };
  const showError = (msg: string) => { setError(msg); setTimeout(() => setError(null), 5000); };

  async function loadSubjects() {
    const { data } = await supabase.from('subjects').select('id,name,display_name').order('display_name');
    if (data) setSubjects(data);
  }

  async function loadChapters() {
    const { data } = await supabase.from('chapters').select('id,subject_id,title').order('title');
    if (data) setChapters(data);
  }

  async function loadNotes() {
    setLoading(true);
    const { data, error: e } = await supabase
      .from('notes')
      .select('*, subjects(display_name), chapters(title)')
      .order('created_at', { ascending: false });
    if (e) showError(e.message);
    else setNotes(data || []);
    setLoading(false);
  }

  async function loadVideos() {
    setLoading(true);
    const { data, error: e } = await supabase
      .from('video_lectures')
      .select('*, subjects(display_name), chapters(title)')
      .order('created_at', { ascending: false });
    if (e) showError(e.message);
    else setVideos(data || []);
    setLoading(false);
  }

  async function loadMaterials() {
    setLoading(true);
    const { data, error: e } = await supabase
      .from('study_materials')
      .select('*, subjects(display_name), chapters(title)')
      .order('created_at', { ascending: false });
    if (e) showError(e.message);
    else setMaterials(data || []);
    setLoading(false);
  }

  async function loadLiveClasses() {
    setLoading(true);
    const { data, error: e } = await supabase
      .from('live_classes')
      .select('*, subjects(display_name)')
      .order('scheduled_at', { ascending: false });
    if (e) showError(e.message);
    else setLiveClasses(data || []);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-14 bg-card border-b border-border flex items-center px-4 gap-3 sticky top-0 z-30">
        <Link href="/admin" className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Upload size={14} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground leading-none">Upload Manager</p>
            <p className="text-xs text-muted-foreground">All content types · Supabase Storage</p>
          </div>
        </div>
      </header>

      {/* Alerts */}
      {error && (
        <div className="mx-4 mt-3 flex items-center gap-2 bg-error-light border border-error/20 text-error text-sm px-3 py-2.5 rounded-xl">
          <AlertCircle size={15} className="shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="mx-4 mt-3 flex items-center gap-2 bg-success-light border border-success/20 text-success text-sm px-3 py-2.5 rounded-xl">
          <CheckCircle2 size={15} className="shrink-0" />
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="px-4 pt-4">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? `${tab.bg} ${tab.color} border border-current/20`
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-border/80'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'notes' && (
          <NotesTab
            subjects={subjects} chapters={chapters}
            notes={notes} loading={loading}
            supabase={supabase}
            onSuccess={showSuccess} onError={showError}
            onRefresh={loadNotes}
          />
        )}
        {activeTab === 'videos' && (
          <VideosTab
            subjects={subjects} chapters={chapters}
            videos={videos} loading={loading}
            supabase={supabase}
            onSuccess={showSuccess} onError={showError}
            onRefresh={loadVideos}
          />
        )}
        {activeTab === 'materials' && (
          <MaterialsTab
            subjects={subjects} chapters={chapters}
            materials={materials} loading={loading}
            supabase={supabase}
            onSuccess={showSuccess} onError={showError}
            onRefresh={loadMaterials}
          />
        )}
        {activeTab === 'live' && (
          <LiveClassesTab
            subjects={subjects}
            liveClasses={liveClasses} loading={loading}
            supabase={supabase}
            onSuccess={showSuccess} onError={showError}
            onRefresh={loadLiveClasses}
          />
        )}
        {activeTab === 'bulk' && (
          <BulkImportTab
            subjects={subjects} chapters={chapters}
            supabase={supabase}
            onSuccess={showSuccess} onError={showError}
          />
        )}
      </div>
    </div>
  );
}

// ─── Upload Drop Zone ─────────────────────────────────────────────────────────

interface DropZoneProps {
  accept: string;
  label: string;
  hint: string;
  onFile: (file: File) => void;
  uploading?: boolean;
  progress?: number;
  currentUrl?: string | null;
}

function DropZone({ accept, label, hint, onFile, uploading, progress, currentUrl }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
        dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-muted/30'
      }`}
    >
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
      {uploading ? (
        <div className="flex flex-col items-center gap-2">
          <Loader2 size={24} className="text-primary animate-spin" />
          <p className="text-sm font-medium text-foreground">Uploading… {progress ?? 0}%</p>
          <div className="w-full bg-muted rounded-full h-1.5 mt-1">
            <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${progress ?? 0}%` }} />
          </div>
        </div>
      ) : currentUrl ? (
        <div className="flex flex-col items-center gap-1.5">
          <CheckCircle2 size={22} className="text-success" />
          <p className="text-xs font-medium text-success">File uploaded</p>
          <a href={currentUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-xs text-primary underline flex items-center gap-1">
            <ExternalLink size={11} /> View file
          </a>
          <p className="text-xs text-muted-foreground mt-1">Click to replace</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1.5">
          <Upload size={22} className="text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
      )}
    </div>
  );
}

// ─── Notes Tab ────────────────────────────────────────────────────────────────

interface NotesTabProps {
  subjects: Subject[]; chapters: Chapter[]; notes: Note[]; loading: boolean;
  supabase: ReturnType<typeof createClient>;
  onSuccess: (m: string) => void; onError: (m: string) => void; onRefresh: () => void;
}

function NotesTab({ subjects, chapters, notes, loading, supabase, onSuccess, onError, onRefresh }: NotesTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [form, setForm] = useState({ title: '', content: '', subject_id: '', chapter_id: '', is_premium: false, is_active: true });
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfPath, setPdfPath] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filteredChapters = chapters.filter(c => !form.subject_id || c.subject_id === form.subject_id);

  async function uploadPdf(file: File) {
    setUploading(true);
    setUploadProgress(10);
    const path = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const { data, error } = await supabase.storage.from('notes-pdfs').upload(path, file, { upsert: true });
    setUploadProgress(90);
    if (error) { onError(error.message); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('notes-pdfs').getPublicUrl(data.path);
    setPdfUrl(publicUrl);
    setPdfPath(data.path);
    setUploadProgress(100);
    setUploading(false);
  }

  async function handleSave() {
    if (!form.title.trim()) { onError('Title is required'); return; }
    setSaving(true);
    const payload = { ...form, pdf_url: pdfUrl, pdf_path: pdfPath, subject_id: form.subject_id || null, chapter_id: form.chapter_id || null };
    const { error } = editId
      ? await supabase.from('notes').update(payload).eq('id', editId)
      : await supabase.from('notes').insert(payload);
    setSaving(false);
    if (error) { onError(error.message); return; }
    onSuccess(editId ? 'Note updated!' : 'Note created!');
    resetForm();
    onRefresh();
  }

  async function handleDelete(id: string, path: string | null) {
    if (path) await supabase.storage.from('notes-pdfs').remove([path]);
    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (error) { onError(error.message); return; }
    onSuccess('Note deleted');
    setDeleteId(null);
    onRefresh();
  }

  function startEdit(note: Note) {
    setForm({ title: note.title, content: note.content || '', subject_id: note.subject_id || '', chapter_id: note.chapter_id || '', is_premium: note.is_premium, is_active: note.is_active });
    setPdfUrl(note.pdf_url);
    setPdfPath(note.pdf_path);
    setEditId(note.id);
    setShowForm(true);
  }

  function resetForm() {
    setForm({ title: '', content: '', subject_id: '', chapter_id: '', is_premium: false, is_active: true });
    setPdfUrl(null); setPdfPath(null); setEditId(null); setShowForm(false);
  }

  const filtered = notes.filter(n => n.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes…" className="pl-8 pr-3 py-2 text-sm bg-card border border-border rounded-xl focus:outline-none focus:border-primary/50 w-52" />
          </div>
          <button onClick={onRefresh} className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <RefreshCw size={14} />
          </button>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
          <Plus size={14} /> Add Note
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">{editId ? 'Edit Note' : 'New Note / PDF'}</h3>
            <button onClick={resetForm} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Title *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Note title" className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary/50" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Subject</label>
              <select value={form.subject_id} onChange={e => setForm(f => ({ ...f, subject_id: e.target.value, chapter_id: '' }))} className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary/50">
                <option value="">All subjects</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.display_name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Chapter</label>
              <select value={form.chapter_id} onChange={e => setForm(f => ({ ...f, chapter_id: e.target.value }))} className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary/50">
                <option value="">All chapters</option>
                {filteredChapters.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Rich Text Content</label>
              <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={5} placeholder="Write note content here (supports markdown)…" className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary/50 resize-none font-mono" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">PDF Upload (optional)</label>
              <DropZone accept=".pdf,.doc,.docx" label="Drop PDF here or click to browse" hint="PDF, DOC, DOCX · Max 50 MB" onFile={uploadPdf} uploading={uploading} progress={uploadProgress} currentUrl={pdfUrl} />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_premium} onChange={e => setForm(f => ({ ...f, is_premium: e.target.checked }))} className="w-4 h-4 rounded accent-primary" />
                <span className="text-sm text-foreground flex items-center gap-1"><Lock size={12} /> Premium only</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 rounded accent-primary" />
                <span className="text-sm text-foreground">Active</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {editId ? 'Update' : 'Save Note'}
            </button>
            <button onClick={resetForm} className="px-4 py-2 bg-muted text-foreground rounded-xl text-sm font-semibold hover:bg-muted/80 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No notes yet. Click "Add Note" to get started.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(note => (
            <div key={note.id} className="bg-card border border-border rounded-2xl p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-bio-light flex items-center justify-center shrink-0">
                <FileText size={16} className="text-bio" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-foreground truncate">{note.title}</p>
                  {note.is_premium && <span className="text-xs bg-ma-light text-ma px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5"><Lock size={9} /> Pro</span>}
                  {!note.is_active && <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">Inactive</span>}
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {note.subjects && <span className="text-xs text-muted-foreground">{note.subjects.display_name}</span>}
                  {note.chapters && <span className="text-xs text-muted-foreground">· {note.chapters.title}</span>}
                  {note.pdf_url && <a href={note.pdf_url} target="_blank" rel="noreferrer" className="text-xs text-primary flex items-center gap-0.5 hover:underline"><Download size={10} /> PDF</a>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => startEdit(note)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"><Eye size={14} /></button>
                {deleteId === note.id ? (
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleDelete(note.id, note.pdf_path)} className="px-2 py-1 text-xs bg-error text-white rounded-lg font-semibold">Yes</button>
                    <button onClick={() => setDeleteId(null)} className="px-2 py-1 text-xs bg-muted text-foreground rounded-lg font-semibold">No</button>
                  </div>
                ) : (
                  <button onClick={() => setDeleteId(note.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-error hover:bg-error-light transition-colors"><Trash2 size={14} /></button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Videos Tab ───────────────────────────────────────────────────────────────

interface VideosTabProps {
  subjects: Subject[]; chapters: Chapter[]; videos: VideoLecture[]; loading: boolean;
  supabase: ReturnType<typeof createClient>;
  onSuccess: (m: string) => void; onError: (m: string) => void; onRefresh: () => void;
}

function VideosTab({ subjects, chapters, videos, loading, supabase, onSuccess, onError, onRefresh }: VideosTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [form, setForm] = useState({ title: '', description: '', subject_id: '', chapter_id: '', duration_sec: 0, is_premium: false, is_active: true });
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoPath, setVideoPath] = useState<string | null>(null);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filteredChapters = chapters.filter(c => !form.subject_id || c.subject_id === form.subject_id);

  async function uploadVideo(file: File) {
    setUploadingVideo(true);
    setVideoProgress(5);
    const path = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const { data, error } = await supabase.storage.from('lecture-videos').upload(path, file, { upsert: true });
    setVideoProgress(95);
    if (error) { onError(error.message); setUploadingVideo(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('lecture-videos').getPublicUrl(data.path);
    setVideoUrl(publicUrl);
    setVideoPath(data.path);
    setVideoProgress(100);
    setUploadingVideo(false);
  }

  async function uploadThumbnail(file: File) {
    setUploadingThumb(true);
    const path = `thumbs/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const { data, error } = await supabase.storage.from('diagrams-images').upload(path, file, { upsert: true });
    if (error) { onError(error.message); setUploadingThumb(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('diagrams-images').getPublicUrl(data.path);
    setThumbUrl(publicUrl);
    setUploadingThumb(false);
  }

  async function handleSave() {
    if (!form.title.trim()) { onError('Title is required'); return; }
    setSaving(true);
    const payload = { ...form, video_url: videoUrl, video_path: videoPath, thumbnail_url: thumbUrl, subject_id: form.subject_id || null, chapter_id: form.chapter_id || null };
    const { error } = editId
      ? await supabase.from('video_lectures').update(payload).eq('id', editId)
      : await supabase.from('video_lectures').insert(payload);
    setSaving(false);
    if (error) { onError(error.message); return; }
    onSuccess(editId ? 'Video updated!' : 'Video lecture added!');
    resetForm();
    onRefresh();
  }

  async function handleDelete(id: string, path: string | null) {
    if (path) await supabase.storage.from('lecture-videos').remove([path]);
    const { error } = await supabase.from('video_lectures').delete().eq('id', id);
    if (error) { onError(error.message); return; }
    onSuccess('Video deleted');
    setDeleteId(null);
    onRefresh();
  }

  function startEdit(v: VideoLecture) {
    setForm({ title: v.title, description: v.description || '', subject_id: v.subject_id || '', chapter_id: v.chapter_id || '', duration_sec: v.duration_sec, is_premium: v.is_premium, is_active: v.is_active });
    setVideoUrl(v.video_url); setVideoPath(v.video_path); setThumbUrl(v.thumbnail_url);
    setEditId(v.id); setShowForm(true);
  }

  function resetForm() {
    setForm({ title: '', description: '', subject_id: '', chapter_id: '', duration_sec: 0, is_premium: false, is_active: true });
    setVideoUrl(null); setVideoPath(null); setThumbUrl(null); setEditId(null); setShowForm(false);
  }

  const filtered = videos.filter(v => v.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search videos…" className="pl-8 pr-3 py-2 text-sm bg-card border border-border rounded-xl focus:outline-none focus:border-primary/50 w-52" />
          </div>
          <button onClick={onRefresh} className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><RefreshCw size={14} /></button>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-3 py-2 bg-physics text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-colors">
          <Plus size={14} /> Add Video
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">{editId ? 'Edit Video Lecture' : 'Upload Video Lecture'}</h3>
            <button onClick={resetForm} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Title *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Lecture title" className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary/50" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Subject</label>
              <select value={form.subject_id} onChange={e => setForm(f => ({ ...f, subject_id: e.target.value, chapter_id: '' }))} className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary/50">
                <option value="">Select subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.display_name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Chapter</label>
              <select value={form.chapter_id} onChange={e => setForm(f => ({ ...f, chapter_id: e.target.value }))} className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary/50">
                <option value="">Select chapter</option>
                {filteredChapters.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Duration (seconds)</label>
              <input type="number" value={form.duration_sec} onChange={e => setForm(f => ({ ...f, duration_sec: parseInt(e.target.value) || 0 }))} className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary/50" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Description</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description" className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary/50" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Video File *</label>
              <DropZone accept="video/*" label="Drop video or click to browse" hint="MP4, WebM, MOV · Max 500 MB" onFile={uploadVideo} uploading={uploadingVideo} progress={videoProgress} currentUrl={videoUrl} />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Thumbnail (optional)</label>
              <DropZone accept="image/*" label="Drop thumbnail image" hint="JPG, PNG, WebP · Max 10 MB" onFile={uploadThumbnail} uploading={uploadingThumb} currentUrl={thumbUrl} />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_premium} onChange={e => setForm(f => ({ ...f, is_premium: e.target.checked }))} className="w-4 h-4 rounded accent-primary" />
                <span className="text-sm text-foreground flex items-center gap-1"><Lock size={12} /> Premium only</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 rounded accent-primary" />
                <span className="text-sm text-foreground">Active</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {editId ? 'Update' : 'Save Video'}
            </button>
            <button onClick={resetForm} className="px-4 py-2 bg-muted text-foreground rounded-xl text-sm font-semibold hover:bg-muted/80 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Video size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No videos yet. Click "Add Video" to upload.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(v => (
            <div key={v.id} className="bg-card border border-border rounded-2xl p-4 flex items-start gap-3">
              {v.thumbnail_url ? (
                <img src={v.thumbnail_url} alt={v.title} className="w-16 h-10 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="w-16 h-10 rounded-lg bg-physics-light flex items-center justify-center shrink-0">
                  <Video size={16} className="text-physics" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-foreground truncate">{v.title}</p>
                  {v.is_premium && <span className="text-xs bg-ma-light text-ma px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5"><Lock size={9} /> Pro</span>}
                  {v.duration_sec > 0 && <span className="text-xs text-muted-foreground">{formatDuration(v.duration_sec)}</span>}
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {v.subjects && <span className="text-xs text-muted-foreground">{v.subjects.display_name}</span>}
                  {v.chapters && <span className="text-xs text-muted-foreground">· {v.chapters.title}</span>}
                  {v.video_url && <a href={v.video_url} target="_blank" rel="noreferrer" className="text-xs text-primary flex items-center gap-0.5 hover:underline"><ExternalLink size={10} /> Watch</a>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => startEdit(v)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"><Eye size={14} /></button>
                {deleteId === v.id ? (
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleDelete(v.id, v.video_path)} className="px-2 py-1 text-xs bg-error text-white rounded-lg font-semibold">Yes</button>
                    <button onClick={() => setDeleteId(null)} className="px-2 py-1 text-xs bg-muted text-foreground rounded-lg font-semibold">No</button>
                  </div>
                ) : (
                  <button onClick={() => setDeleteId(v.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-error hover:bg-error-light transition-colors"><Trash2 size={14} /></button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Study Materials Tab ──────────────────────────────────────────────────────

interface MaterialsTabProps {
  subjects: Subject[]; chapters: Chapter[]; materials: StudyMaterial[]; loading: boolean;
  supabase: ReturnType<typeof createClient>;
  onSuccess: (m: string) => void; onError: (m: string) => void; onRefresh: () => void;
}

const MATERIAL_TYPES = ['general','formula_sheet','past_paper','reference','diagram','other'];

function MaterialsTab({ subjects, chapters, materials, loading, supabase, onSuccess, onError, onRefresh }: MaterialsTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [form, setForm] = useState({ title: '', description: '', subject_id: '', chapter_id: '', material_type: 'general', is_premium: false, is_active: true });
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [fileType, setFileType] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  const filteredChapters = chapters.filter(c => !form.subject_id || c.subject_id === form.subject_id);

  async function uploadFile(file: File) {
    setUploading(true);
    setUploadProgress(10);
    const bucket = file.type.startsWith('image/') ? 'diagrams-images' : 'study-materials';
    const path = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    setUploadProgress(90);
    if (error) { onError(error.message); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
    setFileUrl(publicUrl);
    setFilePath(data.path);
    setFileType(file.type);
    setFileSize(file.size);
    setUploadProgress(100);
    setUploading(false);
  }

  async function handleSave() {
    if (!form.title.trim()) { onError('Title is required'); return; }
    if (!fileUrl && !editId) { onError('Please upload a file'); return; }
    setSaving(true);
    const payload = { ...form, file_url: fileUrl || '', file_path: filePath || '', file_type: fileType, file_size: fileSize, subject_id: form.subject_id || null, chapter_id: form.chapter_id || null };
    const { error } = editId
      ? await supabase.from('study_materials').update(payload).eq('id', editId)
      : await supabase.from('study_materials').insert(payload);
    setSaving(false);
    if (error) { onError(error.message); return; }
    onSuccess(editId ? 'Material updated!' : 'Material uploaded!');
    resetForm();
    onRefresh();
  }

  async function handleDelete(id: string, path: string) {
    const bucket = path.startsWith('thumbs/') ? 'diagrams-images' : 'study-materials';
    await supabase.storage.from(bucket).remove([path]);
    const { error } = await supabase.from('study_materials').delete().eq('id', id);
    if (error) { onError(error.message); return; }
    onSuccess('Material deleted');
    setDeleteId(null);
    onRefresh();
  }

  function startEdit(m: StudyMaterial) {
    setForm({ title: m.title, description: m.description || '', subject_id: m.subject_id || '', chapter_id: m.chapter_id || '', material_type: m.material_type, is_premium: m.is_premium, is_active: m.is_active });
    setFileUrl(m.file_url); setFilePath(m.file_path); setFileType(m.file_type); setFileSize(m.file_size);
    setEditId(m.id); setShowForm(true);
  }

  function resetForm() {
    setForm({ title: '', description: '', subject_id: '', chapter_id: '', material_type: 'general', is_premium: false, is_active: true });
    setFileUrl(null); setFilePath(null); setFileType(''); setFileSize(0); setEditId(null); setShowForm(false);
  }

  const filtered = materials.filter(m =>
    m.title.toLowerCase().includes(search.toLowerCase()) &&
    (filterType === 'all' || m.material_type === filterType)
  );

  const typeLabel: Record<string, string> = { general: 'General', formula_sheet: 'Formula Sheet', past_paper: 'Past Paper', reference: 'Reference', diagram: 'Diagram', other: 'Other' };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search materials…" className="pl-8 pr-3 py-2 text-sm bg-card border border-border rounded-xl focus:outline-none focus:border-primary/50 w-48" />
          </div>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-2 text-sm bg-card border border-border rounded-xl focus:outline-none focus:border-primary/50">
            <option value="all">All types</option>
            {MATERIAL_TYPES.map(t => <option key={t} value={t}>{typeLabel[t]}</option>)}
          </select>
          <button onClick={onRefresh} className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><RefreshCw size={14} /></button>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-3 py-2 bg-chem text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-colors">
          <Plus size={14} /> Add Material
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">{editId ? 'Edit Material' : 'Upload Study Material'}</h3>
            <button onClick={resetForm} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Title *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Material title" className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary/50" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Subject</label>
              <select value={form.subject_id} onChange={e => setForm(f => ({ ...f, subject_id: e.target.value, chapter_id: '' }))} className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary/50">
                <option value="">All subjects</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.display_name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Chapter</label>
              <select value={form.chapter_id} onChange={e => setForm(f => ({ ...f, chapter_id: e.target.value }))} className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary/50">
                <option value="">All chapters</option>
                {filteredChapters.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Material Type</label>
              <select value={form.material_type} onChange={e => setForm(f => ({ ...f, material_type: e.target.value }))} className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary/50">
                {MATERIAL_TYPES.map(t => <option key={t} value={t}>{typeLabel[t]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Description</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description" className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary/50" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">File *</label>
              <DropZone accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.zip,.doc,.docx" label="Drop file here or click to browse" hint="PDF, Images, ZIP, DOC · Max 100 MB" onFile={uploadFile} uploading={uploading} progress={uploadProgress} currentUrl={fileUrl} />
              {fileSize > 0 && <p className="text-xs text-muted-foreground mt-1">{formatBytes(fileSize)} · {fileType}</p>}
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_premium} onChange={e => setForm(f => ({ ...f, is_premium: e.target.checked }))} className="w-4 h-4 rounded accent-primary" />
                <span className="text-sm text-foreground flex items-center gap-1"><Lock size={12} /> Premium only</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 rounded accent-primary" />
                <span className="text-sm text-foreground">Active</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {editId ? 'Update' : 'Upload Material'}
            </button>
            <button onClick={resetForm} className="px-4 py-2 bg-muted text-foreground rounded-xl text-sm font-semibold hover:bg-muted/80 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No materials yet. Click "Add Material" to upload.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(m => (
            <div key={m.id} className="bg-card border border-border rounded-2xl p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-chem-light flex items-center justify-center shrink-0">
                {m.file_type.startsWith('image/') ? <Image size={16} className="text-chem" /> : <File size={16} className="text-chem" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-foreground truncate">{m.title}</p>
                  <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">{typeLabel[m.material_type] || m.material_type}</span>
                  {m.is_premium && <span className="text-xs bg-ma-light text-ma px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5"><Lock size={9} /> Pro</span>}
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {m.subjects && <span className="text-xs text-muted-foreground">{m.subjects.display_name}</span>}
                  {m.file_size > 0 && <span className="text-xs text-muted-foreground">· {formatBytes(m.file_size)}</span>}
                  <a href={m.file_url} target="_blank" rel="noreferrer" className="text-xs text-primary flex items-center gap-0.5 hover:underline"><Download size={10} /> Download</a>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => startEdit(m)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"><Eye size={14} /></button>
                {deleteId === m.id ? (
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleDelete(m.id, m.file_path)} className="px-2 py-1 text-xs bg-error text-white rounded-lg font-semibold">Yes</button>
                    <button onClick={() => setDeleteId(null)} className="px-2 py-1 text-xs bg-muted text-foreground rounded-lg font-semibold">No</button>
                  </div>
                ) : (
                  <button onClick={() => setDeleteId(m.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-error hover:bg-error-light transition-colors"><Trash2 size={14} /></button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Live Classes Tab ─────────────────────────────────────────────────────────

interface LiveClassesTabProps {
  subjects: Subject[]; liveClasses: LiveClass[]; loading: boolean;
  supabase: ReturnType<typeof createClient>;
  onSuccess: (m: string) => void; onError: (m: string) => void; onRefresh: () => void;
}

function LiveClassesTab({ subjects, liveClasses, loading, supabase, onSuccess, onError, onRefresh }: LiveClassesTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingRec, setUploadingRec] = useState(false);
  const [uploadingRes, setUploadingRes] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', subject_id: '', scheduled_at: '', duration_min: 60, meeting_url: '', status: 'scheduled', is_premium: false, stream_provider: '', playback_url: '' });
  const [recUrl, setRecUrl] = useState<string | null>(null);
  const [recPath, setRecPath] = useState<string | null>(null);
  const [resourceUrls, setResourceUrls] = useState<string[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function uploadRecording(file: File) {
    setUploadingRec(true);
    const path = `recordings/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const { data, error } = await supabase.storage.from('lecture-videos').upload(path, file, { upsert: true });
    if (error) { onError(error.message); setUploadingRec(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('lecture-videos').getPublicUrl(data.path);
    setRecUrl(publicUrl); setRecPath(data.path);
    setUploadingRec(false);
  }

  async function uploadResource(file: File) {
    setUploadingRes(true);
    const path = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const { data, error } = await supabase.storage.from('live-resources').upload(path, file, { upsert: true });
    if (error) { onError(error.message); setUploadingRes(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('live-resources').getPublicUrl(data.path);
    setResourceUrls(prev => [...prev, publicUrl]);
    setUploadingRes(false);
  }

  async function handleSave() {
    if (!form.title.trim()) { onError('Title is required'); return; }
    if (!form.scheduled_at) { onError('Scheduled date/time is required'); return; }
    setSaving(true);
    // This DB has no stream_provider/playback_url columns — the student page
    // derives the player from the stream URL. Fold playback_url into meeting_url
    // (a Bunny/HLS .m3u8 there plays in-app) and drop the non-existent columns.
    const { stream_provider: _sp, playback_url: pbUrl, ...rest } = form as typeof form & { stream_provider?: string; playback_url?: string };
    const payload = {
      ...rest,
      meeting_url: (pbUrl && pbUrl.trim()) ? pbUrl.trim() : form.meeting_url || null,
      recording_url: recUrl,
      recording_path: recPath,
      resources_urls: resourceUrls,
      subject_id: form.subject_id || null,
    };
    const { error } = editId
      ? await supabase.from('live_classes').update(payload).eq('id', editId)
      : await supabase.from('live_classes').insert(payload);
    setSaving(false);
    if (error) { onError(error.message); return; }
    onSuccess(editId ? 'Class updated!' : 'Live class scheduled!');
    resetForm();
    onRefresh();
  }

  async function handleDelete(id: string, path: string | null) {
    if (path) await supabase.storage.from('lecture-videos').remove([path]);
    const { error } = await supabase.from('live_classes').delete().eq('id', id);
    if (error) { onError(error.message); return; }
    onSuccess('Class deleted');
    setDeleteId(null);
    onRefresh();
  }

  function startEdit(lc: LiveClass) {
    setForm({ title: lc.title, description: lc.description || '', subject_id: lc.subject_id || '', scheduled_at: lc.scheduled_at.slice(0, 16), duration_min: lc.duration_min, meeting_url: lc.meeting_url || '', status: lc.status, is_premium: lc.is_premium, stream_provider: (lc as any).stream_provider || '', playback_url: (lc as any).playback_url || '' });
    setRecUrl(lc.recording_url); setRecPath(lc.recording_path);
    setResourceUrls(lc.resources_urls || []);
    setEditId(lc.id); setShowForm(true);
  }

  function resetForm() {
    setForm({ title: '', description: '', subject_id: '', scheduled_at: '', duration_min: 60, meeting_url: '', status: 'scheduled', is_premium: false, stream_provider: '', playback_url: '' });
    setRecUrl(null); setRecPath(null); setResourceUrls([]); setEditId(null); setShowForm(false);
  }

  const statusColors: Record<string, string> = { scheduled: 'bg-primary/10 text-primary', live: 'bg-success-light text-success', completed: 'bg-muted text-muted-foreground', cancelled: 'bg-error-light text-error' };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onRefresh} className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><RefreshCw size={14} /></button>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-3 py-2 bg-error text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-colors">
          <Plus size={14} /> Schedule Class
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">{editId ? 'Edit Live Class' : 'Schedule Live Class'}</h3>
            <button onClick={resetForm} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Title *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Class title" className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary/50" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Subject</label>
              <select value={form.subject_id} onChange={e => setForm(f => ({ ...f, subject_id: e.target.value }))} className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary/50">
                <option value="">Select subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.display_name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary/50">
                {['scheduled','live','completed','cancelled'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Scheduled At *</label>
              <input type="datetime-local" value={form.scheduled_at} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))} className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary/50" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Duration (minutes)</label>
              <input type="number" value={form.duration_min} onChange={e => setForm(f => ({ ...f, duration_min: parseInt(e.target.value) || 60 }))} className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary/50" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Live stream source (for 100s–1000s of students)</label>
              <select value={form.stream_provider} onChange={e => setForm(f => ({ ...f, stream_provider: e.target.value }))} className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary/50">
                <option value="">None (external meeting link)</option>
                <option value="hls">Adaptive HLS (.m3u8 — Cloudflare Stream / Mux)</option>
                <option value="youtube">YouTube Live</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Playback URL / YouTube ID</label>
              <input value={form.playback_url} onChange={e => setForm(f => ({ ...f, playback_url: e.target.value }))} placeholder=".m3u8 URL or YouTube video id" className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary/50" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Meeting URL (fallback — Zoom / Google Meet, for small classes)</label>
              <input value={form.meeting_url} onChange={e => setForm(f => ({ ...f, meeting_url: e.target.value }))} placeholder="https://meet.google.com/..." className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary/50" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Recording Upload (post-class)</label>
              <DropZone accept="video/*" label="Upload class recording" hint="MP4, WebM · Max 500 MB" onFile={uploadRecording} uploading={uploadingRec} currentUrl={recUrl} />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Class Resources (PDFs, slides)</label>
              <DropZone accept=".pdf,.ppt,.pptx,.jpg,.png" label="Upload resource file" hint="PDF, PPT, Images · Max 50 MB" onFile={uploadResource} uploading={uploadingRes} />
              {resourceUrls.length > 0 && (
                <div className="mt-2 space-y-1">
                  {resourceUrls.map((url, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <a href={url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline truncate flex-1">{url.split('/').pop()}</a>
                      <button onClick={() => setResourceUrls(prev => prev.filter((_, j) => j !== i))} className="text-error hover:text-error/80"><X size={12} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_premium} onChange={e => setForm(f => ({ ...f, is_premium: e.target.checked }))} className="w-4 h-4 rounded accent-primary" />
                <span className="text-sm text-foreground flex items-center gap-1"><Lock size={12} /> Premium only</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {editId ? 'Update' : 'Schedule Class'}
            </button>
            <button onClick={resetForm} className="px-4 py-2 bg-muted text-foreground rounded-xl text-sm font-semibold hover:bg-muted/80 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-muted-foreground" /></div>
      ) : liveClasses.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Radio size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No live classes yet. Schedule one above.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {liveClasses.map(lc => (
            <div key={lc.id} className="bg-card border border-border rounded-2xl p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-error-light flex items-center justify-center shrink-0">
                <Radio size={16} className="text-error" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-foreground truncate">{lc.title}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${statusColors[lc.status] || 'bg-muted text-muted-foreground'}`}>{lc.status}</span>
                  {lc.is_premium && <span className="text-xs bg-ma-light text-ma px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5"><Lock size={9} /> Pro</span>}
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap text-xs text-muted-foreground">
                  {lc.subjects && <span>{lc.subjects.display_name}</span>}
                  <span>· {new Date(lc.scheduled_at).toLocaleString('en-NP', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  <span>· {lc.duration_min} min</span>
                  {lc.meeting_url && <a href={lc.meeting_url} target="_blank" rel="noreferrer" className="text-primary flex items-center gap-0.5 hover:underline"><ExternalLink size={10} /> Join</a>}
                  {lc.recording_url && <a href={lc.recording_url} target="_blank" rel="noreferrer" className="text-primary flex items-center gap-0.5 hover:underline"><Video size={10} /> Recording</a>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => startEdit(lc)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"><Eye size={14} /></button>
                {deleteId === lc.id ? (
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleDelete(lc.id, lc.recording_path)} className="px-2 py-1 text-xs bg-error text-white rounded-lg font-semibold">Yes</button>
                    <button onClick={() => setDeleteId(null)} className="px-2 py-1 text-xs bg-muted text-foreground rounded-lg font-semibold">No</button>
                  </div>
                ) : (
                  <button onClick={() => setDeleteId(lc.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-error hover:bg-error-light transition-colors"><Trash2 size={14} /></button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Bulk Import Tab ──────────────────────────────────────────────────────────

interface BulkImportTabProps {
  subjects: Subject[]; chapters: Chapter[];
  supabase: ReturnType<typeof createClient>;
  onSuccess: (m: string) => void; onError: (m: string) => void;
}

const CSV_TEMPLATE = `question_text,option_a,option_b,option_c,option_d,correct_option,explanation,difficulty,subject_name,chapter_title
"What is the powerhouse of the cell?","Nucleus","Mitochondria","Ribosome","Golgi body","b","Mitochondria produces ATP energy","easy","biology","Cell Biology" "What is Newton's first law?","Law of inertia","Law of acceleration","Law of action-reaction","Law of gravity","a","Objects at rest stay at rest unless acted upon","medium","physics","Laws of Motion"`;

function BulkImportTab({ subjects, chapters, supabase, onSuccess, onError }: BulkImportTabProps) {
  const [csvText, setCsvText] = useState('');
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function parseCsv(text: string): Record<string, string>[] {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
    return lines.slice(1).map(line => {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      for (const char of line) {
        if (char === '"') inQuotes = !inQuotes;
        else if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
        else current += char;
      }
      values.push(current.trim());
      return Object.fromEntries(headers.map((h, i) => [h, values[i] || '']));
    });
  }

  function handleFileLoad(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvText(text);
      setPreview(parseCsv(text).slice(0, 5));
    };
    reader.readAsText(file);
  }

  function handleTextChange(text: string) {
    setCsvText(text);
    setPreview(parseCsv(text).slice(0, 5));
  }

  async function handleImport() {
    const rows = parseCsv(csvText);
    if (rows.length === 0) { onError('No valid rows found in CSV'); return; }
    setImporting(true);
    setImportResult(null);
    let success = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const subject = subjects.find(s => s.name.toLowerCase() === (row.subject_name || '').toLowerCase().trim());
        const chapter = chapters.find(c => c.title.toLowerCase() === (row.chapter_title || '').toLowerCase().trim() && (!subject || c.subject_id === subject.id));
        const { error } = await supabase.from('questions').insert({
          question_text: row.question_text?.trim(),
          option_a: row.option_a?.trim(),
          option_b: row.option_b?.trim(),
          option_c: row.option_c?.trim(),
          option_d: row.option_d?.trim(),
          correct_option: row.correct_option?.trim().toLowerCase(),
          explanation: row.explanation?.trim() || null,
          difficulty: (['easy','medium','hard'].includes(row.difficulty?.trim()) ? row.difficulty.trim() : 'medium') as 'easy'|'medium'|'hard',
          subject_id: subject?.id || null,
          chapter_id: chapter?.id || null,
          is_active: true,
        });
        if (error) errors.push(`Row ${i + 2}: ${error.message}`);
        else success++;
      } catch (e: unknown) {
        errors.push(`Row ${i + 2}: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }
    }

    setImporting(false);
    setImportResult({ success, failed: rows.length - success, errors: errors.slice(0, 10) });
    if (success > 0) onSuccess(`${success} questions imported successfully!`);
  }

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'questions_template.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground">Bulk Question Import</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Upload a CSV file or paste CSV content to import questions in bulk</p>
          </div>
          <button onClick={downloadTemplate} className="flex items-center gap-1.5 px-3 py-2 bg-muted text-foreground rounded-xl text-xs font-semibold hover:bg-muted/80 transition-colors">
            <Download size={13} /> Template
          </button>
        </div>

        {/* CSV Format Guide */}
        <div className="bg-muted/50 rounded-xl p-3 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground mb-1">Required CSV columns:</p>
          <p className="font-mono">question_text, option_a, option_b, option_c, option_d, correct_option (a/b/c/d), explanation, difficulty (easy/medium/hard), subject_name, chapter_title</p>
        </div>

        {/* File Upload */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Upload CSV File</label>
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-border rounded-xl p-4 text-center cursor-pointer hover:border-primary/40 hover:bg-muted/30 transition-all"
          >
            <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileLoad(f); }} />
            <FolderOpen size={20} className="mx-auto mb-1.5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Click to browse CSV file</p>
          </div>
        </div>

        {/* Paste CSV */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Or Paste CSV Content</label>
          <textarea
            value={csvText}
            onChange={e => handleTextChange(e.target.value)}
            rows={8}
            placeholder={CSV_TEMPLATE}
            className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:border-primary/50 resize-none font-mono"
          />
        </div>

        {/* Preview */}
        {preview.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">Preview (first {preview.length} rows):</p>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-xs">
                <thead className="bg-muted">
                  <tr>
                    {Object.keys(preview[0]).map(h => <th key={h} className="px-2 py-1.5 text-left font-semibold text-muted-foreground whitespace-nowrap">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="border-t border-border">
                      {Object.values(row).map((v, j) => <td key={j} className="px-2 py-1.5 text-foreground max-w-32 truncate">{v}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{parseCsv(csvText).length} total rows detected</p>
          </div>
        )}

        <button
          onClick={handleImport}
          disabled={importing || !csvText.trim()}
          className="flex items-center gap-1.5 px-4 py-2 bg-ma text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-colors"
        >
          {importing ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
          {importing ? 'Importing…' : `Import ${parseCsv(csvText).length || 0} Questions`}
        </button>

        {/* Result */}
        {importResult && (
          <div className={`rounded-xl p-3 text-sm ${importResult.failed === 0 ? 'bg-success-light border border-success/20' : 'bg-error-light border border-error/20'}`}>
            <div className="flex items-center gap-2 font-semibold mb-1">
              {importResult.failed === 0 ? <CheckCircle2 size={15} className="text-success" /> : <AlertCircle size={15} className="text-error" />}
              <span className={importResult.failed === 0 ? 'text-success' : 'text-error'}>
                {importResult.success} imported · {importResult.failed} failed
              </span>
            </div>
            {importResult.errors.length > 0 && (
              <ul className="text-xs text-error space-y-0.5 mt-1">
                {importResult.errors.map((e, i) => <li key={i}>• {e}</li>)}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
