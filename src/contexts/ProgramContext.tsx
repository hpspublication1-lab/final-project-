'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type ProgramType = 'cee' | 'see' | 'english' | 'digital';

export interface ProgramDetails {
  id: ProgramType;
  name: string;
  shortName: string;
  tagline: string;
  badge: string;
  description: string;
  badgeBg: string;
  badgeText: string;
  accentColor: string;
  subjects: { name: string; icon: string; chaptersCount: number }[];
}

export const PROGRAMS: Record<ProgramType, ProgramDetails> = {
  cee: {
    id: 'cee',
    name: 'CEE Medical Entrance',
    shortName: 'CEE Prep',
    tagline: 'Nepal Medical Education Commission Entrance Exam',
    badge: 'MBBS · BDS · B.Sc Nursing',
    description: 'Master Medical Entrance with 15,000+ MCQs, Bunny HD video lectures, 2-player battles, and chapter notes.',
    badgeBg: 'bg-primary/10',
    badgeText: 'text-primary',
    accentColor: 'border-primary text-primary',
    subjects: [
      { name: 'Biology', icon: '🧬', chaptersCount: 28 },
      { name: 'Chemistry', icon: '🧪', chaptersCount: 22 },
      { name: 'Physics', icon: '⚡', chaptersCount: 18 },
      { name: 'Mental Agility', icon: '🧠', chaptersCount: 12 },
    ],
  },
  see: {
    id: 'see',
    name: 'SEE Class 10 Board',
    shortName: 'SEE Class 10',
    tagline: 'Secondary Education Examination (Nepal Board)',
    badge: 'Grade 10 · NEB Board',
    description: 'Ace your Class 10 SEE Board Exam with model question papers, video lectures, past paper solutions, and revision notes.',
    badgeBg: 'bg-bio-light',
    badgeText: 'text-bio',
    accentColor: 'border-bio text-bio',
    subjects: [
      { name: 'Compulsory Science', icon: '🔬', chaptersCount: 24 },
      { name: 'Compulsory Math', icon: '📐', chaptersCount: 20 },
      { name: 'Optional Math', icon: '📊', chaptersCount: 16 },
      { name: 'English', icon: '📚', chaptersCount: 15 },
      { name: 'Social Studies', icon: '🌍', chaptersCount: 18 },
    ],
  },
  english: {
    id: 'english',
    name: 'English Learning Mastery',
    shortName: 'English Learning',
    tagline: 'Fluency, IELTS, PTE & Practical Communication',
    badge: 'Spoken · IELTS · PTE · Grammar',
    description: 'Master spoken English, crack IELTS/PTE with target 8.0+ bands, refine grammar, and speak with confidence using AI practice.',
    badgeBg: 'bg-amber-500/10',
    badgeText: 'text-amber-600',
    accentColor: 'border-amber-500 text-amber-600',
    subjects: [
      { name: 'Spoken English', icon: '🗣️', chaptersCount: 16 },
      { name: 'IELTS Academic & GT', icon: '🎓', chaptersCount: 20 },
      { name: 'PTE Academic Masterclass', icon: '🎧', chaptersCount: 18 },
      { name: 'Grammar & Vocabulary', icon: '✍️', chaptersCount: 25 },
    ],
  },
  digital: {
    id: 'digital',
    name: 'Digital Skills & AI Academy',
    shortName: 'Digital & AI',
    tagline: 'Practical Tech, Artificial Intelligence & Modern Skills',
    badge: 'AI Tools · Python · Digital Marketing · Design',
    description: 'Learn in-demand modern skills: AI prompts, ChatGPT automation, Python programming basics, Canva design, and digital marketing.',
    badgeBg: 'bg-purple-500/10',
    badgeText: 'text-purple-600',
    accentColor: 'border-purple-500 text-purple-600',
    subjects: [
      { name: 'AI & Prompt Engineering', icon: '🤖', chaptersCount: 14 },
      { name: 'Python for Beginners', icon: '🐍', chaptersCount: 22 },
      { name: 'Digital Marketing & Social', icon: '📈', chaptersCount: 18 },
      { name: 'Graphic Design & Canva', icon: '🎨', chaptersCount: 12 },
    ],
  },
};

export interface ProgramContextType {
  program: ProgramType;
  setProgram: (p: ProgramType) => void;
  programDetails: ProgramDetails;
}

const ProgramContext = createContext<ProgramContextType>({
  program: 'cee',
  setProgram: () => {},
  programDetails: PROGRAMS.cee,
});

export function ProgramProvider({ children }: { children: React.ReactNode }) {
  const [program, setProgramState] = useState<ProgramType>('cee');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('samyak_active_program') as ProgramType;
      if (saved && ['cee', 'see', 'english', 'digital'].includes(saved)) {
        setProgramState(saved);
      }
    }
  }, []);


  const setProgram = (p: ProgramType) => {
    setProgramState(p);
    if (typeof window !== 'undefined') {
      localStorage.setItem('samyak_active_program', p);
    }
  };

  return (
    <ProgramContext.Provider value={{ program, setProgram, programDetails: PROGRAMS[program] }}>
      {children}
    </ProgramContext.Provider>
  );
}

export function useProgram() {
  return useContext(ProgramContext);
}
