'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Download,
  Loader2,
  ArrowRight,
  Database,
  Layers,
  Sparkles,
  HelpCircle,
  FolderOpen,
} from 'lucide-react';

export default function SeeImporterClient() {
  const [isDark, setIsDark] = useState(false);
  const [importMode, setImportMode] = useState<'questions' | 'lessons' | 'digest'>('questions');
  const [importText, setImportText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [report, setReport] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sampleQuestionCsv = `subject,chapter,subtopic,section,marks,difficulty,year,question,solution,exam_tip
science,Force & Gravitation,Acceleration due to gravity,1,1,Easy,NEB 2080,Define acceleration due to gravity.,Acceleration produced under Earth gravity without air resistance.,Mention SI unit (m/s2)
math,Mensuration,Cone and Sphere,2,2,Easy,NEB 2080,Find TSA of sphere with radius 7cm.,TSA = 4*pi*r^2 = 616 cm2.,Use 22/7 for pi
opt_math,Matrices,Cramer's Rule,4,4,Medium,NEB 2080,Solve 3x+2y=12 and 2x+3y=13.,D=5; Dx=10; Dy=15; x=2; y=3.,Calculate determinants step by step
english,Guided Writing,Formal Letter,4,5,Medium,NEB 2080,Write a letter to the editor regarding traffic.,Format: Address; Date; Subject; Body; Sign-off.,Include 3 body paragraphs`;

  const sampleLessonCsv = `course_id,subject,chapter,lesson_title,video_url,thumbnail,duration,description,order,is_free
see_class_10,physics,Force and Gravity,Universal Law of Gravitation,https://vz-11253e6e-275.b-cdn.net/see-phy-1/playlist.m3u8,https://images.unsplash.com/photo-1635070041078-e363dbe005cb,1680,Newton's gravitation law derivation,1,true
see_class_10,chemistry,Periodic Table,Modern Periodic Law & Groups,https://vz-11253e6e-275.b-cdn.net/see-chem-1/playlist.m3u8,https://images.unsplash.com/photo-1532094349884-543bc11b234d,1540,Periodic properties and valence electrons,1,false`;

  const handleDownloadSample = () => {
    const csvContent = importMode === 'questions' ? sampleQuestionCsv : sampleLessonCsv;
    const filename = importMode === 'questions' ? 'see_question_bank_template.csv' : 'see_video_lessons_template.csv';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCsvToJson = (csv: string) => {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map((h) => h.trim());

    return lines.slice(1).map((line) => {
      const values = line.split(',').map((v) => v.trim());
      const obj: Record<string, any> = {};
      headers.forEach((h, i) => {
        obj[h] = values[i] || '';
      });
      return obj;
    });
  };

  const handleRunImport = async () => {
    if (!importText.trim()) {
      setError('Please paste CSV or JSON content to import.');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      setReport(null);

      let records: any[] = [];
      const trimmed = importText.trim();

      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        const parsed = JSON.parse(trimmed);
        records = Array.isArray(parsed) ? parsed : parsed.records || [];
      } else {
        records = parseCsvToJson(trimmed);
      }

      if (records.length === 0) {
        setError('No valid records found in input.');
        setIsUploading(false);
        return;
      }

      const targetEndpoint =
        importMode === 'questions'
          ? '/api/see/question-bank/bulk'
          : '/api/see/import';

      const res = await fetch(targetEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(records),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || 'Import failed');
        if (data.report) setReport(data.report);
      } else {
        setReport(data.report || { importedCount: records.length, errorCount: 0, errors: [] });
      }

      setIsUploading(false);
    } catch (err: any) {
      setError(`Error processing import: ${err.message}`);
      setIsUploading(false);
    }
  };

  return (
    <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Header */}
        <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-black border border-emerald-500/20">
                  ADMIN TOOLKIT
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  High-Speed Bulk Ingestion Engine
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-2.5">
                <Database className="text-emerald-500" size={28} />
                <span>SEE High-Speed Ingestion &amp; Bulk Importer</span>
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
                Batch import hundreds of questions (1-10 marks with solutions) or Bunny.net HD video lessons via CSV or JSON.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleDownloadSample}
                className="px-4 py-2.5 rounded-2xl bg-card border border-border hover:bg-muted text-foreground text-xs font-black flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Download size={14} />
                <span>Download {importMode === 'questions' ? 'Questions' : 'Lessons'} Template</span>
              </button>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <button
              onClick={() => {
                setImportMode('questions');
                setReport(null);
                setError(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                importMode === 'questions'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-muted/40 text-muted-foreground hover:text-foreground border border-border'
              }`}
            >
              <HelpCircle size={14} />
              <span>1. Question Bank (1-10 Marks)</span>
            </button>

            <button
              onClick={() => {
                setImportMode('lessons');
                setReport(null);
                setError(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                importMode === 'lessons'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-muted/40 text-muted-foreground hover:text-foreground border border-border'
              }`}
            >
              <Layers size={14} />
              <span>2. Bunny HD Video Lectures</span>
            </button>
          </div>
        </div>

        {/* Input Form */}
        <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-foreground flex items-center gap-2">
              <FileText size={16} className="text-emerald-500" />
              <span>Paste {importMode === 'questions' ? 'Question Bank' : 'Video Lesson'} CSV or JSON Content</span>
            </h3>
            <span className="text-[11px] font-mono text-muted-foreground">
              UTF-8 Encoded • Plaintext
            </span>
          </div>

          <textarea
            rows={10}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder={importMode === 'questions' ? sampleQuestionCsv : sampleLessonCsv}
            className="w-full p-4 rounded-2xl bg-muted/40 border border-border text-foreground font-mono text-xs focus:outline-none focus:border-emerald-500 leading-relaxed"
          />

          {error && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 text-xs flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {report && (
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
              <div className="flex items-center gap-2 text-emerald-600 font-black text-xs">
                <CheckCircle2 size={16} />
                <span>Import Finished: {report.importedCount} records successfully processed.</span>
              </div>

              {report.errorCount > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-emerald-500/20 text-xs">
                  <span className="font-bold text-amber-700 dark:text-amber-300 block">
                    Encountered {report.errorCount} skipped rows:
                  </span>
                  <ul className="list-disc pl-5 text-muted-foreground space-y-1 max-h-32 overflow-y-auto">
                    {report.errors.map((err: string, idx: number) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => {
                setImportText('');
                setReport(null);
                setError(null);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted"
            >
              Clear
            </button>

            <button
              onClick={handleRunImport}
              disabled={isUploading || !importText.trim()}
              className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs shadow-md flex items-center gap-2 transition-all"
            >
              {isUploading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Validating &amp; Ingesting...</span>
                </>
              ) : (
                <>
                  <Upload size={15} />
                  <span>Execute Bulk Ingestion</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
