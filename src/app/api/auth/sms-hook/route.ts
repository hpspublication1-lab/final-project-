import { NextResponse } from 'next/server';
import { verifyStandardWebhook, WebhookVerificationError } from '@/lib/auth/standardWebhooks';
import { toNepalLocal, maskNepalPhone } from '@/lib/auth/nepalPhone';
import { sendAakashSms } from '@/lib/sms/aakash';
import { buildOtpMessage } from '@/lib/sms/otpMessage';

/**
 * Supabase Auth "Send SMS" hook → Aakash SMS.
 *
 * Supabase generates, expires and verifies the code and issues the session;
 * this route only delivers the text. Supabase calls it server-to-server with a
 * Standard Webhooks signature, so it needs no cookies and no user session.
 *
 * Setup (Supabase dashboard): Authentication → Hooks → Send SMS → HTTPS,
 * URL https://samyakcee.com/api/auth/sms-hook. Put the generated secret in the
 * Vercel env var SEND_SMS_HOOK_SECRET, and the Aakash token in
 * AAKASH_SMS_AUTH_TOKEN.
 *
 * The code itself is never logged.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function hookError(httpCode: number, message: string) {
  // Supabase reads { error: { http_code, message } } from a failed hook.
  return NextResponse.json({ error: { http_code: httpCode, message } }, { status: httpCode });
}

export async function POST(req: Request) {
  const secret = process.env.SEND_SMS_HOOK_SECRET;
  const aakashToken = process.env.AAKASH_SMS_AUTH_TOKEN;
  if (!secret || !aakashToken) {
    console.error('[sms-hook] Not configured: SEND_SMS_HOOK_SECRET or AAKASH_SMS_AUTH_TOKEN is missing.');
    return hookError(500, 'Phone sign-in is not configured on the server yet.');
  }

  const rawBody = await req.text();
  try {
    verifyStandardWebhook(rawBody, req.headers, secret);
  } catch (err) {
    const why = err instanceof WebhookVerificationError ? err.message : 'verification failed';
    console.warn(`[sms-hook] Rejected unsigned or forged request: ${why}`);
    return hookError(401, 'Invalid webhook signature.');
  }

  let payload: { user?: { phone?: string }; sms?: { otp?: string } };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return hookError(400, 'Hook body is not JSON.');
  }

  const otp = String(payload.sms?.otp ?? '');
  if (!/^\d{4,10}$/.test(otp)) return hookError(400, 'Hook payload has no usable code.');

  // Aakash only reaches Nepali networks, and refusing everything else also
  // stops SMS-pumping fraud from spending credit on foreign numbers.
  const local = toNepalLocal(payload.user?.phone);
  if (!local) {
    return hookError(400, 'Only Nepali mobile numbers (starting 98, 97 or 96) are supported.');
  }

  const result = await sendAakashSms(local, buildOtpMessage(otp), aakashToken);
  if (!result.ok) {
    console.error(`[sms-hook] Send to ${maskNepalPhone(local)} failed: ${result.reason}`);
    return hookError(result.retryable ? 503 : 502, 'We could not send the code by SMS. Please try again in a minute.');
  }

  console.info(
    `[sms-hook] Sent to ${maskNepalPhone(local)} via ${result.network ?? 'unknown network'}` +
      (result.messageId ? `, Aakash id ${result.messageId}` : '')
  );
  return NextResponse.json({}, { status: 200 });
}
