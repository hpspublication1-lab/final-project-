/**
 * Samyak Guru — Canonical Course & Pricing Registry
 * Single authoritative source of truth for all public pages, course detail templates,
 * landing pages, pricing comparisons, and checkout entries.
 * All prices strictly match PLAN_PRICES in src/lib/payments/gateways.ts.
 */

export type CourseTrack = 'see_class_10' | 'cee_medical' | 'skills_languages';

export type CourseDeliveryFormat =
  | 'live_batch'
  | 'crash_course'
  | 'subject_course'
  | 'self_paced_pass';

export interface CourseSubject {
  name: string;
  chaptersCount: number;
  icon: string;
}

export interface CourseFaculty {
  name: string;
  role: string;
  qualification: string;
  verified: boolean;
  isAiPersona?: boolean;
}

export interface BatchSchedule {
  batchName: string;
  startDate: string;
  liveSchedule: string;
  replayAvailable: boolean;
}

export interface CurriculumModule {
  moduleTitle: string;
  topicsCount: number;
  topics: string[];
  isDemoAvailable: boolean;
}

export interface SampleInteractiveQuestion {
  stem: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface DemoLesson {
  title: string;
  subject: string;
  previewType: 'video' | 'question_rubric';
  summary: string;
  demoUrl?: string;
  sampleQuestion?: SampleInteractiveQuestion;
}

export interface TeachingAssetStatus {
  status: 'ready' | 'partial_blocker';
  summary: string;
  blockerNote?: string;
}

export interface CourseData {
  slug: string;
  aliases?: string[];
  planSku: string;
  track: CourseTrack;
  courseFormat: CourseDeliveryFormat;
  formatLabel: string;
  currency: 'NPR';
  title: string;
  badge: string;
  targetStudent: string;
  examOutcome: string;
  headline: string;
  description: string;
  priceNpr: number;
  originalPriceNpr?: number;
  payableNowNpr: number;
  payableLaterNpr: number;
  depositNpr?: number;
  validityDays: number;
  validityText: string;
  languageMedium: string;
  subjects: CourseSubject[];
  faculty: CourseFaculty[];
  batchSchedule: BatchSchedule;
  curriculum: CurriculumModule[];
  includedFeatures: string[];
  prerequisites: string[];
  featureLimits: string[];
  teachingAssetStatus: TeachingAssetStatus;
  demoLesson: DemoLesson;
  refundRules: string;
  faqs: { q: string; a: string }[];
  primaryCtaText: string;
  enrollPath: string;
  prebookPath?: string;
}

/**
 * Authoritative single source of truth for the CEE 45-Day Crash Course Prebooking Offer.
 * Resolves all ambiguous comparison prices and provides explicit payable-now and payable-later amounts.
 */
export const PREBOOK_OFFER = {
  sku: 'cee-45-day-crash-course',
  depositSku: 'cee-crash-course-deposit',
  balanceSku: 'cee-crash-course-balance',
  currency: 'NPR',
  depositAmountNpr: 300,
  totalCourseFeeNpr: 2299,
  remainingBalanceNpr: 1999, // 2299 - 300
  comparisonPriceNpr: 4990,
  totalSavingsNpr: 2691, // 4990 - 2299
  accessDaysImmediate: 90,
  crashCourseDays: 45,
  refundPolicy:
    '100% refundable seat deposit prior to batch commencement; fully credited toward final fee upon enrollment.',
} as const;

export const CANONICAL_CATALOG: CourseData[] = [
  // ── 1. SEE CLASS 10 FLAGSHIP LIVE BATCH ──────────────────────────────
  {
    slug: 'see-class-10-board-topper-batch',
    aliases: ['see-class-10', 'see-topper-batch', 'see'],
    planSku: 'see-class-10-board-topper-batch',
    track: 'see_class_10',
    courseFormat: 'live_batch',
    formatLabel: 'Live Evening Batch + Recorded HD Suite',
    currency: 'NPR',
    title: 'SEE Class 10 Board Topper Batch 2082/2083',
    badge: 'FLAGSHIP · LIVE BATCH',
    targetStudent:
      'Grade 10 students in Nepal aiming for GPA 4.0 in National Examination Board (NEB) finals.',
    examOutcome:
      'Target GPA 4.0 (Grade A+ in Science, Compulsory Math, Optional Math, English & Social).',
    headline: 'Complete Board Examination Preparation Aligned with the CDC Nepal Curriculum.',
    description:
      'A comprehensive, structured academic year program covering core board subjects with evening live classes, Bunny.net HD video lectures (English Medium ID 379737 & Nepali Medium ID 367785), 10-year past papers solved with marking rubrics, and AI handwritten answer grading.',
    priceNpr: 4990,
    originalPriceNpr: 7990,
    payableNowNpr: 4990,
    payableLaterNpr: 0,
    validityDays: 365,
    validityText: 'Full Academic Year (365 Days Access)',
    languageMedium: 'English & Nepali Medium',
    subjects: [
      { name: 'Compulsory Science', chaptersCount: 24, icon: '🔬' },
      { name: 'Compulsory Mathematics', chaptersCount: 16, icon: '📐' },
      { name: 'Optional Mathematics', chaptersCount: 18, icon: '📊' },
      { name: 'English Grammar & Writing', chaptersCount: 15, icon: '📝' },
      { name: 'Social Studies & Contemporary', chaptersCount: 14, icon: '🌏' },
    ],
    faculty: [
      {
        name: 'Pradeep Poudel Sir',
        role: 'Senior Science Faculty',
        qualification: 'M.Sc. Physics (TU), 12+ Yrs Board Teaching',
        verified: true,
      },
      {
        name: 'Er. Ramesh Karki',
        role: 'Mathematics Lead',
        qualification: 'B.E. (IOE Pulchowk), Author of SEE Topper Series',
        verified: true,
      },
    ],
    batchSchedule: {
      batchName: 'Alpha Evening Batch 2082 (English & Nepali Medium)',
      startDate: 'Active Cohort · Immediate Access to Recorded Playlist + Evening Sessions',
      liveSchedule: 'Sunday – Friday: 6:00 PM – 8:00 PM NPT (Nepal Standard Time)',
      replayAvailable: true,
    },
    curriculum: [
      {
        moduleTitle: 'Unit 1: Force, Gravitation & Energy (Science)',
        topicsCount: 6,
        topics: [
          "Newton's Law of Gravitation",
          'Acceleration due to Gravity (g)',
          'Free Fall & Weightlessness',
          'Gravitational Derivations for 4 Marks',
        ],
        isDemoAvailable: true,
      },
      {
        moduleTitle: 'Unit 2: Trigonometry & Compound Angles (Opt Math)',
        topicsCount: 8,
        topics: [
          'Multiple & Sub-multiple Angles',
          'Trigonometric Transformations',
          'Conditional Identities',
          'Heights & Distances Model Derivations',
        ],
        isDemoAvailable: true,
      },
      {
        moduleTitle: 'Unit 3: Mensuration & Geometry (Comp Math)',
        topicsCount: 7,
        topics: [
          'Cylinder, Sphere & Hemisphere Volume/Area',
          'Pyramid & Cone',
          'Circle Theorems & Experimental Verification',
          'Area of Triangles & Quadrilaterals',
        ],
        isDemoAvailable: false,
      },
      {
        moduleTitle: 'Unit 4: Chemistry — Metals & Chemical Reactions',
        topicsCount: 5,
        topics: [
          'Types of Chemical Reactions',
          'Acid, Base and Salt',
          'Metals (Iron, Copper, Aluminium)',
          'Hydrocarbons & Carbon Compounds',
        ],
        isDemoAvailable: false,
      },
    ],
    includedFeatures: [
      'English (ID 379737) & Nepali (ID 367785) HD Video Playlists',
      'Evening Interactive Revision Sessions & Doubt Clearing',
      '10-Year Solved NEB Board Question Bank (1, 2, 3, 4 Marks)',
      'AI Handwritten Answer Sheet Evaluator & Rubrics',
      'Printable A4 Model Question Sets with Marking Schemes',
      'Dedicated Doubt Clearing Support Forum',
    ],
    prerequisites: [
      'Currently enrolled in Class 9 or Class 10 under the NEB / CDC Nepal curriculum',
      'Smartphone, tablet, or computer with standard internet connection for video streaming',
    ],
    featureLimits: [
      'Single-student personal account license (concurrent multi-user sharing is restricted)',
      'AI Handwritten Vision Marker: up to 30 answer-sheet scans per day under fair-use policy',
      'Live WebRTC broadcast rooms require active scheduled session tokens; recorded Bunny.net HD playlists are available 24/7',
    ],
    teachingAssetStatus: {
      status: 'partial_blocker',
      summary:
        'Bunny.net SEE English (379737) & Nepali (367785) recorded video libraries, 10-year question bank, and AI rubric marker are live.',
      blockerNote:
        'Live interactive 100ms broadcast rooms and signed Bunny DRM tokens require production provider keys before live cohort streaming.',
    },
    demoLesson: {
      title: 'Science 4-Mark Problem: Gravitational Force & Distance-Halving Proof',
      subject: 'Science · Physics',
      previewType: 'question_rubric',
      summary:
        "Step-by-step NEB examiner marking breakdown for Newton's Universal Law of Gravitation when distance between two masses is halved.",
      demoUrl: '/see#learning-suite',
      sampleQuestion: {
        stem: 'If the distance between two masses is halved while keeping their masses constant, how does the gravitational force (F) between them change?',
        options: [
          'It becomes half (F/2)',
          'It becomes double (2F)',
          'It becomes four times (4F)',
          'It becomes one-fourth (F/4)',
        ],
        answerIndex: 2,
        explanation:
          "By Newton's Law of Gravitation, F = G·m₁·m₂ / d². When d' = d/2, F' = G·m₁·m₂ / (d/2)² = 4 · (G·m₁·m₂ / d²) = 4F (1 mark formula + 2 marks substitution + 1 mark conclusion).",
      },
    },
    refundRules:
      '7-Day Full Money-Back Guarantee. If the batch does not meet your academic expectations within 7 days of purchase, request a 100% refund.',
    faqs: [
      {
        q: 'Is this course suitable for both Nepali and English medium students?',
        a: 'Yes. Dedicated Bunny.net HD video libraries are included for both English Medium (ID 379737) and Nepali Medium (ID 367785) adhering strictly to CDC curriculum guidelines.',
      },
      {
        q: 'What happens if I miss a live evening class?',
        a: 'Recorded chapter lectures and solved model papers are available 24/7 in your student dashboard for anytime replay.',
      },
      {
        q: 'How does the AI handwritten answer marker work?',
        a: 'Take a clear photo of your handwritten math derivations or science answers. Our AI Evaluator grades it step-by-step against NEB board marking schemes with human faculty escalation support.',
      },
    ],
    primaryCtaText: 'Enroll in SEE Topper Batch (NPR 4,990)',
    enrollPath: '/checkout?plan=see-class-10-board-topper-batch',
  },

  // ── 2. CEE MEDICAL ENTRANCE FULL LIVE BATCH ──────────────────────────
  {
    slug: 'cee-mbbs-mastery-2026',
    aliases: ['cee-medical-entrance', 'target-cee-2026-full', 'cee'],
    planSku: 'cee-mbbs-mastery-2026',
    track: 'cee_medical',
    courseFormat: 'live_batch',
    formatLabel: 'Live Batch + Complete Self-Paced Suite',
    currency: 'NPR',
    title: 'CEE Medical Entrance Super Target Batch 2026',
    badge: 'FLAGSHIP · LIVE BATCH',
    targetStudent:
      '+2 Science graduates and repeaters preparing for the Medical Education Commission (MECEE-BL) entrance exam.',
    examOutcome:
      'Target 160–180+ Marks & Merit Scholarship Rank in MBBS, BDS, B.Sc. Nursing, and Paramedical streams.',
    headline: 'Comprehensive MECEE Medical Entrance Preparation with Verified Faculty & Mock Engine.',
    description:
      '15,000+ topic-wise MCQs with step-by-step rationales, 200-question timed mock exams with authentic -0.25 negative marking, high-yield sub-chapter notes across Physics, Chemistry, Botany, Zoology & MAT, and 24/7 AI medical doubt resolution.',
    priceNpr: 7990,
    originalPriceNpr: 14990,
    payableNowNpr: 7990,
    payableLaterNpr: 0,
    validityDays: 180,
    validityText: '6 Months (180 Days Full Entrance Cycle)',
    languageMedium: 'English Medium',
    subjects: [
      { name: 'Zoology', chaptersCount: 22, icon: '🧬' },
      { name: 'Botany', chaptersCount: 20, icon: '🌿' },
      { name: 'Chemistry (Organic, Inorganic, Physical)', chaptersCount: 32, icon: '⚗️' },
      { name: 'Physics (Mechanics, Optics, Modern)', chaptersCount: 28, icon: '⚡' },
      { name: 'Mental Agility Test (MAT)', chaptersCount: 10, icon: '🧠' },
    ],
    faculty: [
      {
        name: 'Dr. Samyak Shrestha',
        role: 'Chief Medical Educator (Biology)',
        qualification: 'MBBS (IOM Maharajgunj), CEE Entrance Specialist',
        verified: true,
      },
      {
        name: 'Er. Bishal Adhikari',
        role: 'Physics Entrance Specialist',
        qualification: 'M.Sc. Physics (TU), 10+ Yrs Entrance Training',
        verified: true,
      },
      {
        name: 'Samyak AI Doubt Solver',
        role: '24/7 Instant Step-by-Step Assistant',
        qualification: 'Grounded in MECEE PCB Syllabus with Faculty Escalation',
        verified: true,
        isAiPersona: true,
      },
    ],
    batchSchedule: {
      batchName: 'MECEE 2026 Super Target Cohort',
      startDate: 'Admissions Open · Instant Access to Question Bank, Notes & Mocks',
      liveSchedule: 'Evening Masterclasses (6:30 PM NPT) + Saturday 200-Q Grand Mock (8:00 AM NPT)',
      replayAvailable: true,
    },
    curriculum: [
      {
        moduleTitle: 'Zoology: Human Physiology, Tissues & Genetics',
        topicsCount: 12,
        topics: [
          'Digestive, Respiratory & Circulatory System High-Yield MCQs',
          'Nervous, Endocrine & Excretory Dynamics',
          'Mendelian Genetics & Chromosomal Aberrations',
          'Origin of Life, Evolution & Animal Adaptation',
        ],
        isDemoAvailable: true,
      },
      {
        moduleTitle: 'Botany: Plant Physiology, Cell Biology & Ecology',
        topicsCount: 10,
        topics: [
          'Photosynthesis: C3, C4 & CAM Pathway Specifics',
          'Cell Organelles & Mitosis/Meiosis Phases',
          'Plant Anatomy, Taxonomy & Embryology',
          'Ecosystem Dynamics & Biodiversity in Nepal',
        ],
        isDemoAvailable: true,
      },
      {
        moduleTitle: 'Physics: Mechanics, Thermodynamics, Optics & Modern Physics',
        topicsCount: 15,
        topics: [
          'Rotational Dynamics, Gravitation & Fluid Mechanics',
          'First & Second Laws of Thermodynamics',
          'Electrostatics, Current Electricity & Magnetism',
          'Ray Optics, Wave Optics & Nuclear Physics Numericals',
        ],
        isDemoAvailable: false,
      },
      {
        moduleTitle: 'Chemistry: Organic Mechanisms, Inorganic & Physical Chemistry',
        topicsCount: 14,
        topics: [
          'GOC, Hydrocarbons, Aldehydes, Ketones & Carboxylic Acids',
          'Chemical Kinetics, Equilibrium & Electrochemistry',
          'Chemical Bonding, Coordination Compounds & Periodic Trends',
          'Volumetric & Qualitative Analysis High-Yield Points',
        ],
        isDemoAvailable: false,
      },
    ],
    includedFeatures: [
      '15,000+ Topicwise High-Yield MCQs with Step-by-Step Rationales',
      '200-Question Timed Mock Exams with -0.25 Negative Marking',
      'Topic Accuracy, Time-Use Breakdown & Mistake Analyser',
      'Sub-Chapter High-Yield Revision Notes (Bio, Chem, Physics, MAT)',
      'Real-Time 1v1 Entrance Battle Arena & Spaced Repetition Flashcards',
      '24/7 AI Medical Doubt Solver with Human Teacher Escalation',
    ],
    prerequisites: [
      'Class 11/12 Science (Physics, Chemistry, Biology) background under NEB or equivalent board',
      'Targetting MECEE-BL (MBBS, BDS, B.Sc. Nursing, BASLP, B.Perfusion, or BAMS)',
    ],
    featureLimits: [
      'Single-student account entitlement valid for 180 days from activation',
      'AI Doubt Solver: up to 75 step-by-step queries per day (unlimited human doubt forum posts)',
      'Percentile rankings reflect performance among Samyak mock test participants',
    ],
    teachingAssetStatus: {
      status: 'partial_blocker',
      summary:
        '15,000+ MCQ Practice Engine, 200-Q Timed Mock Simulator, Chapter Revision Notes, SM-2 Flashcards, and AI Doubt Solver are live now.',
      blockerNote:
        'DRM-signed CEE video lecture streams (BUNNY_TOKEN_KEY) and live 100ms classroom broadcast rooms are pending production credentials.',
    },
    demoLesson: {
      title: 'Botany High-Yield Concept: C4 Photosynthesis & PEP Carboxylase',
      subject: 'Botany · Plant Physiology',
      previewType: 'question_rubric',
      summary:
        'Understand why C4 plants (maize, sugarcane) avoid photorespiration via Kranz anatomy and primary CO2 fixation by PEP carboxylase in mesophyll cells.',
      demoUrl: '/practice',
      sampleQuestion: {
        stem: 'In C4 plants (such as maize and sugarcane), the primary acceptor of CO2 during atmospheric fixation in mesophyll cells is:',
        options: [
          'Ribulose-1,5-bisphosphate (RuBP)',
          'Phosphoenolpyruvate (PEP)',
          'Oxaloacetic acid (OAA)',
          '3-Phosphoglyceric acid (3-PGA)',
        ],
        answerIndex: 1,
        explanation:
          'In C4 plants, initial CO2 fixation occurs in the mesophyll cells where Phosphoenolpyruvate (PEP), a 3-carbon molecule, accepts CO2 catalyzed by PEP carboxylase to form the 4-carbon compound Oxaloacetic acid (OAA). RuBP is the secondary acceptor in bundle sheath cells.',
      },
    },
    refundRules:
      '7-Day Full Money-Back Guarantee. Test the question banks, notes, and mock exams risk-free for 7 days from purchase.',
    faqs: [
      {
        q: 'Is this course aligned with the Medical Education Commission (MEC) syllabus?',
        a: 'Yes. Every chapter weightage (Zoology 40, Botany 40, Chemistry 50, Physics 50, MAT 20 = 200 marks) follows the official MECEE-BL specification.',
      },
      {
        q: 'How does the negative marking simulation work?',
        a: 'Our exam engine scores +1.0 mark for each correct answer, deducts -0.25 mark for each wrong answer, and deducts 0 for skipped questions across a 3-hour server-timed window.',
      },
    ],
    primaryCtaText: 'Enroll in CEE Super Batch (NPR 7,990)',
    enrollPath: '/checkout?plan=cee-mbbs-mastery-2026',
  },

  // ── 3. CEE 45-DAY CRASH COURSE ───────────────────────────────────────
  {
    slug: 'cee-45-day-crash-course',
    aliases: ['crash-course'],
    planSku: 'cee-45-day-crash-course',
    track: 'cee_medical',
    courseFormat: 'crash_course',
    formatLabel: 'Intensive 45-Day Crash Course',
    currency: 'NPR',
    title: 'CEE 45-Day Ultimate Crash Course 2026',
    badge: 'CRASH COURSE · FAST-TRACK',
    targetStudent:
      'Students seeking rapid final-lap syllabus revision, high-yield formula review, and daily full-length mock exams.',
    examOutcome:
      'Score Booster: Eliminate negative-marking traps and boost speed in the final 45 days before MECEE.',
    headline: 'High-Speed Syllabus Revision, Formula Vault & 20 Full-Length Timed Mocks.',
    description:
      'Focused revision program pinpointing the highest-frequency sub-topics in Zoology, Botany, Chemistry, Physics, and MAT with daily timed mock test drills. Available via full enrollment (NPR 2,299) or refundable seat reservation deposit (NPR 300 now + NPR 1,999 at batch start).',
    priceNpr: 2299,
    originalPriceNpr: 4990,
    payableNowNpr: 2299,
    payableLaterNpr: 0,
    depositNpr: 300,
    prebookPath: '/prebook',
    validityDays: 45,
    validityText: '45 Days Intensive Crash Access',
    languageMedium: 'English Medium',
    subjects: [
      { name: 'Medical High-Yield PCB Rapid Revision', chaptersCount: 45, icon: '⚡' },
      { name: 'MAT Speed & Logic Drills', chaptersCount: 10, icon: '🧠' },
    ],
    faculty: [
      {
        name: 'Dr. Samyak Shrestha',
        role: 'Chief Medical Educator',
        qualification: 'MBBS (IOM Maharajgunj), CEE Entrance Specialist',
        verified: true,
      },
      {
        name: 'Er. Bishal Adhikari',
        role: 'Physics Entrance Specialist',
        qualification: 'M.Sc. Physics (TU), 10+ Yrs Entrance Training',
        verified: true,
      },
    ],
    batchSchedule: {
      batchName: 'CEE 45-Day Rapid Revision Cohort',
      startDate: 'Pre-booking & Direct Enrollment Open · Immediate AI Pro Practice Access',
      liveSchedule: 'Daily 2-Hour High-Yield Rapid Review + Timed Mock Test',
      replayAvailable: true,
    },
    curriculum: [
      {
        moduleTitle: 'Module 1: Top 500 High-Yield Formulae & Named Reactions',
        topicsCount: 15,
        topics: [
          'Physics Formula Sheets (Mechanics, Optics, Electrostatics, Modern)',
          'Organic Chemistry Named Reactions & Reagent Summary',
          'Inorganic Qualitative & Periodic Exceptions',
          'MAT Numerical & Spatial Shortcuts',
        ],
        isDemoAvailable: true,
      },
      {
        moduleTitle: 'Module 2: High-Frequency Biology Exceptions & Diagrams',
        topicsCount: 12,
        topics: [
          'Human Physiology Hormonal & Enzyme Tables',
          'Plant Kingdom & Animal Phyla Comparative Charts',
          'Genetics Pedigree & Hardy-Weinberg Rapid Problems',
          '20 Full-Length 200-Q Mock Exam Debriefs',
        ],
        isDemoAvailable: true,
      },
    ],
    includedFeatures: [
      'Fast-Track Subchapter Revision Notes & Formula Sheets',
      '20 Full-Length 200-Question Timed Mocks (-0.25 Negative Marking)',
      'Weak-Topic Error Categorization & Spaced Review Sets',
      '24/7 AI Doubt Solver Access (75 queries/day)',
      'Option to Reserve Seat with NPR 300 Deposit (Credited 100% Toward NPR 2,299 Fee)',
    ],
    prerequisites: [
      'Completed basic reading of Class 11 & 12 PCB syllabus (designed for rapid revision rather than first-time scratch learning)',
    ],
    featureLimits: [
      '45 days course validity from batch commencement (or 90 days immediate AI Pro practice when pre-booked with NPR 300 deposit)',
      'Does not include full-length 180-day foundational chapter-by-chapter live lectures (included in Super Target Batch)',
    ],
    teachingAssetStatus: {
      status: 'ready',
      summary:
        'Rapid revision formula notes, 200-Q timed mock exams, mistake analyser, and AI doubt solver are immediately accessible upon activation.',
    },
    demoLesson: {
      title: 'Physics Mechanics: Kinetic Energy & Momentum Ratio Shortcut',
      subject: 'Physics · Mechanics',
      previewType: 'question_rubric',
      summary:
        'Solve entrance kinetic-energy and linear-momentum percentage change numericals in under 30 seconds.',
      demoUrl: '/practice',
      sampleQuestion: {
        stem: 'If the linear momentum (p) of a body is increased by 50%, its kinetic energy (KE) increases by:',
        options: ['50%', '100%', '125%', '225%'],
        answerIndex: 2,
        explanation:
          "Since KE = p² / (2m), when p becomes 1.5p (a 50% increase), KE' = (1.5)² KE = 2.25 KE. Percentage increase = (2.25 - 1) × 100% = 125%.",
      },
    },
    refundRules:
      '7-Day Full Money-Back Guarantee on full enrollment. NPR 300 prebooking deposit is 100% refundable prior to batch commencement and 100% credited toward the NPR 2,299 fee.',
    faqs: [
      {
        q: 'How does the NPR 300 prebooking deposit work?',
        a: 'You can either pay the full NPR 2,299 now, or pay NPR 300 on the Pre-book page to lock in the NPR 2,299 discounted fee (saving NPR 2,691 off NPR 4,990) and pay the remaining NPR 1,999 when live crash sessions begin.',
      },
      {
        q: 'Can I upgrade from the Crash Course to the 180-Day Super Target Batch later?',
        a: 'Yes, you can upgrade anytime by contacting academic support or paying the prorated difference in your dashboard.',
      },
    ],
    primaryCtaText: 'Enroll in Crash Course (NPR 2,299)',
    enrollPath: '/checkout?plan=cee-45-day-crash-course',
  },

  // ── 4. CEE SELF-PACED AI PRO PASS ────────────────────────────────────
  {
    slug: 'cee-ai-pro-yearly',
    aliases: ['cee-self-paced-pass', 'cee-ai-pro'],
    planSku: 'cee-ai-pro-yearly',
    track: 'cee_medical',
    courseFormat: 'self_paced_pass',
    formatLabel: 'Self-Paced Question Bank, Mocks & AI Pass',
    currency: 'NPR',
    title: 'CEE AI Pro Self-Paced Annual Pass',
    badge: 'SELF-PACED PASS · 365 DAYS',
    targetStudent:
      'Self-study CEE aspirants and Grade 11/12 students who want full access to the 15,000+ MCQ bank, mock exams, notes, and AI tutor without live evening classes.',
    examOutcome:
      'Year-round self-paced mastery across all 200-mark MECEE subjects with unlimited mock practice.',
    headline: 'Full Year Self-Paced Access to 15,000+ MCQs, Unlimited Mocks & AI Doubt Solver.',
    description:
      'Designed for disciplined self-study students. Includes complete digital chapter notes, 15,000+ past & model MCQs, unlimited 200-question timed mocks, SM-2 spaced repetition flashcards, and 75 daily AI tutor requests for a full year (also available as a 30-day monthly pass at NPR 600).',
    priceNpr: 5400,
    originalPriceNpr: 7200,
    payableNowNpr: 5400,
    payableLaterNpr: 0,
    validityDays: 365,
    validityText: '1 Full Year (365 Days Self-Paced Access)',
    languageMedium: 'English Medium',
    subjects: [
      { name: 'Zoology & Botany Question Bank', chaptersCount: 42, icon: '🧬' },
      { name: 'Physics & Chemistry Question Bank', chaptersCount: 60, icon: '⚗️' },
      { name: 'MAT & Full 200-Q Mock Simulator', chaptersCount: 10, icon: '🧠' },
    ],
    faculty: [
      {
        name: 'Dr. Samyak Shrestha',
        role: 'Question Bank & Rationale Reviewer',
        qualification: 'MBBS (IOM Maharajgunj)',
        verified: true,
      },
      {
        name: 'Samyak AI Doubt Solver',
        role: '24/7 Step-by-Step Tutor (75 Queries/Day)',
        qualification: 'Grounded in Verified MECEE Syllabus',
        verified: true,
        isAiPersona: true,
      },
    ],
    batchSchedule: {
      batchName: 'Self-Paced On-Demand Access',
      startDate: 'Instant Activation Upon Payment · Study on Your Own Schedule',
      liveSchedule: 'Self-Paced (No mandatory live class timings; includes weekend mock windows)',
      replayAvailable: true,
    },
    curriculum: [
      {
        moduleTitle: 'Self-Paced Digital Notes & 15,000+ Chapterwise MCQ Bank',
        topicsCount: 112,
        topics: [
          'All 112 Chapters across Zoology, Botany, Chemistry, Physics & MAT',
          'Difficulty Filter (Easy, Medium, Hard & Past Exam Questions)',
          'Step-by-Step Explanations & Bookmark Revision Lists',
          'SM-2 Spaced Repetition Flashcard Decks',
        ],
        isDemoAvailable: true,
      },
    ],
    includedFeatures: [
      '365 Days Access to All CEE Chapter Notes & Formula Sheets',
      '15,000+ Topicwise MCQs with Instant Step-by-Step Rationales',
      'Unlimited 200-Question Timed Mocks (-0.25 Negative Marking)',
      '75 Daily AI Tutor & Mistake Diagnosis Queries',
      'SM-2 Spaced Repetition Flashcards & Study Planner',
    ],
    prerequisites: [
      'Class 11 or Class 12 Science student or repeater preferring self-paced practice',
    ],
    featureLimits: [
      'Self-Paced Pass: does not include live interactive teacher broadcast classes (choose CEE Super Target Batch for live classes)',
      'AI Doubt Solver quota: 75 queries per day',
    ],
    teachingAssetStatus: {
      status: 'ready',
      summary:
        'All self-paced question banks, chapter notes, mock exam simulators, flashcards, and AI doubt tools are 100% live and ready.',
    },
    demoLesson: {
      title: 'Chemistry Equilibrium: pH & Buffer Calculation Drill',
      subject: 'Chemistry · Physical Chemistry',
      previewType: 'question_rubric',
      summary:
        'Practice Henderson-Hasselbalch buffer calculations and ionic product of water questions with instant rationale reveal.',
      demoUrl: '/practice',
      sampleQuestion: {
        stem: 'What is the pH of a neutral solution of pure water at 25°C (298 K) given Kw = 1.0 × 10⁻¹⁴ mol²/L²?',
        options: ['6.0', '7.0', '7.4', '14.0'],
        answerIndex: 1,
        explanation:
          'At 25°C, [H⁺] = [OH⁻] = √(1.0 × 10⁻¹⁴) = 1.0 × 10⁻⁷ M. Therefore, pH = -log₁₀(1.0 × 10⁻⁷) = 7.0.',
      },
    },
    refundRules: '7-Day Full Money-Back Guarantee.',
    faqs: [
      {
        q: 'What is the difference between the Self-Paced Pass (NPR 5,400) and the CEE Super Target Batch (NPR 7,990)?',
        a: 'The Self-Paced Pass gives you 365 days of access to all digital notes, 15,000+ MCQs, mock tests, and the AI Doubt Solver. The Super Target Batch (NPR 7,990) adds live faculty masterclasses and cohort mentoring.',
      },
      {
        q: 'Is there a monthly option if I do not want an annual pass?',
        a: 'Yes, you can also select the 30-day CEE AI Pro Monthly Plan (NPR 600) or CEE Premium Monthly Plan (NPR 350) directly on the checkout page.',
      },
    ],
    primaryCtaText: 'Enroll in Self-Paced Pass (NPR 5,400)',
    enrollPath: '/checkout?plan=cee-ai-pro-yearly',
  },

  // ── 5. SEE OPT MATH & SCIENCE SUBJECT COURSE ─────────────────────────
  {
    slug: 'see-opt-math-science-mastery',
    aliases: ['see-booster', '7day'],
    planSku: 'see-opt-math-science-mastery',
    track: 'see_class_10',
    courseFormat: 'subject_course',
    formatLabel: 'Subject Course (2-Subject Score Booster)',
    currency: 'NPR',
    title: 'SEE Optional Math & Science Score Booster',
    badge: 'SUBJECT COURSE · 2 SUBJECTS',
    targetStudent:
      'Grade 10 students wanting targeted excellence in the two most challenging board subjects (Optional Math & Science).',
    examOutcome: 'Grade A+ in Optional Mathematics & Compulsory Science.',
    headline: 'Master Hard Derivations, Theorems & Numerical Problems in Science & Opt Math.',
    description:
      'Targeted 2-subject course covering trigonometric identities, vector geometry proofs, coordinate geometry, and physics/chemistry numerical problem solving for SEE board candidates.',
    priceNpr: 2990,
    originalPriceNpr: 4990,
    payableNowNpr: 2990,
    payableLaterNpr: 0,
    validityDays: 120,
    validityText: '4 Months (120 Days Access)',
    languageMedium: 'English & Nepali Medium',
    subjects: [
      { name: 'Optional Mathematics', chaptersCount: 18, icon: '📊' },
      { name: 'Compulsory Science', chaptersCount: 24, icon: '🔬' },
    ],
    faculty: [
      {
        name: 'Er. Ramesh Karki',
        role: 'Mathematics Lead',
        qualification: 'B.E. (IOE Pulchowk), Author of SEE Topper Series',
        verified: true,
      },
      {
        name: 'Pradeep Poudel Sir',
        role: 'Senior Science Faculty',
        qualification: 'M.Sc. Physics (TU), 12+ Yrs Board Teaching',
        verified: true,
      },
    ],
    batchSchedule: {
      batchName: 'Math & Science Special Cohort',
      startDate: 'Immediate Access to Recorded Chapters & Problem Solving Sets',
      liveSchedule: '3 Days/Week Special Problem Solving Sessions (6:00 PM NPT)',
      replayAvailable: true,
    },
    curriculum: [
      {
        moduleTitle: 'Module 1: Vectors, Trigonometry & Coordinate Geometry (Opt Math)',
        topicsCount: 8,
        topics: [
          'Scalar Product & Geometric Vector Proofs',
          'Multiple & Sub-multiple Trigonometric Identities',
          'Angle Between Pair of Straight Lines',
          'Circle Equations & Tangent Derivations',
        ],
        isDemoAvailable: true,
      },
      {
        moduleTitle: 'Module 2: Physics Numericals & Chemistry Equations (Science)',
        topicsCount: 10,
        topics: [
          'Gravitation, Pressure & Hydrometer Numericals',
          'Heat Equation & Specific Heat Capacity Problems',
          'Electric Power, Transformer & Motor Calculations',
          'Balanced Chemical Equations & IUPAC Hydrocarbons',
        ],
        isDemoAvailable: true,
      },
    ],
    includedFeatures: [
      'Comprehensive Optional Math Theorem Proofs & Derivations',
      'Science Numerical Workbooks with Step-by-Step Solutions',
      'AI Handwritten Answer Marking for Math & Science',
      'Printable Past 10-Year Model Sets for Science & Opt Math',
    ],
    prerequisites: ['Class 10 student taking Optional Mathematics and Compulsory Science in SEE'],
    featureLimits: [
      'Covers 2 subjects only (Optional Mathematics & Compulsory Science) for 120 days',
      'Does not include Compulsory Math, English, Nepali, or Social Studies (choose SEE Board Topper Batch for all subjects)',
    ],
    teachingAssetStatus: {
      status: 'ready',
      summary:
        'Science and Optional Mathematics recorded lectures, 10-year solved papers, and AI handwritten grading rubrics are live.',
    },
    demoLesson: {
      title: 'Opt Math: Vector Proof & Scalar Product Identity',
      subject: 'Optional Math · Vectors',
      previewType: 'question_rubric',
      summary:
        'Clean 4-mark vector proof derivation formatted for full marks under NEB grading schemes.',
      demoUrl: '/see#learning-suite',
      sampleQuestion: {
        stem: 'If two non-zero vectors a⃗ and b⃗ are perpendicular (orthogonal) to each other, what is the value of their scalar (dot) product a⃗ · b⃗?',
        options: ['1', '-1', '0', '|a||b|'],
        answerIndex: 2,
        explanation:
          'Since a⃗ · b⃗ = |a⃗||b⃗| cos θ and θ = 90° for perpendicular vectors, cos 90° = 0, so a⃗ · b⃗ = 0.',
      },
    },
    refundRules: '7-Day Full Money-Back Guarantee.',
    faqs: [
      {
        q: 'Are English and Nepali mediums both supported?',
        a: 'Yes, formulas, theorem statements, and video explanations are provided in both English and Nepali mediums.',
      },
    ],
    primaryCtaText: 'Enroll in Math & Science Booster (NPR 2,990)',
    enrollPath: '/checkout?plan=see-opt-math-science-mastery',
  },

  // ── 6. AUXILIARY: IELTS MASTERY ──────────────────────────────────────
  {
    slug: 'english-ielts-target-8-mastery',
    aliases: ['ielts-preparation', 'ielts'],
    planSku: 'english-ielts-target-8-mastery',
    track: 'skills_languages',
    courseFormat: 'self_paced_pass',
    formatLabel: 'Self-Paced + Weekly Speaking Drills',
    currency: 'NPR',
    title: 'IELTS Academic & General Target Band 8.0+',
    badge: 'LANGUAGE PASS · IELTS',
    targetStudent:
      'Students and professionals preparing for IELTS Academic or General Training exams.',
    examOutcome:
      'Target Band 7.5 to 8.5 across Listening, Reading, Writing, and Speaking.',
    headline: '4-Skill Mastery with AI Speaking Simulator & Automated Essay Rubric Scoring.',
    description:
      'Structured IELTS preparation featuring real-time AI Speaking cue-card practice (Coach Aria), instant Writing Task 1 & 2 rubric feedback aligned with public IELTS Band Descriptors, and Cambridge-style reading/listening drills.',
    priceNpr: 3490,
    originalPriceNpr: 5990,
    payableNowNpr: 3490,
    payableLaterNpr: 0,
    validityDays: 60,
    validityText: '2 Months (60 Days Access)',
    languageMedium: 'English',
    subjects: [
      { name: 'IELTS Reading & Listening', chaptersCount: 10, icon: '🎧' },
      { name: 'IELTS Writing Task 1 & 2', chaptersCount: 6, icon: '✍️' },
      { name: 'IELTS Speaking Part 1, 2 & 3', chaptersCount: 4, icon: '🎙️' },
    ],
    faculty: [
      {
        name: 'Subash Bhattarai',
        role: 'Senior English Language Faculty',
        qualification: 'M.A. English Literature, Certified IELTS Trainer',
        verified: true,
      },
      {
        name: 'Coach Aria (AI Assessor)',
        role: 'AI Speech & Writing Rubric Evaluator',
        qualification: 'Calibrated to Public IELTS Band Descriptors (FC, LR, GRA, PR)',
        verified: true,
        isAiPersona: true,
      },
    ],
    batchSchedule: {
      batchName: 'IELTS 60-Day Intensive Pass',
      startDate: 'Instant On-Demand Access · Start Anytime',
      liveSchedule: 'Self-Paced 10-Module Classroom + Weekly Speaking Review Clinic',
      replayAvailable: true,
    },
    curriculum: [
      {
        moduleTitle: 'Module 1: Writing Task 2 — Band 8.0 Essay Architecture',
        topicsCount: 6,
        topics: [
          'Task Response & Clear Position Development',
          'Coherence, Cohesion & Paragraphing Logic',
          'Lexical Resource & Academic Collocations',
          'Grammatical Range & Complex Sentence Structures',
        ],
        isDemoAvailable: true,
      },
      {
        moduleTitle: 'Module 2: Speaking Part 1, 2 Cue Cards & Part 3 Follow-Ups',
        topicsCount: 6,
        topics: [
          '1-Minute Cue Card Note-Taking Framework',
          'Fluency Without Memorized Script Penalties',
          'Part 3 Abstract Analytical Responses',
          'Interactive Voice Practice with Coach Aria AI',
        ],
        isDemoAvailable: true,
      },
    ],
    includedFeatures: [
      'Interactive AI Speaking Simulator (Coach Aria) with Transcript Feedback',
      'Writing Task 1 & 2 Automated Band Descriptors Evaluation',
      'Cambridge-Style Academic & GT Reading/Listening Drills',
      '10-Module Structured IELTS Classroom & Vocabulary Vault',
    ],
    prerequisites: [
      'Intermediate English comprehension (CEFR B1 or above recommended)',
      'Microphone-enabled phone or laptop for interactive speaking drills',
    ],
    featureLimits: [
      '60 days access from enrollment',
      'AI Band scores are practice estimates calibrated to public rubrics and are not official British Council or IDP test certificates',
    ],
    teachingAssetStatus: {
      status: 'ready',
      summary:
        '10-Module IELTS Classroom, Coach Aria Speaking Simulator, Cambridge reading vault, and AI essay evaluator are live.',
    },
    demoLesson: {
      title: 'IELTS Speaking Part 2 Cue Card & Reading T/F/NG Strategy',
      subject: 'IELTS · Speaking & Reading',
      previewType: 'question_rubric',
      summary:
        'Learn how to distinguish FALSE from NOT GIVEN in Academic Reading and structure a 2-minute Cue Card talk.',
      demoUrl: '/english/speaking',
      sampleQuestion: {
        stem: 'In IELTS Academic Reading, if a statement contradicts the information given in the passage, the correct answer is:',
        options: ['TRUE', 'FALSE', 'NOT GIVEN', 'SKIP'],
        answerIndex: 1,
        explanation:
          'In True/False/Not Given tasks, if the passage directly states the opposite of the claim, mark FALSE. Mark NOT GIVEN only when the passage neither confirms nor contradicts the statement.',
      },
    },
    refundRules: '7-Day Full Money-Back Guarantee.',
    faqs: [
      {
        q: 'Is this for Academic or General Training?',
        a: 'Both Academic and General Training modules are included, with dedicated Writing Task 1 instruction (graphs/reports for Academic; formal/semi-formal letters for GT).',
      },
    ],
    primaryCtaText: 'Enroll in IELTS Mastery (NPR 3,490)',
    enrollPath: '/checkout?plan=english-ielts-target-8-mastery',
  },

  // ── 7. AUXILIARY: DIGITAL MARKETING & FREELANCING ────────────────────
  {
    slug: 'digital-marketing-canva-freelancing',
    aliases: ['digital-marketing'],
    planSku: 'digital-marketing-canva-freelancing',
    track: 'skills_languages',
    courseFormat: 'self_paced_pass',
    formatLabel: 'Hands-On Skills Course (Self-Paced)',
    currency: 'NPR',
    title: 'Digital Marketing, Meta Ads & Freelancing 101',
    badge: 'SKILLS PASS · MARKETING',
    targetStudent:
      'Students, entrepreneurs, and aspiring freelancers in Nepal looking to build practical digital marketing campaigns.',
    examOutcome:
      'Plan, launch, and analyze Meta Ads, Google Search campaigns, and SEO content strategies.',
    headline: 'Practical Campaign Building: SEO, Meta Ads, Content Funnels & Analytics.',
    description:
      'Step-by-step practical training covering audience research, Facebook & Instagram Ads Manager, on-page SEO, Canva creative design, and GA4 campaign reporting.',
    priceNpr: 1990,
    originalPriceNpr: 3490,
    payableNowNpr: 1990,
    payableLaterNpr: 0,
    validityDays: 45,
    validityText: '45 Days Access',
    languageMedium: 'English & Nepali Explanation',
    subjects: [
      { name: 'Meta Ads & Social Funnels', chaptersCount: 6, icon: '📈' },
      { name: 'SEO, Content & Analytics', chaptersCount: 6, icon: '🔍' },
    ],
    faculty: [
      {
        name: 'Nabin KC',
        role: 'AI & Digital Tech Educator',
        qualification: 'Software Engineer & Digital Growth Specialist',
        verified: true,
      },
    ],
    batchSchedule: {
      batchName: 'Self-Paced Practical Track',
      startDate: 'Instant Activation · Self-Paced Modules',
      liveSchedule: 'On-Demand Modules + Interactive AI Copywriting Sandbox',
      replayAvailable: true,
    },
    curriculum: [
      {
        moduleTitle: 'Module 1: Funnel Architecture, Meta Ads & Creative Testing',
        topicsCount: 6,
        topics: [
          'Audience Personas & Marketing Funnel Stages',
          'Meta Pixel & Custom Audience Targeting',
          'High-Converting Ad Copy & Canva Visuals',
          'A/B Testing & Budget Allocation Basics',
        ],
        isDemoAvailable: true,
      },
      {
        moduleTitle: 'Module 2: Search Engine Optimization (SEO) & GA4 Analytics',
        topicsCount: 6,
        topics: [
          'Keyword Intent Research & On-Page SEO Structure',
          'Local SEO & Google Business Profile Optimization',
          'Google Search Ads & Bidding Fundamentals',
          'Measuring Campaign ROI with GA4',
        ],
        isDemoAvailable: true,
      },
    ],
    includedFeatures: [
      '12 Practical Modules Across Meta Ads, SEO & Analytics',
      'Interactive AI Copywriting & Prompt Studio Access',
      'Ad Campaign Checklist & Client Reporting Templates',
      'Course Completion Certificate upon Project Submission',
    ],
    prerequisites: ['No prior marketing or coding experience required'],
    featureLimits: [
      '45 days access to course modules and templates',
      'Live ad spend budgets on Meta/Google are not included in tuition (students practice using campaign simulators and optional personal ad accounts)',
    ],
    teachingAssetStatus: {
      status: 'ready',
      summary:
        'Digital marketing curriculum modules and the interactive AI Prompt & Copywriting Studio (/digital) are live.',
    },
    demoLesson: {
      title: 'Performance Marketing: Conversion Rate & ROAS Calculation',
      subject: 'Digital Marketing · Analytics',
      previewType: 'question_rubric',
      summary:
        'Calculate Return on Ad Spend (ROAS) and Cost Per Acquisition (CPA) before scaling an ad campaign.',
      demoUrl: '/digital',
      sampleQuestion: {
        stem: 'If an online store spends NPR 10,000 on Meta Ads and generates NPR 40,000 in direct tracked revenue, what is the Return on Ad Spend (ROAS)?',
        options: ['0.25x', '2.5x', '4.0x', '30.0x'],
        answerIndex: 2,
        explanation:
          'ROAS = Revenue Attributable to Ads / Ad Spend = 40,000 / 10,000 = 4.0x (NPR 4 earned for every NPR 1 spent).',
      },
    },
    refundRules: '7-Day Full Money-Back Guarantee.',
    faqs: [
      {
        q: 'Do I need prior marketing experience?',
        a: 'No prior experience is needed. The modules start from foundational funnel concepts and progress to campaign setup.',
      },
    ],
    primaryCtaText: 'Enroll in Digital Marketing (NPR 1,990)',
    enrollPath: '/checkout?plan=digital-marketing-canva-freelancing',
  },

  // ── 8. AUXILIARY: PYTHON & AI APPLICATIONS ───────────────────────────
  {
    slug: 'digital-python-programming-zero-to-hero',
    aliases: ['ai-python-course', 'python-ai'],
    planSku: 'digital-python-programming-zero-to-hero',
    track: 'skills_languages',
    courseFormat: 'self_paced_pass',
    formatLabel: 'Hands-On Coding & AI Pass (Self-Paced)',
    currency: 'NPR',
    title: 'Python Programming & AI Applications Zero to Hero',
    badge: 'TECH PASS · PYTHON & AI',
    targetStudent:
      'Students, beginners, and aspiring developers in Nepal eager to learn Python coding and LLM API automation.',
    examOutcome:
      'Write clean Python programs, automate repetitive workflows, and build practical AI API applications.',
    headline: 'Learn Python Fundamentals, REST APIs, and Generative AI Integration.',
    description:
      'Hands-on coding pass covering Python syntax, data structures, file/API automation, prompt engineering, and building applications with modern AI SDKs.',
    priceNpr: 2490,
    originalPriceNpr: 4500,
    payableNowNpr: 2490,
    payableLaterNpr: 0,
    validityDays: 60,
    validityText: '2 Months (60 Days Hands-On Access)',
    languageMedium: 'English & Nepali Explanation',
    subjects: [
      { name: 'Python Core & Automation', chaptersCount: 6, icon: '🐍' },
      { name: 'LLM APIs & AI Tool Building', chaptersCount: 4, icon: '🤖' },
    ],
    faculty: [
      {
        name: 'Nabin KC',
        role: 'Software Engineer, AI & Tech Educator',
        qualification: 'Full-Stack & AI Application Developer',
        verified: true,
      },
    ],
    batchSchedule: {
      batchName: 'Python + AI Self-Paced Cohort',
      startDate: 'Instant Activation · 60 Days Full Access',
      liveSchedule: 'Self-Paced Coding Modules + Interactive Prompt Studio',
      replayAvailable: true,
    },
    curriculum: [
      {
        moduleTitle: 'Module 1: Python Fundamentals, Data Structures & File I/O',
        topicsCount: 6,
        topics: [
          'Variables, Control Flow, Loops & Functions',
          'Lists, Dictionaries, Sets & JSON Processing',
          'Object-Oriented Python & Virtual Environments',
          'Error Handling & Working with REST APIs',
        ],
        isDemoAvailable: true,
      },
      {
        moduleTitle: 'Module 2: Generative AI APIs & Task Automation Projects',
        topicsCount: 4,
        topics: [
          'Structured Prompt Engineering & JSON Schema Outputs',
          'Connecting Python Scripts to Gemini & OpenAI APIs',
          'Building a Document Summarizer & Study Assistant',
          'Deploying a Web Application Portfolio Project',
        ],
        isDemoAvailable: true,
      },
    ],
    includedFeatures: [
      '10 Structured Python & AI Application Modules',
      '6 Guided Hands-On Coding Projects with Starter Templates',
      'Interactive AI Prompt Studio & Rubric Evaluator (/digital)',
      '60 Days Full Access & Completion Certificate',
    ],
    prerequisites: [
      'No prior programming experience required',
      'A Windows, Mac, or Linux computer is recommended for running local Python scripts',
    ],
    featureLimits: [
      '60 days access from enrollment',
      'Students use free-tier API keys (such as Google AI Studio / Gemini free tier) for personal coding projects',
    ],
    teachingAssetStatus: {
      status: 'ready',
      summary:
        'Python & AI syllabus modules and interactive AI Prompt Studio (/digital) are live.',
    },
    demoLesson: {
      title: 'Python Basics: List Comprehensions & JSON Parsing',
      subject: 'Python · Core Programming',
      previewType: 'question_rubric',
      summary:
        'Understand how Python list comprehensions transform and filter data cleanly in a single readable line.',
      demoUrl: '/digital',
      sampleQuestion: {
        stem: 'What is the output of the Python expression `[x * 2 for x in [1, 2, 3, 4] if x % 2 == 0]`?',
        options: ['[2, 4, 6, 8]', '[4, 8]', '[2, 6]', '[2, 4]'],
        answerIndex: 1,
        explanation:
          'The condition `if x % 2 == 0` filters the list to even numbers `[2, 4]`, and `x * 2` doubles each remaining element to produce `[4, 8]`.',
      },
    },
    refundRules: '7-Day Full Money-Back Guarantee.',
    faqs: [
      {
        q: 'Is this suitable for complete beginners in coding?',
        a: 'Yes! We start from scratch with variables, loops, and functions before moving to APIs and AI integrations.',
      },
    ],
    primaryCtaText: 'Enroll in Python & AI Pass (NPR 2,490)',
    enrollPath: '/checkout?plan=digital-python-programming-zero-to-hero',
  },
];

export function getAllCourses(): CourseData[] {
  return CANONICAL_CATALOG;
}

export function getCourseBySlug(slug: string): CourseData | undefined {
  if (!slug) return undefined;
  const norm = slug.toLowerCase().trim();
  return CANONICAL_CATALOG.find(
    (c) =>
      c.slug === norm ||
      c.planSku === norm ||
      (c.aliases && c.aliases.includes(norm))
  );
}

/**
 * Resolves any course slug, alias, or checkout plan SKU to a valid payment gateway plan SKU.
 */
export function resolveCheckoutPlanSku(input?: string | null): string {
  if (!input) return 'cee-mbbs-mastery-2026';
  const norm = input.toLowerCase().trim();
  if (norm === 'prebook' || norm === 'crash-course-deposit' || norm === 'cee-crash-course-deposit') {
    return PREBOOK_OFFER.depositSku;
  }
  if (norm === 'cee-crash-course-balance') {
    return PREBOOK_OFFER.balanceSku;
  }
  const matchedCourse = getCourseBySlug(norm);
  if (matchedCourse) {
    return matchedCourse.planSku;
  }
  return norm;
}

export function getCoursesByTrack(track: CourseTrack): CourseData[] {
  return CANONICAL_CATALOG.filter((c) => c.track === track);
}

export function getFeaturedFlagships(): CourseData[] {
  return [
    CANONICAL_CATALOG[0], // SEE Board Topper
    CANONICAL_CATALOG[1], // CEE Medical Super Target
  ];
}

export interface OfferBreakdown {
  slug: string;
  planSku: string;
  title: string;
  courseFormat: CourseDeliveryFormat;
  formatLabel: string;
  currency: 'NPR';
  fullPriceNpr: number;
  originalPriceNpr: number;
  payableNowNpr: number;
  payableLaterNpr: number;
  depositNpr?: number;
  savingsNpr: number;
  validityText: string;
  refundRules: string;
  isPrebookable: boolean;
  prebookPath?: string;
  enrollPath: string;
}

export function getOfferBreakdown(slugOrSku: string): OfferBreakdown | null {
  const norm = slugOrSku.toLowerCase().trim();
  if (norm === 'prebook' || norm === 'crash-course-deposit' || norm === 'cee-crash-course-deposit') {
    return {
      slug: PREBOOK_OFFER.sku,
      planSku: PREBOOK_OFFER.depositSku,
      title: 'CEE 45-Day Crash Course · Seat Reservation Deposit',
      courseFormat: 'crash_course',
      formatLabel: 'Crash Course Seat Reservation Deposit',
      currency: 'NPR',
      fullPriceNpr: PREBOOK_OFFER.totalCourseFeeNpr,
      originalPriceNpr: PREBOOK_OFFER.comparisonPriceNpr,
      payableNowNpr: PREBOOK_OFFER.depositAmountNpr,
      payableLaterNpr: PREBOOK_OFFER.remainingBalanceNpr,
      depositNpr: PREBOOK_OFFER.depositAmountNpr,
      savingsNpr: PREBOOK_OFFER.totalSavingsNpr,
      validityText: `${PREBOOK_OFFER.accessDaysImmediate} Days Immediate AI Pro + ${PREBOOK_OFFER.crashCourseDays} Days Crash Course`,
      refundRules: PREBOOK_OFFER.refundPolicy,
      isPrebookable: true,
      prebookPath: '/prebook',
      enrollPath: '/checkout?plan=cee-crash-course-deposit',
    };
  }

  const course = getCourseBySlug(norm);
  if (!course) return null;

  return {
    slug: course.slug,
    planSku: course.planSku,
    title: course.title,
    courseFormat: course.courseFormat,
    formatLabel: course.formatLabel,
    currency: course.currency,
    fullPriceNpr: course.priceNpr,
    originalPriceNpr: course.originalPriceNpr || course.priceNpr,
    payableNowNpr: course.payableNowNpr,
    payableLaterNpr: course.payableLaterNpr,
    depositNpr: course.depositNpr,
    savingsNpr: (course.originalPriceNpr || course.priceNpr) - course.priceNpr,
    validityText: course.validityText,
    refundRules: course.refundRules,
    isPrebookable: !!course.depositNpr,
    prebookPath: course.prebookPath,
    enrollPath: course.enrollPath,
  };
}

export const COURSES = CANONICAL_CATALOG;
