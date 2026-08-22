'use client';

import React from 'react';
import Link from 'next/link';
import { TrendingUp, Target, Award, Sparkles, CheckCircle2, ArrowRight, FolderKanban, FileText, Smartphone, Search, Share2, Briefcase } from 'lucide-react';

interface PortalViewProps {
  displayName: string;
  isPro: boolean;
}

const marketingModules = [
  {
    id: 'meta-ads',
    title: 'Meta & Instagram Ads Masterclass',
    icon: Smartphone,
    desc: 'Pixel setup, custom audiences, high-ROAS lookalikes & scaling ad spend efficiently.',
    lessons: 18,
    badge: 'HIGH ROAS',
    color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  },
  {
    id: 'tiktok-viral',
    title: 'TikTok & Short-Form Viral Hooks',
    icon: Share2,
    desc: 'Scripting, hook formulas, 3-second retention tricks & organic viral growth funnels.',
    lessons: 14,
    badge: 'ORGANIC GROWTH',
    color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
  },
  {
    id: 'seo-ranking',
    title: 'Search Engine Optimization (SEO)',
    icon: Search,
    desc: 'Keyword discovery, technical audits, on-page optimization & Google ranking playbooks.',
    lessons: 16,
    badge: 'RANK #1 ON GOOGLE',
    color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  },
  {
    id: 'copy-funnels',
    title: 'Copywriting & Sales Funnels',
    icon: FileText,
    desc: 'Writing sales letters, landing page copy, email sequences & conversion rate boosters.',
    lessons: 12,
    badge: 'CONVERSIONS',
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  },
];

export default function DigitalMarketingPortalView({ displayName }: PortalViewProps) {
  return (
    <div className="space-y-6">
      {/* Portal Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-rose-500/15 via-card to-pink-500/10 border border-rose-500/20 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold flex items-center gap-1 shadow-xs">
              <TrendingUp size={15} /> Digital Marketing Portal
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/20">
              Build Digital Skills &amp; Freelance
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Launch Your Campaigns, {displayName} 📈
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Master Meta Ads, SEO, TikTok Viral Content, and high-paying Upwork/Fiverr client acquisition.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-card border border-rose-500/30 text-xs font-bold text-rose-600">
            <Briefcase size={16} className="text-rose-500" />
            <span>Freelance Ready</span>
          </div>
          <Link
            href="/courses?sector=digital"
            className="px-4.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-rose-600/20 transition-all"
          >
            <span>Explore Playbooks</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Core Marketing Modules */}
      <div>
        <h2 className="text-base font-extrabold text-foreground mb-4 flex items-center gap-2">
          <Sparkles size={17} className="text-rose-500" /> Practical Marketing Modules
        </h2>
        <div className="grid md:grid-cols-2 gap-5">
          {marketingModules.map((mod) => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.id}
                className="p-6 rounded-3xl bg-card border border-border hover:border-rose-500/40 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${mod.color}`}>
                      <Icon size={20} />
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-muted border border-border text-foreground">
                      {mod.badge}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-foreground">{mod.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{mod.desc}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/50 flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">{mod.lessons} Practical Lessons</span>
                  <Link
                    href="/courses?sector=digital"
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                  >
                    <span>Start Module</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Swipe Files & Resource Hub */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-rose-600 via-pink-600 to-rose-700 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-bold">
            <FolderKanban size={13} /> Swipe Files &amp; Ad Templates
          </div>
          <h3 className="text-xl sm:text-2xl font-black">Download 100+ High-Converting Ad Templates</h3>
          <p className="text-xs sm:text-sm text-rose-100 leading-relaxed">
            Copy-paste headline formulas, landing page wireframes, and Upwork proposal templates proven to convert client leads into contracts.
          </p>
        </div>

        <Link
          href="/courses?sector=digital"
          className="px-6 py-3.5 rounded-2xl bg-white text-rose-900 font-black text-xs sm:text-sm hover:bg-rose-50 transition-all shadow-lg shrink-0 flex items-center gap-2"
        >
          <span>Access Resource Hub</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
