import crypto from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { COMPANY_BILLING_CONFIG } from './companyConfig';

export type InvoiceSourceType =
  | 'payment_transaction'
  | 'course_order'
  | 'billing_history'
  | 'manual_grant';

export type InvoiceStatus = 'paid' | 'pending' | 'refunded' | 'failed' | 'void';

export interface CanonicalSignatureInput {
  invoiceNumber: string;
  userId: string;
  sourceType: InvoiceSourceType;
  sourceId: string;
  netAmountPaisa: number;
  currency: string;
  status: InvoiceStatus;
  issuedAtIso: string;
}

export interface BillingInvoiceRecord {
  id: string;
  invoiceNumber: string;
  receiptNumber: string | null;
  userId: string;
  sourceType: InvoiceSourceType;
  sourceId: string;
  purchaseOrderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  itemTitle: string;
  itemSku: string;
  courseSlug: string | null;
  planTier: string;
  durationDays: number;
  grossAmountPaisa: number;
  discountAmountPaisa: number;
  taxAmountPaisa: number;
  netAmountPaisa: number;
  grossAmountNpr: number;
  discountAmountNpr: number;
  taxAmountNpr: number;
  netAmountNpr: number;
  amountInWords: string;
  currency: string;
  gateway: string;
  gatewayRef: string | null;
  status: InvoiceStatus;
  fiscalYearBs: string;
  signatureHash: string;
  verificationCode: string;
  signatureValid: boolean;
  notes: string | null;
  issuedAt: string;
  paidAt: string | null;
  refundedAt: string | null;
}

function getBillingSecret(secretOverride?: string): string {
  if (secretOverride && secretOverride.trim().length > 0) {
    return secretOverride.trim();
  }
  return (
    process.env.BILLING_SIGNING_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.FONEPAY_SECRET_KEY ||
    'samyak-academy-billing-hmac-v1-fallback-key-2026'
  );
}

/**
 * Computes the Nepal Fiscal Year in Bikram Sambat (e.g., "2082/83" or "2083/84").
 * In Nepal, the new fiscal year starts on Shrawan 1 (~July 16 AD).
 */
export function getNepalFiscalYearBs(dateInput?: string | Date): string {
  const d = dateInput ? new Date(dateInput) : new Date();
  const validDate = Number.isNaN(d.getTime()) ? new Date() : d;
  const yearAd = validDate.getUTCFullYear();
  const monthZero = validDate.getUTCMonth(); // 0 = Jan, 6 = July
  const day = validDate.getUTCDate();

  // After July 16, BS year is AD + 57; before July 16, fiscal year started in AD + 56
  const startBsYear = monthZero > 6 || (monthZero === 6 && day >= 16) ? yearAd + 57 : yearAd + 56;
  const endBsTwoDigit = String((startBsYear + 1) % 100).padStart(2, '0');
  return `${startBsYear}/${endBsTwoDigit}`;
}

/**
 * Generates a deterministic, collision-resistant Invoice Number & Receipt Number
 * from (sourceType, sourceId, createdAt) so the same transaction always yields
 * the exact same official invoice & receipt number.
 */
export function generateDeterministicInvoiceNumber(
  sourceType: InvoiceSourceType,
  sourceId: string,
  createdAt?: string | Date
): { invoiceNumber: string; receiptNumber: string; fiscalYearBs: string } {
  const fiscalYearBs = getNepalFiscalYearBs(createdAt);
  const bsYearPrefix = fiscalYearBs.split('/')[0]; // e.g. "2083"
  const digest = crypto
    .createHash('sha256')
    .update(`${sourceType}:${sourceId}`)
    .digest('hex')
    .toUpperCase();

  // Convert first 6 hex chars into a 6-digit numeric serial + 2-char check code
  const numericSerial = String((parseInt(digest.slice(0, 6), 16) % 900000) + 100000);
  const checkSuffix = digest.slice(6, 8);

  return {
    invoiceNumber: `SAM-INV-${bsYearPrefix}-${numericSerial}${checkSuffix}`,
    receiptNumber: `SAM-RCPT-${bsYearPrefix}-${numericSerial}${checkSuffix}`,
    fiscalYearBs,
  };
}

