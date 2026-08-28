'use client';

import React, { useState, useRef, useEffect, useTransition } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useProgram, ProgramType } from '@/contexts/ProgramContext';

import ProgramSwitcher from '@/components/ProgramSwitcher';
import { Bot, Send, User, Sparkles, RefreshCw, Copy, Check, Lightbulb, Zap, Trash2, ArrowUpRight, GraduationCap, Stethoscope } from 'lucide-react';
import { MathText } from '@/components/MathText';
import toast from 'react-hot-toast';

interface AgentInfo {
  id: string;
  name: string;
  emoji: string;
  latencyMs?: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  agents?: AgentInfo[];
  isMultiAgent?: boolean;
  intent?: string;
}

const CEE_PROMPTS: Record<string, { title: string; prompt: string }[]> = {
  General: [
    { title: '📋 CEE Exam Pattern', prompt: 'Explain the CEE 2026 exam pattern, subject weightage, and marking scheme in detail.' },
    { title: '⚡ 7-Day Battle Plan', prompt: 'Give me a 7-day high-yield revision strategy for CEE prep.' },
    { title: '🎯 Most Repeated Topics', prompt: 'What are the top 10 most repeated high-yield topics for CEE Medical Entrance?' },
  ],
  Biology: [
    { title: '🧬 DNA Replication', prompt: 'Explain the step-by-step mechanism of DNA replication with key enzymes.' },
    { title: '🌿 C₃ vs C₄ Photosynthesis', prompt: 'Compare C₃ and C₄ photosynthetic pathways with Krantz anatomy differences.' },
    { title: '🔬 Mitosis vs Meiosis', prompt: 'Detail the major differences between Mitosis and Meiosis I/II.' },
  ],
  Chemistry: [
    { title: '⚗️ Hybridization Rules', prompt: 'Explain hybridization determination rules for inorganic molecules with examples.' },
    { title: '🧪 Organic Mechanisms', prompt: 'Compare SN1 and SN2 substitution reactions with carbocation stability principles.' },
    { title: '🔥 Periodic Trends', prompt: 'Summarize periodic trends in Ionization Energy, Electron Affinity, and Atomic Radii.' },
  ],
  Physics: [
    { title: '🚀 Projectile Motion', prompt: 'Derive maximum height, time of flight, and range formulas for projectile motion.' },
    { title: '⚡ Photoelectric Effect', prompt: "Explain Einstein's photoelectric equation, threshold frequency, and work function." },
    { title: '🔌 Kirchhoff\'s Laws', prompt: 'Explain Kirchhoff\'s Current Law (KCL) and Voltage Law (KVL) with numerical tips.' },
  ],
  'Mental Agility': [
    { title: '🔢 Number Series Tricks', prompt: 'Provide 5 high-yield CEE number series questions with step-by-step logic.' },
    { title: '🩸 Blood Relation Shortcuts', prompt: 'Explain blood relation problem solving shortcuts with tree diagram methods.' },
    { title: '🧩 Logical Reasoning', prompt: 'What are the most common MAT patterns asked in CEE?' },
  ],
};

const SEE_PROMPTS: Record<string, { title: string; prompt: string }[]> = {
  General: [
    { title: '📜 SEE Board Exam Pattern', prompt: 'Explain the Class 10 NEB SEE board exam paper structure, model questions, and grading scheme.' },
    { title: '💡 SEE Grade A+ Strategy', prompt: 'How can I score A+ in Class 10 NEB Board exams across Science, Math, English & Social Studies?' },
    { title: '🎯 Important Board Questions', prompt: 'What are the most expected 4-mark and 5-mark long questions for Class 10 SEE?' },
  ],
  'Compulsory Science': [
    { title: '⚡ Force & Gravitation', prompt: 'Explain Newton\'s Universal Law of Gravitation, gravity vs acceleration due to gravity (g).' },
    { title: '🧪 Chemical Reactions', prompt: 'Detail types of chemical reactions (combination, decomposition, displacement, neutralization).' },
    { title: '🧬 Heredity & Mendel Laws', prompt: 'Explain Mendel\'s Laws of Inheritance with monohybrid and dihybrid cross diagrams.' },
  ],
  'Compulsory Mathematics': [
    { title: '📐 Sets & Venn Diagrams', prompt: 'Provide 3 model 4-mark word problems on Sets with Venn diagram solutions.' },
    { title: '📊 Statistics & Ogive', prompt: 'Explain how to compute Median and Quartiles from continuous frequency distribution tables.' },
    { title: '🔺 Geometry Proofs', prompt: 'State and prove the theorem: Area of a triangle is half the area of a parallelogram on the same base.' },
  ],
  'Optional Mathematics': [
    { title: '✨ Composite Functions', prompt: 'Explain Composite Functions and Inverse Functions with step-by-step solved examples.' },
    { title: '📈 Trigonometric Identities', prompt: 'Solve compound angle and multiple angle trigonometric identity proofs.' },
    { title: '📐 Matrix Transformations', prompt: 'Explain 2D geometric transformations using 2x2 matrices.' },
  ],
  English: [
    { title: '✍️ Letter & Essay Writing', prompt: 'Give a top-scoring format and sample for Formal Letter to Editor for SEE English.' },
    { title: '📖 Direct vs Indirect Speech', prompt: 'Explain rules for converting Direct Speech to Indirect Speech for Class 10 NEB grammar.' },
  ],
  'Social Studies': [
    { title: '🇳🇵 Constitution of Nepal', prompt: 'Summarize key features and fundamental rights under the Constitution of Nepal (2072).' },
    { title: '🌍 Geography & Climate', prompt: 'Explain physical divisions of Nepal and factors affecting Nepal\'s climate.' },
  ],
};

