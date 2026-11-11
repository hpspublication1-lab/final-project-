/**
 * Samyak CEE & SEE Mastery — Fonepay Enterprise Payment Security Engine
 * 
 * Implements strict controls for Fonepay Dynamic QR and Server-to-Server IPN:
 * 1. Prescribed HMAC-SHA512 Signature generation and timing-safe verification.
 * 2. Transaction Amount and Currency (NPR) validation to prevent underpayment fraud.
 * 3. Merchant Code (PID) and Transaction Reference (PRN) identity checks.
 * 4. Duplicate and Replayed Notification Mitigation (Trace ID cross-transaction defense & timestamp freshness).
 * 5. Provider Status validation (success, pending, failed, cancelled).
 * 6. Unique transaction reference generation & reconciliation.
 */

import crypto from 'crypto';

export interface FonepayConfig {
  merchantCode: string;
  username: string;
  password: string;
  secretKey: string;
  env: string;
}

export interface FonepayNotificationPayload {
  PRN: string; // Product Reference Number / purchase_order_id
  PID: string; // Merchant Code
  PS: string; // Payment Status (e.g. 'success', 'true', 'yes')
  RC: string; // Response Code (e.g. 'successful', '00', 'success')
  UID: string; // Fonepay unique trace ID / transaction reference
  BC: string; // Bank Code
  INI: string; // Initiation date/time
  P_AMT: string | number; // Paid Amount
  R_AMT: string | number; // Requested Amount
  CRN?: string; // Currency code, default 'NPR'
  DV: string; // HMAC-SHA512 Data Validation signature
}

export interface VerificationResult {
  valid: boolean;
  error?: string;
  statusCode: number;
  reason?:
    | 'valid'
    | 'signature_mismatch'
    | 'amount_mismatch'
    | 'currency_mismatch'
    | 'merchant_mismatch'
    | 'transaction_mismatch'
    | 'replay_detected'
    | 'duplicate_notification'
    | 'status_unsuccessful'
    | 'missing_parameters';
  details?: Record<string, any>;
}

// ────────────────────────────────────────────────────────────────────────────
// 1. Cryptographic HMAC-SHA512 Core Functions
// ────────────────────────────────────────────────────────────────────────────

/**
 * Computes lowercase hex HMAC-SHA512 digest for a given message and secret key.
 */
export function computeFonepayHmacSha512(message: string, secretKey: string): string {
  return crypto
    .createHmac('sha512', secretKey)
    .update(message)
    .digest('hex')
    .toLowerCase();
}

/**
 * Timing-safe signature comparison defending against timing side-channel attacks.
 */
export function timingSafeSignatureCompare(receivedSig: string, expectedSig: string): boolean {
  if (!receivedSig || !expectedSig) return false;
  
  const cleanReceived = receivedSig.trim().toLowerCase();
  const cleanExpected = expectedSig.trim().toLowerCase();

  const bufReceived = Buffer.from(cleanReceived, 'utf8');
  const bufExpected = Buffer.from(cleanExpected, 'utf8');

  if (bufReceived.length !== bufExpected.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufReceived, bufExpected);
}

/**
 * Computes signature for dynamic QR generation request (thirdPartyDynamicQrDownload):
 * Message formula: amount,prn,merchantCode,remarks1,remarks2
 */
export function computeDynamicQrSignature(
  amount: string | number,
  prn: string,
  merchantCode: string,
  remarks1: string,
  remarks2: string,
  secretKey: string
): string {
  const amtStr = typeof amount === 'number' ? amount.toString() : amount;
  return computeFonepayHmacSha512(`${amtStr},${prn},${merchantCode},${remarks1},${remarks2}`, secretKey);
}

/**
 * Computes signature for status inquiry request (thirdPartyDynamicQrGetStatus):
 * Message formula: prn,merchantCode
 */
export function computeStatusInquirySignature(
  prn: string,
  merchantCode: string,
  secretKey: string
): string {
  return computeFonepayHmacSha512(`${prn},${merchantCode}`, secretKey);
}

