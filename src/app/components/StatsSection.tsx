'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Users, BookOpen, Target, Trophy, Video, TrendingUp, Sparkles } from 'lucide-react';

const stats = [
  { key: 'stat-students', raw: '40,000+', value: 40000, suffix: '+', label: 'Active Students', icon: Users, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
  { key: 'stat-mcq', raw: '15,000+', value: 15000, suffix: '+', label: 'MCQs with Explanations', icon: Target, color: 'text-bio', bg: 'bg-bio-light', border: 'border-bio/20' },
  { key: 'stat-accuracy', raw: '92%', value: 92, suffix: '%', label: 'Avg. Accuracy Improvement', icon: TrendingUp, color: 'text-success', bg: 'bg-success-light', border: 'border-success/20' },
  { key: 'stat-notes', raw: '1,200+', value: 1200, suffix: '+', label: 'Premium Sub-Chapter Notes', icon: BookOpen, color: 'text-chem', bg: 'bg-chem-light', border: 'border-chem/20' },
  { key: 'stat-videos', raw: '300+', value: 300, suffix: '+', label: 'Video Lectures (in App)', icon: Video, color: 'text-physics', bg: 'bg-physics-light', border: 'border-physics/20' },
  { key: 'stat-rank', raw: '98%', value: 98, suffix: '%', label: 'Students Improved Rank', icon: Trophy, color: 'text-ma', bg: 'bg-ma-light', border: 'border-ma/20' },
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
    <section ref={ref} className="py-20 bg-gradient-to-b from-card via-muted/40 to-card border-y border-border/60 relative overflow-hidden">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 relative z-10">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider bg-primary/10 text-primary px-4 py-1.5 rounded-full mb-3 border border-primary/20 shadow-xs">
            <Sparkles size={14} className="animate-pulse" /> Real Platform Impact
          </span>
          <h2 className="text-hero-md text-foreground font-black tracking-tight">Numbers That Speak for Themselves</h2>
          <p className="text-muted-foreground mt-2 max-w-lg mx-auto text-sm sm:text-base font-medium">
            Empowering 40,000+ Nepal CEE aspirants to achieve medical entrance success.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {stats.map((stat) => (
            <StatCard key={stat.key} stat={stat} active={active} />
          ))}
        </div>
      </div>
    </section>
  );
}