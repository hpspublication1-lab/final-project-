import { describe, it, expect, beforeEach } from 'vitest';
import {
  sanitizeStudentSubmissionForAI,
  createAssessmentAuditRecord,
  submitStudentAppeal,
  resolveStudentAppeal,
  getPendingAppeals,
  clearAppealsState,
} from '../assessmentIntegrity';

describe('Assessment Integrity & Student Safety Engine', () => {
  beforeEach(() => {
    clearAppealsState();
  });

  describe('PII Sanitization & Data Minimization', () => {
    it('sanitizes phone numbers and emails before AI prompt compilation', () => {
      const studentInput =
        'My name is Ramesh (ramesh.98@gmail.com, phone: +977-9841234567). F = G*M*m/d^2.';
      const res = sanitizeStudentSubmissionForAI(studentInput);

      expect(res.piiStripped).toBe(true);
      expect(res.sanitizedText).not.toContain('+977-9841234567');
      expect(res.sanitizedText).not.toContain('ramesh.98@gmail.com');
      expect(res.sanitizedText).toContain('[PHONE_REDACTED]');
      expect(res.sanitizedText).toContain('[EMAIL_REDACTED]');
      expect(res.sanitizedText).toContain('F = G*M*m/d^2');
    });

    it('sanitizes exam roll numbers', () => {
      const input = 'Roll No: 2081AB994. Photosynthesis takes place in chloroplasts.';
      const res = sanitizeStudentSubmissionForAI(input);

      expect(res.piiStripped).toBe(true);
      expect(res.sanitizedText).toContain('Roll: [REDACTED]');
      expect(res.sanitizedText).toContain('Photosynthesis takes place in chloroplasts.');
    });

    it('leaves clean academic text untouched', () => {
      const input = 'Carbon dioxide and water combine to form glucose and oxygen.';
      const res = sanitizeStudentSubmissionForAI(input);

      expect(res.piiStripped).toBe(false);
      expect(res.sanitizedText).toBe(input);
    });
  });

  describe('Immutable Audit Trail Generation', () => {
    it('creates tamper-evident audit record with enforced formative status', () => {
      const audit = createAssessmentAuditRecord({
        evaluationId: 'eval-1234',
        questionId: 'see-sci-03',
        studentId: 'student-99',
        ocrLegibilityScore: 92,
        differenceAwareRisk: 'low',
        obtainedMarks: 3.5,
      });

      expect(audit.isFormativeDraft).toBe(true);
      expect(audit.auditId).toMatch(/^audit-/);
      expect(audit.auditSignature).toBeDefined();
      expect(audit.anonymizedStudentHash).toHaveLength(16);
      expect(audit.anonymizedStudentHash).not.toContain('student-99');
    });
  });

  describe('Student Appeals & Dispute Flow', () => {
    it('creates a pending appeal ticket when valid rationale is provided', () => {
      const ticket = submitStudentAppeal({
        evaluationId: 'eval-1234',
        questionId: 'see-sci-03',
        studentId: 'student-99',
        studentRationale: 'The OCR transcribed 6800 km as 6000 km, causing a point deduction in calculation.',
        category: 'ocr_misread',
        originalMarksAwarded: 3,
        totalPossibleMarks: 4,
      });

      expect(ticket.status).toBe('pending_faculty_review');
      expect(ticket.appealId).toMatch(/^appeal-/);

      const pending = getPendingAppeals();
      expect(pending).toHaveLength(1);
      expect(pending[0].appealId).toBe(ticket.appealId);
    });

    it('rejects appeal with frivolous or empty rationale', () => {
      expect(() =>
        submitStudentAppeal({
          evaluationId: 'eval-1234',
          questionId: 'see-sci-03',
          studentId: 'student-99',
          studentRationale: 'Give mark',
          category: 'partial_credit_dispute',
          originalMarksAwarded: 2,
          totalPossibleMarks: 4,
        })
      ).toThrow('minimum 10 characters');
    });

    it('resolves an appeal when faculty overrides marks', () => {
      const ticket = submitStudentAppeal({
        evaluationId: 'eval-1234',
        questionId: 'see-sci-03',
        studentId: 'student-99',
        studentRationale: 'The calculation step was actually correct in my original handwriting.',
        category: 'ocr_misread',
        originalMarksAwarded: 3,
        totalPossibleMarks: 4,
      });

      const resolved = resolveStudentAppeal({
        appealId: ticket.appealId,
        facultyReviewerId: 'teacher-sharma@samyak.edu.np',
        action: 'override',
        newMarks: 4,
        resolutionNotes: 'Verified original answer paper photo. Handwritten 6800 km was misread by OCR.',
      });

      expect(resolved.status).toBe('resolved_overridden');
      expect(resolved.finalTeacherMarks).toBe(4);
      expect(resolved.facultyResolutionNotes).toContain('Verified original answer paper');
      expect(getPendingAppeals()).toHaveLength(0);
    });
  });
});
