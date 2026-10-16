import { describe, it, expect } from 'vitest';
import {
  analyzeTranscriptionUncertainties,
  executeDifferenceAwareWorkflow,
} from '../differenceAwareOcr';

describe('Difference-Aware OCR & Meaning-Changing Symbol Engine (SP-DocReader Inspired)', () => {
  describe('Non-Interchangeable Algebraic Expressions (x², x² + 1, x² − 1)', () => {
    it('detects that x² + 1 and x² - 1 contain meaning-changing sign operators that alter algebraic roots', () => {
      const exprPlus = 'The quadratic equation simplifies to x² + 1 = 0';
      const analysisPlus = analyzeTranscriptionUncertainties(exprPlus);

      expect(analysisPlus.hasMeaningChangingUncertainties).toBe(true);
      const signTokenPlus = analysisPlus.uncertainTokens.find((t) => t.category === 'sign_operator');
      expect(signTokenPlus).toBeDefined();
      expect(signTokenPlus!.token).toBe('+');
      expect(signTokenPlus!.meaningChangingRisk).toBe('high');
      expect(signTokenPlus!.reason).toContain('alters identity and roots');

      const exprMinus = 'The expression factors as x² - 1 = (x - 1)(x + 1)';
      const analysisMinus = analyzeTranscriptionUncertainties(exprMinus);

      expect(analysisMinus.hasMeaningChangingUncertainties).toBe(true);
      const signTokenMinus = analysisMinus.uncertainTokens.find((t) => t.category === 'sign_operator');
      expect(signTokenMinus).toBeDefined();
      expect(signTokenMinus!.token).toBe('-');
      expect(signTokenMinus!.meaningChangingRisk).toBe('high');
    });

    it('distinguishes pure x² from modified polynomial expressions', () => {
      const pureX2 = 'The function is f(x) = x² where domain is all real numbers';
      const analysis = analyzeTranscriptionUncertainties(pureX2);

      // Pure x² without operators has lower meaning-changing risk
      const signTokens = analysis.uncertainTokens.filter((t) => t.category === 'sign_operator');
      expect(signTokens.length).toBe(0);
    });
  });

  describe('Scientific Exponents & Negative Signs in Physics (G = 6.67 × 10^-11 vs 10^11)', () => {
    it('flags missing minus sign in gravitation constant as a high-risk meaning-changing transcription error', () => {
      // Common OCR error: OCR reads 10^11 instead of 10^-11
      const faultyOcr = 'Gravitational force calculation: G = 6.67 × 10^11 N m²/kg²';
      const analysis = analyzeTranscriptionUncertainties(faultyOcr, {
        subject: 'Physics',
        questionContext: 'Universal Law of Gravitation (G = 6.67 × 10^-11)',
      });

      expect(analysis.requiresHumanReview).toBe(true);
      expect(analysis.overallRisk).toBe('high');
      expect(analysis.routingDecision).toBe('teacher_review_required');

      const exponentToken = analysis.uncertainTokens.find((t) => t.category === 'exponent_power');
      expect(exponentToken).toBeDefined();
      expect(exponentToken!.potentialAlternatives).toContain('-11');

      // Suggested correction should be populated
      expect(analysis.suggestedCorrections.length).toBeGreaterThan(0);
      expect(analysis.suggestedCorrections[0].suggestedSnippet).toBe('10^-11');
    });
  });

  describe('Missing Decimal Points (e.g. 667 × 10 vs 6.67 × 10^-11)', () => {
    it('flags integer-looking scientific pre-factors where a decimal point was likely omitted by OCR', () => {
      const missingDotOcr = 'Force calculation with G = 667 × 10^-11';
      const analysis = analyzeTranscriptionUncertainties(missingDotOcr);

      expect(analysis.hasMeaningChangingUncertainties).toBe(true);
      const decToken = analysis.uncertainTokens.find((t) => t.category === 'decimal_point');
      expect(decToken).toBeDefined();
      expect(decToken!.token).toBe('667');
      expect(decToken!.potentialAlternatives).toContain('6.67');
      expect(decToken!.meaningChangingRisk).toBe('high');
    });
  });

  describe('Complete 6-Step Workflow Execution', () => {
    it('preserves the original image and routes uncertain transcriptions to teacher review ticket', () => {
      const output = executeDifferenceAwareWorkflow({
        answerId: 'ans_see_101',
        originalImageUrl: 'https://storage.samyaktutor.com/student-answers/see-101.jpg',
        generatedTranscription: 'LHS = x² - 1 = (x+1)(x-1). Force G = 6.67 × 10^11',
        subjectCategory: 'Physics & Math',
        questionContext: 'Gravitation G = 6.67 × 10^-11 and algebra factorization',
      });

      // Step 1: Image preserved
      expect(output.imagePreserved).toBe(true);
      expect(output.imageProvenance.sourceType).toBe('url');
      expect(output.imageProvenance.identifier).toContain('see-101.jpg');
      expect(output.imageProvenance.timestamp).toBeTruthy();

      // Step 2: Transcription recorded
      expect(output.transcription).toContain('x² - 1');

      // Step 3 & 4: Analysis conducted
      expect(output.analysis.criticalTokensFound).toBeGreaterThan(0);
      expect(output.analysis.requiresHumanReview).toBe(true);

      // Step 5: Routed to human reviewer
      expect(output.evaluationState).toBe('held_for_human_review');
      expect(output.humanReviewTicket).toBeDefined();
      expect(output.humanReviewTicket!.priority).toBe('high');
      expect(output.humanReviewTicket!.teacherInstruction).toContain('handwritten photo');

      // Step 6: Audit trail complete
      expect(output.auditTrail.length).toBe(5);
      expect(output.workflowStep).toBe(6);
    });

    it('allows direct rubric evaluation when transcription has high confidence and no meaning-changing ambiguities', () => {
      const cleanOutput = executeDifferenceAwareWorkflow({
        answerId: 'ans_clean_202',
        originalImageUrl: 'https://storage.samyaktutor.com/clean.jpg',
        generatedTranscription: 'Photosynthesis is the process where green plants manufacture glucose from CO2 and water using sunlight and chlorophyll.',
        subjectCategory: 'Biology',
        questionContext: 'Photosynthesis process',
        rawConfidence: 98,
      });

      expect(cleanOutput.imagePreserved).toBe(true);
      expect(cleanOutput.analysis.requiresHumanReview).toBe(false);
      expect(cleanOutput.evaluationState).toBe('ready_for_rubric');
      expect(cleanOutput.humanReviewTicket).toBeUndefined();
    });
  });
});
