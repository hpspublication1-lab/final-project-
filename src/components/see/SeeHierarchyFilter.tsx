'use client';

import React from 'react';
import {
  Filter,
  Layers,
  Sparkles,
  RotateCcw,
  SlidersHorizontal,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { SEE_SUBJECT_HIERARCHY } from '@/lib/data/seeQuestionBankData';

interface FilterState {
  subject: string;
  chapter: string;
  subtopic: string;
  section: number | 'all';
  marks: number | 'all';
  difficulty: string;
  questionType: string;
  year: string;
}

interface SeeHierarchyFilterProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
  totalFiltered: number;
}

export default function SeeHierarchyFilter({
  filters,
  onChange,
  onReset,
  totalFiltered,
}: SeeHierarchyFilterProps) {
  const currentSubjectObj = SEE_SUBJECT_HIERARCHY.find((s) => s.id === filters.subject);
  const currentChapterObj = currentSubjectObj?.chapters.find((c) => c.name === filters.chapter);

  return (
    <div className="bg-card border border-border rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-emerald-500" />
          <h3 className="text-xs font-black uppercase tracking-wider text-foreground font-mono">
            Hierarchical Examination Filter
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold">
            {totalFiltered} Questions Match
          </span>
        </div>

        <button
          onClick={onReset}
          className="text-xs font-bold text-muted-foreground hover:text-emerald-600 flex items-center gap-1 transition-colors"
        >
          <RotateCcw size={12} /> Reset Filters
        </button>
      </div>

      {/* Grid of Dropdowns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        
        {/* 1. Subject */}
        <div className="space-y-1">
          <label className="font-bold text-muted-foreground font-mono uppercase text-[10px]">
            1. Subject
          </label>
          <select
            value={filters.subject}
            onChange={(e) =>
              onChange({
                ...filters,
                subject: e.target.value,
                chapter: 'all',
                subtopic: 'all',
              })
            }
            className="w-full px-3 py-2 rounded-xl bg-muted/40 border border-border text-foreground font-bold focus:outline-none focus:border-emerald-500"
          >
            <option value="all">🌟 All Subjects</option>
            {SEE_SUBJECT_HIERARCHY.map((s) => (
              <option key={s.id} value={s.id}>
                {s.icon} {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Chapter */}
        <div className="space-y-1">
          <label className="font-bold text-muted-foreground font-mono uppercase text-[10px]">
            2. Unit / Chapter
          </label>
          <select
            value={filters.chapter}
            onChange={(e) =>
              onChange({
                ...filters,
                chapter: e.target.value,
                subtopic: 'all',
              })
            }
            disabled={filters.subject === 'all'}
            className="w-full px-3 py-2 rounded-xl bg-muted/40 border border-border text-foreground focus:outline-none focus:border-emerald-500 disabled:opacity-50"
          >
            <option value="all">All Chapters</option>
            {currentSubjectObj?.chapters.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Sub-topic */}
        <div className="space-y-1">
          <label className="font-bold text-muted-foreground font-mono uppercase text-[10px]">
            3. Sub-topic
          </label>
          <select
            value={filters.subtopic}
            onChange={(e) => onChange({ ...filters, subtopic: e.target.value })}
            disabled={filters.chapter === 'all'}
            className="w-full px-3 py-2 rounded-xl bg-muted/40 border border-border text-foreground focus:outline-none focus:border-emerald-500 disabled:opacity-50"
          >
            <option value="all">All Subtopics</option>
            {currentChapterObj?.subtopics.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        {/* 4. Section (1, 2, 3, 4) */}
        <div className="space-y-1">
          <label className="font-bold text-muted-foreground font-mono uppercase text-[10px]">
            4. Section (Tier)
          </label>
          <select
            value={filters.section}
            onChange={(e) =>
              onChange({
                ...filters,
                section: e.target.value === 'all' ? 'all' : Number(e.target.value),
              })
            }
            className="w-full px-3 py-2 rounded-xl bg-muted/40 border border-border text-foreground focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Sections (1, 2, 3, 4)</option>
            <option value={1}>Section 1 (Very Short / 1M)</option>
            <option value={2}>Section 2 (Short Answer / 2M)</option>
            <option value={3}>Section 3 (Problem Solving / 3M)</option>
            <option value={4}>Section 4 (Long &amp; HOTS / 4-10M)</option>
          </select>
        </div>

        {/* 5. Marks */}
        <div className="space-y-1">
          <label className="font-bold text-muted-foreground font-mono uppercase text-[10px]">
            5. Exact Marks
          </label>
          <select
            value={filters.marks}
            onChange={(e) =>
              onChange({
                ...filters,
                marks: e.target.value === 'all' ? 'all' : Number(e.target.value),
              })
            }
            className="w-full px-3 py-2 rounded-xl bg-muted/40 border border-border text-foreground font-bold text-emerald-600 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Any Marks</option>
            <option value={1}>1 Mark</option>
            <option value={2}>2 Marks</option>
            <option value={3}>3 Marks</option>
            <option value={4}>4 Marks</option>
            <option value={5}>5 Marks</option>
            <option value={6}>6 Marks</option>
            <option value={8}>8 Marks</option>
            <option value={10}>10 Marks</option>
          </select>
        </div>

        {/* 6. Difficulty */}
        <div className="space-y-1">
          <label className="font-bold text-muted-foreground font-mono uppercase text-[10px]">
            6. Difficulty
          </label>
          <select
            value={filters.difficulty}
            onChange={(e) => onChange({ ...filters, difficulty: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-muted/40 border border-border text-foreground focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
            <option value="Very Hard">Very Hard</option>
          </select>
        </div>

        {/* 7. Question Type */}
        <div className="space-y-1">
          <label className="font-bold text-muted-foreground font-mono uppercase text-[10px]">
            7. Question Type
          </label>
          <select
            value={filters.questionType}
            onChange={(e) => onChange({ ...filters, questionType: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-muted/40 border border-border text-foreground focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Question Types</option>
            <option value="very_short">Very Short Definition / Fact</option>
            <option value="short_answer">Short Reason / Difference</option>
            <option value="numerical">Numerical Calculation</option>
            <option value="derivation">Theorem / Formula Derivation</option>
            <option value="diagram">Laboratory / Diagram Question</option>
            <option value="long_answer">Essay / Long Analytical</option>
            <option value="hots">Higher Order Thinking (HOTS)</option>
          </select>
        </div>

        {/* 8. Year Tag */}
        <div className="space-y-1">
          <label className="font-bold text-muted-foreground font-mono uppercase text-[10px]">
            8. Exam Year
          </label>
          <select
            value={filters.year}
            onChange={(e) => onChange({ ...filters, year: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-muted/40 border border-border text-foreground focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Exam Years</option>
            <option value="NEB 2081">NEB 2081 Regular</option>
            <option value="NEB 2080">NEB 2080 Regular</option>
            <option value="NEB 2079">NEB 2079 Regular</option>
            <option value="NEB 2078">NEB 2078 Regular</option>
            <option value="Expected 2082">Expected 2082 Model</option>
          </select>
        </div>

      </div>

      {/* Active Breadcrumb Trail */}
      <div className="flex flex-wrap items-center gap-1.5 pt-2 text-[11px] text-muted-foreground font-mono">
        <span className="font-bold text-foreground">Hierarchy:</span>
        <span>SEE</span>
        <ChevronRight size={12} />
        <span className="text-emerald-600 font-bold">
          {filters.subject === 'all' ? 'All Subjects' : currentSubjectObj?.name}
        </span>
        {filters.chapter !== 'all' && (
          <>
            <ChevronRight size={12} />
            <span className="text-foreground font-bold">{filters.chapter}</span>
          </>
        )}
        {filters.subtopic !== 'all' && (
          <>
            <ChevronRight size={12} />
            <span className="text-foreground">{filters.subtopic}</span>
          </>
        )}
      </div>
    </div>
  );
}
