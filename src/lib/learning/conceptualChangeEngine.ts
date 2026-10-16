/**
 * Conceptual Change Engine — Multi-Turn Cognitive Remediation Loop
 * Reference: DOI:10.1016/j.learninstruc.2026.102395 (Fostering Conceptual Change)
 *
 * Implements:
 * 1. Multi-signal diagnostic validator (never diagnoses a deep misconception from a single isolated fluke).
 * 2. 5-Stage Remediation Protocol:
 *    - Stage 1: Identify Misconception
 *    - Stage 2: Contrastive Distinction (Intuitive belief vs Scientific model)
 *    - Stage 3: Worked Cognitive Example
 *    - Stage 4: Immediate Isomorphic Transfer Problem
 *    - Stage 5: Longitudinal Tracking & Delayed (7-day) Reassessment
 * 3. Canonical high-yield misconception repository for SEE, CEE, and IOE.
 */

export type MisconceptionDomain =
  | 'physics_mechanics'
  | 'physics_electricity'
  | 'chemistry_bonding'
  | 'biology_cellular'
  | 'biology_genetics';

export interface IsomorphicTransferProblem {
  questionId: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  commonDistractorMisconceptions: Record<number, string>;
}

export interface MisconceptionDefinition {
  id: string;
  domain: MisconceptionDomain;
  name: string;
  intuitiveBelief: string;
  scientificReality: string;
  contrastiveDistinction: string;
  workedExample: {
    scenario: string;
    fallaciousIntuition: string;
    correctReasoningSteps: string[];
    coreTakeaway: string;
  };
  immediateTransferProblem: IsomorphicTransferProblem;
  diagnosticTriggers: string[];
}

export interface DiagnosticEvidence {
  questionId: string;
  studentAnswerTextOrChoice: string;
  timestamp: string;
  confidence?: 'low' | 'medium' | 'high';
}

export interface StudentMisconceptionRecord {
  misconceptionId: string;
  signalsCount: number;
  confirmed: boolean; // requires >= 2 signals or explicit high-confidence trigger
  firstSeenAt: string;
  lastSeenAt: string;
  stage: 'diagnosed' | 'remediation_viewed' | 'transfer_passed' | 'retained_7day' | 'relapsed';
  scheduledReassessmentDate: string; // ISO string 7 days after transfer pass
}

export interface StudentCognitiveState {
  studentId: string;
  misconceptions: Record<string, StudentMisconceptionRecord>;
  retentionRatePercentage: number;
  lastUpdated: string;
}

export interface FiveStageRemediationPlan {
  stage1_identification: {
    misconceptionId: string;
    name: string;
    intuitiveBelief: string;
  };
  stage2_contrastiveDistinction: {
    scientificReality: string;
    contrastiveExplanation: string;
  };
  stage3_workedExample: {
    scenario: string;
    fallaciousIntuition: string;
    correctReasoningSteps: string[];
    coreTakeaway: string;
  };
  stage4_immediateTransfer: IsomorphicTransferProblem;
  stage5_delayedReassessment: {
    delayDays: number;
    targetReassessmentDate: string;
    rationale: string;
  };
}

// ──────────────── Canonical Misconception Repository ────────────────

