export interface HighYieldMcq {
  id: number;
  subject: 'Botany' | 'Zoology';
  chapter: string;
  question: string;
  options: [string, string, string, string];
  correctAnswer: string;
  explanation: string;
  trapWarning?: string;
  ceeYield: 'Ultra High' | 'High';
}

export const BIOLOGY_POWER_PACK_SUMMARY = {
  title: '500 FREE CEE Biology MCQs With Detailed Explanations',
  edition: '2026 Medical Entrance Commission Edition',
  totalQuestions: 500,
  botanyCount: 250,
  zoologyCount: 250,
  breakdown: [
    { unit: 'Plant Anatomy & Physiology', weight: '22 MCQs / CEE Paper' },
    { unit: 'Genetics & Molecular Biology', weight: '18 MCQs / CEE Paper' },
    { unit: 'Human Physiology & Organ Systems', weight: '24 MCQs / CEE Paper' },
    { unit: 'Ecology & Environmental Biology', weight: '10 MCQs / CEE Paper' },
    { unit: 'Animal Diversity & Chordates', weight: '14 MCQs / CEE Paper' },
  ],
};

export const SAMPLE_HIGH_YIELD_MCQS: HighYieldMcq[] = [
  {
    id: 1,
    subject: 'Botany',
    chapter: 'Photosynthesis in Higher Plants',
    question: 'Primary CO₂ acceptor in C4 photosynthetic pathway is:',
    options: ['Ribulose 1,5-bisphosphate (RuBP)', 'Phosphoenolpyruvate (PEP)', 'Oxaloacetic acid (OAA)', 'Phosphoglycerate (PGA)'],
    correctAnswer: 'Phosphoenolpyruvate (PEP)',
    explanation: 'In C4 plants (e.g. maize, sugarcane), primary CO₂ fixation occurs in mesophyll cells catalyzed by PEP carboxylase, forming a 4-carbon compound Oxaloacetic Acid (OAA).',
    trapWarning: 'Common Trap: RuBP is the CO₂ acceptor in C3 pathway, NOT C4.',
    ceeYield: 'Ultra High',
  },
  {
    id: 2,
    subject: 'Botany',
    chapter: 'Cell Cycle and Cell Division',
    question: 'Synaptonemal complex dissolves and chiasmata become visible during which sub-stage of Prophase I?',
    options: ['Zygotene', 'Pachytene', 'Diplotene', 'Diakinesis'],
    correctAnswer: 'Diplotene',
    explanation: 'The synaptonemal complex forms during Zygotene, crossing over occurs in Pachytene, and the complex dissolves during Diplotene making X-shaped chiasmata visible.',
    trapWarning: 'Common Trap: Crossing over happens in Pachytene, but chiasmata only become visible in Diplotene.',
    ceeYield: 'Ultra High',
  },
  {
    id: 3,
    subject: 'Zoology',
    chapter: 'Human Physiology: Excretory Products & Elimination',
    question: 'Juxtaglomerular apparatus (JGA) releases renin in response to:',
    options: ['Increase in glomerular blood pressure', 'Decrease in GFR / blood pressure', 'Increase in Blood Volume', 'High sodium level in macula densa'],
    correctAnswer: 'Decrease in GFR / blood pressure',
    explanation: 'A fall in GFR or renal arterial blood pressure activates juxtaglomerular cells to secrete renin, which initiates the Renin-Angiotensin-Aldosterone System (RAAS).',
    trapWarning: 'Common Trap: Renin is released when pressure DECREASES, not increases.',
    ceeYield: 'Ultra High',
  },
  {
    id: 4,
    subject: 'Botany',
    chapter: 'Genetics & Molecular Basis of Inheritance',
    question: 'In a dihybrid cross, if two genes show complete linkage, what will be the F2 phenotypic ratio?',
    options: ['9:3:3:1', '3:1', '1:2:1', '9:7'],
    correctAnswer: '3:1',
    explanation: 'When two genes are completely linked on the same chromosome with no crossing over, they segregate together as a single unit, yielding a monohybrid-like 3:1 phenotypic ratio.',
    trapWarning: 'Common Trap: 9:3:3:1 applies only for independently assorting non-linked genes.',
    ceeYield: 'Ultra High',
  },
  {
    id: 5,
    subject: 'Zoology',
    chapter: 'Human Physiology: Neural Control & Coordination',
    question: 'Depolarization of an axonal membrane occurs due to rapid influx of:',
    options: ['Potassium ions (K⁺)', 'Sodium ions (Na⁺)', 'Calcium ions (Ca²⁺)', 'Chloride ions (Cl⁻)'],
    correctAnswer: 'Sodium ions (Na⁺)',
    explanation: 'Upon electrical stimulation, voltage-gated Na⁺ channels open rapidly, allowing Na⁺ influx along the concentration gradient, reversing membrane potential from -70mV to +30mV.',
    trapWarning: 'Repolarization is caused by K⁺ efflux, whereas depolarization is Na⁺ influx.',
    ceeYield: 'Ultra High',
  },
];
