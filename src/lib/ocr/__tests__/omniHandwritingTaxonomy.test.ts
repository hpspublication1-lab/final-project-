import { describe, it, expect } from 'vitest';
import {
  calculateCER,
  calculateWER,
  checkMathExactMatch,
  evaluateCriticalSymbols,
  detectSilentCorrection,
  runOmniHandwritingBenchmark,
  CANONICAL_NEPAL_BENCHMARK_SET,
  OmniBenchmarkItem,
} from '../omniHandwritingTaxonomy';

describe('OmniHandwritingOCR Benchmark & Taxonomy Engine', () => {
  describe('CER & WER Metrics', () => {
    it('calculates 0 CER and WER for identical strings', () => {
      const text = 'Newton universal law of gravitation';
      expect(calculateCER(text, text)).toBe(0);
      expect(calculateWER(text, text)).toBe(0);
    });

    it('correctly calculates CER for character substitution and deletion', () => {
      const ref = 'cat';
      const hyp = 'car';
      expect(calculateCER(ref, hyp)).toBeCloseTo(0.333, 2);
    });

    it('correctly handles empty strings', () => {
      expect(calculateCER('', '')).toBe(0);
      expect(calculateCER('hello', '')).toBe(1);
      expect(calculateWER('hello world', '')).toBe(1);
    });

    it('handles Nepali Devanagari script accurately', () => {
      const ref = 'नेपाल सुन्दर देश हो';
      const hyp = 'नेपाल सुन्दर देश हो';
      expect(calculateCER(ref, hyp)).toBe(0);

      const mistranscribed = 'नेपाल सन्दुर देश हो'; // typo in सुन्दर
      expect(calculateCER(ref, mistranscribed)).toBeGreaterThan(0);
    });
  });

  describe('Mathematical Expressions Exact Match', () => {
    it('recognizes conceptually equivalent math expressions despite spacing and LaTeX variations', () => {
      const ref = 'F = G \\times \\frac{M \\times m}{d^2}';
      const hyp = 'F = G * (M * m) / d^2';
      expect(checkMathExactMatch(ref, hyp)).toBe(true);
    });

    it('rejects mathematically incorrect expressions', () => {
      const ref = 'F = G * (M * m) / d^2';
      const wrong = 'F = G * (M * m) / d'; // missing square
      expect(checkMathExactMatch(ref, wrong)).toBe(false);
    });
  });

  describe('Critical Symbol Accuracy (>99% threshold)', () => {
    it('detects all critical symbols when present', () => {
      const criticalSymbols = ['6800 km', '10^-11', '865.5 N'];
      const text = 'The distance is 6800 km, G is 6.67 * 10^-11 and force is 865.5 N.';
      const res = evaluateCriticalSymbols(criticalSymbols, text);

      expect(res.precision).toBe(1);
      expect(res.found).toHaveLength(3);
      expect(res.missed).toHaveLength(0);
    });

    it('accurately identifies missed critical symbols', () => {
      const criticalSymbols = ['10^-11', 'd^2', 'H2O'];
      const text = 'G is 10^11 and formula has d.'; // missing negative sign and square
      const res = evaluateCriticalSymbols(criticalSymbols, text);

      expect(res.precision).toBeCloseTo(0, 1);
      expect(res.missed).toContain('10^-11');
      expect(res.missed).toContain('d^2');
    });
  });

  describe('Silent Correction / Hallucination Detection', () => {
    it('flags when model silently introduces textbook answers absent from student handwriting', () => {
      const studentHandwriting = 'G = 6.67 * 10^11 and F = G * M * m / d';
      const canonicalSolution = 'G = 6.67 * 10^-11 and F = G * M * m / d^2';
      // Model hallucinated 10^-11 and d^2 even though student wrote 10^11 and / d
      const ocrHypothesis = 'G = 6.67 * 10^-11 and F = G * M * m / d^2';

      const result = detectSilentCorrection(studentHandwriting, ocrHypothesis, canonicalSolution);

      expect(result.silentCorrectionDetected).toBe(true);
      expect(result.riskScore).toBeGreaterThan(0.5);
      expect(result.reason).toContain('Silent correction detected');
    });

    it('does not flag when model faithfully transcribes what was written', () => {
      const studentHandwriting = 'G = 6.67 * 10^11 and F = G * M * m / d';
      const canonicalSolution = 'G = 6.67 * 10^-11 and F = G * M * m / d^2';
      const ocrHypothesis = 'G = 6.67 * 10^11 and F = G * M * m / d';

      const result = detectSilentCorrection(studentHandwriting, ocrHypothesis, canonicalSolution);

      expect(result.silentCorrectionDetected).toBe(false);
      expect(result.riskScore).toBe(0);
    });
  });

  describe('Benchmark Evaluation Harness', () => {
    it('evaluates all 6 categories across Nepal benchmark set', async () => {
      // Mock perfect transcriber
      const perfectTranscriber = async (item: OmniBenchmarkItem) => item.groundTruthTranscription;

      const report = await runOmniHandwritingBenchmark(
        perfectTranscriber,
        CANONICAL_NEPAL_BENCHMARK_SET
      );

      expect(report.totalSamples).toBe(6);
      expect(report.overallAverageCer).toBe(0);
      expect(report.overallCriticalSymbolAccuracy).toBe(1);
      expect(report.totalSilentCorrectionsFlagged).toBe(0);
      expect(report.autonomousGradingApproved).toBe(true);
      expect(report.categorySummaries).toHaveLength(6);
    });

    it('recommends human review when noisy transcriber fails critical symbol threshold', async () => {
      // Mock noisy transcriber that drops exponents and critical tokens
      const noisyTranscriber = async (item: OmniBenchmarkItem) =>
        item.groundTruthTranscription.replace(/[0-9\^]/g, '');

      const report = await runOmniHandwritingBenchmark(
        noisyTranscriber,
        CANONICAL_NEPAL_BENCHMARK_SET
      );

      expect(report.overallCriticalSymbolAccuracy).toBeLessThan(0.99);
      expect(report.autonomousGradingApproved).toBe(false);
      expect(report.goNoGoRecommendation).toContain('HUMAN REVIEW MANDATORY');
    });
  });
});
