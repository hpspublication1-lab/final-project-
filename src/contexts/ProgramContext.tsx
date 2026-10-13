'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type CanonicalCourseId =
  | 'see_class_10'
  | 'neb_class_11'
  | 'neb_class_12'
  | 'cee_medical'
  | 'ioe_engineering'
  | 'lok_sewa'
  | 'ielts'
  | 'digital_marketing'
  | 'artificial_intelligence';

export type ProgramType =
  | CanonicalCourseId
  | 'cee'
  | 'see'
  | 'class11'
  | 'class12'
  | 'engineering'
  | 'ioe'
  | 'loksewa'
  | 'english'
  | 'digital'
  | 'ai';

export interface CourseSubject {
  name: string;
  icon: string;
  chaptersCount: number;
  description?: string;
}

export interface ProgramDetails {
  id: CanonicalCourseId;
  legacySlug: string;
  courseSlug: string;
  name: string;
  shortName: string;
  category:
    | 'academic_board'
    | 'medical_entrance'
    | 'engineering_entrance'
    | 'civil_service'
    | 'language_exam'
    | 'digital_skills'
    | 'tech_ai';
  tagline: string;
  badge: string;
  description: string;
  badgeBg: string;
  badgeText: string;
  accentColor: string;
  subjects: CourseSubject[];
  keyFeatures: string[];
  portalRoute: string;
}

export const CANONICAL_COURSES: CanonicalCourseId[] = [
  'cee_medical',
  'ioe_engineering',
  'lok_sewa',
  'neb_class_12',
  'neb_class_11',
  'see_class_10',
  'ielts',
  'digital_marketing',
  'artificial_intelligence',
];

export function normalizeCourseId(rawId?: string | null): CanonicalCourseId {
  if (!rawId) return 'cee_medical';
  const id = rawId.toLowerCase().trim();
  if (id === 'see' || id === 'see_class_10' || id.includes('see-')) return 'see_class_10';
  if (id === 'class11' || id === 'neb_class_11' || id.includes('class-11')) return 'neb_class_11';
  if (id === 'class12' || id === 'neb_class_12' || id.includes('class-12')) return 'neb_class_12';
  if (id === 'ioe' || id === 'engineering' || id === 'ioe_engineering' || id.includes('ioe-') || id.includes('engineering')) {
    return 'ioe_engineering';
  }
  if (id === 'loksewa' || id === 'lok_sewa' || id.includes('lok-sewa') || id.includes('loksewa')) {
    return 'lok_sewa';
  }
  if (id === 'cee' || id === 'cee_medical' || id.includes('cee-')) return 'cee_medical';
  if (id === 'ielts' || id === 'english' || id.includes('ielts-') || id.includes('pte-')) return 'ielts';
  if (id === 'digital_marketing' || id === 'marketing' || id.includes('marketing-')) return 'digital_marketing';
  if (id === 'artificial_intelligence' || id === 'ai' || id === 'digital' || id.includes('ai-') || id.includes('python-')) {
    return 'artificial_intelligence';
  }
  return 'cee_medical';
}

