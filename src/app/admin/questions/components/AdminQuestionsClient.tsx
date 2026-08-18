'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Plus, Pencil, Trash2, Save, X, Zap, ToggleLeft, ToggleRight, Loader2, AlertCircle, CheckCircle2, Lock, Unlock, Upload, Download, Search, Sparkles, Lightbulb, RefreshCw } from 'lucide-react';
import { getChatCompletion } from '@/lib/ai/chatCompletion';

interface Subject { id: string; name: string; display_name: string; }
interface Chapter { id: string; subject_id: string; title: string; }

interface Question {
  id: string;
  subject_id: string | null;
  chapter_id: string | null;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  explanation: string | null;
  hint: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  is_premium: boolean;
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
  is_premium: boolean;
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
  subject_id: '', chapter_id: '', question_text: '',
  option_a: '', option_b: '', option_c: '', option_d: '',
  correct_option: 'a', explanation: '', difficulty: 'medium',
  is_premium: false, is_active: true,
};

const defaultAIForm: AIGenerateForm = {
  subject_id: '', topic: '', difficulty: 'medium', count: 5,
};

const DIFF_COLORS = { easy: 'bg-success-light text-success', medium: 'bg-chem-light text-chem', hard: 'bg-error-light text-error' };
const SUBJECT_COLORS: Record<string, string> = {
  biology: 'bg-bio-light text-bio', chemistry: 'bg-chem-light text-chem',
  physics: 'bg-physics-light text-physics', mental_agility: 'bg-ma-light text-ma',
};

const CSV_TEMPLATE = `question_text,option_a,option_b,option_c,option_d,correct_option,explanation,difficulty,subject_name,chapter_title
"What is the powerhouse of the cell?","Nucleus","Mitochondria","Ribosome","Golgi body","b","Mitochondria produces ATP energy","easy","biology","Cell Biology"`;

