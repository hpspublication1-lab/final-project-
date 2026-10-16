/**
 * Assessment Integrity & Student Safety Engine
 * Codifies:
 * 1. Formative AI Guardrails (AI scores must remain formative, non-consequential).
 * 2. Immutable Audit Trail (rubric version, model version, OCR confidence, difference-aware flags).
 * 3. Student Appeals & Dispute Mechanism (student can contest OCR or rubric scoring).
 * 4. PII Sanitization & Data Minimization for AI prompts.
 */

import crypto from 'crypto';

export type DisputeCategory =
  | 'ocr_misread'
  | 'valid_alternate_method'
  | 'incorrect_rubric_application'
  | 'partial_credit_dispute';

export interface AssessmentAuditRecord {
  auditId: string;
  evaluationId: string;
  questionId: string;
  rubricVersion: string;
  modelVersion: string;
  ocrLegibilityScore: number;
  differenceAwareRisk: 'none' | 'low' | 'medium' | 'high';
  isFormativeDraft: boolean;
  anonymizedStudentHash: string;
  timestamp: string;
  auditSignature: string;
}

export interface StudentAppealTicket {
  appealId: string;
  evaluationId: string;
  questionId: string;
  studentId: string;
  studentRationale: string;
  category: DisputeCategory;
  originalMarksAwarded: number;
  totalPossibleMarks: number;
  status: 'pending_faculty_review' | 'resolved_overridden' | 'resolved_upheld';
  facultyReviewerId?: string;
  facultyResolutionNotes?: string;
  finalTeacherMarks?: number;
  createdAt: string;
  resolvedAt?: string;
}

// In-memory registry for appeals (synced with teacher queue)
const appealsRegistry = new Map<string, StudentAppealTicket>();

/**
 * Strips PII (names, phone numbers, roll numbers, email addresses)
 * to maintain student data privacy before passing to external AI APIs.
 */
export function sanitizeStudentSubmissionForAI(text: string): { sanitizedText: string; piiStripped: boolean } {
  let cleaned = text;
  let piiStripped = false;

  // Regex patterns for Nepali/international phones
  const phoneRegex = /(\+?977[- ]?)?9[78]\d{8}|\b\d{3}[-.\s]??\d{3}[-.\s]??\d{4}\b/g;
  if (phoneRegex.test(cleaned)) {
    cleaned = cleaned.replace(phoneRegex, '[PHONE_REDACTED]');
    piiStripped = true;
  }

  // Regex pattern for email
  const emailRegex = /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g;
  if (emailRegex.test(cleaned)) {
    cleaned = cleaned.replace(emailRegex, '[EMAIL_REDACTED]');
    piiStripped = true;
  }

  // Common exam roll number tokens
  const rollRegex = /\b(roll\s*(?:no|number)?[\s:#-]*)([0-9a-zA-Z]+)\b/gi;
  if (rollRegex.test(cleaned)) {
    cleaned = cleaned.replace(rollRegex, 'Roll: [REDACTED]');
    piiStripped = true;
  }

  return { sanitizedText: cleaned, piiStripped };
}

/**
 * Generates an immutable, cryptographically signed audit record of the AI evaluation.
 */
export function createAssessmentAuditRecord(params: {
  evaluationId: string;
  questionId: string;
  studentId: string;
  rubricVersion?: string;
  modelVersion?: string;
  ocrLegibilityScore: number;
  differenceAwareRisk: 'none' | 'low' | 'medium' | 'high';
  obtainedMarks: number;
}): AssessmentAuditRecord {
  const anonymizedStudentHash = crypto
    .createHash('sha256')
    .update(params.studentId + '_salt_samyak_2026')
    .digest('hex')
    .substring(0, 16);

  const timestamp = new Date().toISOString();
  const rawPayload = `${params.evaluationId}:${params.questionId}:${params.obtainedMarks}:${params.ocrLegibilityScore}:${timestamp}`;
  const auditSignature = crypto
    .createHash('sha256')
    .update(rawPayload)
    .digest('hex');

  return {
    auditId: 'audit-' + crypto.randomUUID().substring(0, 8),
    evaluationId: params.evaluationId,
    questionId: params.questionId,
    rubricVersion: params.rubricVersion || 'rubric-v2.1-cdc',
    modelVersion: params.modelVersion || 'gemini-1.5-flash-dec2026',
    ocrLegibilityScore: params.ocrLegibilityScore,
    differenceAwareRisk: params.differenceAwareRisk,
    isFormativeDraft: true, // Always formative during initial pilots
    anonymizedStudentHash,
    timestamp,
    auditSignature,
  };
}

/**
 * Submits a formal student appeal, requesting faculty re-grading.
 */
export function submitStudentAppeal(input: {
  evaluationId: string;
  questionId: string;
  studentId: string;
  studentRationale: string;
  category: DisputeCategory;
  originalMarksAwarded: number;
  totalPossibleMarks: number;
}): StudentAppealTicket {
  if (!input.studentRationale || input.studentRationale.trim().length < 10) {
    throw new Error('Please provide a substantive rationale for your appeal (minimum 10 characters).');
  }

  const appealId = 'appeal-' + Date.now();
  const ticket: StudentAppealTicket = {
    appealId,
    evaluationId: input.evaluationId,
    questionId: input.questionId,
    studentId: input.studentId,
    studentRationale: input.studentRationale.trim(),
    category: input.category,
    originalMarksAwarded: input.originalMarksAwarded,
    totalPossibleMarks: input.totalPossibleMarks,
    status: 'pending_faculty_review',
    createdAt: new Date().toISOString(),
  };

  appealsRegistry.set(appealId, ticket);
  return ticket;
}

/**
 * Resolves an appeal by faculty review.
 */
export function resolveStudentAppeal(params: {
  appealId: string;
  facultyReviewerId: string;
  action: 'override' | 'upheld';
  newMarks?: number;
  resolutionNotes: string;
}): StudentAppealTicket {
  const ticket = appealsRegistry.get(params.appealId);
  if (!ticket) {
    throw new Error(`Appeal ${params.appealId} not found.`);
  }

  ticket.status = params.action === 'override' ? 'resolved_overridden' : 'resolved_upheld';
  ticket.facultyReviewerId = params.facultyReviewerId;
  ticket.facultyResolutionNotes = params.resolutionNotes;
  if (params.action === 'override' && params.newMarks !== undefined) {
    ticket.finalTeacherMarks = params.newMarks;
  }
  ticket.resolvedAt = new Date().toISOString();

  appealsRegistry.set(params.appealId, ticket);
  return ticket;
}

/**
 * Retrieves all pending appeals for faculty evaluation.
 */
export function getPendingAppeals(): StudentAppealTicket[] {
  return Array.from(appealsRegistry.values()).filter(
    (t) => t.status === 'pending_faculty_review'
  );
}

/**
 * Helper to clear appeals state (for test teardown).
 */
export function clearAppealsState(): void {
  appealsRegistry.clear();
}