/**
 * Builds the canonical pipe-delimited string for HMAC-SHA256 signing.
 */
export function buildCanonicalSignaturePayload(input: CanonicalSignatureInput): string {
  const normalizedTs = new Date(input.issuedAtIso).toISOString();
  return [
    'v1',
    input.invoiceNumber.trim().toUpperCase(),
    input.userId.trim().toLowerCase(),
    `${input.sourceType}:${input.sourceId.trim()}`,
    String(Math.round(input.netAmountPaisa)),
    input.currency.trim().toUpperCase(),
    input.status.trim().toLowerCase(),
    normalizedTs,
  ].join('|');
}

/**
 * Computes the HMAC-SHA256 signature and human-readable 12-character verification code.
 */
export function signInvoicePayload(
  input: CanonicalSignatureInput,
  secretOverride?: string
): { signatureHash: string; verificationCode: string } {
  const secret = getBillingSecret(secretOverride);
  const canonical = buildCanonicalSignaturePayload(input);
  const signatureHash = crypto.createHmac('sha256', secret).update(canonical).digest('hex');
  const upperHex = signatureHash.toUpperCase();
  const verificationCode = `SAM-${upperHex.slice(0, 4)}-${upperHex.slice(4, 8)}`;
  return { signatureHash, verificationCode };
}

/**
 * Constant-time verification of an invoice's HMAC-SHA256 signature and/or verification code.
 */
export function verifyInvoiceSignature(
  input: CanonicalSignatureInput,
  providedSignatureHash?: string | null,
  providedVerificationCode?: string | null,
  secretOverride?: string
): boolean {
  try {
    const expected = signInvoicePayload(input, secretOverride);

    if (providedSignatureHash) {
      const a = Buffer.from(expected.signatureHash.toLowerCase(), 'utf8');
      const b = Buffer.from(providedSignatureHash.trim().toLowerCase(), 'utf8');
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        return false;
      }
    }

    if (providedVerificationCode) {
      const aCode = Buffer.from(expected.verificationCode.toUpperCase(), 'utf8');
      const bCode = Buffer.from(providedVerificationCode.trim().toUpperCase(), 'utf8');
      if (aCode.length !== bCode.length || !crypto.timingSafeEqual(aCode, bCode)) {
        return false;
      }
    }

    return Boolean(providedSignatureHash || providedVerificationCode);
  } catch {
    return false;
  }
}

const ONES = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];

const TENS = [
  '',
  '',
  'Twenty',
  'Thirty',
  'Forty',
  'Fifty',
  'Sixty',
  'Seventy',
  'Eighty',
  'Ninety',
];

function twoDigitWords(n: number): string {
  if (n === 0) return '';
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return `${TENS[t]}${o > 0 ? ' ' + ONES[o] : ''}`;
}

/**
 * Converts a non-negative NPR integer into formal Nepali/South Asian accounting words
 * (Crore, Lakh, Thousand, Hundred).
 */
export function amountToWordsNpr(amountNpr: number): string {
  const n = Math.max(0, Math.round(Number(amountNpr) || 0));
  if (n === 0) return 'Nepalese Rupees Zero Only';

  const parts: string[] = [];
  let rem = n;

  const crore = Math.floor(rem / 10000000);
  if (crore > 0) {
    parts.push(`${twoDigitWords(crore) || crore} Crore`);
    rem %= 10000000;
  }

  const lakh = Math.floor(rem / 100000);
  if (lakh > 0) {
    parts.push(`${twoDigitWords(lakh)} Lakh`);
    rem %= 100000;
  }

  const thousand = Math.floor(rem / 1000);
  if (thousand > 0) {
    parts.push(`${twoDigitWords(thousand)} Thousand`);
    rem %= 1000;
  }

  const hundred = Math.floor(rem / 100);
  if (hundred > 0) {
    parts.push(`${ONES[hundred]} Hundred`);
    rem %= 100;
  }

  if (rem > 0) {
    parts.push(twoDigitWords(rem));
  }

  return `Nepalese Rupees ${parts.join(' ')} Only`;
}

