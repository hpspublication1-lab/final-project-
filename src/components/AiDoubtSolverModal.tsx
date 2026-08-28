'use client';

import React, { useState } from 'react';
import {
  Bot, Sparkles, X, Upload, Camera, Send, RefreshCw, HelpCircle,
  CheckCircle2, ArrowRight, BookOpen, Layers, Lightbulb
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AiDoubtSolverModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuestion?: string;
}

export default function AiDoubtSolverModal({
  isOpen,
  onClose,
  initialQuestion = '',
}: AiDoubtSolverModalProps) {
  const [questionText, setQuestionText] = useState(initialQuestion);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [language, setLanguage] = useState<'english' | 'nepali'>('english');
  const [mode, setMode] = useState<'step_by_step' | 'simpler' | 'similar'>('step_by_step');
  const [isSolving, setIsSolving] = useState(false);

  // Socratic 4-Stage Result
  const [activeStage, setActiveStage] = useState<'explain' | 'ask' | 'practice' | 'test'>('explain');
  const [hasResult, setHasResult] = useState(false);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSolve = async () => {
    if (!questionText.trim() && !imagePreview) {
      toast.error('Please type a question or upload a photo!');
      return;
    }

    setIsSolving(true);
    setHasResult(false);

    // Simulate AI Socratic doubt resolution engine
    setTimeout(() => {
      setIsSolving(false);
      setHasResult(true);
      setActiveStage('explain');
      toast.success('Samyak AI Socratic Explanation Ready!');
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-card border-2 border-emerald-500/40 rounded-3xl p-6 sm:p-8 max-w-2xl w-full text-foreground shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <Bot size={22} className="text-emerald-500" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              SOCRATIC LEARNING LOOP (EXPLAIN → ASK → PRACTICE → TEST)
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-foreground">
              🤖 ASK SAMYAK AI
            </h2>
          </div>
        </div>

        {!hasResult ? (
          /* Question Input Step */
          <div className="space-y-5">
            
            {/* Input Mode Controls */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                1. Ask Question (Type or Upload Photo)
              </label>

              <textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder={
                  language === 'nepali'
                    ? 'यहाँ आफ्नो प्रश्न टाइप गर्नुहोस् (उदाहरण: गुरुत्वाकर्षण बल भनेको के हो?)...'
                    : 'Type your SEE/CEE question here (e.g. How to solve Pascal\'s Law numericals?)...'
                }
                rows={3}
                className="w-full p-4 rounded-2xl bg-muted/40 border border-border text-sm font-medium text-foreground focus:outline-none focus:border-emerald-500"
              />

              <div className="flex items-center gap-3">
                <label className="flex-1 px-4 py-3 rounded-2xl bg-muted/60 border border-border hover:border-emerald-500/40 text-xs font-bold text-foreground cursor-pointer flex items-center justify-center gap-2 transition-colors">
                  <Upload size={16} className="text-emerald-600" />
                  <span>{imagePreview ? 'Change Question Photo' : 'Upload Question Photo'}</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>

                {imagePreview && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 size={14} /> Photo Attached
                  </span>
                )}
              </div>
            </div>

            {/* Language & Explanation Type Toggles */}
            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                  2. Language
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setLanguage('english')}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                      language === 'english'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-muted text-muted-foreground border-transparent'
                    }`}
                  >
                    🇬🇧 English
                  </button>
                  <button
                    onClick={() => setLanguage('nepali')}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                      language === 'nepali'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-muted text-muted-foreground border-transparent'
                    }`}
                  >
                    🇳🇵 Nepali (नेपाली)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                  3. Explanation Mode
                </label>
                <div className="flex gap-1.5 overflow-x-auto">
                  <button
                    onClick={() => setMode('step_by_step')}
                    className={`px-3 py-2.5 rounded-xl text-[11px] font-bold border shrink-0 transition-all ${
                      mode === 'step_by_step'
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                        : 'bg-muted text-muted-foreground border-transparent'
                    }`}
                  >
                    Step-by-Step
                  </button>
                  <button
                    onClick={() => setMode('simpler')}
                    className={`px-3 py-2.5 rounded-xl text-[11px] font-bold border shrink-0 transition-all ${
                      mode === 'simpler'
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                        : 'bg-muted text-muted-foreground border-transparent'
                    }`}
                  >
                    Simpler
                  </button>
                  <button
                    onClick={() => setMode('similar')}
                    className={`px-3 py-2.5 rounded-xl text-[11px] font-bold border shrink-0 transition-all ${
                      mode === 'similar'
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                        : 'bg-muted text-muted-foreground border-transparent'
                    }`}
                  >
                    Similar Qs
                  </button>
                </div>
              </div>

            </div>

            {/* Action Submit Button */}
            <button
              onClick={handleSolve}
              disabled={isSolving}
              className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl transition-all disabled:opacity-50"
            >
              {isSolving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Samyak AI is Generating Socratic Learning Loop...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>SOLVE WITH SAMYAK AI — EXPLAIN &amp; TEST ME</span>
                </>
              )}
            </button>

          </div>
        ) : (
          /* Socratic 4-Loop Output Step */
          <div className="space-y-6">
            
            {/* 4 Stage Pills Navigation */}
            <div className="flex gap-1.5 bg-muted p-1 rounded-2xl border border-border">
              {[
                { id: 'explain', label: '1. EXPLAIN 💡' },
                { id: 'ask', label: '2. ASK ❓' },
                { id: 'practice', label: '3. PRACTICE ⚡' },
                { id: 'test', label: '4. TEST 🎯' },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setActiveStage(st.id as any)}
                  className={`flex-1 py-2.5 text-center text-xs font-black rounded-xl transition-all ${
                    activeStage === st.id
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* STAGE 1: EXPLAIN */}
            {activeStage === 'explain' && (
              <div className="p-6 rounded-3xl bg-muted/30 border border-border space-y-4 font-sans">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <span className="text-xs font-black uppercase text-emerald-600 font-mono">STAGE 1: CONCEPT EXPLANATION</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{language === 'nepali' ? 'नेपाली व्याख्या' : 'Step-by-Step'}</span>
                </div>

                <div className="space-y-3 text-xs sm:text-sm text-foreground font-medium leading-relaxed">
                  <p className="font-bold">
                    {questionText || 'How to solve Pascal\'s Law Pressure Numericals?'}
                  </p>
                  <div className="p-4 rounded-2xl bg-card border border-emerald-500/30 space-y-2">
                    <span className="text-xs font-bold text-emerald-600 block font-mono">CORE CONCEPT:</span>
                    <p className="text-xs text-muted-foreground">
                      Pascal&apos;s Law states that pressure applied to an enclosed fluid is transmitted equally in all directions throughout the fluid.
                    </p>
                    <div className="p-2.5 rounded-xl bg-muted font-mono text-xs font-bold text-foreground">
                      Formula: P₁ = P₂ &rarr; F₁ / A₁ = F₂ / A₂
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveStage('ask')}
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2"
                >
                  <span>Understood! Go to STAGE 2: ASK (Check Comprehension)</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            )}

            {/* STAGE 2: ASK */}
            {activeStage === 'ask' && (
              <div className="p-6 rounded-3xl bg-muted/30 border border-border space-y-4 font-sans">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <span className="text-xs font-black uppercase text-amber-600 font-mono">STAGE 2: COMPREHENSION CHECK</span>
                  <span className="text-[10px] text-muted-foreground font-mono">Interactive Question</span>
                </div>

                <div className="space-y-3 text-xs sm:text-sm text-foreground font-medium">
                  <p className="font-bold">
                    Based on the concept above: If area A₂ is 5 times larger than area A₁, what happens to force F₂?
                  </p>
                  
                  <div className="space-y-2">
                    {['F₂ becomes 5 times larger than F₁', 'F₂ becomes 5 times smaller', 'F₂ remains unchanged'].map((opt, idx) => (
                      <button
                        key={opt}
                        onClick={() => {
                          if (idx === 0) toast.success('Correct! F₂ becomes 5x larger!');
                          else toast.error('Try again!');
                        }}
                        className="w-full p-3 rounded-xl border border-border hover:border-emerald-500 bg-card text-left text-xs font-bold transition-all"
                      >
                        {String.fromCharCode(65 + idx)}. {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setActiveStage('practice')}
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2"
                >
                  <span>Continue to STAGE 3: PRACTICE (Similar Drill)</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            )}

            {/* STAGE 3: PRACTICE */}
            {activeStage === 'practice' && (
              <div className="p-6 rounded-3xl bg-muted/30 border border-border space-y-4 font-sans">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <span className="text-xs font-black uppercase text-blue-600 font-mono">STAGE 3: SIMILAR DRILL</span>
                  <span className="text-[10px] text-muted-foreground font-mono">Practice Drill</span>
                </div>

                <div className="space-y-3 text-xs sm:text-sm text-foreground font-medium">
                  <p className="font-bold">
                    PRACTICE QUESTION: Calculate force F₂ when F₁ = 100 N, A₁ = 0.02 m², and A₂ = 0.1 m².
                  </p>
                  <div className="p-3 rounded-xl bg-card border border-border font-mono text-xs text-muted-foreground">
                    Hint: Use F₂ = F₁ × (A₂ / A₁)
                  </div>
                </div>

                <button
                  onClick={() => setActiveStage('test')}
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2"
                >
                  <span>Complete STAGE 4: TEST (Final Mastery Check)</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            )}

            {/* STAGE 4: TEST */}
            {activeStage === 'test' && (
              <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 space-y-4 text-center">
                <CheckCircle2 size={36} className="text-emerald-600 mx-auto" />
                <h3 className="text-lg font-black text-foreground">SOCRATIC LEARNING LOOP COMPLETE!</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  You have successfully explained, reasoned, practiced, and verified your doubt for this topic.
                </p>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setHasResult(false);
                      setQuestionText('');
                      setImagePreview(null);
                    }}
                    className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-card border border-border text-xs font-bold text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={14} />
                    <span>Ask Another Doubt</span>
                  </button>

                  <button
                    onClick={onClose}
                    className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-lg transition-all"
                  >
                    Close &amp; Back to Study
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
