'use client';

import React from 'react';
import { useProgram, normalizeCourseId, CanonicalCourseId } from '@/contexts/ProgramContext';
import { Stethoscope, GraduationCap, ChevronDown, MoreHorizontal } from 'lucide-react';

interface ProgramSwitcherProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  onOpenModal?: () => void;
}

export default function ProgramSwitcher({ className = '', size = 'md', onOpenModal }: ProgramSwitcherProps) {
  const { program, setProgram, programDetails } = useProgram();
  const canonicalId = normalizeCourseId(program);
  const isSmall = size === 'sm';

  const isSee = canonicalId === 'see_class_10';
  const isCee = canonicalId === 'cee_medical';

  return (
    <div className={`inline-flex items-center gap-1 p-1 bg-muted/80 backdrop-blur border border-border rounded-2xl shadow-inner ${className}`}>
      {/* SEE Segment Button */}
      <button
        type="button"
        onClick={() => setProgram('see_class_10')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
          isSee
            ? 'bg-card text-emerald-600 dark:text-emerald-400 shadow-sm border border-emerald-500/30'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        title="Switch to SEE Class 10"
      >
        <GraduationCap size={isSmall ? 13 : 15} className={isSee ? 'text-emerald-500' : ''} />
        <span>SEE</span>
      </button>

      {/* CEE Segment Button */}
      <button
        type="button"
        onClick={() => setProgram('cee_medical')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
          isCee
            ? 'bg-card text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-500/30'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        title="Switch to CEE Medical"
      >
        <Stethoscope size={isSmall ? 13 : 15} className={isCee ? 'text-indigo-500' : ''} />
        <span>CEE</span>
      </button>

      {/* If an auxiliary program is active or user wants more programs */}
      {!isSee && !isCee && (
        <span className="px-2 py-1 text-[11px] font-bold text-foreground border-l border-border pl-2">
          {programDetails.shortName}
        </span>
      )}

      {onOpenModal && (
        <button
          type="button"
          onClick={onOpenModal}
          className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-card transition-colors border-l border-border/60 ml-0.5"
          title="More Learning Programs (IELTS, Digital Marketing, AI)"
          aria-label="More Learning Programs"
        >
          <ChevronDown size={13} />
        </button>
      )}
    </div>
  );
}
