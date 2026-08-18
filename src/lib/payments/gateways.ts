import 'server-only';
import crypto from 'crypto';

/**
 * eSewa EPAY v2 + Khalti ePayment v2 helpers. Server-only (secret keys).
 * All values env-driven; call sites must handle isConfigured() = false.
 */

// ── Plans a user can buy. Server-side price table — NEVER trust a client amount.
//    Keyed by SKU. `plan` is the subscription_plan enum the purchase grants;
//    `days` is how long it stays active. Prices mirror the pricing page.
type PlanSku = { npr: number; days: number; plan: 'student' | 'pro'; label: string };

export const PLAN_PRICES: Record<string, PlanSku> = {
  'student-monthly': { npr: 799, days: 30, plan: 'student', label: 'Student Plan · Monthly' },
  'student-yearly': { npr: 7190, days: 365, plan: 'student', label: 'Student Plan · Yearly' },
  'pro-monthly': { npr: 1299, days: 30, plan: 'pro', label: 'Pro Plan · Monthly' },
  'pro-yearly': { npr: 11690, days: 365, plan: 'pro', label: 'Pro Plan · Yearly' },
  'crash-course': { npr: 2299, days: 45, plan: 'pro', label: '45-Day CEE Crash Course' },
  'cee-mbbs-mastery-2026': { npr: 7990, days: 180, plan: 'pro', label: 'CEE Medical Entrance Super Target Batch 2026' },
  'cee-physics-chemistry-booster': { npr: 3990, days: 90, plan: 'pro', label: 'CEE Physics & Chemistry High-Yield Formula Batch' },
  'cee-45-day-crash-course': { npr: 2299, days: 45, plan: 'pro', label: 'CEE 45-Day Ultimate Crash Course 2026' },
  'see-class-10-board-topper-batch': { npr: 4990, days: 365, plan: 'pro', label: 'SEE Class 10 Board Topper Batch 2082/2083' },
  'see-opt-math-science-mastery': { npr: 2990, days: 120, plan: 'pro', label: 'SEE Optional Math & Science Score Booster' },
  'english-spoken-fluency-pro': { npr: 1990, days: 60, plan: 'pro', label: 'Spoken English & Professional Confidence Masterclass' },
  'english-ielts-target-8-mastery': { npr: 3490, days: 60, plan: 'pro', label: 'IELTS Academic & General Target Band 8.0+' },
  'english-pte-academic-express': { npr: 2990, days: 30, plan: 'pro', label: 'PTE Academic 79+ Express Preparation' },
  'digital-ai-prompt-engineering': { npr: 1490, days: 30, plan: 'pro', label: 'AI Tools, ChatGPT & Prompt Engineering for Beginners' },
  'digital-python-programming-zero-to-hero': { npr: 2490, days: 60, plan: 'pro', label: 'Python Programming Zero to Hero' },
  'digital-marketing-canva-freelancing': { npr: 1990, days: 45, plan: 'pro', label: 'Digital Marketing, Canva Design & Freelancing 101' },
  pro: { npr: 2299, days: 45, plan: 'pro', label: '45-Day CEE Crash Course' },
};


// ── eSewa ────────────────────────────────────────────────────────────────────

export function esewaConfigured(): boolean {
  return !!(process.env.ESEWA_PRODUCT_CODE && process.env.ESEWA_SECRET_KEY);
}

function esewaBase(): { form: string; status: string } {
  const prod = process.env.ESEWA_ENV === 'production';
  return prod
    ? { form: 'https://epay.esewa.com.np/api/epay/main/v2/form', status: 'https://epay.esewa.com.np/api/epay/transaction/status/' }
    : { form: 'https://rc-epay.esewa.com.np/api/epay/main/v2/form', status: 'https://rc.esewa.com.np/api/epay/transaction/status/' };
}

/**
 * Build the signed field set for eSewa's EPAY v2 hosted form.
 * signature = base64( HMAC-SHA256(secret, "total_amount=X,transaction_uuid=Y,product_code=Z") )
 */
export function buildEsewaForm(totalAmountNpr: number, transactionUuid: string, successUrl: string, failureUrl: string) {
  const productCode = process.env.ESEWA_PRODUCT_CODE!;
  const secret = process.env.ESEWA_SECRET_KEY!;
  const total = totalAmountNpr.toString();

  const message = `total_amount=${total},transaction_uuid=${transactionUuid},product_code=${productCode}`;
  const signature = crypto.createHmac('sha256', secret).update(message).digest('base64');

  return {
    actionUrl: esewaBase().form,
    fields: {
      amount: total,
      tax_amount: '0',
      total_amount: total,
      transaction_uuid: transactionUuid,
      product_code: productCode,
      product_service_charge: '0',
      product_delivery_charge: '0',
      success_url: successUrl,
      failure_url: failureUrl,
      signed_field_names: 'total_amount,transaction_uuid,product_code',
      signature,
    },
  };
}

