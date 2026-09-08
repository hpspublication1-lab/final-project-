'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Play,
  BookOpen,
  Clock,
  CheckCircle2,
  FileText,
  Search,
  ChevronRight,
  Sparkles,
  Lock,
  ArrowRight,
  Download
} from 'lucide-react';
import { SEE_SUBJECT_HIERARCHY } from '@/lib/data/seeQuestionBankData';

interface SubjectModule {
  id: string;
  name: string;
  code: string;
  icon: string;
  totalVideos: number;
  totalHours: string;
  color: string;
  units: {
    title: string;
    duration: string;
    videoUrl: string;
    notesPdfUrl: string;
    isFreePreview: boolean;
  }[];
}

const SEE_RECORDED_COURSES: SubjectModule[] = [
  {
    id: 'science',
    name: 'Compulsory Science & Tech',
    code: 'SCI-10',
    icon: '🔬',
    totalVideos: 48,
    totalHours: '36 Hours',
    color: 'border-emerald-500/30 bg-emerald-500/5',
    units: [
      { title: 'Force & Gravitation (Master Derivation & 3-Mark Numericals)', duration: '45 mins', videoUrl: '/lecture-videos?subject=science&unit=1', notesPdfUrl: '/documents/notes/sci_gravitation.pdf', isFreePreview: true },
      { title: 'Pressure: Pascal Law, Hydraulic Machine & Archimedes Principle', duration: '52 mins', videoUrl: '/lecture-videos?subject=science&unit=2', notesPdfUrl: '/documents/notes/sci_pressure.pdf', isFreePreview: true },
      { title: 'Energy, Transformer Calculations & Household Wiring', duration: '60 mins', videoUrl: '/lecture-videos?subject=science&unit=3', notesPdfUrl: '/documents/notes/sci_energy.pdf', isFreePreview: false },
      { title: 'Refraction of Light, Lens Formula & Eye Defects (Myopia/Hypermetropia)', duration: '48 mins', videoUrl: '/lecture-videos?subject=science&unit=4', notesPdfUrl: '/documents/notes/sci_light.pdf', isFreePreview: false },
      { title: 'Modern Periodic Table, Groups & Electronic Configuration', duration: '42 mins', videoUrl: '/lecture-videos?subject=science&unit=5', notesPdfUrl: '/documents/notes/sci_periodic.pdf', isFreePreview: false },
      { title: 'Chemical Reactions, Equation Balancing & Acid-Base-Salt', duration: '55 mins', videoUrl: '/lecture-videos?subject=science&unit=6', notesPdfUrl: '/documents/notes/sci_reactions.pdf', isFreePreview: false },
      { title: 'Metals & Metallurgy: Extraction of Iron and Copper', duration: '40 mins', videoUrl: '/lecture-videos?subject=science&unit=7', notesPdfUrl: '/documents/notes/sci_metals.pdf', isFreePreview: false },
      { title: 'Mendelian Genetics, DNA Structure & Chromosomal Inheritance', duration: '58 mins', videoUrl: '/lecture-videos?subject=science&unit=8', notesPdfUrl: '/documents/notes/sci_genetics.pdf', isFreePreview: false },
    ]
  },
  {
    id: 'math',
    name: 'Compulsory Mathematics',
    code: 'MATH-10',
    icon: '📐',
    totalVideos: 42,
    totalHours: '32 Hours',
    color: 'border-blue-500/30 bg-blue-500/5',
    units: [
      { title: 'Sets: Cardinality Formula & 3-Set Venn Diagram Mastery', duration: '50 mins', videoUrl: '/lecture-videos?subject=math&unit=1', notesPdfUrl: '/documents/notes/math_sets.pdf', isFreePreview: true },
      { title: 'Compound Interest (Yearly/Half-Yearly) & Population Depreciation', duration: '55 mins', videoUrl: '/lecture-videos?subject=math&unit=2', notesPdfUrl: '/documents/notes/math_interest.pdf', isFreePreview: true },
      { title: 'Mensuration: Combined Cylinder, Sphere & Cone Formulas & Problems', duration: '65 mins', videoUrl: '/lecture-videos?subject=math&unit=3', notesPdfUrl: '/documents/notes/math_mensuration.pdf', isFreePreview: false },
      { title: 'Algebra: HCF, LCM & Fractional Algebraic Equations', duration: '45 mins', videoUrl: '/lecture-videos?subject=math&unit=4', notesPdfUrl: '/documents/notes/math_algebra.pdf', isFreePreview: false },
      { title: 'Circle Geometry: 4 Master Theorems with Statement-Reason Proofs', duration: '75 mins', videoUrl: '/lecture-videos?subject=math&unit=5', notesPdfUrl: '/documents/notes/math_circle.pdf', isFreePreview: false },
      { title: 'Trigonometry: Height and Distance with 30°-45°-60° Word Problems', duration: '40 mins', videoUrl: '/lecture-videos?subject=math&unit=6', notesPdfUrl: '/documents/notes/math_trig.pdf', isFreePreview: false },
    ]
  },
  {
    id: 'opt_math',
    name: 'Optional Mathematics',
    code: 'OPT-10',
    icon: '📊',
    totalVideos: 36,
    totalHours: '28 Hours',
    color: 'border-purple-500/30 bg-purple-500/5',
    units: [
      { title: 'Functions: Composite Functions & Inverse Function Equations', duration: '42 mins', videoUrl: '/lecture-videos?subject=opt_math&unit=1', notesPdfUrl: '/documents/notes/opt_functions.pdf', isFreePreview: true },
      { title: 'Matrices: Cramer\'s Rule 2x2 & Determinant Inversion Method', duration: '50 mins', videoUrl: '/lecture-videos?subject=opt_math&unit=2', notesPdfUrl: '/documents/notes/opt_matrices.pdf', isFreePreview: true },
      { title: 'Coordinate Geometry: Angle between Two Straight Lines & Pair of Lines', duration: '58 mins', videoUrl: '/lecture-videos?subject=opt_math&unit=3', notesPdfUrl: '/documents/notes/opt_lines.pdf', isFreePreview: false },
      { title: 'Trigonometry: Multiple Angles (2A, 3A) & Conditional Identities', duration: '70 mins', videoUrl: '/lecture-videos?subject=opt_math&unit=4', notesPdfUrl: '/documents/notes/opt_trig.pdf', isFreePreview: false },
      { title: 'Vectors: Dot Product, Orthogonality & Vector Geometry Proofs', duration: '52 mins', videoUrl: '/lecture-videos?subject=opt_math&unit=5', notesPdfUrl: '/documents/notes/opt_vectors.pdf', isFreePreview: false },
    ]
  },
  {
    id: 'english',
    name: 'English Language',
    code: 'ENG-10',
    icon: '📚',
    totalVideos: 28,
    totalHours: '20 Hours',
    color: 'border-amber-500/30 bg-amber-500/5',
    units: [
      { title: 'Reading Comprehension: Unseen Passages Strategy & High-Yield Vocab', duration: '40 mins', videoUrl: '/lecture-videos?subject=english&unit=1', notesPdfUrl: '/documents/notes/eng_reading.pdf', isFreePreview: true },
      { title: 'Grammar: Voice, Reported Speech, Tags & Subject-Verb Agreement', duration: '45 mins', videoUrl: '/lecture-videos?subject=english&unit=2', notesPdfUrl: '/documents/notes/eng_grammar.pdf', isFreePreview: true },
      { title: 'Writing Mastery: Job Application Letter with Curriculum Vitae (CV)', duration: '48 mins', videoUrl: '/lecture-videos?subject=english&unit=3', notesPdfUrl: '/documents/notes/eng_writing.pdf', isFreePreview: false },
      { title: 'Dialogue Writing, News Story Formulation & Formal Essays', duration: '50 mins', videoUrl: '/lecture-videos?subject=english&unit=4', notesPdfUrl: '/documents/notes/eng_essay.pdf', isFreePreview: false },
    ]
  },
  {
    id: 'nepali',
    name: 'Nepali (व्याकरण र पाठ्यपुस्तक)',
    code: 'NEP-10',
    icon: '🇳🇵',
    totalVideos: 26,
    totalHours: '18 Hours',
    color: 'border-red-500/30 bg-red-500/5',
    units: [
      { title: 'मानक वर्णविन्यास, पदवर्ग (नाम, सर्वनाम, विशेषण, क्रियापद) पहिचान', duration: '44 mins', videoUrl: '/lecture-videos?subject=nepali&unit=1', notesPdfUrl: '/documents/notes/nep_grammar.pdf', isFreePreview: true },
      { title: 'काल, पक्ष, भाव र वाच्य रूपान्तरण पूर्ण अभ्यास', duration: '48 mins', videoUrl: '/lecture-videos?subject=nepali&unit=2', notesPdfUrl: '/documents/notes/nep_vachya.pdf', isFreePreview: true },
      { title: 'पाठ्यपुस्तकका महत्वपूर्ण कविता, कथा र निबन्धको सप्रसङ्ग व्याख्या', duration: '55 mins', videoUrl: '/lecture-videos?subject=nepali&unit=3', notesPdfUrl: '/documents/notes/nep_literature.pdf', isFreePreview: false },
      { title: 'बुँदा टिपोट, संक्षेपीकरण तथा समीक्षात्मक विवेचनात्मक उत्तर लेखन', duration: '50 mins', videoUrl: '/lecture-videos?subject=nepali&unit=4', notesPdfUrl: '/documents/notes/nep_composition.pdf', isFreePreview: false },
    ]
  },
  {
    id: 'social',
    name: 'Social Studies & Life Skills',
    code: 'SOC-10',
    icon: '🌍',
    totalVideos: 30,
    totalHours: '22 Hours',
    color: 'border-orange-500/30 bg-orange-500/5',
    units: [
      { title: 'We and Our Society: Modern Social Values & Youth Responsibility', duration: '40 mins', videoUrl: '/lecture-videos?subject=social&unit=1', notesPdfUrl: '/documents/notes/soc_society.pdf', isFreePreview: true },
      { title: 'Nepal Geography: Map Drawing Technique & Scale Markings', duration: '52 mins', videoUrl: '/lecture-videos?subject=social&unit=2', notesPdfUrl: '/documents/notes/soc_map.pdf', isFreePreview: true },
      { title: 'Our Constitution, Organs of State & Fundamental Rights in Nepal', duration: '46 mins', videoUrl: '/lecture-videos?subject=social&unit=3', notesPdfUrl: '/documents/notes/soc_constitution.pdf', isFreePreview: false },
      { title: 'World War I & II, Causes, Impacts and United Nations Organs', duration: '55 mins', videoUrl: '/lecture-videos?subject=social&unit=4', notesPdfUrl: '/documents/notes/soc_history.pdf', isFreePreview: false },
    ]
  }
];

