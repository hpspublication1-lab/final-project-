'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Printer,
  Download,
  BookOpen,
  Sparkles,
  CheckCircle2,
  Clock,
  Eye,
  X,
  Share2
} from 'lucide-react';
import {
  SEE_SUBJECT_MANUALS,
  PRINTABLE_EXAM_PAPERS,
  SeeManualItem,
  PrintableExamPaper
} from '@/lib/data/seePrintablesData';

export default function SeeManualsAndPrintablesTab() {
  const [activeSubTab, setActiveSubTab] = useState<'MANUALS' | 'PRINTABLES'>('PRINTABLES');
  const [activePrintPaper, setActivePrintPaper] = useState<PrintableExamPaper | null>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black">
            <Printer size={14} /> PRINT-READY OFFLINE STUDY VAULT
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-foreground">
            Subject Manuals &amp; Printable Practice Papers
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Download official CDC Curriculum Manuals for all 6 subjects and print real A4-format board simulation papers with ruled answer lines for authentic pen-and-paper mock practice.
          </p>
        </div>

        {/* SubTab Switcher */}
        <div className="flex items-center gap-2 bg-muted/60 p-1.5 rounded-2xl border border-border shrink-0 text-xs font-black">
          <button
            onClick={() => setActiveSubTab('PRINTABLES')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              activeSubTab === 'PRINTABLES'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Printer size={14} />
            <span>Printable Exam Papers</span>
          </button>
          <button
            onClick={() => setActiveSubTab('MANUALS')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              activeSubTab === 'MANUALS'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BookOpen size={14} />
            <span>CDC Subject Manuals</span>
          </button>
        </div>
      </div>

      {/* SUBTAB 1: PRINTABLE PRACTICE EXAM PAPERS */}
      {activeSubTab === 'PRINTABLES' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {PRINTABLE_EXAM_PAPERS.map((paper) => (
              <div
                key={paper.id}
                className="p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-sm hover:border-primary/50 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-primary/10 text-primary border border-primary/20">
                      {paper.paperCode}
                    </span>
                    <span className="text-xs font-mono font-bold text-muted-foreground flex items-center gap-1">
                      <Clock size={13} /> {paper.timeAllowed}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-foreground">
                    {paper.title}
                  </h3>

                  <div className="p-3.5 rounded-2xl bg-muted/30 border border-border text-xs space-y-1 text-muted-foreground">
                    <div className="font-bold text-foreground">Official Examination Parameters:</div>
                    <div>• Total Marks: {paper.totalMarks} Full Marks</div>
                    <div>• Sections: {paper.groups.length} Groups (A, B, C, D)</div>
                    <div>• Ready to print on standard A4 paper with blank answer ruling lines</div>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={() => setActivePrintPaper(paper)}
                    className="flex-1 py-3 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all"
                  >
                    <Printer size={15} />
                    <span>Open Print Preview (A4 Format)</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 2: CDC SUBJECT MANUALS */}
      {activeSubTab === 'MANUALS' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SEE_SUBJECT_MANUALS.map((manual) => (
            <div
              key={manual.id}
              className="p-6 rounded-3xl bg-card border border-border shadow-sm hover:border-border/80 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-muted text-foreground border border-border">
                    {manual.type}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {manual.fileSize} • {manual.pages} Pages
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-black text-foreground">
                  {manual.title}
                </h3>
                {manual.titleNepali && (
                  <p className="text-xs text-muted-foreground font-medium line-clamp-1 italic">
                    {manual.titleNepali}
                  </p>
                )}

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {manual.description}
                </p>

                <div className="pt-2 flex flex-wrap gap-1.5">
                  {manual.topics.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md text-[10px] bg-muted/60 text-muted-foreground"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between gap-3">
                <span className="text-[11px] font-bold text-muted-foreground">
                  {manual.downloadCount} downloads
                </span>
                <a
                  href={manual.pdfUrl}
                  download
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Download size={13} />
                  <span>Download PDF</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PRINT PREVIEW MODAL (A4 READY) */}
      {activePrintPaper && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card text-foreground rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-border overflow-hidden">
            {/* Modal Header & Print Bar (Hidden during actual print) */}
            <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-muted/40 print:hidden">
              <div className="flex items-center gap-2">
                <Printer size={18} className="text-primary" />
                <span className="text-sm font-black text-foreground">
                  Print-Ready A4 Document: {activePrintPaper.paperCode}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrint}
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs flex items-center gap-2 shadow-md transition-all"
                >
                  <Printer size={14} />
                  <span>Print Paper Now (Ctrl + P)</span>
                </button>
                <button
                  onClick={() => setActivePrintPaper(null)}
                  className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* A4 Document Paper Body (Formatted specifically for physical print) */}
            <div className="p-8 sm:p-12 overflow-y-auto space-y-8 bg-white text-slate-900 font-sans print:p-0 print:m-0">
              {/* Official Exam Header */}
              <div className="text-center space-y-1.5 border-b-2 border-slate-900 pb-4">
                <div className="text-xs font-black uppercase tracking-widest text-slate-600">
                  NATIONAL EXAMINATION BOARD (NEB) • GOVERNMENT OF NEPAL
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                  SECONDARY EDUCATION EXAMINATION (SEE) MODEL QUESTION
                </h1>
                <div className="text-sm font-bold text-slate-800">
                  Subject: {activePrintPaper.subjectName} (Code: {activePrintPaper.paperCode})
                </div>
                <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-slate-300">
                  <span>Time: {activePrintPaper.timeAllowed}</span>
                  <span>Full Marks: {activePrintPaper.totalMarks} (Pass Marks: 27)</span>
                </div>
              </div>

              {/* General Instructions */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                <div className="font-black text-slate-900">General Instructions to Candidates:</div>
                {activePrintPaper.instructions.map((inst, i) => (
                  <div key={i}>• {inst}</div>
                ))}
              </div>

              {/* Groups & Questions */}
              <div className="space-y-8">
                {activePrintPaper.groups.map((group, gIdx) => (
                  <div key={gIdx} className="space-y-4">
                    <div className="border-b border-slate-400 pb-1 flex items-center justify-between">
                      <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
                        {group.groupName}
                      </h2>
                      <span className="text-xs font-bold text-slate-600">
                        [{group.totalGroupMarks} Marks]
                      </span>
                    </div>
                    <p className="text-xs italic text-slate-600">{group.description}</p>

                    <div className="space-y-6 pt-2">
                      {group.questions.map((q) => (
                        <div key={q.qNo} className="space-y-2">
                          <div className="flex items-start justify-between gap-4 text-xs font-bold text-slate-900">
                            <span>
                              {q.qNo}. {q.question}
                            </span>
                            <span className="font-mono whitespace-nowrap text-slate-600">
                              [{q.marks}]
                            </span>
                          </div>

                          {/* Ruled lines for handwritten student answers */}
                          <div className="space-y-2 pt-1">
                            {Array.from({ length: q.answerLines }).map((_, lIdx) => (
                              <div
                                key={lIdx}
                                className="border-b border-dashed border-slate-300 h-5"
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* End of Paper Sign */}
              <div className="text-center pt-8 border-t border-slate-300 text-xs font-bold text-slate-500 uppercase tracking-widest">
                — END OF QUESTION PAPER —
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