export const CANONICAL_MISCONCEPTIONS: Record<string, MisconceptionDefinition> = {
  'misc-grav-mass-dependent': {
    id: 'misc-grav-mass-dependent',
    domain: 'physics_mechanics',
    name: 'Heavier Objects Fall Faster in Vacuum (Aristotelian Fallacy)',
    intuitiveBelief: 'A heavier rock has more gravity acting on it, so it must accelerate downward faster than a light feather.',
    scientificReality: 'Gravitational acceleration (g = GM/R^2) depends purely on the planetary mass and radius, completely independent of the falling object\'s mass.',
    contrastiveDistinction:
      'In everyday life on Earth, air resistance slows light, broad objects (feathers). But in physics and in a vacuum, while Earth exerts a larger force F = mg on the heavier object, that object also possesses proportionally larger inertia (resistance to acceleration, m). By Newton\'s 2nd Law a = F/m = (mg)/m = g. The mass m cancels completely.',
    workedExample: {
      scenario: 'A 100 kg cannonball and a 1 kg stone are dropped simultaneously from a height of 20 m on the Moon (vacuum, g = 1.6 m/s^2). Which hits the surface first?',
      fallaciousIntuition: 'The 100 kg cannonball hits first because it feels 100 times more gravitational pull.',
      correctReasoningSteps: [
        '1. Force on cannonball: F1 = 100 kg * 1.6 m/s^2 = 160 N.',
        '2. Acceleration of cannonball: a1 = F1 / m1 = 160 N / 100 kg = 1.6 m/s^2.',
        '3. Force on stone: F2 = 1 kg * 1.6 m/s^2 = 1.6 N.',
        '4. Acceleration of stone: a2 = F2 / m2 = 1.6 N / 1 kg = 1.6 m/s^2.',
        '5. Both start from rest at the same height: t = sqrt(2h / g) = sqrt(40 / 1.6) = 5.0 seconds.',
      ],
      coreTakeaway: 'Both reach the lunar surface at the exact same instant (t = 5.0 s). Gravitational acceleration is invariant to falling mass.',
    },
    immediateTransferProblem: {
      questionId: 'trans-grav-01',
      questionText: 'An astronaut inside a deep vacuum chamber simultaneously drops an iron sphere (mass 5 kg) and an aluminum sphere (mass 0.5 kg) from a height of 10 m. Neglecting air resistance, what is the ratio of their downward accelerations (a_iron : a_aluminum)?',
      options: ['10 : 1', '1 : 1', '1 : 10', '100 : 1'],
      correctOptionIndex: 1,
      explanation: 'In a vacuum, all bodies accelerate at g = 9.8 m/s^2 regardless of mass. Therefore, a_iron : a_aluminum = 1 : 1.',
      commonDistractorMisconceptions: {
        0: 'Assumed acceleration is directly proportional to mass ratio (5 / 0.5 = 10 : 1).',
      },
    },
    diagnosticTriggers: [
      'heavier falls faster',
      'heavier object hits first',
      'mass increases acceleration',
      'cannonball lands before feather in vacuum',
    ],
  },

  'misc-plant-respiration-co2': {
    id: 'misc-plant-respiration-co2',
    domain: 'biology_cellular',
    name: 'Plants Only Inhale Carbon Dioxide and Do Not Respire Oxygen',
    intuitiveBelief: 'Animals breathe in oxygen and exhale CO2, whereas plants do the reverse: they only breathe CO2 and exhale oxygen.',
    scientificReality: 'Plants continuously undergo cellular respiration (using O2 and releasing CO2 via mitochondria) 24 hours a day, alongside daylight photosynthesis in chloroplasts.',
    contrastiveDistinction:
      'Photosynthesis (in chloroplasts) consumes CO2 and H2O in the presence of sunlight to synthesize glucose and release O2. But plant cells also possess mitochondria and must continuously break down that glucose through cellular respiration consuming O2 to produce ATP for metabolic survival day and night.',
    workedExample: {
      scenario: 'A sealed glass container containing a green potted plant is placed in complete darkness for 12 hours. What happens to the CO2 and O2 concentrations inside?',
      fallaciousIntuition: 'Plants continuously produce oxygen and consume CO2, so O2 levels increase.',
      correctReasoningSteps: [
        '1. In complete darkness, the light-dependent reactions of photosynthesis cannot occur.',
        '2. However, plant cells are alive and require ATP, so cellular respiration continues continuously in their mitochondria.',
        '3. Respiration equation: C6H12O6 + 6O2 -> 6CO2 + 6H2O + ATP.',
        '4. Oxygen is consumed and carbon dioxide is released into the chamber.',
      ],
      coreTakeaway: 'In darkness, O2 levels decrease and CO2 levels increase because plants respire continuously.',
    },
    immediateTransferProblem: {
      questionId: 'trans-bio-01',
      questionText: 'During a pitch-black night, which gas is net-released by a deciduous tree into the surrounding atmosphere?',
      options: ['Oxygen (O2)', 'Carbon Dioxide (CO2)', 'Nitrogen (N2)', 'Methane (CH4)'],
      correctOptionIndex: 1,
      explanation: 'In the absence of light, photosynthesis ceases while cellular respiration continues, resulting in net consumption of O2 and net release of CO2.',
      commonDistractorMisconceptions: {
        0: 'Believes plants perpetually release oxygen regardless of light.',
      },
    },
    diagnosticTriggers: [
      'plants do not respire oxygen',
      'plants breathe in co2 only',
      'plants release oxygen at night',
      'photosynthesis is plant respiration',
    ],
  },

  'misc-series-current-consumed': {
    id: 'misc-series-current-consumed',
    domain: 'physics_electricity',
    name: 'Current is Consumed or Weakened Along a Series Circuit',
    intuitiveBelief: 'Electric current gets "used up" by resistors in series, so the last resistor receives less current than the first resistor.',
    scientificReality: 'Current (rate of charge flow dq/dt) is strictly identical at every point in a single series circuit loop due to the law of conservation of electric charge.',
    contrastiveDistinction:
      'Charges (electrons) do not disappear or get eaten. Just like water flowing through a closed pipe, the rate of water flow passing through each restriction is identical. What gets consumed is electrical potential energy (voltage), NOT the electrons or current itself.',
    workedExample: {
      scenario: 'Three resistors (10 Ω, 20 Ω, 30 Ω) are connected in series with a 12 V battery. Which resistor has the highest electric current passing through it?',
      fallaciousIntuition: 'The 10 Ω resistor gets the current first from the battery, so it receives the highest current before it gets used up.',
      correctReasoningSteps: [
        '1. Total series resistance: R_total = 10 + 20 + 30 = 60 Ω.',
        '2. Total circuit current: I = V / R_total = 12 V / 60 Ω = 0.2 A.',
        '3. In a single loop without junctions, charge conservation (Kirchhoff\'s Current Law) dictates that every electron entering must exit.',
        '4. Therefore, I_10Ω = I_20Ω = I_30Ω = 0.2 A.',
      ],
      coreTakeaway: 'Current is identical through all series elements (0.2 A). Potential drops (V = IR), but current is conserved.',
    },
    immediateTransferProblem: {
      questionId: 'trans-elec-01',
      questionText: 'Two identical light bulbs A and B are connected in series to a battery. Bulb A is connected closer to the positive terminal than Bulb B. How do their brightnesses compare?',
      options: [
        'Bulb A is brighter because it receives current first.',
        'Bulb B is brighter because potential accumulates at the negative terminal.',
        'Both bulbs have equal brightness because identical current flows through both.',
        'Neither bulb glows because series circuits do not allow current propagation.',
      ],
      correctOptionIndex: 2,
      explanation: 'In a series circuit, charge conservation guarantees identical current I through both bulbs. Since they are identical (same resistance R), their dissipated power P = I^2*R is equal, making them equally bright.',
      commonDistractorMisconceptions: {
        0: 'Assumed electric current is consumed as it passes through Bulb A.',
      },
    },
    diagnosticTriggers: [
      'current gets consumed',
      'first resistor takes more current',
      'current decreases after each bulb',
      'bulb closer to battery is brighter',
    ],
  },
};

