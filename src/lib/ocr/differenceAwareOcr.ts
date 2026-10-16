/**
 * Samyak Guru — Difference-Aware OCR & Meaning-Changing Symbol Verification Engine
 *
 * Implements the practical engineering lessons from SP-DocReader (arXiv:2610.11148):
 * - Focus on the errors that matter rather than blindly trusting raw transcription.
 * - Non-interchangeable mathematical expressions (e.g., x², x² + 1, x² − 1) must be strictly
 *   analyzed: a single character error (minus sign, exponent, decimal point, or operator)
 *   changes the fundamental meaning and skews assigned marks.
 *
 * 6-STEP WORKFLOW:
 * 1. Preserve the original answer image.
 * 2. Generate a transcription.
 * 3. Identify uncertain characters and symbols (critical operators, exponents, decimals, signs).
 * 4. Compare transcription against mathematical and scientific context.
 * 5. Route uncertain or meaning-changing cases to a human reviewer.
 * 6. Only then evaluate the answer against the rubric.
 */

export type MeaningChangingRiskLevel = 'none' | 'low' | 'medium' | 'high';

export type CriticalSymbolCategory =
  | 'sign_operator'   // +, -, ±, ×, /, =
  | 'exponent_power'  // ², ³, ^n, 10^-11, 10^20
  | 'decimal_point'   // ., 2.01 vs 201
  | 'subscript_formula' // CO₂, H₂O, m₁, m₂
  | 'variable_expression'; // x², x² + 1, x² - 1

export interface UncertainToken {
  token: string;
  category: CriticalSymbolCategory;
  index: number;
  snippet: string;
  confidence: number; // 0 - 100
  potentialAlternatives: string[];
  meaningChangingRisk: MeaningChangingRiskLevel;
  reason: string;
}

export interface DifferenceAwareAnalysisResult {
  hasMeaningChangingUncertainties: boolean;
  overallRisk: MeaningChangingRiskLevel;
  criticalTokensFound: number;
  uncertainTokens: UncertainToken[];
  contextSanityChecks: Array<{
    checkName: string;
    passed: boolean;
    details: string;
  }>;
  suggestedCorrections: Array<{
    originalSnippet: string;
    suggestedSnippet: string;
    rationale: string;
  }>;
  requiresHumanReview: boolean;
  routingDecision: 'automated_rubric_allowed' | 'teacher_review_required';
  routingReason: string;
}

export interface DifferenceAwareWorkflowParams {
  answerId: string;
  originalImageUrl?: string;
  originalImageBase64?: string;
  generatedTranscription: string;
  subjectCategory?: string;
  questionContext?: string;
  rawConfidence?: number;
}

export interface DifferenceAwareWorkflowOutput {
  workflowStep: 6;
  answerId: string;
  imagePreserved: boolean;
  imageProvenance: {
    sourceType: 'url' | 'base64' | 'text_only';
    identifier: string;
    timestamp: string;
  };
  transcription: string;
  analysis: DifferenceAwareAnalysisResult;
  evaluationState: 'ready_for_rubric' | 'held_for_human_review';
  humanReviewTicket?: {
    ticketId: string;
    priority: 'high' | 'medium' | 'normal';
    flaggedTokens: string[];
    teacherInstruction: string;
  };
  auditTrail: string[];
}

// ── REGEX PATTERNS FOR MEANING-CHANGING TOKENS ────────────────────────────────
const EXPONENT_PATTERN = /(\b[a-zA-Z]\s*[\^²³]|10\s*[\^²³]|10\s*\^\s*[-+]?\d+|\b[x-z]\s*²|\b[x-z]\s*³)/gi;
const ALGEBRAIC_EXPRESSION_PATTERN = /\b([a-zA-Z]\s*[\^²³]\s*([+-]\s*\d+)?)\b/g;
const SIGN_OPERATOR_PATTERN = /([+\-±×*÷=≠≈<>≤≥])/g;
const DECIMAL_NUMBER_PATTERN = /\b\d+\.\d+\b/g;
const MISSING_DECIMAL_SUSPECT_PATTERN = /\b(667|201|384)\s*×\s*10/g; // e.g. 667 × 10 instead of 6.67 × 10^-11
const SCIENTIFIC_POWERS_OF_TEN_PATTERN = /10\s*(\^|\s*)\s*([-+]?\d+)/g;

/**
 * Step 3 & 4: Identifies uncertain characters and symbols, and compares against mathematical context.
 */
