import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHmac } from 'node:crypto';
import { POST } from '../route';

const SECRET_B64 = Buffer.from('route-test-secret').toString('base64');

function signedRequest(body: object, opts: { secretB64?: string; tsOffset?: number } = {}) {
  const raw = JSON.stringify(body);
  const id = 'msg_route_test';
  const ts = String(Math.floor(Date.now() / 1000) + (opts.tsOffset ?? 0));
  const sig = createHmac('sha256', Buffer.from(opts.secretB64 ?? SECRET_B64, 'base64'))
    .update(`${id}.${ts}.${raw}`)
    .digest('base64');
  return new Request('https://samyakcee.com/api/auth/sms-hook', {
    method: 'POST',
    headers: { 'webhook-id': id, 'webhook-timestamp': ts, 'webhook-signature': `v1,${sig}` },
    body: raw,
  });
}

const aakashOk = () =>
  new Response(
    JSON.stringify({ error: false, data: { valid: [{ id: 1, mobile: '977981*******', network: 'ncell', credit: 1 }], invalid: [] } }),
    { status: 200 }
  );

describe('POST /api/auth/sms-hook', () => {
  const fetchSpy = vi.fn();

  beforeEach(() => {
    process.env.SEND_SMS_HOOK_SECRET = `v1,whsec_${SECRET_B64}`;
    process.env.AAKASH_SMS_AUTH_TOKEN = 'aakash-test-token';
    fetchSpy.mockReset();
    vi.stubGlobal('fetch', fetchSpy);
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('sends the code to the 10-digit number and returns {}', async () => {
    fetchSpy.mockResolvedValue(aakashOk());
    const res = await POST(signedRequest({ user: { phone: '9779812345678' }, sms: { otp: '482913' } }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({});

    const form = new URLSearchParams(String((fetchSpy.mock.calls[0][1] as RequestInit).body));
    expect(form.get('to')).toBe('9812345678');
    expect(form.get('text')).toContain('482913');
    expect(form.get('auth_token')).toBe('aakash-test-token');
  });

  it('never writes the code to the logs', async () => {
    fetchSpy.mockResolvedValue(aakashOk());
    await POST(signedRequest({ user: { phone: '+9779812345678' }, sms: { otp: '482913' } }));
    const logged = [console.info, console.warn, console.error]
      .flatMap((fn) => (fn as unknown as ReturnType<typeof vi.fn>).mock.calls.flat())
      .join(' ');
    expect(logged).not.toContain('482913');
    expect(logged).not.toContain('9812345678');
  });

  it('rejects a request not signed with the hook secret, without sending anything', async () => {
    const res = await POST(
      signedRequest({ user: { phone: '9779812345678' }, sms: { otp: '111111' } }, {
        secretB64: Buffer.from('attacker').toString('base64'),
      })
    );
    expect(res.status).toBe(401);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('refuses foreign numbers, without sending anything', async () => {
    const res = await POST(signedRequest({ user: { phone: '+447700900123' }, sms: { otp: '111111' } }));
    expect(res.status).toBe(400);
    expect((await res.json()).error.message).toMatch(/Nepali/);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('reports an Aakash failure to Supabase as an error', async () => {
    fetchSpy.mockResolvedValue(new Response(JSON.stringify({ error: true, message: 'Not enough balance.', data: [] })));
    const res = await POST(signedRequest({ user: { phone: '9779812345678' }, sms: { otp: '111111' } }));
    expect(res.status).toBe(502);
    expect((await res.json()).error.http_code).toBe(502);
  });

  it('fails closed when the server is not configured', async () => {
    delete process.env.AAKASH_SMS_AUTH_TOKEN;
    const res = await POST(signedRequest({ user: { phone: '9779812345678' }, sms: { otp: '111111' } }));
    expect(res.status).toBe(500);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