// ──────────────── Diagnostic & Cognitive Tracking Functions ────────────────

/**
 * Evaluates whether multiple signals confirm a persistent misconception,
 * adhering to the research principle: never diagnose from a single isolated mistake.
 */
export function diagnoseMisconceptionFromSignals(
  evidenceList: DiagnosticEvidence[]
): {
  diagnosed: boolean;
  misconception?: MisconceptionDefinition;
  evidenceCount: number;
  requiresMoreEvidence: boolean;
} {
  const triggerMatches: Record<string, number> = {};

  for (const evidence of evidenceList) {
    const text = evidence.studentAnswerTextOrChoice.toLowerCase();

    for (const [miscId, def] of Object.entries(CANONICAL_MISCONCEPTIONS)) {
      for (const trigger of def.diagnosticTriggers) {
        if (text.includes(trigger.toLowerCase())) {
          triggerMatches[miscId] = (triggerMatches[miscId] || 0) + 1;
        }
      }
    }
  }

  // Find candidate with maximum triggers
  let bestId: string | null = null;
  let maxCount = 0;

  for (const [id, count] of Object.entries(triggerMatches)) {
    if (count > maxCount) {
      maxCount = count;
      bestId = id;
    }
  }

  if (!bestId || maxCount === 0) {
    return {
      diagnosed: false,
      evidenceCount: 0,
      requiresMoreEvidence: false,
    };
  }

  // Multi-signal threshold: requires >= 2 signals to confirm diagnosis
  if (maxCount >= 2) {
    return {
      diagnosed: true,
      misconception: CANONICAL_MISCONCEPTIONS[bestId],
      evidenceCount: maxCount,
      requiresMoreEvidence: false,
    };
  }

  return {
    diagnosed: false,
    misconception: CANONICAL_MISCONCEPTIONS[bestId],
    evidenceCount: maxCount,
    requiresMoreEvidence: true,
  };
}

