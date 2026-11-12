'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Landmark,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Sliders,
  ShieldCheck,
  GraduationCap,
} from 'lucide-react';

interface CollegeAdmissionPredictorProps {
  currentScore?: number;
}

interface MedicalCollegeQuota {
  id: string;
  name: string;
  location: string;
  cutoff: number;
  openSeats: number;
  affiliation: string;
}

const MEDICAL_COLLEGES: MedicalCollegeQuota[] = [
  {
    id: 'iom',
    name: 'Maharajgunj Medical Campus (IOM)',
    location: 'Maharajgunj, Kathmandu',
    cutoff: 165,
    openSeats: 100,
    affiliation: 'Tribhuvan University (TU)',
  },
  {
    id: 'bpkihs',
    name: 'B.P. Koirala Institute of Health Sciences (BPKIHS)',
    location: 'Ghopa Camp, Dharan',
    cutoff: 156,
    openSeats: 120,
    affiliation: 'Autonomous Deemed University',
  },
  {
    id: 'pahs',
    name: 'Patan Academy of Health Sciences (PAHS)',
    location: 'Lagankhel, Lalitpur',
    cutoff: 152,
    openSeats: 65,
    affiliation: 'Autonomous State University',
  },
  {
    id: 'ku_kmc',
    name: 'Kathmandu Medical College (KMC) / CMC',
    location: 'Sinamangal, Kathmandu / Chitwan',
    cutoff: 138,
    openSeats: 150,
    affiliation: 'Kathmandu University (KU)',
  },
];

export default function CollegeAdmissionPredictor({
  currentScore = 162,
}: CollegeAdmissionPredictorProps) {
  const [simulatedScore, setSimulatedScore] = useState<number>(currentScore);
  const [showSimulator, setShowSimulator] = useState<boolean>(false);

  const activeScore = showSimulator ? simulatedScore : currentScore;

  const getAdmissionStatus = (cutoff: number) => {
    const diff = activeScore - cutoff;
    if (diff >= 3) {
      return {
        label: 'High Probability',
        color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
        badge: 'Safe (95%+)',
        icon: CheckCircle2,
      };
    } else if (diff >= -3) {
      return {
        label: 'Competitive Range',
        color: 'text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/30',
        badge: 'Borderline (65%)',
        icon: AlertCircle,
      };
    } else {
      return {
        label: `Target Gap: ${Math.abs(diff)} pts`,
        color: 'text-rose-700 dark:text-rose-300 bg-rose-500/10 border-rose-500/30',
        badge: 'Reach College',
        icon: HelpCircle,
      };
    }
  };

  return (
    <div className="bg-card border border-border/80 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
            <Landmark size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-foreground">
                All-Nepal Medical College Cutoff Forecaster
              </h3>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                MEC 2026 Normalization
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Predicted admission probability across Nepal&apos;s premier government &amp; university medical institutions.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowSimulator(!showSimulator)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer border ${
            showSimulator
              ? 'bg-primary text-white border-primary shadow-xs'
              : 'bg-muted/50 text-muted-foreground hover:text-foreground border-border'
          }`}
        >
          <Sliders size={13} />
          <span>{showSimulator ? 'Close Simulator' : 'Simulate Score'}</span>
        </button>
      </div>

      {/* Simulator Range Slider */}
      {showSimulator && (
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-foreground flex items-center gap-1.5">
              <Sparkles size={13} className="text-amber-500" />
              <span>Simulate CEE Score Trajectory</span>
            </span>
            <span className="font-mono font-black text-sm text-primary">
              {simulatedScore} / 200 Marks
            </span>
          </div>
          <input
            type="range"
            min={110}
            max={195}
            step={1}
            value={simulatedScore}
            onChange={(e) => setSimulatedScore(Number(e.target.value))}
            className="w-full accent-primary cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
            <span>Pass Threshold: 100</span>
            <span>Current: {currentScore}</span>
            <span>Target: 170+ (Top 50)</span>
          </div>
        </div>
      )}

      {/* College Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {MEDICAL_COLLEGES.map((college) => {
          const status = getAdmissionStatus(college.cutoff);
          const Icon = status.icon;
          const scoreDelta = activeScore - college.cutoff;

          return (
            <div
              key={college.id}
              className="p-4 rounded-xl bg-muted/20 border border-border/80 hover:border-primary/40 transition-all flex flex-col justify-between space-y-3"
            >
              <div className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-foreground leading-snug">
                    {college.name}
                  </h4>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 shrink-0 ${status.color}`}
                  >
                    <Icon size={11} />
                    <span>{status.label}</span>
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <GraduationCap size={12} className="text-muted-foreground/70" />
                  <span>{college.affiliation} • {college.location}</span>
                </p>
              </div>

              {/* Stats Bar */}
              <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-muted-foreground">
                    Historical Cutoff: <strong className="font-mono text-foreground">{college.cutoff}</strong>
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Seats: <strong className="font-mono text-foreground">{college.openSeats}</strong>
                  </span>
                </div>

                <span
                  className={`text-[11px] font-mono font-bold ${
                    scoreDelta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {scoreDelta >= 0 ? `+${scoreDelta}` : scoreDelta} pts
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground text-[11px]">
          <ShieldCheck size={14} className="text-primary shrink-0" />
          <span>
            Cutoffs calibrated using verified Medical Education Commission (MEC) 2080/2081 open merit merit rank lists.
          </span>
        </div>
        <Link
          href="/rank-predictor"
          className="text-xs font-bold text-primary hover:underline flex items-center gap-1 shrink-0 self-start sm:self-auto"
        >
          <span>Advanced Rank Model</span>
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}
