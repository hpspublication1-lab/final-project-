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
} from 'lucide-react';

export default function SeeImporterClient() {
  const [isDark, setIsDark] = useState(false);
  const [importText, setImportText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [report, setReport] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sampleCsv = `course_id,subject,chapter,lesson_title,video_url,thumbnail,duration,description,order,is_free
see_class_10,physics,Force and Gravity,Universal Law of Gravitation,https://vz-11253e6e-275.b-cdn.net/see-phy-1/playlist.m3u8,https://images.unsplash.com/photo-1635070041078-e363dbe005cb,1680,Newton's gravitation law derivation,1,true
see_class_10,chemistry,Periodic Table,Modern Periodic Law & Groups,https://vz-11253e6e-275.b-cdn.net/see-chem-1/playlist.m3u8,https://images.unsplash.com/photo-1532094349884-543bc11b234d,1540,Periodic properties and valence electrons,1,false
see_class_10,math,Sets and Arithmetic,Venn Diagram Cardinality Proofs,https://vz-11253e6e-275.b-cdn.net/see-math-1/playlist.m3u8,https://images.unsplash.com/photo-1596495578065-6e0763fa1178,1980,Solving 3-set problem sets,1,true`;

  const handleDownloadSample = () => {
    const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'see_class_10_content_import_template.csv');
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

      const res = await fetch('/api/see/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(records),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || 'Import failed');
        if (data.report) setReport(data.report);
      } else {
        setReport(data.report);
      }

      setIsUploading(false);
    } catch (err: any) {
      setError(err?.message || 'Error processing import payload');
      setIsUploading(false);
    }
  };

  return (
    <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-card border border-emerald-500/30 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                Admin Content Tool
              </span>
              <span className="text-xs text-muted-foreground font-semibold">Bulk Importer</span>
            </div>
            <h1 className="text-2xl font-black text-foreground">SEE Class 10 Video &amp; Content Importer</h1>
            <p className="text-xs text-muted-foreground">
              Bulk upload lessons, video streaming URLs, thumbnails, and chapter PDFs with real-time validation.
            </p>
          </div>

          <button
            onClick={handleDownloadSample}
            className="px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs flex items-center justify-center gap-2 border border-border transition-colors shrink-0"
          >
            <Download size={14} />
            <span>Download CSV Template</span>
          </button>
        </div>

        {/* Input Box & Format Guide */}
        <div className="p-6 rounded-3xl bg-card border border-border space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
              <FileText size={16} className="text-emerald-500" /> Paste CSV or JSON Data
            </h3>
            <span className="text-xs text-muted-foreground">Auto-detects format</span>
          </div>

          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={8}
            className="w-full p-4 rounded-2xl bg-muted/40 border border-border focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs font-mono text-foreground resize-none"
            placeholder={sampleCsv}
          />

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <p className="text-[11px] text-muted-foreground">
              Required fields: <strong>course_id, subject, chapter, lesson_title, video_url, duration, is_free</strong>
            </p>

            <button
              onClick={handleRunImport}
              disabled={isUploading || !importText.trim()}
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Validating &amp; Importing...</span>
                </>
              ) : (
                <>
                  <Database size={16} />
                  <span>Validate &amp; Import Content</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs font-bold text-rose-600 flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Validation & Import Report */}
        {report && (
          <div className="p-6 rounded-3xl bg-card border border-border space-y-6 shadow-sm animate-fadeIn">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-500" /> Import Summary &amp; Validation Report
              </h3>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                report.failedRecords === 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
              }`}>
                {report.successfulRecords} of {report.totalRecords} Imported
              </span>
            </div>

            {/* Metric Boxes */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3.5 rounded-2xl bg-muted/40 border border-border text-center">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Total Records</p>
                <p className="text-xl font-black text-foreground">{report.totalRecords}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <p className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300">Successful</p>
                <p className="text-xl font-black text-emerald-600">{report.successfulRecords}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
                <p className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-300">Failed</p>
                <p className="text-xl font-black text-rose-600">{report.failedRecords}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                <p className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-300">Duplicates</p>
                <p className="text-xl font-black text-amber-600">{report.duplicateRecords}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-center">
                <p className="text-[10px] uppercase font-bold text-purple-700 dark:text-purple-300">Invalid URLs</p>
                <p className="text-xl font-black text-purple-600">{report.invalidUrls}</p>
              </div>
            </div>

            {/* Error Table if any */}
            {report.errors && report.errors.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-rose-600 flex items-center gap-1.5">
                  <AlertTriangle size={14} /> Validation Errors ({report.errors.length})
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {report.errors.map((err: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 text-xs flex items-center justify-between">
                      <span className="font-bold text-foreground">Row {err.row}: {err.title}</span>
                      <span className="text-rose-600 font-semibold">{err.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
