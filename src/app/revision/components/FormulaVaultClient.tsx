'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { MathText } from '@/components/MathText';
import {
  FileText,
  Search,
  BookOpen,
  Zap,
  Download,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  Flame,
  ArrowRight,
  Filter,
  Eye,
  Printer
} from 'lucide-react';
import toast from 'react-hot-toast';

export interface CheatSheet {
  id: string;
  title: string;
  subject: 'Physics' | 'Chemistry' | 'Biology' | 'Mental Agility';
  chapter: string;
  ceeWeightage: string; // e.g. "4-5 MCQs"
  formulas: Array<{
    name: string;
    latex: string;
    note?: string;
  }>;
  highYieldTraps: string[];
  mnemonic?: string;
}

const CHEAT_SHEETS: CheatSheet[] = [
  {
    id: 'phy-rotational',
    title: 'Rotational Dynamics & Moment of Inertia',
    subject: 'Physics',
    chapter: 'Mechanics',
    ceeWeightage: '4-5 MCQs',
    formulas: [
      { name: 'Torque & Angular Acceleration', latex: '\\tau = I\\alpha = \\frac{dL}{dt}' },
      { name: 'Angular Momentum', latex: 'L = I\\omega = r \\times p' },
      { name: 'Ring/Hoop Moment of Inertia', latex: 'I_{ring} = MR^2' },
      { name: 'Solid Disc / Cylinder', latex: 'I_{disc} = \\frac{1}{2}MR^2' },
      { name: 'Solid Sphere', latex: 'I_{solid\\_sphere} = \\frac{2}{5}MR^2' },
      { name: 'Hollow Sphere', latex: 'I_{hollow\\_sphere} = \\frac{2}{3}MR^2' },
      { name: 'Rolling Kinetic Energy', latex: 'K_{total} = \\frac{1}{2}mv^2\\left(1 + \\frac{k^2}{R^2}\\right)', note: 'k = radius of gyration' },
      { name: 'Acceleration on Incline', latex: 'a = \\frac{g\\sin\\theta}{1 + \\frac{k^2}{R^2}}' },
    ],
    highYieldTraps: [
      'Sphere reaches the bottom of an incline FASTEST because it has the smallest k²/R² (0.4).',
      'Ring takes the longest time to roll down (k²/R² = 1.0).',
      'If torque = 0, angular momentum L is strictly conserved.',
    ],
    mnemonic: 'Solid Sphere > Disc > Hollow Sphere > Ring (Order of Speed down an incline)',
  },
  {
    id: 'chem-kinetics',
    title: 'Chemical Kinetics & Arrhenius Law',
    subject: 'Chemistry',
    chapter: 'Physical Chemistry',
    ceeWeightage: '3-4 MCQs',
    formulas: [
      { name: 'First Order Integrated Rate Law', latex: 'k = \\frac{2.303}{t}\\log\\left(\\frac{[A]_0}{[A]_t}\\right)' },
      { name: 'First Order Half-Life', latex: 't_{1/2} = \\frac{0.693}{k}', note: 'Independent of initial concentration!' },
      { name: 'Zero Order Half-Life', latex: 't_{1/2} = \\frac{[A]_0}{2k}', note: 'Directly proportional to [A]₀' },
      { name: 'Arrhenius Equation', latex: 'k = A e^{-E_a / RT}' },
      { name: 'Temperature Coefficient', latex: '\\log\\left(\\frac{k_2}{k_1}\\right) = \\frac{E_a}{2.303R}\\left(\\frac{T_2 - T_1}{T_1 T_2}\\right)' },
    ],
    highYieldTraps: [
      'Radioactive decay is always a 1st order reaction.',
      'Unit of k for nth order reaction: (mol/L)^(1-n) s⁻¹.',
      'A catalyst lowers Ea for both forward and reverse reactions equally.',
    ],
    mnemonic: 'Temperature rises by 10°C → Rate doubles (Temperature coefficient μ ≈ 2 to 3)',
  },
  {
    id: 'phy-modern',
    title: 'Photoelectric Effect & Bohr Atom Model',
    subject: 'Physics',
    chapter: 'Modern Physics',
    ceeWeightage: '5-6 MCQs',
    formulas: [
      { name: 'Einstein Photoelectric Equation', latex: 'E = h\\nu = \\Phi_0 + K_{max}' },
      { name: 'Stopping Potential', latex: 'K_{max} = e V_s = h\\nu - h\\nu_0' },
      { name: 'de Broglie Wavelength', latex: '\\lambda = \\frac{h}{p} = \\frac{h}{\\sqrt{2mE}} = \\frac{12.27}{\\sqrt{V}}\\text{ \\AA (for electrons)}' },
      { name: 'Bohr Radius of nth Orbit', latex: 'r_n = 0.529 \\times \\frac{n^2}{Z}\\text{ \\AA}' },
      { name: 'Energy of Electron in nth Orbit', latex: 'E_n = -13.6 \\times \\frac{Z^2}{n^2}\\text{ eV}' },
    ],
    highYieldTraps: [
      'Photoelectric current depends ONLY on intensity, NOT frequency (above threshold).',
      'Maximum kinetic energy depends ONLY on frequency, NOT intensity.',
      'Stopping potential is independent of radiation intensity.',
    ],
    mnemonic: 'Energy: E ∝ 1/n² (negative), Radius: r ∝ n², Velocity: v ∝ 1/n',
  },
  {
    id: 'chem-organic-reactions',
    title: 'Named Organic Reactions & Conversions',
    subject: 'Chemistry',
    chapter: 'Organic Chemistry',
    ceeWeightage: '6-8 MCQs',
    formulas: [
      { name: 'Aldol Condensation', latex: '2\\text{CH}_3\\text{CHO} \\xrightarrow{\\text{dil. NaOH}} \\text{CH}_3-\\text{CH(OH)}-\\text{CH}_2-\\text{CHO}' },
      { name: 'Cannizzaro Reaction', latex: '2\\text{HCHO} + \\text{conc. KOH} \\rightarrow \\text{CH}_3\\text{OH} + \\text{HCOOK}' },
      { name: 'Reimer-Tiemann Reaction', latex: '\\text{Phenol} + \\text{CHCl}_3 + \\text{aq. KOH} \\rightarrow \\text{Salicylaldehyde}' },
      { name: 'Kolbe Reaction', latex: '\\text{Sodium Phenoxide} + \\text{CO}_2 \\xrightarrow{400K, 4-7 atm} \\text{Salicylic acid}' },
      { name: 'Hoffmann Bromamide Degradation', latex: 'R-\\text{CONH}_2 + \\text{Br}_2 + 4\\text{KOH} \\rightarrow R-\\text{NH}_2 + \\text{K}_2\\text{CO}_3' },
    ],
    highYieldTraps: [
      'Cannizzaro occurs in aldehydes lacking alpha-hydrogens (HCHO, Benzaldehyde).',
      'Hoffmann degradation steps down the carbon chain by 1 carbon atom.',
      'Lucas test: 3° alcohol turbidity immediately, 2° in 5 mins, 1° not at room temperature.',
    ],
    mnemonic: 'Alpha-H present → ALDOL; Alpha-H ABSENT → CANNIZZARO',
  },
  {
    id: 'bio-plant-hormones',
    title: 'Plant Hormones (Phytohormones) Master Sheet',
    subject: 'Biology',
    chapter: 'Botany',
    ceeWeightage: '3-4 MCQs',
    formulas: [
      { name: 'Auxin (IAA)', latex: '\\text{Apical Dominance, Cell Elongation, Root Initiation}' },
      { name: 'Gibberellin (GA3)', latex: '\\text{Internodal Elongation (Bolting in Cabbage), Seed Germination}' },
      { name: 'Cytokinin (Zeatin/Kinetin)', latex: '\\text{Cell Division, Delays Senescence (Richmond-Lang Effect)}' },
      { name: 'Ethylene (Gas)', latex: '\\text{Fruit Ripening, Triple Response, Promotes Senescence}' },
      { name: 'Abscisic Acid (ABA)', latex: '\\text{Stress Hormone, Stomatal Closure, Promotes Dormancy}' },
    ],
    highYieldTraps: [
      'Auxin inhibits lateral buds; Cytokinin breaks apical dominance and promotes lateral buds.',
      'ABA is an antagonist to Gibberellins (ABA induces dormancy, GA breaks it).',
      'Ethylene is the ONLY gaseous phytohormone.',
    ],
    mnemonic: 'Richmond-Lang Effect = Cytokinin (Keeps Leaves Green & Delays Aging)',
  },
  {
    id: 'bio-cranial-nerves',
    title: 'Human Cranial Nerves (12 Pairs) High-Yield Table',
    subject: 'Biology',
    chapter: 'Zoology',
    ceeWeightage: '2-3 MCQs',
    formulas: [
      { name: 'CN I, II, VIII', latex: '\\text{Sensory (Olfactory, Optic, Vestibulocochlear)}' },
      { name: 'CN III, IV, VI, XI, XII', latex: '\\text{Motor (Oculomotor, Trochlear, Abducens, Accessory, Hypoglossal)}' },
      { name: 'CN V, VII, IX, X', latex: '\\text{Mixed / Both (Trigeminal, Facial, Glossopharyngeal, Vagus)}' },
      { name: 'Vagus (CN X)', latex: '\\text{Longest Cranial Nerve (Wanderer Nerve to Thorax & Abdomen)}' },
      { name: 'Trigeminal (CN V)', latex: '\\text{Largest Cranial Nerve (Dentist Nerve)}' },
      { name: 'Trochlear (CN IV)', latex: '\\text{Smallest & Thinnest Cranial Nerve}' },
    ],
    highYieldTraps: [
      'LR6 SO4 remainder 3 (Lateral rectus by CN 6, Superior oblique by CN 4, other eye muscles by CN 3).',
      'Trigeminal is LARGEST, but Vagus is LONGEST.',
    ],
    mnemonic: 'Some Say Marry Money But My Brother Says Big Brains Matter More (S/M/B)',
  },
];

