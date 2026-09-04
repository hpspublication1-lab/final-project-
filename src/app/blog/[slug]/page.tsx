import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import PublicNav from '@/components/PublicNav';
import HomepageFooter from '@/app/components/HomepageFooter';
import { BLOG_POSTS, getPostBySlug } from '@/lib/blog/posts';
import {
  Clock,
  Calendar,
  ArrowLeft,
  ArrowRight,
  Share2,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Zap,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {
      title: 'Article Not Found — Samyak Guru',
    };
  }

  const canonicalUrl = `https://samyakcee.com/blog/${post.slug}`;

  return {
    title: `${post.title} — Samyak Guru`,
    description: post.excerpt,
    keywords: post.tags,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: canonicalUrl,
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author.name],
      tags: post.tags,
      images: [
        {
          url: 'https://samyakcee.com/og-image.png',
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: ['https://samyakcee.com/og-image.png'],
    },
  };
}

export default async function SingleBlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 2);

  // Article JSON-LD Schema
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: {
      '@type': 'Person',
      name: post.author.name,
      jobTitle: post.author.role,
    },
    publisher: {
      '@type': 'EducationalOrganization',
      name: 'Samyak Guru',
      logo: {
        '@type': 'ImageObject',
        url: 'https://samyakcee.com/assets/images/app_logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://samyakcee.com/blog/${post.slug}`,
    },
    keywords: post.tags.join(', '),
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary/20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleSchema),
        }}
      />
      <PublicNav />

      <main className="flex-1 pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-10">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <ChevronRight size={12} />
          <Link href="/blog" className="hover:text-foreground">Blog</Link>
          <ChevronRight size={12} />
          <span className="text-foreground font-semibold truncate max-w-[200px] sm:max-w-xs">{post.category}</span>
        </div>

        {/* Article Header */}
        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase font-mono">
              {post.category}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
              <Calendar size={13} /> {post.publishedAt}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
              <Clock size={13} /> {post.readTime}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight leading-tight">
            {post.title}
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed font-medium">
            {post.excerpt}
          </p>

          {/* Author Card */}
          <div className="flex items-center gap-3 pt-4 border-t border-border">
            <div className="w-11 h-11 rounded-2xl bg-muted flex items-center justify-center text-xl shadow-xs">
              {post.author.avatar}
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{post.author.name}</p>
              <p className="text-xs text-muted-foreground">{post.author.role}</p>
            </div>
          </div>
        </header>

        {/* In-Article Conversion Banner (Top) */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-card via-card to-primary/5 border border-primary/20 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                {post.courseCta.badge}
              </span>
              <span className="text-xs font-bold text-foreground">{post.courseCta.title}</span>
            </div>
            <p className="text-xs text-muted-foreground">{post.courseCta.description}</p>
          </div>
          <Link
            href={post.courseCta.buttonHref}
            className="shrink-0 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Zap size={14} />
            <span>{post.courseCta.buttonText}</span>
          </Link>
        </div>

        {/* Article Body Content */}
        <article className="space-y-8 text-foreground/90 text-sm sm:text-base leading-relaxed">
          {/* Intro */}
          <div className="p-5 sm:p-6 rounded-2xl bg-muted/30 border border-border/70 text-muted-foreground leading-relaxed text-sm sm:text-base italic">
            &quot;{post.content.intro}&quot;
          </div>

          {/* Sections */}
          {post.content.sections.map((sec, idx) => (
            <section key={idx} className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-black text-foreground pt-4 border-t border-border">
                {sec.heading}
              </h2>

              <div className="space-y-3 text-muted-foreground">
                {sec.body.map((paragraph, pIdx) => (
                  <p key={pIdx} className="leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Table if any */}
              {sec.table && (
                <div className="overflow-x-auto my-4 rounded-2xl border border-border">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-muted/60 text-foreground font-bold border-b border-border">
                      <tr>
                        {sec.table.headers.map((h, hIdx) => (
                          <th key={hIdx} className="p-3.5 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {sec.table.rows.map((r, rIdx) => (
                        <tr key={rIdx} className="hover:bg-muted/20 transition-colors">
                          {r.map((c, cIdx) => (
                            <td key={cIdx} className="p-3.5 text-muted-foreground">{c}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Callout Box if any */}
              {sec.callout && (
                <div
                  className={`p-4 rounded-2xl border flex items-start gap-3 my-4 ${
                    sec.callout.type === 'warning'
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-900 dark:text-amber-200'
                      : sec.callout.type === 'tip'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-900 dark:text-emerald-200'
                      : 'bg-blue-500/10 border-blue-500/20 text-blue-900 dark:text-blue-200'
                  }`}
                >
                  <Sparkles size={18} className="shrink-0 mt-0.5 text-primary" />
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-foreground">{sec.callout.title}</p>
                    <p className="text-muted-foreground">{sec.callout.text}</p>
                  </div>
                </div>
              )}
            </section>
          ))}

          {/* Conclusion */}
          <div className="p-6 rounded-3xl bg-card border border-border space-y-2 mt-8">
            <h3 className="font-black text-base text-foreground flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-500" />
              <span>Key Takeaway &amp; Next Steps</span>
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {post.content.conclusion}
            </p>
          </div>
        </article>

        {/* Tags */}
        <div className="pt-4 border-t border-border flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground">Tags:</span>
          {post.tags.map((t) => (
            <span key={t} className="px-2.5 py-1 rounded-lg bg-muted text-[11px] font-semibold text-muted-foreground">
              #{t}
            </span>
          ))}
        </div>

        {/* Large Final CTA Box */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-primary to-primary-dark text-white space-y-4 shadow-xl text-center sm:text-left sm:flex sm:items-center sm:justify-between sm:space-y-0">
          <div className="space-y-2 max-w-md">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-mono font-bold uppercase">
              ENROLL IN COURSE
            </span>
            <h3 className="text-xl sm:text-2xl font-black">{post.courseCta.title}</h3>
            <p className="text-xs text-white/80">{post.courseCta.description}</p>
          </div>
          <Link
            href={post.courseCta.buttonHref}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-primary font-black text-xs hover:bg-white/90 shadow-lg transition-all"
          >
            <span>{post.courseCta.buttonText}</span>
            <ArrowRight size={15} />
          </Link>
        </div>

        {/* Related Articles */}
        <div className="space-y-4 pt-6">
          <h3 className="text-lg font-black text-foreground">Recommended Next Reads</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {relatedPosts.map((rel) => (
              <Link
                key={rel.slug}
                href={`/blog/${rel.slug}`}
                className="p-5 rounded-2xl bg-card border border-border hover:border-primary/40 space-y-2 group transition-all"
              >
                <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {rel.category}
                </span>
                <p className="font-bold text-xs text-foreground group-hover:text-primary transition-colors leading-snug">
                  {rel.title}
                </p>
                <p className="text-[11px] text-muted-foreground line-clamp-2">{rel.excerpt}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Back Link */}
        <div className="pt-4 text-center">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to All Guides &amp; Blog</span>
          </Link>
        </div>
      </main>

      <HomepageFooter />
    </div>
  );
}
