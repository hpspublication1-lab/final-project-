'use client';

import React from 'react';
import { useProgram, PROGRAMS, ProgramType } from '@/contexts/ProgramContext';
import { Stethoscope, GraduationCap, Languages, Cpu, ChevronDown } from 'lucide-react';

interface ProgramSwitcherProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  onOpenModal?: () => void;
}

export default function ProgramSwitcher({ className = '', size = 'md', onOpenModal }: ProgramSwitcherProps) {
  const { program, setProgram, programDetails } = useProgram();

  const handleSelect = (p: ProgramType) => {
    setProgram(p);
  };

  const isSmall = size === 'sm';

  const getIcon = (p: ProgramType) => {
    switch (p) {
      case 'cee': return <Stethoscope size={isSmall ? 13 : 15} />;
      case 'see': return <GraduationCap size={isSmall ? 14 : 16} />;
      case 'english': return <Languages size={isSmall ? 13 : 15} />;
      case 'digital': return <Cpu size={isSmall ? 13 : 15} />;
    }
  };

  return (
    <div className={`inline-flex items-center gap-1 p-1 bg-muted/80 backdrop-blur border border-border rounded-xl shadow-inner ${className}`}>
      {/* Quick sector buttons for mobile/desktop */}
      <button
        type="button"
        onClick={() => (onOpenModal ? onOpenModal() : handleSelect(program === 'cee' ? 'see' : program === 'see' ? 'english' : program === 'english' ? 'digital' : 'cee'))}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-card shadow-sm border border-border/80 ${programDetails.badgeText}`}
      >
        {getIcon(program)}
        <span>{programDetails.shortName}</span>
        {onOpenModal && <ChevronDown size={12} className="opacity-70 ml-0.5" />}
      </button>

      {onOpenModal && (
        <button
          type="button"
          onClick={onOpenModal}
          className="text-[10px] font-bold text-muted-foreground hover:text-primary px-2 py-1 rounded hover:bg-muted transition-colors border-l border-border/60 ml-0.5 flex items-center gap-1"
          title="Change Sector Target"
        >
          <span>All 4 Sectors</span>
          <span>⚙️</span>
        </button>
      )}
    </div>
  );
}


