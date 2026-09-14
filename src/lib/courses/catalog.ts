/**
 * Samyak Tutor LMS — Canonical Course & Pricing Registry
 * Single authoritative source of truth for all public pages, course detail templates,
 * and checkout entries. All prices strictly match PLAN_PRICES in gateways.ts.
 */

export type CourseTrack = 'see_class_10' | 'cee_medical' | 'skills_languages';

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

export interface DemoLesson {
  title: string;
  subject: string;
  previewType: 'video' | 'question_rubric';
  summary: string;
  demoUrl?: string;
}

export interface CourseData {
  slug: string;
  planSku: string;
  track: CourseTrack;
  title: string;
  badge: string;
  targetStudent: string;
  examOutcome: string;
  headline: string;
  description: string;
  priceNpr: number;
  originalPriceNpr?: number;
  validityDays: number;
  validityText: string;
  languageMedium: string;
  subjects: CourseSubject[];
  faculty: CourseFaculty[];
  batchSchedule: BatchSchedule;
  curriculum: CurriculumModule[];
  includedFeatures: string[];
  demoLesson: DemoLesson;
  refundRules: string;
  faqs: { q: string; a: string }[];
  primaryCtaText: string;
  enrollPath: string;
}

export const CANONICAL_CATALOG: CourseData[] = [
  // ── SEE CLASS 10 FLAGSHIP ─────────────────────────────────────────────
  {
    slug: 'see-class-10-board-topper-batch',
    planSku: 'see-class-10-board-topper-batch',
    track: 'see_class_10',
    title: 'SEE Class 10 Board Topper Batch 2082/2083',
    badge: 'FLAGSHIP · BOARD PREP',
    targetStudent: 'Grade 10 students in Nepal aiming for GPA 4.0 in National Examination Board (NEB) finals.',
    examOutcome: 'Target GPA 4.0 (Grade A+ in Science, Compulsory Math, Optional Math, English & Social).',
    headline: 'Complete Board Examination Preparation Aligned with the CDC Nepal Curriculum.',
    description: 'A comprehensive, structured academic year program covering all 5 core board subjects with live interactive classes, 10-year past papers solved with marking rubrics, and AI handwritten answer grading.',
    priceNpr: 4990,
    originalPriceNpr: 7990,
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
      { name: 'Pradeep Poudel Sir', role: 'Senior Science Faculty', qualification: 'M.Sc Physics (TU), 14+ Years Board Examiner', verified: true },
      { name: 'Er. Ramesh Karki', role: 'Mathematics Lead', qualification: 'B.E (IOE Pulchowk), Author of SEE Topper Series', verified: true },
    ],
    batchSchedule: {
      batchName: 'Alpha Evening Batch 2082',
      startDate: 'Classes Running Daily · New Enrollments Active',
      liveSchedule: 'Monday – Friday: 6:00 PM – 8:00 PM NPT',
      replayAvailable: true,
    },
    curriculum: [
      {
        moduleTitle: 'Unit 1: Force, Gravitation & Energy (Science)',
        topicsCount: 6,
        topics: ['Newton\'s Law of Gravitation', 'Acceleration due to Gravity (g)', 'Free Fall & Weightlessness', 'Gravitational Derivations for 4 Marks'],
        isDemoAvailable: true,
      },
      {
        moduleTitle: 'Unit 2: Trigonometry & Compound Angles (Opt Math)',
        topicsCount: 8,
        topics: ['Multiple & Sub-multiple Angles', 'Trigonometric Transformations', 'Conditional Identities', 'Heights & Distances Model Derivations'],
        isDemoAvailable: true,
      },
      {
        moduleTitle: 'Unit 3: Mensuration & Geometry (Comp Math)',
        topicsCount: 7,
        topics: ['Cylinder, Sphere & Hemisphere Volume/Area', 'Pyramid & Cone', 'Circle Theorems & Experimental Verification', 'Area of Triangles & Quadrilaterals'],
        isDemoAvailable: false,
      },
      {
        moduleTitle: 'Unit 4: Chemistry — Metals & Chemical Reactions',
        topicsCount: 5,
        topics: ['Types of Chemical Reactions', 'Acid, Base and Salt', 'Metals (Iron, Copper, Aluminium)', 'Hydrocarbons & Carbon Compounds'],
        isDemoAvailable: false,
      },
    ],
    includedFeatures: [
      'Daily Interactive Live Evening Batches (100ms HD)',
      'Instant HD Video Replays on Bunny.net CDN',
      '10-Year Solved NEB Board Question Bank (1, 2, 3, 4 Marks)',
      'AI Handwritten Answer Sheet Evaluator & Rubrics',
      'Printable A4 Model Question Sets with Marking Schemes',
      'Dedicated Doubt Clearing Support Forum',
    ],
    demoLesson: {
      title: 'Science 4-Mark Problem: Gravitational Force Derivation',
      subject: 'Science · Physics',
      previewType: 'question_rubric',
      summary: 'Step-by-step examiner marking breakdown for Newton\'s Universal Law of Gravitation and distance-halving proof.',
    },
    refundRules: '7-Day Full Money-Back Guarantee. If the batch does not meet your academic expectations within 7 days, get a 100% refund.',
    faqs: [
      { q: 'Is this course suitable for both Nepali and English medium students?', a: 'Yes. All video lectures, model answer sheets, and terminology are delivered bilingual (English & Nepali) adhering strictly to CDC curriculum guidelines.' },
      { q: 'What happens if I miss a live evening class?', a: 'Every live session is automatically recorded in HD and available within 15 minutes in your student dashboard for anytime replay.' },
      { q: 'How does the AI handwritten answer marker work?', a: 'You can take a photo of your handwritten math derivations or science answers. Our AI Evaluator marks it step-by-step against official board marking schemes.' },
    ],
    primaryCtaText: 'Enroll in SEE Topper Batch (NPR 4,990)',
    enrollPath: '/checkout?plan=see-class-10-board-topper-batch',
  },

  // ── CEE MEDICAL ENTRANCE FULL COURSE ───────────────────────────────────
  {
    slug: 'cee-mbbs-mastery-2026',
    planSku: 'cee-mbbs-mastery-2026',
    track: 'cee_medical',
    title: 'CEE Medical Entrance Super Target Batch 2026',
    badge: 'FLAGSHIP · MEDICAL ENTRANCE',
    targetStudent: '+2 Science graduates and re-takers preparing for the Medical Education Commission (MECEE) entrance exam.',
    examOutcome: 'Target 180+ Marks & Merit Scholarship Rank in MBBS, BDS, and B.Sc Nursing in Nepal.',
    headline: 'Nepal\'s Most Comprehensive MECEE Medical Entrance Program.',
    description: '15,000+ topic-wise MCQs with step-by-step rationales, 200-question timed mock exams with official -0.25 negative marking, high-yield sub-chapter notes, and 24/7 AI medical doubt resolution.',
    priceNpr: 7990,
    originalPriceNpr: 14990,
    validityDays: 180,
    validityText: '6 Months (Full Entrance Cycle Access)',
    languageMedium: 'English',
    subjects: [
      { name: 'Zoology', chaptersCount: 22, icon: '🧬' },
      { name: 'Botany', chaptersCount: 20, icon: '🌿' },
      { name: 'Chemistry (Organic, Inorganic, Physical)', chaptersCount: 32, icon: '⚗️' },
      { name: 'Physics (Mechanics, Optics, Modern)', chaptersCount: 28, icon: '⚡' },
      { name: 'Mental Agility Test (MAT)', chaptersCount: 10, icon: '🧠' },
    ],
    faculty: [
      { name: 'Dr. Samyak Shrestha', role: 'Chief Medical Educator', qualification: 'MBBS (IOM Maharajgunj), CEE Top 10 Ranker', verified: true },
      { name: 'Er. Aakash Sharma', role: 'Senior Physics Faculty', qualification: 'M.Tech, 12+ Years Medical Entrance Specialist', verified: true },
    ],
    batchSchedule: {
      batchName: 'MECEE 2026 Super Batch',
      startDate: 'Daily Cohort Running · Instant Access to All Modules',
      liveSchedule: 'Daily Live Masterclasses + Weekend 200-Q Mocks at 8:00 AM NPT',
      replayAvailable: true,
    },
    curriculum: [
      {
        moduleTitle: 'Zoology: Human Physiology & Genetics',
        topicsCount: 12,
        topics: ['Digestive & Respiratory System High-Yield MCQs', 'Circulatory & Excretory Dynamics', 'Mendelian Genetics & Chromosomal Aberrations', 'Evolution & Animal Behavior'],
        isDemoAvailable: true,
      },
      {
        moduleTitle: 'Botany: Plant Physiology & Cell Biology',
        topicsCount: 10,
        topics: ['Photosynthesis: C3, C4 & CAM Pathway Specifics', 'Cell Organelles & Mitosis/Meiosis Phases', 'Plant Anatomy & Secondary Growth', 'Ecology & Nutrient Cycles'],
        isDemoAvailable: true,
      },
      {
        moduleTitle: 'Physics: Mechanics, Heat & Electrodynamics',
        topicsCount: 15,
        topics: ['Rotational Dynamics & Moment of Inertia', 'First & Second Laws of Thermodynamics', 'Electrostatics & Gauss Theorem Applications', 'Ray Optics & Wave Optics'],
        isDemoAvailable: false,
      },
      {
        moduleTitle: 'Chemistry: Organic Reaction Mechanisms & Physical Chemistry',
        topicsCount: 14,
        topics: ['Aldehydes, Ketones & Carboxylic Acids', 'Chemical Kinetics & Rate Laws', 'Thermodynamics & Equilibrium Constants', 'Coordination Compounds & Periodic Trends'],
        isDemoAvailable: false,
      },
    ],
    includedFeatures: [
      '15,000+ Topicwise High-Yield MCQs with Step-by-Step Rationales',
      '200-Question Timed Mock Exams with -0.25 Negative Marking',
      'National Percentile & Merit Rank Prediction',
      'Sub-Chapter High-Yield Revision Notes (Bio, Chem, Physics)',
      'Real-Time 1v1 Entrance Battle Arena',
      '24/7 AI Medical Doubt Solver Assistant',
    ],
    demoLesson: {
      title: 'Botany C4 Photosynthesis & PEPcase Mechanism',
      subject: 'Botany · Physiology',
      previewType: 'question_rubric',
      summary: 'In-depth analysis of CO2 fixation in C4 plants, Kranz anatomy, and why PEP carboxylase avoids wasteful photorespiration.',
    },
    refundRules: '7-Day Full Money-Back Guarantee. Test the question banks and mock tests risk-free for 7 days.',
    faqs: [
      { q: 'Is this course strictly mapped to the Medical Education Commission syllabus?', a: 'Yes. Every note, question, and mock exam conforms 100% to the latest MECEE syllabus published by the Medical Education Commission of Nepal.' },
      { q: 'How does the negative marking simulation work?', a: 'Our exam engine simulates actual MEC conditions: +1.0 mark for correct answers, -0.25 mark deduction for incorrect answers, and 0 for unattempted questions.' },
    ],
    primaryCtaText: 'Enroll in CEE Super Batch (NPR 7,990)',
    enrollPath: '/checkout?plan=cee-mbbs-mastery-2026',
  },

  // ── CEE 45-DAY CRASH COURSE ──────────────────────────────────────────
  {
    slug: 'cee-45-day-crash-course',
    planSku: 'cee-45-day-crash-course',
    track: 'cee_medical',
    title: 'CEE 45-Day Ultimate Crash Course 2026',
    badge: 'INTENSIVE REVISION',
    targetStudent: 'Students seeking fast-track revision, high-yield formula review, and daily full-length mock exams.',
    examOutcome: 'Score Booster: Rapid 20-30 mark improvement in the final 45 days before MECEE.',
    headline: 'High-Speed Syllabus Revision & 20 Full-Length Timed Mocks.',
    description: 'Focused revision series pinpointing the most frequently asked sub-topics in Zoology, Botany, Chemistry, Physics, and MAT with daily timed mock test drills.',
    priceNpr: 2299,
    originalPriceNpr: 4990,
    validityDays: 45,
    validityText: '45 Days Intensive Access',
    languageMedium: 'English',
    subjects: [
      { name: 'Medical High-Yield PCB', chaptersCount: 45, icon: '⚡' },
      { name: 'MAT Speed Drills', chaptersCount: 10, icon: '🧠' },
    ],
    faculty: [
      { name: 'Dr. Samyak Shrestha', role: 'Chief Medical Educator', qualification: 'MBBS (IOM Maharajgunj)', verified: true },
    ],
    batchSchedule: {
      batchName: 'Crash Batch 2026',
      startDate: 'Enrolling Now · Daily Fast-Track Sessions',
      liveSchedule: 'Daily 2-Hour High-Yield Rapid Review + Mock Test',
      replayAvailable: true,
    },
    curriculum: [
      {
        moduleTitle: 'Top 500 High-Yield Formulae & Named Reactions',
        topicsCount: 15,
        topics: ['Physics Formula Sheets (Mechanics, Optics, Modern)', 'Organic Chemistry Named Reactions & Reagents', 'Inorganic Qualitative Analysis', 'MAT Shortcuts'],
        isDemoAvailable: true,
      },
    ],
    includedFeatures: [
      'Fast-Track Subchapter Revision Notes',
      '20 Full-Length 200-Question Timed Mocks (-0.25 Negative Marking)',
      'Weak-Topic Analysis & Diagnostic Reports',
      '24/7 AI Doubt Solver Access',
    ],
    demoLesson: {
      title: 'Physics Mechanics: Work-Energy Theorem Shortcut Tricks',
      subject: 'Physics · Mechanics',
      previewType: 'question_rubric',
      summary: 'Solve complex entrance energy conservation numericals in under 45 seconds using ratio shortcuts.',
    },
    refundRules: '7-Day Money-Back Guarantee.',
    faqs: [
      { q: 'Can I upgrade from Crash Course to the Full Course later?', a: 'Yes! You can upgrade anytime by paying the prorated difference directly in your dashboard.' },
    ],
    primaryCtaText: 'Enroll in Crash Course (NPR 2,299)',
    enrollPath: '/checkout?plan=cee-45-day-crash-course',
  },

  // ── SEE OPT MATH & SCIENCE BOOSTER ────────────────────────────────────
  {
    slug: 'see-opt-math-science-mastery',
    planSku: 'see-opt-math-science-mastery',
    track: 'see_class_10',
    title: 'SEE Optional Math & Science Score Booster',
    badge: 'SUBJECT SPECIAL',
    targetStudent: 'Grade 10 students wanting targeted excellence in the two most challenging board subjects.',
    examOutcome: 'Grade A+ in Optional Mathematics & Compulsory Science.',
    headline: 'Master Hard Derivations, Theorems & Numerical Problems.',
    description: 'Intensive theorem proofs, trigonometry identities, vector geometry, and physics/chemistry numerical problem solving for SEE board candidates.',
    priceNpr: 2990,
    originalPriceNpr: 4990,
    validityDays: 120,
    validityText: '4 Months (120 Days Access)',
    languageMedium: 'English & Nepali Medium',
    subjects: [
      { name: 'Optional Mathematics', chaptersCount: 18, icon: '📊' },
      { name: 'Compulsory Science', chaptersCount: 24, icon: '🔬' },
    ],
    faculty: [
      { name: 'Er. Ramesh Karki', role: 'Mathematics Lead', qualification: 'B.E (IOE Pulchowk)', verified: true },
    ],
    batchSchedule: {
      batchName: 'Math & Science Special Cohort',
      startDate: 'Live Now',
      liveSchedule: '3 Days/Week Special Live Problem Solving Sessions',
      replayAvailable: true,
    },
    curriculum: [
      {
        moduleTitle: 'Vectors & Coordinate Geometry Masterclass',
        topicsCount: 8,
        topics: ['Scalar Product & Applications', 'Vector Methods for Geometric Proofs', 'Pair of Straight Lines', 'Circle Equations'],
        isDemoAvailable: true,
      },
    ],
    includedFeatures: [
      'Comprehensive Optional Math Theorem Proofs',
      'Science Numerical Workbooks with Detailed Solutions',
      'AI Handwritten Answer Marking for Mathematics',
      'Printable Past 10-Year Model Sets',
    ],
    demoLesson: {
      title: 'Opt Math: Vector Proof of Apollonius Theorem',
      subject: 'Optional Math · Vectors',
      previewType: 'question_rubric',
      summary: 'Clean 4-mark vector proof derivation formatted for maximum marks under NEB grading schemes.',
    },
    refundRules: '7-Day Money-Back Guarantee.',
    faqs: [
      { q: 'Are English and Nepali mediums both supported?', a: 'Yes, formulas and theorem statements are taught in both mediums.' },
    ],
    primaryCtaText: 'Enroll in Math & Science Booster (NPR 2,990)',
    enrollPath: '/checkout?plan=see-opt-math-science-mastery',
  },

  // ── AUXILIARY: IELTS ──────────────────────────────────────────────────
  {
    slug: 'english-ielts-target-8-mastery',
    planSku: 'english-ielts-target-8-mastery',
    track: 'skills_languages',
    title: 'IELTS Academic & General Target Band 8.0+',
    badge: 'AUXILIARY · LANGUAGE',
    targetStudent: 'Students and professionals preparing for IELTS Academic or General Training exams.',
    examOutcome: 'Achieve Band 7.5 to 8.5 in all 4 components (Listening, Reading, Writing, Speaking).',
    headline: '4-Skill Mastery with AI Speaking Simulator & Essay Scoring.',
    description: 'Complete IELTS masterclass featuring real-time AI Speaking cue card assessment, instant writing task 1 & 2 lexical feedback, and authentic Cambridge mock tests.',
    priceNpr: 3490,
    originalPriceNpr: 5990,
    validityDays: 60,
    validityText: '2 Months (60 Days Access)',
    languageMedium: 'English',
    subjects: [
      { name: 'IELTS Academic & GT', chaptersCount: 20, icon: '🌐' },
    ],
    faculty: [
      { name: 'Samyak Language Faculty', role: 'Certified IELTS Specialist', qualification: 'IELTS Band 9.0 Scorer', verified: true },
    ],
    batchSchedule: {
      batchName: 'IELTS Cohort',
      startDate: 'Self-Paced with Weekly Live Speaking Drills',
      liveSchedule: 'Weekly Live Speaking & Essay Reviews',
      replayAvailable: true,
    },
    curriculum: [
      {
        moduleTitle: 'Writing Task 2: Band 8.0 Essay Architecture',
        topicsCount: 6,
        topics: ['Coherence & Cohesion Formats', 'Lexical Resource & Academic Collocations', 'Grammatical Range & Complex Sentences', 'Task Response Guidelines'],
        isDemoAvailable: true,
      },
    ],
    includedFeatures: [
      'Interactive AI Speaking Examiner Simulator',
      'Writing Task 1 & 2 Automated Band Descriptors Feedback',
      'Cambridge Academic & GT Audio Drills',
      'Speed Reading & Vocabulary Flashcards',
    ],
    demoLesson: {
      title: 'IELTS Speaking Part 2 Cue Card Strategy',
      subject: 'IELTS · Speaking',
      previewType: 'question_rubric',
      summary: '1-minute note-taking framework to speak fluently for 2 full minutes without hesitation or filler words.',
    },
    refundRules: '7-Day Money-Back Guarantee.',
    faqs: [
      { q: 'Is this for Academic or General Training?', a: 'Both Academic and General Training modules are included with dedicated task 1 instruction for each.' },
    ],
    primaryCtaText: 'Enroll in IELTS Mastery (NPR 3,490)',
    enrollPath: '/checkout?plan=english-ielts-target-8-mastery',
  },
];

export function getAllCourses(): CourseData[] {
  return CANONICAL_CATALOG;
}

export function getCourseBySlug(slug: string): CourseData | undefined {
  const norm = slug.toLowerCase().trim();
  return CANONICAL_CATALOG.find((c) => c.slug === norm || c.planSku === norm);
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
