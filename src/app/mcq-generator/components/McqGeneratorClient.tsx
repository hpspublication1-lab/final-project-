'use client';

import React, { useState, useEffect } from 'react';
import { useChat } from '@/lib/hooks/useChat';
import DashboardLayout from '@/components/DashboardLayout';
import { Zap, RefreshCw, CheckCircle, XCircle, ChevronRight, Loader2, BookOpen, FlaskConical, Atom, Brain, ListChecks } from 'lucide-react';
import toast from 'react-hot-toast';
import Icon from '@/components/ui/AppIcon';


import { useProgram, normalizeCourseId } from '@/contexts/ProgramContext';

interface MCQOption {
  key: 'A' | 'B' | 'C' | 'D';
  text: string;
}

interface MCQ {
  id: number;
  question: string;
  options: MCQOption[];
  correct: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

const TRACK_SUBJECTS: Record<string, string[]> = {
  cee_medical: ['Biology', 'Chemistry', 'Physics', 'Mental Agility'],
  see_class_10: ['Compulsory Science', 'Compulsory Math', 'Optional Math', 'English', 'Social Studies'],
  ielts: ['Grammar & Vocabulary', 'Reading Comprehension', 'Listening Drills', 'Writing Tasks'],
  digital_marketing: ['Meta & Instagram Ads', 'SEO Optimization', 'Copywriting & Funnels', 'TikTok Growth'],
  artificial_intelligence: ['Prompt Engineering', 'Python for AI', 'Modern AI Tools', 'AI Automation'],
};

const TRACK_CHAPTERS: Record<string, Record<string, string[]>> = {
  cee_medical: {
    Biology: ['Cell Biology', 'Genetics', 'Evolution', 'Ecology', 'Human Physiology', 'Plant Physiology', 'Microbiology'],
    Chemistry: ['Atomic Structure', 'Chemical Bonding', 'Thermodynamics', 'Electrochemistry', 'Organic Chemistry', 'Equilibrium'],
    Physics: ['Mechanics', 'Thermodynamics', 'Waves & Optics', 'Electrostatics', 'Magnetism', 'Modern Physics'],
    'Mental Agility': ['Number Series', 'Logical Reasoning', 'Blood Relations', 'Coding-Decoding', 'Analogies'],
  },
  see_class_10: {
    'Compulsory Science': ['Force and Gravity', 'Pressure', 'Energy and Heat', 'Light and Sound', 'Chemical Reaction', 'Heredity'],
    'Compulsory Math': ['Sets', 'Compound Interest', 'Mensuration', 'Quadratic Equations', 'Geometry Circles', 'Statistics'],
    'Optional Math': ['Functions and Polynomials', 'Matrices', 'Coordinate Geometry', 'Trigonometry', 'Vectors'],
    English: ['Reading Comprehension', 'Grammar Transformation', 'Guided Writing', 'Essay Writing'],
    'Social Studies': ['We and Our Society', 'Constitution of Nepal', 'Social Problems', 'International Relations'],
  },
  ielts: {
    'Grammar & Vocabulary': ['Academic Word List 500', 'Collocations & Idioms', 'Tense Structures', 'Conditionals'],
    'Reading Comprehension': ['Skimming & Scanning', 'True / False / Not Given', 'Matching Headings', 'Summary Completion'],
    'Listening Drills': ['Section 1 Everyday Conversation', 'Section 2 Monologue', 'Section 3 Academic Discussion', 'Section 4 Lecture Notes'],
    'Writing Tasks': ['Task 1 Bar & Line Charts', 'Task 1 Process Diagrams', 'Task 2 Opinion Essays', 'Task 2 Problem-Solution'],
  },
  digital_marketing: {
    'Meta & Instagram Ads': ['Pixel & Conversion API', 'Audience Targeting', 'Ad Creative Formats', 'Budget Scaling'],
    'SEO Optimization': ['Keyword Research', 'On-Page SEO', 'Technical SEO', 'Backlink Acquisition'],
    'Copywriting & Funnels': ['AIDA Framework', 'Landing Page Headlines', 'Email Sequence Writing', 'Conversion Optimization'],
    'TikTok Growth': ['Short-Form Hooks', 'Algorithm Mechanics', 'Scripting & Trends', 'Organic Funneling'],
  },
  artificial_intelligence: {
    'Prompt Engineering': ['Zero-Shot & Few-Shot', 'Chain-of-Thought Prompting', 'Persona-Based Prompts', 'Role Frameworks'],
    'Python for AI': ['Python Basics & Data Structures', 'Requests & Web Scraping', 'OpenAI SDK Integration', 'API Automation'],
    'Modern AI Tools': ['ChatGPT Advanced Features', 'Claude Artifacts', 'Midjourney & Image Gen', 'Perplexity Deep Research'],
    'AI Automation': ['Make.com Scenarios', 'Zapier Triggers & Actions', 'n8n Workflow Nodes', 'Autonomous Agents'],
  },
};

const DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Mixed'];
const COUNTS = [5, 10, 15, 20];

const SUBJECT_ICONS: Record<string, React.ElementType> = {
  Biology: BookOpen,
  Chemistry: FlaskConical,
  Physics: Atom,
  'Mental Agility': Brain,
  'Compulsory Science': BookOpen,
  'Compulsory Math': Atom,
  'Optional Math': FlaskConical,
  English: BookOpen,
  'Social Studies': Brain,
};

function parseMCQs(raw: string): MCQ[] {
  try {
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.map((q: any, i: number) => ({
        id: i + 1,
        question: q.question || q.q,
        options: [
          { key: 'A', text: q.options?.A || q.A },
          { key: 'B', text: q.options?.B || q.B },
          { key: 'C', text: q.options?.C || q.C },
          { key: 'D', text: q.options?.D || q.D },
        ],
        correct: String(q.correct ?? q.answer ?? '').trim().toUpperCase().replace(/[^A-D]/g, '').slice(0, 1) || 'A',
        explanation: q.explanation || '',
        difficulty: q.difficulty || 'Medium',
      }));
    }
  } catch {}
  return [];
}

