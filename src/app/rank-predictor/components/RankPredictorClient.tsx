'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Award,
  TrendingUp,
  Building2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ChevronRight,
  BookOpen,
  MessageCircle,
  Share2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Phone,
  User,
  GraduationCap,
} from 'lucide-react';
import {
  calculateRankPrediction,
  type CeeCategory,
  type CeeProgramType,
  type RankPredictionResult,
} from '@/lib/calculator/rankPredictorEngine';
import { toast } from 'sonner';

const CATEGORY_OPTIONS: { id: CeeCategory; label: string; desc: string }[] = [
  { id: 'open', label: 'Open Merit (खुला)', desc: 'General national open merit competition' },
  { id: 'gov_school', label: 'Govt School (सरकारी विद्यालय)', desc: 'Passed Class 6-10 or 10-12 from public school' },
  { id: 'female', label: 'Female Quota (महिला)', desc: 'Exclusive female candidate scholarship quota' },
  { id: 'karnali_remote', label: 'Remote / Karnali (पिछडिएको)', desc: 'Permanent residents of Karnali & remote districts' },
  { id: 'madhesi', label: 'Madhesi (मधेशी)', desc: 'Certified Madhesi community reservation' },
  { id: 'janajati', label: 'Janajati (आदिवासी जनजाति)', desc: 'Indigenous Nationalities quota' },
  { id: 'dalit', label: 'Dalit (दलित)', desc: 'Constitutional Dalit reservation quota' },
  { id: 'muslim', label: 'Muslim (मुस्लिम)', desc: 'Minority community reservation quota' },
];

const PROGRAM_OPTIONS: { id: CeeProgramType; label: string; seats: string }[] = [
  { id: 'mbbs', label: 'MBBS (Medicine)', seats: '~2,150 National Seats' },
  { id: 'bds', label: 'BDS (Dental)', seats: '~550 National Seats' },
  { id: 'bsc_nursing', label: 'BSc Nursing', seats: '~1,800 National Seats' },
  { id: 'b_pharm', label: 'B.Pharmacy', seats: '~900 National Seats' },
];