export const COURSES_MAP: Record<CanonicalCourseId, ProgramDetails> = {
  see_class_10: {
    id: 'see_class_10',
    legacySlug: 'see',
    courseSlug: 'see-class-10-board-topper-batch',
    name: 'Samyak SEE — Class 10 Board Exam',
    shortName: 'SEE Class 10',
    category: 'academic_board',
    tagline: 'Secondary Education Examination (Nepal Board)',
    badge: 'Grade 10 · NEB Board',
    description:
      'Master your Class 10 SEE Board Exam with NEB model question papers, chapter video lectures, AI handwritten subjective grading, and previous 10-year past solutions.',
    badgeBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    badgeText: 'text-emerald-600 dark:text-emerald-400',
    accentColor: 'border-emerald-500 text-emerald-600',
    portalRoute: '/student-dashboard',
    subjects: [
      { name: 'Compulsory Science', icon: '🔬', chaptersCount: 24, description: 'Physics, Chemistry, Biology & Astronomy' },
      { name: 'Compulsory Math', icon: '📐', chaptersCount: 20, description: 'Arithmetic, Algebra, Geometry & Mensuration' },
      { name: 'Optional Math', icon: '📊', chaptersCount: 16, description: 'Trigonometry, Coordinate Geometry & Vectors' },
      { name: 'English', icon: '📚', chaptersCount: 15, description: 'Grammar, Reading Comprehension & Writing' },
      { name: 'Social Studies', icon: '🌍', chaptersCount: 18, description: 'History, Geography, Civics & Culture' },
    ],
    keyFeatures: [
      'NEB 10-Year Past Paper Bank',
      'AI Handwritten Answer Evaluator',
      'Chapter-wise Model Sets',
      'Target 4.0 GPA Study Plan',
    ],
  },
  neb_class_11: {
    id: 'neb_class_11',
    legacySlug: 'class11',
    courseSlug: 'neb-class-11-science-mastery',
    name: 'Samyak Class 11 — NEB Science & Math Foundation',
    shortName: 'NEB Class 11',
    category: 'academic_board',
    tagline: 'Grade 11 NEB Board + Early Medical/Engineering Foundation',
    badge: 'Grade 11 · NEB Science',
    description:
      'Build rock-solid Grade 11 concepts across Physics, Chemistry, Mathematics, and Biology with step-by-step derivations, numerical workshops, and early CEE/IOE foundation MCQs.',
    badgeBg: 'bg-teal-500/10 dark:bg-teal-500/20',
    badgeText: 'text-teal-600 dark:text-teal-400',
    accentColor: 'border-teal-500 text-teal-600',
    portalRoute: '/student-dashboard',
    subjects: [
      { name: 'Class 11 Physics', icon: '⚡', chaptersCount: 22, description: 'Mechanics, Heat & Thermodynamics, Electrostatics & Optics' },
      { name: 'Class 11 Chemistry', icon: '🧪', chaptersCount: 20, description: 'Stoichiometry, Atomic Structure, Inorganic & Basic Organic' },
      { name: 'Class 11 Mathematics', icon: '📐', chaptersCount: 18, description: 'Trigonometry, Calculus Limits/Derivatives & Coordinate Geometry' },
      { name: 'Class 11 Biology', icon: '🌿', chaptersCount: 20, description: 'Cell Biology, Biodiversity, Plant & Animal Kingdom' },
    ],
    keyFeatures: [
      'Complete NEB Grade 11 Derivations & Numericals',
      'Chapter-wise Board + Entrance Bridge MCQs',
      'Weekly Subjective & Objective Tests',
      '24/7 AI Doubt Solver for Physics & Chemistry',
    ],
  },
  neb_class_12: {
    id: 'neb_class_12',
    legacySlug: 'class12',
    courseSlug: 'neb-class-12-board-topper-batch',
    name: 'Samyak Class 12 — NEB Board Topper & Entrance Bridge',
    shortName: 'NEB Class 12',
    category: 'academic_board',
    tagline: 'Grade 12 NEB Board Exam + Pre-Medical / Pre-Engineering Bridge',
    badge: 'Grade 12 · NEB Board',
    description:
      'Score GPA 3.8–4.0 in Class 12 NEB Boards while preparing simultaneously for CEE Medical or IOE Engineering entrances with past board solutions and MCQ drills.',
    badgeBg: 'bg-cyan-500/10 dark:bg-cyan-500/20',
    badgeText: 'text-cyan-600 dark:text-cyan-400',
    accentColor: 'border-cyan-500 text-cyan-600',
    portalRoute: '/student-dashboard',
    subjects: [
      { name: 'Class 12 Physics', icon: '🧲', chaptersCount: 24, description: 'Electromagnetism, AC, Modern Physics, Semiconductors & Wave Optics' },
      { name: 'Class 12 Chemistry', icon: '⚗️', chaptersCount: 22, description: 'Volumetric Analysis, Chemical Kinetics, Electrochemistry & Organic' },
      { name: 'Class 12 Mathematics', icon: '∫', chaptersCount: 18, description: 'Integration, Differential Equations, Vectors, Conics & Probability' },
      { name: 'Class 12 Biology', icon: '🧬', chaptersCount: 20, description: 'Genetics, Human Physiology, Plant Physiology & Biotechnology' },
    ],
    keyFeatures: [
      'NEB Grade 12 Old-is-Gold Solved Vault',
      'Long-Question Derivation Blueprints',
      'Simultaneous CEE / IOE Chapter MCQ Practice',
      'Timed Pre-Board Model Examinations',
    ],
  },
  cee_medical: {
    id: 'cee_medical',
    legacySlug: 'cee',
    courseSlug: 'cee-mbbs-mastery-2026',
    name: 'Samyak CEE — Medical Entrance Prep',
    shortName: 'CEE Medical',
    category: 'medical_entrance',
    tagline: 'Nepal Medical Education Commission (MECEE) Entrance Exam',
    badge: 'MBBS · BDS · B.Sc Nursing',
    description:
      'Ace Nepal Medical Entrance with 15,000+ topic-wise MCQs, 200-question timed MEC mock exams, real-time 2-player battle arena, and high-yield notes.',
    badgeBg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
    badgeText: 'text-indigo-600 dark:text-indigo-400',
    accentColor: 'border-indigo-500 text-indigo-600',
    portalRoute: '/student-dashboard',
    subjects: [
      { name: 'Zoology', icon: '🦁', chaptersCount: 22, description: 'Animal Diversity, Anatomy & Physiology' },
      { name: 'Botany', icon: '🌿', chaptersCount: 20, description: 'Plant Anatomy, Photosynthesis & Genetics' },
      { name: 'Chemistry', icon: '🧪', chaptersCount: 26, description: 'Organic, Inorganic & Physical Chemistry' },
      { name: 'Physics', icon: '⚡', chaptersCount: 24, description: 'Mechanics, Optics, Waves & Nuclear Physics' },
      { name: 'Mental Agility (MAT)', icon: '🧠', chaptersCount: 12, description: 'Numerical, Verbal & Abstract Reasoning' },
    ],
    keyFeatures: [
      '15,000+ Verified CEE MCQs',
      'MEC 200-Question Mock Simulations',
      'Real-time 2-Player Battle Arena',
      'SM-2 Spaced Repetition Flashcards',
    ],
  },
  ioe_engineering: {
    id: 'ioe_engineering',
    legacySlug: 'engineering',
    courseSlug: 'ioe-engineering-entrance-2026',
    name: 'Samyak IOE — BE Engineering Entrance Prep',
    shortName: 'IOE Engineering',
    category: 'engineering_entrance',
    tagline: 'TU IOE Pulchowk / KU / PU BE Entrance Examination',
    badge: 'BE Computer · Civil · Architecture',
    description:
      'Target top ranks in TU IOE Pulchowk Campus with 140-mark CBT mock tests, shortcut calculus & mechanics problem-solving, and 10,000+ engineering entrance MCQs.',
    badgeBg: 'bg-blue-500/10 dark:bg-blue-500/20',
    badgeText: 'text-blue-600 dark:text-blue-400',
    accentColor: 'border-blue-500 text-blue-600',
    portalRoute: '/student-dashboard',
    subjects: [
      { name: 'Engineering Mathematics (50 Marks)', icon: '📐', chaptersCount: 28, description: 'Calculus, Coordinate Geometry, Vectors, Matrices & Complex Numbers' },
      { name: 'Engineering Physics (45 Marks)', icon: '⚙️', chaptersCount: 26, description: 'Mechanics, Electromagnetism, Thermodynamics & Modern Physics' },
      { name: 'Engineering Chemistry (25 Marks)', icon: '🧪', chaptersCount: 22, description: 'Physical, Inorganic & Organic Chemistry for IOE CBT' },
      { name: 'English & Engineering Aptitude (20 Marks)', icon: '📚', chaptersCount: 14, description: 'Grammar, Comprehension, Phonetics & Spatial Aptitude' },
    ],
    keyFeatures: [
      'IOE 140-Marks CBT Timed Simulator (-10% Negative Marking)',
      'Pulchowk Ranker Shortcut & Calculator Tricks',
      '10,000+ Past IOE & KU Entrance Questions',
      'Chapter-wise High-Weightage Formula Sheets',
    ],
  },
  lok_sewa: {
    id: 'lok_sewa',
    legacySlug: 'loksewa',
    courseSlug: 'lok-sewa-aayog-preparation-2082',
    name: 'Samyak Lok Sewa — Public Service Commission Prep',
    shortName: 'Lok Sewa Aayog',
    category: 'civil_service',
    tagline: 'PSC Nepal — Kharidar, Nayab Subba & Section Officer (GK & IQ)',
    badge: 'Kharidar · Nasu · Adhikrit',
    description:
      'Comprehensive Nepal Public Service Commission (Lok Sewa Aayog) preparation covering GK (Geography, History, Constitution, Current Affairs), IQ Mental Agility, and Paper II Governance.',
    badgeBg: 'bg-orange-500/10 dark:bg-orange-500/20',
    badgeText: 'text-orange-600 dark:text-orange-400',
    accentColor: 'border-orange-500 text-orange-600',
    portalRoute: '/student-dashboard',
    subjects: [
      { name: 'General Knowledge (GK)', icon: '🇳🇵', chaptersCount: 24, description: 'Nepal & World Geography, History, Constitution 2072 & Economic Survey' },
      { name: 'General Mental Ability (IQ)', icon: '🧠', chaptersCount: 20, description: 'Verbal, Numerical, Figural Series, Coding-Decoding & Data Matrix' },
      { name: 'Governance & Public Service (Paper II)', icon: '🏛️', chaptersCount: 18, description: 'Public Management, Federalism, Good Governance & Office Procedures' },
      { name: 'Current Affairs & Official Drafting', icon: '📰', chaptersCount: 14, description: 'National/International Events, Tippani, Patra & Report Writing' },
    ],
    keyFeatures: [
      'PSC First Paper (GK + IQ) Timed Mock Exams (-20% Negative Marking)',
      'Updated Nepal Constitution 2072 & 16th Plan Notes',
      'Bilingual (Nepali + English) IQ Shortcut Drills',
      'Weekly Gorkhapatra Wednesday GK Digest',
    ],
  },
  ielts: {
    id: 'ielts',
    legacySlug: 'english',
    courseSlug: 'english-ielts-target-8-mastery',
    name: 'Samyak IELTS — English Language Mastery',
    shortName: 'IELTS & English',
    category: 'language_exam',
    tagline: 'IELTS Academic & General (Target Band 8.0+) & Fluency',
    badge: 'IELTS · Spoken · PTE · CEFR',
    description:
      'Target Band 8.0+ in IELTS Academic & General with AI-powered Speaking Cue Card simulator, Writing Task 1 & 2 essay corrector, and listening audio drills.',
    badgeBg: 'bg-amber-500/10 dark:bg-amber-500/20',
    badgeText: 'text-amber-600 dark:text-amber-400',
    accentColor: 'border-amber-500 text-amber-600',
    portalRoute: '/student-dashboard',
    subjects: [
      { name: 'Listening Module', icon: '🎧', chaptersCount: 16, description: 'Audio Sections 1-4 & Multiple Choice/Map Drills' },
      { name: 'Reading Module', icon: '📖', chaptersCount: 20, description: 'Academic Passage Skimming & True/False/Not Given' },
      { name: 'Writing Task 1 & 2', icon: '✍️', chaptersCount: 24, description: 'Charts, Diagrams & Academic Argument Essays' },
      { name: 'Speaking Simulator', icon: '🗣️', chaptersCount: 18, description: 'Part 1 Interview, Part 2 Cue Card & Part 3 Discussion' },
      { name: 'Grammar & Vocabulary', icon: '💡', chaptersCount: 22, description: 'Academic Word List (AWL) & Collocations' },
    ],
    keyFeatures: [
      'AI Speaking Cue Card Evaluator',
      'Band Score 8.0+ Essay Correction',
      'Listening & Reading Time Simulators',
      'CEFR English Fluency Certifications',
    ],
  },
  digital_marketing: {
    id: 'digital_marketing',
    legacySlug: 'digital',
    courseSlug: 'digital-marketing-canva-freelancing',
    name: 'Samyak Digital — Career & Marketing Skills',
    shortName: 'Digital Marketing',
    category: 'digital_skills',
    tagline: 'High-Income Marketing, Meta Ads & Freelance Portfolio',
    badge: 'Meta Ads · SEO · Content · Funnels',
    description:
      'Learn modern performance marketing: Facebook/Instagram Ads, TikTok viral growth, SEO optimization, high-converting copywriting, and Upwork/Fiverr gig setup.',
    badgeBg: 'bg-rose-500/10 dark:bg-rose-500/20',
    badgeText: 'text-rose-600 dark:text-rose-400',
    accentColor: 'border-rose-500 text-rose-600',
    portalRoute: '/student-dashboard',
    subjects: [
      { name: 'Meta & Instagram Ads', icon: '📱', chaptersCount: 18, description: 'Pixel Setup, Retargeting & Scaling Budgets' },
      { name: 'TikTok & Viral Content', icon: '🎥', chaptersCount: 14, description: 'Short-form Hooks, Scripting & Organic Growth' },
      { name: 'Search Engine Optimization (SEO)', icon: '🔍', chaptersCount: 16, description: 'Keyword Research, On-Page & Technical SEO' },
      { name: 'Copywriting & Funnels', icon: '📝', chaptersCount: 12, description: 'Sales Pages, Email Sequences & Conversion Rate Optimization' },
      { name: 'Freelancing & Client Acquisition', icon: '💼', chaptersCount: 10, description: 'Upwork, Fiverr & Global Remote Clients' },
    ],
    keyFeatures: [
      'Live Ad Campaign Playbooks',
      'Swipe Files & High-Converting Copy Templates',
      'Client Portfolio Project Submissions',
      'Professional Certification of Completion',
    ],
  },
  artificial_intelligence: {
    id: 'artificial_intelligence',
    legacySlug: 'digital',
    courseSlug: 'digital-python-programming-zero-to-hero',
    name: 'Samyak AI — AI & Python Academy',
    shortName: 'AI & Python',
    category: 'tech_ai',
    tagline: 'Prompt Engineering, AI Tools, Automation & Python',
    badge: 'LLMs · Prompt Studio · Python · Automation',
    description:
      'Future-proof your skills with ChatGPT, Claude, Midjourney Prompt Engineering, No-Code AI Workflows, Python automation, and real-world AI applications.',
    badgeBg: 'bg-purple-500/10 dark:bg-purple-500/20',
    badgeText: 'text-purple-600 dark:text-purple-400',
    accentColor: 'border-purple-500 text-purple-600',
    portalRoute: '/student-dashboard',
    subjects: [
      { name: 'Prompt Engineering Studio', icon: '🤖', chaptersCount: 16, description: 'Zero-Shot, Few-Shot, Chain-of-Thought & Frameworks' },
      { name: 'Modern AI Tools & Workflows', icon: '⚡', chaptersCount: 14, description: 'ChatGPT, Claude, Perplexity & Midjourney' },
      { name: 'Python for AI & Scripting', icon: '🐍', chaptersCount: 22, description: 'Beginner Syntax, Web Scraping & API Automation' },
      { name: 'AI Automation & Agents', icon: '⚙️', chaptersCount: 15, description: 'Make.com, Zapier, n8n & Automated Content Bots' },
      { name: 'Real-World AI Projects', icon: '🚀', chaptersCount: 12, description: 'Custom GPTs, AI Chatbots & Freelance AI Services' },
    ],
    keyFeatures: [
      'Interactive AI Prompt Grading Sandbox',
      '5 Real-World Hands-On Coding Projects',
      '1,000+ Curated Prompt Library',
      'AI Specialist Certification',
    ],
  },
};

