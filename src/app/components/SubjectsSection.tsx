'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Atom, FlaskRound, Brain, GraduationCap, Calculator, Globe, Book, Sparkles } from 'lucide-react';

const ceeSubjects = [
  {
    key: 'subj-bio',
    name: 'Biology',
    icon: BookOpen,
    color: 'text-bio',
    bg: 'bg-bio-light',
    border: 'border-bio/20',
    chapters: 28,
    mcqs: 4800,
    notes: 340,
    topics: ['Cell Biology', 'Genetics', 'Human Physiology', 'Ecology', 'Botany'],
    description: '40% weightage in CEE — master cell biology, genetics, physiology, and ecology.',
    weight: '40%',
  },
  {
    key: 'subj-chem',
    name: 'Chemistry',
    icon: FlaskRound,
    color: 'text-chem',
    bg: 'bg-chem-light',
    border: 'border-chem/20',
    chapters: 22,
    mcqs: 3600,
    notes: 280,
    topics: ['Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry'],
    description: '35% weightage — cover chemical reactions, equilibrium, and organic mechanisms.',
    weight: '35%',
  },
  {
    key: 'subj-physics',
    name: 'Physics',
    icon: Atom,
    color: 'text-physics',
    bg: 'bg-physics-light',
    border: 'border-physics/20',
    chapters: 18,
    mcqs: 2800,
    notes: 220,
    topics: ['Mechanics', 'Thermodynamics', 'Optics', 'Electricity', 'Modern Physics'],
    description: '20% weightage — build strong problem-solving skills with visual notes.',
    weight: '20%',
  },
  {
    key: 'subj-ma',
    name: 'Mental Agility',
    icon: Brain,
    color: 'text-ma',
    bg: 'bg-ma-light',
    border: 'border-ma/20',
    chapters: 12,
    mcqs: 1800,
    notes: 160,
    topics: ['Logical Reasoning', 'Verbal Ability', 'Numerical Ability'],
    description: '5% weightage — daily timed practice to sharpen speed and logic.',
    weight: '5%',
  },
];

const seeSubjects = [
  {
    key: 'see-sci',
    name: 'Compulsory Science',
    icon: Atom,
    color: 'text-bio',
    bg: 'bg-bio-light',
    border: 'border-bio/20',
    chapters: 24,
    mcqs: 3200,
    notes: 250,
    topics: ['Physics (Force & Pressure)', 'Chemistry (Metals)', 'Biology (Heredity)', 'Astronomy'],
    description: 'Class 10 NEB Science syllabus with chapter experiments and board question solutions.',
    weight: '100 Marks',
  },
  {
    key: 'see-math',
    name: 'Compulsory Mathematics',
    icon: Calculator,
    color: 'text-chem',
    bg: 'bg-chem-light',
    border: 'border-chem/20',
    chapters: 20,
    mcqs: 2500,
    notes: 200,
    topics: ['Sets & Arithmetic', 'Algebra & Equations', 'Geometry Proofs', 'Trigonometry & Stats'],
    description: 'Complete Class 10 Math problem sets with step-by-step video solutions.',
    weight: '100 Marks',
  },
  {
    key: 'see-optmath',
    name: 'Optional Mathematics',
    icon: Sparkles,
    color: 'text-physics',
    bg: 'bg-physics-light',
    border: 'border-physics/20',
    chapters: 16,
    mcqs: 2100,
    notes: 180,
    topics: ['Functions & Polynomials', 'Matrices', 'Coordinate Geometry', 'Vectors & Transformation'],
    description: 'Higher math foundation for Class 10 students aiming for Science in +2 / CEE.',
    weight: '100 Marks',
  },
  {
    key: 'see-eng',
    name: 'English & Social Studies',
    icon: Globe,
    color: 'text-ma',
    bg: 'bg-ma-light',
    border: 'border-ma/20',
    chapters: 22,
    mcqs: 1900,
    notes: 190,
    topics: ['Grammar & Essay Writing', 'Nepal History & Constitution', 'Civics & Geography'],
    description: 'Grammar practice, unseen passages, and complete Social Studies unit notes.',
    weight: '100 Marks',
  },
];

const englishSubjects = [
  {
    key: 'eng-spk',
    name: 'Spoken English & Fluency',
    icon: Globe,
    color: 'text-amber-600',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    chapters: 16,
    mcqs: 1200,
    notes: 140,
    topics: ['Daily Drills', 'Accent & Intonation', 'Job Interviews', 'Public Speaking'],
    description: 'Build confidence with real-world conversational scenarios and AI feedback.',
    weight: 'Fluency',
  },
  {
    key: 'eng-ielts',
    name: 'IELTS Academic & GT',
    icon: Book,
    color: 'text-amber-600',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    chapters: 20,
    mcqs: 1800,
    notes: 190,
    topics: ['Speaking Mocks', 'Writing Task 1 & 2', 'Listening Audio', 'Reading Passages'],
    description: 'Target Band 8.0+ with examiner strategies and automated writing checks.',
    weight: 'Band 8.0+',
  },
  {
    key: 'eng-pte',
    name: 'PTE Academic Masterclass',
    icon: Sparkles,
    color: 'text-amber-600',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    chapters: 18,
    mcqs: 1500,
    notes: 160,
    topics: ['Describe Image', 'Retell Lecture', 'Repeat Sentence', 'Summarize Text'],
    description: 'PTE 79+ proven templates, exam tips, and computer-scoring preparation.',
    weight: 'Score 79+',
  },
  {
    key: 'eng-gram',
    name: 'Grammar & Vocabulary',
    icon: BookOpen,
    color: 'text-amber-600',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    chapters: 25,
    mcqs: 2200,
    notes: 210,
    topics: ['Tenses & Articles', 'Prepositions', 'Academic Words', 'Idioms & Phrases'],
    description: 'Essential grammar rules and high-frequency vocabulary lists.',
    weight: 'Core Skill',
  },
];