export function resolvePlanCatalogInfo(skuOrPlan: string, durationDaysHint?: number): {
  itemTitle: string;
  itemSku: string;
  courseSlug: string | null;
  planTier: string;
  durationDays: number;
} {
  const raw = String(skuOrPlan || 'cee_premium').trim().toLowerCase();

  if (raw.includes('see') || raw.includes('10')) {
    return {
      itemTitle: 'SEE Class 10 Board Topper Complete Batch (NEB)',
      itemSku: 'SEE-CLASS-10-MASTER',
      courseSlug: 'see_class_10',
      planTier: 'pro',
      durationDays: durationDaysHint || 365,
    };
  }
  if (raw.includes('11')) {
    return {
      itemTitle: 'NEB Class 11 Science Foundation Mastery Batch',
      itemSku: 'NEB-CLASS-11-SCIENCE',
      courseSlug: 'neb_class_11',
      planTier: 'pro',
      durationDays: durationDaysHint || 365,
    };
  }
  if (raw.includes('12')) {
    return {
      itemTitle: 'NEB Class 12 Science Board & Entrance Target Batch',
      itemSku: 'NEB-CLASS-12-SCIENCE',
      courseSlug: 'neb_class_12',
      planTier: 'pro',
      durationDays: durationDaysHint || 365,
    };
  }
  if (raw.includes('ioe') || raw.includes('eng')) {
    return {
      itemTitle: 'IOE Pulchowk Engineering Entrance Mastery Batch',
      itemSku: 'IOE-ENG-MASTERY',
      courseSlug: 'ioe_engineering',
      planTier: 'pro',
      durationDays: durationDaysHint || 365,
    };
  }
  if (raw.includes('ielts')) {
    return {
      itemTitle: 'IELTS Academic & General Target Band 8.0+ Batch',
      itemSku: 'IELTS-BAND-8',
      courseSlug: 'ielts',
      planTier: 'pro',
      durationDays: durationDaysHint || 180,
    };
  }
  if (raw.includes('digital') || raw.includes('market')) {
    return {
      itemTitle: 'Digital Marketing & Meta Ads Practical Blueprint',
      itemSku: 'DIGITAL-MARKETING-PRO',
      courseSlug: 'digital_marketing',
      planTier: 'pro',
      durationDays: durationDaysHint || 180,
    };
  }
  if (raw.includes('artificial') || raw === 'ai') {
    return {
      itemTitle: 'AI Academy: Prompt Engineering & Python Automation',
      itemSku: 'AI-ACADEMY-PRO',
      courseSlug: 'artificial_intelligence',
      planTier: 'pro',
      durationDays: durationDaysHint || 180,
    };
  }
  if (raw === 'pro' || raw.includes('cee_ai_pro') || raw.includes('cee-mbbs')) {
    return {
      itemTitle: 'CEE Medical Entrance AI Pro Mastery Batch (MBBS/BDS)',
      itemSku: 'CEE-MBBS-PRO-2026',
      courseSlug: 'cee_medical',
      planTier: 'pro',
      durationDays: durationDaysHint || 365,
    };
  }
  if (raw === 'student') {
    return {
      itemTitle: 'Samyak CEE Student Standard Preparation Plan',
      itemSku: 'CEE-STUDENT-PLAN',
      courseSlug: 'cee_medical',
      planTier: 'student',
      durationDays: durationDaysHint || 30,
    };
  }

  return {
    itemTitle: 'Samyak CEE Medical Entrance Preparation Batch',
    itemSku: raw.toUpperCase().replace(/[^A-Z0-9_-]/g, '-'),
    courseSlug: 'cee_medical',
    planTier: 'pro',
    durationDays: durationDaysHint || 365,
  };
}

