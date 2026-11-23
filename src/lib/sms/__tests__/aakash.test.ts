import { describe, it, expect, vi } from 'vitest';
import { sendAakashSms, AAKASH_SEND_URL } from '../aakash';
import { buildOtpMessage } from '../otpMessage';

const json = (body: unknown, status = 200) =>
  vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));

describe('sendAakashSms', () => {
  it('posts the documented form fields and accepts a masked number under valid', async () => {
    // Reply shape copied from https://aakashsms.com/documentation/ — note the masked mobile.
    const fetchImpl = json({
      error: false,
      message: '1 messages has been queued for delivery.',
      data: {
        valid: [{ id: 2673160, mobile: '977981*******', text: 'x', credit: 1, network: 'ncell', status: 'queued' }],
        invalid: [],
      },
    });
    const r = await sendAakashSms('9812345678', 'hello', 'tok', { fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(r).toEqual({ ok: true, messageId: 2673160, network: 'ncell', credit: 1 });

    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(AAKASH_SEND_URL);
    expect(init.method).toBe('POST');
    const form = new URLSearchParams(String(init.body));
    expect(form.get('auth_token')).toBe('tok');
    expect(form.get('to')).toBe('9812345678');
    expect(form.get('text')).toBe('hello');
  });

  it('treats a number listed only under invalid as a failure, even with error:false', async () => {
    const fetchImpl = json({
      error: false,
      message: '0 messages has been queued for delivery.',
      data: { valid: [], invalid: [{ mobile: '9812345678', credit: 0, network: 'N/A', status: 'aborted' }] },
    });
    const r = await sendAakashSms('9812345678', 'x', 'tok', { fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(r).toMatchObject({ ok: false, retryable: false });
    expect(r.ok === false && r.reason).toContain('aborted');
  });

  it('surfaces Aakash errors such as an empty balance', async () => {
    const fetchImpl = json({ error: true, message: 'Not enough balance.', data: [] });
    const r = await sendAakashSms('9812345678', 'x', 'tok', { fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(r).toMatchObject({ ok: false, reason: 'Aakash SMS: Not enough balance.', retryable: false });
  });

  it('refuses non-Nepali numbers without calling Aakash', async () => {
    const fetchImpl = vi.fn();
    const r = await sendAakashSms('9198765432', 'x', 'tok', { fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(r.ok).toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('marks network failures as retryable', async () => {
    const fetchImpl = vi.fn(async () => {
      throw Object.assign(new Error('timeout'), { name: 'TimeoutError' });
    });
    const r = await sendAakashSms('9812345678', 'x', 'tok', { fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(r).toMatchObject({ ok: false, retryable: true });
  });
});

describe('buildOtpMessage', () => {
  it('is plain ASCII, one SMS long, and ends with the WebOTP line', () => {
    const msg = buildOtpMessage('482913', 'samyakcee.com');
    expect(msg).toMatch(/^[\x00-\x7F]*$/);
    expect(msg.length).toBeLessThanOrEqual(160);
    expect(msg.split('\n').pop()).toBe('@samyakcee.com #482913');
  });
});