const digitalSubjects = [
  {
    key: 'dig-ai',
    name: 'AI & Prompt Engineering',
    icon: Brain,
    color: 'text-purple-600',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    chapters: 14,
    mcqs: 1100,
    notes: 130,
    topics: ['ChatGPT Prompts', 'Midjourney Images', 'AI Workflows', 'Claude & Automation'],
    description: 'Master practical AI tools to 10x your productivity at study or work.',
    weight: 'Top Tech',
  },
  {
    key: 'dig-python',
    name: 'Python for Beginners',
    icon: Calculator,
    color: 'text-purple-600',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    chapters: 22,
    mcqs: 2400,
    notes: 220,
    topics: ['Syntax & Loops', 'Functions & OOP', 'Web Scraping', 'Data Analysis'],
    description: 'Learn to code in Python with step-by-step projects from zero prior experience.',
    weight: 'Programming',
  },
  {
    key: 'dig-mkt',
    name: 'Digital Marketing & Social Ads',
    icon: Globe,
    color: 'text-purple-600',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    chapters: 18,
    mcqs: 1600,
    notes: 170,
    topics: ['Facebook & TikTok Ads', 'SEO Basics', 'Content Strategy', 'Copywriting'],
    description: 'Launch campaigns, build audiences, and drive online sales for businesses.',
    weight: 'Marketing',
  },
  {
    key: 'dig-des',
    name: 'Graphic Design & Canva',
    icon: Sparkles,
    color: 'text-purple-600',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    chapters: 12,
    mcqs: 950,
    notes: 110,
    topics: ['Canva Pro Features', 'Social Media Graphics', 'Branding Kits', 'Portfolio'],
    description: 'Design eye-catching social posts, thumbnails, and banners effortlessly.',
    weight: 'Creative',
  },
];

export default function SubjectsSection() {
  const [tab, setTab] = useState<'cee' | 'see' | 'english' | 'digital'>('cee');

  const getSubjects = () => {
    switch (tab) {
      case 'cee': return ceeSubjects;
      case 'see': return seeSubjects;
      case 'english': return englishSubjects;
      case 'digital': return digitalSubjects;
    }
  };

  const currentSubjects = getSubjects();

  return (
    <section id="subjects" className="py-16 bg-background">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="section-label">Curriculum &amp; Syllabus</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">4 Learning Sectors</span>
            </div>
            <h2 className="text-hero-md text-foreground">
              {tab === 'cee' && 'CEE Medical Entrance Syllabus'}
              {tab === 'see' && 'SEE Class 10 Board Syllabus'}
              {tab === 'english' && 'English Fluency & IELTS/PTE Modules'}
              {tab === 'digital' && 'Digital Skills & AI Curriculum'}
            </h2>
            <p className="text-muted-foreground mt-1 max-w-lg">
              {tab === 'cee' && 'Chapter-wise notes, videos, and MCQs for all four CEE Medical subjects.'}
              {tab === 'see' && 'Complete Class 10 NEB Board subjects with past papers and model solutions.'}
              {tab === 'english' && 'Structured modules for speaking fluency, test preparation, and grammar.'}
              {tab === 'digital' && 'Hands-on courses for AI tools, coding, marketing, and design.'}
            </p>
          </div>

          {/* 4-Sector Switcher Tabs */}
          <div className="flex flex-wrap items-center p-1.5 bg-muted/80 backdrop-blur border border-border rounded-2xl shadow-xs shrink-0 gap-1">
            <button
              onClick={() => setTab('cee')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                tab === 'cee'
                  ? 'bg-card text-primary shadow-sm border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <BookOpen size={14} /> CEE Medical
            </button>

            <button
              onClick={() => setTab('see')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                tab === 'see'
                  ? 'bg-card text-bio shadow-sm border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <GraduationCap size={14} /> SEE Class 10
            </button>

            <button
              onClick={() => setTab('english')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                tab === 'english'
                  ? 'bg-card text-amber-600 shadow-sm border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Globe size={14} /> English &amp; IELTS
            </button>

            <button
              onClick={() => setTab('digital')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                tab === 'digital'
                  ? 'bg-card text-purple-600 shadow-sm border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Brain size={14} /> Digital &amp; AI
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {currentSubjects.map((subj) => (
            <div
              key={subj.key}
              className={`relative overflow-hidden bg-card/80 backdrop-blur-xl border ${subj.border} rounded-3xl p-6 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group`}
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-2xl ${subj.bg} flex items-center justify-center border border-white/20 dark:border-white/10 shadow-xs group-hover:scale-105 transition-transform`}>
                    <subj.icon size={22} className={subj.color} />
                  </div>
                  <span className={`text-[11px] font-extrabold ${subj.color} ${subj.bg} px-2.5 py-1 rounded-full border border-current/20 uppercase`}>
                    {subj.weight}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">{subj.name}</h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{subj.description}</p>

                <div className="flex flex-wrap gap-1.5 mt-4">
                  {subj.topics.map((t) => (
                    <span key={t} className="text-[10px] font-medium bg-muted/60 text-muted-foreground px-2 py-0.5 rounded-md">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border/60 flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                  <span>{subj.chapters} Ch.</span>
                  <span>·</span>
                  <span>{subj.mcqs} MCQs</span>
                </div>
                <Link
                  href="/subjects"
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary group-hover:translate-x-1 transition-transform"
                >
                  Explore <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}