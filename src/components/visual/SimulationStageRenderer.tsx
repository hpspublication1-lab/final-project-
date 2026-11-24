'use client';

import React, { useRef, useEffect } from 'react';
import Image from 'next/image';
import { type Hotspot } from '@/lib/cee/visual/manifestSchema';

interface SimulationStep {
  label: string;
  note: string;
  drift: 'to-blood' | 'to-air' | 'down' | 'along' | 'pulse' | 'circulation' | 'filtration';
}

interface SimulationStageRendererProps {
  backgroundImageUrl: string;
  steps: SimulationStep[];
  currentStepIndex: number;
  isPlaying: boolean;
  speed: number;
  hotspots: Hotspot[];
  activeHotspotId: string | null;
  onSelectHotspot: (hotspot: Hotspot) => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  pulsePhase: number;
}

export default function SimulationStageRenderer({
  backgroundImageUrl,
  steps,
  currentStepIndex,
  isPlaying,
  speed,
  hotspots,
  activeHotspotId,
  onSelectHotspot,
}: SimulationStageRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);

  const activeStep = steps[currentStepIndex] || {
    label: 'Standard Stage',
    note: 'Observe the physiological mechanisms and anatomical structures.',
    drift: 'along',
  };

  // Initialize or update particle system when drift type changes
  useEffect(() => {
    const particles: Particle[] = [];
    const count = 36;
    const isCirculation = activeStep.drift === 'circulation' || activeStep.drift === 'pulse';

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * 640,
        y: Math.random() * 480,
        vx: (Math.random() - 0.5) * 1.5 * speed,
        vy: (Math.random() - 0.5) * 1.5 * speed,
        radius: Math.random() * 3 + 2.5,
        color: isCirculation && i % 2 === 0 ? '#ef4444' : '#38bdf8', // Red for oxygenated, blue for deoxygenated
        alpha: Math.random() * 0.6 + 0.4,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }
    particlesRef.current = particles;
  }, [activeStep.drift, speed]);

  // Main canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    const render = () => {
      if (!running) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (isPlaying) {
        const particles = particlesRef.current;
        const drift = activeStep.drift;

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];

          // Drift physics tailored to biological state
          if (drift === 'circulation') {
            // Elliptical circulation loop (representing systemic/pulmonary flow)
            p.pulsePhase += 0.02 * speed;
            p.x = 320 + Math.cos(p.pulsePhase + i) * 180;
            p.y = 240 + Math.sin(p.pulsePhase + i) * 120;
          } else if (drift === 'pulse') {
            // Pulsatile ventricular ejection
            p.pulsePhase += 0.05 * speed;
            const pulseScale = 1 + Math.sin(p.pulsePhase) * 0.3;
            p.radius = (3 + (i % 3)) * pulseScale;
            p.y += (p.vy - 1) * speed;
            if (p.y < 0) p.y = canvas.height;
          } else if (drift === 'to-blood') {
            p.x += Math.abs(p.vx) * speed * 1.2;
            if (p.x > canvas.width) p.x = 0;
          } else if (drift === 'to-air') {
            p.x -= Math.abs(p.vx) * speed * 1.2;
            if (p.x < 0) p.x = canvas.width;
          } else if (drift === 'down') {
            p.y += Math.abs(p.vy || 1.2) * speed * 1.5;
            if (p.y > canvas.height) p.y = 0;
          } else if (drift === 'filtration') {
            p.y += Math.abs(p.vy || 1.0) * speed * 1.3;
            p.x += (Math.sin(p.y * 0.05) * 0.5) * speed;
            if (p.y > canvas.height) {
              p.y = 0;
              p.x = 240 + Math.random() * 160;
            }
          } else {
            // General drift
            p.x += p.vx * speed;
            p.y += p.vy * speed;
            if (p.x < 0) p.x = canvas.width;
            if (p.x > canvas.width) p.x = 0;
            if (p.y < 0) p.y = canvas.height;
            if (p.y > canvas.height) p.y = 0;
          }

          // Draw biological flow particle
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.shadowBlur = 8;
          ctx.shadowColor = p.color;
          ctx.fill();
        }
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      running = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, speed, activeStep.drift]);

  return (
    <div className="relative w-full aspect-[4/3] max-w-[640px] mx-auto rounded-lg overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
      {/* Background Anatomical Illustration */}
      <Image
        src={backgroundImageUrl}
        alt={activeStep.label}
        fill
        className="object-contain pointer-events-none select-none opacity-85"
        sizes="(max-width: 768px) 100vw, 640px"
        priority
      />

      {/* Interactive Simulation Flow Canvas */}
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />

      {/* Coordinate Hotspot Buttons */}
      <div className="absolute inset-0 z-20 pointer-events-auto">
        {hotspots.map((hp) => {
          const posX = hp.position ? Math.max(10, Math.min(90, (hp.position[0] + 1) * 50)) : 50;
          const posY = hp.position ? Math.max(10, Math.min(90, (1 - hp.position[1]) * 50)) : 50;
          const isActive = activeHotspotId === hp.id;

          return (
            <button
              key={hp.id}
              onClick={() => onSelectHotspot(hp)}
              style={{ left: `${posX}%`, top: `${posY}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 group flex items-center justify-center transition-all ${
                isActive ? 'scale-125' : 'hover:scale-110'
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
              <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-slate-100 text-[11px] rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none border border-slate-700 transition">
                {hp.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Current Biological Stage Badge */}
      <div className="absolute bottom-3 left-3 right-3 z-30 p-2.5 rounded-lg bg-slate-950/90 border border-slate-800 backdrop-blur text-xs">
        <div className="flex items-center justify-between text-slate-300 font-medium mb-1">
          <span className="text-emerald-400 font-semibold">{activeStep.label}</span>
          <span className="text-slate-500 font-mono">
            Phase {currentStepIndex + 1} of {steps.length}
          </span>
        </div>
        <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-2">
          {activeStep.note}
        </p>
      </div>
    </div>
  );
}
