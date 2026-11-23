'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { programTypeField, withProgramType } from '@/lib/courses/programColumn';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Zap,
  ToggleLeft,
  ToggleRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Lock,
  Unlock,
  Upload,
  Download,
  Search,
  Sparkles,
  Lightbulb,
  Archive,
  ArchiveRestore,
  Copy,
  Layers,
  FileCode,
  FileSpreadsheet,
  AlertTriangle
} from 'lucide-react';
import { getChatCompletion } from '@/lib/ai/chatCompletion';

interface Subject { id: string; name: string; display_name: string; }
interface Chapter { id: string; subject_id: string; title: string; }

interface Question {
  id: string;
  subject_id: string | null;
  chapter_id: string | null;
  question_text: string;
  options: string[] | any;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  explanation: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  is_published: boolean;
  is_active: boolean;
  created_at: string;
  subjects?: { display_name: string; name: string };
  chapters?: { title: string };
}

interface FormState {
  subject_id: string;
  chapter_id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'draft' | 'reviewed' | 'published';
  is_active: boolean;
}

interface AIGenerateForm {
  subject_id: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  count: number;
}

interface GeneratedMCQ {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  explanation: string;
}

interface AIEnhanceResult {
  alternative_explanation: string;
  hint: string;
}

const defaultForm: FormState = {
  subject_id: '',
  chapter_id: '',
  question_text: '',
  option_a: '',
  option_b: '',
  option_c: '',
  option_d: '',
  correct_option: 'a',
  explanation: '',
  difficulty: 'medium',
  status: 'published',
  is_active: true,
};

const defaultAIForm: AIGenerateForm = {
  subject_id: '',
  topic: '',
  difficulty: 'medium',
  count: 5,
};

const DIFF_COLORS = {
  easy: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  hard: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
};

const SUBJECT_COLORS: Record<string, string> = {
  biology: 'bg-emerald-500/10 text-emerald-600',
  chemistry: 'bg-amber-500/10 text-amber-600',
  physics: 'bg-sky-500/10 text-sky-600',
  mental_agility: 'bg-purple-500/10 text-purple-600',
};

const CSV_TEMPLATE = `question_text,option_a,option_b,option_c,option_d,correct_option,explanation,difficulty,subject_name,chapter_title
"What is the powerhouse of the cell?","Nucleus","Mitochondria","Ribosome","Golgi body","b","Mitochondria produces ATP energy","easy","biology","Cell Biology"`;

const JSON_TEMPLATE = JSON.stringify([
  {
    "question_text": "Which organelle is responsible for cellular respiration?",
    "options": ["Nucleus", "Mitochondria", "Ribosome", "Endoplasmic reticulum"],
    "correct_answer": "B",
    "explanation": "Mitochondria produce ATP through oxidative phosphorylation.",
    "difficulty": "easy",
    "subject_name": "Biology",
    "chapter_title": "Cell Biology"
  }
], null, 2);

// Calculate text similarity (Dice Coefficient)
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().replace(/[^a-z0-9]/g, '');
  const s2 = str2.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1.0;
  if (s1.length < 2 || s2.length < 2) return 0;

  const getBigrams = (str: string) => {
    const bigrams = new Map<string, number>();
    for (let i = 0; i < str.length - 1; i++) {
      const b = str.substring(i, i + 2);
      bigrams.set(b, (bigrams.get(b) || 0) + 1);
    }
    return bigrams;
  };

  const b1 = getBigrams(s1);
  const b2 = getBigrams(s2);
  let intersection = 0;
  for (const [k, v] of b1.entries()) {
    if (b2.has(k)) {
      intersection += Math.min(v, b2.get(k)!);
    }
  }
  const total = (s1.length - 1) + (s2.length - 1);
  return (2 * intersection) / total;
}

