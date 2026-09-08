'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Download,
  CheckCircle2,
  Calendar,
  Search,
  Filter,
  ArrowRight,
  BookOpen,
  Eye,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import { SEE_PAST_PAPERS, SeePastPaper } from '@/lib/data/seePastPapersData';

export default function SeePastPapersTab() {
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [expandedPaperId, setExpandedPaperId] = useState<string | null>(SEE_PAST_PAPERS[0]?.id || null);

  const toggleExpand = (id: string) => {
    setExpandedPaperId(expandedPaperId === id ? null : id);
  };

  const filteredPapers = SEE_PAST_PAPERS.filter((p) => {
    if (selectedSubject !== 'all' && p.subject !== selectedSubject) return false;
    if (selectedYear !== 'all' && !p.yearBikram.includes(selectedYear)) return false;
    return true;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-black">
            <FileText size={14} /> 10-YEAR OFFICIAL NEB ARCHIVES (2072–2081)
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-foreground">
            SEE Past Year Question Papers &amp; Solutions
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Download genuine board exam question papers from the past decade with official CDC marking criteria and complete step-by-step handwritten solutions.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="p-4 rounded-2xl bg-muted/40 border border-border text-center">
            <div className="text-xl font-black text-foreground">100%</div>
            <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Solved</div>
          </div>
          <div className="p-4 rounded-2xl bg-muted/40 border border-border text-center">
            <div className="text-xl font-black text-foreground">50+</div>
            <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Board Sets</div>
          </div>
        </div>
      </div>

      {/* Filters (Subject & Year) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          {[
            { id: 'all', label: 'All Subjects' },
            { id: 'science', label: '🔬 Science' },
            { id: 'math', label: '📐 Comp Math' },
            { id: 'opt_math', label: '📊 Opt Math' },
            { id: 'english', label: '📚 English' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedSubject(tab.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedSubject === tab.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-muted-foreground">Year:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-muted border border-border text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Years (2077–2081)</option>
            <option value="2081">2081 BS (Latest)</option>
            <option value="2080">2080 BS</option>
            <option value="2079">2079 BS</option>
            <option value="2078">2078 BS</option>
            <option value="2077">2077 BS</option>
          </select>
        </div>
      </div>

      {/* Past Papers List */}
      <div className="space-y-4">
        {filteredPapers.map((paper) => {
          const isExpanded = expandedPaperId === paper.id;

          return (
            <div
              key={paper.id}
              className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden transition-all hover:border-border/80"
            >
              {/* Paper Header Row */}
              <div className="p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black font-mono">
                      {paper.yearBikram}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground text-[11px] font-bold">
                      {paper.examType} Exam
                    </span>
                    {paper.province && (
                      <span className="text-xs text-muted-foreground">
                        • {paper.province}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-foreground">
                    {paper.subjectName} — Official Board Paper
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {paper.questionsSummary} • Time: {paper.timeAllowed} • Full Marks: {paper.totalMarks}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-end lg:self-center">
                  <a
                    href={paper.pdfUrl}
                    download
                    className="px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Download size={13} />
                    <span>Download Paper PDF</span>
                  </a>

                  {paper.solutionPdfUrl && (
                    <a
                      href={paper.solutionPdfUrl}
                      download
                      className="px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <CheckCircle2 size={13} />
                      <span>Solved Key PDF</span>
                    </a>
                  )}

                  <button
                    onClick={() => toggleExpand(paper.id)}
                    className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-black flex items-center gap-1.5 transition-all"
                  >
                    <span>{isExpanded ? 'Hide Preview' : 'View Questions & Solutions'}</span>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
              </div>

              {/* Expandable Question Preview with Verified Solutions */}
              {isExpanded && (
                <div className="border-t border-border bg-muted/20 p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase text-foreground tracking-wider flex items-center gap-2">
                      <Sparkles size={14} className="text-primary" />
                      <span>Sample Solved Questions from {paper.yearBikram} Paper</span>
                    </h4>
                    <span className="text-[11px] font-bold text-muted-foreground">
                      Marking Criteria: CDC Official Model
                    </span>
                  </div>

                  <div className="grid gap-4">
                    {paper.sampleQuestions.map((q, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-card border border-border space-y-2.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-black text-primary">
                            {q.group} • {q.marks} Mark{q.marks > 1 ? 's' : ''}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-foreground">
                          Q: {q.question}
                        </p>
                        <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs space-y-1">
                          <span className="font-black text-emerald-600 dark:text-emerald-400 block text-[11px] uppercase tracking-wider">
                            Verified Board Solution:
                          </span>
                          <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                            {q.answer}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
