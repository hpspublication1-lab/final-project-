import { describe, it, expect } from 'vitest';
import {
  CANONICAL_RUBRICS,
  evaluateAnswerWithRubric,
  MultiDimensionalRubric,
} from '../rubricEvaluator';

describe('Multi-Dimensional Rubric-Based Scoring Engine (Alice Benchmark Inspired)', () => {
  const photoRubric: MultiDimensionalRubric = CANONICAL_RUBRICS['see-sci-03-photosynthesis'];

  it('verifies the canonical SEE Biology Photosynthesis rubric has exactly the 4 required criteria totaling 4 marks', () => {
    expect(photoRubric).toBeDefined();
    expect(photoRubric.totalMarks).toBe(4);
    expect(photoRubric.criteria.length).toBe(4);

    const criteriaNames = photoRubric.criteria.map((c) => c.criterion);
    expect(criteriaNames).toContain('Identifies photosynthesis correctly');
    expect(criteriaNames).toContain('Explains the role of chlorophyll or light');
    expect(criteriaNames).toContain('Identifies the relevant raw materials');
    expect(criteriaNames).toContain('States the correct products');

    // Each criterion must be exactly 1 mark
    for (const crit of photoRubric.criteria) {
      expect(crit.maxMarks).toBe(1);
    }
  });

  it('awards full 4/4 marks for an accurate textbook model answer', () => {
    const modelAnswer =
      'Photosynthesis is the anabolic process by which green plants manufacture glucose food in the presence of sunlight and chlorophyll. ' +
      'Chlorophyll absorbs light energy from the sun. ' +
      'The raw materials required are Carbon Dioxide (CO2) from air and Water (H2O) from soil. ' +
      'The products formed are Glucose sugar and Oxygen gas released as a byproduct.';

    const result = evaluateAnswerWithRubric(modelAnswer, photoRubric);

    expect(result.obtainedMarks).toBe(4);
    expect(result.percentage).toBe(100);
    expect(result.criterionResults.every((c) => c.status === 'full')).toBe(true);
    expect(result.detectedMisconceptions.length).toBe(0);

    // Dimensions check
    expect(result.dimensions.knowledgeElements.score).toBe(3);
    expect(result.dimensions.knowledgeElements.maxScore).toBe(3);
    expect(result.dimensions.reasoningSkills.score).toBe(1);
    expect(result.dimensions.reasoningSkills.maxScore).toBe(1);
  });

  it('does NOT penalize a student who understands the process but expresses it differently from the model answer (Paraphrasing Tolerance)', () => {
    // Student uses conversational, informal phrasing instead of scientific jargon
    const paraphrasedAnswer =
      'Green plants make their own food through this biological process. ' +
      'The green pigment in leaves catches energy from sun rays. ' +
      'Plants take in water through their roots and carbon dioxide from the surrounding air. ' +
      'After the reaction, plants store sugar carbohydrates and give out oxygen gas.';

    const result = evaluateAnswerWithRubric(paraphrasedAnswer, photoRubric);

    // Even though words like "anabolic" or "photolysis" were not used, student should receive full marks
    expect(result.obtainedMarks).toBe(4);
    expect(result.percentage).toBe(100);

    const paraphrasedAccepted = result.criterionResults.some((c) => c.alternativePhrasingAccepted);
    expect(paraphrasedAccepted).toBe(true);
  });

  it('evaluates each criterion separately and withholds marks only for the missing criterion', () => {
    // Student explains definition, chlorophyll, and raw materials, but completely omits the products
    const answerMissingProducts =
      'Photosynthesis is the process where green plants manufacture food. ' +
      'Chlorophyll in leaves absorbs solar light energy from the sun. ' +
      'The raw materials used are carbon dioxide from air and water from soil.';

    const result = evaluateAnswerWithRubric(answerMissingProducts, photoRubric);

    expect(result.obtainedMarks).toBe(3);
    expect(result.totalMarks).toBe(4);

    const productsCriterion = result.criterionResults.find(
      (c) => c.criterion === 'States the correct products'
    );
    expect(productsCriterion).toBeDefined();
    expect(productsCriterion!.awardedMarks).toBe(0);
    expect(productsCriterion!.status).toBe('missing');
  });

  it('detects student-specific misconceptions and provides personalized feedback instead of generic boilerplate', () => {
    // Student erroneously states that Oxygen is a raw material and CO2 is a product
    const misconceptionAnswer =
      'Photosynthesis is the process of plant food preparation. ' +
      'Sunlight is absorbed by chlorophyll. ' +
      'The plant takes in oxygen and water to produce food. ' +
      'The reaction releases carbon dioxide as product.';

    const result = evaluateAnswerWithRubric(misconceptionAnswer, photoRubric);

    // Should detect the misconception about oxygen being a raw material
    expect(result.detectedMisconceptions.length).toBeGreaterThan(0);

    const oxygenMisconception = result.detectedMisconceptions.find((m) =>
      m.misconception.toLowerCase().includes('oxygen')
    );
    expect(oxygenMisconception).toBeDefined();
    expect(oxygenMisconception!.correction).toContain('Carbon Dioxide');

    // Penalized for wrong raw material and wrong product
    expect(result.obtainedMarks).toBeLessThanOrEqual(2);
  });

  it('treats handwriting recognition and conceptual grading as decoupled separate phases', () => {
    const handwrittenInput =
      'Photosynthesis is the process of plants producing sugar. Chlorophyll traps solar energy. CO2 and water are raw materials. Oxygen is released.';

    const result = evaluateAnswerWithRubric(handwrittenInput, photoRubric, {
      isHandwritten: true,
      ocrLegibilityScore: 78,
      rawImageProvided: true,
    });

    expect(result.transcriptionVerification.decoupledOcr).toBe(true);
    expect(result.transcriptionVerification.ocrLegibilityScore).toBe(78);
    expect(result.transcriptionVerification.requiresHumanReview).toBe(false);
    expect(result.transcriptionVerification.notice).toContain('Phase 1');

    // Legibility score is kept distinct from content marks
    expect(result.obtainedMarks).toBe(4);
  });

  it('flags low-legibility scripts for human teacher review without guessing arbitrarily', () => {
    const messyHandwriting = 'Photosyn... plant food... sun...';

    const result = evaluateAnswerWithRubric(messyHandwriting, photoRubric, {
      isHandwritten: true,
      ocrLegibilityScore: 45, // Poor scan quality
      rawImageProvided: true,
    });

    expect(result.transcriptionVerification.requiresHumanReview).toBe(true);
  });

  it('includes the engineering warning that benchmark performance does not establish autonomous grading on Nepali scripts', () => {
    const result = evaluateAnswerWithRubric('Test answer', photoRubric);

    expect(result.engineeringNotice).toContain('multi-dimensional scoring rubrics');
    expect(result.engineeringNotice).toContain('Nepal SEE curriculum standards');
    expect(result.engineeringNotice).toContain('human teacher review remains recommended');
  });
});