export default function AdminQuestionsClient() {
  const supabase = createClient();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  // A question belongs to its subject's course. Every screen here used to leave it
  // out, so each question got the CEE default.
  const courseOfSubject = (id: string | null | undefined) =>
    (subjects as Array<{ id: string; program_type?: string | null }>).find((x) => x.id === id)?.program_type ?? undefined;
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [archiveConfirm, setArchiveConfirm] = useState<string | null>(null);

  // Filters
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterDiff, setFilterDiff] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft' | 'archived'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Bulk Import State
  const [showImport, setShowImport] = useState(false);
  const [importTab, setImportTab] = useState<'csv' | 'json'>('csv');
  const [jsonImportText, setJsonImportText] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; duplicates: number; errors: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // AI Generate state
  const [showAIGenerate, setShowAIGenerate] = useState(false);
  const [aiForm, setAIForm] = useState<AIGenerateForm>(defaultAIForm);
  const [aiGenerating, setAIGenerating] = useState(false);
  const [aiPreview, setAIPreview] = useState<GeneratedMCQ[]>([]);
  const [aiSaving, setAISaving] = useState(false);

  // AI Enhance state
  const [enhanceQuestion, setEnhanceQuestion] = useState<Question | null>(null);
  const [enhancing, setEnhancing] = useState(false);
  const [enhanceResult, setEnhanceResult] = useState<AIEnhanceResult | null>(null);
  const [enhanceSaving, setEnhanceSaving] = useState(false);

  // Duplicate warning for active form
  const duplicateWarning = useMemo(() => {
    if (!form.question_text || form.question_text.length < 10) return null;
    const match = questions.find(
      (q) => q.id !== editingId && calculateSimilarity(q.question_text, form.question_text) > 0.85
    );
    if (match) {
      return {
        matchedText: match.question_text,
        subject: match.subjects?.display_name || 'Question Bank',
      };
    }
    return null;
  }, [form.question_text, questions, editingId]);

  const PAGE_SIZE = 20;

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [subResult, chapResult] = await Promise.all([
      supabase.from('subjects').select(await withProgramType(supabase, 'subjects', 'id, name, display_name')).order('name'),
      supabase.from('chapters').select('id, subject_id, title').order('title'),
    ]);
    setSubjects(((subResult.data as unknown) as Subject[]) || []);
    setChapters(chapResult.data || []);
    setLoading(false);
  }, []);

  const fetchQuestions = useCallback(async () => {
    let query = supabase
      .from('questions')
      .select('*, subjects(display_name, name), chapters(title)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (filterSubject !== 'all') query = query.eq('subject_id', filterSubject);
    if (filterDiff !== 'all') query = query.eq('difficulty', filterDiff);

    if (filterStatus === 'published') {
      query = query.eq('is_published', true).eq('is_active', true);
    } else if (filterStatus === 'draft') {
      query = query.eq('is_published', false).eq('is_active', true);
    } else if (filterStatus === 'archived') {
      query = query.eq('is_active', false);
    }

    if (search.trim()) query = query.ilike('question_text', `%${search.trim()}%`);

    const { data, error: err, count } = await query;
    if (err) setError(err.message);

    const mapped = (data || []).map((r: any) => {
      const opts = Array.isArray(r.options) ? r.options : [];
      return {
        ...r,
        option_a: r.option_a ?? (typeof opts[0] === 'object' ? opts[0]?.text : opts[0]) ?? '',
        option_b: r.option_b ?? (typeof opts[1] === 'object' ? opts[1]?.text : opts[1]) ?? '',
        option_c: r.option_c ?? (typeof opts[2] === 'object' ? opts[2]?.text : opts[2]) ?? '',
        option_d: r.option_d ?? (typeof opts[3] === 'object' ? opts[3]?.text : opts[3]) ?? '',
        correct_option: String(r.correct_answer ?? r.correct_option ?? 'a').toLowerCase().replace(/[^a-d]/g, '').slice(0, 1) || 'a',
        is_active: r.is_active ?? true,
        is_published: r.is_published ?? true,
      };
    });

    setQuestions(mapped);
    setTotalCount(count || 0);
  }, [filterSubject, filterDiff, filterStatus, search, page]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  const showSuccess = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(null), 3000); };

  const filteredChapters = form.subject_id ? chapters.filter(c => c.subject_id === form.subject_id) : chapters;

  const openCreate = () => { setEditingId(null); setForm(defaultForm); setShowForm(true); };
  const openEdit = (q: Question) => {
    setEditingId(q.id);
    setForm({
      subject_id: q.subject_id || '',
      chapter_id: q.chapter_id || '',
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_option: q.correct_option,
      explanation: q.explanation || '',
      difficulty: q.difficulty,
      status: q.is_published ? 'published' : 'draft',
      is_active: q.is_active,
    });
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(defaultForm); };

  const closeAIGenerate = () => {
    setShowAIGenerate(false);
    setAIForm(defaultAIForm);
    setAIPreview([]);
  };

  const handleAIGenerate = async () => {
    if (!aiForm.subject_id) { setError('Please select a subject'); return; }
    if (!aiForm.topic.trim()) { setError('Please enter a topic or chapter'); return; }
    if (aiForm.count < 1 || aiForm.count > 20) { setError('Count must be between 1 and 20'); return; }

    setAIGenerating(true);
    setError(null);
    setAIPreview([]);

    const selectedSubject = subjects.find(s => s.id === aiForm.subject_id);
    const subjectName = selectedSubject?.display_name || 'General';

    const prompt = `Generate exactly ${aiForm.count} multiple-choice questions (MCQs) for a medical entrance exam (CEE Nepal).

Subject: ${subjectName}
Topic: ${aiForm.topic}
Difficulty: ${aiForm.difficulty}

Requirements:
- Each question must have exactly 4 options (A, B, C, D)
- Only one correct answer per question
- Include a brief conceptual explanation
- Format strictly as JSON array without markdown:
[
  {
    "question_text": "...",
    "option_a": "...",
    "option_b": "...",
    "option_c": "...",
    "option_d": "...",
    "correct_option": "a",
    "explanation": "..."
  }
]`;

    try {
      const response = await getChatCompletion(
        'OPEN_AI',
        'gpt-4o',
        [
          { role: 'system', content: 'You are an expert educator creating high-yield MCQ questions. Respond with valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        { max_completion_tokens: 4000 }
      );

      const content = response.choices[0]?.message?.content || '';
      const jsonStr = content.replace(/\`\`\`json\n?/g, '').replace(/\`\`\`\n?/g, '').trim();
      const parsed: GeneratedMCQ[] = JSON.parse(jsonStr);

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('Invalid response format from AI');
      }

      setAIPreview(parsed);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate questions';
      setError(`AI generation failed: ${message}`);
    } finally {
      setAIGenerating(false);
    }
  };

  const handleSaveAIQuestions = async () => {
    if (aiPreview.length === 0) return;
    setAISaving(true);
    setError(null);

    const aiCourse = await programTypeField(supabase, 'questions', courseOfSubject(aiForm.subject_id));
    const payload = aiPreview.map(q => ({
      subject_id: aiForm.subject_id || null,
      ...aiCourse,
      chapter_id: null,
      question_text: q.question_text,
      options: [q.option_a, q.option_b, q.option_c, q.option_d],
      correct_answer: String(q.correct_option ?? 'a').trim().toUpperCase().replace(/[^A-D]/g, '').slice(0, 1) || 'A',
      explanation: q.explanation || null,
      difficulty: aiForm.difficulty,
      is_published: true,
      is_active: true,
    }));

    const { error: err } = await supabase.from('questions').insert(payload);
    if (err) {
      setError(err.message);
    } else {
      showSuccess(`${aiPreview.length} AI-generated questions saved successfully!`);
      closeAIGenerate();
      fetchQuestions();
    }
    setAISaving(false);
  };

  const handleSave = async () => {
    if (!form.question_text.trim()) { setError('Question text is required'); return; }
    if (!form.option_a.trim() || !form.option_b.trim() || !form.option_c.trim() || !form.option_d.trim()) {
      setError('All 4 options are required'); return;
    }
    setSaving(true); setError(null);

    const payload = {
      subject_id: form.subject_id || null,
      ...(await programTypeField(supabase, 'questions', courseOfSubject(form.subject_id))),
      chapter_id: form.chapter_id || null,
      question_text: form.question_text.trim(),
      options: [form.option_a.trim(), form.option_b.trim(), form.option_c.trim(), form.option_d.trim()],
      correct_answer: String(form.correct_option).toUpperCase().replace(/[^A-D]/g, '').slice(0, 1) || 'A',
      explanation: form.explanation.trim() || null,
      difficulty: form.difficulty,
      is_published: form.status === 'published',
      is_active: form.is_active,
    };

    if (editingId) {
      const { error: err } = await supabase.from('questions').update(payload).eq('id', editingId);
      if (err) setError(err.message);
      else { showSuccess('Question updated'); closeForm(); fetchQuestions(); }
    } else {
      const { error: err } = await supabase.from('questions').insert(payload);
      if (err) setError(err.message);
      else { showSuccess('Question created'); closeForm(); fetchQuestions(); }
    }
    setSaving(false);
  };

  // Bulk CSV Import
  const handleBulkImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    const text = await file.text();
    const lines = text.split('\n').filter(l => l.trim());
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    let successCount = 0;
    let duplicateCount = 0;
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].match(/(".*?"|[^,]+)(?=,|$)/g)?.map(v => v.replace(/^"|"$/g, '').trim()) || [];
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => { row[h] = values[idx] || ''; });

        if (!row.question_text || !row.option_a || !row.option_b || !row.option_c || !row.option_d || !row.correct_option) {
          errors.push(`Row ${i}: Missing required fields`); continue;
        }

        // Duplicate Check
        const isDuplicate = questions.some(q => calculateSimilarity(q.question_text, row.question_text) > 0.85);
        if (isDuplicate) {
          duplicateCount++;
          continue;
        }

        let subjectId: string | null = null;
        let chapterId: string | null = null;
        if (row.subject_name) {
          const sub = subjects.find(s => s.name === row.subject_name.toLowerCase() || s.display_name.toLowerCase() === row.subject_name.toLowerCase());
          subjectId = sub?.id || null;
        }
        if (row.chapter_title && subjectId) {
          const chap = chapters.find(c => c.title.toLowerCase() === row.chapter_title.toLowerCase() && c.subject_id === subjectId);
          chapterId = chap?.id || null;
        }

        const { error: err } = await supabase.from('questions').insert({
          subject_id: subjectId,
          ...(await programTypeField(supabase, 'questions', courseOfSubject(subjectId))),
          chapter_id: chapterId,
          question_text: row.question_text,
          options: [row.option_a, row.option_b, row.option_c, row.option_d],
          correct_answer: String(row.correct_option).toUpperCase().replace(/[^A-D]/g, '').slice(0, 1) || 'A',
          explanation: row.explanation || null,
          difficulty: (['easy', 'medium', 'hard'].includes(row.difficulty) ? row.difficulty : 'medium') as 'easy' | 'medium' | 'hard',
          is_published: true,
          is_active: true,
        });
        if (err) errors.push(`Row ${i}: ${err.message}`);
        else successCount++;
      } catch {
        errors.push(`Row ${i}: Parse error`);
      }
    }
    setImportResult({ success: successCount, failed: errors.length, duplicates: duplicateCount, errors: errors.slice(0, 5) });
    setImporting(false);
    if (successCount > 0) { showSuccess(`Imported ${successCount} questions`); fetchQuestions(); }
    if (fileRef.current) fileRef.current.value = '';
  };

  // Bulk JSON Import
  const handleBulkImportJSON = async () => {
    if (!jsonImportText.trim()) return;
    setImporting(true);
    setImportResult(null);
    let successCount = 0;
    let duplicateCount = 0;
    const errors: string[] = [];

    try {
      const parsed = JSON.parse(jsonImportText);
      if (!Array.isArray(parsed)) throw new Error('Root must be an array of question objects');

      for (let i = 0; i < parsed.length; i++) {
        const item = parsed[i];
        if (!item.question_text || !Array.isArray(item.options) || item.options.length < 2) {
          errors.push(`Item ${i + 1}: Missing question_text or options array`);
          continue;
        }

        const isDuplicate = questions.some(q => calculateSimilarity(q.question_text, item.question_text) > 0.85);
        if (isDuplicate) {
          duplicateCount++;
          continue;
        }

        let subjectId: string | null = null;
        if (item.subject_name) {
          const sub = subjects.find(s => s.name === item.subject_name.toLowerCase() || s.display_name.toLowerCase() === item.subject_name.toLowerCase());
          subjectId = sub?.id || null;
        }

        const { error: err } = await supabase.from('questions').insert({
          subject_id: subjectId,
          ...(await programTypeField(supabase, 'questions', courseOfSubject(subjectId))),
          chapter_id: null,
          question_text: item.question_text,
          options: item.options,
          correct_answer: String(item.correct_answer || item.correct_option || 'A').toUpperCase().replace(/[^A-D]/g, '').slice(0, 1) || 'A',
          explanation: item.explanation || null,
          difficulty: (['easy', 'medium', 'hard'].includes(item.difficulty) ? item.difficulty : 'medium') as any,
          is_published: true,
          is_active: true,
        });

        if (err) errors.push(`Item ${i + 1}: ${err.message}`);
        else successCount++;
      }
    } catch (e: any) {
      errors.push('JSON Parse error: ' + e.message);
    }

    setImportResult({ success: successCount, failed: errors.length, duplicates: duplicateCount, errors: errors.slice(0, 5) });
    setImporting(false);
    if (successCount > 0) {
      showSuccess(`Imported ${successCount} questions via JSON`);
      setJsonImportText('');
      fetchQuestions();
    }
  };

  // Soft Archival / Restoration (Non-destructive)
  const handleToggleArchive = async (q: Question) => {
    const nextActive = !q.is_active;
    const { error: err } = await supabase
      .from('questions')
      .update({
        is_active: nextActive,
        is_published: nextActive ? q.is_published : false,
      })
      .eq('id', q.id);

    if (err) {
      setError(err.message);
    } else {
      showSuccess(nextActive ? 'Question restored to bank' : 'Question soft-archived (preserved in student records)');
      setArchiveConfirm(null);
      fetchQuestions();
    }
  };

  // 1-Click Status Approval Toggle (Draft <-> Published)
  const handleTogglePublish = async (q: Question) => {
    const nextPublished = !q.is_published;
    const { error: err } = await supabase
      .from('questions')
      .update({ is_published: nextPublished })
      .eq('id', q.id);

    if (err) {
      setError(err.message);
    } else {
      showSuccess(nextPublished ? 'Question approved & published' : 'Question moved to draft review');
      fetchQuestions();
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-lg font-black text-foreground">Question Bank Management</h1>
            <p className="text-xs text-muted-foreground">Authoring, Review Workflow &amp; Soft-Archival · {totalCount} total</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowAIGenerate(!showAIGenerate); setShowImport(false); setAIPreview([]); }}
            className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-purple-600 border border-purple-200 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors"
          >
            <Sparkles size={14} /> AI Generator
          </button>
          <button
            onClick={() => { setShowImport(!showImport); setShowAIGenerate(false); }}
            className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-muted-foreground border border-border rounded-xl hover:text-foreground hover:border-primary/30 transition-colors"
          >
            <Upload size={14} /> Bulk Import (CSV/JSON)
          </button>
          <button onClick={openCreate} className="btn-primary py-2 px-4 text-xs font-bold gap-1.5">
            <Plus size={16} /> Add Question
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-5">
        {error && (
          <div className="flex items-center gap-2 bg-rose-500/10 text-rose-600 px-4 py-3 rounded-2xl text-xs font-medium border border-rose-500/20">
            <AlertCircle size={16} className="shrink-0" /> {error}
            <button onClick={() => setError(null)} className="ml-auto"><X size={14} /></button>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-600 px-4 py-3 rounded-2xl text-xs font-medium border border-emerald-500/20">
            <CheckCircle2 size={16} className="shrink-0" /> {success}
          </div>
        )}

        {/* Bulk Import Panel */}
        {showImport && (
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload size={18} className="text-primary" />
                <h2 className="font-black text-foreground text-sm">Bulk Question Ingestion with Duplicate Protection</h2>
              </div>
              <button onClick={() => setShowImport(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>

            <div className="flex gap-2 border-b border-border pb-2">
              <button
                onClick={() => setImportTab('csv')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${importTab === 'csv' ? 'bg-primary text-white' : 'text-muted-foreground'}`}
              >
                <FileSpreadsheet size={14} /> CSV Format
              </button>
              <button
                onClick={() => setImportTab('json')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${importTab === 'json' ? 'bg-primary text-white' : 'text-muted-foreground'}`}
              >
                <FileCode size={14} /> JSON Array
              </button>
            </div>

            {importTab === 'csv' ? (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">Upload standard question spreadsheet. Duplicate questions (&gt;85% match) are skipped automatically.</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a'); a.href = url; a.download = 'questions_template.csv'; a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-primary border border-primary/30 rounded-xl hover:bg-primary/5"
                  >
                    <Download size={13} /> Download Template
                  </button>
                  <label className="btn-primary py-2 px-4 text-xs font-bold gap-2 cursor-pointer">
                    {importing ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                    {importing ? 'Processing File...' : 'Choose CSV File'}
                    <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleBulkImportCSV} disabled={importing} />
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">Paste JSON array of questions. Includes duplicate detection and automatic option extraction.</p>
                <textarea
                  rows={6}
                  value={jsonImportText}
                  onChange={(e) => setJsonImportText(e.target.value)}
                  placeholder={JSON_TEMPLATE}
                  className="w-full p-3 rounded-2xl bg-muted/40 border border-border font-mono text-xs text-foreground"
                />
                <button
                  onClick={handleBulkImportJSON}
                  disabled={importing || !jsonImportText.trim()}
                  className="btn-primary py-2 px-5 text-xs font-bold gap-2"
                >
                  {importing ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                  Validate &amp; Ingest JSON
                </button>
              </div>
            )}

            {importResult && (
              <div className="p-4 bg-muted/30 border border-border rounded-2xl text-xs space-y-1">
                <p className="font-bold text-foreground">
                  Ingestion Results: <span className="text-emerald-600">{importResult.success} inserted</span>
                  {importResult.duplicates > 0 && <span className="text-amber-600 ml-2">({importResult.duplicates} duplicates skipped)</span>}
                  {importResult.failed > 0 && <span className="text-rose-600 ml-2">({importResult.failed} failed)</span>}
                </p>
                {importResult.errors.map((e, idx) => <p key={idx} className="text-rose-600 font-mono text-[11px]">• {e}</p>)}
              </div>
            )}
          </div>
        )}

        {/* Search & Status Filters Bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className="w-full pl-10 pr-3 py-2.5 bg-card border border-border rounded-2xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-xs"
              placeholder="Search by keyword, question text, or ID..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
            />
          </div>

          <select
            className="px-3.5 py-2.5 bg-card border border-border rounded-2xl text-xs font-semibold text-foreground focus:outline-none shadow-xs"
            value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value as any); setPage(0); }}
          >
            <option value="all">All Statuses</option>
            <option value="published">Published Only</option>
            <option value="draft">Draft Review Only</option>
            <option value="archived">Archived Only</option>
          </select>

          <select
            className="px-3.5 py-2.5 bg-card border border-border rounded-2xl text-xs font-semibold text-foreground focus:outline-none shadow-xs"
            value={filterSubject}
            onChange={e => { setFilterSubject(e.target.value); setPage(0); }}
          >
            <option value="all">All Subjects</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.display_name}</option>)}
          </select>

          <select
            className="px-3.5 py-2.5 bg-card border border-border rounded-2xl text-xs font-semibold text-foreground focus:outline-none shadow-xs"
            value={filterDiff}
            onChange={e => { setFilterDiff(e.target.value); setPage(0); }}
          >
            <option value="all">All Difficulty</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        {/* Create / Edit Question Modal / Form */}
        {showForm && (
          <div className="bg-card border border-border rounded-3xl p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-foreground text-base">
                {editingId ? 'Edit Question & Review Status' : 'Create New Authoritative Question'}
              </h2>
              <button onClick={closeForm} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>

            {/* Duplicate Detection Warning */}
            {duplicateWarning && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200">
                <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Potential Duplicate Detected (&gt;85% Text Similarity)</p>
                  <p className="mt-0.5">Existing question in {duplicateWarning.subject}: &ldquo;{duplicateWarning.matchedText}&rdquo;</p>
                </div>
              </div>
            )}

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Subject</label>
                <select
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground"
                  value={form.subject_id}
                  onChange={e => setForm(f => ({ ...f, subject_id: e.target.value, chapter_id: '' }))}
                >
                  <option value="">Select subject...</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.display_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Chapter</label>
                <select
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground"
                  value={form.chapter_id}
                  onChange={e => setForm(f => ({ ...f, chapter_id: e.target.value }))}
                >
                  <option value="">Select chapter...</option>
                  {filteredChapters.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Difficulty</label>
                <select
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground"
                  value={form.difficulty}
                  onChange={e => setForm(f => ({ ...f, difficulty: e.target.value as any }))}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Question Text *</label>
              <textarea
                rows={3}
                className="w-full p-3 bg-background border border-border rounded-2xl text-xs text-foreground resize-none"
                placeholder="Type question content..."
                value={form.question_text}
                onChange={e => setForm(f => ({ ...f, question_text: e.target.value }))}
              />
            </div>

            {/* Options */}
            <div className="grid sm:grid-cols-2 gap-3">
              {(['a', 'b', 'c', 'd'] as const).map(opt => (
                <div
                  key={opt}
                  className={`rounded-2xl border-2 p-2 flex items-center gap-2 transition-all ${
                    form.correct_option === opt
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-border bg-muted/20'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, correct_option: opt }))}
                    className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                      form.correct_option === opt ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {opt.toUpperCase()}
                  </button>
                  <input
                    className="flex-1 bg-transparent text-xs text-foreground focus:outline-none"
                    placeholder={`Option ${opt.toUpperCase()}...`}
                    value={(form as any)[`option_${opt}`]}
                    onChange={e => setForm(f => ({ ...f, [`option_${opt}`]: e.target.value }))}
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Explanation / Solution Rubric</label>
              <textarea
                rows={2}
                className="w-full p-3 bg-background border border-border rounded-2xl text-xs text-foreground resize-none"
                placeholder="Comprehensive solution steps..."
                value={form.explanation}
                onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))}
              />
            </div>

            {/* Approval Workflow & Active Toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="flex items-center gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Review Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}
                    className="bg-background border border-border rounded-xl px-3 py-1.5 text-xs font-bold text-foreground"
                  >
                    <option value="published">Published (Live in Student Bank)</option>
                    <option value="draft">Draft (Faculty Review Required)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={closeForm} className="btn-secondary py-2.5 px-4 text-xs font-bold">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving} className="btn-primary py-2.5 px-5 text-xs font-bold gap-2">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {editingId ? 'Save Changes' : 'Publish Question'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Questions List */}
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-primary" /></div>
        ) : questions.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-3xl p-8">
            <Zap size={36} className="mx-auto text-muted-foreground mb-3 opacity-40" />
            <p className="text-sm font-bold text-foreground">No questions matching filter</p>
            <p className="text-xs text-muted-foreground mt-1">Adjust your filters or author new questions above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {questions.map((q, idx) => (
              <div
                key={q.id}
                className={`bg-card border rounded-2xl p-4 transition-all ${
                  !q.is_active
                    ? 'opacity-60 border-dashed border-border bg-muted/20'
                    : !q.is_published
                    ? 'border-amber-500/30 bg-amber-500/[0.02]'
                    : 'border-border hover:border-primary/30 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xs font-mono text-muted-foreground shrink-0 mt-0.5">
                    {page * PAGE_SIZE + idx + 1}.
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-foreground leading-snug">
                      {q.question_text}
                    </p>

                    <div className="flex items-center gap-2 mt-2 flex-wrap text-xs">
                      {q.subjects && (
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${SUBJECT_COLORS[q.subjects.name] || 'bg-muted text-muted-foreground'}`}>
                          {q.subjects.display_name}
                        </span>
                      )}
                      {q.chapters && <span className="text-muted-foreground text-[11px]">· {q.chapters.title}</span>}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${DIFF_COLORS[q.difficulty]}`}>
                        {q.difficulty}
                      </span>
                      <span className="font-bold text-emerald-600 text-xs">
                        Correct: {q.correct_option.toUpperCase()}
                      </span>

                      {/* Approval Status Badge */}
                      {!q.is_active ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground">
                          Archived
                        </span>
                      ) : q.is_published ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          Published
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          Under Review (Draft)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleTogglePublish(q)}
                      title={q.is_published ? 'Move to Draft' : 'Approve & Publish'}
                      className={`p-2 rounded-xl transition-colors text-xs font-bold ${
                        q.is_published
                          ? 'text-emerald-600 hover:bg-emerald-500/10'
                          : 'text-amber-600 hover:bg-amber-500/10'
                      }`}
                    >
                      {q.is_published ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    </button>

                    <button
                      onClick={() => openEdit(q)}
                      className="p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                      title="Edit"
                    >
                      <Pencil size={15} />
                    </button>

                    {/* Soft Archival / Restoration */}
                    {archiveConfirm === q.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleArchive(q)}
                          className="px-2 py-1 text-[10px] font-bold bg-amber-600 text-white rounded-lg"
                        >
                          Confirm {q.is_active ? 'Archive' : 'Restore'}
                        </button>
                        <button
                          onClick={() => setArchiveConfirm(null)}
                          className="px-2 py-1 text-[10px] text-muted-foreground border border-border rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setArchiveConfirm(q.id)}
                        title={q.is_active ? 'Soft-Archive Question' : 'Restore Question'}
                        className="p-2 rounded-xl text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10 transition-colors"
                      >
                        {q.is_active ? <Archive size={15} /> : <ArchiveRestore size={15} />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-3 py-1.5 text-xs font-bold border border-border rounded-xl disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <span className="text-xs font-semibold">{page + 1} / {totalPages}</span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="px-3 py-1.5 text-xs font-bold border border-border rounded-xl disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
