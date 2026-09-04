'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PublicNav from '@/components/PublicNav';
import HomepageFooter from '@/app/components/HomepageFooter';
import { BLOG_POSTS, BlogPost } from '@/lib/blog/posts';
import {
  BookOpen,
  Sparkles,
  ArrowRight,
  Clock,
  Calendar,
  Search,
  Tag,
  GraduationCap,
  Stethoscope,
  Languages,
  Zap,
} from 'lucide-react';

const CATEGORIES = ['All', 'CEE Medical', 'SEE Class 10', 'IELTS Mastery'];

export default function BlogHubPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPosts = BLOG_POSTS.filter((post) => {
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const featuredPost = BLOG_POSTS[0];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary/20">
      <PublicNav />

      <main className="flex-1 pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full space-y-12">
        {/* Blog Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-wider font-mono">
            <BookOpen size={16} />
            <span>SAMYAK ACADEMIC INSIGHTS &amp; STRATEGY</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight">
            The Samyak Learning Blog
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground font-medium max-w-2xl mx-auto">
            High-yield study guides, exam syllabus breakdowns, top question collections, and scoring blueprints for SEE, CEE, and IELTS.
          </p>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-card border border-border p-3 sm:p-4 rounded-2xl shadow-sm">
          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search guides, formulas, MCQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-muted/40 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* Featured Hero Article (Show when no filter or search) */}
        {selectedCategory === 'All' && !searchQuery && (
          <div className="relative p-6 sm:p-10 rounded-3xl bg-gradient-to-br from-card via-card to-primary/5 border-2 border-primary/20 shadow-md overflow-hidden">
            <div className="grid lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-8 space-y-4">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-black uppercase font-mono">
                    FEATURED GUIDE
                  </span>
                  <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                    <Clock size={13} /> {featuredPost.readTime}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-foreground hover:text-primary transition-colors">
                  <Link href={`/blog/${featuredPost.slug}`}>{featuredPost.title}</Link>
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                  {featuredPost.excerpt}
                </p>
                <div className="flex items-center gap-4 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{featuredPost.author.avatar}</span>
                    <div>
                      <p className="text-xs font-bold text-foreground">{featuredPost.author.name}</p>
                      <p className="text-[10px] text-muted-foreground">{featuredPost.author.role}</p>
                    </div>
                  </div>
                  <Link
                    href={`/blog/${featuredPost.slug}`}
                    className="ml-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all shadow-sm"
                  >
                    <span>Read Guide</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>

              {/* Quick Course CTA box on Hero */}
              <div className="lg:col-span-4 p-5 rounded-2xl bg-muted/40 border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    {featuredPost.courseCta.badge}
                  </span>
                  <span className="text-xs font-black text-foreground">{featuredPost.courseCta.price}</span>
                </div>
                <p className="text-xs font-bold text-foreground">{featuredPost.courseCta.title}</p>
                <Link
                  href={featuredPost.courseCta.buttonHref}
                  className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                >
                  <Zap size={14} />
                  <span>{featuredPost.courseCta.buttonText}</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Article Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <article
              key={post.slug}
              className="bg-card border border-border hover:border-primary/40 rounded-3xl p-6 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="space-y-3">
                {/* Meta */}
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2.5 py-0.5 rounded-full bg-muted font-bold text-primary text-[10px] uppercase font-mono">
                    {post.category}
                  </span>
                  <span className="text-muted-foreground text-[11px] flex items-center gap-1">
                    <Clock size={12} /> {post.readTime}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-base font-black text-foreground group-hover:text-primary transition-colors leading-snug">
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </h3>

                {/* Excerpt */}
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                  {post.excerpt}
                </p>
              </div>

              <div className="space-y-4 pt-2 border-t border-border/60">
                {/* Author */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span>{post.author.avatar}</span>
                    <span className="font-bold text-foreground text-[11px]">{post.author.name}</span>
                  </div>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="text-primary font-bold text-xs flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                  >
                    Read <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-16 bg-card border border-border rounded-3xl space-y-3">
            <p className="text-lg font-bold text-foreground">No articles found matching &quot;{searchQuery}&quot;</p>
            <p className="text-xs text-muted-foreground">Try searching with a different term or clear the filter.</p>
            <button
              onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
              className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Global Bottom Banner for Course Portals */}
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-primary to-primary-dark text-white text-center space-y-4 shadow-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-black uppercase font-mono">
            <Sparkles size={14} />
            <span>START PREPARING TODAY</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
            Ready to Accelerate Your SEE, CEE &amp; IELTS Scores?
          </h2>
          <p className="text-sm sm:text-base text-white/80 max-w-xl mx-auto">
            Join over 15,000+ students mastering topics with 24/7 AI Tutors, video lectures, and live mock exams.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/see"
              className="px-5 py-2.5 rounded-xl bg-white text-primary font-black text-xs hover:bg-white/90 shadow-md transition-all"
            >
              SEE Class 10 Portal
            </Link>
            <Link
              href="/courses?sector=cee"
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all"
            >
              CEE Medical Batches
            </Link>
            <Link
              href="/english"
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all"
            >
              IELTS Speaking Simulator
            </Link>
          </div>
        </div>
      </main>

      <HomepageFooter />
    </div>
  );
}