export default function SeeRecordedClassesTab() {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('science');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const currentSubject = SEE_RECORDED_COURSES.find((s) => s.id === selectedSubjectId) || SEE_RECORDED_COURSES[0];

  const filteredUnits = currentSubject.units.filter((unit) =>
    unit.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black">
            <Sparkles size={14} /> COMPLETE 1080P HD VIDEO VAULT
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-foreground">
            SEE Recorded Video Lectures
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Over 200+ chapter-wise recorded HD lectures taught by senior board examiners with downloadable handwritten PDF notes and timestamped bookmark drills.
          </p>
        </div>

        <Link
          href="/lecture-videos"
          className="px-6 py-3.5 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all shrink-0"
        >
          <Play size={16} className="fill-current" />
          <span>Launch Full Screen Player</span>
        </Link>
      </div>

      {/* Subject Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {SEE_RECORDED_COURSES.map((sub) => (
          <button
            key={sub.id}
            onClick={() => setSelectedSubjectId(sub.id)}
            className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
              selectedSubjectId === sub.id
                ? 'bg-card border-primary ring-2 ring-primary/20 shadow-md scale-[1.02]'
                : 'bg-card/50 border-border hover:border-border/80 text-muted-foreground'
            }`}
          >
            <div className="space-y-1">
              <span className="text-2xl block mb-1">{sub.icon}</span>
              <div className="text-xs font-black text-foreground line-clamp-1">{sub.name}</div>
              <div className="text-[10px] text-muted-foreground font-mono">{sub.code}</div>
            </div>
            <div className="pt-2 text-[10px] font-bold text-primary flex items-center justify-between">
              <span>{sub.totalVideos} Videos</span>
              <span>{sub.totalHours}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Subject Playlist Header & Search */}
      <div className="p-6 rounded-3xl bg-card border border-border space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-black text-foreground flex items-center gap-2">
              <span className="text-2xl">{currentSubject.icon}</span>
              <span>{currentSubject.name} — Video Chapters</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              {currentSubject.totalVideos} Lessons • {currentSubject.totalHours} Total Duration • Updated for 2082 SEE Board
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search chapter or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-muted/50 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
            />
          </div>
        </div>

        {/* Video Units List */}
        <div className="divide-y divide-border/60">
          {filteredUnits.map((unit, idx) => (
            <div
              key={idx}
              className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-muted/30 px-3 rounded-2xl transition-colors group"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary font-mono font-black text-xs flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {idx + 1}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-black text-foreground group-hover:text-primary transition-colors">
                      {unit.title}
                    </h4>
                    {unit.isFreePreview ? (
                      <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        FREE PREVIEW
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-muted text-muted-foreground flex items-center gap-1">
                        <Lock size={10} /> ENROLLED
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {unit.duration}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-emerald-600 font-medium">
                      <CheckCircle2 size={12} /> HD 1080p + 2x Speed
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <a
                  href={unit.notesPdfUrl}
                  download
                  className="px-3 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-bold flex items-center gap-1.5 transition-colors"
                  title="Download Lecture Notes PDF"
                >
                  <Download size={13} />
                  <span>Notes</span>
                </a>

                <Link
                  href={unit.videoUrl}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-black flex items-center gap-1.5 shadow-sm transition-all group-hover:scale-105"
                >
                  <Play size={13} className="fill-current" />
                  <span>Watch Video</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