export function analyzeTranscriptionUncertainties(
  transcription: string,
  context?: {
    subject?: string;
    questionContext?: string;
    rawConfidence?: number;
  }
): DifferenceAwareAnalysisResult {
  const text = transcription || '';
  const uncertainTokens: UncertainToken[] = [];
  const contextSanityChecks: Array<{ checkName: string; passed: boolean; details: string }> = [];
  const suggestedCorrections: Array<{ originalSnippet: string; suggestedSnippet: string; rationale: string }> = [];

  const defaultConfidence = context?.rawConfidence ?? 80;

  // 1. Analyze Algebraic Expressions: e.g. x², x² + 1, x² - 1
  let match: RegExpExecArray | null;
  const algRegex = new RegExp(ALGEBRAIC_EXPRESSION_PATTERN);
  while ((match = algRegex.exec(text)) !== null) {
    const fullExpr = match[1].replace(/\s+/g, '');
    const idx = match.index;
    const snippet = text.slice(Math.max(0, idx - 5), Math.min(text.length, idx + match[0].length + 5));

    // Notice: x^2 without + 1 or - 1 vs with +1 / -1 are NOT interchangeable!
    if (fullExpr.includes('+') || fullExpr.includes('-')) {
      const isMinus = fullExpr.includes('-');
      uncertainTokens.push({
        token: isMinus ? '-' : '+',
        category: 'sign_operator',
        index: idx,
        snippet,
        confidence: defaultConfidence,
        potentialAlternatives: isMinus ? ['+'] : ['-'],
        meaningChangingRisk: 'high',
        reason: `Algebraic sign in "${fullExpr}" is meaning-changing: swapping '+' and '-' alters identity and roots.`,
      });
    }
  }

  // 2. Analyze Exponents & Powers of Ten (Gravitation, Physics, Chemistry)
  // e.g. 10^-11 (Gravitational constant G = 6.67 × 10^-11) vs 10^11
  const powerRegex = new RegExp(SCIENTIFIC_POWERS_OF_TEN_PATTERN);
  while ((match = powerRegex.exec(text)) !== null) {
    const exponentVal = match[2];
    const snippet = match[0];
    const idx = match.index;

    // Check if missing a minus sign in physics constant
    if (context?.questionContext?.toLowerCase().includes('gravit') || context?.questionContext?.toLowerCase().includes('6.67')) {
      if (exponentVal === '11' || exponentVal === '+11') {
        uncertainTokens.push({
          token: exponentVal,
          category: 'exponent_power',
          index: idx,
          snippet,
          confidence: 50,
          potentialAlternatives: ['-11'],
          meaningChangingRisk: 'high',
          reason: 'Gravitational constant G requires negative exponent 10^-11; transcribed as positive 10^11.',
        });
        suggestedCorrections.push({
          originalSnippet: snippet,
          suggestedSnippet: '10^-11',
          rationale: 'Universal gravitational constant is G = 6.67 × 10^-11 N m²/kg².',
        });
      }
    }
  }

  // 3. Analyze Decimal Points (e.g. 2.01 vs 201, 6.67 vs 667)
  const suspectDecRegex = new RegExp(MISSING_DECIMAL_SUSPECT_PATTERN);
  while ((match = suspectDecRegex.exec(text)) !== null) {
    const rawNumber = match[1];
    const snippet = match[0];
    const idx = match.index;

    uncertainTokens.push({
      token: rawNumber,
      category: 'decimal_point',
      index: idx,
      snippet,
      confidence: 60,
      potentialAlternatives: rawNumber === '667' ? ['6.67'] : rawNumber === '201' ? ['2.01'] : ['3.84'],
      meaningChangingRisk: 'high',
      reason: `Possible missing decimal point in "${rawNumber}": handwritten dot may have been skipped in OCR.`,
    });
  }

  // 4. Analyze Chemistry Subscripts (CO2, H2O, O2)
  if (context?.subject?.toLowerCase().includes('bio') || context?.questionContext?.toLowerCase().includes('photo')) {
    const norm = text.toLowerCase();
    const hasCo2 = norm.includes('co2') || norm.includes('carbon dioxide');
    const hasO2 = norm.includes('o2') || norm.includes('oxygen');

    contextSanityChecks.push({
      checkName: 'Photosynthesis Gas Chemistry Check',
      passed: hasCo2 && hasO2,
      details: hasCo2 && hasO2
        ? 'Both CO2 reactant and O2 product formulas identified.'
        : 'Missing distinct reactant/product chemical distinction in text.',
    });
  }

  // 5. Evaluate Overall Risk and Routing Decision
  const hasHighRisk = uncertainTokens.some((t) => t.meaningChangingRisk === 'high');
  const hasMediumRisk = uncertainTokens.some((t) => t.meaningChangingRisk === 'medium');

  let overallRisk: MeaningChangingRiskLevel = 'none';
  if (hasHighRisk) overallRisk = 'high';
  else if (hasMediumRisk) overallRisk = 'medium';
  else if (uncertainTokens.length > 0) overallRisk = 'low';

  const requiresHumanReview = hasHighRisk || (hasMediumRisk && defaultConfidence < 85);

  const routingDecision = requiresHumanReview ? 'teacher_review_required' : 'automated_rubric_allowed';
  const routingReason = requiresHumanReview
    ? `Identified ${uncertainTokens.length} meaning-changing symbol(s) with potential grading impact. Routing to teacher review queue.`
    : 'No critical meaning-changing OCR ambiguities detected. Safe for automated rubric scoring.';

  return {
    hasMeaningChangingUncertainties: uncertainTokens.length > 0,
    overallRisk,
    criticalTokensFound: uncertainTokens.length,
    uncertainTokens,
    contextSanityChecks,
    suggestedCorrections,
    requiresHumanReview,
    routingDecision,
    routingReason,
  };
}