const ENGLISH_PROMPTS: Record<string, { title: string; prompt: string }[]> = {
  General: [
    { title: '🗣️ Daily Speaking Drill', prompt: 'Give me a 5-minute daily spoken English practice exercise with vocabulary and response framework.' },
    { title: '🎓 IELTS Band 8.0 Strategy', prompt: 'What are the top 5 examiner tips for scoring Band 8.0+ in IELTS Academic Writing Task 2?' },
    { title: '🎧 PTE Speaking Hacks', prompt: 'Explain the secret templates and scoring breakdown for PTE Describe Image & Retell Lecture.' },
  ],
  'Spoken English': [
    { title: '💼 Job Interview Prep', prompt: 'Simulate a job interview for "Tell me about yourself" and "What are your strengths?" with native phrasing.' },
    { title: '🗣️ Accent & Intonation', prompt: 'Explain how to master connected speech, sentence stress, and natural intonation in English.' },
  ],
  'IELTS Prep': [
    { title: '📝 Task 2 Essay Structure', prompt: 'Provide a Band 9 template for an Agree/Disagree opinion essay in IELTS Academic.' },
    { title: '🗣️ Part 2 Cue Card Strategy', prompt: 'How do I speak fluently for 2 full minutes on IELTS Cue Card topics without pausing?' },
  ],
  'PTE Prep': [
    { title: '🎙️ Describe Image Template', prompt: 'Give me a universal 25-second speaking template for any PTE Describe Image chart.' },
    { title: '✍️ Write From Dictation', prompt: 'What are the best tips to remember exact words in PTE Write From Dictation?' },
  ],
  Grammar: [
    { title: '⚡ Tenses Masterclass', prompt: 'Explain the difference between Present Perfect and Simple Past with 5 common mistake examples.' },
    { title: '✍️ Articles (A, An, The)', prompt: 'Summarize all zero-article rules and common preposition traps in English.' },
  ],
};

const DIGITAL_PROMPTS: Record<string, { title: string; prompt: string }[]> = {
  General: [
    { title: '🤖 Top 10 ChatGPT Prompts', prompt: 'Give me 10 high-yield ChatGPT prompts for study productivity, resume writing, and learning faster.' },
    { title: '🐍 Python Starter Blueprint', prompt: 'How can a complete beginner master Python coding in 30 days? Give a step-by-step roadmap.' },
    { title: '💼 Freelancing on Upwork', prompt: 'How can I win my first client on Upwork/Fiverr with zero past reviews?' },
  ],
  'AI & Prompts': [
    { title: '🧠 Prompt Engineering Guide', prompt: 'Explain Few-Shot vs Chain-of-Thought prompting with real examples for ChatGPT and Claude.' },
    { title: '🎨 Midjourney Image Prompts', prompt: 'How do I write detailed Midjourney prompts for ultra-realistic digital artwork?' },
  ],
  'Python Coding': [
    { title: '⚡ Loops & Conditionals', prompt: 'Explain Python for loops, while loops, and if-else statements with 3 beginner code snippets.' },
    { title: '🌐 Web Scraping Basics', prompt: 'Show a simple Python script using BeautifulSoup to scrape article titles from a website.' },
  ],
  'Digital Marketing': [
    { title: '📈 Facebook Ads Guide', prompt: 'How do I set up a high-converting Facebook ad campaign for a local business with Rs 500 budget?' },
    { title: '✍️ Copywriting Secrets', prompt: 'Explain the AIDA (Attention, Interest, Desire, Action) framework for high-converting social ads.' },
  ],
  'Canva Design': [
    { title: '🎨 Social Media Design', prompt: 'What are the core design rules for contrast, font pairing, and color harmony in Canva?' },
  ],
};

