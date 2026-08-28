'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PublicNav from '@/components/PublicNav';
import {
  Laptop, Code, Terminal, Sparkles, CheckCircle2, MessageSquare,
  ArrowRight, RefreshCw, Volume2, Mic, FileCode, Play, Award, Zap
} from 'lucide-react';
import toast from 'react-hot-toast';

const IT_VOCABULARY = [
  { term: 'Asynchronous Processing', def: 'Executing tasks in the background without blocking the main execution thread.', example: 'We implemented asynchronous job queues to handle email notifications smoothly.' },
  { term: 'System Scalability', def: 'The capacity of a computer system to handle growing amounts of work by adding resources.', example: 'Horizontal scaling allows our microservices to serve millions of concurrent requests.' },
  { term: 'Technical Debt', def: 'The implied cost of additional rework caused by choosing an easy solution now instead of a better approach.', example: 'Refactoring legacy modules is crucial to prevent technical debt from slowing down new features.' },
  { term: 'Continuous Integration (CI)', def: 'The practice of automating the integration of code changes from multiple contributors.', example: 'Our CI pipeline automatically runs unit tests on every pull request.' },
  { term: 'Deprecation', def: 'The phase in software lifecycle where a feature is discouraged from use in favor of a newer alternative.', example: 'Version 2 REST endpoints will be deprecated next quarter.' },
  { term: 'Latency Optimization', def: 'Reducing the time delay between a user request and the software system response.', example: 'Using edge caching significantly improved database query latency.' },
];

const TECH_INTERVIEW_PROMPTS = [
  {
    title: '💻 Behavioral: Debugging Under Pressure',
    question: 'Tell me about a critical production bug or system failure you encountered, and how you diagnosed and resolved it under tight deadlines.',
    tips: 'Use the STAR method (Situation, Task, Action, Result). Highlight your analytical debugging process and communication with stakeholders.',
  },
  {
    title: '🏗️ Technical Communication: System Architecture',
    question: 'How would you explain the difference between a Monolithic architecture and Microservices architecture to a non-technical client or product manager?',
    tips: 'Use accessible analogies (e.g., a single large house vs a complex of specialized shops). Focus on trade-offs like maintenance vs deployment complexity.',
  },
  {
    title: '🚀 Agile & Remote Collaboration',
    question: 'How do you handle disagreement with a senior software architect or peer during a code review or technical design decision?',
    tips: 'Emphasize constructive communication, benchmark testing, data-driven decisions, and maintaining team alignment.',
  },
];

