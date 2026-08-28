'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type CanonicalCourseId =
  | 'see_class_10'
  | 'cee_medical'
  | 'ielts'
  | 'digital_marketing'
  | 'artificial_intelligence';

export type ProgramType =
  | CanonicalCourseId
  | 'cee'
  | 'see'
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
  name: string;
  shortName: string;
  category: 'academic_board' | 'medical_entrance' | 'language_exam' | 'digital_skills' | 'tech_ai';
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
  'see_class_10',
  'cee_medical',
  'ielts',
  'digital_marketing',
  'artificial_intelligence',
];

export function normalizeCourseId(rawId?: string | null): CanonicalCourseId {
  if (!rawId) return 'cee_medical';
  const id = rawId.toLowerCase().trim();
  if (id === 'see' || id === 'see_class_10' || id.includes('see-')) return 'see_class_10';
  if (id === 'cee' || id === 'cee_medical' || id.includes('cee-')) return 'cee_medical';
  if (id === 'ielts' || id === 'english' || id.includes('ielts-') || id.includes('pte-')) return 'ielts';
  if (id === 'digital_marketing' || id === 'marketing' || id.includes('marketing-')) return 'digital_marketing';
  if (id === 'artificial_intelligence' || id === 'ai' || id === 'digital' || id.includes('ai-') || id.includes('python-')) return 'artificial_intelligence';
  return 'cee_medical';
}

export const COURSES_MAP: Record<CanonicalCourseId, ProgramDetails> = {
  see_class_10: {
    id: 'see_class_10',
    legacySlug: 'see',
    name: 'Samyak SEE — Class 10 Board Exam',
    shortName: 'Samyak SEE',
    category: 'academic_board',
    tagline: 'Secondary Education Examination (Nepal Board)',
    badge: 'Grade 10 · NEB Board',
    description: 'Master your Class 10 SEE Board Exam with NEB model question papers, chapter video lectures, AI handwritten subjective grading, and previous 10-year past solutions.',
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
  cee_medical: {
    id: 'cee_medical',
    legacySlug: 'cee',
    name: 'Samyak CEE — Medical Entrance Prep',
    shortName: 'Samyak CEE',
    category: 'medical_entrance',
    tagline: 'Nepal Medical Education Commission (MECEE) Entrance Exam',
    badge: 'MBBS · BDS · B.Sc Nursing',
    description: 'Ace Nepal Medical Entrance with 15,000+ topic-wise MCQs, 200-question timed MEC mock exams, real-time 2-player battle arena, and high-yield notes.',
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
  ielts: {
    id: 'ielts',
    legacySlug: 'english',
    name: 'Samyak IELTS — English Language Mastery',
    shortName: 'Samyak IELTS',
    category: 'language_exam',
    tagline: 'IELTS Academic & General (Target Band 8.0+) & Fluency',
    badge: 'IELTS · Spoken · PTE · CEFR',
    description: 'Target Band 8.0+ in IELTS Academic & General with AI-powered Speaking Cue Card simulator, Writing Task 1 & 2 essay corrector, and listening audio drills.',
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
    name: 'Samyak Digital — Career & Marketing Skills',
    shortName: 'Samyak Digital',
    category: 'digital_skills',
    tagline: 'High-Income Marketing, Meta Ads & Freelance Portfolio',
    badge: 'Meta Ads · SEO · Content · Funnels',
    description: 'Learn modern performance marketing: Facebook/Instagram Ads, TikTok viral growth, SEO optimization, high-converting copywriting, and Upwork/Fiverr gig setup.',
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
    name: 'Samyak AI — AI Academy',
    shortName: 'Samyak AI',
    category: 'tech_ai',
    tagline: 'Prompt Engineering, AI Tools, Automation & Python',
    badge: 'LLMs · Prompt Studio · Python · Automation',
    description: 'Future-proof your skills with ChatGPT, Claude, Midjourney Prompt Engineering, No-Code AI Workflows, Python automation, and real-world AI applications.',
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

// Backward compatibility map for legacy 4-program lookup:
export const PROGRAMS: Record<string, ProgramDetails> = {
  ...COURSES_MAP,
  see: COURSES_MAP.see_class_10,
  cee: COURSES_MAP.cee_medical,
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
}

const ProgramContext = createContext<ProgramContextType>({
  program: 'cee_medical',
  rawProgram: 'cee_medical',
  setProgram: () => {},
  programDetails: COURSES_MAP.cee_medical,
  allCourses: CANONICAL_COURSES.map((id) => COURSES_MAP[id]),
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

  return (
    <ProgramContext.Provider
      value={{
        program,
        rawProgram,
        setProgram,
        programDetails,
        allCourses,
      }}
    >
      {children}
    </ProgramContext.Provider>
  );
}

export function useProgram() {
  return useContext(ProgramContext);
}

