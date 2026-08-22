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

const marketingSubjects = [
  {
    key: 'mkt-meta',
    name: 'Meta & Instagram Ads',
    icon: Globe,
    color: 'text-rose-600',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    chapters: 18,
    mcqs: 800,
    notes: 120,
    topics: ['Pixel Setup', 'Lookalike Audiences', 'A/B Creative Testing', 'Scaling High-ROAS Ads'],
    description: 'Master Facebook and Instagram paid ad infrastructure and conversion funnels.',
    weight: 'High ROAS',
  },
  {
    key: 'mkt-tiktok',
    name: 'TikTok Viral Short-Form Growth',
    icon: Sparkles,
    color: 'text-rose-600',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    chapters: 14,
    mcqs: 600,
    notes: 95,
    topics: ['Hook Scripting', 'Retention Hacks', 'Trending Audios', 'Viral Storytelling'],
    description: 'Grow organic follower bases and drive product sales with short-form videos.',
    weight: 'Organic',
  },
  {
    key: 'mkt-seo',
    name: 'Search Engine Optimization (SEO)',
    icon: BookOpen,
    color: 'text-rose-600',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    chapters: 16,
    mcqs: 750,
    notes: 110,
    topics: ['Keyword Discovery', 'Technical Audits', 'On-Page SEO', 'Backlink Building'],
    description: 'Rank websites on Google top 3 search results and capture high-intent organic traffic.',
    weight: 'Google #1',
  },
  {
    key: 'mkt-copy',
    name: 'Copywriting & Sales Funnels',
    icon: Book,
    color: 'text-rose-600',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    chapters: 15,
    mcqs: 650,
    notes: 105,
    topics: ['Landing Page Copy', 'Email Sequences', 'Headline Formulas', 'Client Upwork Blueprints'],
    description: 'High-converting copywriting frameworks and global freelance client acquisition.',
    weight: 'Conversion',
  },
];

const aiSubjects = [
  {
    key: 'ai-prompt',
    name: 'Prompt Engineering Studio',
    icon: Brain,
    color: 'text-purple-600',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    chapters: 20,
    mcqs: 1200,
    notes: 160,
    topics: ['Role-Task-Format (RTF)', 'Chain-of-Thought', 'Zero & Few Shot', 'Prompt Optimization'],
    description: 'Master advanced prompting frameworks for ChatGPT, Claude, and Midjourney.',
    weight: 'Live Studio',
  },
  {
    key: 'ai-python',
    name: 'Python for AI & Data',
    icon: Calculator,
    color: 'text-purple-600',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    chapters: 22,
    mcqs: 1400,
    notes: 190,
    topics: ['Syntax Basics', 'Data Wrangling', 'Web Scraping', '5 Real-World Coding Projects'],
    description: 'Hands-on programming from scratch to building custom data pipelines and bots.',
    weight: '5 Projects',
  },
  {
    key: 'ai-tools',
    name: 'Modern AI Tools & Workflows',
    icon: Sparkles,
    color: 'text-purple-600',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    chapters: 15,
    mcqs: 900,
    notes: 130,
    topics: ['ChatGPT & Claude 3.5', 'Midjourney v6', 'Perplexity Pro', 'Voice Synthesis'],
    description: '10x your study and work speed using cutting-edge AI generation suites.',
    weight: '10x Speed',
  },
  {
    key: 'ai-auto',
    name: 'No-Code AI Automation & Agents',
    icon: Globe,
    color: 'text-purple-600',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    chapters: 14,
    mcqs: 800,
    notes: 115,
    topics: ['Make.com Scenarios', 'Zapier Workflows', 'Custom GPTs', 'Automated Agents'],
    description: 'Build self-running automated business pipelines without writing code.',
    weight: 'Automation',
  },
];

export default function SubjectsSection() {
  const [tab, setTab] = useState<'see_class_10' | 'cee_medical' | 'ielts' | 'digital_marketing' | 'artificial_intelligence'>('see_class_10');

  const getSubjects = () => {
    switch (tab) {
      case 'see_class_10': return seeSubjects;
      case 'cee_medical': return ceeSubjects;
      case 'ielts': return englishSubjects;
      case 'digital_marketing': return marketingSubjects;
      case 'artificial_intelligence': return aiSubjects;
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
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">5 Course Portals</span>
            </div>
            <h2 className="text-hero-md text-foreground font-black">
              {tab === 'see_class_10' && 'SEE Class 10 Board Syllabus'}
              {tab === 'cee_medical' && 'CEE Medical Entrance Syllabus'}
              {tab === 'ielts' && 'IELTS & English Fluency Modules'}
              {tab === 'digital_marketing' && 'Digital Marketing Specialization'}
              {tab === 'artificial_intelligence' && 'Artificial Intelligence Curriculum'}
            </h2>
            <p className="text-muted-foreground mt-1 max-w-lg text-sm">
              {tab === 'see_class_10' && 'Complete Class 10 NEB Board subjects with past papers and AI handwritten answer grading.'}
              {tab === 'cee_medical' && 'Chapter-wise notes, HD video lectures, and 15,000+ MCQs for all CEE Medical subjects.'}
              {tab === 'ielts' && '4 Core skills with real-time AI Speaking Examiner, Writing Task 1/2 rubrics, and audio sets.'}
              {tab === 'digital_marketing' && 'Performance marketing playbooks, Meta/TikTok ads, SEO, and 100+ swipe files.'}
              {tab === 'artificial_intelligence' && 'Interactive prompt engineering sandbox, Python coding, and AI automation agents.'}
            </p>
          </div>

          {/* 5-Course Switcher Tabs */}
          <div className="flex flex-wrap items-center p-1.5 bg-muted/80 backdrop-blur border border-border rounded-2xl shadow-xs shrink-0 gap-1">
            <button
              onClick={() => setTab('see_class_10')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                tab === 'see_class_10'
                  ? 'bg-card text-emerald-600 shadow-sm border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <GraduationCap size={14} /> SEE Class 10
            </button>

            <button
              onClick={() => setTab('cee_medical')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                tab === 'cee_medical'
                  ? 'bg-card text-indigo-600 shadow-sm border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <BookOpen size={14} /> CEE Medical
            </button>

            <button
              onClick={() => setTab('ielts')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                tab === 'ielts'
                  ? 'bg-card text-amber-600 shadow-sm border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Globe size={14} /> IELTS English
            </button>

            <button
              onClick={() => setTab('digital_marketing')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                tab === 'digital_marketing'
                  ? 'bg-card text-rose-600 shadow-sm border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sparkles size={14} /> Marketing
            </button>

            <button
              onClick={() => setTab('artificial_intelligence')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                tab === 'artificial_intelligence'
                  ? 'bg-card text-purple-600 shadow-sm border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Brain size={14} /> AI Academy
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