export default function ItEnglishMasterclassPage() {
  const [isDark, setIsDark] = useState(false);
  const [activePromptIdx, setActivePromptIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isDark) {
      document.documentElement?.classList?.add('dark');
    } else {
      document.documentElement?.classList?.remove('dark');
    }
  }, [isDark]);

  const handleEvaluateInterview = async () => {
    if (!userAnswer.trim() || userAnswer.trim().split(/\s+/).filter(Boolean).length < 15) {
      toast.error('Please type or record a complete response for IT interview feedback.');
      return;
    }

    setEvaluating(true);
    try {
      const res = await fetch('/api/ai/chat-completion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are Coach Aria, Senior Technical Recruiter & IT Communication Coach for global tech companies in Silicon Valley, London, and remote US firms. Evaluate the candidate\'s tech interview answer for vocabulary precision, STAR structure, and executive clarity.',
            },
            {
              role: 'user',
              content: `Interview Question: "${TECH_INTERVIEW_PROMPTS[activePromptIdx].question}"\n\nCandidate's Response:\n"${userAnswer}"`,
            },
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.details || data.error || 'Evaluation failed');

      const reply = data.choices?.[0]?.message?.content || 'Evaluation complete.';
      setFeedback(reply);
      toast.success('🎉 Tech Interview Response Evaluated!');

      setTimeout(() => {
        document.getElementById('it-feedback-card')?.scrollIntoView({ behavior: 'smooth' });
      }, 200);
    } catch (err: any) {
      toast.error(err.message || 'Evaluation failed.');
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <PublicNav isDark={isDark} onToggleDark={() => setIsDark(!isDark)} />

      {/* Hero Section */}
      <section className="pt-28 pb-10 bg-gradient-to-b from-blue-500/10 via-card to-background border-b border-border">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 text-blue-600 text-xs font-bold border border-blue-500/20 mb-3">
                <Laptop size={14} /> IT &amp; Software Engineering Professional English
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight flex items-center gap-3">
                IT Sector English &amp; Tech Interview Masterclass
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 font-extrabold">GLOBAL IT JOBS</span>
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2 max-w-2xl">
                Specialized English fluency for software engineers, computer science students, and IT professionals targeting remote global companies, US/UK MS in Computer Science, and tech job interviews.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/english/duolingo"
                className="px-4 py-2.5 rounded-2xl bg-cyan-600 text-white font-extrabold text-xs flex items-center gap-2 shadow-md shadow-cyan-600/20 hover:bg-cyan-700 transition-all"
              >
                <span>DET IT Test Simulator</span>
                <ArrowRight size={14} />
              </Link>
              <Link
                href="/english/speaking"
                className="px-4 py-2.5 rounded-2xl bg-card border border-border font-bold text-xs text-foreground hover:bg-muted transition-all"
              >
                <span>IELTS Live Examiner</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Workspace */}
      <section className="py-8 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 space-y-10">

        {/* Tech Job Interview Simulator */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 bg-card border border-border rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Terminal size={18} className="text-blue-600" />
                <h3 className="text-sm font-bold text-foreground">Global IT Technical Interview Simulator</h3>
              </div>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600">
                PRO LEVEL
              </span>
            </div>

            {/* Question Selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase">Select Technical Question ({activePromptIdx + 1}/{TECH_INTERVIEW_PROMPTS.length}):</span>
                <div className="flex gap-1">
                  {TECH_INTERVIEW_PROMPTS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setActivePromptIdx(i);
                        setFeedback(null);
                      }}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                        activePromptIdx === i ? 'bg-blue-600 text-white shadow-xs' : 'bg-muted text-muted-foreground hover:bg-card'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-2">
                <h4 className="text-sm font-bold text-foreground">{TECH_INTERVIEW_PROMPTS[activePromptIdx].title}</h4>
                <p className="text-xs font-serif text-foreground leading-relaxed">
                  &ldquo;{TECH_INTERVIEW_PROMPTS[activePromptIdx].question}&rdquo;
                </p>
                <p className="text-[11px] text-blue-950 dark:text-blue-200 pt-1">💡 <strong>Coach Tip:</strong> {TECH_INTERVIEW_PROMPTS[activePromptIdx].tips}</p>
              </div>
            </div>

            {/* Answer Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-foreground">
                <span>Your Technical Interview Answer:</span>
                <span className="text-muted-foreground font-semibold">
                  {userAnswer.trim().split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
              <textarea
                rows={7}
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Type your structured answer here (using STAR method)..."
                className="w-full p-4 bg-muted/50 border border-border rounded-2xl text-xs sm:text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed font-sans"
              />
            </div>

            <button
              onClick={handleEvaluateInterview}
              disabled={evaluating || !userAnswer.trim()}
              className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-all disabled:opacity-50"
            >
              {evaluating ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  <span>Evaluating Technical Clarity &amp; STAR Structure...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Evaluate Response &amp; Get Tech Recruiter Feedback</span>
                </>
              )}
            </button>
          </div>

          {/* Right Column: IT English Vocabulary Vault */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <FileCode size={18} className="text-blue-600" />
                  <h3 className="text-sm font-bold text-foreground">IT &amp; Tech Terms Vault</h3>
                </div>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600">C1 HIGH-YIELD</span>
              </div>

              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {IT_VOCABULARY.map((v, i) => (
                  <div key={i} className="p-3.5 rounded-2xl bg-muted/40 border border-border/80 space-y-1">
                    <span className="text-xs font-bold text-blue-600">{v.term}</span>
                    <p className="text-[11px] text-muted-foreground leading-snug">{v.def}</p>
                    <p className="text-[10px] text-foreground font-serif italic pt-1">e.g. &ldquo;{v.example}&rdquo;</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Display */}
        {feedback && (
          <div id="it-feedback-card" className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-lg space-y-4 animate-fadeIn">
            <div className="flex items-center gap-3 pb-4 border-b border-border">
              <Award size={22} className="text-blue-600" />
              <div>
                <h3 className="text-lg font-black text-foreground">Coach Aria — Tech Recruiter Assessment</h3>
                <p className="text-xs text-muted-foreground">Detailed feedback on tech vocabulary, structure, and executive delivery.</p>
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-muted/40 border border-border text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-line font-sans">
              {feedback}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
