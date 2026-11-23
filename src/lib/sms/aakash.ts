/**
 * Aakash SMS v3 sender.
 *
 * Contract, from https://aakashsms.com/documentation/ :
 *   POST https://sms.aakashsms.com/sms/v3/send   (form-urlencoded)
 *   auth_token  token from the Aakash dashboard
 *   to          comma-separated 10-digit mobile numbers
 *   text        message body
 *
 * Errors come back as { error: true, message, data: [] }.
 * Success is { error: false, data: { valid: [...], invalid: [...] } } — and a
 * number can be rejected inside a "successful" reply, so a send only counts if
 * the number appears under `valid`.
 */

export const AAKASH_SEND_URL = 'https://sms.aakashsms.com/sms/v3/send';

export type AakashSendResult =
  | { ok: true; messageId: number | null; network: string | null; credit: number | null }
  | { ok: false; reason: string; retryable: boolean };

interface AakashEntry {
  id?: number;
  mobile?: string;
  credit?: number;
  network?: string;
  status?: string;
}

interface AakashReply {
  error?: boolean;
  message?: string;
  data?: { valid?: AakashEntry[]; invalid?: AakashEntry[] } | unknown[];
}

export async function sendAakashSms(
  toLocal10: string,
  text: string,
  authToken: string,
  opts: { fetchImpl?: typeof fetch; timeoutMs?: number } = {}
): Promise<AakashSendResult> {
  const fetchImpl = opts.fetchImpl ?? fetch;

  if (!/^9[678]\d{8}$/.test(toLocal10)) {
    return { ok: false, reason: 'Not a 10-digit Nepali mobile number.', retryable: false };
  }
  if (!authToken) {
    return { ok: false, reason: 'AAKASH_SMS_AUTH_TOKEN is not set.', retryable: false };
  }

  let res: Response;
  try {
    res = await fetchImpl(AAKASH_SEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({ auth_token: authToken, to: toLocal10, text }).toString(),
      signal: AbortSignal.timeout(opts.timeoutMs ?? 8000),
    });
  } catch (err) {
    const name = err instanceof Error ? err.name : '';
    return {
      ok: false,
      reason: name === 'TimeoutError' ? 'Aakash SMS did not answer in time.' : 'Could not reach Aakash SMS.',
      retryable: true,
    };
  }

  let reply: AakashReply;
  try {
    reply = (await res.json()) as AakashReply;
  } catch {
    return { ok: false, reason: `Aakash SMS returned HTTP ${res.status} with no JSON body.`, retryable: res.status >= 500 };
  }

  if (reply.error === true || !res.ok) {
    const message = reply.message || `HTTP ${res.status}`;
    // "Not enough balance." and token errors won't fix themselves on retry.
    return { ok: false, reason: `Aakash SMS: ${message}`, retryable: res.status >= 500 };
  }

  const data = (reply.data && !Array.isArray(reply.data) ? reply.data : {}) as {
    valid?: AakashEntry[];
    invalid?: AakashEntry[];
  };
  // One recipient per call, so "anything under valid" is the test. Don't match
  // on the number itself: Aakash's documented reply shows it masked
  // ("977981*******"), which would make every real send look like a failure.
  const accepted = (data.valid ?? [])[0];
  if (!accepted) {
    const rejected = (data.invalid ?? [])[0];
    return {
      ok: false,
      reason: `Aakash SMS rejected the number${rejected?.status ? ` (${rejected.status})` : ''}.`,
      retryable: false,
    };
  }

  return {
    ok: true,
    messageId: typeof accepted.id === 'number' ? accepted.id : null,
    network: accepted.network ?? null,
    credit: typeof accepted.credit === 'number' ? accepted.credit : null,
  };
}
