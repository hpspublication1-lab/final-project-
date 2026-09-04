'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, X, Star, Zap, Gem, MessageCircle, Flame, Sparkles, ArrowRight, ShieldCheck, Lock, CreditCard, Clock, HelpCircle } from 'lucide-react';
import { SUPPORT_CONFIG } from '@/lib/config/support';
import { useProgram } from '@/contexts/ProgramContext';

const WHATSAPP_NUMBER = SUPPORT_CONFIG.whatsappNumber;

// Course Pricing Matrix with plan SKU mapping
const COURSE_PRICING = {
  see: { name: 'Samyak SEE Board Pass', sku: 'student-yearly', price: 2990, badge: 'NEB Board Pass', path: '/see/checkout?plan=mission_a' },
  cee: { name: 'Samyak CEE Medical Pass', sku: 'student-yearly', price: 2299, badge: 'MEC Entrance Pass', path: '/checkout?plan=student-yearly' },
  ielts: { name: 'Samyak IELTS English Pass', sku: 'crash-course', price: 1490, badge: '4-Skill English Pass', path: '/checkout?plan=crash-course' },
  digital_marketing: { name: 'Samyak Digital Marketing Pass', sku: 'crash-course', price: 1990, badge: 'Career Skills Pass', path: '/checkout?plan=crash-course' },
  artificial_intelligence: { name: 'Samyak AI Academy Pass', sku: 'crash-course', price: 1490, badge: 'AI & Python Pass', path: '/checkout?plan=crash-course' },
};