/** Server-to-server status check — the source of truth for eSewa payment state. */
export async function verifyEsewaPayment(transactionUuid: string, totalAmountNpr: number): Promise<{ complete: boolean; refId: string | null; raw: any }> {
  const productCode = process.env.ESEWA_PRODUCT_CODE!;
  const url = `${esewaBase().status}?product_code=${encodeURIComponent(productCode)}&total_amount=${totalAmountNpr}&transaction_uuid=${encodeURIComponent(transactionUuid)}`;
  const res = await fetch(url, { cache: 'no-store' });
  const raw = await res.json().catch(() => null);
  const complete = raw?.status === 'COMPLETE';
  return { complete, refId: raw?.ref_id ?? raw?.refId ?? null, raw };
}

// ── Khalti ───────────────────────────────────────────────────────────────────

export function khaltiConfigured(): boolean {
  return !!process.env.KHALTI_SECRET_KEY;
}

function khaltiBase(): string {
  return process.env.KHALTI_ENV === 'production' ? 'https://a.khalti.com' : 'https://dev.khalti.com';
}

/** Initiate a Khalti ePayment; returns the redirect payment_url + pidx. */
export async function initiateKhaltiPayment(opts: {
  amountNpr: number;
  purchaseOrderId: string;
  purchaseOrderName: string;
  returnUrl: string;
  websiteUrl: string;
  customer?: { name?: string; email?: string; phone?: string };
}): Promise<{ pidx: string; paymentUrl: string } | { error: string }> {
  const res = await fetch(`${khaltiBase()}/api/v2/epayment/initiate/`, {
    method: 'POST',
    headers: {
      Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      return_url: opts.returnUrl,
      website_url: opts.websiteUrl,
      amount: Math.round(opts.amountNpr * 100), // Khalti amounts are in paisa
      purchase_order_id: opts.purchaseOrderId,
      purchase_order_name: opts.purchaseOrderName,
      customer_info: {
        name: opts.customer?.name ?? 'Samyak Student',
        email: opts.customer?.email ?? '',
        phone: opts.customer?.phone ?? '',
      },
    }),
    cache: 'no-store',
  });
  const raw = await res.json().catch(() => null);
  if (!res.ok || !raw?.pidx || !raw?.payment_url) {
    return { error: raw?.detail ?? raw?.error_key ?? `Khalti initiate failed (${res.status})` };
  }
  return { pidx: raw.pidx, paymentUrl: raw.payment_url };
}

/** Server-to-server lookup — the source of truth for Khalti payment state. */
export async function verifyKhaltiPayment(pidx: string): Promise<{ complete: boolean; raw: any }> {
  const res = await fetch(`${khaltiBase()}/api/v2/epayment/lookup/`, {
    method: 'POST',
    headers: {
      Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ pidx }),
    cache: 'no-store',
  });
  const raw = await res.json().catch(() => null);
  return { complete: raw?.status === 'Completed', raw };
}

// ── Fonepay (Merchant Dynamic QR, third-party) ─────────────────────────────────

export function fonepayConfigured(): boolean {
  return !!(
    process.env.FONEPAY_MERCHANT_CODE &&
    process.env.FONEPAY_USERNAME &&
    process.env.FONEPAY_PASSWORD &&
    process.env.FONEPAY_SECRET_KEY
  );
}

export interface FonepayConfig {

  merchantCode: string;
  username: string;
  password: string;
  secretKey: string;
  env: string;
}

/** DataValidation = HMAC-SHA512(secret, message) → lowercase hex. */
function fonepayHmac(message: string, secretKey: string): string {
  return crypto
    .createHmac('sha512', secretKey)
    .update(message)
    .digest('hex');
}

/**
 * Generate a Fonepay dynamic QR (thirdPartyDynamicQrDownload).
 * dataValidation message order (verbatim from Fonepay spec):
 *   amount,prn,merchantCode,remarks1,remarks2
 * `amount` MUST be the exact same string in the signature and the payload.
 */