/**
 * Computes signature for inbound Server-to-Server Payment Notification (IPN callback):
 * Message formula (prescribed by Fonepay specification):
 * PRN,PID,PS,RC,UID,BC,INI,P_AMT,R_AMT
 */
export function computeNotificationSignature(
  payload: {
    PRN: string;
    PID: string;
    PS: string;
    RC: string;
    UID: string;
    BC: string;
    INI: string;
    P_AMT: string | number;
    R_AMT: string | number;
  },
  secretKey: string
): string {
  const pAmtStr = typeof payload.P_AMT === 'number' ? payload.P_AMT.toString() : payload.P_AMT;
  const rAmtStr = typeof payload.R_AMT === 'number' ? payload.R_AMT.toString() : payload.R_AMT;

  const message = [
    payload.PRN,
    payload.PID,
    payload.PS,
    payload.RC,
    payload.UID,
    payload.BC,
    payload.INI,
    pAmtStr,
    rAmtStr,
  ].join(',');

  return computeFonepayHmacSha512(message, secretKey);
}

// ────────────────────────────────────────────────────────────────────────────
// 2. Transaction Amount and Currency Validation
// ────────────────────────────────────────────────────────────────────────────

/**
 * Validates that the amount reported by Fonepay strictly equals the database order amount in NPR.
 * Prevents underpayment fraud (e.g. paying 10 NPR for a 2,999 NPR course).
 */
export function validateTransactionAmount(
  expectedAmountPaisa: number | bigint,
  receivedAmountNpr: string | number,
  expectedCurrency: string = 'NPR',
  receivedCurrency: string = 'NPR'
): { valid: boolean; error?: string; reason?: 'amount_mismatch' | 'currency_mismatch' } {
  // 1. Currency Check
  const normExpectedCurrency = (expectedCurrency || 'NPR').trim().toUpperCase();
  const normReceivedCurrency = (receivedCurrency || 'NPR').trim().toUpperCase();

  // Fonepay sometimes uses ISO code 524 for Nepalese Rupee
  const isCurrencyValid =
    normReceivedCurrency === normExpectedCurrency ||
    normReceivedCurrency === 'NPR' ||
    normReceivedCurrency === '524';

  if (!isCurrencyValid) {
    return {
      valid: false,
      error: `Currency mismatch: expected ${normExpectedCurrency}, received ${normReceivedCurrency}`,
      reason: 'currency_mismatch',
    };
  }

  // 2. Amount Check (tolerance of 0.01 NPR for floating point representations)
  const expectedNpr = Number(expectedAmountPaisa) / 100;
  const receivedNpr = typeof receivedAmountNpr === 'string' ? parseFloat(receivedAmountNpr) : Number(receivedAmountNpr);

  if (isNaN(receivedNpr) || receivedNpr <= 0) {
    return {
      valid: false,
      error: `Invalid numerical amount received: ${receivedAmountNpr}`,
      reason: 'amount_mismatch',
    };
  }

  if (Math.abs(expectedNpr - receivedNpr) > 0.01) {
    return {
      valid: false,
      error: `Amount mismatch: expected NPR ${expectedNpr.toFixed(2)}, received NPR ${receivedNpr.toFixed(2)}`,
      reason: 'amount_mismatch',
    };
  }

  return { valid: true };
}

// ────────────────────────────────────────────────────────────────────────────
// 3. Merchant and Transaction Identity Validation
// ────────────────────────────────────────────────────────────────────────────

export function validateMerchantIdentity(
  configuredMerchantCode: string,
  receivedMerchantCode: string
): { valid: boolean; error?: string } {
  if (!configuredMerchantCode || !receivedMerchantCode) {
    return { valid: false, error: 'Merchant code is missing' };
  }

  if (configuredMerchantCode.trim() !== receivedMerchantCode.trim()) {
    return {
      valid: false,
      error: `Merchant identity mismatch: received PID ${receivedMerchantCode}, expected ${configuredMerchantCode}`,
    };
  }

  return { valid: true };
}

