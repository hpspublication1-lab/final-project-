import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/service';
import { EMAIL_TEMPLATES, EmailTemplateContext } from './templates';
import { LeadRecord } from './types';

const SECRET_SALT = process.env.CRM_EMAIL_SECRET || 'samyak-cee-lead-magnet-secret-key-2026';

/**
 * Generate a tamper-proof unsubscribe token for a lead
 */
export function generateUnsubscribeToken(email: string): string {
  return crypto.createHmac('sha256', SECRET_SALT).update(email.toLowerCase().trim()).digest('hex');
}

/**
 * Verify an unsubscribe token
 */
export function verifyUnsubscribeToken(email: string, token: string): boolean {
  const expected = generateUnsubscribeToken(email);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
}

/**
 * Construct full unsubscribe link
 */
export function getUnsubscribeUrl(email: string): string {
  const token = generateUnsubscribeToken(email);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://samyakcee.com';
  return `${siteUrl.replace(/\/+$/, '')}/api/email/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`;
}

/**
 * Schedules the 5-email welcome sequence for a new lead
 */
export async function scheduleWelcomeSequence(lead: LeadRecord): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;

  const now = new Date();

  // Timing offsets for 5-email sequence
  const sequencePlan = [
    { templateId: 'seq_email_1_immediate', offsetHours: 0 },
    { templateId: 'seq_email_2_day1', offsetHours: 24 },
    { templateId: 'seq_email_3_day2', offsetHours: 48 },
    { templateId: 'seq_email_4_day4', offsetHours: 96 },
    { templateId: 'seq_email_5_day6', offsetHours: 144 },
  ];

  for (const item of sequencePlan) {
    const scheduledDate = new Date(now.getTime() + item.offsetHours * 60 * 60 * 1000);
    const template = EMAIL_TEMPLATES[item.templateId];
    if (!template) continue;

    if (item.offsetHours === 0) {
      // Send immediately
      await dispatchEmailNow(lead, item.templateId);
    } else {
      // Queue in database
      await admin.from('email_queue').insert({
        lead_id: lead.id,
        email: lead.email,
        template_id: item.templateId,
        subject: template.subject,
        scheduled_at: scheduledDate.toISOString(),
        status: 'pending',
      });
    }
  }
}

/**
 * Triggers a smart behavioral follow-up email
 */
export async function triggerBehavioralEmail(
  lead: LeadRecord,
  templateId: string,
  extraCtx?: Record<string, any>
): Promise<boolean> {
  // If user already purchased or unsubscribed, NEVER send promotional / behavioral emails (except onboarding)
  if (lead.unsubscribed_at) return false;
  if (lead.status === 'customer' && templateId !== 'behavior_student_onboarding') return false;

  const template = EMAIL_TEMPLATES[templateId];
  if (!template) return false;

  // Global frequency check: has an email been sent to this lead in the past 18 hours?
  const admin = createAdminClient();
  if (admin && templateId !== 'behavior_student_onboarding') {
    const eighteenHoursAgo = new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString();
    const { data: recentLogs } = await admin
      .from('email_logs')
      .select('id')
      .eq('lead_id', lead.id)
      .gte('sent_at', eighteenHoursAgo)
      .limit(1);

    if (recentLogs && recentLogs.length > 0) {
      // Cooldown active, postpone by queuing
      await admin.from('email_queue').insert({
        lead_id: lead.id,
        email: lead.email,
        template_id: templateId,
        subject: template.subject,
        scheduled_at: new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
      });
      return false;
    }
  }

  return await dispatchEmailNow(lead, templateId, extraCtx);
}

/**
 * Cancels all pending promotional emails when a student enrolls
 */
export async function cancelPromotionalEmailsForBuyer(leadId: string): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;

  await admin
    .from('email_queue')
    .update({ status: 'cancelled', failure_reason: 'User converted to enrolled student' })
    .eq('lead_id', leadId)
    .eq('status', 'pending');
}

/**
 * Helper to render & dispatch an email immediately
 */
export async function dispatchEmailNow(
  lead: LeadRecord,
  templateId: string,
  extraCtx?: Record<string, any>
): Promise<boolean> {
  const template = EMAIL_TEMPLATES[templateId];
  if (!template) return false;

  const unsubscribeUrl = getUnsubscribeUrl(lead.email);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://samyakcee.com';

  const context: EmailTemplateContext = {
    firstName: lead.first_name || 'Future Doctor',
    email: lead.email,
    unsubscribeUrl,
    downloadUrl: `${siteUrl.replace(/\/+$/, '')}/api/lead-magnet/download?email=${encodeURIComponent(lead.email)}`,
    courseUrl: `${siteUrl.replace(/\/+$/, '')}/courses?sector=cee_medical`,
    checkoutUrl: `${siteUrl.replace(/\/+$/, '')}/checkout`,
    planName: extraCtx?.planName || 'CEE Mastery 2026',
  };

  const html = template.render(context);

  const result = await sendEmail({
    to: lead.email,
    subject: template.subject,
    html,
  });

  const admin = createAdminClient();
  if (admin && result.success) {
    await admin.from('email_logs').insert({
      lead_id: lead.id,
      email: lead.email,
      template_id: templateId,
      subject: template.subject,
      status: 'delivered',
      sent_at: new Date().toISOString(),
    });
  }

  return !!result.success;
}
