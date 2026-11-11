import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSessionUser } from '@/lib/supabase/route-auth';
import {
  BillingService,
  buildSignedInvoiceRecord,
  verifyInvoiceSignature,
  type InvoiceSourceType,
  type InvoiceStatus,
  type BillingInvoiceRecord,
} from '@/lib/billing/invoiceEngine';
import { COMPANY_BILLING_CONFIG } from '@/lib/billing/companyConfig';
import { enforceRateLimit } from '@/lib/security/rateLimiter';

export const dynamic = 'force-dynamic';

function getSampleSpecimen(userId?: string): BillingInvoiceRecord {
  return buildSignedInvoiceRecord({
    userId: userId || '00000000-0000-0000-0000-000000000000',
    sourceType: 'course_order',
    sourceId: 'sample-official-receipt-2083',
    purchaseOrderId: 'SAM-ORD-2083-994821',
    customerName: 'Aarav Sharma',
    customerEmail: 'student@samyak.edu.np',
    customerPhone: '+977-9841234567',
    planOrSku: 'cee-mbbs-mastery-2026',
    durationDays: 365,
    grossAmountPaisa: 600000,
    discountAmountPaisa: 150000,
    taxAmountPaisa: 0,
    netAmountPaisa: 450000,
    currency: 'NPR',
    gateway: 'fonepay',
    gatewayRef: 'FP-QR-883920144',
    status: 'paid',
    notes: 'Scholarship Code Applied: SAMYAK25',
    issuedAt: '2026-10-28T04:00:00.000Z',
    paidAt: '2026-10-28T04:01:12.000Z',
  });
}

async function verifyInvoiceCore(
  rawInvoiceNum: string,
  rawCode: string,
  authenticatedUserId?: string
) {
  const invoiceNumber = rawInvoiceNum.trim().toUpperCase();
  const verificationCode = rawCode.trim().toUpperCase();

  if (!invoiceNumber || !verificationCode) {
    return {
      status: 400,
      payload: { valid: false, error: 'Both Invoice Number and Verification Code are required.' },
    };
  }

  const admin = createAdminClient();
  const sampleInvoice = getSampleSpecimen(authenticatedUserId);

  let matched: BillingInvoiceRecord | undefined;

  // 1. Direct query by invoice_number or receipt_number if admin client is available
  if (admin) {
    try {
      const { data: dbRow } = await admin
        .from('billing_invoices')
        .select('*')
        .or(`invoice_number.ilike.${invoiceNumber},receipt_number.ilike.${invoiceNumber}`)
        .maybeSingle();

      if (dbRow) {
        matched = {
          id: dbRow.id,
          invoiceNumber: dbRow.invoice_number,
          receiptNumber: dbRow.receipt_number,
          userId: dbRow.user_id,
          sourceType: dbRow.source_type,
          sourceId: dbRow.source_id,
          purchaseOrderId: dbRow.purchase_order_id,
          customerName: dbRow.customer_name,
          customerEmail: dbRow.customer_email || '',
          customerPhone: dbRow.customer_phone || '',
          itemTitle: dbRow.item_title,
          itemSku: dbRow.item_sku,
          courseSlug: dbRow.course_slug,
          planTier: dbRow.plan_tier,
          durationDays: dbRow.duration_days,
          grossAmountPaisa: Number(dbRow.gross_amount_paisa),
          discountAmountPaisa: Number(dbRow.discount_amount_paisa),
          taxAmountPaisa: Number(dbRow.tax_amount_paisa),
          netAmountPaisa: Number(dbRow.net_amount_paisa),
          grossAmountNpr: Number(dbRow.gross_amount_paisa) / 100,
          discountAmountNpr: Number(dbRow.discount_amount_paisa) / 100,
          taxAmountNpr: Number(dbRow.tax_amount_paisa) / 100,
          netAmountNpr: Number(dbRow.net_amount_paisa) / 100,
          amountInWords: '',
          currency: dbRow.currency,
          gateway: dbRow.gateway,
          gatewayRef: dbRow.gateway_ref,
          status: dbRow.status,
          fiscalYearBs: dbRow.fiscal_year_bs,
          signatureHash: dbRow.signature_hash,
          verificationCode: dbRow.verification_code,
          signatureValid: true,
          notes: dbRow.notes,
          issuedAt: dbRow.issued_at,
          paidAt: dbRow.paid_at,
          refundedAt: dbRow.refunded_at,
        };
      }
    } catch {
      // Database query failed or table not migrated yet; fallback below
    }

    if (!matched) {
      try {
        const unified = await BillingService.getUnifiedInvoices(admin, { limit: 200 });
        matched = unified.find(
          (inv) =>
            inv.invoiceNumber.toUpperCase() === invoiceNumber ||
            (inv.receiptNumber && inv.receiptNumber.toUpperCase() === invoiceNumber)
        );
      } catch {
        // Fallback to sample
      }
    }
  }

  // Check sample specimen if testing sample invoices
  if (
    !matched &&
    (sampleInvoice.invoiceNumber.toUpperCase() === invoiceNumber ||
      sampleInvoice.receiptNumber?.toUpperCase() === invoiceNumber)
  ) {
    matched = sampleInvoice;
  }

  if (!matched) {
    return {
      status: 404,
      payload: {
        valid: false,
        error: `No invoice or receipt found matching number "${invoiceNumber}". Please verify the voucher details.`,
      },
    };
  }

  // Constant-time HMAC-SHA256 signature verification
  const isAuthentic = verifyInvoiceSignature(
    {
      invoiceNumber: matched.invoiceNumber,
      userId: matched.userId,
      sourceType: matched.sourceType as InvoiceSourceType,
      sourceId: matched.sourceId,
      netAmountPaisa: matched.netAmountPaisa,
      currency: matched.currency,
      status: matched.status as InvoiceStatus,
      issuedAtIso: matched.issuedAt,
    },
    matched.signatureHash,
    verificationCode
  );

  if (!isAuthentic) {
    return {
      status: 422,
      payload: {
        valid: false,
        error:
          'Tamper Alert: Cryptographic signature mismatch. The provided verification code does not match the sealed records.',
      },
    };
  }

  return {
    status: 200,
    payload: {
      valid: true,
      verifiedAt: new Date().toISOString(),
      algorithm: 'HMAC-SHA256',
      issuer: {
        legalName: COMPANY_BILLING_CONFIG.legalName,
        tradeName: COMPANY_BILLING_CONFIG.tradeName,
        panNumber: COMPANY_BILLING_CONFIG.panNumber,
        registrationNumber: COMPANY_BILLING_CONFIG.registrationNumber,
        address: `${COMPANY_BILLING_CONFIG.addressLine1}, ${COMPANY_BILLING_CONFIG.addressLine2}`,
        phone: COMPANY_BILLING_CONFIG.phone,
        email: COMPANY_BILLING_CONFIG.email,
        website: COMPANY_BILLING_CONFIG.website,
      },
      invoice: {
        invoiceNumber: matched.invoiceNumber,
        receiptNumber: matched.receiptNumber,
        verificationCode: matched.verificationCode,
        signatureHash: matched.signatureHash,
        customerName: matched.customerName,
        itemTitle: matched.itemTitle,
        itemSku: matched.itemSku,
        grossAmountNpr: matched.grossAmountNpr,
        discountAmountNpr: matched.discountAmountNpr,
        taxAmountNpr: matched.taxAmountNpr,
        netAmountNpr: matched.netAmountNpr,
        amountInWords: matched.amountInWords,
        gateway: matched.gateway,
        purchaseOrderId: matched.purchaseOrderId,
        status: matched.status,
        fiscalYearBs: matched.fiscalYearBs,
        issuedAt: matched.issuedAt,
        paidAt: matched.paidAt,
      },
    },
  };
}