function buildSystemPrompt(subject: string, program: ProgramType): string {
  if (program === 'english') {
    return `You are SamyakGURU AI, an expert ESL & Test Prep tutor for English Fluency, IELTS (Target Band 8+), PTE, and Grammar. You specialize in ${subject}. Focus on practical communication, grammar rules, vocabulary expansion, and test strategies.`;
  }
  if (program === 'digital') {
    return `You are SamyakGURU AI, a practical Tech & AI mentor specializing in ChatGPT Prompt Engineering, Python Programming, Digital Marketing, and Canva Design. You specialize in ${subject}. Explain step-by-step with real-world code snippets, prompt templates, and beginner-friendly instructions.`;
  }
  if (program === 'see') {
    return `You are SamyakGURU AI, Nepal's premier AI Tutor for Class 10 NEB Secondary Education Examination (SEE). You specialize in ${subject === 'General' ? 'all SEE subjects (Science, Math, Opt Math, English, Social Studies)' : subject}.

Your Core Objectives:
- Provide clear, step-by-step explanations aligned with Nepal NEB Class 10 syllabus and model question guidelines.
- Show full solutions for 2-mark, 4-mark, and 5-mark board questions with proper steps.
- Highlight key definitions, formulas, and common exam pitfalls for SEE board students.
- Format responses cleanly using Markdown: **bold** key terms, bullet points, and LaTeX notation ($...$ or $$...$$) for math formulas.`;
  }

  return `You are SamyakGURU AI, Nepal's premier AI Tutor for CEE (Common Entrance Examination) medical entrance preparation. You specialize in ${subject === 'General' ? 'all CEE subjects (Biology, Chemistry, Physics, MAT)' : subject}.

Your Core Objectives:
- Provide clear, high-yield explanations aligned with Nepal's CEE syllabus (IOM, BPKIHS, PAHS pattern).
- Break complex scientific concepts into structured bullet points with visual descriptions or mnemonics.
- Show step-by-step derivations and numerical solutions for Physics & Chemistry using SI units.
- Highlight "+1 Mark Boost Tricks" and "-0.25 Trap Warnings" for CEE aspirants.
- Format responses cleanly using Markdown: **bold** key terms, bullet points, and LaTeX notation ($...$ or $$...$$) for formulas.`;
}

