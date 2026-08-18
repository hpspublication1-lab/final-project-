'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { TrendingUp } from 'lucide-react';

const AccuracyChartInner = dynamic(() => import('./AccuracyChartInner'), { ssr: false });

export default function AccuracyTrendChart() {
  return (
    <div className="card-base h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-semibold text-foreground">Accuracy Trend</p>
          <p className="text-xs text-muted-foreground mt-0.5">Last 30 days — all subjects combined</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-success font-medium">
            <TrendingUp size={13} />
            +6.2% overall
          </div>
          <select className="text-xs border border-border rounded-lg px-2 py-1 bg-input text-foreground">
            <option>Last 30 days</option>
            <option>Last 7 days</option>
            <option>Last 90 days</option>
          </select>
        </div>
      </div>
      <AccuracyChartInner />
      <div className="flex items-center gap-4 mt-3 flex-wrap">
        {[
          { key: 'leg-bio', color: 'bg-bio', label: 'Biology' },
          { key: 'leg-chem', color: 'bg-chem', label: 'Chemistry' },
          { key: 'leg-phys', color: 'bg-physics', label: 'Physics' },
          { key: 'leg-ma', color: 'bg-ma', label: 'Mental Agility' },
        ]?.map((l) => (
          <div key={l?.key} className="flex items-center gap-1.5">
            <div className={`w-3 h-1.5 rounded-full ${l?.color}`} />
            <span className="text-xs text-muted-foreground">{l?.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}