export default function PricingSection() {
  const { program } = useProgram();
  const router = useRouter();
  const [billingMode, setBillingMode] = useState<'monthly' | 'annual'>('monthly');

  const activeCoursePrice = COURSE_PRICING[program as keyof typeof COURSE_PRICING] || COURSE_PRICING.cee;

  const buildWhatsAppUrl = (planName: string, priceStr: string) => {
    const message = `Hi! I need help with payment for the *${planName}* (${priceStr}) on Samyak CEE. Please send me payment details. Thank you!`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  };

  return (
    <section id="pricing" className="py-20 bg-background border-t border-border/60 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-r from-amber-500/10 via-primary/10 to-purple-500/10 blur-3xl pointer-events-none" />

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 relative z-10 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-black border border-amber-500/20">
            <Flame size={14} /> Transparent Course-Specific Pricing &amp; All-Access Path
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight">
            Single Course vs. <span className="text-amber-600 dark:text-amber-400">🔥 Samyak All-Access</span>
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Choose a single course pass or unlock every learning portal, 24/7 AI Teachers, and AI Vision Marker with Samyak All-Access.
          </p>

          {/* ⚡ A/B TEST BILLING TOGGLE (Monthly Breakdown vs Annual Total) */}
          <div className="pt-2 flex justify-center">
            <div className="inline-flex items-center p-1.5 bg-muted/40 border border-border rounded-2xl gap-1">
              <button
                onClick={() => setBillingMode('monthly')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                  billingMode === 'monthly'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>🗓️ Billed Monthly (NPR 291/mo)</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-white text-[9px] font-black uppercase">SAVE 70%</span>
              </button>

              <button
                onClick={() => setBillingMode('annual')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  billingMode === 'annual'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>📅 Billed Annually (NPR 3,490/yr)</span>
              </button>
            </div>
          </div>
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
              href="/login"
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
                  {billingMode === 'monthly'
                    ? `NPR ${Math.round(activeCoursePrice.price / 12).toLocaleString()}`
                    : `NPR ${activeCoursePrice.price.toLocaleString()}`}
                  <span className="text-xs font-normal text-muted-foreground">
                    {billingMode === 'monthly' ? ' / month' : ' / year'}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {billingMode === 'monthly'
                    ? `(NPR ${activeCoursePrice.price.toLocaleString()} billed annually — 365 days)`
                    : 'Full course access for 1 year (365 days)'}
                </p>
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
                <li className="flex items-center gap-2 font-medium text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck size={15} className="shrink-0" />
                  <span>7-Day Money-Back Guarantee</span>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <Link
                href={activeCoursePrice.path}
                className="w-full py-3.5 rounded-2xl bg-primary hover:bg-primary-dark text-white font-black text-xs text-center transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <span>Enroll Now (NPR {activeCoursePrice.price.toLocaleString()})</span>
                <ArrowRight size={15} />
              </Link>

              <p className="text-[10px] text-muted-foreground text-center">
                💳 Fonepay Dynamic QR · ⚡ Instant Access
              </p>
            </div>
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
                  {billingMode === 'monthly' ? 'NPR 207' : 'NPR 2,490'}
                  <span className="text-xs font-normal text-muted-foreground">
                    {billingMode === 'monthly' ? ' / month' : ' / year'}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {billingMode === 'monthly'
                    ? '(NPR 2,490 billed annually — 365 days)'
                    : 'Course + AI Doubt Solver (365 days)'}
                </p>
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
                <li className="flex items-center gap-2 font-medium text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck size={15} className="shrink-0" />
                  <span>7-Day Money-Back Guarantee</span>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <Link
                href="/checkout?plan=pro-yearly"
                className="w-full py-3 rounded-2xl bg-card border border-border text-foreground font-bold text-xs hover:bg-muted text-center transition-all flex items-center justify-center gap-2"
              >
                <span>Get Pro Course (NPR 2,490)</span>
                <ArrowRight size={14} />
              </Link>
              <p className="text-[10px] text-muted-foreground text-center">
                💳 Fonepay QR · 🔒 HTTPS Encrypted
              </p>
            </div>
          </div>

          {/* Tier 4: 🔥 Samyak All-Access Pass (UPSELL HERO TIER) */}
          <div className="bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 text-white rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-6 relative overflow-hidden ring-4 ring-amber-500/30">
            {/* ⭐ MOST POPULAR BADGE */}
            <span className="absolute -top-3 right-6 text-[10px] font-black uppercase px-3 py-1 rounded-full bg-white text-amber-900 shadow-lg flex items-center gap-1">
              <Flame size={12} className="text-amber-600 fill-amber-600" />
              <span>⭐ MOST POPULAR &amp; BEST VALUE</span>
            </span>

            <div className="space-y-4 relative z-10 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-amber-200">🔥 SAMYAK ALL-ACCESS</span>
                <span className="text-[9px] font-black px-2 py-0.5 rounded bg-amber-500/40 text-amber-100 border border-amber-400/30 uppercase">
                  SAVE 70%
                </span>
              </div>

              <div>
                <h3 className="text-lg font-black text-white">Unlock Every Single Portal</h3>
                <div className="text-3.5xl font-black text-white mt-1">
                  {billingMode === 'monthly' ? 'NPR 291' : 'NPR 3,490'}
                  <span className="text-xs font-normal text-amber-200">
                    {billingMode === 'monthly' ? ' / month' : ' / year'}
                  </span>
                </div>
                <p className="text-[11px] text-amber-100 mt-0.5 font-medium">
                  {billingMode === 'monthly'
                    ? '(NPR 3,490 billed annually — Access SEE + CEE + IELTS + Marketing + AI)'
                    : 'Access SEE + CEE + IELTS + Marketing + AI'}
                </p>
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
                {/* 🛡️ 7-DAY MONEY-BACK GUARANTEE BADGE */}
                <li className="flex items-center gap-2 font-black text-amber-200 pt-1">
                  <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
                  <span>🛡️ 7-Day Money-Back Guarantee</span>
                </li>
              </ul>
            </div>

            <div className="space-y-2 relative z-10">
              <Link
                href="/checkout?plan=student-yearly"
                className="w-full py-3.5 rounded-2xl bg-white text-amber-900 font-black text-xs hover:bg-amber-50 text-center transition-all shadow-lg flex items-center justify-center gap-1.5"
              >
                <Flame size={14} />
                <span>Unlock All-Access (NPR {billingMode === 'monthly' ? '291/mo' : '3,490'})</span>
                <ArrowRight size={15} />
              </Link>
              <p className="text-[10px] text-amber-100/80 text-center font-medium">
                ⚡ Instant Automatic Access · 365 Days
              </p>
            </div>
          </div>
        </div>

        {/* 🛡️ COMPACT PAYMENT TRUST & SECURITY BAR */}
        <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border/60 pb-5">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                <ShieldCheck size={20} />
              </span>
              <div>
                <h3 className="text-sm font-bold text-foreground">Transparent &amp; Secure Payment Processing</h3>
                <p className="text-xs text-muted-foreground">Substantiated security, instant access delivery, and dedicated Nepal support.</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground">
              <span className="flex items-center gap-1 text-primary">
                <CreditCard size={14} /> Fonepay Dynamic QR
              </span>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <Lock size={14} /> HTTPS Encrypted
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
              <div className="font-bold text-foreground flex items-center gap-1.5">
                <CreditCard size={14} className="text-primary" />
                <span>Fonepay Accepted</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Scan QR with eSewa, Khalti, IME Pay, or any Mobile Banking App in Nepal.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
              <div className="font-bold text-foreground flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span>7-Day Money-Back Guarantee</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Try risk-free for 7 days. Full 100% refund if not satisfied with course content.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
              <div className="font-bold text-foreground flex items-center gap-1.5">
                <Zap size={14} className="text-amber-500" />
                <span>Instant Access</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Your course and dashboard features unlock automatically upon payment confirmation.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
              <div className="font-bold text-foreground flex items-center gap-1.5">
                <Lock size={14} className="text-indigo-500" />
                <span>256-Bit TLS Encrypted</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Full 1-Year uninterrupted course access protected by HTTPS security.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground pt-2 border-t border-border/60">
            <div className="flex items-center gap-2">
              <HelpCircle size={14} className="text-primary" />
              <span>Need help with payment? Contact Samyak Support: </span>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-foreground hover:text-primary transition-colors underline"
              >
                WhatsApp +977 {WHATSAPP_NUMBER}
              </a>
            </div>

            <div className="flex items-center gap-4 text-[11px] font-medium">
              <Link href="/terms" className="hover:text-foreground transition-colors underline">
                Terms &amp; Conditions
              </Link>
              <span>•</span>
              <Link href="/refund-policy" className="hover:text-foreground transition-colors underline">
                Refund Policy
              </Link>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}