'use client';

import React from 'react';
import { useProgram, normalizeCourseId, CanonicalCourseId, ProgramType } from '@/contexts/ProgramContext';
import { Stethoscope, GraduationCap, Languages, Cpu, TrendingUp, ChevronDown } from 'lucide-react';

interface ProgramSwitcherProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  onOpenModal?: () => void;
}

export default function ProgramSwitcher({ className = '', size = 'md', onOpenModal }: ProgramSwitcherProps) {
  const { program, programDetails } = useProgram();
  const canonicalId = normalizeCourseId(program);
  const isSmall = size === 'sm';

  const getIcon = (id: CanonicalCourseId) => {
    switch (id) {
      case 'cee_medical': return <Stethoscope size={isSmall ? 13 : 15} />;
      case 'see_class_10': return <GraduationCap size={isSmall ? 14 : 16} />;
      case 'ielts': return <Languages size={isSmall ? 13 : 15} />;
      case 'digital_marketing': return <TrendingUp size={isSmall ? 13 : 15} />;
      case 'artificial_intelligence': return <Cpu size={isSmall ? 13 : 15} />;
    }
  };

  return (
    <div className={`inline-flex items-center gap-1 p-1 bg-muted/80 backdrop-blur border border-border rounded-xl shadow-inner ${className}`}>
      <button
        type="button"
        onClick={onOpenModal}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all bg-card shadow-sm border border-border/80 ${programDetails.badgeText}`}
      >
        {getIcon(canonicalId)}
        <span>{programDetails.shortName}</span>
        {onOpenModal && <ChevronDown size={12} className="opacity-70 ml-0.5" />}
      </button>

      {onOpenModal && (
        <button
          type="button"
          onClick={onOpenModal}
          className="text-[10px] font-bold text-muted-foreground hover:text-primary px-2 py-1 rounded hover:bg-muted transition-colors border-l border-border/60 ml-0.5 flex items-center gap-1"
          title="Switch Learning Course"
        >
          <span>5 Portals</span>
          <span>⚡</span>
        </button>
      )}
    </div>
  );
}