export default function McqGeneratorClient() {
  const { program, programDetails } = useProgram();
  const canonicalId = normalizeCourseId(program);

  const subjects = TRACK_SUBJECTS[canonicalId] || TRACK_SUBJECTS.cee_medical;
  const chaptersMap = TRACK_CHAPTERS[canonicalId] || TRACK_CHAPTERS.cee_medical;

  const [isDark, setIsDark] = useState(false);
  const [subject, setSubject] = useState(subjects[0]);
  const [chapter, setChapter] = useState(chaptersMap[subjects[0]]?.[0] || 'Introduction');
  const [difficulty, setDifficulty] = useState('Mixed');
  const [count, setCount] = useState(10);
  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [selected, setSelected] = useState<Record<number, string>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    setSubject(subjects[0]);
    setChapter(chaptersMap[subjects[0]]?.[0] || 'Introduction');
    setMcqs([]);
    setGenerated(false);
  }, [canonicalId]);

  const { response, isLoading, error, sendMessage } = useChat('OPEN_AI', 'gpt-4o', false);

  useEffect(() => {
    if (error) toast.error(error.message);
  }, [error]);

  useEffect(() => {
    if (response && !isLoading && generated) {
      const parsed = parseMCQs(response);
      if (parsed.length > 0) {
        setMcqs(parsed);
        setSelected({});
        setRevealed({});
      } else {
        toast.error('Could not parse MCQs. Please try again.');
      }
    }
  }, [response, isLoading]);

  const handleSubjectChange = (s: string) => {
    setSubject(s);
    setChapter(chaptersMap[s]?.[0] || 'Introduction');
    setMcqs([]);
    setGenerated(false);
  };

  const handleGenerate = () => {
    setGenerated(true);
    setMcqs([]);
    setSelected({});
    setRevealed({});

    const prompt = `Generate exactly ${count} MCQ questions for Nepal CEE medical entrance exam.
Subject: ${subject}
Chapter/Topic: ${chapter}
Difficulty: ${difficulty === 'Mixed' ? 'a mix of Easy, Medium, and Hard' : difficulty}

Return ONLY a valid JSON array. No extra text. Format:
[
  {
    "question": "Question text here?",
    "options": { "A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D" },
    "correct": "A",
    "explanation": "Brief explanation of why A is correct",
    "difficulty": "Easy"
  }
]

Rules:
- Questions must be accurate and relevant to CEE syllabus
- Each question must have exactly 4 options (A, B, C, D)
- Only one correct answer per question
- Explanations must be concise (1-2 sentences)
- Vary question types: conceptual, application, numerical`;

    sendMessage([{ role: 'user', content: prompt }], { max_completion_tokens: 3000 });
  };

  const handleSelect = (qId: number, opt: string) => {
    if (revealed[qId]) return;
    setSelected((prev) => ({ ...prev, [qId]: opt }));
  };

  const handleReveal = (qId: number) => {
    if (!selected[qId]) return;
    setRevealed((prev) => ({ ...prev, [qId]: true }));
  };

  const handleRevealAll = () => {
    const allRevealed: Record<number, boolean> = {};
    mcqs.forEach((q) => { allRevealed[q.id] = true; });
    setRevealed(allRevealed);
  };

  const score = mcqs.filter((q) => revealed[q.id] && selected[q.id] === q.correct).length;
  const attempted = Object.keys(revealed).length;

  const SubjectIcon = SUBJECT_ICONS[subject];

  return (
    <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center">
            <Zap size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground leading-none">MCQ Generator</h1>
            <p className="text-xs text-muted-foreground mt-0.5">AI-powered questions by subject & chapter</p>
          </div>
        </div>

        {/* Config card */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-5">
          {/* Subject */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Subject</p>
            <div className="flex flex-wrap gap-2">
              {subjects.map((s) => {
                const Icon = SUBJECT_ICONS[s] || BookOpen;
                const active = subject === s;
                return (
                  <button
                    key={s}
                    onClick={() => handleSubjectChange(s)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border transition-all ${
                      active ? 'bg-primary/10 text-primary border-primary/30' : 'bg-muted text-muted-foreground border-transparent hover:border-border'
                    }`}
                  >
                    <Icon size={14} />
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chapter */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Chapter / Topic</p>
            <div className="flex flex-wrap gap-2">
              {chaptersMap[subject]?.map((ch) => (
                <button
                  key={ch}
                  onClick={() => setChapter(ch)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${
                    chapter === ch ? 'bg-secondary text-primary border-primary/20' : 'bg-muted text-muted-foreground border-transparent hover:border-border'
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty + Count */}
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Difficulty</p>
              <div className="flex gap-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${
                      difficulty === d ? 'bg-secondary text-primary border-primary/20' : 'bg-muted text-muted-foreground border-transparent hover:border-border'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Number of Questions</p>
              <div className="flex gap-2">
                {COUNTS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCount(c)}
                    className={`w-10 h-9 rounded-xl text-sm font-bold border transition-all ${
                      count === c ? 'bg-secondary text-primary border-primary/20' : 'bg-muted text-muted-foreground border-transparent hover:border-border'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Generating {count} MCQs…
              </>
            ) : (
              <>
                <Zap size={16} />
                Generate {count} MCQs — {subject} · {chapter}
              </>
            )}
          </button>
        </div>

        {/* MCQs */}
        {mcqs.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListChecks size={16} className="text-primary" />
                <span className="font-bold text-sm text-foreground">{mcqs.length} Questions · {subject} · {chapter}</span>
              </div>
              <div className="flex items-center gap-2">
                {attempted > 0 && (
                  <span className="text-xs font-semibold text-success bg-success-light px-2.5 py-1 rounded-full">
                    {score}/{attempted} correct
                  </span>
                )}
                <button onClick={handleRevealAll} className="text-xs font-semibold text-primary hover:underline">
                  Reveal All
                </button>
                <button onClick={handleGenerate} className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground">
                  <RefreshCw size={12} />
                  Regenerate
                </button>
              </div>
            </div>

            {mcqs.map((q, qi) => {
              const isRevealed = revealed[q.id];
              const userAns = selected[q.id];
              return (
                <div key={q.id} className="bg-card border border-border rounded-2xl p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-xl bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">{qi + 1}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground leading-relaxed">{q.question}</p>
                      <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                        q.difficulty === 'Easy' ? 'bg-success-light text-success' :
                        q.difficulty === 'Hard'? 'bg-error-light text-error' : 'bg-ma-light text-ma'
                      }`}>{q.difficulty}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-10">
                    {q.options.map((opt) => {
                      let cls = 'border-border bg-muted text-foreground hover:border-primary/30 hover:bg-secondary';
                      if (isRevealed) {
                        if (opt.key === q.correct) cls = 'border-success/40 bg-success-light text-success';
                        else if (opt.key === userAns && opt.key !== q.correct) cls = 'border-error/40 bg-error-light text-error';
                        else cls = 'border-border bg-muted text-muted-foreground opacity-60';
                      } else if (userAns === opt.key) {
                        cls = 'border-primary/40 bg-secondary text-primary';
                      }
                      return (
                        <button
                          key={opt.key}
                          onClick={() => handleSelect(q.id, opt.key)}
                          disabled={isRevealed}
                          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm text-left transition-all ${cls}`}
                        >
                          <span className="w-5 h-5 rounded-lg border border-current/30 flex items-center justify-center text-xs font-bold shrink-0">{opt.key}</span>
                          <span className="flex-1 leading-snug">{opt.text}</span>
                          {isRevealed && opt.key === q.correct && <CheckCircle size={14} className="text-success shrink-0" />}
                          {isRevealed && opt.key === userAns && opt.key !== q.correct && <XCircle size={14} className="text-error shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {!isRevealed && userAns && (
                    <div className="ml-10">
                      <button
                        onClick={() => handleReveal(q.id)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                      >
                        <ChevronRight size={13} />
                        Check Answer
                      </button>
                    </div>
                  )}

                  {isRevealed && q.explanation && (
                    <div className="ml-10 bg-secondary/50 border border-primary/10 rounded-xl px-3 py-2.5">
                      <p className="text-xs font-semibold text-primary mb-0.5">Explanation</p>
                      <p className="text-xs text-foreground leading-relaxed">{q.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
