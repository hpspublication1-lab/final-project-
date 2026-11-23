'use client';

import React from 'react';
import { CANONICAL_COURSES, COURSES_MAP } from '@/contexts/ProgramContext';

/**
 * The course an admin is filing something under. Required, with no preselected
 * value: before 23 Nov 2026 most admin screens never asked, so everything they
 * created got the database default — CEE — whatever it really was.
 */
export function CourseSelect({
  value,
  onChange,
  label = 'Course *',
  labelClassName = 'block text-xs font-semibold text-muted-foreground mb-1.5',
  selectClassName = 'w-full px-3 py-2 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-primary',
  className,
  hint = 'Students only see this in the course you choose.',
}: {
  value: string;
  onChange: (course: string) => void;
  label?: string;
  labelClassName?: string;
  selectClassName?: string;
  className?: string;
  hint?: string | null;
}) {
  const id = React.useId();
  return (
    <div className={className}>
      <label htmlFor={id} className={labelClassName}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={selectClassName}>
        <option value="">Choose a course</option>
        {CANONICAL_COURSES.map((c) => (
          <option key={c} value={c}>{COURSES_MAP[c]?.shortName ?? c}</option>
        ))}
      </select>
      {!value && hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function courseLabel(course: string | null | undefined): string {
  if (!course) return 'Course unclear';
  return COURSES_MAP[course as keyof typeof COURSES_MAP]?.shortName ?? course;
}
