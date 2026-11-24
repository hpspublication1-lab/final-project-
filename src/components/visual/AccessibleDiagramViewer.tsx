'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ZoomIn, ZoomOut, RotateCcw, Info, CheckCircle2 } from 'lucide-react';
import { type Hotspot } from '@/lib/cee/visual/manifestSchema';

interface AccessibleDiagramViewerProps {
  sourceUrl: string;
  fallbackUrl?: string;
  title: string;
  hotspots: Hotspot[];
  activeHotspotId: string | null;
  onSelectHotspot: (hotspot: Hotspot) => void;
  description: string;
  keyPoints?: string[];
}

export default function AccessibleDiagramViewer({
  sourceUrl,
  fallbackUrl,
  title,
  hotspots,
  activeHotspotId,
  onSelectHotspot,
  description,
  keyPoints = [],
}: AccessibleDiagramViewerProps) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const displayUrl = fallbackUrl || sourceUrl;

  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 0.25, 0.75));
  const handleResetZoom = () => setZoomLevel(1);

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 rounded-xl overflow-hidden border border-slate-800">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Accessible Diagram
          </span>
          <span className="text-xs text-slate-400 hidden sm:inline">{title}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono text-slate-400 w-12 text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition ml-1"
            title="Reset Zoom"
            aria-label="Reset Zoom"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Image Viewport */}
      <div className="relative flex-1 min-h-[360px] flex items-center justify-center overflow-auto p-4 bg-slate-950 select-none">
        <div
          className="relative transition-transform duration-200 ease-out flex items-center justify-center max-w-full"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* Anatomical Diagram */}
          <div className="relative w-full max-w-[640px] aspect-[4/3] rounded-lg overflow-hidden border border-slate-800/80 shadow-2xl bg-slate-900">
            <Image
              src={displayUrl}
              alt={description}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 640px"
              priority
            />

            {/* Coordinate Hotspot Badges */}
            {hotspots.map((hp) => {
              // Convert 3D position [-1..1] or normalized coords to percentages
              const posX = hp.position ? Math.max(10, Math.min(90, (hp.position[0] + 1) * 50)) : 50;
              const posY = hp.position ? Math.max(10, Math.min(90, (1 - hp.position[1]) * 50)) : 50;
              const isActive = activeHotspotId === hp.id;

              return (
                <button
                  key={hp.id}
                  onClick={() => onSelectHotspot(hp)}
                  style={{ left: `${posX}%`, top: `${posY}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 group flex items-center justify-center transition-all ${
                    isActive ? 'scale-125 z-20' : 'hover:scale-110 z-10'
                  }`}
                  aria-label={`Hotspot: ${hp.label}`}
                >
                  <span
                    className={`relative flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold shadow-lg transition-all ${
                      isActive
                        ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/40 shadow-emerald-500/50'
                        : 'bg-slate-900/90 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500 hover:text-slate-950'
                    }`}
                  >
                    ●
                  </span>
                  {/* Tooltip on hover */}
                  <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-slate-100 text-[11px] rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none border border-slate-700 transition">
                    {hp.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Screen Reader & Educational Key Points */}
      <div className="p-4 bg-slate-900/60 border-t border-slate-800/80 text-xs text-slate-300 space-y-2">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">{description}</p>
        </div>
        {keyPoints.length > 0 && (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-1.5 pt-1">
            {keyPoints.map((pt, idx) => (
              <li key={idx} className="flex items-start gap-1.5 text-slate-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