/**
 * Builds the complete 5-stage conceptual change remediation plan for a diagnosed misconception.
 */
export function generateFiveStageRemediation(
  misconceptionId: string
): FiveStageRemediationPlan | null {
  const def = CANONICAL_MISCONCEPTIONS[misconceptionId];
  if (!def) return null;

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 7);

  return {
    stage1_identification: {
      misconceptionId: def.id,
      name: def.name,
      intuitiveBelief: def.intuitiveBelief,
    },
    stage2_contrastiveDistinction: {
      scientificReality: def.scientificReality,
      contrastiveExplanation: def.contrastiveDistinction,
    },
    stage3_workedExample: def.workedExample,
    stage4_immediateTransfer: def.immediateTransferProblem,
    stage5_delayedReassessment: {
      delayDays: 7,
      targetReassessmentDate: targetDate.toISOString(),
      rationale:
        'Cognitive science establishes that immediate transfer tests short-term schema activation. A 7-day delayed reassessment verifies deep schema restructuring and long-term conceptual retention.',
    },
  };
}

/**
 * Updates a student's cognitive profile following an immediate transfer problem attempt.
 */
export function recordTransferResponse(
  profile: StudentCognitiveState,
  misconceptionId: string,
  chosenOptionIndex: number
): {
  updatedProfile: StudentCognitiveState;
  passed: boolean;
  scheduledDate?: string;
  feedback: string;
} {
  const def = CANONICAL_MISCONCEPTIONS[misconceptionId];
  if (!def) {
    throw new Error(`Misconception ID ${misconceptionId} not found.`);
  }

  const passed = chosenOptionIndex === def.immediateTransferProblem.correctOptionIndex;
  const now = new Date();
  const scheduledDate = new Date();
  scheduledDate.setDate(scheduledDate.getDate() + 7);

  const currentRecord: StudentMisconceptionRecord = profile.misconceptions[misconceptionId] || {
    misconceptionId,
    signalsCount: 2,
    confirmed: true,
    firstSeenAt: now.toISOString(),
    lastSeenAt: now.toISOString(),
    stage: 'diagnosed',
    scheduledReassessmentDate: scheduledDate.toISOString(),
  };

  if (passed) {
    currentRecord.stage = 'transfer_passed';
    currentRecord.scheduledReassessmentDate = scheduledDate.toISOString();
    currentRecord.lastSeenAt = now.toISOString();
  } else {
    currentRecord.stage = 'relapsed';
    currentRecord.signalsCount += 1;
    currentRecord.lastSeenAt = now.toISOString();
  }

  const updatedMisconceptions = {
    ...profile.misconceptions,
    [misconceptionId]: currentRecord,
  };

  // Recalculate retention / remediation rate
  const records = Object.values(updatedMisconceptions);
  const masteredCount = records.filter(
    (r) => r.stage === 'transfer_passed' || r.stage === 'retained_7day'
  ).length;
  const retentionRate = records.length > 0 ? Math.round((masteredCount / records.length) * 100) : 100;

  const updatedProfile: StudentCognitiveState = {
    ...profile,
    misconceptions: updatedMisconceptions,
    retentionRatePercentage: retentionRate,
    lastUpdated: now.toISOString(),
  };

  const feedback = passed
    ? `Excellent! You successfully demonstrated conceptual change on the transfer problem. A 7-day retention check has been scheduled for ${scheduledDate.toLocaleDateString()}.`
    : `The transfer answer was incorrect. Review the contrastive distinction and worked example before re-attempting.`;

  return {
    updatedProfile,
    passed,
    scheduledDate: passed ? scheduledDate.toISOString() : undefined,
    feedback,
  };
}

/**
 * Checks for any pending 7-day reassessments due for a student.
 */
export function getPendingReassessments(
  profile: StudentCognitiveState,
  currentDate: Date = new Date()
): StudentMisconceptionRecord[] {
  const nowMs = currentDate.getTime();
  return Object.values(profile.misconceptions).filter((record) => {
    if (record.stage !== 'transfer_passed') return false;
    const dueMs = new Date(record.scheduledReassessmentDate).getTime();
    return nowMs >= dueMs;
  });
}