export default function FormulaVaultClient() {
  const [isDark, setIsDark] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSheet, setActiveSheet] = useState<CheatSheet | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredSheets = CHEAT_SHEETS.filter((sheet) => {
    const matchesSubject = selectedSubject === 'All' || sheet.subject === selectedSubject;
    const matchesSearch =
      sheet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sheet.chapter.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sheet.formulas.some((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSubject && matchesSearch;
  });

  const handleCopy = (sheet: CheatSheet) => {
    const text = `${sheet.title} (${sheet.subject})\n\n` +
      sheet.formulas.map((f) => `${f.name}: ${f.latex}`).join('\n') +
      `\n\nHigh-Yield Traps:\n` + sheet.highYieldTraps.map((t) => `• ${t}`).join('\n');

    navigator.clipboard.writeText(text);
    setCopiedId(sheet.id);
    toast.success('Formulas copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        
        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-primary text-white p-6 sm:p-8 shadow-sm">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-xs font-bold uppercase tracking-wider text-white">
                <Sparkles size={14} />
                <span>Samyak Khazana • 1-Page Rapid Revision</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                High-Yield Formula &amp; Cheat Sheet Vault
              </h1>
              <p className="text-xs sm:text-sm text-white/85 leading-relaxed">
                Zero panic revision before mock tests and board exams. 1-page condensed formulas, named reactions, and mnemonics designed for instant recall.
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-col gap-2.5 shrink-0">
              <Link
                href="/mistake-analyser"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-indigo-900 font-bold text-xs rounded-xl hover:bg-white/95 shadow-sm transition-all"
              >
                <span>Mistake Diary</span>
                <ArrowRight size={13} />
              </Link>
              <Link
                href="/mock-tests"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl border border-white/20 transition-all"
              >
                <span>Test Simulator</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-card border border-border rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-xs">
          
          {/* Subject Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {['All', 'Physics', 'Chemistry', 'Biology', 'Mental Agility'].map((sub) => (
              <button
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedSubject === sub
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[240px]">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search formula, topic, or reaction..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background border border-border rounded-xl pl-9 pr-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        {/* Cheat Sheets Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSheets.map((sheet) => (
            <div
              key={sheet.id}
              className="bg-card border border-border hover:border-primary/50 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md ${
                    sheet.subject === 'Physics' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                    sheet.subject === 'Chemistry' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                    sheet.subject === 'Biology' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                    'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                  }`}>
                    {sheet.subject} • {sheet.chapter}
                  </span>
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Flame size={11} /> {sheet.ceeWeightage}
                  </span>
                </div>

                <h3 className="text-sm font-extrabold text-foreground group-hover:text-primary transition-colors leading-snug">
                  {sheet.title}
                </h3>

                {/* Mini Formula Previews */}
                <div className="space-y-1.5 bg-muted/30 p-3 rounded-xl border border-border/60">
                  {sheet.formulas.slice(0, 3).map((f, fIdx) => (
                    <div key={fIdx} className="text-xs">
                      <span className="text-[10px] font-semibold text-muted-foreground block">{f.name}</span>
                      <div className="font-mono text-foreground font-bold mt-0.5 overflow-x-auto scrollbar-none py-0.5">
                        <MathText text={`$${f.latex}$`} />
                      </div>
                    </div>
                  ))}
                  {sheet.formulas.length > 3 && (
                    <span className="text-[10px] font-bold text-primary block pt-1">
                      + {sheet.formulas.length - 3} more high-yield formulas
                    </span>
                  )}
                </div>

                {/* Mnemonic / Trap Preview */}
                {sheet.mnemonic && (
                  <p className="text-[11px] text-muted-foreground italic bg-primary/5 p-2 rounded-lg border border-primary/10">
                    💡 <strong>Mnemonic:</strong> {sheet.mnemonic}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-border/60">
                <button
                  onClick={() => setActiveSheet(sheet)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline cursor-pointer"
                >
                  <Eye size={13} />
                  <span>View 1-Page Sheet</span>
                </button>

                <button
                  onClick={() => handleCopy(sheet)}
                  title="Copy Formulas"
                  className="p-1.5 rounded-lg bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  {copiedId === sheet.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ── FULL 1-PAGE CHEAT SHEET MODAL ── */}
        {activeSheet && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-card border border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
              
              <div className="flex items-center justify-between border-b border-border/80 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary">
                      {activeSheet.subject}
                    </span>
                    <span className="text-xs text-muted-foreground font-semibold">
                      {activeSheet.chapter} • High Yield: {activeSheet.ceeWeightage}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-foreground">
                    {activeSheet.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrint}
                    className="p-2 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title="Print Sheet"
                  >
                    <Printer size={16} />
                  </button>
                  <button
                    onClick={() => setActiveSheet(null)}
                    className="p-2 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Formulas Full List */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-muted-foreground uppercase tracking-wider">
                  Core Mathematical Formulas &amp; Equations
                </h3>
                <div className="space-y-2.5">
                  {activeSheet.formulas.map((f, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-muted/30 border border-border/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">{f.name}</span>
                        {f.note && (
                          <span className="text-[10px] font-semibold text-muted-foreground">{f.note}</span>
                        )}
                      </div>
                      <div className="font-mono text-sm font-bold text-primary py-1 overflow-x-auto scrollbar-none">
                        <MathText text={`$$${f.latex}$$`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* High Yield Traps */}
              <div className="space-y-2">
                <h3 className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Flame size={13} />
                  <span>Exam Pitfalls &amp; Topper Secrets (CEE Past Traps)</span>
                </h3>
                <div className="space-y-1.5 bg-amber-500/5 p-4 rounded-xl border border-amber-500/20">
                  {activeSheet.highYieldTraps.map((trap, tIdx) => (
                    <p key={tIdx} className="text-xs text-foreground flex items-start gap-2">
                      <span className="text-amber-500 font-bold shrink-0">⚠️</span>
                      <span>{trap}</span>
                    </p>
                  ))}
                </div>
              </div>

              {/* Mnemonic */}
              {activeSheet.mnemonic && (
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Memory Mnemonic</span>
                  <p className="text-xs font-bold text-foreground">{activeSheet.mnemonic}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-border/80">
                <button
                  onClick={() => handleCopy(activeSheet)}
                  className="btn-secondary py-2.5 px-4 text-xs font-bold gap-1.5"
                >
                  <Copy size={13} />
                  <span>Copy Cheat Sheet</span>
                </button>
                <button
                  onClick={() => setActiveSheet(null)}
                  className="btn-primary py-2.5 px-5 text-xs font-bold"
                >
                  Close Sheet
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