/**
 * POST /api/billing/verify
 * Public & authenticated verification of an invoice or receipt.
 */
export async function POST(req: NextRequest) {
  try {
    const rl = enforceRateLimit(req, 'submission');
    if (!rl.allowed) {
      return NextResponse.json(
        { valid: false, error: 'Too many verification attempts. Please wait a moment and try again.' },
        { status: 429, headers: { 'Retry-After': String(rl.resetSeconds) } }
      );
    }

    const user = await getSessionUser();
    const body = await req.json().catch(() => ({}));
    const invoiceNumber = String(body.invoiceNumber || '');
    const verificationCode = String(body.verificationCode || '');

    const result = await verifyInvoiceCore(invoiceNumber, verificationCode, user?.id);
    return NextResponse.json(result.payload, { status: result.status });
  } catch (err: any) {
    console.error('[api/billing/verify] Error:', err);
    return NextResponse.json(
      { valid: false, error: 'Verification check failed due to an unexpected server error.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/billing/verify?inv=SAM-INV-...&code=SAM-XXXX-XXXX
 * Direct query string verification for QR code scanners.
 */
export async function GET(req: NextRequest) {
  try {
    const rl = enforceRateLimit(req, 'submission');
    if (!rl.allowed) {
      return NextResponse.json(
        { valid: false, error: 'Too many verification requests. Please wait a moment and try again.' },
        { status: 429, headers: { 'Retry-After': String(rl.resetSeconds) } }
      );
    }

    const user = await getSessionUser();
    const { searchParams } = new URL(req.url);
    const invoiceNumber = String(searchParams.get('inv') || searchParams.get('invoice') || '');
    const verificationCode = String(searchParams.get('code') || searchParams.get('verifyCode') || '');

    const result = await verifyInvoiceCore(invoiceNumber, verificationCode, user?.id);
    return NextResponse.json(result.payload, { status: result.status });
  } catch (err: any) {
    console.error('[api/billing/verify GET] Error:', err);
    return NextResponse.json(
      { valid: false, error: 'Verification check failed.' },
      { status: 500 }
    );
  }
}