/**
 * Executes the Complete 6-Step Workflow:
 * 1. Preserve original answer image
 * 2. Generate transcription
 * 3. Identify uncertain characters and symbols
 * 4. Compare transcription against mathematical context
 * 5. Route uncertain or meaning-changing cases to human reviewer
 * 6. Execute rubric evaluation (or hold for human review)
 */
export function executeDifferenceAwareWorkflow(
  params: DifferenceAwareWorkflowParams
): DifferenceAwareWorkflowOutput {
  const auditTrail: string[] = [];

  // ── STEP 1: Preserve original answer image ──────────────────────────────────
  const imagePreserved = Boolean(params.originalImageUrl || params.originalImageBase64);
  const imageProvenance = {
    sourceType: params.originalImageUrl ? ('url' as const) : params.originalImageBase64 ? ('base64' as const) : ('text_only' as const),
    identifier: params.originalImageUrl || (params.originalImageBase64 ? `base64_sha256_${params.answerId}` : 'direct_text_submission'),
    timestamp: new Date().toISOString(),
  };
  auditTrail.push(`[Step 1 - Image Preservation] Source: ${imageProvenance.sourceType}, Timestamp: ${imageProvenance.timestamp}`);

  // ── STEP 2: Generate transcription ──────────────────────────────────────────
  const transcription = params.generatedTranscription;
  auditTrail.push(`[Step 2 - Transcription] Length: ${transcription.length} characters.`);

  // ── STEP 3 & 4: Identify uncertain symbols & Context comparison ─────────────
  const analysis = analyzeTranscriptionUncertainties(transcription, {
    subject: params.subjectCategory,
    questionContext: params.questionContext,
    rawConfidence: params.rawConfidence,
  });
  auditTrail.push(`[Step 3 & 4 - Difference-Aware Analysis] Found ${analysis.criticalTokensFound} critical tokens. Risk: ${analysis.overallRisk}.`);

  // ── STEP 5: Route uncertain or meaning-changing cases ────────────────────────
  let evaluationState: 'ready_for_rubric' | 'held_for_human_review' = 'ready_for_rubric';
  let humanReviewTicket = undefined;

  if (analysis.requiresHumanReview) {
    evaluationState = 'held_for_human_review';
    humanReviewTicket = {
      ticketId: `rev_ticket_${params.answerId}_${Date.now()}`,
      priority: analysis.overallRisk === 'high' ? ('high' as const) : ('medium' as const),
      flaggedTokens: analysis.uncertainTokens.map((t) => `${t.token} (${t.snippet})`),
      teacherInstruction:
        'Verify highlighted mathematical symbols and signs against the student\'s original handwritten photo before finalizing marks.',
    };
    auditTrail.push(`[Step 5 - Human Routing] Routed to teacher review queue ticket: ${humanReviewTicket.ticketId}.`);
  } else {
    auditTrail.push('[Step 5 - Human Routing] Direct rubric evaluation approved.');
  }

  // ── STEP 6: Ready for Rubric Evaluation ──────────────────────────────────────
  auditTrail.push(`[Step 6 - Rubric Execution] State: ${evaluationState}.`);

  return {
    workflowStep: 6,
    answerId: params.answerId,
    imagePreserved,
    imageProvenance,
    transcription,
    analysis,
    evaluationState,
    humanReviewTicket,
    auditTrail,
  };
}
