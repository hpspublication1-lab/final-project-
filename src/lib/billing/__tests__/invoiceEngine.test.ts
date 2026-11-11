import { describe, it, expect } from 'vitest';
import {
  getNepalFiscalYearBs,
  generateDeterministicInvoiceNumber,
  signInvoicePayload,
  verifyInvoiceSignature,
  amountToWordsNpr,
  buildSignedInvoiceRecord,
  type CanonicalSignatureInput,
} from '../invoiceEngine';

describe('Cryptographic Billing & Invoice Engine', () => {
  describe('getNepalFiscalYearBs', () => {
    it('computes BS fiscal year before July 16 (Shrawan 1)', () => {
      expect(getNepalFiscalYearBs('2026-05-10T00:00:00Z')).toBe('2082/83');
    });

    it('computes BS fiscal year on/after July 16 (Shrawan 1)', () => {
      expect(getNepalFiscalYearBs('2026-10-28T00:00:00Z')).toBe('2083/84');
    });
  });

  describe('generateDeterministicInvoiceNumber', () => {
    it('returns deterministic invoice and receipt numbers for identical source', () => {
      const a = generateDeterministicInvoiceNumber(
        'payment_transaction',
        'tx-998877',
        '2026-10-28T09:00:00Z'
      );
      const b = generateDeterministicInvoiceNumber(
        'payment_transaction',
        'tx-998877',
        '2026-10-28T09:00:00Z'
      );
      expect(a.invoiceNumber).toBe(b.invoiceNumber);
      expect(a.receiptNumber).toBe(b.receiptNumber);
      expect(a.invoiceNumber).toMatch(/^SAM-INV-2083-\d{6}[0-9A-F]{2}$/);
      expect(a.receiptNumber).toMatch(/^SAM-RCPT-2083-\d{6}[0-9A-F]{2}$/);
    });

    it('generates distinct invoice numbers for different transactions', () => {
      const a = generateDeterministicInvoiceNumber('payment_transaction', 'tx-1');
      const b = generateDeterministicInvoiceNumber('payment_transaction', 'tx-2');
      expect(a.invoiceNumber).not.toBe(b.invoiceNumber);
    });
  });

  describe('HMAC-SHA256 Signing & Tamper Detection', () => {
    const samplePayload: CanonicalSignatureInput = {
      invoiceNumber: 'SAM-INV-2083-482910AB',
      userId: '11111111-2222-3333-4444-555555555555',
      sourceType: 'payment_transaction',
      sourceId: 'tx-abc-123',
      netAmountPaisa: 129900,
      currency: 'NPR',
      status: 'paid',
      issuedAtIso: '2026-10-28T03:00:00.000Z',
    };
    const testSecret = 'unit-test-super-secret-hmac-key-2026';

    it('signs and verifies a valid invoice payload', () => {
      const { signatureHash, verificationCode } = signInvoicePayload(samplePayload, testSecret);
      expect(signatureHash).toHaveLength(64);
      expect(verificationCode).toMatch(/^SAM-[0-9A-F]{4}-[0-9A-F]{4}$/);

      const isValid = verifyInvoiceSignature(
        samplePayload,
        signatureHash,
        verificationCode,
        testSecret
      );
      expect(isValid).toBe(true);
    });

    it('rejects tampered amount (even 1 paisa difference)', () => {
      const { signatureHash, verificationCode } = signInvoicePayload(samplePayload, testSecret);
      const tampered = { ...samplePayload, netAmountPaisa: 129901 };

      expect(
        verifyInvoiceSignature(tampered, signatureHash, verificationCode, testSecret)
      ).toBe(false);
    });

    it('rejects tampered payment status (pending forged to paid)', () => {
      const pendingPayload: CanonicalSignatureInput = { ...samplePayload, status: 'pending' };
      const { signatureHash, verificationCode } = signInvoicePayload(pendingPayload, testSecret);

      const forgedPaid: CanonicalSignatureInput = { ...samplePayload, status: 'paid' };
      expect(
        verifyInvoiceSignature(forgedPaid, signatureHash, verificationCode, testSecret)
      ).toBe(false);
    });

    it('rejects tampered userId or wrong verification code', () => {
      const { signatureHash } = signInvoicePayload(samplePayload, testSecret);
      expect(
        verifyInvoiceSignature(samplePayload, signatureHash, 'SAM-0000-0000', testSecret)
      ).toBe(false);
    });
  });

  describe('amountToWordsNpr', () => {
    it('formats NPR amounts in South Asian / Nepali accounting words', () => {
      expect(amountToWordsNpr(0)).toBe('Nepalese Rupees Zero Only');
      expect(amountToWordsNpr(799)).toBe('Nepalese Rupees Seven Hundred Ninety Nine Only');
      expect(amountToWordsNpr(1299)).toBe(
        'Nepalese Rupees One Thousand Two Hundred Ninety Nine Only'
      );
      expect(amountToWordsNpr(125000)).toBe(
        'Nepalese Rupees One Lakh Twenty Five Thousand Only'
      );
    });
  });

  describe('buildSignedInvoiceRecord', () => {
    it('builds a complete signed invoice record with valid receipt and signature', () => {
      const record = buildSignedInvoiceRecord({
        userId: 'user-uuid-1234',
        sourceType: 'course_order',
        sourceId: 'order-uuid-5678',
        purchaseOrderId: 'SEE-2026-0099',
        customerName: 'Aarav Sharma',
        customerEmail: 'aarav@example.com',
        customerPhone: '9841000000',
        planOrSku: 'see_class_10',
        grossAmountPaisa: 500000,
        discountAmountPaisa: 150000,
        netAmountPaisa: 350000,
        gateway: 'fonepay',
        gatewayRef: 'FP-TRACE-7788',
        status: 'paid',
        issuedAt: '2026-10-28T03:00:00.000Z',
        paidAt: '2026-10-28T03:01:00.000Z',
      });

      expect(record.grossAmountNpr).toBe(5000);
      expect(record.discountAmountNpr).toBe(1500);
      expect(record.netAmountNpr).toBe(3500);
      expect(record.receiptNumber).toMatch(/^SAM-RCPT-/);
      expect(record.signatureValid).toBe(true);
      expect(record.amountInWords).toBe('Nepalese Rupees Three Thousand Five Hundred Only');
    });
  });
});
