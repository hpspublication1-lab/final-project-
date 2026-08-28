'use client';

import React, { useState } from 'react';
import PublicNav from '@/components/PublicNav';
import {
  PenTool, Sparkles, CheckCircle2, Award, BookOpen, ChevronRight,
  ShieldCheck, HelpCircle
} from 'lucide-react';

const IELTS_WRITING_RUBRICS = [
  {
    criterion: 'Task Achievement (Task 1) / Task Response (Task 2)',
    shortCode: 'TA / TR',
    weight: '25%',
    band9: 'Fully satisfies all requirements of the prompt with clear, well-developed position, relevant and fully extended supporting ideas.',
    band7: 'Addresses all parts of the prompt, presents a clear position throughout, supports main ideas with relevant details but may over-generalize.',
    band6: 'Addresses the prompt though some parts may be more fully covered than others. Presents a position but development is limited.',
  },
  {
    criterion: 'Coherence & Cohesive Devices',
    shortCode: 'CC',
    weight: '25%',
    band9: 'Uses cohesion in such a way that it attracts no attention. Skillfully manages paragraphing with clear central topic in each paragraph.',
    band7: 'Logically organizes information with clear progression throughout. Uses a range of cohesive devices appropriately with some under/overuse.',
    band6: 'Arranges information coherently with overall progression. Uses cohesive devices effectively, but cohesion within/between sentences may be faulty.',
  },
  {
    criterion: 'Lexical Resource (Vocabulary)',
    shortCode: 'LR',
    weight: '25%',
    band9: 'Uses a wide range of vocabulary with very natural and sophisticated control of lexical features. Rare minor errors occur as slips.',
    band7: 'Uses a sufficient range of vocabulary with flexibility and precision. Uses less common lexical items with awareness of style and collocation.',
    band6: 'Uses an adequate range of vocabulary for the task. Attempts to use less common vocabulary but with some inaccuracy in word choice/spelling.',
  },
  {
    criterion: 'Grammatical Range & Accuracy',
    shortCode: 'GRA',
    weight: '25%',
    band9: 'Uses a wide range of structures with full flexibility and accuracy. Rare minor errors occur as slips only.',
    band7: 'Uses a variety of complex structures with good control. Produces frequent error-free sentences with good control of grammar and punctuation.',
    band6: 'Uses a mix of simple and complex sentence forms. Makes noticeable errors in grammar and punctuation but they rarely reduce communication.',
  },
];

export default function IELTSWritingRubricPage() {
  const [isDark, setIsDark] = useState(false);
  const [selectedBand, setSelectedBand] = useState<'band9' | 'band7' | 'band6'>('band9');

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <PublicNav isDark={isDark} onToggleDark={() => setIsDark(!isDark)} />

      {/* Hero */}
      <section className="pt-28 pb-8 bg-gradient-to-b from-cyan-500/10 via-card to-background border-b border-border">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 text-cyan-600 text-xs font-black border border-cyan-500/20">
            <PenTool size={14} /> Official Cambridge IELTS Writing Rubric Explorer
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight leading-tight">
            IELTS Writing <span className="text-cyan-600">Band Rubric Explorer</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Understand how examiners grade Task 1 &amp; Task 2 across Task Response (TR), Coherence (CC), Lexical Resource (LR), and Grammar (GRA).
          </p>
        </div>
      </section>

      {/* Main Workspace */}
      <section className="py-8 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 space-y-8">
        
        {/* Band Selector */}
        <div className="flex items-center justify-center gap-3">
          {[
            { id: 'band9', label: 'Band 9.0 (Expert User)' },
            { id: 'band7', label: 'Band 7.0 (Good User)' },
            { id: 'band6', label: 'Band 6.0 (Competent User)' },
          ].map((b) => (
            <button
              key={b.id}
              onClick={() => setSelectedBand(b.id as any)}
              className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all border ${
                selectedBand === b.id
                  ? 'bg-cyan-600 text-white border-cyan-600 shadow-md'
                  : 'bg-card border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>

        {/* 4 Criterion Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {IELTS_WRITING_RUBRICS.map((rub, idx) => (
            <div key={idx} className="bg-card border border-border rounded-3xl p-6 shadow-md space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-cyan-600 bg-cyan-500/10 px-2.5 py-0.5 rounded-full">
                    {rub.shortCode} · Weight: {rub.weight}
                  </span>
                  <h3 className="text-base font-black text-foreground mt-1">{rub.criterion}</h3>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-1">
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Examiner Descriptor ({selectedBand.toUpperCase()}):</span>
                <p className="text-xs font-medium text-foreground leading-relaxed">
                  {rub[selectedBand]}
                </p>
              </div>
            </div>
          ))}
        </div>

      </section>
    </div>
  );
}
