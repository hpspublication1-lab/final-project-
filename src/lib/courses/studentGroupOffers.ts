/**
 * Samyak Guru — Free Offers & Pedagogical Progression by Student Group
 *
 * Source of truth for free resource menus, promotional hooks, content guardrails,
 * and optional paid progressions across all 6 student groups:
 * 1. Class 10 / SEE
 * 2. Class 11
 * 3. Class 12
 * 4. Medical entrance / CEE
 * 5. Engineering entrance (IOE)
 * 6. Lok Sewa (PSC Nepal)
 *
 * STRICT PEDAGOGICAL POLICY:
 * - Launch resources only for subjects with reviewed content and a responsible teacher.
 * - A single generic question bank must NEVER be presented as suitable for every stream,
 *   entrance exam, or Lok Sewa post. Content is strictly stream-isolated.
 */

import { CourseFaculty } from './catalog';

export type StudentGroupId =
  | 'class_10_see'
  | 'class_11'
  | 'class_12'
  | 'medical_cee'
  | 'engineering_entrance'
  | 'lok_sewa';

export type ResourceCategory =
  | 'diagnostic'
  | 'revision_sheet'
  | 'model_paper'
  | 'bridge_lesson'
  | 'formula_sheet'
  | 'flashcard'
  | 'current_affairs'
  | 'quiz'
  | 'study_plan'
  | 'guide';

export type ResourceDeliveryFormat =
  | 'interactive_test'
  | 'pdf_document'
  | 'flashcard_deck'
  | 'timed_drill'
  | 'planner_tool'
  | 'checklist';

export interface FreeResourceItem {
  id: string;
  title: string;
  category: ResourceCategory;
  description: string;
  reviewedSubject: string;
  responsibleTeacher: CourseFaculty;
  format: ResourceDeliveryFormat;
  actionText: string;
  actionHref: string;
  isDownloadable?: boolean;
  contentReviewed: boolean;
  editorialNote?: string;
}

export interface StudentGroupOffer {
  id: StudentGroupId;
  groupName: string;
  shortName: string;
  targetExam: string;
  badge: string;
  badgeBg: string;
  badgeText: string;
  accentBorder: string;
  responsibleFaculty: CourseFaculty[];
  reviewedSubjects: string[];

  // 1. Free resources to provide (as required by syllabus & policy)
  freeResourcesToProvide: {
    title: string;
    description: string;
    items: string[];
  }[];

  // 2. Main offer to promote
  mainOfferToPromote: {
    hook: string;
    subtext: string;
    ctaText: string;
    ctaHref: string;
    editorialGuideline: string;
    scannerValidationRule?: string;
    streamChoiceNote?: string;
  };

  // 3. Optional paid progression
  optionalPaidProgression: {
    title: string;
    courseSlug: string;
    courseHref: string;
    badge: string;
    features: string[];
    priceNpr?: number;
    summary: string;
  };

  // 4. Stream-specific guardrails
  streamGuardrails: {
    rule: string;
    isGenericBankProhibited: true;
    examScope: string;
    prohibitedPatterns: string[];
  };

  // 5. Concrete, reviewed free sample assets ready for immediate use
  concreteResources: FreeResourceItem[];
}