export function normalizeInvoiceStatus(rawStatus: string | null | undefined): InvoiceStatus {
  const s = String(rawStatus || 'pending').trim().toLowerCase();
  if (s === 'completed' || s === 'paid' || s === 'verified' || s === 'active') return 'paid';
  if (s === 'refunded') return 'refunded';
  if (s === 'failed' || s === 'cancelled' || s === 'rejected') return 'failed';
  if (s === 'void') return 'void';
  return 'pending';
}

export interface BuildInvoiceInput {
  id?: string;
  userId: string;
  sourceType: InvoiceSourceType;
  sourceId: string;
  purchaseOrderId?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  planOrSku: string;
  durationDays?: number | null;
  grossAmountPaisa: number;
  discountAmountPaisa?: number;
  taxAmountPaisa?: number;
  netAmountPaisa: number;
  currency?: string;
  gateway?: string | null;
  gatewayRef?: string | null;
  status: string;
  notes?: string | null;
  issuedAt?: string | null;
  paidAt?: string | null;
  refundedAt?: string | null;
}

/**
 * Constructs a full, cryptographically signed BillingInvoiceRecord from raw transaction/order fields.
 */
export function buildSignedInvoiceRecord(input: BuildInvoiceInput): BillingInvoiceRecord {
  const issuedAtIso = input.issuedAt
    ? new Date(input.issuedAt).toISOString()
    : new Date().toISOString();
  const status = normalizeInvoiceStatus(input.status);
  const { invoiceNumber, receiptNumber, fiscalYearBs } = generateDeterministicInvoiceNumber(
    input.sourceType,
    input.sourceId,
    issuedAtIso
  );

  const catalog = resolvePlanCatalogInfo(input.planOrSku, input.durationDays || undefined);
  const netAmountPaisa = Math.max(0, Math.round(Number(input.netAmountPaisa) || 0));
  const discountAmountPaisa = Math.max(0, Math.round(Number(input.discountAmountPaisa) || 0));
  const taxAmountPaisa = Math.max(0, Math.round(Number(input.taxAmountPaisa) || 0));
  const grossAmountPaisa = Math.max(
    netAmountPaisa + discountAmountPaisa,
    Math.round(Number(input.grossAmountPaisa) || netAmountPaisa)
  );

  const currency = (input.currency || 'NPR').toUpperCase();
  const sigInput: CanonicalSignatureInput = {
    invoiceNumber,
    userId: input.userId,
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    netAmountPaisa,
    currency,
    status,
    issuedAtIso,
  };

  const { signatureHash, verificationCode } = signInvoicePayload(sigInput);
  const netAmountNpr = Math.round(netAmountPaisa / 100);
  const grossAmountNpr = Math.round(grossAmountPaisa / 100);
  const discountAmountNpr = Math.round(discountAmountPaisa / 100);
  const taxAmountNpr = Math.round(taxAmountPaisa / 100);

  return {
    id: input.id || `${input.sourceType}_${input.sourceId}`,
    invoiceNumber,
    receiptNumber: status === 'paid' || status === 'refunded' ? receiptNumber : null,
    userId: input.userId,
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    purchaseOrderId: input.purchaseOrderId || input.sourceId,
    customerName: input.customerName?.trim() || 'Samyak Student',
    customerEmail: input.customerEmail?.trim() || '',
    customerPhone: input.customerPhone?.trim() || '',
    itemTitle: catalog.itemTitle,
    itemSku: catalog.itemSku,
    courseSlug: catalog.courseSlug,
    planTier: catalog.planTier,
    durationDays: catalog.durationDays,
    grossAmountPaisa,
    discountAmountPaisa,
    taxAmountPaisa,
    netAmountPaisa,
    grossAmountNpr,
    discountAmountNpr,
    taxAmountNpr,
    netAmountNpr,
    amountInWords: amountToWordsNpr(netAmountNpr),
    currency,
    gateway: (input.gateway || 'fonepay').toLowerCase(),
    gatewayRef: input.gatewayRef || null,
    status,
    fiscalYearBs,
    signatureHash,
    verificationCode,
    signatureValid: true,
    notes: input.notes || null,
    issuedAt: issuedAtIso,
    paidAt: status === 'paid' ? input.paidAt || issuedAtIso : input.paidAt || null,
    refundedAt: status === 'refunded' ? input.refundedAt || new Date().toISOString() : null,
  };
}

