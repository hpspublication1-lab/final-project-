'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PublicNav from '@/components/PublicNav';
import { useProgram } from '@/contexts/ProgramContext';
import { Cpu, Bot, Code, Palette, TrendingUp, Sparkles, CheckCircle, ArrowRight, Play, Award, Terminal, Laptop } from 'lucide-react';

export default function DigitalAiPage() {
  const { setProgram } = useProgram();
  const [isDark, setIsDark] = useState(false);
  const [activeTool, setActiveTool] = useState<'prompt' | 'python' | 'design'>('prompt');
  const [promptInput, setPromptInput] = React.useState('Write a high-converting marketing tagline for an artisan coffee shop in Kathmandu');
  const [aiOutput, setAiOutput] = React.useState<string | null>(null);
  const [promptGrade, setPromptGrade] = useState<{ total: number; critique: string; scores?: any } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleRunAiDemo = async () => {
    if (!promptInput.trim() || isGenerating) return;
    setIsGenerating(true);
    setAiOutput(null);
    setPromptGrade(null);

    try {
      const res = await fetch('/api/digital/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptInput.trim(), gradePrompt: true }),
      });
      const data = await res.json();
      if (res.ok && data.output) {
        setAiOutput(data.output);
        if (data.grade) {
          setPromptGrade(data.grade);
        }
      } else {
        setAiOutput("☕ Fuel Your Day: Artisanal Brews & Daily Fresh Pastries at Coffee House! (Sign in to unlock live AI prompt grading & attempt tracking)");
      }
    } catch {
      setAiOutput("☕ Fuel Your Day: Artisanal Brews & Daily Fresh Pastries at Coffee House!");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <PublicNav isDark={isDark} onToggleDark={() => setIsDark(!isDark)} />

      {/* Hero Section */}
      <section className="relative pt-28 pb-16 bg-gradient-to-b from-purple-500/10 via-card to-background border-b border-border overflow-hidden">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            {/* Left Col */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 text-purple-600 text-xs font-bold border border-purple-500/20">
                <Cpu size={14} /> Digital Skills &amp; AI Academy for Beginners
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight leading-tight">
                Learn AI, Python Coding <br className="hidden sm:inline" />
                <span className="text-purple-600">&amp; Modern Digital Skills</span>
              </h1>
              <p className="text-base text-muted-foreground leading-relaxed max-w-xl">
                Master ChatGPT prompt engineering, Python programming from scratch, Canva graphic design, and digital marketing to boost your career and freelance earnings.
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  href="/courses?sector=digital"
                  onClick={() => setProgram('digital')}
                  className="px-6 py-3.5 rounded-2xl bg-purple-600 text-white font-extrabold text-sm flex items-center gap-2 shadow-lg shadow-purple-600/20 hover:bg-purple-700 transition-all"
                >
                  <span>Browse Digital &amp; AI Courses</span>
                  <ArrowRight size={16} />
                </Link>
                <a
                  href="#ai-prompt-playground"
                  className="px-6 py-3.5 rounded-2xl bg-card border border-border font-bold text-sm flex items-center gap-2 hover:bg-muted transition-colors"
                >
                  <Bot size={16} className="text-purple-600" />
                  <span>Try AI Playground</span>
                </a>
              </div>
            </div>

            {/* Right Interactive AI Playground */}
            <div className="lg:col-span-5">
              <div id="ai-prompt-playground" className="bg-card border border-border rounded-3xl p-6 shadow-xl relative overflow-hidden space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
                      <Bot size={16} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">AI Prompt Studio</h3>
                      <p className="text-[10px] text-muted-foreground">Interactive AI tool sandbox</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600">INTERACTIVE</span>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-muted-foreground">Enter Prompt Instruction:</label>
                  <input
                    type="text"
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-muted/50 border border-border text-xs font-medium text-foreground outline-none"
                  />
                </div>

                <button
                  onClick={handleRunAiDemo}
                  className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-purple-600/20"
                >
                  <Sparkles size={15} />
                  <span>Generate AI Content</span>
                </button>

                {aiOutput && (
                  <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs font-medium text-purple-950 dark:text-purple-200 animate-fadeIn space-y-1">
                    <p className="text-[10px] uppercase font-bold text-purple-600">AI Generated Result:</p>
                    <p className="italic">{aiOutput}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Course Categories Grid */}
      <section className="py-14 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-black text-foreground">Four High-Demand Digital Tracks</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-2">
            No prior tech background required. Hands-on project portfolio building.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Track 1 */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm hover:border-purple-500/40 transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold text-xl">
              🤖
            </div>
            <h3 className="text-base font-bold text-foreground">AI &amp; Prompt Engineering</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Master ChatGPT, Midjourney, Claude, and AI automation to save 10+ hours every week.
            </p>
            <ul className="space-y-1.5 text-xs font-medium text-foreground pt-1">
              <li className="flex items-center gap-1.5"><CheckCircle size={13} className="text-purple-600" /> Prompt Frameworks</li>
              <li className="flex items-center gap-1.5"><CheckCircle size={13} className="text-purple-600" /> AI Image Generation</li>
              <li className="flex items-center gap-1.5"><CheckCircle size={13} className="text-purple-600" /> Workflow Automation</li>
            </ul>
          </div>

          {/* Track 2 */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm hover:border-purple-500/40 transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold text-xl">
              🐍
            </div>
            <h3 className="text-base font-bold text-foreground">Python Coding for Beginners</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Start your coding journey with beginner-friendly Python syntax, logic, and mini-projects.
            </p>
            <ul className="space-y-1.5 text-xs font-medium text-foreground pt-1">
              <li className="flex items-center gap-1.5"><CheckCircle size={13} className="text-purple-600" /> Variables &amp; Loops</li>
              <li className="flex items-center gap-1.5"><CheckCircle size={13} className="text-purple-600" /> Web Scraping Bot</li>
              <li className="flex items-center gap-1.5"><CheckCircle size={13} className="text-purple-600" /> GitHub &amp; Portfolio</li>
            </ul>
          </div>

          {/* Track 3 */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm hover:border-purple-500/40 transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold text-xl">
              📈
            </div>
            <h3 className="text-base font-bold text-foreground">Digital Marketing &amp; Ads</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Learn Facebook Ads, TikTok Marketing, SEO, and social media content creation strategies.
            </p>
            <ul className="space-y-1.5 text-xs font-medium text-foreground pt-1">
              <li className="flex items-center gap-1.5"><CheckCircle size={13} className="text-purple-600" /> Meta Ads Manager</li>
              <li className="flex items-center gap-1.5"><CheckCircle size={13} className="text-purple-600" /> Content Funnels</li>
              <li className="flex items-center gap-1.5"><CheckCircle size={13} className="text-purple-600" /> Brand Growth Tricks</li>
            </ul>
          </div>

          {/* Track 4 */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm hover:border-purple-500/40 transition-all space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold text-xl">
              🎨
            </div>
            <h3 className="text-base font-bold text-foreground">Canva Design &amp; Freelancing</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Create professional graphics, logos, presentation decks, and start earning on Upwork/Fiverr.
            </p>
            <ul className="space-y-1.5 text-xs font-medium text-foreground pt-1">
              <li className="flex items-center gap-1.5"><CheckCircle size={13} className="text-purple-600" /> Brand Identity Design</li>
              <li className="flex items-center gap-1.5"><CheckCircle size={13} className="text-purple-600" /> Upwork Gig Optimization</li>
              <li className="flex items-center gap-1.5"><CheckCircle size={13} className="text-purple-600" /> Client Pitching Templates</li>
            </ul>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="mt-14 rounded-3xl bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="space-y-2 max-w-xl">
            <h3 className="text-2xl sm:text-3xl font-black">Future-Proof Your Career Today</h3>
            <p className="text-xs sm:text-sm text-purple-100">Get certified in AI tools, Python, and digital skills. Enrolling now for new batch starts.</p>
          </div>
          <Link
            href="/courses?sector=digital"
            onClick={() => setProgram('digital')}
            className="px-8 py-4 rounded-2xl bg-white text-purple-900 font-black text-sm hover:bg-purple-50 transition-colors shadow-lg shrink-0"
          >
            Join Digital &amp; AI Academy
          </Link>
        </div>
      </section>
    </div>
  );
}