function crc16(str: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    crc ^= c << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function buildFonepayEmvcoQr(merchantCode: string, username: string, prn: string, amountNpr: number): string {
  const amtStr = amountNpr.toFixed(2);
  const amtLen = String(amtStr.length).padStart(2, '0');

  const tag00 = '0014np.com.fonepay';
  const tag01 = '010201';
  const tag02 = `02${String(merchantCode.length).padStart(2, '0')}${merchantCode}`;
  const tag03 = `03${String(username.length).padStart(2, '0')}${username}`;
  const tag04 = `04${String(prn.length).padStart(2, '0')}${prn}`;

  const merchantSub = tag00 + tag01 + tag02 + tag03 + tag04;
  const merchantTag = `26${String(merchantSub.length).padStart(2, '0')}${merchantSub}`;

  const addSub1 = '0509SamyakCEE';
  const addSub2 = '0707Prebook';
  const addSub = addSub1 + addSub2;
  const tag62 = `62${String(addSub.length).padStart(2, '0')}${addSub}`;

  const tag58 = '5802NP';
  const tag59 = '5909SamyakCEE';
  const tag60 = '6009KATHMANDU';

  const payload = `000201010212${merchantTag}52045999530352454${amtLen}${amtStr}${tag58}${tag59}${tag60}${tag62}6304`;
  return payload + crc16(payload);
}

export async function generateFonepayQr(opts: {
  amountNpr: number;
  prn: string;
  remarks1: string;
  remarks2: string;
  config: FonepayConfig;
}): Promise<
  | { ok: true; qrMessage: string; wsUrl: string | null; raw: any }
  | { ok: false; error: string; raw: any }
> {
  const { merchantCode, username, password, secretKey, env } = opts.config;
  const amount = opts.amountNpr.toString();
  const dataValidation = fonepayHmac(
    `${amount},${opts.prn},${merchantCode},${opts.remarks1},${opts.remarks2}`,
    secretKey
  );

  const endpoints = env === 'production'
    ? ['https://merchantapi.fonepay.com', 'https://uat-new-merchant-api.fonepay.com']
    : ['https://uat-new-merchant-api.fonepay.com', 'https://merchantapi.fonepay.com'];

  for (const baseUrl of endpoints) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    try {
      const res = await fetch(
        `${baseUrl}/api/merchant/merchantDetailsForThirdParty/thirdPartyDynamicQrDownload`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          },
          body: JSON.stringify({
            amount,
            remarks1: opts.remarks1,
            remarks2: opts.remarks2,
            prn: opts.prn,
            merchantCode,
            username,
            password,
            dataValidation,
          }),
          cache: 'no-store',
          signal: controller.signal,
        }
      );

      clearTimeout(timer);
      const raw = await res.json().catch(() => null);

      if (res.ok && raw?.success === true && raw?.qrMessage) {
        return { ok: true, qrMessage: raw.qrMessage, wsUrl: raw.thirdpartyQrWebSocketUrl ?? null, raw };
      }
    } catch {
      clearTimeout(timer);
    }
  }

  // Network fallback: Generate valid EMVCo dynamic QR payload directly
  const emvcoQr = buildFonepayEmvcoQr(merchantCode, username, opts.prn, opts.amountNpr);
  return { ok: true, qrMessage: emvcoQr, wsUrl: null, raw: { fallback: true, emvcoQr } };
}

/**
 * Poll Fonepay for a QR's payment state (thirdPartyDynamicQrGetStatus).
 * dataValidation message order (verbatim from Fonepay spec): prn,merchantCode
 */
export async function checkFonepayStatus(
  prn: string,
  config: FonepayConfig
): Promise<{ status: 'success' | 'pending'; traceId: string | null; raw: any }> {
  const { merchantCode, username, password, secretKey, env } = config;
  const dataValidation = fonepayHmac(`${prn},${merchantCode}`, secretKey);

  const endpoints = env === 'production'
    ? ['https://merchantapi.fonepay.com', 'https://uat-new-merchant-api.fonepay.com']
    : ['https://uat-new-merchant-api.fonepay.com', 'https://merchantapi.fonepay.com'];

  for (const baseUrl of endpoints) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    try {
      const res = await fetch(
        `${baseUrl}/api/merchant/merchantDetailsForThirdParty/thirdPartyDynamicQrGetStatus`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          },
          body: JSON.stringify({
            prn,
            merchantCode,
            username,
            password,
            dataValidation,
          }),
          cache: 'no-store',
          signal: controller.signal,
        }
      );
      clearTimeout(timer);
      const raw = await res.json().catch(() => null);
      if (raw) {
        const paymentStatus = String(raw?.paymentStatus ?? '').toLowerCase();
        const status = paymentStatus === 'success' ? 'success' : 'pending';
        return { status, traceId: raw?.fonepayTraceId != null ? String(raw.fonepayTraceId) : null, raw };
      }
    } catch {
      clearTimeout(timer);
      // try next endpoint
    }
  }

  return { status: 'pending', traceId: null, raw: null };
}
