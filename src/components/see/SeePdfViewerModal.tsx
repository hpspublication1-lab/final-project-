'use client';

import React, { useState } from 'react';
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  FileText,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Printer,
  Sparkles,
  Share2,
} from 'lucide-react';
import { SeeDigestItem } from '@/lib/data/seeDigestData';

interface SeePdfViewerModalProps {
  digest: SeeDigestItem | null;
  onClose: () => void;
  userName?: string;
  userId?: string;
}

export default function SeePdfViewerModal({
  digest,
  onClose,
  userName = 'SEE Aspirant',
  userId = 'SG-2082-USER',
}: SeePdfViewerModalProps) {
  const [zoom, setZoom] = useState<number>(100);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  if (!digest) return null;

  const totalPages = digest.pageCount || 12;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 20, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 20, 60));
  const toggleFullscreen = () => setIsFullscreen((prev) => !prev);

  const nextPage = () => setCurrentPage((p) => Math.min(p + 1, totalPages));
  const prevPage = () => setCurrentPage((p) => Math.max(p - 1, 1));

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div
        className={`bg-card border border-border rounded-3xl overflow-hidden shadow-2xl flex flex-col transition-all ${
          isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-5xl h-[90vh]'
        }`}
      >
        {/* Header Bar */}
        <div className="p-4 bg-muted/60 border-b border-border flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold shrink-0">
              <FileText size={16} />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-black text-foreground truncate">
                {digest.title}
              </h3>
              <p className="text-[10px] text-muted-foreground font-mono">
                {digest.subjectName} • {digest.category} • {digest.fileSize}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center gap-1 bg-card border border-border rounded-xl px-2 py-1">
              <button
                onClick={handleZoomOut}
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg"
                title="Zoom Out"
              >
                <ZoomOut size={14} />
              </button>
              <span className="text-[11px] font-mono font-bold text-foreground px-1">
                {zoom}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg"
                title="Zoom In"
              >
                <ZoomIn size={14} />
              </button>
            </div>

            {/* Page Navigation */}
            <div className="flex items-center gap-1 bg-card border border-border rounded-xl px-2 py-1">
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 rounded-lg"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-[11px] font-mono font-bold text-foreground px-1">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={nextPage}
                disabled={currentPage === totalPages}
                className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 rounded-lg"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-2 text-muted-foreground hover:text-foreground rounded-xl bg-card border border-border"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>

            {/* Download */}
            <a
              href={digest.downloadUrl}
              download
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Download size={13} />
              <span className="hidden sm:inline">Download</span>
            </a>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* PDF Document Preview Canvas with Security Watermark */}
        <div className="flex-1 bg-muted/40 overflow-auto p-4 sm:p-8 flex items-center justify-center relative select-none">
          
          {/* Security Dynamic Watermark */}
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-around items-center opacity-[0.04] rotate-[-25deg] z-10 font-black text-2xl sm:text-4xl text-foreground font-mono">
            <span>SAMYAK GURU • {userName.toUpperCase()} • {userId}</span>
            <span>OFFICIAL SEE 2082 REVISION MATERIAL</span>
            <span>SAMYAK GURU • {userName.toUpperCase()} • {userId}</span>
          </div>

          {/* Rendered Document Sheet */}
          <div
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
            className="bg-card border border-border shadow-xl rounded-2xl w-full max-w-2xl min-h-[750px] p-6 sm:p-10 flex flex-col justify-between space-y-6 transition-transform"
          >
            {/* Sheet Header */}
            <div className="border-b border-border/80 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-xs font-black text-foreground tracking-wider uppercase font-mono">
                  Samyak Guru SEE Master Digest Series 2082
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
            </div>

            {/* Simulated High-Yield Document Content */}
            <div className="space-y-4 text-foreground text-xs sm:text-sm leading-relaxed flex-1">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-300">
                <h4 className="font-black text-sm mb-1">{digest.title}</h4>
                <p className="text-xs text-muted-foreground">{digest.description}</p>
              </div>

              <div className="space-y-3 pt-2">
                <h5 className="font-black text-xs uppercase tracking-wider text-emerald-600 font-mono flex items-center gap-1.5">
                  <Sparkles size={14} /> Key Highlights &amp; Formula Capsule
                </h5>
                <ul className="space-y-2 text-xs text-muted-foreground list-disc pl-5">
                  <li>
                    <strong>Core Law / Principle:</strong> Complete concise summary structured for quick memorization before board exams.
                  </li>
                  <li>
                    <strong>NEB 10-Year High-Yield Questions:</strong> Hand-picked questions with marking rubric allocations.
                  </li>
                  <li>
                    <strong>Step-by-Step Model Steps:</strong> Every mathematical problem solved using standard NEB board format.
                  </li>
                  <li>
                    <strong>Exam Room Pitfalls:</strong> Common student calculation errors and unit omission warnings.
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2 font-mono text-xs">
                <span className="font-bold text-foreground block">⚡ Essential Formula Box (सूत्र संकलन):</span>
                <p className="text-muted-foreground space-y-1">
                  <span>• Gravitational Force: {'$F = \\frac{G m_1 m_2}{d^2}$'}</span><br />
                  <span>• Acceleration due to Gravity: {'$g = \\frac{G M}{R^2}$'}</span><br />
                  <span>• Fluid Pressure: {'$P = h \\rho g$'}</span><br />
                  <span>• Electric Power: {'$P = V \\times I = I^2 R = \\frac{V^2}{R}$'}</span>
                </p>
              </div>
            </div>

            {/* Sheet Footer */}
            <div className="border-t border-border pt-3 flex items-center justify-between text-[10px] text-muted-foreground font-mono">
              <span>Verified by Samyak Subject Matter Experts</span>
              <span>© Samyak Guru Education Network</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
