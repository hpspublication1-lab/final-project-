'use client';

import React, { useState, useEffect } from 'react';
import { useProgram, COURSES_MAP, CanonicalCourseId, normalizeCourseId } from '@/contexts/ProgramContext';
import { CheckCircle2, GraduationCap, Stethoscope, Sparkles, ArrowRight, X, Languages, Cpu, TrendingUp } from 'lucide-react';

interface ProgramSelectorModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  forceOpen?: boolean;
}

export function ProgramSelectorModal({ isOpen: externalIsOpen, onClose, forceOpen = false }: ProgramSelectorModalProps) {
  const { program, setProgram } = useProgram();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [selected, setSelected] = useState<CanonicalCourseId>(normalizeCourseId(program));

  useEffect(() => {
    if (forceOpen) {
      setInternalIsOpen(true);
      return;
    }
    if (externalIsOpen !== undefined) {
      setInternalIsOpen(externalIsOpen);
      return;
    }
    // Do NOT force-open automatically anymore! Respect the user's ongoing session.
    setInternalIsOpen(false);
  }, [externalIsOpen, forceOpen]);

  useEffect(() => {
    setSelected(normalizeCourseId(program));
  }, [program]);

  if (!internalIsOpen) return null;

  const handleConfirm = (pType: CanonicalCourseId) => {
    setProgram(pType);
    if (typeof window !== 'undefined') {
      localStorage.setItem('samyak_course_chosen', 'true');
    }
    setInternalIsOpen(false);
    if (onClose) onClose();
  };

  const primaryPrograms: CanonicalCourseId[] = ['see_class_10', 'cee_medical'];
  const secondaryPrograms: CanonicalCourseId[] = ['ielts', 'digital_marketing', 'artificial_intelligence'];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn overflow-y-auto">
      <div className="relative max-w-4xl w-full bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-2xl my-auto space-y-6">
        {/* Close button */}
        {onClose && (
          <button
            onClick={() => {
              setInternalIsOpen(false);
              onClose();
            }}
            className="absolute top-4 right-4 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Close program selector"
          >
            <X size={18} />
          </button>
        )}

        <div className="text-center max-w-lg mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-black mb-2">
            <Sparkles size={14} /> SAMYAK TUTOR
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Choose Your Primary Program
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
            Select between our two core academic &amp; entrance tracks.
          </p>
        </div>

        {/* 2 Primary Flagship Cards: SEE & CEE */}
        <div className="grid sm:grid-cols-2 gap-4">
          {primaryPrograms.map((key) => {
            const prog = COURSES_MAP[key];
            const isSel = selected === key;
            const isSee = key === 'see_class_10';

            return (
              <div
                key={key}
                onClick={() => setSelected(key)}
                className={`relative cursor-pointer rounded-3xl p-6 border-2 transition-all flex flex-col justify-between ${
                  isSel
                    ? isSee
                      ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20 shadow-xl'
                      : 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/20 shadow-xl'
                    : 'border-border bg-card/60 hover:border-border/80'
                }`}
              >
                {isSel && (
                  <div className="absolute top-4 right-4">
                    <CheckCircle2 size={20} className={isSee ? 'text-emerald-500' : 'text-indigo-500'} />
                  </div>
                )}

                <div className="space-y-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    isSee ? 'bg-emerald-500/20 text-emerald-600' : 'bg-indigo-500/20 text-indigo-600'
                  }`}>
                    {isSee ? <GraduationCap size={28} /> : <Stethoscope size={26} />}
                  </div>

                  <div>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                      isSee ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300'
                    }`}>
                      {prog.badge}
                    </span>
                    <h3 className="text-lg font-black text-foreground mt-2">{prog.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {prog.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border/60 text-xs text-muted-foreground">
                  <span className="font-bold text-foreground block mb-1">Subjects Covered:</span>
                  <p className="truncate font-medium">{prog.subjects.map((s) => s.name).join(' · ')}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Secondary Skill Programs */}
        <div className="pt-2">
          <div className="text-xs font-black uppercase text-muted-foreground mb-2 flex items-center gap-1.5">
            <span>More Learning Programs:</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {secondaryPrograms.map((key) => {
              const prog = COURSES_MAP[key];
              const isSel = selected === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelected(key)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    isSel ? 'border-primary bg-primary/10 font-bold' : 'border-border bg-muted/30 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className="font-bold text-foreground line-clamp-1">{prog.shortName}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{prog.tagline}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Confirmation Button */}
        <button
          onClick={() => handleConfirm(selected)}
          className="w-full py-3.5 px-6 rounded-2xl font-black text-sm text-white bg-primary hover:bg-primary/90 flex items-center justify-center gap-2 shadow-lg transition-all"
        >
          <span>Continue to {COURSES_MAP[selected].name}</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

export default ProgramSelectorModal;