// Backward compatibility map for legacy lookup:
export const PROGRAMS: Record<string, ProgramDetails> = {
  ...COURSES_MAP,
  see: COURSES_MAP.see_class_10,
  class11: COURSES_MAP.neb_class_11,
  class12: COURSES_MAP.neb_class_12,
  cee: COURSES_MAP.cee_medical,
  ioe: COURSES_MAP.ioe_engineering,
  engineering: COURSES_MAP.ioe_engineering,
  loksewa: COURSES_MAP.lok_sewa,
  english: COURSES_MAP.ielts,
  digital: COURSES_MAP.artificial_intelligence,
  ai: COURSES_MAP.artificial_intelligence,
};

export interface ProgramContextType {
  program: CanonicalCourseId;
  rawProgram: ProgramType;
  setProgram: (p: ProgramType) => void;
  programDetails: ProgramDetails;
  allCourses: ProgramDetails[];
  isSee: boolean;
  isClass11: boolean;
  isClass12: boolean;
  isCee: boolean;
  isIoe: boolean;
  isLokSewa: boolean;
  isIelts: boolean;
  isDigitalMarketing: boolean;
  isAi: boolean;
  isDigitalOrAi: boolean;
}

const ProgramContext = createContext<ProgramContextType>({
  program: 'cee_medical',
  rawProgram: 'cee_medical',
  setProgram: () => {},
  programDetails: COURSES_MAP.cee_medical,
  allCourses: CANONICAL_COURSES.map((id) => COURSES_MAP[id]),
  isSee: false,
  isClass11: false,
  isClass12: false,
  isCee: true,
  isIoe: false,
  isLokSewa: false,
  isIelts: false,
  isDigitalMarketing: false,
  isAi: false,
  isDigitalOrAi: false,
});

