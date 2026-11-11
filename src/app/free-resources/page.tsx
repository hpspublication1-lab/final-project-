'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PublicNav from '@/components/PublicNav';
import HomepageFooter from '@/app/components/HomepageFooter';
import InteractiveNoteReader, { type NoteDetailPayload } from '@/components/notes/InteractiveNoteReader';
import RedeemVoucherModal from '@/components/billing/RedeemVoucherModal';
import {
  BookOpen,
  Search,
  Filter,
  Sparkles,
  Download,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileText,
  KeyRound,
  GraduationCap,
  Stethoscope,
  Languages,
  Eye,
  Layers,
  Clock,
  Printer,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

interface ResourceItem {
  id: string;
  title: string;
  program: 'cee' | 'see' | 'ielts' | 'neb';
  subject: string;
  chapter: string;
  type: 'notes' | 'formula_sheet' | 'model_question' | 'ielts_pack';
  is_premium: boolean;
  reading_time_mins: number;
  download_count: number;
  pdf_url?: string | null;
  content: string;
  summary_key_points: string[];
  formula_sheet_latex?: string;
  created_at: string;
}

export default function FreeResourcesPage() {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProgram, setSelectedProgram] = useState<'all' | 'cee' | 'see' | 'ielts' | 'neb'>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  
  // Interactive Modals
  const [readerNote, setReaderNote] = useState<NoteDetailPayload | null>(null);
  const [redeemModalOpen, setRedeemModalOpen] = useState(false);

  useEffect(() => {
    async function loadResources() {
      setLoading(true);
      try {
        const res = await fetch(`/api/resources?program=${selectedProgram}&type=${selectedType}&search=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (data && data.resources) {
          setResources(data.resources);
        }
      } catch (err) {
        console.error('Failed to load resources:', err);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(loadResources, 150);
    return () => clearTimeout(timer);
  }, [selectedProgram, selectedType, searchQuery]);

  const handleOpenReader = (r: ResourceItem) => {
    setReaderNote({
      id: r.id,
      title: r.title,
      subjectName: r.subject,
      chapterTitle: r.chapter,
      readingTimeMins: r.reading_time_mins,
      contentMarkdown: r.content,
      summaryKeyPoints: r.summary_key_points,
      formulaSheetLatex: r.formula_sheet_latex,
      pdfUrl: r.pdf_url,
      isPremium: r.is_premium,
    });
  };

  const handleDownloadOrPrint = (r: ResourceItem) => {
    if (r.pdf_url) {
      window.open(r.pdf_url, '_blank');
      return;
    }
    // Open printable reader view
    handleOpenReader(r);
    toast.info('Opening interactive reader. You can use the print/copy buttons inside!');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <PublicNav />

      {/* Modals */}
      {readerNote && (
        <InteractiveNoteReader
          note={readerNote}
          onClose={() => setReaderNote(null)}
        />
      )}

      <RedeemVoucherModal
        isOpen={redeemModalOpen}
        onClose={() => setRedeemModalOpen(false)}
        onSuccess={() => {
          setRedeemModalOpen(false);
          toast.success('Voucher activated! Pro resources unlocked.');
        }}
      />

      <main className="flex-1 pt-28 sm:pt-36 pb-20">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 space-y-10">

          {/* ── Page Hero Header ────────────────────────────────────────── */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-wider">
              <Sparkles size={14} />
              <span>Samyak Academic Resource Vault</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight">
              Curriculum Notes, Formulae &amp; Question Blueprints
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              World-class, syllabus-aligned academic study materials across Medical Entrance (CEE), Secondary Education (SEE), and IELTS English. Formatted with KaTeX math equations and exam trap warnings.
            </p>

            {/* Voucher Quick Unlock Banner */}
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={() => setRedeemModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-bold transition-all shadow-xs"
              >
                <KeyRound size={14} className="text-amber-500" />
                <span>Have an Activation Voucher Code? Redeem Here →</span>
              </button>
            </div>
          </div>

          {/* ── Search & Filter Controls ─────────────────────────────────── */}
          <div className="bg-card border border-border rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes, chapters, formulas, or topics (e.g. 'Thermodynamics', 'Gravitation', 'Aldol', 'Circle Theorems')..."
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-muted/50 border border-border focus:border-primary focus:bg-background text-sm font-medium transition-all outline-hidden"
              />
            </div>

            {/* Program Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-border/60">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <span className="text-xs font-bold text-muted-foreground mr-1 uppercase tracking-wider flex items-center gap-1">
                  <Filter size={12} />
                  <span>Program:</span>
                </span>
                {[
                  { id: 'all', label: 'All Curriculums', icon: Layers },
                  { id: 'cee', label: 'CEE Medical', icon: Stethoscope },
                  { id: 'see', label: 'SEE Class 10', icon: GraduationCap },
                  { id: 'neb', label: 'NEB Grade 11-12', icon: BookOpen },
                  { id: 'ielts', label: 'IELTS Band 8.0+', icon: Languages },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = selectedProgram === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedProgram(tab.id as any)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 whitespace-nowrap ${
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      <Icon size={13} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Resource Type Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Type:</span>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-muted/60 border border-border text-xs font-bold text-foreground focus:outline-hidden"
                >
                  <option value="all">All Formats</option>
                  <option value="notes">In-App LaTeX Notes</option>
                  <option value="formula_sheet">Formula Sheets</option>
                  <option value="ielts_pack">IELTS Mastery Packs</option>
                  <option value="model_question">Model Question Papers</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── Resources Grid ───────────────────────────────────────────── */}
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
              <p className="text-xs text-muted-foreground font-mono">Loading reviewed curriculum notes...</p>
            </div>
          ) : resources.length === 0 ? (
            <div className="py-16 text-center space-y-4 bg-muted/20 border border-border rounded-3xl p-8">
              <BookOpen size={36} className="text-muted-foreground mx-auto opacity-50" />
              <h3 className="text-base font-bold text-foreground">No resources match your query</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Try clearing your search keyword or switching programs. You can also trigger an autonomous curriculum sweep from the Admin Command Center.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedProgram('all');
                  setSelectedType('all');
                }}
                className="btn-primary text-xs py-2 px-4 rounded-xl font-bold"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources.map((item) => (
                <div
                  key={item.id}
                  className="bg-card border border-border/80 hover:border-primary/40 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                          item.program === 'cee'
                            ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                            : item.program === 'see'
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                        }`}>
                          {item.program.toUpperCase()}
                        </span>
                        <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-lg">
                          {item.subject}
                        </span>
                      </div>

                      {item.is_premium ? (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 flex items-center gap-1">
                          <Lock size={10} /> Pro
                        </span>
                      ) : (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 size={10} /> Free
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                      {item.title}
                    </h3>

                    {/* Chapter Info */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {item.reading_time_mins} min read
                      </span>
                      <span>•</span>
                      <span>{item.download_count} reads</span>
                    </div>

                    {/* Summary Bullets */}
                    {item.summary_key_points && item.summary_key_points.length > 0 && (
                      <div className="space-y-1.5 p-3 rounded-2xl bg-muted/40 border border-border/50 text-xs text-muted-foreground">
                        {item.summary_key_points.slice(0, 2).map((pt, i) => (
                          <div key={i} className="flex items-start gap-1.5 leading-relaxed">
                            <span className="text-primary font-bold mt-0.5">•</span>
                            <span className="line-clamp-2">{pt}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-5 mt-4 border-t border-border/60 flex items-center gap-2">
                    <button
                      onClick={() => handleOpenReader(item)}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-primary text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-primary-dark shadow-xs transition-all"
                    >
                      <BookOpen size={14} />
                      <span>Read Note</span>
                    </button>

                    <button
                      onClick={() => handleDownloadOrPrint(item)}
                      className="p-2.5 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border transition-all"
                      title="Print / Save"
                    >
                      <Download size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Pedagogical Standard Notice ─────────────────────────────── */}
          <div className="max-w-4xl mx-auto p-5 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-amber-800 dark:text-amber-300">
            <div className="flex items-start gap-3">
              <ShieldCheck size={20} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Pedagogical Standard Guarantee:</span> Every resource in this repository is mapped to the Nepal Medical Education Commission (CEE), CDC Class 10 (SEE), or Cambridge IELTS grid. Formatted with LaTeX formulas and real examination traps.
              </div>
            </div>
            <button
              onClick={() => setRedeemModalOpen(true)}
              className="shrink-0 px-3.5 py-1.5 rounded-xl bg-amber-500 text-white font-bold text-xs shadow-xs hover:bg-amber-600 transition-all"
            >
              Redeem Code
            </button>
          </div>

        </div>
      </main>

      <HomepageFooter />
    </div>
  );
}