export class BillingService {
  /**
   * Issues or updates a cryptographically signed invoice in `public.billing_invoices`
   * AND syncs `public.billing_history` so all student billing views stay consistent.
   */
  static async issueOrUpdateInvoice(
    admin: SupabaseClient,
    input: BuildInvoiceInput
  ): Promise<BillingInvoiceRecord> {
    // Enrich customer profile if missing
    let customerName = input.customerName;
    let customerEmail = input.customerEmail;
    let customerPhone = input.customerPhone;

    if (!customerName || !customerPhone) {
      try {
        const { data: profile } = await admin
          .from('user_profiles')
          .select('full_name, email, phone')
          .eq('id', input.userId)
          .maybeSingle();
        if (profile) {
          customerName = customerName || profile.full_name;
          customerEmail = customerEmail || profile.email;
          customerPhone = customerPhone || profile.phone;
        }
      } catch {
        // Ignore profile lookup errors
      }
    }

    const invoice = buildSignedInvoiceRecord({
      ...input,
      customerName,
      customerEmail,
      customerPhone,
    });

    // 1. Upsert into billing_invoices ledger (if table exists)
    try {
      const { data: savedRow } = await admin
        .from('billing_invoices')
        .upsert(
          {
            invoice_number: invoice.invoiceNumber,
            receipt_number: invoice.receiptNumber,
            user_id: invoice.userId,
            source_type: invoice.sourceType,
            source_id: invoice.sourceId,
            purchase_order_id: invoice.purchaseOrderId,
            customer_name: invoice.customerName,
            customer_email: invoice.customerEmail || null,
            customer_phone: invoice.customerPhone || null,
            item_title: invoice.itemTitle,
            item_sku: invoice.itemSku,
            course_slug: invoice.courseSlug,
            plan_tier: invoice.planTier,
            duration_days: invoice.durationDays,
            gross_amount_paisa: invoice.grossAmountPaisa,
            discount_amount_paisa: invoice.discountAmountPaisa,
            tax_amount_paisa: invoice.taxAmountPaisa,
            net_amount_paisa: invoice.netAmountPaisa,
            currency: invoice.currency,
            gateway: invoice.gateway,
            gateway_ref: invoice.gatewayRef,
            status: invoice.status,
            fiscal_year_bs: invoice.fiscalYearBs,
            signature_hash: invoice.signatureHash,
            verification_code: invoice.verificationCode,
            notes: invoice.notes,
            metadata: {
              companySnapshot: COMPANY_BILLING_CONFIG,
              recordedByEngineVersion: 'v1-hmac-sha256',
            },
            issued_at: invoice.issuedAt,
            paid_at: invoice.paidAt,
            refunded_at: invoice.refundedAt,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'source_type,source_id' }
        )
        .select('id')
        .maybeSingle();

      if (savedRow?.id) {
        invoice.id = savedRow.id;
      }
    } catch {
      // Gracefully continue if billing_invoices migration is not yet applied on remote DB
    }

    // 2. Sync to billing_history for backward compatibility with legacy billing views
    if (invoice.status === 'paid' || invoice.status === 'refunded') {
      try {
        const refTag = invoice.invoiceNumber;
        const { data: existingBh } = await admin
          .from('billing_history')
          .select('id')
          .eq('user_id', invoice.userId)
          .eq('transaction_ref', refTag)
          .maybeSingle();

        const mappedPlan = invoice.planTier === 'student' ? 'student' : 'pro';
        const bhStatus = invoice.status === 'refunded' ? 'refunded' : 'completed';

        if (existingBh?.id) {
          await admin
            .from('billing_history')
            .update({
              status: bhStatus,
              notes: `${invoice.itemTitle} • Receipt ${invoice.receiptNumber || invoice.invoiceNumber}`,
            })
            .eq('id', existingBh.id);
        } else {
          await admin.from('billing_history').insert({
            user_id: invoice.userId,
            plan: mappedPlan,
            amount_npr: invoice.netAmountNpr,
            billing_period: invoice.durationDays >= 300 ? 'yearly' : 'monthly',
            payment_method: invoice.gateway,
            transaction_ref: refTag,
            status: bhStatus,
            notes: `${invoice.itemTitle} • Receipt ${invoice.receiptNumber || invoice.invoiceNumber}`,
          });
        }
      } catch {
        // Ignore if enum/table constraints differ
      }
    }

    return invoice;
  }