export function ProgramProvider({ children }: { children: React.ReactNode }) {
  const [program, setProgramState] = useState<CanonicalCourseId>('cee_medical');
  const [rawProgram, setRawProgram] = useState<ProgramType>('cee_medical');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('samyak_active_program') as ProgramType;
      if (saved) {
        const normalized = normalizeCourseId(saved);
        setProgramState(normalized);
        setRawProgram(saved);
      }
    }
  }, []);

  const setProgram = (p: ProgramType) => {
    const normalized = normalizeCourseId(p);
    setProgramState(normalized);
    setRawProgram(p);
    if (typeof window !== 'undefined') {
      localStorage.setItem('samyak_active_program', normalized);
    }
  };

  const programDetails = COURSES_MAP[program] || COURSES_MAP.cee_medical;
  const allCourses = CANONICAL_COURSES.map((id) => COURSES_MAP[id]);

  const isSee = program === 'see_class_10';
  const isClass11 = program === 'neb_class_11';
  const isClass12 = program === 'neb_class_12';
  const isCee = program === 'cee_medical';
  const isIoe = program === 'ioe_engineering';
  const isLokSewa = program === 'lok_sewa';
  const isIelts = program === 'ielts';
  const isDigitalMarketing = program === 'digital_marketing';
  const isAi = program === 'artificial_intelligence';
  const isDigitalOrAi = isDigitalMarketing || isAi;

  return (
    <ProgramContext.Provider
      value={{
        program,
        rawProgram,
        setProgram,
        programDetails,
        allCourses,
        isSee,
        isClass11,
        isClass12,
        isCee,
        isIoe,
        isLokSewa,
        isIelts,
        isDigitalMarketing,
        isAi,
        isDigitalOrAi,
      }}
    >
      {children}
    </ProgramContext.Provider>
  );
}

export function useProgram() {
  return useContext(ProgramContext);
}