export const STUDENT_GROUP_OFFERS: Record<StudentGroupId, StudentGroupOffer> = {
  // ── 1. Class 10 / SEE ────────────────────────────────────────────────────────
  class_10_see: {
    id: 'class_10_see',
    groupName: 'Class 10 / SEE',
    shortName: 'SEE Class 10',
    targetExam: 'Secondary Education Examination (NEB Nepal Board)',
    badge: 'Grade 10 · NEB Board',
    badgeBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    badgeText: 'text-emerald-700 dark:text-emerald-400',
    accentBorder: 'border-emerald-500',
    responsibleFaculty: [
      {
        name: 'Pradeep Poudel Sir',
        role: 'Head of Secondary Science',
        qualification: 'M.Sc. Physics, 12+ Yrs SEE Science Specialization',
        verified: true,
      },
      {
        name: 'Er. Ramesh Karki',
        role: 'Lead Math Mentor',
        qualification: 'B.E. Pulchowk Campus, Compulsory & Opt Math Lead',
        verified: true,
      },
    ],
    reviewedSubjects: [
      'Compulsory Science (Physics, Chemistry, Biology, Astronomy)',
      'Compulsory Mathematics',
      'Optional Mathematics',
      'English & Grammar',
    ],
    freeResourcesToProvide: [
      {
        title: 'Subject Diagnostic',
        description: 'Pinpoint baseline knowledge and identify specific chapter gaps before board exams.',
        items: ['Science 25-question diagnostic set', 'Math conceptual diagnostic'],
      },
      {
        title: 'Chapter Revision Sheets',
        description: 'Concise chapter formulas, summary mind-maps, and key definitions.',
        items: ['Force & Motion revision card', 'Vector theorem summary', 'Chemical equations cheat sheet'],
      },
      {
        title: 'Original Model Papers & Worked Solutions',
        description: 'Standard NEB format model papers with step-by-step marking rubrics.',
        items: ['2082 Science Sample Paper with answers', '2082 Math Model Solution with step marks'],
      },
      {
        title: 'One Weekly Mock',
        description: 'Weekly full-length timed mock mirroring actual SEE exam timing and section rules.',
        items: ['Saturday 75-mark Science mock test', 'Sunday Compulsory Math mock'],
      },
      {
        title: 'Answer-Writing & Diagram Guides',
        description: 'How to draw clean biological diagrams, scientific equipment, and structure 4-mark answers.',
        items: ['Eye/Ear/Heart anatomical diagram rubrics', 'Step-by-step derivation writing template'],
      },
      {
        title: 'Seven-Day Revision Plan',
        description: 'Day-by-day blueprint for final week countdown to maximize letter grade.',
        items: ['Daily topic checklist', 'Time-allocation breakdown for Group A, B, C, D'],
      },
    ],
    mainOfferToPromote: {
      hook: 'Take a free SEE test and see which topics to revise next.',
      subtext: 'Instant score diagnosis across Science & Math with personalized topic-level revision priority.',
      ctaText: 'Start Free SEE Diagnostic',
      ctaHref: '/see',
      editorialGuideline:
        'Focus on actionable revision priorities. Provide clean rubrics for Groups A through D.',
      scannerValidationRule:
        'Add two handwritten-answer feedback trials per week only after the scanner is validated for the chosen question types.',
    },
    optionalPaidProgression: {
      title: 'SEE Class 10 Board Topper Batch 2082/2083',
      courseSlug: 'see-class-10-board-topper-batch',
      courseHref: '/courses/see-class-10-board-topper-batch',
      badge: 'Full Syllabus Live Batch',
      priceNpr: 4990,
      summary:
        'Structured full syllabus course, live teaching, additional marked practice, and individual teacher support.',
      features: [
        'Structured full syllabus live classes across all core subjects',
        'Live interactive teaching with two-way doubt solving',
        'Additional marked subjective practice with teacher reviews',
        'Individual teacher mentoring and 1-on-1 performance reviews',
        'Full 10-year Old-is-Gold solved question bank access',
      ],
    },
    streamGuardrails: {
      rule: 'Content must strictly reflect the CDC NEB Grade 10 specification grid. Never mix with higher entrance or Class 11 questions.',
      isGenericBankProhibited: true,
      examScope: 'Nepal Secondary Education Examination (SEE Grade 10)',
      prohibitedPatterns: ['CEE MCQs in SEE bank', 'Calculus/Derivatives in Class 10 Math', 'Unverified question banks'],
    },
    concreteResources: [
      {
        id: 'see-sci-diag-01',
        title: 'SEE Science 25-Question Baseline Diagnostic',
        category: 'diagnostic',
        description: 'Test your grasp across Physics, Chemistry, Biology, and Astronomy with instant topic breakdown.',
        reviewedSubject: 'Compulsory Science',
        responsibleTeacher: {
          name: 'Pradeep Poudel Sir',
          role: 'Head of Secondary Science',
          qualification: 'M.Sc. Physics',
          verified: true,
        },
        format: 'interactive_test',
        actionText: 'Attempt Free Diagnostic',
        actionHref: '/see',
        contentReviewed: true,
      },
      {
        id: 'see-force-sheet',
        title: 'Force, Gravity & Pressure Revision Sheet',
        category: 'revision_sheet',
        description: 'Key definitions, law proofs (g = GM/R^2), numerical formulas, and common unit conversion pitfalls.',
        reviewedSubject: 'Compulsory Science',
        responsibleTeacher: {
          name: 'Pradeep Poudel Sir',
          role: 'Head of Secondary Science',
          qualification: 'M.Sc. Physics',
          verified: true,
        },
        format: 'pdf_document',
        actionText: 'Download Revision Sheet',
        actionHref: '/see',
        isDownloadable: true,
        contentReviewed: true,
      },
      {
        id: 'see-opt-math-diag',
        title: 'Opt Math: Vector Geometry Theorem Blueprint',
        category: 'guide',
        description: 'Examiner rubrics and full proofs for Midpoint, Apollonius, and Parallelogram theorems.',
        reviewedSubject: 'Optional Mathematics',
        responsibleTeacher: {
          name: 'Er. Ramesh Karki',
          role: 'Lead Math Mentor',
          qualification: 'B.E. Pulchowk Campus',
          verified: true,
        },
        format: 'pdf_document',
        actionText: 'Read Proof Guide',
        actionHref: '/see',
        isDownloadable: true,
        contentReviewed: true,
      },
      {
        id: 'see-7day-plan',
        title: '7-Day SEE Final Revision Countdown Blueprint',
        category: 'study_plan',
        description: 'Daily revision schedule allocating 2 hours per subject, focusing on high-weightage topics.',
        reviewedSubject: 'All Subjects',
        responsibleTeacher: {
          name: 'Pradeep Poudel Sir',
          role: 'Head of Secondary Science',
          qualification: 'M.Sc. Physics',
          verified: true,
        },
        format: 'planner_tool',
        actionText: 'View Revision Plan',
        actionHref: '/see',
        contentReviewed: true,
      },
    ],
  },

  // ── 2. Class 11 ─────────────────────────────────────────────────────────────
  class_11: {
    id: 'class_11',
    groupName: 'Class 11',
    shortName: 'NEB Class 11',
    targetExam: 'Class 11 NEB Science / Management Board Examinations',
    badge: 'Grade 11 · NEB Foundation',
    badgeBg: 'bg-teal-500/10 dark:bg-teal-500/20',
    badgeText: 'text-teal-700 dark:text-teal-400',
    accentBorder: 'border-teal-500',
    responsibleFaculty: [
      {
        name: 'Er. Bishal Adhikari',
        role: 'Faculty Lead — Physics & Mechanics',
        qualification: 'B.E. Electronics, Pulchowk Campus (IOE Ranker)',
        verified: true,
      },
      {
        name: 'Dr. Samyak Shrestha',
        role: 'Academic Director — Biological Sciences',
        qualification: 'MBBS, Maharajgunj Medical Campus (IOM)',
        verified: true,
      },
    ],
    reviewedSubjects: [
      'Physics (Mechanics, Heat, Electrostatics)',
      'Chemistry (Stoichiometry, Atomic Structure, Inorganic)',
      'Mathematics (Calculus Limits, Trigonometry)',
      'Biology (Cell Biology, Taxonomy)',
    ],
    freeResourcesToProvide: [
      {
        title: 'Class 10-to-11 Bridge Lessons',
        description: 'Transition lessons that connect Class 10 basic science with rigorous Grade 11 conceptual depth.',
        items: ['Scalars & Vectors transition', 'Moles to Stoichiometry bridge', 'Trigonometric functions expansion'],
      },
      {
        title: 'Prerequisite Quizzes',
        description: 'Diagnostic quizzes to check prerequisite mathematical and scientific foundations before starting each unit.',
        items: ['Basic algebra & calculus readiness quiz', 'Atomic theory & nomenclature quiz'],
      },
      {
        title: 'Selected Chapter Notes',
        description: 'Deep-dive notes with formal definitions, derivation steps, and worked examples.',
        items: ['Vectors & Projectile Motion notes', 'Chemical Equilibrium notes'],
      },
      {
        title: 'Formula & Definition Sheets',
        description: 'Handy pocket sheets containing SI units, dimensional formulas, and theorem statements.',
        items: ['Class 11 Mechanics formula compendium', 'Inorganic reactions summary'],
      },
      {
        title: 'One Complete Sample Lesson Per Offered Subject',
        description: 'Full un-truncated high-definition video lesson and practice questions for every supported subject.',
        items: ['Physics: Vectors & Resolution', 'Chemistry: Mole Concept & Limiting Reagents', 'Math: Limits & Continuity'],
      },
      {
        title: 'Study Planner',
        description: 'Academic calendar and weekly timetable template balancing board exams and entrance aspirations.',
        items: ['Grade 11 Term 1 Study Planner', 'Self-study balance tracker'],
      },
    ],
    mainOfferToPromote: {
      hook: 'Check whether your foundations are ready for Class 11.',
      subtext: 'Assess your prerequisite math and science readiness before starting rigorous Class 11 chapters.',
      ctaText: 'Test Class 11 Readiness',
      ctaHref: '/courses/neb-class-11-science-mastery',
      editorialGuideline: 'Let students choose their stream and subjects.',
      streamChoiceNote: 'Interactive stream switcher supports Science (Bio/Math) and early entrance preparation paths.',
    },
    optionalPaidProgression: {
      title: 'NEB Class 11 Science Mastery & Foundation',
      courseSlug: 'neb-class-11-science-mastery',
      courseHref: '/courses/neb-class-11-science-mastery',
      badge: 'Comprehensive Stream Course',
      priceNpr: 5490,
      summary: 'Full subject courses, regular assignments, and live doubt sessions.',
      features: [
        'Complete subject courses across Physics, Chemistry, Math & Biology',
        'Regular graded homework assignments with step-marking feedback',
        'Live interactive doubt sessions with subject professors',
        'Chapter derivation masterclasses for board exams',
        'Early CEE/IOE foundation bridging quizzes and MCQs',
      ],
    },
    streamGuardrails: {
      rule: 'Content must reflect the updated NEB Class 11 curriculum. Bridge content must clarify gaps from Class 10.',
      isGenericBankProhibited: true,
      examScope: 'NEB Grade 11 Science & Technical Streams',
      prohibitedPatterns: ['Mixing Class 12 Advanced Optics with Class 11', 'Medical entrance questions without Class 11 tags'],
    },
    concreteResources: [
      {
        id: 'cls11-bridge-vectors',
        title: 'Grade 10-to-11 Physics Bridge: Vectors & Coordinate Geometry',
        category: 'bridge_lesson',
        description: 'Understand vector resolution, dot and cross products, and why vector algebra is essential for Grade 11 Mechanics.',
        reviewedSubject: 'Class 11 Physics',
        responsibleTeacher: {
          name: 'Er. Bishal Adhikari',
          role: 'Faculty Lead — Physics',
          qualification: 'B.E. Pulchowk Campus',
          verified: true,
        },
        format: 'interactive_test',
        actionText: 'Start Bridge Lesson',
        actionHref: '/courses/neb-class-11-science-mastery',
        contentReviewed: true,
      },
      {
        id: 'cls11-mole-notes',
        title: 'Stoichiometry & Mole Concept Comprehensive Formula Sheet',
        category: 'formula_sheet',
        description: 'Molarity, Molality, Normality, Limiting Reagent rules, and volumetric analysis formulas.',
        reviewedSubject: 'Class 11 Chemistry',
        responsibleTeacher: {
          name: 'Dr. Samyak Shrestha',
          role: 'Academic Director',
          qualification: 'MBBS, IOM',
          verified: true,
        },
        format: 'pdf_document',
        actionText: 'Download Formula Sheet',
        actionHref: '/courses/neb-class-11-science-mastery',
        isDownloadable: true,
        contentReviewed: true,
      },
      {
        id: 'cls11-foundations-quiz',
        title: 'Class 11 Prerequisite Math & Algebra Diagnostic Quiz',
        category: 'quiz',
        description: '20 rapid questions checking quadratics, trigonometric identities, and functional notation.',
        reviewedSubject: 'Class 11 Mathematics',
        responsibleTeacher: {
          name: 'Er. Ramesh Karki',
          role: 'Lead Math Mentor',
          qualification: 'B.E. Pulchowk Campus',
          verified: true,
        },
        format: 'interactive_test',
        actionText: 'Attempt Prerequisite Quiz',
        actionHref: '/courses/neb-class-11-science-mastery',
        contentReviewed: true,
      },
    ],
  },

  // ── 3. Class 12 ─────────────────────────────────────────────────────────────
  class_12: {
    id: 'class_12',
    groupName: 'Class 12',
    shortName: 'NEB Class 12',
    targetExam: 'Class 12 NEB Board Examination & Pre-Entrance Bridge',
    badge: 'Grade 12 · Board Topper',
    badgeBg: 'bg-cyan-500/10 dark:bg-cyan-500/20',
    badgeText: 'text-cyan-700 dark:text-cyan-400',
    accentBorder: 'border-cyan-500',
    responsibleFaculty: [
      {
        name: 'Er. Bishal Adhikari',
        role: 'Lead Instructor — Physics & Modern Physics',
        qualification: 'B.E. Pulchowk Campus',
        verified: true,
      },
      {
        name: 'Er. Ramesh Karki',
        role: 'Faculty Lead — Mathematics & Calculus',
        qualification: 'B.E. Pulchowk Campus',
        verified: true,
      },
    ],
    reviewedSubjects: [
      'Physics (Electromagnetism, AC, Modern Physics, Semiconductors)',
      'Chemistry (Physical, Organic Reaction Mechanisms, Coordination Compounds)',
      'Mathematics (Integral Calculus, Differential Equations, Vectors, Probability)',
      'Biology (Genetics, Human Physiology, Biotechnology)',
    ],
    freeResourcesToProvide: [
      {
        title: 'Revision Sheets & Derivation Structures',
        description: 'Step-by-step structures for long-answer derivations for all supported subjects.',
        items: ['Biot-Savart & Ampere law derivations', 'Carnot engine efficiency', 'Definite integral properties'],
      },
      {
        title: 'Official Past Papers with Samyak-Authored Solutions',
        description: 'Links to official NEB board past questions accompanied by verified, full-mark model answers.',
        items: ['2080 NEB Board Solved Physics Paper', '2081 Model Solution for Chemistry with reaction mechanisms'],
      },
      {
        title: 'Timed Chapter Tests',
        description: '45-minute timed chapter evaluations to build exam pacing and eliminate silly calculation mistakes.',
        items: ['Current Electricity & Kirchhoff Laws test', 'Integration by parts sprint test'],
      },
      {
        title: 'Weekly Mock & Mistake Report',
        description: 'Comprehensive weekly board model exam with automated diagnostic mistake report.',
        items: ['Full 75-mark Saturday model exam', 'Topic-wise accuracy report with remedial video links'],
      },
    ],
    mainOfferToPromote: {
      hook: 'Take a free Class 12 mock and get a focused revision plan.',
      subtext: 'Evaluate your readiness under board exam time constraints and receive a personalized revision agenda.',
      ctaText: 'Take Free Class 12 Mock',
      ctaHref: '/courses/neb-class-12-board-topper-batch',
      editorialGuideline: 'Derivations must feature step-by-step grading rubrics that reflect NEB marking norms.',
    },
    optionalPaidProgression: {
      title: 'NEB Class 12 Board Topper & Entrance Bridge Batch',
      courseSlug: 'neb-class-12-board-topper-batch',
      courseHref: '/courses/neb-class-12-board-topper-batch',
      badge: 'Full Board & Entrance Program',
      priceNpr: 5990,
      summary: 'Full revision course, extended mock series, teacher evaluation, and mentoring.',
      features: [
        'Full syllabus revision course with live interactive masterclasses',
        'Extended 15-set board model exam series with timed conditions',
        'Personalized teacher evaluation on handwritten subjective papers',
        '1-on-1 mentoring and target 3.8+ GPA milestone planning',
        'Simultaneous CEE/IOE high-yield entrance question integration',
      ],
    },
    streamGuardrails: {
      rule: 'All past questions must strictly cite verified NEB board papers. Derivations must not skip intermediate steps.',
      isGenericBankProhibited: true,
      examScope: 'NEB Grade 12 Board Examinations',
      prohibitedPatterns: ['Generic Indian CBSE solutions with different syllabus topics', 'Skipping circuit diagrams in physics'],
    },
    concreteResources: [
      {
        id: 'cls12-em-derivations',
        title: 'Electromagnetism Derivation Blueprint: Ampere Law & Hall Effect',
        category: 'revision_sheet',
        description: 'Detailed diagrams, vector assumptions, and step-by-step scoring breakdown for 4-mark questions.',
        reviewedSubject: 'Class 12 Physics',
        responsibleTeacher: {
          name: 'Er. Bishal Adhikari',
          role: 'Lead Instructor — Physics',
          qualification: 'B.E. Pulchowk Campus',
          verified: true,
        },
        format: 'pdf_document',
        actionText: 'View Derivation Guide',
        actionHref: '/courses/neb-class-12-board-topper-batch',
        isDownloadable: true,
        contentReviewed: true,
      },
      {
        id: 'cls12-calculus-timed',
        title: 'Calculus: Integration by Parts & Definite Integrals Sprint',
        category: 'quiz',
        description: '15 high-frequency NEB board calculus problems with worked solutions and time targets.',
        reviewedSubject: 'Class 12 Mathematics',
        responsibleTeacher: {
          name: 'Er. Ramesh Karki',
          role: 'Faculty Lead — Mathematics',
          qualification: 'B.E. Pulchowk Campus',
          verified: true,
        },
        format: 'interactive_test',
        actionText: 'Start Timed Test',
        actionHref: '/courses/neb-class-12-board-topper-batch',
        contentReviewed: true,
      },
      {
        id: 'cls12-weekly-mock',
        title: 'Class 12 Model Examination Set (Paper 2081 Equivalent)',
        category: 'model_paper',
        description: '75-mark full syllabus simulation covering Groups A, B, and C with official marking scheme.',
        reviewedSubject: 'Class 12 Physics & Chemistry',
        responsibleTeacher: {
          name: 'Er. Bishal Adhikari',
          role: 'Lead Instructor — Physics',
          qualification: 'B.E. Pulchowk Campus',
          verified: true,
        },
        format: 'interactive_test',
        actionText: 'Attempt Mock Exam',
        actionHref: '/courses/neb-class-12-board-topper-batch',
        contentReviewed: true,
      },
    ],
  },

  // ── 4. Medical entrance / CEE ────────────────────────────────────────────────
  medical_cee: {
    id: 'medical_cee',
    groupName: 'Medical entrance / CEE',
    shortName: 'CEE Medical',
    targetExam: 'Nepal Medical Education Commission Entrance Exam (MECEE UG)',
    badge: 'MBBS · BDS · B.Sc Nursing',
    badgeBg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
    badgeText: 'text-indigo-700 dark:text-indigo-400',
    accentBorder: 'border-indigo-500',
    responsibleFaculty: [
      {
        name: 'Dr. Samyak Shrestha',
        role: 'Founder & Academic Director',
        qualification: 'MBBS, Maharajgunj Medical Campus (IOM, Top Ranker)',
        verified: true,
      },
      {
        name: 'Er. Bishal Adhikari',
        role: 'Faculty Lead — Medical Physics',
        qualification: 'B.E. Pulchowk Campus (Physics Entrance Specialist)',
        verified: true,
      },
    ],
    reviewedSubjects: [
      'Zoology (80 Marks combined with Botany)',
      'Botany',
      'Medical Chemistry (50 Marks)',
      'Medical Physics (50 Marks)',
      'Mental Agility Test / MAT (20 Marks)',
    ],
    freeResourcesToProvide: [
      {
        title: 'Ten Reviewed MCQs Daily with Explanations',
        description: 'Daily handpicked high-yield questions accompanied by comprehensive distractor rationales.',
        items: ['Daily 10-MCQ morning workout', 'Topic-wise rotation (Bio, Chem, Phys, MAT)'],
      },
      {
        title: 'Weekly Mock',
        description: 'Full-length 200-question timed mock test with negative marking (-0.25) adhering to MEC standards.',
        items: ['Saturday 200-question grand mock simulation', 'National percentile ranking & cutoff indicator'],
      },
      {
        title: 'Biology Flashcards',
        description: 'Spaced repetition digital flashcards focusing on taxonomy, human physiology, and enzyme kinetics.',
        items: ['SM-2 digital flashcards deck', 'High-frequency zoological and botanical exceptions'],
      },
      {
        title: 'Physics and Chemistry Drills',
        description: 'Speed drills targeting rapid numerical problem solving without calculator dependence.',
        items: ['Dimensional analysis & optics speed drill', 'Stoichiometry & equilibrium calculation workouts'],
      },
      {
        title: 'Mistake Notebook',
        description: 'Automated personal error log that saves missed questions for spaced re-testing.',
        items: ['Categorization by conceptual error vs calculation slip', 'One-click targeted re-practice'],
      },
      {
        title: 'Topic-Level Performance Report',
        description: 'Detailed analytics report identifying top 3 highest-yielding weak topics across syllabus.',
        items: ['Subchapter accuracy percentage radar', 'Target score gap estimation for MBBS merit rank'],
      },
    ],
    mainOfferToPromote: {
      hook: 'Find your weak CEE topics with a free diagnostic.',
      subtext: 'Pinpoint exact conceptual blindspots with instant negative-marking analytics.',
      ctaText: 'Start Free CEE Diagnostic',
      ctaHref: '/cee-medical-entrance',
      editorialGuideline: 'Explain why distractors are wrong, not just which option is correct.',
    },
    optionalPaidProgression: {
      title: 'CEE Medical Entrance Super Target Batch 2026',
      courseSlug: 'cee-mbbs-mastery-2026',
      courseHref: '/courses/cee-mbbs-mastery-2026',
      badge: 'Flagship Full Preparation Program',
      priceNpr: 7990,
      summary:
        'Larger practice bank, full-length test series, structured teaching, additional adaptive practice and mentoring.',
      features: [
        'Massive 15,000+ reviewed MCQ question bank with in-depth distractor breakdowns',
        '25 full-length 200-question MEC timed mock examinations with video solutions',
        'Structured daily live teaching with faculty from IOM and leading institutes',
        'Adaptive practice engine that drills your individual weakest subtopics',
        '1-on-1 MBBS doctor mentorship and personalized rank targeting',
      ],
    },
    streamGuardrails: {
      rule: 'All questions must follow the 200-mark MEC syllabus. Distractors must reflect plausible medical misconceptions.',
      isGenericBankProhibited: true,
      examScope: 'Medical Education Commission Entrance Examination (MECEE UG)',
      prohibitedPatterns: ['Indian NEET questions on non-CEE topics (e.g. cockroach anatomy deleted from CEE)', 'Generic non-medical questions'],
    },
    concreteResources: [
      {
        id: 'cee-daily-10',
        title: 'CEE Daily 10 Reviewed MCQs: Cell Biology & Biomolecules',
        category: 'quiz',
        description: '10 reviewed questions with comprehensive explanation of why every distractor is incorrect.',
        reviewedSubject: 'Medical Biology',
        responsibleTeacher: {
          name: 'Dr. Samyak Shrestha',
          role: 'Academic Director',
          qualification: 'MBBS, IOM',
          verified: true,
        },
        format: 'interactive_test',
        actionText: 'Attempt Daily 10',
        actionHref: '/cee-medical-entrance',
        editorialNote: 'Explains why distractors are wrong, not just which option is correct.',
        contentReviewed: true,
      },
      {
        id: 'cee-bio-flashcards',
        title: 'MEC High-Yield Biology Flashcards Deck (Zoology Exceptions)',
        category: 'flashcard',
        description: 'Animal kingdom classifications, germ layers, excretory organs, and circulatory systems.',
        reviewedSubject: 'Zoology',
        responsibleTeacher: {
          name: 'Dr. Samyak Shrestha',
          role: 'Academic Director',
          qualification: 'MBBS, IOM',
          verified: true,
        },
        format: 'flashcard_deck',
        actionText: 'Review Flashcards',
        actionHref: '/cee-medical-entrance',
        contentReviewed: true,
      },
      {
        id: 'cee-50-diag',
        title: 'CEE 50-Question Multi-Subject Baseline Diagnostic',
        category: 'diagnostic',
        description: 'Timed diagnostic evaluating Physics, Chemistry, Zoology, Botany, and MAT with -0.25 penalty.',
        reviewedSubject: 'All CEE Subjects',
        responsibleTeacher: {
          name: 'Dr. Samyak Shrestha',
          role: 'Academic Director',
          qualification: 'MBBS, IOM',
          verified: true,
        },
        format: 'interactive_test',
        actionText: 'Start CEE Diagnostic',
        actionHref: '/cee-medical-entrance',
        contentReviewed: true,
      },
    ],
  },

  // ── 5. Engineering entrance ──────────────────────────────────────────────────
  engineering_entrance: {
    id: 'engineering_entrance',
    groupName: 'Engineering entrance',
    shortName: 'IOE Engineering',
    targetExam: 'TU IOE Pulchowk Entrance / KU / PoU BE Computer & Civil Entrance',
    badge: 'IOE Pulchowk · 140 Marks CBT',
    badgeBg: 'bg-blue-500/10 dark:bg-blue-500/20',
    badgeText: 'text-blue-700 dark:text-blue-400',
    accentBorder: 'border-blue-500',
    responsibleFaculty: [
      {
        name: 'Er. Bishal Adhikari',
        role: 'Faculty Lead — Engineering Physics & CBT Strategy',
        qualification: 'B.E. Electronics, Pulchowk Campus (IOE Ranker)',
        verified: true,
      },
      {
        name: 'Er. Ramesh Karki',
        role: 'Lead Mentor — Engineering Mathematics',
        qualification: 'B.E. Pulchowk Campus (Math 50M Specialist)',
        verified: true,
      },
    ],
    reviewedSubjects: [
      'Engineering Mathematics (50 Marks)',
      'Engineering Physics (45 Marks)',
      'Engineering Chemistry (25 Marks)',
      'English & Engineering Aptitude (20 Marks)',
    ],
    freeResourcesToProvide: [
      {
        title: 'Ten Timed Questions Daily',
        description: 'Daily timed problem set to build mental math speed and calculator-free problem solving.',
        items: ['Daily 10 questions timed to 12 minutes', 'Speed scoring metrics and instant step solutions'],
      },
      {
        title: 'Formula Sheets',
        description: 'High-density formula cheat sheets for high-weightage topics like Calculus, Mechanics, and Conics.',
        items: ['Calculus limits & derivatives shortcut sheet', 'Rotational dynamics & SHM formula card'],
      },
      {
        title: 'Worked Numerical Problems',
        description: 'Step-by-step solutions to typical 2-mark IOE problems with Pulchowk shortcut tricks.',
        items: ['Definite integrals with symmetry shortcuts', 'Projectile motion & inclined plane worked set'],
      },
      {
        title: 'Topic Diagnostic',
        description: 'Evaluation measuring which sections cause accuracy loss versus time run-outs.',
        items: ['Math 25-question diagnostic', 'Physics Mechanics diagnostic'],
      },
      {
        title: 'Weekly Speed-and-Accuracy Test',
        description: 'Specialized 50-minute exam measuring questions answered per minute and penalty losses.',
        items: ['Sunday speed & accuracy test', 'Negative marking impact simulation (-10% penalty)'],
      },
    ],
    mainOfferToPromote: {
      hook: 'Find out which topic costs you time in entrance practice.',
      subtext: 'Pinpoint slow chapters and accuracy leaks with automated question-by-question time tracking.',
      ctaText: 'Test Your Speed & Accuracy',
      ctaHref: '/courses/ioe-engineering-entrance-2026',
      editorialGuideline: 'Match each resource to the selected entrance exam, such as IOE.',
    },
    optionalPaidProgression: {
      title: 'IOE Engineering Entrance Preparation Batch 2026',
      courseSlug: 'ioe-engineering-entrance-2026',
      courseHref: '/courses/ioe-engineering-entrance-2026',
      badge: 'Pulchowk Ranker Batch',
      priceNpr: 6990,
      summary:
        'Complete entrance preparation, extensive timed mocks, and advanced problem-solving sessions.',
      features: [
        'Complete 140-mark IOE syllabus coverage across Math, Physics, Chemistry & English',
        'Extensive 20+ full CBT timed mocks replicating the IOE examination interface',
        'Advanced problem-solving sessions covering tricky 2-mark calculus and mechanics problems',
        'Pulchowk ranker shortcut techniques and mental arithmetic training',
        'Direct doubt support from engineering alumni and top scorers',
      ],
    },
    streamGuardrails: {
      rule: 'Match each resource strictly to the IOE 140-mark Computer-Based Test (CBT) structure. Do not mix with generic general knowledge.',
      isGenericBankProhibited: true,
      examScope: 'Institute of Engineering (IOE) Entrance Examination',
      prohibitedPatterns: ['Medical Biology questions in IOE practice', 'Non-CBT format testing'],
    },
    concreteResources: [
      {
        id: 'ioe-timed-10',
        title: 'IOE Daily 10 Timed Questions: Calculus Limits & Definite Integrals',
        category: 'quiz',
        description: '10 questions designed to test speed under 12 minutes with step shortcuts.',
        reviewedSubject: 'Engineering Mathematics',
        responsibleTeacher: {
          name: 'Er. Ramesh Karki',
          role: 'Lead Mentor — Engineering Mathematics',
          qualification: 'B.E. Pulchowk Campus',
          verified: true,
        },
        format: 'interactive_test',
        actionText: 'Start Timed Test',
        actionHref: '/courses/ioe-engineering-entrance-2026',
        editorialNote: 'Matched to IOE entrance format.',
        contentReviewed: true,
      },
      {
        id: 'ioe-mechanics-shortcuts',
        title: 'Engineering Physics: Mechanics & Rotational Motion Formula Sheet',
        category: 'formula_sheet',
        description: 'Moment of inertia formulas, torque relations, work-energy theorem shortcuts, and collision types.',
        reviewedSubject: 'Engineering Physics',
        responsibleTeacher: {
          name: 'Er. Bishal Adhikari',
          role: 'Faculty Lead — Engineering Physics',
          qualification: 'B.E. Pulchowk Campus',
          verified: true,
        },
        format: 'pdf_document',
        actionText: 'Download Formula Sheet',
        actionHref: '/courses/ioe-engineering-entrance-2026',
        isDownloadable: true,
        contentReviewed: true,
      },
      {
        id: 'ioe-speed-diagnostic',
        title: 'IOE 30-Question Time-Loss Diagnostic Test',
        category: 'diagnostic',
        description: 'Identifies which chapters consume more than 90 seconds per question with -0.10 negative marking.',
        reviewedSubject: 'Math & Physics',
        responsibleTeacher: {
          name: 'Er. Ramesh Karki',
          role: 'Lead Mentor — Engineering Mathematics',
          qualification: 'B.E. Pulchowk Campus',
          verified: true,
        },
        format: 'interactive_test',
        actionText: 'Take Diagnostic',
        actionHref: '/courses/ioe-engineering-entrance-2026',
        contentReviewed: true,
      },
    ],
  },

  // ── 6. Lok Sewa ─────────────────────────────────────────────────────────────
  lok_sewa: {
    id: 'lok_sewa',
    groupName: 'Lok Sewa',
    shortName: 'Lok Sewa Aayog',
    targetExam: 'Public Service Commission (PSC Nepal) — Kharidar, Nayab Subba & Section Officer',
    badge: 'Kharidar · Nasu · Adhikrit',
    badgeBg: 'bg-orange-500/10 dark:bg-orange-500/20',
    badgeText: 'text-orange-700 dark:text-orange-400',
    accentBorder: 'border-orange-500',
    responsibleFaculty: [
      {
        name: 'Narayan Bhattarai Sir',
        role: 'Faculty Lead — General Knowledge & Constitution',
        qualification: 'Former Under Secretary, Nepal Civil Service (20+ Yrs PSC Mentor)',
        verified: true,
      },
      {
        name: 'Bishnu Sharma Sir',
        role: 'Lead Specialist — General Mental Ability (IQ)',
        qualification: 'M.Sc., PSC IQ Author & Shortcut Specialist',
        verified: true,
      },
    ],
    reviewedSubjects: [
      'General Knowledge / GK (Geography, History, Constitution, Current Affairs)',
      'General Mental Ability / IQ (Verbal, Numerical, Non-Verbal)',
      'Governance & Public Management (Paper II)',
      'Official Drafting, Tippani & Report Writing',
    ],
    freeResourcesToProvide: [
      {
        title: 'Dated Current-Affairs Digest with Source Links',
        description: 'Weekly verified current events digest linking directly to official government portals and gazettes.',
        items: ['Gorkhapatra Wednesday digest summary', 'Key appointments, acts, treaties & national awards with sources'],
      },
      {
        title: 'GK and Reasoning Quizzes',
        description: 'Topic-wise multiple choice quizzes for rapid retention and factual recall.',
        items: ['Nepal Geography 25-MCQ drill', 'IQ series & matrix reasoning quiz'],
      },
      {
        title: 'Sample Nepali/English Practice',
        description: 'Bilingual practice sets covering official terminology, grammar, and translation exercises.',
        items: ['Nepali Vyakaran model questions', 'Administrative translation practice set'],
      },
      {
        title: 'Syllabus Checklist',
        description: 'Comprehensive itemized checklist for each specific post (Kharidar, Nasu, Officer) and tier.',
        items: ['Section Officer First Paper syllabus checklist', 'Nayab Subba Paper I & II topic tracker'],
      },
      {
        title: 'Verified Vacancy/Exam Links',
        description: 'Direct verified links to official PSC notice bulletins, exam calendars, and admit card portals.',
        items: ['PSC annual calendar tracker', 'Notice verification feed'],
      },
    ],
    mainOfferToPromote: {
      hook: 'Try a free Lok Sewa quiz and get a study checklist for your chosen post.',
      subtext: 'Test your GK & IQ accuracy with 20% negative marking and receive a customized post syllabus checklist.',
      ctaText: 'Take Free Lok Sewa Quiz',
      ctaHref: '/courses/lok-sewa-aayog-preparation-2082',
      editorialGuideline: 'Separate federal/provincial exams and levels.',
    },
    optionalPaidProgression: {
      title: 'Lok Sewa Aayog Comprehensive Preparation Batch 2082',
      courseSlug: 'lok-sewa-aayog-preparation-2082',
      courseHref: '/courses/lok-sewa-aayog-preparation-2082',
      badge: 'All-in-One PSC Master Batch',
      priceNpr: 5990,
      summary:
        'Post-specific courses, complete mock series, writing evaluation, and interview preparation.',
      features: [
        'Post-specific courses strictly organized for Kharidar, Nasu, and Section Officer tiers',
        'Complete 20-set mock series with -20% negative marking and live discussion sessions',
        'Subjective Paper II/III handwritten answer writing evaluation by retired civil servants',
        'Current affairs monthly dossiers and economic survey analysis workshops',
        'Personalized interview preparation and mock interview panels',
      ],
    },
    streamGuardrails: {
      rule: 'Separate federal/provincial exams and levels. Never treat Kharidar, Nasu, and Officer as an identical syllabus.',
      isGenericBankProhibited: true,
      examScope: 'Nepal Public Service Commission (Lok Sewa Aayog)',
      prohibitedPatterns: ['Mixing provincial Bagmati/Gandaki regulations without labels', 'Generic high school science in PSC bank'],
    },
    concreteResources: [
      {
        id: 'loksewa-ca-digest',
        title: 'Lok Sewa Weekly Current Affairs Digest (October 2026 Edition)',
        category: 'current_affairs',
        description: 'Verified national & international events, economic indicators, and new appointments with official source citations.',
        reviewedSubject: 'General Knowledge (GK)',
        responsibleTeacher: {
          name: 'Narayan Bhattarai Sir',
          role: 'Faculty Lead — General Knowledge',
          qualification: 'Former Under Secretary',
          verified: true,
        },
        format: 'pdf_document',
        actionText: 'Read Digest',
        actionHref: '/courses/lok-sewa-aayog-preparation-2082',
        isDownloadable: true,
        contentReviewed: true,
      },
      {
        id: 'loksewa-gk-iq-quiz',
        title: 'PSC First Paper 25-Question GK & IQ Diagnostic Drill',
        category: 'quiz',
        description: 'Bilingual questions with official -20% negative marking and post-specific percentile calculation.',
        reviewedSubject: 'GK & General Mental Ability',
        responsibleTeacher: {
          name: 'Bishnu Sharma Sir',
          role: 'Lead Specialist — General Mental Ability',
          qualification: 'M.Sc., PSC IQ Author',
          verified: true,
        },
        format: 'interactive_test',
        actionText: 'Attempt Quiz',
        actionHref: '/courses/lok-sewa-aayog-preparation-2082',
        editorialNote: 'Separate federal and provincial options.',
        contentReviewed: true,
      },
      {
        id: 'loksewa-officer-checklist',
        title: 'Section Officer (Sakha Adhikrit) Complete Syllabus Checklist',
        category: 'study_plan',
        description: 'Detailed topic-by-topic tracking sheet covering First Paper (GK & IQ), Second Paper (Governance), and Third Paper.',
        reviewedSubject: 'PSC Syllabus',
        responsibleTeacher: {
          name: 'Narayan Bhattarai Sir',
          role: 'Faculty Lead — General Knowledge',
          qualification: 'Former Under Secretary',
          verified: true,
        },
        format: 'checklist',
        actionText: 'Download Checklist',
        actionHref: '/courses/lok-sewa-aayog-preparation-2082',
        isDownloadable: true,
        contentReviewed: true,
      },
    ],
  },
};

