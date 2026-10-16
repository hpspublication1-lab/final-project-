/**
 * OmniHandwritingOCR Diagnostic Benchmark & Taxonomy Engine
 * Reference: arXiv:2608.18586 (OmniHandwritingOCR)
 *
 * Implements:
 * 1. Six distinct handwriting evaluation categories for Nepali examination answer scripts.
 * 2. Fine-grained character & word error rates (CER, WER).
 * 3. Exact-match verification for mathematical expressions.
 * 4. Critical symbol precision (>99% threshold for auto-processing).
 * 5. Silent-correction / hallucination detection to prevent generative models
 *    from replacing what the student wrote with what the model thinks they intended.
 */

export type OmniHandwritingCategory =
  | 'english_handwritten_text'
  | 'nepali_devanagari_handwriting'
  | 'mathematical_equations_and_symbols'
  | 'multi_step_numerical_solutions'
  | 'diagrams_labels_and_graphs'
  | 'crossed_out_overwritten_ambiguous';

export interface OmniBenchmarkItem {
  id: string;
  category: OmniHandwritingCategory;
  subject: string;
  gradeLevel: 'SEE_10' | 'NEB_11' | 'NEB_12' | 'CEE_MED' | 'IOE_ENG';
  groundTruthTranscription: string;
  canonicalModelAnswer?: string; // Used to test for silent correction
  criticalSymbols: string[];
  notes?: string;
}

export interface MetricResult {
  cer: number; // Character Error Rate [0, 1]
  wer: number; // Word Error Rate [0, 1]
  mathExactMatch?: boolean;
  criticalSymbolPrecision: number; // [0, 1]
  criticalSymbolsFound: string[];
  criticalSymbolsMissed: string[];
  silentCorrectionDetected: boolean;
  silentCorrectionRisk: number; // [0, 1]
  details: string;
}

export interface CategorySummary {
  category: OmniHandwritingCategory;
  sampleCount: number;
  averageCer: number;
  averageWer: number;
  criticalSymbolAccuracy: number;
  silentCorrectionsFlagged: number;
  readinessForAutonomousScoring: boolean;
}

export interface BenchmarkReport {
  timestamp: string;
  totalSamples: number;
  overallAverageCer: number;
  overallAverageWer: number;
  overallCriticalSymbolAccuracy: number;
  totalSilentCorrectionsFlagged: number;
  autonomousGradingApproved: boolean;
  categorySummaries: CategorySummary[];
  goNoGoRecommendation: string;
}

// ──────────────── Levenshtein Distance Helpers ────────────────

/** Computes Levenshtein edit distance between two sequences */
export function computeEditDistance<T>(a: T[], b: T[]): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

/** Calculates Character Error Rate (CER) */
export function calculateCER(reference: string, hypothesis: string): number {
  const refChars = Array.from(reference.trim());
  const hypChars = Array.from(hypothesis.trim());

  if (refChars.length === 0) {
    return hypChars.length === 0 ? 0 : 1;
  }

  const distance = computeEditDistance(refChars, hypChars);
  return Math.min(1, Math.round((distance / refChars.length) * 1000) / 1000);
}

/** Calculates Word Error Rate (WER) */
export function calculateWER(reference: string, hypothesis: string): number {
  const refWords = reference.trim().split(/\s+/).filter(Boolean);
  const hypWords = hypothesis.trim().split(/\s+/).filter(Boolean);

  if (refWords.length === 0) {
    return hypWords.length === 0 ? 0 : 1;
  }

  const distance = computeEditDistance(refWords, hypWords);
  return Math.min(1, Math.round((distance / refWords.length) * 1000) / 1000);
}

// ──────────────── Math & Critical Symbol Helpers ────────────────

