import { LeadSegment } from './types';

export interface LeadSegmentationContext {
  downloadedBiologyMcq?: boolean;
  ceeCourseViews?: number;
  pricingViews?: number;
  checkoutStarted?: boolean;
  paymentFailed?: boolean;
  purchased?: boolean;
  totalEvents?: number;
  daysSinceLastActivity?: number;
}

export function determineLeadSegment(ctx: LeadSegmentationContext): LeadSegment {
  if (ctx.purchased) {
    return 'PURCHASED';
  }
  if (ctx.paymentFailed || ctx.checkoutStarted) {
    return 'PAYMENT_ABANDONED';
  }
  if ((ctx.pricingViews && ctx.pricingViews >= 1) || (ctx.ceeCourseViews && ctx.ceeCourseViews >= 3)) {
    return 'HIGH_INTENT';
  }
  if (ctx.ceeCourseViews && ctx.ceeCourseViews >= 1) {
    return 'CEE_COURSE_INTEREST';
  }
  if (ctx.downloadedBiologyMcq) {
    return 'BIOLOGY_INTEREST';
  }
  if (ctx.daysSinceLastActivity && ctx.daysSinceLastActivity > 30) {
    return 'INACTIVE';
  }
  if (ctx.totalEvents && ctx.totalEvents > 3) {
    return 'ACTIVE_LEAD';
  }
  return 'COLD_LEAD';
}

export function getSegmentMetadata(segment: LeadSegment): { label: string; color: string; bg: string; border: string } {
  switch (segment) {
    case 'PURCHASED':
      return { label: '🎓 Enrolled Student', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
    case 'HIGH_INTENT':
      return { label: '🔥 High Intent Prospect', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30' };
    case 'PAYMENT_ABANDONED':
      return { label: '⚠️ Checkout Abandoned', color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/30' };
    case 'CEE_COURSE_INTEREST':
      return { label: '🩺 CEE Course Interest', color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30' };
    case 'BIOLOGY_INTEREST':
      return { label: '🧬 Biology MCQ Downloaded', color: 'text-teal-500', bg: 'bg-teal-500/10', border: 'border-teal-500/30' };
    case 'ACTIVE_LEAD':
      return { label: '⚡ Active Engaged Lead', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30' };
    case 'INACTIVE':
      return { label: '💤 Inactive Lead', color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' };
    case 'COLD_LEAD':
    default:
      return { label: '❄️ Cold Lead', color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' };
  }
}