export const STUDENT_GROUPS_LIST: StudentGroupOffer[] = [
  STUDENT_GROUP_OFFERS.class_10_see,
  STUDENT_GROUP_OFFERS.class_11,
  STUDENT_GROUP_OFFERS.class_12,
  STUDENT_GROUP_OFFERS.medical_cee,
  STUDENT_GROUP_OFFERS.engineering_entrance,
  STUDENT_GROUP_OFFERS.lok_sewa,
];

export function getStudentGroupOffer(groupId: string): StudentGroupOffer | undefined {
  const normalized = groupId.toLowerCase().trim().replace(/-/g, '_');
  if (normalized === 'see' || normalized === 'class_10' || normalized === 'see_class_10' || normalized === 'class_10_see') {
    return STUDENT_GROUP_OFFERS.class_10_see;
  }
  if (normalized === 'class11' || normalized === 'class_11' || normalized === 'neb_class_11') {
    return STUDENT_GROUP_OFFERS.class_11;
  }
  if (normalized === 'class12' || normalized === 'class_12' || normalized === 'neb_class_12') {
    return STUDENT_GROUP_OFFERS.class_12;
  }
  if (normalized === 'cee' || normalized === 'medical' || normalized === 'cee_medical' || normalized === 'medical_cee') {
    return STUDENT_GROUP_OFFERS.medical_cee;
  }
  if (normalized === 'ioe' || normalized === 'engineering' || normalized === 'engineering_entrance') {
    return STUDENT_GROUP_OFFERS.engineering_entrance;
  }
  if (normalized === 'loksewa' || normalized === 'lok_sewa') {
    return STUDENT_GROUP_OFFERS.lok_sewa;
  }
  return undefined;
}

/**
 * Validates that no generic question bank is cross-tagged between distinct exam streams.
 */
export function validateStreamPurity(): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  const seenTitles = new Map<string, StudentGroupId>();

  for (const group of STUDENT_GROUPS_LIST) {
    if (!group.responsibleFaculty || group.responsibleFaculty.length === 0) {
      issues.push(`Group ${group.groupName} is missing responsible faculty.`);
    }

    for (const faculty of group.responsibleFaculty) {
      if (!faculty.verified) {
        issues.push(`Faculty ${faculty.name} for ${group.groupName} is not marked as verified.`);
      }
    }

    for (const res of group.concreteResources) {
      if (!res.contentReviewed) {
        issues.push(`Resource ${res.title} in ${group.groupName} is not marked as reviewed.`);
      }

      if (seenTitles.has(res.title) && seenTitles.get(res.title) !== group.id) {
        issues.push(
          `Resource "${res.title}" appears in both ${seenTitles.get(res.title)} and ${group.id}. Shared generic resources across streams are prohibited.`
        );
      }
      seenTitles.set(res.title, group.id);
    }
  }

  return { valid: issues.length === 0, issues };
}
