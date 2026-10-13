'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  useProgram,
  normalizeCourseId,
  CanonicalCourseId,
  COURSES_MAP,
  CANONICAL_COURSES,
} from '@/contexts/ProgramContext';
import {
  Stethoscope,
  GraduationCap,
  Zap,
  ShieldCheck,
  Languages,
  TrendingUp,
  Cpu,
  ChevronDown,
  Check,
  Compass,
} from 'lucide-react';

interface ProgramSwitcherProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  onOpenModal?: () => void;
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

const PROGRAM_COLORS: Record<CanonicalCourseId, { text: string; bg: string; dot: string }> = {
  cee_medical: { text: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-500/10', dot: 'bg-indigo-500' },
  ioe_engineering: { text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10', dot: 'bg-blue-500' },
  lok_sewa: { text: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10', dot: 'bg-orange-500' },
  neb_class_12: { text: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-500/10', dot: 'bg-cyan-500' },
  neb_class_11: { text: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-500/10', dot: 'bg-teal-500' },
  see_class_10: { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10', dot: 'bg-emerald-500' },
  ielts: { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10', dot: 'bg-amber-500' },
  digital_marketing: { text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10', dot: 'bg-rose-500' },
  artificial_intelligence: { text: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10', dot: 'bg-purple-500' },
};

const PROGRAM_GROUPS = [
  {
    label: 'Entrance & Civil Service',
    programs: ['cee_medical', 'ioe_engineering', 'lok_sewa'] as CanonicalCourseId[],
  },
  {
    label: 'Board Exams & Academics',
    programs: ['neb_class_12', 'neb_class_11', 'see_class_10'] as CanonicalCourseId[],
  },
  {
    label: 'Global Tests & Tech Skills',
    programs: ['ielts', 'digital_marketing', 'artificial_intelligence'] as CanonicalCourseId[],
  },
];

export default function ProgramSwitcher({ className = '', size = 'md', onOpenModal }: ProgramSwitcherProps) {
  const { program, setProgram, programDetails } = useProgram();
  const canonicalId = normalizeCourseId(program);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const CurrentIcon = PROGRAM_ICONS[canonicalId] || Stethoscope;
  const currentColor = PROGRAM_COLORS[canonicalId] || PROGRAM_COLORS.cee_medical;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const handleSelect = (id: CanonicalCourseId) => {
    setProgram(id);
    setDropdownOpen(false);
  };

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Active Program Pill Trigger */}
      <button
        type="button"
        onClick={() => setDropdownOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted/60 transition-all text-xs font-bold shadow-sm"
        title="Switch Learning Course / Stream"
        aria-expanded={dropdownOpen}
      >
        <span className={`w-2 h-2 rounded-full ${currentColor.dot} animate-pulse`} />
        <CurrentIcon size={14} className={currentColor.text} />
        <span className="text-foreground tracking-tight max-w-[120px] sm:max-w-none truncate">
          {programDetails.shortName}
        </span>
        <ChevronDown size={13} className={`text-muted-foreground transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Floating Dropdown Menu */}
      {dropdownOpen && (
        <div className="absolute left-0 mt-2 w-72 sm:w-80 bg-card border border-border rounded-2xl shadow-2xl p-2 z-50 animate-fadeIn space-y-2">
          <div className="px-2 py-1.5 border-b border-border flex items-center justify-between text-[11px] font-bold text-muted-foreground">
            <span>SWITCH LEARNING STREAM</span>
            {onOpenModal ? (
              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  onOpenModal();
                }}
                className="text-primary hover:underline flex items-center gap-1"
              >
                <Compass size={11} /> View All
              </button>
            ) : (
              <Link href="/gate" className="text-primary hover:underline flex items-center gap-1">
                <Compass size={11} /> Course Gate
              </Link>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
            {PROGRAM_GROUPS.map((group) => (
              <div key={group.label} className="space-y-1">
                <div className="px-2 text-[10px] font-black uppercase text-muted-foreground/70 tracking-wider">
                  {group.label}
                </div>
                {group.programs.map((id) => {
                  const details = COURSES_MAP[id];
                  const Icon = PROGRAM_ICONS[id];
                  const colors = PROGRAM_COLORS[id];
                  const isSelected = canonicalId === id;

                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => handleSelect(id)}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all text-xs ${
                        isSelected
                          ? `${colors.bg} ${colors.text} font-extrabold border border-border/80 shadow-xs`
                          : 'hover:bg-muted text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className={`w-6 h-6 rounded-lg ${colors.bg} flex items-center justify-center shrink-0`}>
                          <Icon size={13} className={colors.text} />
                        </div>
                        <div className="truncate">
                          <div className="truncate font-semibold">{details.shortName}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{details.badge}</div>
                        </div>
                      </div>
                      {isSelected && <Check size={14} className={colors.text} />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-border">
            <Link
              href="/gate"
              onClick={() => setDropdownOpen(false)}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold transition-colors"
            >
              <Compass size={13} /> Open Visual Course Gate
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
