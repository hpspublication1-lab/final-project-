'use client';

import React, { useState, useEffect } from 'react';
import { useProgram, CANONICAL_COURSES, COURSES_MAP, CanonicalCourseId, ProgramType, normalizeCourseId } from '@/contexts/ProgramContext';
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
    // Check if user has selected a course previously
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('samyak_active_program');
      const hasChosen = localStorage.getItem('samyak_course_chosen');
      if (!saved || !hasChosen) {
        setInternalIsOpen(true);
      }
    }
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

  const getSectorIcon = (id: CanonicalCourseId) => {
    switch (id) {
      case 'cee_medical': return <Stethoscope size={24} />;
      case 'see_class_10': return <GraduationCap size={26} />;
      case 'ielts': return <Languages size={24} />;
      case 'digital_marketing': return <TrendingUp size={24} />;
      case 'artificial_intelligence': return <Cpu size={24} />;
    }
  };

  const getBorderColor = (id: CanonicalCourseId, isSel: boolean) => {
    if (!isSel) return 'border-border bg-card/60 hover:border-primary/40 hover:bg-muted/30';
    switch (id) {
      case 'cee_medical': return 'border-indigo-500 bg-indigo-500/5 shadow-lg shadow-indigo-500/10 ring-2 ring-indigo-500/20 scale-[1.02]';
      case 'see_class_10': return 'border-emerald-500 bg-emerald-500/5 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/20 scale-[1.02]';
      case 'ielts': return 'border-amber-500 bg-amber-500/5 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/20 scale-[1.02]';
      case 'digital_marketing': return 'border-rose-500 bg-rose-500/5 shadow-lg shadow-rose-500/10 ring-2 ring-rose-500/20 scale-[1.02]';
      case 'artificial_intelligence': return 'border-purple-500 bg-purple-500/5 shadow-lg shadow-purple-500/10 ring-2 ring-purple-500/20 scale-[1.02]';
    }
  };

  const getBtnBg = (id: CanonicalCourseId) => {
    switch (id) {
      case 'cee_medical': return 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20';
      case 'see_class_10': return 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20';
      case 'ielts': return 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20';
      case 'digital_marketing': return 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20';
      case 'artificial_intelligence': return 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/20';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn overflow-y-auto">
      <div className="relative max-w-5xl w-full bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-2xl my-auto">
        {/* Background glow effects */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        {/* Optional close button if user has already selected before */}
        {onClose && (
          <button
            onClick={() => {
              setInternalIsOpen(false);
              onClose();
            }}
            className="absolute top-4 right-4 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X size={18} />
          </button>
        )}

        <div className="text-center max-w-lg mx-auto mb-6">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-black mb-3">
            <Sparkles size={14} /> Soumya Guru Multi-Course Learning Platform
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Choose Your Learning Path
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
            Select an independent learning portal. Your dashboard, subjects, video classes, mock tests, and AI tools will customize specifically to this course.
          </p>
        </div>

        {/* 5 Sector Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 mb-6">
          {CANONICAL_COURSES.map((key) => {
            const prog = COURSES_MAP[key];
            const isSel = selected === key;
            return (
              <div
                key={key}
                onClick={() => setSelected(key)}
                className={`relative cursor-pointer rounded-2xl p-4 border-2 transition-all duration-200 flex flex-col justify-between ${getBorderColor(key, isSel)}`}
              >
                {isSel && (
                  <div className="absolute top-3 right-3">
                    <CheckCircle2 size={18} className="fill-current text-white" />
                  </div>
                )}
                <div>
                  <div className={`w-10 h-10 rounded-xl ${prog.badgeBg} ${prog.badgeText} flex items-center justify-center mb-2.5`}>
                    {getSectorIcon(key)}
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${prog.badgeText} px-2 py-0.5 rounded-full ${prog.badgeBg}`}>
                    {prog.badge}
                  </span>
                  <h3 className="text-sm font-bold text-foreground mt-2 leading-snug">{prog.name}</h3>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed line-clamp-3">
                    {prog.description}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-border/50 text-[10px] text-muted-foreground">
                  <p className="font-semibold text-foreground mb-1">Key Modules:</p>
                  <p className="truncate font-medium">{prog.subjects.map(s => s.name).join(' · ')}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <button
          onClick={() => handleConfirm(selected)}
          className={`w-full py-3.5 px-6 rounded-xl font-extrabold text-sm text-white flex items-center justify-center gap-2 transition-all shadow-md ${getBtnBg(selected)}`}
        >
          <span>Enter {COURSES_MAP[selected].name}</span>
          <ArrowRight size={16} />
        </button>

        <p className="text-[11px] text-center text-muted-foreground mt-3">
          You can switch between courses anytime from the top bar switcher.
        </p>
      </div>
    </div>
  );
}

export default ProgramSelectorModal;


