'use client';

import React, { useState, useEffect } from 'react';
import { useChat } from '@/lib/hooks/useChat';
import Link from 'next/link';
import { Shield, Loader2, CheckCircle, AlertTriangle, XCircle, ChevronRight, Sparkles, FileText, Zap, BarChart2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

interface ReviewResult {
  overallScore: number;
  grade: 'Excellent' | 'Good' | 'Needs Improvement' | 'Poor';
  accuracy: { score: number; issues: string[] };
  clarity: { score: number; issues: string[] };
  ceeSyllabus: { score: number; issues: string[] };
  suggestions: string[];
  approved: boolean;
  summary: string;
}

const CONTENT_TYPES = ['MCQ Question', 'Study Notes', 'Chapter Summary', 'Exam Instructions', 'Video Description'];

const SAMPLE_CONTENTS: Record<string, string> = {
  'MCQ Question': `Question: Which of the following is NOT a function of the liver?
A) Synthesis of bile
B) Detoxification of drugs
C) Production of insulin
D) Storage of glycogen

Answer: C
Explanation: Insulin is produced by the beta cells of the islets of Langerhans in the pancreas, not the liver. The liver performs bile synthesis, detoxification, and glycogen storage.`,
  'Study Notes': `Cell Division - Mitosis

Mitosis is a type of cell division that results in two daughter cells with the same number of chromosomes as the parent cell.

Phases:
1. Prophase - Chromosomes condense, spindle forms
2. Metaphase - Chromosomes align at cell plate  
3. Anaphase - Sister chromatids separate
4. Telophase - Nuclear envelope reforms

Significance: Growth, repair, and asexual reproduction`,
};

function parseReview(raw: string): ReviewResult | null {
  try {
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
  } catch {}
  return null;
}

const GRADE_COLORS: Record<string, string> = {
  Excellent: 'text-success bg-success-light border-success/20',
  Good: 'text-bio bg-bio-light border-bio/20',
  'Needs Improvement': 'text-warning bg-warning-light border-warning/20',
  Poor: 'text-error bg-error-light border-error/20',
};

const SCORE_COLOR = (score: number) =>
  score >= 80 ? 'text-success' : score >= 60 ? 'text-warning' : 'text-error';

export default function AiContentReviewClient() {
  const [contentType, setContentType] = useState('MCQ Question');
  const [content, setContent] = useState(SAMPLE_CONTENTS['MCQ Question']);
  const [subject, setSubject] = useState('Biology');
  const [review, setReview] = useState<ReviewResult | null>(null);
  const [reviewed, setReviewed] = useState(false);
  const [history, setHistory] = useState<Array<{ type: string; score: number; grade: string; approved: boolean; preview: string }>>([]);

  const { response, isLoading, error, sendMessage } = useChat('OPEN_AI', 'gpt-4o', false);

  useEffect(() => { if (error) toast.error(error.message); }, [error]);

  useEffect(() => {
    if (response && !isLoading && reviewed) {
      const parsed = parseReview(response);
      if (parsed) {
        setReview(parsed);
        setHistory((prev) => [
          { type: contentType, score: parsed.overallScore, grade: parsed.grade, approved: parsed.approved, preview: content.slice(0, 60) + '…' },
          ...prev.slice(0, 9),
        ]);
      } else {
        toast.error('Could not parse review. Please try again.');
      }
    }
  }, [response, isLoading]);

  const handleReview = () => {
    if (!content.trim()) {
      toast.error('Please enter content to review.');
      return;
    }
    setReviewed(true);
    setReview(null);

    const prompt = `You are a senior academic content reviewer for Nepal's CEE medical entrance exam platform. Review the following content for quality, accuracy, and suitability.

Content Type: ${contentType}
Subject: ${subject}
Content:
---
${content}
---

Return ONLY valid JSON (no extra text):
{
  "overallScore": 85,
  "grade": "Good",
  "accuracy": {
    "score": 90,
    "issues": ["Issue 1 if any", "Issue 2 if any"]
  },
  "clarity": {
    "score": 80,
    "issues": ["Issue 1 if any"]
  },
  "ceeSyllabus": {
    "score": 85,
    "issues": ["Issue 1 if any"]
  },
  "suggestions": ["Specific improvement suggestion 1", "Suggestion 2", "Suggestion 3"],
  "approved": true,
  "summary": "2-3 sentence overall assessment"
}

Scoring criteria:
- accuracy: factual correctness, no errors
- clarity: language clarity, appropriate difficulty level
- ceeSyllabus: relevance to Nepal CEE 2026 syllabus
- overallScore: weighted average
- approved: true if overallScore >= 70
- grade: "Excellent" (90+), "Good" (75-89), "Needs Improvement" (60-74), "Poor" (<60)
- issues: empty array [] if no issues found`;

    sendMessage([{ role: 'user', content: prompt }], { max_completion_tokens: 1500 });
  };

  const handleContentTypeChange = (t: string) => {
    setContentType(t);
    setContent(SAMPLE_CONTENTS[t] || '');
    setReview(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-14 bg-card border-b border-border flex items-center px-6 gap-4 sticky top-0 z-10">
        <Link href="/admin" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm transition-colors">
          <ArrowLeft size={15} />
          Admin
        </Link>
        <span className="text-border">/</span>
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-primary" />
          <span className="text-sm font-bold text-foreground">AI Content Quality Review</span>
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground bg-success-light text-success px-2.5 py-1 rounded-full font-semibold">
          <Sparkles size={11} />
          SamyakGURU Powered
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Input */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-primary" />
                <p className="text-sm font-bold text-foreground">Content to Review</p>
              </div>

              {/* Content type */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Content Type</p>
                <div className="flex flex-wrap gap-2">
                  {CONTENT_TYPES.map((t) => (
                    <button key={t} onClick={() => handleContentTypeChange(t)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${contentType === t ? 'bg-secondary text-primary border-primary/20' : 'bg-muted text-muted-foreground border-transparent hover:border-border'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Subject</p>
                <div className="flex flex-wrap gap-2">
                  {['Biology', 'Chemistry', 'Physics', 'Mental Agility', 'General'].map((s) => (
                    <button key={s} onClick={() => setSubject(s)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${subject === s ? 'bg-secondary text-primary border-primary/20' : 'bg-muted text-muted-foreground border-transparent hover:border-border'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content textarea */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Content</p>
                <textarea
                  value={content}
                  onChange={(e) => { setContent(e.target.value); setReview(null); }}
                  rows={12}
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none focus:border-primary/40 transition-colors font-mono leading-relaxed"
                  placeholder="Paste your content here for AI quality review…"
                />
              </div>

              <button onClick={handleReview} disabled={isLoading || !content.trim()} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                {isLoading ? <><Loader2 size={15} className="animate-spin" />Reviewing Content…</> : <><Shield size={15} />Run AI Quality Review</>}
              </button>
            </div>

            {/* Review results */}
            {review && (
              <div className="space-y-4">
                {/* Overall */}
                <div className={`border rounded-2xl p-5 ${review.approved ? 'bg-success-light border-success/20' : 'bg-error-light border-error/20'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {review.approved
                        ? <CheckCircle size={18} className="text-success" />
                        : <XCircle size={18} className="text-error" />}
                      <span className={`text-sm font-bold ${review.approved ? 'text-success' : 'text-error'}`}>
                        {review.approved ? 'Approved for Publishing' : 'Needs Revision Before Publishing'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl font-black ${SCORE_COLOR(review.overallScore)}`}>{review.overallScore}</span>
                      <span className="text-sm text-muted-foreground">/100</span>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${GRADE_COLORS[review.grade]}`}>{review.grade}</span>
                    </div>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{review.summary}</p>
                </div>

                {/* Score breakdown */}
                <div className="bg-card border border-border rounded-2xl p-5">
                  <p className="text-sm font-bold text-foreground mb-4">Score Breakdown</p>
                  <div className="space-y-4">
                    {[
                      { label: 'Factual Accuracy', data: review.accuracy },
                      { label: 'Clarity & Language', data: review.clarity },
                      { label: 'CEE Syllabus Relevance', data: review.ceeSyllabus },
                    ].map(({ label, data }) => (
                      <div key={label}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium text-foreground">{label}</span>
                          <span className={`text-sm font-bold ${SCORE_COLOR(data.score)}`}>{data.score}/100</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${data.score >= 80 ? 'bg-success' : data.score >= 60 ? 'bg-warning' : 'bg-error'}`}
                            style={{ width: `${data.score}%` }}
                          />
                        </div>
                        {data.issues?.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {data.issues.map((issue, i) => (
                              <div key={i} className="flex items-start gap-1.5">
                                <AlertTriangle size={11} className="text-warning shrink-0 mt-0.5" />
                                <p className="text-xs text-muted-foreground">{issue}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Suggestions */}
                {review.suggestions?.length > 0 && (
                  <div className="bg-card border border-border rounded-2xl p-5">
                    <p className="text-sm font-bold text-foreground mb-3">Improvement Suggestions</p>
                    <div className="space-y-2">
                      {review.suggestions.map((s, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <ChevronRight size={14} className="text-primary shrink-0 mt-0.5" />
                          <p className="text-sm text-foreground leading-relaxed">{s}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: History + Stats */}
          <div className="space-y-5">
            {/* Stats */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 size={15} className="text-primary" />
                <p className="text-sm font-bold text-foreground">Session Stats</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Reviewed', value: history.length, color: 'text-primary' },
                  { label: 'Approved', value: history.filter((h) => h.approved).length, color: 'text-success' },
                  { label: 'Rejected', value: history.filter((h) => !h.approved).length, color: 'text-error' },
                  { label: 'Avg Score', value: history.length ? Math.round(history.reduce((a, h) => a + h.score, 0) / history.length) : '—', color: 'text-ma' },
                ].map((s) => (
                  <div key={s.label} className="bg-muted rounded-xl p-3 text-center">
                    <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Review history */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-bold text-foreground">Review History</p>
              </div>
              {history.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Zap size={24} className="text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No reviews yet. Submit content to begin.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {history.map((h, i) => (
                    <div key={i} className="px-4 py-3 flex items-start gap-2.5">
                      {h.approved
                        ? <CheckCircle size={13} className="text-success shrink-0 mt-0.5" />
                        : <XCircle size={13} className="text-error shrink-0 mt-0.5" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground">{h.type}</p>
                        <p className="text-xs text-muted-foreground truncate">{h.preview}</p>
                      </div>
                      <span className={`text-xs font-bold shrink-0 ${SCORE_COLOR(h.score)}`}>{h.score}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick links */}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">AI Tools</p>
              {[
                { label: 'MCQ Generator', href: '/mcq-generator', icon: Zap },
                { label: 'AI Tutor', href: '/ai-tutor', icon: Sparkles },
                { label: 'Study Plan', href: '/study-plan', icon: FileText },
              ].map((link) => (
                <Link key={link.label} href={link.href}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <link.icon size={14} />
                  {link.label}
                  <ChevronRight size={12} className="ml-auto" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