/** Normalizes mathematical expressions for exact-match comparison */
export function normalizeMathExpression(math: string): string {
  let s = math
    .replace(/\\times/g, '*')
    .replace(/\\cdot/g, '*')
    .replace(/\\div/g, '/')
    .replace(/\s+/g, '')
    .toLowerCase();

  // Convert \frac{num}{den} or \frac12 to (num)/(den)
  s = s.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)');
  s = s.replace(/\\frac([0-9])([0-9])/g, '($1)/($2)');

  // Remove remaining redundant LaTeX curly braces
  s = s.replace(/\{([^{}]+)\}/g, '$1');

  // Normalize single-term parentheses e.g. /(d^2) -> /d^2
  s = s.replace(/\(([a-z0-9_\^]+)\)/g, '$1');

  return s;
}

/** Evaluates whether two mathematical expressions match conceptually */
export function checkMathExactMatch(reference: string, hypothesis: string): boolean {
  const normRef = normalizeMathExpression(reference);
  const normHyp = normalizeMathExpression(hypothesis);
  return normRef === normHyp;
}

/**
 * Checks presence of meaning-changing critical symbols
 * e.g., negative signs (-), exponents (^2, 10^-11), decimals (6.67), chemical subscripts (H2O)
 */
export function evaluateCriticalSymbols(
  criticalSymbols: string[],
  hypothesis: string
): { precision: number; found: string[]; missed: string[] } {
  if (criticalSymbols.length === 0) {
    return { precision: 1, found: [], missed: [] };
  }

  const found: string[] = [];
  const missed: string[] = [];
  const normalizedHyp = hypothesis.toLowerCase();

  for (const sym of criticalSymbols) {
    const normSym = sym.toLowerCase().trim();
    if (normalizedHyp.includes(normSym)) {
      found.push(sym);
    } else {
      missed.push(sym);
    }
  }

  const precision = Math.round((found.length / criticalSymbols.length) * 1000) / 1000;
  return { precision, found, missed };
}

// ──────────────── Silent Correction / Hallucination Detection ────────────────

/**
 * Detects whether a generative OCR model silently substituted what it thought
 * the student "should" have written (e.g. from the canonical answer) rather than
 * faithfully transcribing the student's actual handwritten mistake.
 *
 * Example: Student wrote "10^11" (a mistake, missed negative sign).
 * If hypothesis gives "10^-11" and matches canonicalModelAnswer, that is a silent correction!
 */
export function detectSilentCorrection(
  groundTruthWritten: string,
  hypothesisOcr: string,
  canonicalModelAnswer?: string
): { silentCorrectionDetected: boolean; riskScore: number; reason: string } {
  if (!canonicalModelAnswer) {
    return { silentCorrectionDetected: false, riskScore: 0, reason: 'No canonical answer provided for comparison.' };
  }

  const gt = groundTruthWritten.toLowerCase();
  const hyp = hypothesisOcr.toLowerCase();
  const canonical = canonicalModelAnswer.toLowerCase();

  // If hypothesis is identical to ground truth, no silent correction
  if (hyp === gt) {
    return { silentCorrectionDetected: false, riskScore: 0, reason: 'Hypothesis strictly matches student handwriting.' };
  }

  // Look for telltale tokens that exist in canonical model solution, DO NOT exist in student writing,
  // but appeared in the OCR hypothesis.
  const canonicalTokens = canonical.split(/\s+/).filter((w) => w.length > 2);
  const halluTokens: string[] = [];

  for (const token of canonicalTokens) {
    if (!gt.includes(token) && hyp.includes(token)) {
      halluTokens.push(token);
    }
  }

  // Specific check for physics/math negative exponents: e.g. ground truth had "10^11" but hypothesis gave "10^-11"
  const signHallucinated = (gt.includes('10^11') || gt.includes('1011')) && hyp.includes('10^-11');
  if (signHallucinated) {
    halluTokens.push('10^-11 (negative exponent hallucinated from textbook formula)');
  }

  if (halluTokens.length > 0) {
    const riskScore = Math.min(1, Math.round((halluTokens.length * 0.35 + (signHallucinated ? 0.5 : 0)) * 100) / 100);
    return {
      silentCorrectionDetected: true,
      riskScore,
      reason: `Silent correction detected: Model hallucinated canonical tokens (${halluTokens.join(', ')}) absent from student handwriting.`,
    };
  }

  return {
    silentCorrectionDetected: false,
    riskScore: 0,
    reason: 'No evidence of hallucinated model answers.',
  };
}

