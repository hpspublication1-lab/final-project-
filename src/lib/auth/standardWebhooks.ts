import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Verifies a request signed per the Standard Webhooks spec
 * (https://www.standardwebhooks.com/), which is what Supabase Auth hooks use.
 *
 *   signed content = `${webhook-id}.${webhook-timestamp}.${raw body}`
 *   signature      = base64(HMAC-SHA256(secret bytes, signed content))
 *   header         = "webhook-signature: v1,<sig> [v1,<sig> …]"
 *
 * Supabase shows the secret as `v1,whsec_<base64>`; the key is the base64 part.
 * Implemented on node:crypto so the auth path takes no new dependency; the unit
 * test checks it against a fixture signed by the official `standardwebhooks` lib.
 */

export class WebhookVerificationError extends Error {}

const DEFAULT_TOLERANCE_SECONDS = 5 * 60;

function secretBytes(secret: string): Buffer {
  let s = secret.trim();
  if (s.startsWith('v1,')) s = s.slice(3);
  if (s.startsWith('whsec_')) s = s.slice(6);
  const key = Buffer.from(s, 'base64');
  if (key.length === 0) throw new WebhookVerificationError('Webhook secret is empty or not base64.');
  return key;
}

export function verifyStandardWebhook(
  rawBody: string,
  headers: Headers | Record<string, string | undefined>,
  secret: string,
  opts: { toleranceSeconds?: number; nowSeconds?: number } = {}
): void {
  const get = (name: string): string | undefined =>
    headers instanceof Headers ? headers.get(name) ?? undefined : headers[name] ?? headers[name.toLowerCase()];

  const id = get('webhook-id');
  const timestamp = get('webhook-timestamp');
  const signatureHeader = get('webhook-signature');
  if (!id || !timestamp || !signatureHeader) {
    throw new WebhookVerificationError('Missing webhook-id, webhook-timestamp or webhook-signature header.');
  }

  const ts = Number(timestamp);
  if (!Number.isInteger(ts)) throw new WebhookVerificationError('webhook-timestamp is not an integer.');
  const now = opts.nowSeconds ?? Math.floor(Date.now() / 1000);
  const tolerance = opts.toleranceSeconds ?? DEFAULT_TOLERANCE_SECONDS;
  if (Math.abs(now - ts) > tolerance) {
    throw new WebhookVerificationError('webhook-timestamp is outside the allowed window.');
  }

  const expected = createHmac('sha256', secretBytes(secret))
    .update(`${id}.${timestamp}.${rawBody}`)
    .digest();

  for (const part of signatureHeader.split(' ')) {
    const [version, sig] = part.split(',', 2);
    if (version !== 'v1' || !sig) continue;
    const given = Buffer.from(sig, 'base64');
    if (given.length === expected.length && timingSafeEqual(given, expected)) return;
  }
  throw new WebhookVerificationError('No matching signature.');
}