export default function AdminQuestionsClient() {
  const supabase = createClient();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterDiff, setFilterDiff] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [showImport, setShowImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
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

  const PAGE_SIZE = 20;

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [subResult, chapResult] = await Promise.all([
      supabase.from('subjects').select('id, name, display_name').order('name'),
      supabase.from('chapters').select('id, subject_id, title').order('title'),
    ]);
    setSubjects(subResult.data || []);
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
    if (search.trim()) query = query.ilike('question_text', `%${search.trim()}%`);
    const { data, error: err, count } = await query;
    if (err) setError(err.message);
    // This DB stores options as a text[] array + correct_answer LETTER + is_published.
    // Map to the option_a..d / correct_option / is_active shape the UI uses.
    const mapped = (data || []).map((r: any) => ({
      ...r,
      option_a: Array.isArray(r.options) ? (r.options[0] ?? '') : '',
      option_b: Array.isArray(r.options) ? (r.options[1] ?? '') : '',
      option_c: Array.isArray(r.options) ? (r.options[2] ?? '') : '',
      option_d: Array.isArray(r.options) ? (r.options[3] ?? '') : '',
      correct_option: String(r.correct_answer ?? 'a').toLowerCase().replace(/[^a-d]/g, '').slice(0, 1) || 'a',
      is_active: r.is_published ?? true,
      is_premium: false,
    }));
    setQuestions(mapped);
    setTotalCount(count || 0);
  }, [filterSubject, filterDiff, search, page]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  const showSuccess = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(null), 3000); };

  const filteredChapters = form.subject_id ? chapters.filter(c => c.subject_id === form.subject_id) : chapters;

  const openCreate = () => { setEditingId(null); setForm(defaultForm); setShowForm(true); };
  const openEdit = (q: Question) => {
    setEditingId(q.id);
    setForm({
      subject_id: q.subject_id || '', chapter_id: q.chapter_id || '',
      question_text: q.question_text, option_a: q.option_a, option_b: q.option_b,
      option_c: q.option_c, option_d: q.option_d, correct_option: q.correct_option,
      explanation: q.explanation || '', difficulty: q.difficulty,
      is_premium: q.is_premium, is_active: q.is_active,
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

    const prompt = `Generate exactly ${aiForm.count} multiple-choice questions (MCQs) for a medical entrance exam.

Subject: ${subjectName}
Topic: ${aiForm.topic}
Difficulty: ${aiForm.difficulty}

Requirements:
- Each question must have exactly 4 options (A, B, C, D)
- Only one correct answer per question
- Include a brief explanation for the correct answer
- Questions should be appropriate for MDCAT/medical entrance level
- Vary the correct answer position across questions

Return ONLY a valid JSON array with this exact structure (no markdown, no extra text):
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
]

The correct_option field must be lowercase: "a", "b", "c", or "d".`;

    try {
      const response = await getChatCompletion(
        'OPEN_AI',
        'gpt-4o',
        [
          { role: 'system', content: 'You are an expert medical educator creating MCQ questions for medical entrance exams. Always respond with valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        { max_completion_tokens: 4000 }
      );

      const content = response.choices[0]?.message?.content || '';
      // Strip markdown code blocks if present
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
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

    // Map the AI's option_a..d + correct_option to this DB's real schema:
    // options[] array + a correct_answer LETTER (A–D) + is_published.
    const payload = aiPreview.map(q => ({
      subject_id: aiForm.subject_id || null,
      chapter_id: null,
      question_text: q.question_text,
      options: [q.option_a, q.option_b, q.option_c, q.option_d],
      correct_answer: String(q.correct_option ?? 'a').trim().toUpperCase().replace(/[^A-D]/g, '').slice(0, 1) || 'A',
      explanation: q.explanation || null,
      difficulty: aiForm.difficulty,
      is_published: true,
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

  const removeAIPreviewQuestion = (index: number) => {
    setAIPreview(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!form.question_text.trim()) { setError('Question text is required'); return; }
    if (!form.option_a.trim() || !form.option_b.trim() || !form.option_c.trim() || !form.option_d.trim()) {
      setError('All 4 options are required'); return;
    }
    setSaving(true); setError(null);
    // Map the UI form to this DB's real schema: options[] + correct_answer LETTER + is_published.
    const payload = {
      subject_id: form.subject_id || null, chapter_id: form.chapter_id || null,
      question_text: form.question_text.trim(),
      options: [form.option_a.trim(), form.option_b.trim(), form.option_c.trim(), form.option_d.trim()],
      correct_answer: String(form.correct_option).toUpperCase().replace(/[^A-D]/g, '').slice(0, 1) || 'A',
      explanation: form.explanation.trim() || null,
      difficulty: form.difficulty,
      is_published: form.is_active,
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

  const handleBulkImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    const text = await file.text();
    const lines = text.split('\n').filter(l => l.trim());
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    let successCount = 0;
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].match(/(".*?"|[^,]+)(?=,|$)/g)?.map(v => v.replace(/^"|"$/g, '').trim()) || [];
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => { row[h] = values[idx] || ''; });

        if (!row.question_text || !row.option_a || !row.option_b || !row.option_c || !row.option_d || !row.correct_option) {
          errors.push(`Row ${i}: Missing required fields`); continue;
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
          subject_id: subjectId, chapter_id: chapterId,
          question_text: row.question_text,
          options: [row.option_a, row.option_b, row.option_c, row.option_d],
          correct_answer: String(row.correct_option).toUpperCase().replace(/[^A-D]/g, '').slice(0, 1) || 'A',
          explanation: row.explanation || null,
          difficulty: (['easy', 'medium', 'hard'].includes(row.difficulty) ? row.difficulty : 'medium') as 'easy' | 'medium' | 'hard',
          is_published: true,
        });
        if (err) errors.push(`Row ${i}: ${err.message}`);
        else successCount++;
      } catch {
        errors.push(`Row ${i}: Parse error`);
      }
    }
    setImportResult({ success: successCount, failed: errors.length, errors: errors.slice(0, 5) });
    setImporting(false);
    if (successCount > 0) { showSuccess(`Imported ${successCount} questions`); fetchQuestions(); }
    if (fileRef.current) fileRef.current.value = '';
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'questions_template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const closeEnhanceModal = () => {
    setEnhanceQuestion(null);
    setEnhanceResult(null);
  };

  const openEnhanceModal = (q: Question) => {
    setEnhanceQuestion(q);
    setEnhanceResult(null);
  };

  const handleAIEnhance = async (q: Question) => {
    setEnhancing(true);
    setEnhanceResult(null);
    setError(null);

    const correctOptionText = (q as any)[`option_${q.correct_option}`];
    const prompt = `You are an expert medical educator. Given the following MCQ question, generate:
1. An "alternative_explanation" — a clear, student-friendly explanation of WHY the correct answer is right, using a different approach or analogy than a typical textbook. Keep it concise (2-4 sentences).
2. A "hint" — a short hint (1-2 sentences) that guides a student toward the correct answer WITHOUT revealing it directly.

Question: ${q.question_text}
Options:
A. ${q.option_a}
B. ${q.option_b}
C. ${q.option_c}
D. ${q.option_d}
Correct Answer: ${q.correct_option.toUpperCase()}. ${correctOptionText}
${q.explanation ? `Existing Explanation: ${q.explanation}` : ''}

Return ONLY valid JSON with this exact structure (no markdown, no extra text):
{
  "alternative_explanation": "...",
  "hint": "..."
}`;

    try {
      const response = await getChatCompletion(
        'OPEN_AI',
        'gpt-4o',
        [
          { role: 'system', content: 'You are an expert medical educator. Always respond with valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        { max_completion_tokens: 600 }
      );

      const content = response.choices[0]?.message?.content || '';
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed: AIEnhanceResult = JSON.parse(jsonStr);

      if (!parsed.alternative_explanation || !parsed.hint) {
        throw new Error('Invalid response format from AI');
      }

      setEnhanceResult(parsed);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate enhancements';
      setError(`AI enhancement failed: ${message}`);
    } finally {
      setEnhancing(false);
    }
  };

  const handleSaveEnhancement = async () => {
    if (!enhanceQuestion || !enhanceResult) return;
    setEnhanceSaving(true);
    setError(null);

    const { error: err } = await supabase
      .from('questions')
      .update({
        explanation: enhanceResult.alternative_explanation,
        hint: enhanceResult.hint,
      })
      .eq('id', enhanceQuestion.id);

    if (err) {
      setError(err.message);
    } else {
      showSuccess('Question enhanced and saved successfully!');
      closeEnhanceModal();
      fetchQuestions();
    }
    setEnhanceSaving(false);
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
            <h1 className="text-lg font-bold text-foreground">Questions Management</h1>
            <p className="text-xs text-muted-foreground">MCQ bank · {totalCount} total</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowAIGenerate(!showAIGenerate); setShowImport(false); setAIPreview([]); }}
            className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-purple-600 border border-purple-200 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors"
          >
            <Sparkles size={14} /> Generate with AI
          </button>
          <button onClick={() => setShowImport(!showImport)} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-muted-foreground border border-border rounded-xl hover:text-foreground hover:border-primary/30 transition-colors">
            <Upload size={14} /> Bulk Import
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors">
            <Plus size={16} /> Add Question
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {error && (
          <div className="mb-4 flex items-center gap-2 bg-error-light text-error px-4 py-3 rounded-xl text-sm">
            <AlertCircle size={16} /> {error}
            <button onClick={() => setError(null)} className="ml-auto"><X size={14} /></button>
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-center gap-2 bg-success-light text-success px-4 py-3 rounded-xl text-sm">
            <CheckCircle2 size={16} /> {success}
          </div>
        )}

        {/* AI Generate Panel */}
        {showAIGenerate && (
          <div className="mb-5 bg-card border border-purple-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Sparkles size={16} className="text-purple-600" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground text-sm">AI Question Generator</h2>
                  <p className="text-xs text-muted-foreground">Auto-generate MCQs using SamyakGURU</p>
                </div>
              </div>
              <button onClick={closeAIGenerate} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"><X size={16} /></button>
            </div>

            <div className="grid sm:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Subject *</label>
                <select
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-purple-400"
                  value={aiForm.subject_id}
                  onChange={e => setAIForm(f => ({ ...f, subject_id: e.target.value }))}
                >
                  <option value="">Select subject...</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.display_name}</option>)}
                </select>
              </div>
              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Topic / Chapter *</label>
                <input
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-purple-400"
                  placeholder="e.g. Cell Biology, Thermodynamics..."
                  value={aiForm.topic}
                  onChange={e => setAIForm(f => ({ ...f, topic: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Difficulty</label>
                <select
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-purple-400"
                  value={aiForm.difficulty}
                  onChange={e => setAIForm(f => ({ ...f, difficulty: e.target.value as 'easy' | 'medium' | 'hard' }))}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Count (1–20)</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-purple-400"
                  value={aiForm.count}
                  onChange={e => setAIForm(f => ({ ...f, count: Math.min(20, Math.max(1, parseInt(e.target.value) || 1)) }))}
                />
              </div>
            </div>

            <button
              onClick={handleAIGenerate}
              disabled={aiGenerating || !aiForm.subject_id || !aiForm.topic.trim()}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-60"
            >
              {aiGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {aiGenerating ? 'Generating...' : `Generate ${aiForm.count} Questions`}
            </button>

            {/* Preview Generated Questions */}
            {aiPreview.length > 0 && (
              <div className="mt-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-foreground">{aiPreview.length} questions generated — review before saving</p>
                  <button
                    onClick={handleSaveAIQuestions}
                    disabled={aiSaving || aiPreview.length === 0}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-success text-white rounded-xl hover:bg-success/90 transition-colors disabled:opacity-60"
                  >
                    {aiSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    {aiSaving ? 'Saving...' : `Save All ${aiPreview.length} Questions`}
                  </button>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {aiPreview.map((q, idx) => (
                    <div key={idx} className="bg-background border border-border rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground mb-2">{idx + 1}. {q.question_text}</p>
                          <div className="grid grid-cols-2 gap-1.5 mb-2">
                            {(['a', 'b', 'c', 'd'] as const).map(opt => (
                              <div key={opt} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs ${q.correct_option === opt ? 'bg-success-light text-success font-semibold' : 'bg-muted text-muted-foreground'}`}>
                                <span className="font-bold uppercase">{opt}.</span>
                                <span>{(q as any)[`option_${opt}`]}</span>
                              </div>
                            ))}
                          </div>
                          {q.explanation && (
                            <p className="text-xs text-muted-foreground italic">💡 {q.explanation}</p>
                          )}
                        </div>
                        <button
                          onClick={() => removeAIPreviewQuestion(idx)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-error hover:bg-error-light transition-colors shrink-0"
                          title="Remove this question"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bulk Import Panel */}
        {showImport && (
          <div className="mb-5 bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-foreground text-sm">Bulk Import Questions (CSV)</h2>
              <button onClick={() => setShowImport(false)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"><X size={16} /></button>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Upload a CSV file with columns: <code className="bg-muted px-1 rounded text-xs">question_text, option_a, option_b, option_c, option_d, correct_option, explanation, difficulty, subject_name, chapter_title</code></p>
            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={downloadTemplate} className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-primary border border-primary/30 rounded-xl hover:bg-primary/5 transition-colors">
                <Download size={13} /> Download Template
              </button>
              <label className="flex items-center gap-2 px-3 py-2 text-xs font-semibold bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors cursor-pointer">
                {importing ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                {importing ? 'Importing...' : 'Choose CSV File'}
                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleBulkImport} disabled={importing} />
              </label>
            </div>
            {importResult && (
              <div className="mt-3 p-3 bg-muted/50 rounded-xl text-xs">
                <p className="font-semibold text-foreground">Import Result: <span className="text-success">{importResult.success} imported</span>{importResult.failed > 0 && <span className="text-error ml-2">{importResult.failed} failed</span>}</p>
                {importResult.errors.map((e, i) => <p key={i} className="text-error mt-1">{e}</p>)}
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary"
              placeholder="Search questions..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
            />
          </div>
          <select className="px-3 py-2 bg-card border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary" value={filterSubject} onChange={e => { setFilterSubject(e.target.value); setPage(0); }}>
            <option value="all">All Subjects</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.display_name}</option>)}
          </select>
          <select className="px-3 py-2 bg-card border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary" value={filterDiff} onChange={e => { setFilterDiff(e.target.value); setPage(0); }}>
            <option value="all">All Difficulty</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        {/* Question Form */}
        {showForm && (
          <div className="mb-6 bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-foreground text-sm">{editingId ? 'Edit Question' : 'Add New Question'}</h2>
              <button onClick={closeForm} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"><X size={16} /></button>
            </div>
            <div className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Subject</label>
                  <select className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary" value={form.subject_id} onChange={e => setForm(f => ({ ...f, subject_id: e.target.value, chapter_id: '' }))}>
                    <option value="">Select subject...</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.display_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Chapter</label>
                  <select className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary" value={form.chapter_id} onChange={e => setForm(f => ({ ...f, chapter_id: e.target.value }))}>
                    <option value="">Select chapter...</option>
                    {filteredChapters.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Difficulty</label>
                  <select className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary" value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value as 'easy' | 'medium' | 'hard' }))}>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Question Text *</label>
                <textarea className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary resize-none" rows={3} value={form.question_text} onChange={e => setForm(f => ({ ...f, question_text: e.target.value }))} placeholder="Enter the question..." />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {(['a', 'b', 'c', 'd'] as const).map(opt => (
                  <div key={opt} className={`relative rounded-xl border-2 transition-colors ${form.correct_option === opt ? 'border-success bg-success-light/30' : 'border-border'}`}>
                    <div className="flex items-center gap-2 px-3 py-2">
                      <button onClick={() => setForm(f => ({ ...f, correct_option: opt }))} className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${form.correct_option === opt ? 'bg-success text-white' : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'}`}>
                        {opt.toUpperCase()}
                      </button>
                      <input className="flex-1 bg-transparent text-sm text-foreground focus:outline-none" value={(form as any)[`option_${opt}`]} onChange={e => setForm(f => ({ ...f, [`option_${opt}`]: e.target.value }))} placeholder={`Option ${opt.toUpperCase()}...`} />
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Explanation (optional)</label>
                <textarea className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary resize-none" rows={2} value={form.explanation} onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))} placeholder="Explain why the correct answer is right..." />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-muted-foreground">Premium</label>
                  <button onClick={() => setForm(f => ({ ...f, is_premium: !f.is_premium }))} className={`transition-colors ${form.is_premium ? 'text-chem' : 'text-muted-foreground'}`}>
                    {form.is_premium ? <Lock size={18} /> : <Unlock size={18} />}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-muted-foreground">Active</label>
                  <button onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))} className={`transition-colors ${form.is_active ? 'text-success' : 'text-muted-foreground'}`}>
                    {form.is_active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={closeForm} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-xl hover:bg-muted transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {editingId ? 'Save Changes' : 'Create Question'}
              </button>
            </div>
          </div>
        )}

        {/* Questions List */}
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-primary" /></div>
        ) : questions.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-2xl">
            <Zap size={40} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-sm font-semibold text-foreground">No questions found</p>
            <p className="text-xs text-muted-foreground mt-1">Add questions manually or import via CSV</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {questions.map((q, idx) => (
                <div key={q.id} className="bg-card border border-border rounded-xl p-4 hover:border-primary/20 transition-colors">
                  <div className="flex items-start gap-3">
                    <span className="text-xs text-muted-foreground font-mono mt-0.5 shrink-0 w-6">{page * PAGE_SIZE + idx + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground font-medium leading-snug line-clamp-2">{q.question_text}</p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {q.subjects && <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${SUBJECT_COLORS[q.subjects.name] || 'bg-muted text-muted-foreground'}`}>{q.subjects.display_name}</span>}
                        {q.chapters && <span className="text-xs text-muted-foreground">· {q.chapters.title}</span>}
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DIFF_COLORS[q.difficulty]}`}>{q.difficulty}</span>
                        {q.is_premium && <span className="text-xs bg-chem-light text-chem px-2 py-0.5 rounded-full font-semibold">PRO</span>}
                        {!q.is_active && <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Inactive</span>}
                        <span className="text-xs text-success font-semibold ml-auto">✓ {q.correct_option.toUpperCase()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => openEnhanceModal(q)} className="p-2 rounded-lg text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="Enhance with AI"><Lightbulb size={14} /></button>
                      <button onClick={() => openEdit(q)} className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"><Pencil size={14} /></button>
                      {deleteConfirm === q.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleDelete(q.id)} className="px-2 py-1 text-xs font-semibold bg-error text-white rounded-lg">Confirm</button>
                          <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 text-xs text-muted-foreground border border-border rounded-lg">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirm(q.id)} className="p-2 rounded-lg text-muted-foreground hover:text-error hover:bg-error-light transition-colors"><Trash2 size={14} /></button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-xs text-muted-foreground">Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount}</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="px-3 py-1.5 text-xs font-semibold border border-border rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors">Prev</button>
                  <span className="text-xs text-muted-foreground">{page + 1} / {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="px-3 py-1.5 text-xs font-semibold border border-border rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* AI Enhance Modal */}
      {enhanceQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <Lightbulb size={16} className="text-indigo-600" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground text-sm">AI Enhance Question</h2>
                  <p className="text-xs text-muted-foreground">Generate alternative explanation & hint</p>
                </div>
              </div>
              <button onClick={closeEnhanceModal} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Question Preview */}
              <div className="bg-muted/40 rounded-xl p-4">
                <p className="text-xs font-semibold text-muted-foreground mb-1.5">QUESTION</p>
                <p className="text-sm text-foreground font-medium leading-snug">{enhanceQuestion.question_text}</p>
                <div className="grid grid-cols-2 gap-1.5 mt-3">
                  {(['a', 'b', 'c', 'd'] as const).map(opt => (
                    <div key={opt} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs ${enhanceQuestion.correct_option === opt ? 'bg-success-light text-success font-semibold' : 'bg-background text-muted-foreground'}`}>
                      <span className="font-bold uppercase">{opt}.</span>
                      <span>{(enhanceQuestion as any)[`option_${opt}`]}</span>
                    </div>
                  ))}
                </div>
                {enhanceQuestion.explanation && (
                  <p className="text-xs text-muted-foreground mt-2 italic">Current explanation: {enhanceQuestion.explanation}</p>
                )}
              </div>

              {/* Generate Button */}
              {!enhanceResult && (
                <button
                  onClick={() => handleAIEnhance(enhanceQuestion)}
                  disabled={enhancing}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60"
                >
                  {enhancing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  {enhancing ? 'Generating enhancements...' : 'Generate Alternative Explanation & Hint'}
                </button>
              )}

              {/* Generated Results */}
              {enhanceResult && (
                <div className="space-y-3">
                  <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={14} className="text-indigo-600" />
                      <p className="text-xs font-bold text-indigo-700 uppercase tracking-wide">Alternative Explanation</p>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{enhanceResult.alternative_explanation}</p>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb size={14} className="text-amber-600" />
                      <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">Student Hint</p>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{enhanceResult.hint}</p>
                  </div>

                  <p className="text-xs text-muted-foreground">Saving will replace the current explanation with the alternative explanation and add the hint to the question.</p>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleAIEnhance(enhanceQuestion)}
                      disabled={enhancing || enhanceSaving}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground border border-border rounded-xl hover:text-foreground hover:bg-muted transition-colors disabled:opacity-60"
                    >
                      <RefreshCw size={13} /> Regenerate
                    </button>
                    <button
                      onClick={handleSaveEnhancement}
                      disabled={enhanceSaving}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-success text-white rounded-xl hover:bg-success/90 transition-colors disabled:opacity-60 ml-auto"
                    >
                      {enhanceSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      {enhanceSaving ? 'Saving...' : 'Save Enhancements'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  async function handleDelete(id: string) {
    const { error: err } = await supabase.from('questions').delete().eq('id', id);
    if (err) setError(err.message);
    else { showSuccess('Question deleted'); setDeleteConfirm(null); fetchQuestions(); }
  }
}