// ──────────────── Canonical Benchmark Dataset for Nepal Assessments ────────────────

export const CANONICAL_NEPAL_BENCHMARK_SET: OmniBenchmarkItem[] = [
  {
    id: 'bench-eng-01',
    category: 'english_handwritten_text',
    subject: 'Compulsory English',
    gradeLevel: 'SEE_10',
    groundTruthTranscription: 'Education is the key to unlock the golden door of freedom and sustainable prosperity.',
    criticalSymbols: ['education', 'freedom', 'prosperity'],
    notes: 'English cursive handwriting from Grade 10 SEE examination.',
  },
  {
    id: 'bench-dev-02',
    category: 'nepali_devanagari_handwriting',
    subject: 'Nepali',
    gradeLevel: 'SEE_10',
    groundTruthTranscription: 'नेपाल एक भूपरिवेष्ठित र जैविक विविधताले भरिपूर्ण सुन्दर देश हो।',
    criticalSymbols: ['भूपरिवेष्ठित', 'जैविक', 'विविधता'],
    notes: 'Nepali Devanagari script with conjunct consonants (भूपरिवेष्ठित).',
  },
  {
    id: 'bench-math-03',
    category: 'mathematical_equations_and_symbols',
    subject: 'Compulsory Science (Physics)',
    gradeLevel: 'SEE_10',
    groundTruthTranscription: 'F = G * (M * m) / d^2',
    canonicalModelAnswer: 'F = G * (M * m) / d^2',
    criticalSymbols: ['F', 'G', 'M', 'm', 'd^2', '/'],
    notes: 'Universal gravitation formula with exponent d^2.',
  },
  {
    id: 'bench-num-04',
    category: 'multi_step_numerical_solutions',
    subject: 'Compulsory Science',
    gradeLevel: 'SEE_10',
    groundTruthTranscription: 'd = 6400 + 400 = 6800 km = 6.8 * 10^6 m. F = (6.67 * 10^-11 * 6 * 10^24 * 100) / (6.8 * 10^6)^2 = 865.5 N',
    canonicalModelAnswer: 'F = 865.5 N',
    criticalSymbols: ['6800 km', '6.8 * 10^6', '10^-11', '10^24', '865.5 N'],
    notes: 'Multi-step numerical substitution with scientific notation.',
  },
  {
    id: 'bench-dia-05',
    category: 'diagrams_labels_and_graphs',
    subject: 'Biology',
    gradeLevel: 'NEB_11',
    groundTruthTranscription: 'Diagram of stomata: Guard cells, Stomatal pore, Chloroplast, Epidermal cells.',
    criticalSymbols: ['guard cells', 'stomatal pore', 'chloroplast'],
    notes: 'Hand-drawn botanical diagram labels.',
  },
  {
    id: 'bench-amb-06',
    category: 'crossed_out_overwritten_ambiguous',
    subject: 'Chemistry',
    gradeLevel: 'CEE_MED',
    groundTruthTranscription: 'Reaction: 2H2 + O2 -> 2H2O (earlier written H2O2 was crossed out)',
    canonicalModelAnswer: '2H2 + O2 -> 2H2O',
    criticalSymbols: ['2H2', 'O2', '2H2O'],
    notes: 'Crossed-out intermediate product (H2O2) must not be graded as final answer.',
  },
];

// ──────────────── Benchmark Evaluation Runner ────────────────

/**
 * Runs the OmniHandwritingOCR benchmark over a set of items using a provided OCR function.
 */
