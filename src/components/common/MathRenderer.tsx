'use client';

import React from 'react';
import katex from 'katex';

interface MathRendererProps {
  text: string;
  className?: string;
  block?: boolean;
}

export default function MathRenderer({
  text,
  className = '',
  block = false,
}: MathRendererProps) {
  if (!text) return null;

  const renderContentWithMath = (content: string) => {
    const parts = content.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);

    return parts.map((part, index) => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        const math = part.slice(2, -2).trim();
        try {
          const html = katex.renderToString(math, {
            displayMode: true,
            throwOnError: false,
          });
          return (
            <span
              key={index}
              className="my-2 block overflow-x-auto py-1 text-center font-serif text-sm"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          return <span key={index}>{part}</span>;
        }
      } else if (part.startsWith('$') && part.endsWith('$')) {
        const math = part.slice(1, -1).trim();
        try {
          const html = katex.renderToString(math, {
            displayMode: false,
            throwOnError: false,
          });
          return (
            <span
              key={index}
              className="inline-math px-0.5 font-serif text-sm"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          return <span key={index}>{part}</span>;
        }
      } else {
        return <span key={index}>{part}</span>;
      }
    });
  };

  return (
    <div className={`${className} ${block ? 'block' : 'inline'}`}>
      {renderContentWithMath(text)}
    </div>
  );
}
