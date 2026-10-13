'use client';

import React, { useState, useEffect } from 'react';
import { useProgram, COURSES_MAP, CanonicalCourseId, normalizeCourseId } from '@/contexts/ProgramContext';
import {
  CheckCircle2,
  GraduationCap,
  Stethoscope,
  Sparkles,
  ArrowRight,
  X,
  Languages,
  Cpu,
  TrendingUp,
  Zap,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';

interface ProgramSelectorModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  forceOpen?: boolean;
}

const PROGRAM_ICONS: Record<CanonicalCourseId, React.ElementType> = {
  cee_medical: Stethoscope,
  ioe_engineering: Zap,
  lok_sewa: ShieldCheck,
  neb_class_12: GraduationCap,
  neb_class_11: GraduationCap,
  see_class_10: GraduationCap,
  ielts: Languages,
  digital_marketing: TrendingUp,
  artificial_intelligence: Cpu,
};

const PROGRAM_CATEGORIES = [
  {
    id: 'entrance',
    label: 'Entrance & Civil Service',
    description: 'Medical, Engineering & Government Public Service Exams',
    keys: ['cee_medical', 'ioe_engineering', 'lok_sewa'] as CanonicalCourseId[],
  },
  {
    id: 'boards',
    label: 'NEB & SEE Board Exams',
    description: 'Class 10, 11 & 12 Board Prep + Bridge Revision',
    keys: ['neb_class_12', 'neb_class_11', 'see_class_10'] as CanonicalCourseId[],
  },
  {
    id: 'global',
    label: 'Language & Digital Skills',
    description: 'Study Abroad Tests & Modern Career Capabilities',
    keys: ['ielts', 'digital_marketing', 'artificial_intelligence'] as CanonicalCourseId[],
  },
];

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

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn overflow-y-auto">
      <div className="relative max-w-4xl w-full bg-card border border-border rounded-3xl p-5 sm:p-8 shadow-2xl my-auto space-y-6">
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
            <Sparkles size={14} /> SAMYAK TUTOR ACADEMY
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Choose Your Learning Gate
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
            Select the course stream you want to continue learning today. You can switch anytime.
          </p>
        </div>

        {/* Grouped Courses Grid */}
        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1">
          {PROGRAM_CATEGORIES.map((cat) => (
            <div key={cat.id} className="space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-1.5">
                <div>
                  <h3 className="text-xs font-black uppercase text-foreground tracking-wider">{cat.label}</h3>
                  <p className="text-[11px] text-muted-foreground">{cat.description}</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {cat.keys.map((key) => {
                  const prog = COURSES_MAP[key];
                  const Icon = PROGRAM_ICONS[key] || BookOpen;
                  const isSel = selected === key;

                  return (
                    <div
                      key={key}
                      onClick={() => setSelected(key)}
                      className={`relative cursor-pointer rounded-2xl p-4 border-2 transition-all flex flex-col justify-between ${
                        isSel
                          ? 'border-primary bg-primary/10 ring-2 ring-primary/20 shadow-md'
                          : 'border-border bg-card/60 hover:border-primary/40'
                      }`}
                    >
                      {isSel && (
                        <div className="absolute top-3 right-3">
                          <CheckCircle2 size={18} className="text-primary" />
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                          <Icon size={18} />
                        </div>

                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {prog.badge}
                          </span>
                          <h4 className="text-sm font-extrabold text-foreground mt-1.5 leading-snug">
                            {prog.name}
                          </h4>
                          <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                            {prog.description}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-border/60 text-[10px] text-muted-foreground truncate">
                        <span className="font-semibold text-foreground">Subjects: </span>
                        {prog.subjects.map((s) => s.name).slice(0, 3).join(', ')}
                        {prog.subjects.length > 3 && ` +${prog.subjects.length - 3}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Confirmation Button */}
        <button
          onClick={() => handleConfirm(selected)}
          className="w-full py-3.5 px-6 rounded-2xl font-black text-sm text-white bg-primary hover:bg-primary/90 flex items-center justify-center gap-2 shadow-lg transition-all"
        >
          <span>Continue with {COURSES_MAP[selected].name}</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

export default ProgramSelectorModal;