export function validateTransactionIdentity(
  expectedPrn: string,
  receivedPrn: string
): { valid: boolean; error?: string } {
  if (!expectedPrn || !receivedPrn) {
    return { valid: false, error: 'Transaction PRN is missing' };
  }

  if (expectedPrn.trim().toUpperCase() !== receivedPrn.trim().toUpperCase()) {
    return {
      valid: false,
      error: `Transaction reference mismatch: expected ${expectedPrn}, received ${receivedPrn}`,
    };
  }

  return { valid: true };
}

// ────────────────────────────────────────────────────────────────────────────
// 4. Duplicate and Replay Attack Mitigation
// ────────────────────────────────────────────────────────────────────────────

/**
 * Validates against replay attacks:
 * - Detects already finalized transactions (idempotent duplicate notification).
 * - Detects cross-transaction trace ID reuse (attacker attempting to reuse a valid traceId from another order).
 * - Validates timestamp freshness to prevent stale notification replaying.
 */
export function validateReplayAndDuplicate(params: {
  currentStatus: string;
  incomingTraceId: string;
  existingTransactionsWithSameTraceId: number;
  incomingTimestamp?: string;
  maxAgeHours?: number;
}): {
  valid: boolean;
  isDuplicate: boolean;
  isReplayAttack: boolean;
  error?: string;
  reason?: 'duplicate_notification' | 'replay_detected';
} {
  const {
    currentStatus,
    incomingTraceId,
    existingTransactionsWithSameTraceId,
    incomingTimestamp,
    maxAgeHours = 48,
  } = params;

  // 1. Idempotency Check: Same transaction was already settled
  if (currentStatus === 'completed') {
    return {
      valid: true,
      isDuplicate: true,
      isReplayAttack: false,
      reason: 'duplicate_notification',
    };
  }

  // 2. Cross-Transaction Replay Attack: Trace ID belongs to a DIFFERENT transaction
  if (existingTransactionsWithSameTraceId > 0) {
    return {
      valid: false,
      isDuplicate: false,
      isReplayAttack: true,
      error: `Replay attack detected: Fonepay traceId ${incomingTraceId} is already bound to another completed transaction.`,
      reason: 'replay_detected',
    };
  }

  // 3. Stale Notification Check (if timestamp provided)
  if (incomingTimestamp) {
    const parsedTime = Date.parse(incomingTimestamp);
    if (!isNaN(parsedTime)) {
      const ageHours = (Date.now() - parsedTime) / (1000 * 60 * 60);
      if (ageHours > maxAgeHours) {
        return {
          valid: false,
          isDuplicate: false,
          isReplayAttack: true,
          error: `Stale notification rejected: Notification timestamp ${incomingTimestamp} is older than ${maxAgeHours} hours.`,
          reason: 'replay_detected',
        };
      }
    }
  }

  return { valid: true, isDuplicate: false, isReplayAttack: false };
}

// ────────────────────────────────────────────────────────────────────────────
// 5. Provider Status Validation
// ────────────────────────────────────────────────────────────────────────────

/**
 * Checks whether the status and response code from Fonepay signify an authoritative completed payment.
 */
export function isSuccessfulFonepayStatus(paymentStatus?: string, responseCode?: string): boolean {
  if (!paymentStatus) return false;

  const cleanStatus = paymentStatus.trim().toLowerCase();
  const isStatusSuccess =
    cleanStatus === 'success' ||
    cleanStatus === 'true' ||
    cleanStatus === 'yes' ||
    cleanStatus === 'successful';

  if (!isStatusSuccess) return false;

  if (responseCode !== undefined && responseCode !== null) {
    const cleanRc = responseCode.trim().toLowerCase();
    const isRcSuccess =
      cleanRc === 'successful' ||
      cleanRc === '00' ||
      cleanRc === '0' ||
      cleanRc === 'success';
    if (!isRcSuccess) return false;
  }

  return true;
}