export default function RankPredictorClient() {
  const [score, setScore] = useState<number>(148);
  const [category, setCategory] = useState<CeeCategory>('open');
  const [program, setProgram] = useState<CeeProgramType>('mbbs');

  // Contact capture for counseling
  const [candidateName, setCandidateName] = useState('');
  const [phone, setPhone] = useState('');
  const [hasSavedLead, setHasSavedLead] = useState(false);

  // Compute live prediction client-side instantly
  const prediction: RankPredictionResult = useMemo(() => {
    return calculateRankPrediction(score, category, program);
  }, [score, category, program]);

  const handleScorePreset = (val: number) => {
    setScore(val);
  };

  const handleSaveCounseling = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      toast.error('Please enter your WhatsApp mobile number.');
      return;
    }

    try {
      const res = await fetch('/api/rank-predictor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score,
          category,
          program,
          candidateName,
          phone,
        }),
      });

      if (res.ok) {
        setHasSavedLead(true);
        toast.success('Your rank profile has been registered for free CEE seat counseling!');
      }
    } catch {
      toast.error('Unable to submit profile. Please try again.');
    }
  };

  const handleWhatsAppCounselor = () => {
    const text = encodeURIComponent(
      `Namaste Samyak Team! My CEE mock score is ${score}/200 (Projected Rank #${prediction.predictedRankMin}-${prediction.predictedRankMax}, ${category.toUpperCase()} category). Can I get guidance on college seat counseling and scholarship chances?`
    );
    window.open(`https://wa.me/9779841234567?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
          >
            ← Back to Samyak Academy
          </Link>
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
            MEC Merit Model 2083
          </span>
        </div>

        {/* Hero Banner */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            <Sparkles size={14} />
            <span>MEC Official Cutoff &amp; Percentile Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground tracking-tight">
            CEE All-Nepal Rank Predictor <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-500 to-emerald-500">
              &amp; Medical Seat Calculator
            </span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Calculate your estimated national merit rank, percentile, and admission probability at
            Maharajgunj (IOM), BPKIHS Dharan, Patan Academy (PAHS), and private medical colleges.
          </p>
        </div>

        {/* Main Grid: Controls vs Results */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Interactive Inputs (5 Cols) */}
          <div className="lg:col-span-5 bg-card border border-border rounded-3xl p-5 sm:p-6 shadow-sm space-y-6">
            
            {/* 1. Target Program */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <GraduationCap size={15} className="text-primary" /> Target Program
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PROGRAM_OPTIONS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setProgram(p.id)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      program === p.id
                        ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                        : 'border-border bg-muted/30 hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <p className="text-xs font-bold truncate">{p.label}</p>
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">{p.seats}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. CEE Score Input & Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Award size={15} className="text-amber-500" /> Expected CEE Score
                </label>
                <div className="flex items-center gap-1 font-mono">
                  <span className="text-2xl font-black text-foreground">{score}</span>
                  <span className="text-xs text-muted-foreground">/ 200</span>
                </div>
              </div>

              {/* Slider */}
              <input
                type="range"
                min="0"
                max="200"
                step="1"
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                className="w-full accent-primary h-2 bg-muted rounded-lg appearance-none cursor-pointer"
              />

              {/* Quick Presets */}
              <div className="flex items-center justify-between gap-1 flex-wrap pt-1">
                <span className="text-[10px] text-muted-foreground font-semibold">Presets:</span>
                {[
                  { label: '175+ (IOM)', val: 175 },
                  { label: '158+ (BPKIHS)', val: 158 },
                  { label: '142+ (Quota)', val: 142 },
                  { label: '120+ (Paying)', val: 120 },
                  { label: '100 (Pass)', val: 100 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => handleScorePreset(preset.val)}
                    className={`px-2 py-1 rounded-lg text-[10.5px] font-mono font-semibold transition-all cursor-pointer ${
                      score === preset.val
                        ? 'bg-primary text-white'
                        : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Category / Quota Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck size={15} className="text-emerald-500" /> Category / Reservation Quota
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CeeCategory)}
                className="w-full p-3 rounded-2xl border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:border-primary"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground italic">
                {CATEGORY_OPTIONS.find((c) => c.id === category)?.desc}
              </p>
            </div>

            {/* 4. Optional Lead Capture Box */}
            <div className="border-t border-border pt-4 space-y-3">
              <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Phone size={14} className="text-emerald-500" /> Get Full College Preference Sheet
              </p>
              {hasSavedLead ? (
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>Profile saved! Our senior counselor will connect with you via WhatsApp.</span>
                </div>
              ) : (
                <form onSubmit={handleSaveCounseling} className="space-y-2.5">
                  <input
                    type="text"
                    placeholder="Your Full Name"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-primary"
                  />
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      placeholder="WhatsApp Mobile (e.g. 9841234567)"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="flex-1 p-2.5 text-xs rounded-xl border border-border bg-background text-foreground focus:outline-none focus:border-primary"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold transition-all shrink-0 cursor-pointer"
                    >
                      Save Sheet
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>

          {/* Right Column: Live Prediction Cards (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Top Score & Rank Summary Header */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
                    CEE Merit Model Projection
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                    National Rank Forecast
                  </h2>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                    prediction.isQualified
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-red-500/20 text-red-300 border border-red-500/40'
                  }`}
                >
                  {prediction.isQualified ? 'MEC Qualified (≥50%)' : 'Below Cutoff (<50%)'}
                </span>
              </div>

              {/* 3 Metric Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                
                {/* Predicted Rank */}
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-xs text-slate-400 font-medium">Predicted Nepal Rank</p>
                  <p className="text-2xl font-black text-white mt-0.5">
                    #{prediction.predictedRankMin} – #{prediction.predictedRankMax}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Out of ~34,500 candidates
                  </p>
                </div>

                {/* Percentile */}
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-xs text-slate-400 font-medium">Estimated Percentile</p>
                  <p className="text-2xl font-black text-emerald-400 mt-0.5">
                    {prediction.percentile}%
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Top {(100 - prediction.percentile).toFixed(2)}% in Nepal
                  </p>
                </div>

                {/* Seat Type Projection */}
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-xs text-slate-400 font-medium">Seat Eligibility</p>
                  <p className="text-sm font-black text-white mt-1 leading-snug">
                    {prediction.scholarshipEligible
                      ? 'Full Govt Scholarship'
                      : prediction.isQualified
                      ? 'Paying Merit Allocation'
                      : 'Non-Qualified'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Based on {category.toUpperCase()} cutoff
                  </p>
                </div>

              </div>

              {/* Counselor Strategic Summary */}
              <div className="p-3.5 rounded-2xl bg-primary/20 border border-primary/30 text-xs text-slate-200 leading-relaxed">
                <span className="font-bold text-white">Dean&apos;s Strategic Assessment: </span>
                {prediction.counselorSummary}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-1 flex-wrap">
                <button
                  onClick={handleWhatsAppCounselor}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <MessageCircle size={15} />
                  <span>WhatsApp 1-on-1 Mentorship</span>
                </button>
                <Link
                  href="/courses"
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Explore CEE Mastery Batches</span>
                  <ChevronRight size={14} />
                </Link>
              </div>

            </div>

            {/* College Admission Probability Matrix */}
            <div className="bg-card border border-border rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                    <Building2 size={18} className="text-primary" /> Medical College Admission Probabilities
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Estimated chances based on MEC past allocation merit lists.
                  </p>
                </div>
              </div>

              <div className="divide-y divide-border space-y-3">
                {prediction.colleges.map((col) => (
                  <div
                    key={col.collegeId}
                    className="pt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-foreground">{col.collegeName}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          ({col.affiliation})
                        </span>
                        <span className="text-[10px] text-muted-foreground">&bull; {col.location}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{col.recommendationNote}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                      <div className="text-right">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            col.chanceLevel === 'High Probability'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : col.chanceLevel === 'Moderate / Borderline'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                          }`}
                        >
                          {col.chanceLevel}
                        </span>
                        <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                          {col.seatType}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* Disclaimer Footer */}
        <div className="text-center p-4 rounded-2xl bg-muted/40 border border-border text-[11px] text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground">Official Medical Education Commission (MEC) Notice</p>
          <p>
            Rank predictions and college cutoffs are computed based on statistical distributions from
            past CEE merit lists (2080, 2081, 2082 BS). Final seat allotments are executed exclusively
            by MEC through central bi-annual matching.
          </p>
        </div>

      </div>
    </div>
  );
}
