import { describe, it, expect } from 'vitest';
import {
  computeFonepayHmacSha512,
  timingSafeSignatureCompare,
  computeDynamicQrSignature,
  computeStatusInquirySignature,
  computeNotificationSignature,
  validateTransactionAmount,
  validateMerchantIdentity,
  validateTransactionIdentity,
  validateReplayAndDuplicate,
  isSuccessfulFonepayStatus,
  verifyFonepayNotification,
  generateUniquePrn,
  type FonepayNotificationPayload,
} from '../fonepaySecurity';

describe('Fonepay Enterprise Payment Security Suite', () => {
  const TEST_SECRET = '51626c3021a54430817ca95d24c2ac01e488390b1029384756abcdef12345678';
  const TEST_MERCHANT = '2222040020144055';
  const TEST_PRN = 'SCMMOCK1234567890';
  const TEST_UID = 'FONEPAY-TX-99887766';

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Signature Verification with Provider's Exact Prescribed Procedure
  // ──────────────────────────────────────────────────────────────────────────
  describe('1. Cryptographic HMAC-SHA512 Prescribed Signatures', () => {
    it('computes deterministic lowercase HMAC-SHA512 for dynamic QR requests (5-tuple)', () => {
      const sig1 = computeDynamicQrSignature(350, TEST_PRN, TEST_MERCHANT, 'SamyakCEE', 'pro', TEST_SECRET);
      const sig2 = computeDynamicQrSignature(350, TEST_PRN, TEST_MERCHANT, 'SamyakCEE', 'pro', TEST_SECRET);

      expect(sig1).toBe(sig2);
      expect(sig1.length).toBe(128); // 512 bits in hex = 128 chars
      expect(/^[0-9a-f]{128}$/.test(sig1)).toBe(true);
    });

    it('computes deterministic lowercase HMAC-SHA512 for status inquiries (2-tuple)', () => {
      const sig = computeStatusInquirySignature(TEST_PRN, TEST_MERCHANT, TEST_SECRET);
      const expected = computeFonepayHmacSha512(`${TEST_PRN},${TEST_MERCHANT}`, TEST_SECRET);

      expect(sig).toBe(expected);
      expect(sig.length).toBe(128);
    });

    it('computes deterministic lowercase HMAC-SHA512 for IPN notifications (9-tuple)', () => {
      const payload = {
        PRN: TEST_PRN,
        PID: TEST_MERCHANT,
        PS: 'success',
        RC: 'successful',
        UID: TEST_UID,
        BC: 'NABIL',
        INI: '2026-11-10 11:30:00',
        P_AMT: '2999.00',
        R_AMT: '2999.00',
      };

      const sig = computeNotificationSignature(payload, TEST_SECRET);
      const message = `${payload.PRN},${payload.PID},${payload.PS},${payload.RC},${payload.UID},${payload.BC},${payload.INI},${payload.P_AMT},${payload.R_AMT}`;
      const expected = computeFonepayHmacSha512(message, TEST_SECRET);

      expect(sig).toBe(expected);
    });

    it('timingSafeSignatureCompare accepts identical signatures and rejects timing differences', () => {
      const sig = computeStatusInquirySignature(TEST_PRN, TEST_MERCHANT, TEST_SECRET);
      
      expect(timingSafeSignatureCompare(sig, sig)).toBe(true);
      expect(timingSafeSignatureCompare(sig.toUpperCase(), sig)).toBe(true); // Case-insensitive
      
      // Single character tampering
      const tampered = sig.slice(0, -1) + (sig.slice(-1) === 'a' ? 'b' : 'a');
      expect(timingSafeSignatureCompare(tampered, sig)).toBe(false);

      // Truncated signature
      expect(timingSafeSignatureCompare(sig.slice(0, 64), sig)).toBe(false);
      expect(timingSafeSignatureCompare('', sig)).toBe(false);
      expect(timingSafeSignatureCompare(sig, '')).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Transaction Amount and Currency Validation
  // ──────────────────────────────────────────────────────────────────────────
  describe('2. Transaction Amount & Currency Validation', () => {
    it('accepts exact matching amount in NPR', () => {
      // 2,999 NPR = 299,900 paisa
      const check = validateTransactionAmount(299900, '2999.00', 'NPR', 'NPR');
      expect(check.valid).toBe(true);
      expect(check.error).toBeUndefined();
    });

    it('accepts ISO 524 currency code for Nepalese Rupee', () => {
      const check = validateTransactionAmount(540000, 5400, 'NPR', '524');
      expect(check.valid).toBe(true);
    });

    it('rejects underpayment fraud (e.g. paying 10 NPR for a 2,999 NPR course)', () => {
      const check = validateTransactionAmount(299900, '10.00', 'NPR', 'NPR');
      expect(check.valid).toBe(false);
      expect(check.reason).toBe('amount_mismatch');
      expect(check.error).toContain('Amount mismatch');
      expect(check.error).toContain('2999.00');
      expect(check.error).toContain('10.00');
    });

    it('rejects overpayment or mismatched floating-point manipulation', () => {
      const check = validateTransactionAmount(299900, '3000.00', 'NPR', 'NPR');
      expect(check.valid).toBe(false);
      expect(check.reason).toBe('amount_mismatch');
    });

    it('rejects invalid, negative, or non-numeric amount values', () => {
      expect(validateTransactionAmount(299900, '-2999', 'NPR', 'NPR').valid).toBe(false);
      expect(validateTransactionAmount(299900, '0', 'NPR', 'NPR').valid).toBe(false);
      expect(validateTransactionAmount(299900, 'free', 'NPR', 'NPR').valid).toBe(false);
      expect(validateTransactionAmount(299900, NaN, 'NPR', 'NPR').valid).toBe(false);
    });

    it('rejects foreign currency substitutions (USD, INR, EUR)', () => {
      const usdCheck = validateTransactionAmount(299900, '2999.00', 'NPR', 'USD');
      expect(usdCheck.valid).toBe(false);
      expect(usdCheck.reason).toBe('currency_mismatch');
      expect(usdCheck.error).toContain('Currency mismatch');

      const inrCheck = validateTransactionAmount(299900, '2999.00', 'NPR', 'INR');
      expect(inrCheck.valid).toBe(false);
      expect(inrCheck.reason).toBe('currency_mismatch');
      expect(inrCheck.error).toContain('Currency mismatch');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Merchant and Transaction Identity
  // ──────────────────────────────────────────────────────────────────────────
  describe('3. Merchant and Transaction Identity Checks', () => {
    it('accepts matching merchant code (PID)', () => {
      const result = validateMerchantIdentity(TEST_MERCHANT, TEST_MERCHANT);
      expect(result.valid).toBe(true);
    });

    it('strictly rejects forged or foreign merchant code (PID)', () => {
      const result = validateMerchantIdentity(TEST_MERCHANT, '9999000011112222');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Merchant identity mismatch');
    });

    it('accepts matching transaction reference PRN', () => {
      const result = validateTransactionIdentity(TEST_PRN, TEST_PRN.toLowerCase());
      expect(result.valid).toBe(true);
    });

    it('strictly rejects mismatched PRN (order hijacking attempt)', () => {
      const result = validateTransactionIdentity('SCM-ORDER-1', 'SCM-ORDER-2');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Transaction reference mismatch');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Duplicate and Replay Attack Protection
  // ──────────────────────────────────────────────────────────────────────────
  describe('4. Duplicate & Replay Attack Mitigation', () => {
    it('handles duplicate notification for an already settled transaction idempotently', () => {
      const check = validateReplayAndDuplicate({
        currentStatus: 'completed',
        incomingTraceId: TEST_UID,
        existingTransactionsWithSameTraceId: 0,
      });

      expect(check.valid).toBe(true);
      expect(check.isDuplicate).toBe(true);
      expect(check.isReplayAttack).toBe(false);
      expect(check.reason).toBe('duplicate_notification');
    });

    it('detects and blocks cross-transaction traceId replay attack', () => {
      // Attacker took TEST_UID from an existing completed order and tries to use it on an unpaid order
      const check = validateReplayAndDuplicate({
        currentStatus: 'pending',
        incomingTraceId: TEST_UID,
        existingTransactionsWithSameTraceId: 1, // Found on another transaction!
      });

      expect(check.valid).toBe(false);
      expect(check.isDuplicate).toBe(false);
      expect(check.isReplayAttack).toBe(true);
      expect(check.reason).toBe('replay_detected');
      expect(check.error).toContain('Replay attack detected');
      expect(check.error).toContain(TEST_UID);
    });

    it('detects and rejects stale replayed notifications older than 48 hours', () => {
      const staleTimestamp = new Date(Date.now() - 72 * 3600 * 1000).toISOString(); // 72 hours old
      const check = validateReplayAndDuplicate({
        currentStatus: 'pending',
        incomingTraceId: TEST_UID,
        existingTransactionsWithSameTraceId: 0,
        incomingTimestamp: staleTimestamp,
        maxAgeHours: 48,
      });

      expect(check.valid).toBe(false);
      expect(check.isReplayAttack).toBe(true);
      expect(check.reason).toBe('replay_detected');
      expect(check.error).toContain('Stale notification rejected');
    });

    it('allows valid fresh notifications on pending transactions', () => {
      const freshTimestamp = new Date().toISOString();
      const check = validateReplayAndDuplicate({
        currentStatus: 'pending',
        incomingTraceId: TEST_UID,
        existingTransactionsWithSameTraceId: 0,
        incomingTimestamp: freshTimestamp,
      });

      expect(check.valid).toBe(true);
      expect(check.isDuplicate).toBe(false);
      expect(check.isReplayAttack).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Transaction Status Validation Against Provider
  // ──────────────────────────────────────────────────────────────────────────
  describe('5. Provider Status Validation', () => {
    it('accepts valid Fonepay success statuses', () => {
      expect(isSuccessfulFonepayStatus('success', 'successful')).toBe(true);
      expect(isSuccessfulFonepayStatus('success', '00')).toBe(true);
      expect(isSuccessfulFonepayStatus('true', '0')).toBe(true);
      expect(isSuccessfulFonepayStatus('SUCCESS')).toBe(true);
      expect(isSuccessfulFonepayStatus('yes')).toBe(true);
    });

    it('strictly rejects failed, cancelled, pending, or timeout provider statuses', () => {
      expect(isSuccessfulFonepayStatus('pending')).toBe(false);
      expect(isSuccessfulFonepayStatus('failed')).toBe(false);
      expect(isSuccessfulFonepayStatus('cancelled')).toBe(false);
      expect(isSuccessfulFonepayStatus('timeout')).toBe(false);
      expect(isSuccessfulFonepayStatus('success', 'failed_rc')).toBe(false);
      expect(isSuccessfulFonepayStatus(undefined)).toBe(false);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 6. Unique Transaction Reference Generation
  // ──────────────────────────────────────────────────────────────────────────
  describe('6. Unique Transaction References (PRN)', () => {
    it('generates unguessable, prefixed references within 25 characters', () => {
      const prn = generateUniquePrn('SCM');
      expect(prn.startsWith('SCM')).toBe(true);
      expect(prn.length).toBeLessThanOrEqual(25);
      expect(/^[A-Z0-9]+$/.test(prn)).toBe(true);
    });

    it('generates strictly unique PRNs across 1,000 rapid calls', () => {
      const set = new Set<string>();
      for (let i = 0; i < 1000; i++) {
        set.add(generateUniquePrn('SCM'));
      }
      expect(set.size).toBe(1000);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 7. Master IPN Notification Verifier (End-to-End Test Cases)
  // ──────────────────────────────────────────────────────────────────────────
  describe('7. Master Inbound Notification Verification (IPN Webhook)', () => {
    function createValidPayload(): FonepayNotificationPayload {
      const base = {
        PRN: TEST_PRN,
        PID: TEST_MERCHANT,
        PS: 'success',
        RC: 'successful',
        UID: TEST_UID,
        BC: 'NIC_ASIA',
        INI: new Date().toISOString(),
        P_AMT: '3150.00',
        R_AMT: '3150.00',
        CRN: 'NPR',
      };
      const DV = computeNotificationSignature(base, TEST_SECRET);
      return { ...base, DV };
    }

    it('accepts and verifies a legitimate, correctly signed Fonepay notification', () => {
      const payload = createValidPayload();
      const result = verifyFonepayNotification(payload, {
        expectedPrn: TEST_PRN,
        expectedAmountPaisa: 315000,
        expectedCurrency: 'NPR',
        merchantCode: TEST_MERCHANT,
        secretKey: TEST_SECRET,
        currentTransactionStatus: 'pending',
        existingTransactionsWithSameTraceId: 0,
      });

      expect(result.valid).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.reason).toBe('valid');
      expect(result.details?.traceId).toBe(TEST_UID);
    });

    it('rejects forged payment notification with invalid HMAC-SHA512 (HTTP 401)', () => {
      const payload = createValidPayload();
      // Attacker forges signature
      payload.DV = 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef';

      const result = verifyFonepayNotification(payload, {
        expectedPrn: TEST_PRN,
        expectedAmountPaisa: 315000,
        merchantCode: TEST_MERCHANT,
        secretKey: TEST_SECRET,
        currentTransactionStatus: 'pending',
        existingTransactionsWithSameTraceId: 0,
      });

      expect(result.valid).toBe(false);
      expect(result.statusCode).toBe(401);
      expect(result.reason).toBe('signature_mismatch');
      expect(result.error).toContain('signature verification failed');
    });

    it('rejects tampered amount in payment notification (HTTP 400)', () => {
      const payload = createValidPayload();
      // Attacker modifies amount to 1 NPR but signs with their own secret or passes forged DV
      payload.P_AMT = '1.00';
      payload.DV = computeNotificationSignature(payload, TEST_SECRET); // Even if signed for Rs 1!

      const result = verifyFonepayNotification(payload, {
        expectedPrn: TEST_PRN,
        expectedAmountPaisa: 315000, // Database expects 3,150 NPR!
        merchantCode: TEST_MERCHANT,
        secretKey: TEST_SECRET,
        currentTransactionStatus: 'pending',
        existingTransactionsWithSameTraceId: 0,
      });

      expect(result.valid).toBe(false);
      expect(result.statusCode).toBe(400);
      expect(result.reason).toBe('amount_mismatch');
      expect(result.error).toContain('Amount mismatch');
    });

    it('rejects foreign merchant code PID (HTTP 403)', () => {
      const payload = createValidPayload();
      payload.PID = 'IMPOSTER_MERCHANT_99';
      payload.DV = computeNotificationSignature(payload, TEST_SECRET);

      const result = verifyFonepayNotification(payload, {
        expectedPrn: TEST_PRN,
        expectedAmountPaisa: 315000,
        merchantCode: TEST_MERCHANT,
        secretKey: TEST_SECRET,
        currentTransactionStatus: 'pending',
        existingTransactionsWithSameTraceId: 0,
      });

      expect(result.valid).toBe(false);
      expect(result.statusCode).toBe(403);
      expect(result.reason).toBe('merchant_mismatch');
    });

    it('rejects replayed UID that belongs to another transaction (HTTP 409)', () => {
      const payload = createValidPayload();

      const result = verifyFonepayNotification(payload, {
        expectedPrn: TEST_PRN,
        expectedAmountPaisa: 315000,
        merchantCode: TEST_MERCHANT,
        secretKey: TEST_SECRET,
        currentTransactionStatus: 'pending',
        existingTransactionsWithSameTraceId: 1, // Already bound to another order!
      });

      expect(result.valid).toBe(false);
      expect(result.statusCode).toBe(409);
      expect(result.reason).toBe('replay_detected');
      expect(result.error).toContain('Replay attack detected');
    });

    it('handles duplicate notification for an already settled transaction idempotently (HTTP 200)', () => {
      const payload = createValidPayload();

      const result = verifyFonepayNotification(payload, {
        expectedPrn: TEST_PRN,
        expectedAmountPaisa: 315000,
        merchantCode: TEST_MERCHANT,
        secretKey: TEST_SECRET,
        currentTransactionStatus: 'completed', // Already completed
        existingTransactionsWithSameTraceId: 0,
      });

      expect(result.valid).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.reason).toBe('duplicate_notification');
      expect(result.details?.isDuplicate).toBe(true);
    });

    it('rejects non-successful status notification (HTTP 422)', () => {
      const payload = createValidPayload();
      payload.PS = 'failed';
      payload.RC = 'cancelled_by_user';
      payload.DV = computeNotificationSignature(payload, TEST_SECRET);

      const result = verifyFonepayNotification(payload, {
        expectedPrn: TEST_PRN,
        expectedAmountPaisa: 315000,
        merchantCode: TEST_MERCHANT,
        secretKey: TEST_SECRET,
        currentTransactionStatus: 'pending',
        existingTransactionsWithSameTraceId: 0,
      });

      expect(result.valid).toBe(false);
      expect(result.statusCode).toBe(422);
      expect(result.reason).toBe('status_unsuccessful');
    });
  });
});
