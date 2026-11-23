'use client';

import React, { useState, useRef, useEffect, useTransition, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useProgram, ProgramType, normalizeCourseId } from '@/contexts/ProgramContext';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

import ProgramSwitcher from '@/components/ProgramSwitcher';
import { Bot, Send, User, Sparkles, RefreshCw, Copy, Check, Lightbulb, Zap, Trash2, ArrowUpRight, GraduationCap, Stethoscope, Scan, BarChart2, Target, AlertTriangle, ShieldCheck, Flame, Brain } from 'lucide-react';
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

import {
  CEE_PROMPTS,
  SEE_PROMPTS,
  ENGLISH_PROMPTS,
  DIGITAL_PROMPTS,
} from '../config/tutorPrompts';

function buildSystemPrompt(subject: string, program: ProgramType): string {
  const canonical = normalizeCourseId(program);
  if (canonical === 'ielts') {
    return `You are SamyakGURU AI, an expert ESL & Test Prep tutor for English Fluency, IELTS (Target Band 8+), PTE, and Grammar. You specialize in ${subject}. Focus on practical communication, grammar rules, vocabulary expansion, and test strategies.`;
  }
  if (canonical === 'digital_marketing' || canonical === 'artificial_intelligence') {
    return `You are SamyakGURU AI, a practical Tech & AI mentor specializing in ChatGPT Prompt Engineering, Python Programming, Digital Marketing, and Modern AI Tools. You specialize in ${subject}. Explain step-by-step with real-world code snippets, prompt templates, and beginner-friendly instructions.`;
  }
  if (canonical === 'see_class_10') {
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

  const searchParams = useSearchParams();
  const { user, profile } = useAuth();
  const [quotaUsed, setQuotaUsed] = useState<number>(0);
  const [quotaLimit, setQuotaLimit] = useState<number>(5);
  const [userTier, setUserTier] = useState<string>('free');
  const [weakTopics, setWeakTopics] = useState<Array<{ name: string; subject: string; mistakes: number }>>([]);
  const handledParamRef = useRef(false);

  const { program, programDetails } = useProgram();
  const canonicalId = normalizeCourseId(program);

  const ceeSubjects = ['General', 'Biology', 'Chemistry', 'Physics', 'Mental Agility'];
  const seeSubjects = ['General', 'Compulsory Science', 'Compulsory Mathematics', 'Optional Mathematics', 'English', 'Social Studies'];
  const englishSubjects = ['General', 'Spoken English', 'IELTS Prep', 'PTE Prep', 'Grammar'];
  const digitalSubjects = ['General', 'AI & Prompts', 'Python Coding', 'Digital Marketing', 'Canva Design'];

  const getSubjectsList = () => {
    switch (canonicalId) {
      case 'see_class_10': return seeSubjects;
      case 'ielts': return englishSubjects;
      case 'digital_marketing':
      case 'artificial_intelligence': return digitalSubjects;
      case 'cee_medical':
      default: return ceeSubjects;
    }
  };

  const subjectsList = getSubjectsList();
  const getQuickPromptsMap = () => {
    switch (canonicalId) {
      case 'see_class_10': return SEE_PROMPTS;
      case 'ielts': return ENGLISH_PROMPTS;
      case 'digital_marketing':
      case 'artificial_intelligence': return DIGITAL_PROMPTS;
      case 'cee_medical':
      default: return CEE_PROMPTS;
    }
  };
  const quickPromptsMap = getQuickPromptsMap();

  useEffect(() => {
    if (!subjectsList.includes(subject)) {
      setSubject('General');
    }
  }, [canonicalId, subjectsList, subject]);

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
            cee_medical: 'cee_medical',
            see: 'see_class_10',
            see_class_10: 'see_class_10',
            english: 'ielts',
            ielts: 'ielts',
            digital: 'digital_marketing',
            digital_marketing: 'digital_marketing',
            ai: 'artificial_intelligence',
            artificial_intelligence: 'artificial_intelligence',
          };

          setActiveAgents([{ id: 'orchestrator', name: 'Samyak AI Brain', emoji: '🧠' }]);

          const res = await fetch('/api/ai/neural/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: text,
              courseId: courseIdMap[program] || canonicalId || 'cee_medical',
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
        setQuotaUsed((prev) => Math.min(quotaLimit, prev + 1));
      } catch (err: any) {
        setActiveAgents([]);
        toast.error(err.message || 'Something went wrong. Please try again.');
        const errorMsg: Message = {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'I encountered an issue fetching the explanation. Please try asking again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setLoading(false);
        setActiveAgents([]);
      }
    });
  };

  useEffect(() => {
    const tier = (profile as any)?.plan_tier || 'free';
    setUserTier(tier);
    const limit = tier === 'cee_ai_pro' || tier === 'legacy_pro' ? 75 : tier === 'cee_premium' ? 15 : 5;
    setQuotaLimit(limit);

    if (!user?.id) return;
    const supabase = createClient();
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kathmandu' });

    supabase
      .from('ai_usage_daily')
      .select('request_count')
      .eq('user_id', user.id)
      .eq('usage_date', todayStr)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setQuotaUsed((data as any).request_count || 0);
      });

    supabase
      .from('topic_mastery')
      .select(`
        topic_name,
        mastery_score,
        chapters ( title ),
        subjects ( display_name )
      `)
      .eq('student_id', user.id)
      .order('mastery_score', { ascending: true })
      .limit(5)
      .then(({ data }) => {
        if (!data || data.length === 0) return;
        const sorted = (data as any[])
          .map((row) => ({
            name: row.chapters?.title || row.topic_name || 'Core Concepts',
            subject: row.subjects?.display_name || 'CEE',
            mistakes: Math.max(1, 100 - (row.mastery_score || 50)),
          }))
          .slice(0, 3);
        setWeakTopics(sorted);
      });
  }, [user?.id, profile]);

  useEffect(() => {
    if (handledParamRef.current) return;
    const doubtParam = searchParams.get('doubt') || searchParams.get('diagnostic') || searchParams.get('q');
    if (doubtParam) {
      handledParamRef.current = true;
      handleSend(doubtParam);
    }
  }, [searchParams]);

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
              <span className="text-xs text-muted-foreground font-semibold">24/7 Intelligent Learning Suite</span>
            </div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
              <Bot size={26} className="text-primary" />
              Samyak AI Tutor — {programDetails.shortName} Assistant
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
              title={neuralMode ? 'Neural Schema Active — Multi-agent reasoning coordinating' : 'Legacy Mode — Direct single-model calls'}
            >
              <span className={`w-2 h-2 rounded-full ${neuralMode ? 'bg-violet-500 animate-pulse' : 'bg-muted-foreground'}`} />
              {neuralMode ? (
                <span className="flex items-center gap-1">
                  <Brain size={13} className="text-violet-500" /> Neural AI
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Zap size={13} className="text-amber-500" /> Direct Mode
                </span>
              )}
            </button>
            <ProgramSwitcher size="md" />
          </div>
        </div>

        {/* ── UNIFIED SAMYAK AI HUB NAVIGATION ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-primary/10 border-2 border-primary text-primary flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-xs">
              <Bot size={20} />
            </div>
            <div>
              <p className="text-xs font-black text-foreground">Ask AI</p>
              <p className="text-[10px] text-muted-foreground">Instant Doubt Solver</p>
            </div>
          </div>

          <Link
            href="/practice?live=true"
            className="p-3.5 rounded-2xl bg-card border border-border hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Zap size={20} />
            </div>
            <div>
              <p className="text-xs font-black text-foreground group-hover:text-primary transition-colors">Practice with AI</p>
              <p className="text-[10px] text-muted-foreground">Live MCQ Generation</p>
            </div>
          </Link>

          <Link
            href="/mistake-analyser"
            className="p-3.5 rounded-2xl bg-card border border-border hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <BarChart2 size={20} />
            </div>
            <div>
              <p className="text-xs font-black text-foreground group-hover:text-primary transition-colors">Analyze Mistakes</p>
              <p className="text-[10px] text-muted-foreground">Weak Area Diagnostics</p>
            </div>
          </Link>

          <Link
            href="/doubts"
            className="p-3.5 rounded-2xl bg-card border border-border hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Scan size={20} />
            </div>
            <div>
              <p className="text-xs font-black text-foreground group-hover:text-primary transition-colors">Scan Question</p>
              <p className="text-[10px] text-muted-foreground">Photo &amp; OCR Solution</p>
            </div>
          </Link>
        </div>
        {/* Daily Quota Widget & Plan Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-card border border-border rounded-2xl shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-foreground">
                  {userTier === 'cee_ai_pro' ? 'CEE AI Pro Plan' : userTier === 'cee_premium' ? 'CEE Premium Plan' : 'Free Plan'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                  {quotaUsed} / {quotaLimit} queries used today
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Resets daily at 00:00 NPT. Socratic medical entrance pedagogy &amp; step-by-step reasoning.
              </p>
            </div>
          </div>

          {userTier !== 'cee_ai_pro' && (
            <Link
              href="/checkout?plan=cee-ai-pro-monthly"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 hover:brightness-105 transition-all shadow-xs shrink-0"
            >
              <Flame size={14} /> Upgrade to CEE AI Pro (75/day) →
            </Link>
          )}
        </div>

        {/* Weak Topics Diagnostic Pill Bar */}
        {weakTopics.length > 0 && (
          <div className="p-4 bg-card border border-border rounded-2xl space-y-2">
            <div className="flex items-center gap-2">
              <Target size={14} className="text-rose-500" />
              <p className="text-xs font-bold text-foreground">Your High-Yield Weak Spots (From Recent Practice):</p>
              <span className="text-[10px] text-muted-foreground">Click any topic to diagnose with AI Copilot</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {weakTopics.map((topic, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(`Diagnose my conceptual understanding of ${topic.name} (${topic.subject}) for CEE Medical Entrance. What are the common exam pitfalls, key formulas, and must-know rules?`)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/20 transition-all cursor-pointer"
                >
                  <AlertTriangle size={12} className="text-rose-500" />
                  <span>{topic.name}</span>
                  <span className="text-[10px] bg-rose-500/20 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded-full font-bold">
                    {topic.mistakes} misses
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

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
                        <span className="text-violet-600 dark:text-violet-400 font-bold inline-flex items-center gap-1">
                          <Brain size={13} /> Neural Schema
                        </span>
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
