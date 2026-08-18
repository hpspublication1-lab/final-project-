import { createAdminClient } from '@/lib/supabase/admin';
import { generateEnrollmentEmailHtml } from './templates';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (resendApiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'Samyak CEE Mastery <noreply@samyakcee.com>',
          to: [to],
          subject: subject,
          html: html,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error('Resend API error:', data);
        throw new Error(data.message || 'Failed to send email via Resend');
      }
      return { success: true, provider: 'resend', data };
    } catch (err) {
      console.error('Resend dispatch failed, falling back to Supabase auth mailer:', err);
    }
  }

  // Fallback / Default: Use Supabase Auth Link / Mailer
  const admin = createAdminClient();
  if (admin) {
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: to,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://samyakcee.com'}/dashboard`,
      },
    });

    if (error) {
      console.error('Supabase Auth Mailer error:', error);
      return { success: false, provider: 'supabase', error: error.message };
    }

    return { success: true, provider: 'supabase-auth-link', data };
  }

  console.log(`[DEV MODE] Email to ${to}: ${subject}`);
  return { success: true, provider: 'dev-console' };
}

export async function sendEnrollmentNotification({
  email,
  studentName,
  planName = 'CEE Mastery Crash Course',
  expirationDate,
}: {
  email: string;
  studentName: string;
  planName?: string;
  expirationDate?: string;
}) {
  const html = generateEnrollmentEmailHtml({
    studentName,
    planName,
    expirationDate,
  });

  return await sendEmail({
    to: email,
    subject: `🎉 Enrolled Successfully: ${planName} — Samyak CEE Mastery`,
    html,
  });
}
