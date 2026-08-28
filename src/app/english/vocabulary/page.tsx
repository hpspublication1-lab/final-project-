'use client';

import React, { useState, useEffect } from 'react';
import PublicNav from '@/components/PublicNav';
import {
  BookOpen, Sparkles, Award, ArrowRight, RefreshCw, CheckCircle2,
  Volume2, Search, Flame, Zap
} from 'lucide-react';
import toast from 'react-hot-toast';

interface VocabWord {
  word: string;
  cefr: 'C1' | 'C2';
  definition: string;
  band9UpgradeFor: string; // e.g. "basic word: important" -> "paramount"
  collocation: string;
  exampleSentence: string;
}

const BAND_9_VOCABULARY_VAULT: VocabWord[] = [
  {
    word: 'Paramount',
    cefr: 'C1',
    definition: 'More important than anything else; supreme.',
    band9UpgradeFor: 'important / crucial',
    collocation: 'of paramount importance',
    exampleSentence: 'Ensuring environmental sustainability is of paramount importance for developing nations.',
  },
  {
    word: 'Notwithstanding',
    cefr: 'C2',
    definition: 'In spite of; despite.',
    band9UpgradeFor: 'despite / although',
    collocation: 'notwithstanding the fact that',
    exampleSentence: 'Notwithstanding the economic downturn, investment in renewable energy continues to soar.',
  },
  {
    word: 'Exacerbate',
    cefr: 'C1',
    definition: 'Make a problem, bad situation, or negative feeling worse.',
    band9UpgradeFor: 'make worse / spoil',
    collocation: 'exacerbate the crisis',
    exampleSentence: 'Uncontrolled urban expansion threatens to exacerbate the existing traffic congestion.',
  },
  {
    word: 'Ubiquitous',
    cefr: 'C1',
    definition: 'Present, appearing, or found everywhere.',
    band9UpgradeFor: 'everywhere / common',
    collocation: 'become increasingly ubiquitous',
    exampleSentence: 'Smartphones have become ubiquitous in modern workplace environments.',
  },
  {
    word: 'Mitigate',
    cefr: 'C1',
    definition: 'Make less severe, serious, or painful.',
    band9UpgradeFor: 'reduce / lessen',
    collocation: 'mitigate climate risks',
    exampleSentence: 'Government subsidies can help mitigate the financial impact on low-income households.',
  },
];

export default function IELTSVocabularyPage() {
  const [isDark, setIsDark] = useState(false);
  const [search, setSearch] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);

  const filteredWords = BAND_9_VOCABULARY_VAULT.filter(
    (w) =>
      w.word.toLowerCase().includes(search.toLowerCase()) ||
      w.band9UpgradeFor.toLowerCase().includes(search.toLowerCase())
  );

  const currentWord = filteredWords[activeIdx % Math.max(1, filteredWords.length)] || BAND_9_VOCABULARY_VAULT[0];

  const speakWord = async (text: string) => {
    try {
      const res = await fetch('/api/ai/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, persona: 'coach_aria' }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const audio = new Audio(URL.createObjectURL(blob));
        await audio.play();
        return;
      }
    } catch {
      // Fallback
    }

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-GB';
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <PublicNav isDark={isDark} onToggleDark={() => setIsDark(!isDark)} />

      {/* Hero Section */}
      <section className="pt-28 pb-8 bg-gradient-to-b from-violet-500/10 via-card to-background border-b border-border">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/10 text-violet-600 text-xs font-black border border-violet-500/20">
            <BookOpen size={14} /> Band 9.0 Academic Vocabulary &amp; AWL Engine
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight leading-tight">
            IELTS Academic <span className="text-violet-600">Vocabulary Engine</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Upgrade basic words to Band 9.0 C1/C2 vocabulary with academic collocations, audio pronunciation, and essay sentence structures.
          </p>
        </div>
      </section>

      {/* Main Workspace */}
      <section className="py-8 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 space-y-8">
        
        {/* Search Bar */}
        <div className="max-w-md mx-auto relative">
          <Search size={16} className="absolute left-3.5 top-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search basic words (e.g. 'important', 'make worse')..."
            className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-2xl text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>

        {/* Word Flashcard */}
        {currentWord && (
          <div className="max-w-2xl mx-auto bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-600">
                  {currentWord.cefr} CEFR LEXICAL UPGRADE
                </span>
                <div className="flex items-center gap-3 mt-2">
                  <h3 className="text-3xl font-black text-foreground">{currentWord.word}</h3>
                  <button
                    onClick={() => speakWord(currentWord.word)}
                    className="p-2 rounded-xl bg-violet-500/10 text-violet-600 hover:bg-violet-500/20 transition-all"
                    title="Listen to pronunciation"
                  >
                    <Volume2 size={18} />
                  </button>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-muted-foreground font-semibold block">Upgrades Basic Word:</span>
                <span className="text-xs font-bold text-amber-600 font-mono">&ldquo;{currentWord.band9UpgradeFor}&rdquo;</span>
              </div>
            </div>

            {/* Definition */}
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-muted-foreground">Definition:</span>
              <p className="text-sm font-semibold text-foreground">{currentWord.definition}</p>
            </div>

            {/* Collocation */}
            <div className="p-3.5 rounded-2xl bg-muted/40 border border-border space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-violet-600">Academic Collocation:</span>
              <p className="text-xs font-mono font-bold text-foreground">&ldquo;{currentWord.collocation}&rdquo;</p>
            </div>

            {/* Example Sentence */}
            <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20 space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-violet-600">Band 9.0 Essay Sentence Example:</span>
              <p className="text-xs font-serif italic text-foreground leading-relaxed">
                &ldquo;{currentWord.exampleSentence}&rdquo;
              </p>
            </div>

            {/* Card Controls */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-bold text-muted-foreground">
                Word {activeIdx + 1} of {filteredWords.length}
              </span>
              <button
                onClick={() => setActiveIdx((prev) => (prev + 1) % filteredWords.length)}
                className="px-6 py-3 rounded-2xl bg-violet-600 text-white font-extrabold text-xs hover:bg-violet-700 transition-all flex items-center gap-2 shadow-md"
              >
                <span>Next Vocabulary Card</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

      </section>
    </div>
  );
}
