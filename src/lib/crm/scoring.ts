import { LeadScoreTier } from './types';

export const SCORE_RULES = {
  EMAIL_CAPTURED: 5,
  PDF_DOWNLOADED: 5,
  COURSE_PAGE_VIEWED: 5,
  PRICING_PAGE_VIEWED: 10,
  COURSE_VIDEO_WATCHED: 8,
  MULTIPLE_COURSE_VIEWS: 10,
  CHECKOUT_STARTED: 25,
  PAYMENT_INITIATED: 30,
  EMAIL_OPENED: 2,
  EMAIL_CLICKED: 5,
  RETURNED_WEBSITE: 5,
  PURCHASED: 100,
  INACTIVE_30_DAYS: -10,
  INACTIVE_60_DAYS: -20,
} as const;

export function getLeadScoreTier(score: number): LeadScoreTier {
  if (score >= 70) return 'High Intent';
  if (score >= 40) return 'Hot';
  if (score >= 20) return 'Warm';
  return 'Cold';
}

export function getLeadScoreBadge(score: number): { label: string; color: string; bg: string; border: string } {
  const tier = getLeadScoreTier(score);
  switch (tier) {
    case 'High Intent':
      return {
        label: `🔥 High Intent (${score})`,
        color: 'text-amber-500',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
      };
    case 'Hot':
      return {
        label: `⚡ Hot (${score})`,
        color: 'text-rose-500',
        bg: 'bg-rose-500/10',
        border: 'border-rose-500/30',
      };
    case 'Warm':
      return {
        label: `🌱 Warm (${score})`,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/30',
      };
    case 'Cold':
    default:
      return {
        label: `❄️ Cold (${score})`,
        color: 'text-slate-400',
        bg: 'bg-slate-500/10',
        border: 'border-slate-500/20',
      };
  }
}
