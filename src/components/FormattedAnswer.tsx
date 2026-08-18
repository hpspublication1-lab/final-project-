'use client';

import React, { useState } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { Check, Copy, Download, ExternalLink, Maximize2, Sparkles, X } from 'lucide-react';

interface FormattedAnswerProps {
  text: string;
  className?: string;
}

/**
 * Render inline formatting: **bold**, *italic*, `code`, and $inline_math$
 */
function renderInlineContent(content: string) {
  // 1. Split by display math ($$...$$) and inline math ($...$)
  const mathParts = content.split(/(\$\$[\s\S]+?\$\$|\$[^$]+?\$)/);

  return mathParts.map((part, index) => {
    if (part.startsWith('$$') && part.endsWith('$$')) {
      try {
        return (
          <span
            key={`math-disp-${index}`}
            className="block my-2 text-center overflow-x-auto py-1"
            dangerouslySetInnerHTML={{
              __html: katex.renderToString(part.slice(2, -2), {
                throwOnError: false,
                displayMode: true,
              }),
            }}
          />
        );
      } catch {
        return <code key={`math-err-${index}`} className="font-mono text-xs text-error">{part}</code>;
      }
    }

    if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
      try {
        return (
          <span
            key={`math-inl-${index}`}
            className="inline-block px-0.5"
            dangerouslySetInnerHTML={{
              __html: katex.renderToString(part.slice(1, -1), {
                throwOnError: false,
                displayMode: false,
              }),
            }}
          />
        );
      } catch {
        return <span key={`math-err-${index}`}>{part}</span>;
      }
    }

    // 2. Parse inline markdown: **bold**, `inline_code`, *italic*
    const tokens = part.split(/(\*\*[^*]+?\*\*|`[^`]+?`|\*[^*]+?\*)/);

    return (
      <span key={`text-group-${index}`}>
        {tokens.map((tok, tIdx) => {
          if (tok.startsWith('**') && tok.endsWith('**')) {
            return (
              <strong key={tIdx} className="font-extrabold text-foreground">
                {tok.slice(2, -2)}
              </strong>
            );
          }
          if (tok.startsWith('`') && tok.endsWith('`')) {
            return (
              <code key={tIdx} className="font-mono text-[11px] bg-muted/80 text-primary px-1.5 py-0.5 rounded border border-border/60">
                {tok.slice(1, -1)}
              </code>
            );
          }
          if (tok.startsWith('*') && tok.endsWith('*')) {
            return <em key={tIdx} className="italic text-muted-foreground">{tok.slice(1, -1)}</em>;
          }
          return tok;
        })}
      </span>
    );
  });
}

function ImageCard({ alt, src }: { alt: string; src: string }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="my-3 rounded-2xl overflow-hidden border border-primary/30 bg-card shadow-lg transition-all">
      <div className="flex items-center justify-between px-3.5 py-2 bg-muted/60 border-b border-border text-xs font-semibold text-foreground">
        <span className="flex items-center gap-1.5 text-primary font-bold">
          <Sparkles size={14} /> AI Diagram / Visual Illustration
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setModalOpen(true)}
            className="p-1 hover:text-primary transition-colors"
            title="Expand Fullscreen"
          >
            <Maximize2 size={13} />
          </button>
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            download={`${alt.replace(/\s+/g, '_')}.jpg`}
            className="p-1 hover:text-primary transition-colors flex items-center gap-1"
            title="Open / Download Image"
          >
            <Download size={13} />
          </a>
        </div>
      </div>

      <div className="relative bg-slate-950 flex items-center justify-center min-h-[220px]">
        {!loaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground bg-card/90">
            <Sparkles size={20} className="text-primary animate-spin" />
            <span>Generating educational diagram illustration...</span>
          </div>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          className={`w-full max-h-[450px] object-contain transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      </div>

      {alt && (
        <div className="p-2.5 text-center text-xs text-muted-foreground bg-muted/30 border-t border-border font-medium">
          {alt}
        </div>
      )}

      {/* Lightbox Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setModalOpen(false)}
        >
          <div className="relative max-w-5xl w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 p-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black transition-colors z-10"
            >
              <X size={18} />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={alt} className="w-full max-h-[85vh] object-contain rounded-xl" />
            {alt && <p className="text-center text-xs text-slate-300 py-2.5 font-semibold">{alt}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export function FormattedAnswer({ text, className = '' }: FormattedAnswerProps) {
  const [copiedCodeIdx, setCopiedCodeIdx] = useState<number | null>(null);

  if (!text) return null;

  // Split content by code blocks first
  const blocks = text.split(/(```[\s\S]*?```)/);

  return (
    <div className={`space-y-3 leading-relaxed ${className}`}>
      {blocks.map((block, bIdx) => {
        // Render Code Block
        if (block.startsWith('```') && block.endsWith('```')) {
          const raw = block.slice(3, -3);
          const firstLineEnd = raw.indexOf('\n');
          const lang = firstLineEnd !== -1 ? raw.slice(0, firstLineEnd).trim() : '';
          const codeContent = firstLineEnd !== -1 ? raw.slice(firstLineEnd + 1) : raw;

          const handleCopyCode = () => {
            navigator.clipboard.writeText(codeContent);
            setCopiedCodeIdx(bIdx);
            setTimeout(() => setCopiedCodeIdx(null), 2000);
          };

          return (
            <div key={`code-block-${bIdx}`} className="my-3 rounded-xl overflow-hidden border border-border bg-slate-950 text-slate-100 shadow-md">
              <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400 font-mono">
                <span>{lang || 'code'}</span>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 hover:text-white transition-colors"
                >
                  {copiedCodeIdx === bIdx ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  {copiedCodeIdx === bIdx ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="p-3.5 text-xs font-mono overflow-x-auto leading-relaxed whitespace-pre">
                <code>{codeContent}</code>
              </pre>
            </div>
          );
        }

        // Process standard markdown lines & image markdown ![alt](url)
        const lines = block.split('\n');
        const elements: React.ReactNode[] = [];
        let currentListItems: React.ReactNode[] = [];
        let isNumberedList = false;

        const flushList = () => {
          if (currentListItems.length > 0) {
            elements.push(
              isNumberedList ? (
                <ol key={`ol-${elements.length}`} className="space-y-1.5 my-2 pl-1">
                  {currentListItems}
                </ol>
              ) : (
                <ul key={`ul-${elements.length}`} className="space-y-1.5 my-2 pl-1">
                  {currentListItems}
                </ul>
              )
            );
            currentListItems = [];
          }
        };

        lines.forEach((line, lIdx) => {
          const trimmed = line.trim();

          // Image Markdown: ![alt](url)
          const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)/);
          if (imgMatch) {
            flushList();
            elements.push(<ImageCard key={`img-${lIdx}`} alt={imgMatch[1]} src={imgMatch[2]} />);
            return;
          }

          // Heading 1 / 2 / 3
          if (trimmed.startsWith('#')) {
            flushList();
            const level = trimmed.match(/^#+/)?.[0].length ?? 1;
            const headingText = trimmed.replace(/^#+\s*/, '');
            const textSize = level === 1 ? 'text-base font-black' : level === 2 ? 'text-sm font-extrabold' : 'text-xs font-bold';

            elements.push(
              <div key={`h-${lIdx}`} className={`mt-3 mb-1.5 text-foreground ${textSize} tracking-tight`}>
                {renderInlineContent(headingText)}
              </div>
            );
            return;
          }

          // Bullet List Item (- or *)
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            if (isNumberedList) flushList();
            isNumberedList = false;
            const itemContent = trimmed.slice(2);
            currentListItems.push(
              <li key={`li-${lIdx}`} className="flex items-start gap-2 text-xs sm:text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2" />
                <span className="flex-1">{renderInlineContent(itemContent)}</span>
              </li>
            );
            return;
          }

          // Numbered List Item (1. 2. 3.)
          const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
          if (numMatch) {
            if (!isNumberedList) flushList();
            isNumberedList = true;
            const numStr = numMatch[1];
            const itemContent = numMatch[2];
            currentListItems.push(
              <li key={`nli-${lIdx}`} className="flex items-start gap-2.5 text-xs sm:text-sm">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {numStr}
                </span>
                <span className="flex-1">{renderInlineContent(itemContent)}</span>
              </li>
            );
            return;
          }

          // Regular paragraph / blank line
          flushList();

          if (trimmed.length === 0) {
            elements.push(<div key={`sp-${lIdx}`} className="h-1" />);
          } else {
            elements.push(
              <p key={`p-${lIdx}`} className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                {renderInlineContent(line)}
              </p>
            );
          }
        });

        flushList();

        return <div key={`block-${bIdx}`}>{elements}</div>;
      })}
    </div>
  );
}

export default FormattedAnswer;
