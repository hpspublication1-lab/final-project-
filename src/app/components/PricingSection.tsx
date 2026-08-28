'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, X, Star, Zap, Gem, MessageCircle, Flame, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { SUPPORT_CONFIG } from '@/lib/config/support';
import { useProgram } from '@/contexts/ProgramContext';
import { createClient } from '@/lib/supabase/client';

const WHATSAPP_NUMBER = SUPPORT_CONFIG.whatsappNumber;

// Model C — Hybrid Pricing Structure Matrix
const COURSE_PRICING = {
  see: { name: 'Samyak SEE Board Pass', price: 2990, badge: 'NEB Board Pass', path: '/see' },
  cee: { name: 'Samyak CEE Medical Pass', price: 2299, badge: 'MEC Entrance Pass', path: '/courses?sector=cee' },
  ielts: { name: 'Samyak IELTS English Pass', price: 1490, badge: '4-Skill English Pass', path: '/english' },
  digital_marketing: { name: 'Samyak Digital Marketing Pass', price: 1990, badge: 'Career Skills Pass', path: '/digital-marketing' },
  artificial_intelligence: { name: 'Samyak AI Academy Pass', price: 1490, badge: 'AI & Python Pass', path: '/ai-tutor' },
};

export default function PricingSection() {
  const { program } = useProgram();
  const router = useRouter();

  const activeCoursePrice = COURSE_PRICING[program as keyof typeof COURSE_PRICING] || COURSE_PRICING.cee;

  const buildWhatsAppUrl = (planName: string, priceStr: string) => {
    const message = `Hi! I want to enroll in the *${planName}* (${priceStr}) on Samyak Guru. Please send me the Fonepay QR / activation details. Thank you!`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  };

  return (
    <section id="pricing" className="py-20 bg-background border-t border-border/60 relative overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-r from-amber-500/10 via-primary/10 to-purple-500/10 blur-3xl pointer-events-none" />

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 relative z-10 space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-600 text-xs font-black border border-amber-500/20">
            <Flame size={14} /> Transparent Course-Specific Pricing &amp; All-Access Path
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight">
            Single Course vs. <span className="text-amber-600">🔥 Samyak All-Access</span>
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Choose a single course pass or unlock every learning portal, 24/7 AI Teachers, and AI Vision Marker with Samyak All-Access.
          </p>
        </div>

        {/* 4-Tier Pricing Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">

          {/* Tier 1: Samyak Pass (FREE) */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">SAMYAK PASS</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground">STARTER</span>
              </div>
              <div>
                <div className="text-3xl font-black text-foreground">FREE</div>
                <p className="text-[11px] text-muted-foreground mt-0.5">Explore sample notes &amp; AI tools</p>
              </div>

              <ul className="space-y-2.5 text-xs text-muted-foreground pt-2 border-t border-border">
                <li className="flex items-center gap-2 font-medium text-foreground">
                  <CheckCircle2 size={15} className="text-success shrink-0" />
                  <span>20 Free Chapter Notes</span>
                </li>
                <li className="flex items-center gap-2 font-medium text-foreground">
                  <CheckCircle2 size={15} className="text-success shrink-0" />
                  <span>200 Practice MCQs</span>
                </li>
                <li className="flex items-center gap-2 font-medium text-foreground">
                  <CheckCircle2 size={15} className="text-success shrink-0" />
                  <span>Sample AI Examiner Evaluation</span>
                </li>
                <li className="flex items-center gap-2 opacity-50">
                  <X size={15} className="text-muted-foreground shrink-0" />
                  <span>Full Mock Exams</span>
                </li>
              </ul>
            </div>

            <Link
              href="/sign-up-login-screen"
              className="w-full py-3 rounded-2xl bg-muted/60 border border-border text-foreground font-bold text-xs hover:bg-muted text-center transition-all"
            >
              Start Free Pass
            </Link>
          </div>

          {/* Tier 2: Selected Course Pass (Course-Specific) */}
          <div className="bg-card border-2 border-primary/40 rounded-3xl p-6 shadow-md flex flex-col justify-between space-y-6 relative">
            <span className="absolute -top-3 right-6 text-[10px] font-black uppercase px-3 py-0.5 rounded-full bg-primary text-white shadow-xs">
              {activeCoursePrice.badge}
            </span>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-primary">SINGLE COURSE</span>
              </div>

              <div>
                <h3 className="text-base font-black text-foreground">{activeCoursePrice.name}</h3>
                <div className="text-3xl font-black text-foreground mt-1">
                  NPR {activeCoursePrice.price.toLocaleString()}
                  <span className="text-xs font-normal text-muted-foreground"> / one-time</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">Full course access for 1 year</p>
              </div>

              <ul className="space-y-2.5 text-xs text-muted-foreground pt-2 border-t border-border">
                <li className="flex items-center gap-2 font-medium text-foreground">
                  <CheckCircle2 size={15} className="text-success shrink-0" />
                  <span>Full Course Video Lessons</span>
                </li>
                <li className="flex items-center gap-2 font-medium text-foreground">
                  <CheckCircle2 size={15} className="text-success shrink-0" />
                  <span>All Question Banks &amp; Notes</span>
                </li>
                <li className="flex items-center gap-2 font-medium text-foreground">
                  <CheckCircle2 size={15} className="text-success shrink-0" />
                  <span>Course Mock Exams</span>
                </li>
                <li className="flex items-center gap-2 opacity-50">
                  <X size={15} className="text-muted-foreground shrink-0" />
                  <span>Other Portal Access</span>
                </li>
              </ul>
            </div>

            <a
              href={buildWhatsAppUrl(activeCoursePrice.name, `NPR ${activeCoursePrice.price.toLocaleString()}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-2xl bg-primary text-white font-black text-xs hover:bg-primary-dark text-center transition-all shadow-sm"
            >
              Enroll in {activeCoursePrice.name.split(' ')[0]} (NPR {activeCoursePrice.price.toLocaleString()})
            </a>
          </div>

          {/* Tier 3: Pro Course Pass */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">PRO COURSE</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground">INTENSIVE</span>
              </div>

              <div>
                <div className="text-3xl font-black text-foreground">
                  NPR 2,490
                  <span className="text-xs font-normal text-muted-foreground"> / year</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">Course + AI Doubt Solver</p>
              </div>

              <ul className="space-y-2.5 text-xs text-muted-foreground pt-2 border-t border-border">
                <li className="flex items-center gap-2 font-medium text-foreground">
                  <CheckCircle2 size={15} className="text-success shrink-0" />
                  <span>Everything in Single Course Pass</span>
                </li>
                <li className="flex items-center gap-2 font-medium text-foreground">
                  <CheckCircle2 size={15} className="text-success shrink-0" />
                  <span>AI Agent Doubts Solver (24/7)</span>
                </li>
                <li className="flex items-center gap-2 font-medium text-foreground">
                  <CheckCircle2 size={15} className="text-success shrink-0" />
                  <span>Weak-Topic Analysis Report</span>
                </li>
              </ul>
            </div>

            <a
              href={buildWhatsAppUrl('Pro Course Pass', 'NPR 2,490/yr')}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-2xl bg-card border border-border text-foreground font-bold text-xs hover:bg-muted text-center transition-all"
            >
              Get Pro Course (NPR 2,490)
            </a>
          </div>

          {/* Tier 4: 🔥 Samyak All-Access Pass (UPSELL HERO TIER) */}
          <div className="bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 text-white rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-6 relative overflow-hidden ring-4 ring-amber-500/30">
            <span className="absolute -top-3 right-6 text-[10px] font-black uppercase px-3 py-0.5 rounded-full bg-white text-amber-900 shadow-md flex items-center gap-1">
              <Flame size={12} /> BEST VALUE UPSELL
            </span>

            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-amber-200">🔥 SAMYAK ALL-ACCESS</span>
              </div>

              <div>
                <h3 className="text-lg font-black text-white">Unlock Every Single Portal</h3>
                <div className="text-3.5xl font-black text-white mt-1">
                  NPR 3,490
                  <span className="text-xs font-normal text-amber-200"> / year</span>
                </div>
                <p className="text-[11px] text-amber-100 mt-0.5 font-medium">Access SEE + CEE + IELTS + Marketing + AI</p>
              </div>

              <ul className="space-y-2.5 text-xs text-amber-50 pt-2 border-t border-amber-500/30">
                <li className="flex items-center gap-2 font-bold">
                  <CheckCircle2 size={15} className="text-white shrink-0" />
                  <span>ALL 5 Learning Portals Included</span>
                </li>
                <li className="flex items-center gap-2 font-bold">
                  <CheckCircle2 size={15} className="text-white shrink-0" />
                  <span>24/7 Live AI Teacher Classroom</span>
                </li>
                <li className="flex items-center gap-2 font-bold">
                  <CheckCircle2 size={15} className="text-white shrink-0" />
                  <span>AI Vision Marker (Handwritten Papers)</span>
                </li>
                <li className="flex items-center gap-2 font-bold">
                  <CheckCircle2 size={15} className="text-white shrink-0" />
                  <span>Master Weakness Engine Analytics</span>
                </li>
              </ul>
            </div>

            <a
              href={buildWhatsAppUrl('🔥 Samyak All-Access Pass', 'NPR 3,490/yr')}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 rounded-2xl bg-white text-amber-900 font-black text-xs hover:bg-amber-50 text-center transition-all shadow-lg flex items-center justify-center gap-1.5 relative z-10"
            >
              <Flame size={14} />
              <span>Unlock Samyak All-Access (NPR 3,490)</span>
            </a>
          </div>

        </div>

      </div>
    </section>
  );
}