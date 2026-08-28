'use client';

import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, Target, Video, Cpu, ShieldCheck, Sparkles, Award } from 'lucide-react';

const stats = [
  { key: 'stat-mcq', raw: '15,000+', value: 15000, suffix: '+', label: 'Verified Practice MCQs', icon: Target, color: 'text-bio', bg: 'bg-bio-light', border: 'border-bio/20' },
  { key: 'stat-notes', raw: '1,200+', value: 1200, suffix: '+', label: 'Sub-Chapter Notes', icon: BookOpen, color: 'text-chem', bg: 'bg-chem-light', border: 'border-chem/20' },
  { key: 'stat-agents', raw: '8', value: 8, suffix: '', label: 'Specialized AI Agents', icon: Cpu, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
  { key: 'stat-stages', raw: '10', value: 10, suffix: ' Stages', label: 'IELTS Evaluation Pipeline', icon: Award, color: 'text-amber-600', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  { key: 'stat-videos', raw: '300+', value: 300, suffix: '+', label: 'Structured Video Lessons', icon: Video, color: 'text-physics', bg: 'bg-physics-light', border: 'border-physics/20' },
  { key: 'stat-curriculum', raw: '100%', value: 100, suffix: '%', label: 'NEB & MEC Syllabus Aligned', icon: ShieldCheck, color: 'text-success', bg: 'bg-success-light', border: 'border-success/20' },
];

function useCountUp(target: number, active: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) return;
    let start = 0;
    const step = Math.max(1, Math.ceil(target / 40));
    const id = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(id);
      } else {
        setCount(start);
      }
    }, 20);
    return () => clearInterval(id);
  }, [target, active]);

  return count;
}

function StatCard({ stat, active }: { stat: typeof stats[0]; active: boolean }) {
  const count = useCountUp(stat.value, active);
  const displayVal = active ? `${count.toLocaleString()}${stat.suffix}` : stat.raw;

  return (
    <div className={`relative overflow-hidden bg-card/80 backdrop-blur-xl border ${stat.border} rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group`}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full pointer-events-none" />
      <div className="flex items-center gap-4.5 relative z-10">
        <div className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center shrink-0 shadow-sm border border-white/20 dark:border-white/10 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
          <stat.icon size={26} className={stat.color} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-3xl sm:text-4xl font-black tracking-tight tabular-nums ${stat.color} leading-none mb-1.5`} suppressHydrationWarning>
            {displayVal}
          </p>
          <p className="text-xs sm:text-sm font-extrabold text-foreground/90 truncate">{stat.label}</p>
        </div>
      </div>
    </div>
  );
}

export default function StatsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setActive(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-16 bg-muted/30 border-y border-border/60 relative overflow-hidden">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black">
            <Sparkles size={14} /> Evidence-Based Architecture
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-foreground">Built on Verified Learning Assets</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Structured course materials, algorithmic evaluators, and syllabus-aligned question banks.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {stats.map((s) => (
            <StatCard key={s.key} stat={s} active={active} />
          ))}
        </div>
      </div>
    </section>
  );
}