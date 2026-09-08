'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Flame,
  Clock,
  Sparkles,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  Bookmark,
  Share2,
  HelpCircle,
  Filter,
  ArrowRight,
  ShieldCheck,
  Zap,
  Target
} from 'lucide-react';
import { SEE_QUESTION_FEED_ITEMS, SeeQuestionFeedItem } from '@/lib/data/seeQuestionFeedData';

export default function SeeQuestionFeedTab() {
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [expandedItemIds, setExpandedItemIds] = useState<Set<string>>(new Set());
  const [upvotedIds, setUpvotedIds] = useState<Set<string>>(new Set());
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleUpvote = (id: string) => {
    setUpvotedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleBookmark = (id: string) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredFeed = SEE_QUESTION_FEED_ITEMS.filter((item) => {
    if (selectedSubject !== 'all' && item.subject !== selectedSubject) return false;
    return true;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Feed Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-500/10 via-card to-card border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-black">
            <Flame size={14} className="animate-pulse" /> DAILY SEE QUESTION STREAM (दैनिक प्रश्न फिड)
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-foreground">
            Fresh SEE Board Practice Questions Feed
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Updated daily by senior NEB examiners and subject matter experts. Practice newly formulated 1, 2, 3 &amp; 4 mark model questions before they appear in your board exams.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
          <Link
            href="/practice/subjective"
            className="px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            <Sparkles size={16} />
            <span>AI Answer Sheet Marker</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4 overflow-x-auto pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          {[
            { id: 'all', label: 'All Subjects' },
            { id: 'science', label: '🔬 Science' },
            { id: 'math', label: '📐 Comp Math' },
            { id: 'opt_math', label: '📊 Opt Math' },
            { id: 'english', label: '📚 English' },
            { id: 'nepali', label: '🇳🇵 Nepali' },
            { id: 'social', label: '🌍 Social' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedSubject(tab.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedSubject === tab.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border border-border'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span className="text-xs text-muted-foreground font-mono font-bold whitespace-nowrap hidden sm:block">
          {filteredFeed.length} Questions in Feed
        </span>
      </div>

      {/* Feed Stream Cards */}
      <div className="space-y-6">
        {filteredFeed.map((item) => {
          const isExpanded = expandedItemIds.has(item.id);
          const isUpvoted = upvotedIds.has(item.id);
          const isBookmarked = bookmarkedIds.has(item.id);

          return (
            <div
              key={item.id}
              className="p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-sm hover:border-border/80 transition-all space-y-4"
            >
              {/* Card Meta & Author */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-sm border border-primary/20">
                    {item.author.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-black text-foreground flex items-center gap-1.5">
                      <span>{item.author.name}</span>
                      <ShieldCheck size={14} className="text-emerald-500" />
                    </div>
                    <div className="text-[11px] text-muted-foreground">{item.author.role}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    {item.badge}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-primary/10 text-primary">
                    {item.marks} MARK{item.marks > 1 ? 'S' : ''} ({item.group})
                  </span>
                  <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1 ml-1">
                    <Clock size={12} /> {item.postedAt}
                  </span>
                </div>
              </div>

              {/* Subject & Chapter Tag */}
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <span className="font-bold text-foreground">{item.subjectName}</span>
                <span>›</span>
                <span className="text-primary">{item.chapter}</span>
              </div>

              {/* Question Text */}
              <div className="space-y-2">
                <p className="text-sm sm:text-base font-bold text-foreground leading-relaxed">
                  {item.question}
                </p>
                {item.questionNepali && (
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground leading-relaxed italic bg-muted/30 p-3 rounded-2xl border border-border/40">
                    {item.questionNepali}
                  </p>
                )}
              </div>

              {/* Action Bar (Upvote, Bookmark, Reveal Solution) */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleUpvote(item.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                      isUpvoted
                        ? 'bg-amber-500/10 border-amber-500 text-amber-600'
                        : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <ThumbsUp size={13} className={isUpvoted ? 'fill-current' : ''} />
                    <span>{item.upvotesCount + (isUpvoted ? 1 : 0)} Helpful</span>
                  </button>

                  <button
                    onClick={() => toggleBookmark(item.id)}
                    className={`p-2 rounded-xl border transition-all ${
                      isBookmarked
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground'
                    }`}
                    title="Save to revision folder"
                  >
                    <Bookmark size={14} className={isBookmarked ? 'fill-current' : ''} />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href="/practice/subjective"
                    className="px-3.5 py-2 rounded-xl bg-card border border-primary/30 hover:bg-primary/5 text-primary text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <Zap size={13} />
                    <span>Test on AI Marker</span>
                  </Link>

                  <button
                    onClick={() => toggleExpand(item.id)}
                    className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-black flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <span>{isExpanded ? 'Hide Solution' : 'Reveal Verified Solution'}</span>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
              </div>

              {/* Expandable Model Solution & Marking Scheme */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-border/80 space-y-4 bg-muted/20 p-5 rounded-2xl border">
                  <div>
                    <h5 className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider flex items-center gap-1.5 mb-2">
                      <CheckCircle2 size={14} /> Official NEB Marking Model Solution
                    </h5>
                    <pre className="text-xs sm:text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed bg-card p-4 rounded-xl border border-border">
                      {item.solution}
                    </pre>
                  </div>

                  {/* Marking Breakdown Rubric */}
                  <div className="space-y-2">
                    <h6 className="text-[11px] font-black uppercase text-muted-foreground tracking-wider">
                      Step-by-Step Marking Allocation (CDC Standard):
                    </h6>
                    <div className="space-y-1.5">
                      {item.markingBreakdown.map((mb, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-xs bg-card px-3 py-1.5 rounded-lg border border-border/60"
                        >
                          <span className="text-muted-foreground">{mb.step}</span>
                          <span className="font-mono font-black text-primary">+{mb.marks} Mark</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Common Student Mistake Alert */}
                  {item.commonMistakes && (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-foreground space-y-1">
                      <span className="font-black text-amber-700 dark:text-amber-400 flex items-center gap-1">
                        ⚠️ Examiner Warning / Common Mistake:
                      </span>
                      <p className="text-muted-foreground">{item.commonMistakes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