// ────────────────────────────────────────────────────────────────────────────
// 6. Master Inbound Notification Verifier (Fonepay IPN / Callback)
// ────────────────────────────────────────────────────────────────────────────

export function verifyFonepayNotification(
  payload: FonepayNotificationPayload,
  expected: {
    expectedPrn: string;
    expectedAmountPaisa: number | bigint;
    expectedCurrency?: string;
    merchantCode: string;
    secretKey: string;
    currentTransactionStatus: string;
    existingTransactionsWithSameTraceId: number;
  }
): VerificationResult {
  // A. Check required parameters
  if (!payload || !payload.PRN || !payload.PID || !payload.UID || !payload.DV) {
    return {
      valid: false,
      statusCode: 400,
      reason: 'missing_parameters',
      error: 'Missing mandatory Fonepay notification fields (PRN, PID, UID, DV).',
    };
  }

  // B. Merchant Identity Check
  const merchantCheck = validateMerchantIdentity(expected.merchantCode, payload.PID);
  if (!merchantCheck.valid) {
    return {
      valid: false,
      statusCode: 403,
      reason: 'merchant_mismatch',
      error: merchantCheck.error,
    };
  }

  // C. Transaction Identity Check
  const txCheck = validateTransactionIdentity(expected.expectedPrn, payload.PRN);
  if (!txCheck.valid) {
    return {
      valid: false,
      statusCode: 400,
      reason: 'transaction_mismatch',
      error: txCheck.error,
    };
  }

  // D. Payment Status Check
  if (!isSuccessfulFonepayStatus(payload.PS, payload.RC)) {
    return {
      valid: false,
      statusCode: 422,
      reason: 'status_unsuccessful',
      error: `Payment status not successful: PS=${payload.PS}, RC=${payload.RC}`,
    };
  }

  // E. Cryptographic Signature Verification (HMAC-SHA512)
  const expectedSignature = computeNotificationSignature(payload, expected.secretKey);
  const signatureMatches = timingSafeSignatureCompare(payload.DV, expectedSignature);

  if (!signatureMatches) {
    return {
      valid: false,
      statusCode: 401,
      reason: 'signature_mismatch',
      error: 'HMAC-SHA512 signature verification failed. Forged or corrupted payload.',
      details: {
        receivedSignature: payload.DV,
        expectedSignaturePreview: `${expectedSignature.slice(0, 10)}...`,
      },
    };
  }

  // F. Transaction Amount and Currency Check
  const amountCheck = validateTransactionAmount(
    expected.expectedAmountPaisa,
    payload.P_AMT,
    expected.expectedCurrency || 'NPR',
    payload.CRN || 'NPR'
  );
  if (!amountCheck.valid) {
    return {
      valid: false,
      statusCode: 400,
      reason: amountCheck.reason,
      error: amountCheck.error,
    };
  }

  // G. Replay and Duplicate Check
  const replayCheck = validateReplayAndDuplicate({
    currentStatus: expected.currentTransactionStatus,
    incomingTraceId: payload.UID,
    existingTransactionsWithSameTraceId: expected.existingTransactionsWithSameTraceId,
    incomingTimestamp: payload.INI,
  });

  if (!replayCheck.valid) {
    return {
      valid: false,
      statusCode: 409,
      reason: replayCheck.reason,
      error: replayCheck.error,
    };
  }

  return {
    valid: true,
    statusCode: 200,
    reason: replayCheck.isDuplicate ? 'duplicate_notification' : 'valid',
    details: {
      isDuplicate: replayCheck.isDuplicate,
      prn: payload.PRN,
      traceId: payload.UID,
      amountNpr: Number(payload.P_AMT),
    },
  };
}

/**
 * Generates an unguessable, unique Purchase Reference Number (PRN) for Fonepay.
 * Format: SCM<timestamp_base36><random_bytes_hex> (max 25 characters per Fonepay spec).
 */
export function generateUniquePrn(prefix: string = 'SCM'): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  const prn = `${prefix}${ts}${rand}`;
  return prn.slice(0, 25);
}
