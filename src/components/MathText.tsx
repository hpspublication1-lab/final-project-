'use client';

import React from 'react';
import { FormattedAnswer } from './FormattedAnswer';

/**
 * MathText — renders Markdown, lists, bold text, and inline/display LaTeX math equations.
 */
export function MathText({ text, className }: { text: string; className?: string }) {
  if (!text) return null;
  return <FormattedAnswer text={text} className={className} />;
}

export default MathText;
