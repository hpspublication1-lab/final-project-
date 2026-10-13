'use client';

import React from 'react';
import Link from 'next/link';
import {
  StudentGroupOffer,
  FreeResourceItem,
} from '@/lib/courses/studentGroupOffers';
import {
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Sparkles,
  Download,
  AlertCircle,
  Users,
  Award,
} from 'lucide-react';

interface StudentGroupOfferCardProps {
  offer: StudentGroupOffer;
  compact?: boolean;
}

export default function StudentGroupOfferCard({ offer, compact = false }: StudentGroupOfferCardProps) {
  return (
    <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-all space-y-6">
      
      {/* ── Top Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${offer.badgeBg} ${offer.badgeText}`}>
              {offer.badge}
            </span>
            <span className="text-xs text-muted-foreground font-mono">{offer.targetExam}</span>
          </div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">{offer.groupName}</h2>
        </div>

        {/* Responsible Faculty Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {offer.responsibleFaculty.map((faculty, fIdx) => (
            <div
              key={fIdx}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-muted/80 border border-border text-[11px] font-medium text-foreground"
            >
              <Users size={12} className="text-primary shrink-0" />
              <span>{faculty.name}</span>
              <ShieldCheck size={11} className="text-emerald-500 shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* ── 1. Main Offer to Promote (Hero Banner) ────────────────────────── */}
      <div className={`p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-primary/5 via-card to-primary/10 border-2 ${offer.accentBorder} space-y-3`}>
        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
          <Sparkles size={14} />
          <span>Featured Free Offer</span>
        </div>
        <h3 className="text-lg sm:text-xl font-extrabold text-foreground leading-snug">
          “{offer.mainOfferToPromote.hook}”
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {offer.mainOfferToPromote.subtext}
        </p>

        {offer.mainOfferToPromote.scannerValidationRule && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span><strong>Policy Guardrail:</strong> {offer.mainOfferToPromote.scannerValidationRule}</span>
          </div>
        )}

        {offer.mainOfferToPromote.streamChoiceNote && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-700 dark:text-teal-400 text-xs">
            <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
            <span><strong>Stream Customization:</strong> {offer.mainOfferToPromote.streamChoiceNote}</span>
          </div>
        )}

        <div className="pt-2 flex flex-wrap items-center gap-3">
          <Link
            href={offer.mainOfferToPromote.ctaHref}
            className="btn-primary text-xs font-bold py-2.5 px-5 rounded-xl inline-flex items-center gap-1.5 shadow-sm"
          >
            <span>{offer.mainOfferToPromote.ctaText}</span>
            <ArrowRight size={14} />
          </Link>
          <span className="text-[11px] text-muted-foreground italic">
            * {offer.mainOfferToPromote.editorialGuideline}
          </span>
        </div>
      </div>

      {/* ── 2. Full Free Resources Menu ────────────────────────────────────── */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <BookOpen size={13} />
          <span>Syllabus-Aligned Free Resources Menu</span>
        </h4>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {offer.freeResourcesToProvide.map((res, rIdx) => (
            <div
              key={rIdx}
              className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 hover:bg-muted/70 transition-colors space-y-1.5"
            >
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                <span className="text-xs font-bold text-foreground">{res.title}</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">{res.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. Immediate Concrete Sample Assets ─────────────────────────────── */}
      {!compact && offer.concreteResources.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-border/60">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Download size={13} />
            <span>Ready-to-Use Reviewed Free Assets</span>
          </h4>
          <div className="grid sm:grid-cols-2 gap-3">
            {offer.concreteResources.map((item: FreeResourceItem) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-card border border-border flex flex-col justify-between space-y-2 hover:border-primary/40 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                    <span className="font-semibold text-primary">{item.reviewedSubject}</span>
                    <span>Reviewed by {item.responsibleTeacher.name}</span>
                  </div>
                  <h5 className="text-sm font-bold text-foreground leading-tight">{item.title}</h5>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                </div>

                <Link
                  href={item.actionHref}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline pt-1"
                >
                  <span>{item.actionText}</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 4. Optional Paid Progression ───────────────────────────────────── */}
      <div className="p-5 rounded-2xl bg-muted/50 border border-border/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-foreground/10 text-foreground font-mono">
              Optional Progression
            </span>
            <span className="text-xs font-bold text-foreground">{offer.optionalPaidProgression.title}</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {offer.optionalPaidProgression.summary}
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
            {offer.optionalPaidProgression.features.slice(0, 3).map((f, fIdx) => (
              <span key={fIdx} className="text-[11px] text-muted-foreground flex items-center gap-1">
                <CheckCircle2 size={11} className="text-primary" />
                <span>{f}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-3">
          {offer.optionalPaidProgression.priceNpr && (
            <div className="text-right">
              <span className="text-lg font-black text-foreground">
                NPR {offer.optionalPaidProgression.priceNpr.toLocaleString()}
              </span>
              <span className="block text-[10px] text-muted-foreground">Full Batch Access</span>
            </div>
          )}
          <Link
            href={offer.optionalPaidProgression.courseHref}
            className="btn-secondary text-xs font-bold py-2.5 px-4 rounded-xl inline-flex items-center gap-1.5 border border-border shadow-xs"
          >
            <span>Explore Course</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

    </div>
  );
}