export default function AiTutorClient() {
  const [isDark, setIsDark] = useState(false);
  const [subject, setSubject] = useState('General');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [neuralMode, setNeuralMode] = useState(true);
  const [activeAgents, setActiveAgents] = useState<AgentInfo[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [, startTransition] = useTransition();

  const { program, programDetails } = useProgram();

  const ceeSubjects = ['General', 'Biology', 'Chemistry', 'Physics', 'Mental Agility'];
  const seeSubjects = ['General', 'Compulsory Science', 'Compulsory Mathematics', 'Optional Mathematics', 'English', 'Social Studies'];
  const englishSubjects = ['General', 'Spoken English', 'IELTS Prep', 'PTE Prep', 'Grammar'];
  const digitalSubjects = ['General', 'AI & Prompts', 'Python Coding', 'Digital Marketing', 'Canva Design'];

  const getSubjectsList = () => {
    switch (program) {
      case 'see': return seeSubjects;
      case 'english': return englishSubjects;
      case 'digital': return digitalSubjects;
      default: return ceeSubjects;
    }
  };

  const subjectsList = getSubjectsList();
  const getQuickPromptsMap = () => {
    switch (program) {
      case 'see': return SEE_PROMPTS;
      case 'english': return ENGLISH_PROMPTS;
      case 'digital': return DIGITAL_PROMPTS;
      default: return CEE_PROMPTS;
    }
  };
  const quickPromptsMap = getQuickPromptsMap();

  useEffect(() => {
    if (!subjectsList.includes(subject)) {
      setSubject('General');
    }
  }, [program, subjectsList, subject]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (overrideInput?: string) => {

    const text = (overrideInput ?? input).trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!overrideInput) setInput('');
    setLoading(true);

    startTransition(async () => {
      try {
        const historyForApi = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const isVisualRequest = /\b(draw|diagram|illustrate|picture|image|photo|structure|flowchart)\b/i.test(text);

        let replyContent = '';
        let agentInfos: AgentInfo[] = [];
        let isMultiAgent = false;
        let intent = '';

        if (neuralMode) {
          // ── Neural Schema Mode: route through orchestrator ──
          const courseIdMap: Record<string, string> = {
            cee: 'cee_medical',
            see: 'see_class_10',
            english: 'ielts',
            digital: 'digital_marketing',
          };

          setActiveAgents([{ id: 'orchestrator', name: 'SamyakGURU Brain', emoji: '🧠' }]);

          const res = await fetch('/api/ai/neural/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: text,
              courseId: courseIdMap[program] || 'cee_medical',
              conversationHistory: historyForApi.slice(-6),
            }),
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.details || data.error || 'Neural AI error');

          replyContent = data.response || 'No response received.';
          agentInfos = data.agents || [];
          isMultiAgent = data.isMultiAgent || false;
          intent = data.intent || '';
          setActiveAgents([]);
        } else {
          // ── Legacy Mode: direct chat-completion ──
          const res = await fetch('/api/ai/chat-completion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [
                { role: 'system', content: buildSystemPrompt(subject, program) },
                ...historyForApi,
                { role: 'user', content: text },
              ],
              temperature: 0.7,
              max_tokens: 1000,
            }),
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.details || data.error || 'Failed to get AI response');
          replyContent = data.choices?.[0]?.message?.content ?? data.reply ?? data.text ?? 'No response received.';
        }

        // Strip any raw legacy image links from AI text response
        replyContent = replyContent.replace(/!\[.*?\]\(https?:\/\/(?:image\.pollinations\.ai|[\w.-]+)\/.*?\)/gi, '');

        // If visual diagram requested, fetch & prepend high-definition diagram!
        if (isVisualRequest) {
          try {
            const cleanTopic = text.replace(/generate|draw|show|diagram|illustration|picture|image|of/gi, '').trim() || subject;
            const imgRes = await fetch('/api/ai/generate-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt: cleanTopic }),
            });
            const imgData = await imgRes.json();
            if (imgData.ok && imgData.url) {
              const diagramTitle = imgData.revised_prompt || `High-Yield Diagram: ${cleanTopic}`;
              replyContent = `### 🎨 ${diagramTitle}\n\n![${diagramTitle}](${imgData.url})\n\n${replyContent.trim()}`;
            }
          } catch (imgErr) {
            console.warn('Image generation warning:', imgErr);
          }
        }

        const aiMsg: Message = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: replyContent,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          agents: agentInfos,
          isMultiAgent,
          intent,
        };

        setMessages((prev) => [...prev, aiMsg]);
      } catch (err: any) {
        setActiveAgents([]);
        toast.error(err.message || 'Something went wrong. Please try again.');
        const errorMsg: Message = {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: '⚠️ I encountered an issue fetching the explanation. Please try asking again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setLoading(false);
        setActiveAgents([]);
      }
    });
  };


  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const currentPrompts = quickPromptsMap[subject] ?? quickPromptsMap.General ?? [];

  return (
    <DashboardLayout isDark={isDark} onToggleDark={() => setIsDark(!isDark)}>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Top Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${programDetails.badgeBg} ${programDetails.badgeText}`}>
                {programDetails.badge}
              </span>
              <span className="text-xs text-muted-foreground font-semibold">24/7 AI Academic Tutor</span>
            </div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
              <Bot size={26} className="text-primary" />
              SamyakGURU AI — {programDetails.shortName} Tutor
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Ask doubts, past paper questions, formula derivations, or chapter breakdowns tailored for {programDetails.name}.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            {/* Neural Mode Toggle */}
            <button
              onClick={() => setNeuralMode(!neuralMode)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                neuralMode
                  ? 'bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border-violet-500/30 text-violet-600 dark:text-violet-400'
                  : 'bg-card border-border text-muted-foreground hover:border-primary/40'
              }`}
              title={neuralMode ? 'Neural Schema Active — 8 AI Agents coordinating' : 'Legacy Mode — Direct single-model calls'}
            >
              <span className={`w-2 h-2 rounded-full ${neuralMode ? 'bg-violet-500 animate-pulse' : 'bg-muted-foreground'}`} />
              {neuralMode ? '🧠 Neural' : '⚡ Legacy'}
            </button>
            <ProgramSwitcher size="md" />
          </div>
        </div>

        {/* Subject Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {subjectsList.map((s) => (
            <button
              key={s}
              onClick={() => setSubject(s)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                subject === s
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Chat Workspace */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col h-[580px] shadow-sm">
          
          {/* Chat Messages / Welcome State */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-6 py-8">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                  <Bot size={36} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">How can I help with {subject === 'General' ? programDetails.shortName : subject}?</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Select a prompt below or type your question in the input field.
                  </p>
                </div>

                {/* Quick Prompts Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full text-left">
                  {currentPrompts.map((p) => (
                    <button
                      key={p.title}
                      onClick={() => handleSend(p.prompt)}
                      className="p-3.5 bg-muted/40 hover:bg-primary/5 border border-border hover:border-primary/30 rounded-xl transition-all group flex flex-col justify-between"
                    >
                      <div>
                        <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{p.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{p.prompt}</p>
                      </div>
                      <span className="text-[10px] font-bold text-primary mt-2 flex items-center gap-0.5">
                        Ask AI <ArrowUpRight size={10} />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-xs" title={m.agents?.map(a => `${a.emoji} ${a.name}`).join(', ') || 'SamyakGURU AI'}>
                      {m.agents && m.agents.length > 0 ? (
                        <span className="text-sm">{m.agents[0].emoji}</span>
                      ) : (
                        <Bot size={18} />
                      )}
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 space-y-2 text-xs sm:text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-primary text-white rounded-br-none shadow-sm'
                        : 'bg-muted/60 border border-border text-foreground rounded-bl-none'
                    }`}
                  >
                    <MathText text={m.content} />
                    {/* Agent badges for neural mode */}
                    {m.role === 'assistant' && m.agents && m.agents.length > 0 && (
                      <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                        {m.agents.map((a) => (
                          <span
                            key={a.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[10px] font-semibold border border-violet-500/20"
                            title={`${a.name} • ${a.latencyMs ? `${(a.latencyMs / 1000).toFixed(1)}s` : ''}`}
                          >
                            <span>{a.emoji}</span>
                            <span>{a.name}</span>
                          </span>
                        ))}
                        {m.isMultiAgent && (
                          <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold">✦ Multi-Agent</span>
                        )}
                      </div>
                    )}
                    <div className={`flex items-center justify-between text-[10px] pt-1 ${m.role === 'user' ? 'text-white/70' : 'text-muted-foreground'}`}>
                      <span>{m.timestamp}</span>
                      {m.role === 'assistant' && (
                        <button
                          onClick={() => handleCopy(m.id, m.content)}
                          className="hover:text-primary transition-colors flex items-center gap-1"
                        >
                          {copiedId === m.id ? <Check size={11} className="text-success" /> : <Copy size={11} />}
                          {copiedId === m.id ? 'Copied' : 'Copy'}
                        </button>
                      )}
                    </div>
                  </div>

                  {m.role === 'user' && (
                    <div className="w-8 h-8 rounded-xl bg-foreground text-background flex items-center justify-center shrink-0 font-bold text-xs">
                      <User size={16} />
                    </div>
                  )}
                </div>
              ))
            )}

            {loading && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-xs animate-pulse">
                  {neuralMode && activeAgents.length > 0 ? (
                    <span className="text-sm">{activeAgents[0].emoji}</span>
                  ) : (
                    <Bot size={18} />
                  )}
                </div>
                <div className="bg-muted/60 border border-border rounded-2xl p-3.5 text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center gap-2">
                    <RefreshCw size={14} className="animate-spin text-primary" />
                    {neuralMode ? (
                      <span>
                        <span className="text-violet-600 dark:text-violet-400 font-bold">🧠 Neural Schema</span>
                        {' '}— Orchestrator routing to specialized agents...
                      </span>
                    ) : (
                      <span>Analyzing {subject} curriculum database &amp; generating response...</span>
                    )}
                  </div>
                  {neuralMode && activeAgents.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {activeAgents.map((a) => (
                        <span key={a.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-[10px] font-semibold text-violet-600 dark:text-violet-400 animate-pulse">
                          {a.emoji} {a.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-3 sm:p-4 bg-card border-t border-border flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="p-2.5 text-muted-foreground hover:text-error hover:bg-error-light/50 rounded-xl transition-colors shrink-0"
                title="Clear conversation"
              >
                <Trash2 size={18} />
              </button>
            )}
            <input
              type="text"
              placeholder={`Ask SamyakGURU AI about ${subject === 'General' ? programDetails.shortName : subject}...`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="btn-primary py-2.5 px-5 text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2 shrink-0 disabled:opacity-50"
            >
              <span>Send</span>
              <Send size={15} />
            </button>
          </div>


        </div>

      </div>
    </DashboardLayout>
  );
}