export async function runOmniHandwritingBenchmark(
  transcriberFn: (item: OmniBenchmarkItem) => Promise<string>,
  benchmarkSet: OmniBenchmarkItem[] = CANONICAL_NEPAL_BENCHMARK_SET
): Promise<BenchmarkReport> {
  const categoryMap = new Map<
    OmniHandwritingCategory,
    {
      samples: number;
      cerSum: number;
      werSum: number;
      criticalAccSum: number;
      silentCorrections: number;
    }
  >();

  let totalCer = 0;
  let totalWer = 0;
  let totalCritPrecision = 0;
  let totalSilent = 0;

  for (const item of benchmarkSet) {
    const hypothesis = await transcriberFn(item);
    const cer = calculateCER(item.groundTruthTranscription, hypothesis);
    const wer = calculateWER(item.groundTruthTranscription, hypothesis);
    const crit = evaluateCriticalSymbols(item.criticalSymbols, hypothesis);
    const silent = detectSilentCorrection(
      item.groundTruthTranscription,
      hypothesis,
      item.canonicalModelAnswer
    );

    totalCer += cer;
    totalWer += wer;
    totalCritPrecision += crit.precision;
    if (silent.silentCorrectionDetected) totalSilent++;

    if (!categoryMap.has(item.category)) {
      categoryMap.set(item.category, {
        samples: 0,
        cerSum: 0,
        werSum: 0,
        criticalAccSum: 0,
        silentCorrections: 0,
      });
    }

    const catData = categoryMap.get(item.category)!;
    catData.samples++;
    catData.cerSum += cer;
    catData.werSum += wer;
    catData.criticalAccSum += crit.precision;
    if (silent.silentCorrectionDetected) catData.silentCorrections++;
  }

  const n = benchmarkSet.length;
  const overallAvgCer = Math.round((totalCer / n) * 1000) / 1000;
  const overallAvgWer = Math.round((totalWer / n) * 1000) / 1000;
  const overallCritAcc = Math.round((totalCritPrecision / n) * 1000) / 1000;

  const categorySummaries: CategorySummary[] = Array.from(categoryMap.entries()).map(
    ([category, data]) => {
      const avgCer = Math.round((data.cerSum / data.samples) * 1000) / 1000;
      const avgWer = Math.round((data.werSum / data.samples) * 1000) / 1000;
      const critAcc = Math.round((data.criticalAccSum / data.samples) * 1000) / 1000;

      // Readiness rule: CER <= 0.05, Critical accuracy >= 0.99, 0 silent corrections
      const ready = avgCer <= 0.05 && critAcc >= 0.99 && data.silentCorrections === 0;

      return {
        category,
        sampleCount: data.samples,
        averageCer: avgCer,
        averageWer: avgWer,
        criticalSymbolAccuracy: critAcc,
        silentCorrectionsFlagged: data.silentCorrections,
        readinessForAutonomousScoring: ready,
      };
    }
  );

  // Overall readiness: all categories ready and overall critical accuracy >= 99%
  const autonomousApproved =
    categorySummaries.every((c) => c.readinessForAutonomousScoring) && overallCritAcc >= 0.99;

  let recommendation = '';
  if (autonomousApproved) {
    recommendation = 'APPROVED: OCR system meets strict board examination threshold (>99% critical symbol accuracy).';
  } else {
    recommendation =
      'HUMAN REVIEW MANDATORY: AI evaluations must remain formative. Any uncertain tokens or silent correction risks require faculty verification before publication.';
  }

  return {
    timestamp: new Date().toISOString(),
    totalSamples: n,
    overallAverageCer: overallAvgCer,
    overallAverageWer: overallAvgWer,
    overallCriticalSymbolAccuracy: overallCritAcc,
    totalSilentCorrectionsFlagged: totalSilent,
    autonomousGradingApproved: autonomousApproved,
    categorySummaries,
    goNoGoRecommendation: recommendation,
  };
}
