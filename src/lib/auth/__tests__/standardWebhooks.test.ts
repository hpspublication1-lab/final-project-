import { describe, it, expect } from 'vitest';
import { verifyStandardWebhook, WebhookVerificationError } from '../standardWebhooks';

// Signed by the official `standardwebhooks@1.0.0` library (Webhook#sign), so
// this proves the node:crypto implementation agrees with the reference one.
const FIXTURE = {
  secret: 'v1,whsec_c2FteWFrLXRlc3Qtc2VjcmV0LTAxMjM0NTY3ODlhYmNkZWY=',
  id: 'msg_2fixture',
  ts: 1795430000,
  body: '{"user":{"phone":"9779812345678"},"sms":{"otp":"482913"}}',
  sig: 'v1,vSetWiPObhGUYY9lzwaHnCQnMOfoWOnb6nZofmu4LrU=',
};

const headers = (over: Record<string, string> = {}) => ({
  'webhook-id': FIXTURE.id,
  'webhook-timestamp': String(FIXTURE.ts),
  'webhook-signature': FIXTURE.sig,
  ...over,
});

describe('verifyStandardWebhook', () => {
  it('accepts a request signed by the reference library', () => {
    expect(() =>
      verifyStandardWebhook(FIXTURE.body, headers(), FIXTURE.secret, { nowSeconds: FIXTURE.ts })
    ).not.toThrow();
  });

  it('accepts the secret with or without the v1,whsec_ prefix', () => {
    const bare = FIXTURE.secret.replace('v1,whsec_', '');
    expect(() => verifyStandardWebhook(FIXTURE.body, headers(), bare, { nowSeconds: FIXTURE.ts })).not.toThrow();
  });

  it('accepts a Headers object', () => {
    expect(() =>
      verifyStandardWebhook(FIXTURE.body, new Headers(headers()), FIXTURE.secret, { nowSeconds: FIXTURE.ts })
    ).not.toThrow();
  });

  it('finds the valid signature among several (secret rotation)', () => {
    const h = headers({ 'webhook-signature': `v1,AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA= ${FIXTURE.sig}` });
    expect(() => verifyStandardWebhook(FIXTURE.body, h, FIXTURE.secret, { nowSeconds: FIXTURE.ts })).not.toThrow();
  });

  it('rejects a body changed after signing — e.g. a swapped phone number', () => {
    const forged = FIXTURE.body.replace('9779812345678', '9779800000000');
    expect(() => verifyStandardWebhook(forged, headers(), FIXTURE.secret, { nowSeconds: FIXTURE.ts })).toThrow(
      WebhookVerificationError
    );
  });

  it('rejects the wrong secret', () => {
    const other = 'v1,whsec_' + Buffer.from('some-other-secret').toString('base64');
    expect(() => verifyStandardWebhook(FIXTURE.body, headers(), other, { nowSeconds: FIXTURE.ts })).toThrow(
      WebhookVerificationError
    );
  });

  it('rejects a replay outside the five-minute window', () => {
    expect(() =>
      verifyStandardWebhook(FIXTURE.body, headers(), FIXTURE.secret, { nowSeconds: FIXTURE.ts + 301 })
    ).toThrow(/window/);
  });

  it('rejects missing signature headers', () => {
    expect(() =>
      verifyStandardWebhook(FIXTURE.body, { 'webhook-id': FIXTURE.id }, FIXTURE.secret, { nowSeconds: FIXTURE.ts })
    ).toThrow(/Missing/);
  });
});
