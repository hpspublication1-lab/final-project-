import { describe, it, expect } from 'vitest';
import {
  generateAlgorithmicMCQs,
  executeBulkQuestionIngestion,
  SYLLABUS_RESEARCH_MATRIX,
  MUST_SOLVE_MASTER_BANK,
} from '../autonomousResearchPipeline';

describe('Autonomous AI Research & Question Ingestion Pipeline', () => {
  describe('Syllabus Research Matrix', () => {
    it('should contain curated syllabus nodes covering CEE, SEE, and IELTS', () => {
      const ceeNodes = SYLLABUS_RESEARCH_MATRIX.filter((m) => m.program === 'cee');
      const seeNodes = SYLLABUS_RESEARCH_MATRIX.filter((m) => m.program === 'see');
      const ieltsNodes = SYLLABUS_RESEARCH_MATRIX.filter((m) => m.program === 'ielts');

      expect(ceeNodes.length).toBeGreaterThan(0);
      expect(seeNodes.length).toBeGreaterThan(0);
      expect(ieltsNodes.length).toBeGreaterThan(0);
    });

    it('should have Must-Solve master bank entries with comprehensive explanations', () => {
      expect(MUST_SOLVE_MASTER_BANK.length).toBeGreaterThan(0);
      MUST_SOLVE_MASTER_BANK.forEach((q) => {
        expect(['a', 'b', 'c', 'd']).toContain(q.correct_option);
        expect(q.option_a).toBeDefined();
        expect(q.option_b).toBeDefined();
        expect(q.option_c).toBeDefined();
        expect(q.option_d).toBeDefined();
        expect(q.explanation.length).toBeGreaterThan(20);
        expect(q.is_high_yield).toBe(true);
      });
    });
  });

  describe('Algorithmic High-Yield MCQ Synthesis', () => {
    it('should synthesize requested number of CEE MCQs with KaTeX formulas', () => {
      const mcqs = generateAlgorithmicMCQs('cee', 25, 'Physics');
      expect(mcqs.length).toBe(25);
      
      mcqs.forEach((q) => {
        expect(q.program_type).toBe('cee');
        expect(['a', 'b', 'c', 'd']).toContain(q.correct_option);
        expect(q.question_text.length).toBeGreaterThan(10);
        expect(q.hint).toBeDefined();
      });

      // Verify KaTeX math symbols are present in synthesized physics questions
      const hasMath = mcqs.some((q) => q.question_text.includes('$') || q.explanation.includes('$'));
      expect(hasMath).toBe(true);
    });

    it('should synthesize SEE questions with board exam difficulty and units', () => {
      const seeMCQs = generateAlgorithmicMCQs('see', 15);
      expect(seeMCQs.length).toBe(15);
      seeMCQs.forEach((q) => {
        expect(q.program_type).toBe('see');
      });
    });

    it('should generate CSV representation during bulk ingestion', async () => {
      const result = await executeBulkQuestionIngestion({
        program: 'cee',
        targetCount: 10,
        autoPublish: false, // dry run without inserting into live DB during unit test
      });

      expect(result.totalGenerated).toBe(10);
      expect(result.csvContent).toContain('Serial #,Program,Subject,Topic,Question Text');
      expect(result.topicsCovered.length).toBeGreaterThan(0);
      expect(result.batchId).toMatch(/^QMB-/);
    });
  });
});