  /**
   * Retrieves and verifies all invoices for a student (or all users if userId is omitted for admin),
   * unifying records across `billing_invoices`, `payment_transactions`, `course_orders`, and `billing_history`.
   */
  static async getUnifiedInvoices(
    admin: SupabaseClient,
    options: { userId?: string; limit?: number }
  ): Promise<BillingInvoiceRecord[]> {
    const limit = options.limit || 100;
    const userId = options.userId;

    // Fetch user profile(s)
    const profileMap = new Map<string, { full_name?: string; email?: string; phone?: string }>();
    if (userId) {
      const { data: p } = await admin
        .from('user_profiles')
        .select('id, full_name, email, phone')
        .eq('id', userId)
        .maybeSingle();
      if (p) profileMap.set(p.id, p);
    }

    const invoiceMap = new Map<string, BillingInvoiceRecord>();
    const seenOrderNumbers = new Set<string>();

    // 1. Query billing_invoices (if table exists)
    try {
      let q = admin
        .from('billing_invoices')
        .select('*')
        .order('issued_at', { ascending: false })
        .limit(limit);
      if (userId) q = q.eq('user_id', userId);

      const { data: ledgerRows, error } = await q;
      if (!error && Array.isArray(ledgerRows)) {
        for (const r of ledgerRows) {
          const issuedAtIso = new Date(r.issued_at || r.created_at).toISOString();
          const status = normalizeInvoiceStatus(r.status);
          const netAmountPaisa = Number(r.net_amount_paisa || 0);
          const grossAmountPaisa = Number(r.gross_amount_paisa || netAmountPaisa);
          const discountAmountPaisa = Number(r.discount_amount_paisa || 0);
          const taxAmountPaisa = Number(r.tax_amount_paisa || 0);
          const netAmountNpr = Math.round(netAmountPaisa / 100);

          const sigValid = verifyInvoiceSignature(
            {
              invoiceNumber: r.invoice_number,
              userId: r.user_id,
              sourceType: r.source_type as InvoiceSourceType,
              sourceId: r.source_id,
              netAmountPaisa,
              currency: r.currency || 'NPR',
              status,
              issuedAtIso,
            },
            r.signature_hash,
            r.verification_code
          );

          const record: BillingInvoiceRecord = {
            id: r.id,
            invoiceNumber: r.invoice_number,
            receiptNumber: r.receipt_number,
            userId: r.user_id,
            sourceType: r.source_type,
            sourceId: r.source_id,
            purchaseOrderId: r.purchase_order_id || r.source_id,
            customerName: r.customer_name || profileMap.get(r.user_id)?.full_name || 'Student',
            customerEmail: r.customer_email || profileMap.get(r.user_id)?.email || '',
            customerPhone: r.customer_phone || profileMap.get(r.user_id)?.phone || '',
            itemTitle: r.item_title,
            itemSku: r.item_sku,
            courseSlug: r.course_slug,
            planTier: r.plan_tier || 'pro',
            durationDays: Number(r.duration_days || 365),
            grossAmountPaisa,
            discountAmountPaisa,
            taxAmountPaisa,
            netAmountPaisa,
            grossAmountNpr: Math.round(grossAmountPaisa / 100),
            discountAmountNpr: Math.round(discountAmountPaisa / 100),
            taxAmountNpr: Math.round(taxAmountPaisa / 100),
            netAmountNpr,
            amountInWords: amountToWordsNpr(netAmountNpr),
            currency: r.currency || 'NPR',
            gateway: r.gateway || 'fonepay',
            gatewayRef: r.gateway_ref || null,
            status,
            fiscalYearBs: r.fiscal_year_bs || getNepalFiscalYearBs(issuedAtIso),
            signatureHash: r.signature_hash,
            verificationCode: r.verification_code,
            signatureValid: sigValid,
            notes: r.notes || null,
            issuedAt: issuedAtIso,
            paidAt: r.paid_at || null,
            refundedAt: r.refunded_at || null,
          };

          invoiceMap.set(`${r.source_type}:${r.source_id}`, record);
          if (r.purchase_order_id) seenOrderNumbers.add(r.purchase_order_id);
        }
      }
    } catch {
      // Table may not exist yet; continue with source tables
    }

    // 2. Query course_orders
    try {
      let coQuery = admin
        .from('course_orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (userId) coQuery = coQuery.eq('user_id', userId);

      const { data: courseOrders } = await coQuery;
      for (const co of courseOrders || []) {
        const key = `course_order:${co.id}`;
        if (invoiceMap.has(key)) continue;

        const prof = profileMap.get(co.user_id);
        const netNpr = Number(co.final_amount_npr ?? co.amount_npr ?? 0);
        const grossNpr = Number(co.base_amount_npr ?? netNpr);
        const discountNpr = Math.max(0, grossNpr - netNpr);

        const synthesized = buildSignedInvoiceRecord({
          userId: co.user_id,
          sourceType: 'course_order',
          sourceId: String(co.id),
          purchaseOrderId: co.order_number || String(co.id),
          customerName: co.student_name || prof?.full_name,
          customerEmail: prof?.email,
          customerPhone: co.student_phone || prof?.phone,
          planOrSku: co.course_id || 'see_class_10',
          durationDays: 365,
          grossAmountPaisa: Math.round(grossNpr * 100),
          discountAmountPaisa: Math.round(discountNpr * 100),
          netAmountPaisa: Math.round(netNpr * 100),
          currency: co.currency || 'NPR',
          gateway: co.gateway || 'fonepay',
          gatewayRef: co.gateway_ref || co.order_number || null,
          status: co.status || 'pending',
          issuedAt: co.created_at,
          paidAt: co.paid_at,
        });

        invoiceMap.set(key, synthesized);
        if (co.order_number) seenOrderNumbers.add(co.order_number);
      }
    } catch {
      // Ignore if course_orders unavailable
    }

    // 3. Query payment_transactions
    try {
      let txQuery = admin
        .from('payment_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (userId) txQuery = txQuery.eq('user_id', userId);

      const { data: txRows } = await txQuery;

      // Batch fetch profiles if admin mode
      if (!userId && txRows && txRows.length > 0) {
        const missingIds = Array.from(
          new Set(txRows.map((t: any) => t.user_id).filter((id: string) => id && !profileMap.has(id)))
        );
        if (missingIds.length > 0) {
          const { data: profs } = await admin
            .from('user_profiles')
            .select('id, full_name, email, phone')
            .in('id', missingIds);
          for (const p of profs || []) {
            profileMap.set(p.id, p);
          }
        }
      }

      for (const tx of txRows || []) {
        const key = `payment_transaction:${tx.id}`;
        if (invoiceMap.has(key)) continue;
        // Avoid duplicating an order already represented by course_orders
        if (tx.purchase_order_id && seenOrderNumbers.has(tx.purchase_order_id)) continue;

        const prof = profileMap.get(tx.user_id);
        const netPaisa =
          Number(tx.amount_paisa || 0) || Math.round(Number(tx.net_amount_npr || 0) * 100);
        const discountPaisa = Math.round(Number(tx.discount_amount_npr || 0) * 100);
        const grossPaisa = netPaisa + discountPaisa;

        const synthesized = buildSignedInvoiceRecord({
          userId: tx.user_id,
          sourceType: 'payment_transaction',
          sourceId: String(tx.id),
          purchaseOrderId: tx.purchase_order_id || String(tx.id),
          customerName: prof?.full_name,
          customerEmail: prof?.email,
          customerPhone: prof?.phone,
          planOrSku: tx.plan || tx.plan_sku || 'cee_premium',
          durationDays: Number(tx.duration_days || 365),
          grossAmountPaisa: grossPaisa,
          discountAmountPaisa: discountPaisa,
          netAmountPaisa: netPaisa,
          currency: tx.currency || 'NPR',
          gateway: tx.gateway || 'fonepay',
          gatewayRef: tx.gateway_ref || null,
          status: tx.status || 'pending',
          issuedAt: tx.created_at,
          paidAt: tx.status === 'completed' ? tx.updated_at || tx.created_at : null,
        });

        invoiceMap.set(key, synthesized);
        if (tx.purchase_order_id) seenOrderNumbers.add(tx.purchase_order_id);
      }
    } catch {
      // Ignore if payment_transactions unavailable
    }

    // 4. Query billing_history (for any legacy seeded or manual billing entries)
    try {
      let bhQuery = admin
        .from('billing_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (userId) bhQuery = bhQuery.eq('user_id', userId);

      const { data: bhRows } = await bhQuery;
      const existingInvoiceNums = new Set(
        Array.from(invoiceMap.values()).map((inv) => inv.invoiceNumber)
      );

      for (const bh of bhRows || []) {
        // Skip if this billing_history row was synced from an existing invoice
        if (bh.transaction_ref && existingInvoiceNums.has(bh.transaction_ref)) continue;
        if (bh.transaction_ref && seenOrderNumbers.has(bh.transaction_ref)) continue;

        const key = `billing_history:${bh.id}`;
        if (invoiceMap.has(key)) continue;

        const prof = profileMap.get(bh.user_id);
        const netPaisa = Math.round(Number(bh.amount_npr || 0) * 100);

        const synthesized = buildSignedInvoiceRecord({
          userId: bh.user_id,
          sourceType: 'billing_history',
          sourceId: String(bh.id),
          purchaseOrderId: bh.transaction_ref || String(bh.id),
          customerName: prof?.full_name,
          customerEmail: prof?.email,
          customerPhone: prof?.phone,
          planOrSku: bh.plan || 'student',
          durationDays: bh.billing_period === 'yearly' ? 365 : 30,
          grossAmountPaisa: netPaisa,
          netAmountPaisa: netPaisa,
          currency: 'NPR',
          gateway: bh.payment_method || 'fonepay',
          gatewayRef: bh.transaction_ref || null,
          status: bh.status || 'completed',
          notes: bh.notes || null,
          issuedAt: bh.created_at,
          paidAt: bh.status === 'completed' ? bh.created_at : null,
        });

        invoiceMap.set(key, synthesized);
      }
    } catch {
      // Ignore
    }

    return Array.from(invoiceMap.values()).sort(
      (a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime()
    );
  }
}
