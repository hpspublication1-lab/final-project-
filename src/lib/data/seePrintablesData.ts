export interface SeeManualItem {
  id: string;
  title: string;
  titleNepali: string;
  subject: 'science' | 'math' | 'opt_math' | 'english' | 'nepali' | 'social';
  subjectName: string;
  type: 'Curriculum Manual' | 'Formula Booklet' | 'Practical Manual' | 'Model Exam Set';
  publisher: 'Curriculum Development Centre (CDC)' | 'National Examination Board (NEB)' | 'Samyak Academic Council';
  pages: number;
  fileSize: string;
  pdfUrl: string;
  downloadCount: string;
  description: string;
  topics: string[];
}

export interface PrintableExamPaper {
  id: string;
  title: string;
  subject: 'science' | 'math' | 'opt_math' | 'english' | 'nepali' | 'social';
  subjectName: string;
  paperCode: string;
  totalMarks: number;
  timeAllowed: string;
  instructions: string[];
  groups: {
    groupName: string;
    description: string;
    questionsCount: number;
    marksPerQuestion: number;
    totalGroupMarks: number;
    questions: {
      qNo: number;
      question: string;
      questionNepali?: string;
      marks: number;
      answerLines: number; // Blank lines for student to write when printed
    }[];
  }[];
}

export const SEE_SUBJECT_MANUALS: SeeManualItem[] = [
  {
    id: 'manual-cdc-sci',
    title: 'CDC Grade 10 Science & Technology Official Curriculum & Teacher Manual',
    titleNepali: 'पाठ्यक्रम विकास केन्द्र (CDC) कक्षा १० विज्ञान तथा प्रविधि शिक्षक निर्देशिका तथा विशिष्टीकरण तालिका',
    subject: 'science',
    subjectName: 'Compulsory Science & Tech',
    type: 'Curriculum Manual',
    publisher: 'Curriculum Development Centre (CDC)',
    pages: 142,
    fileSize: '6.8 MB',
    pdfUrl: '/documents/manuals/cdc_science_grade_10_manual.pdf',
    downloadCount: '42.1k',
    description: 'Official specification grid, unit weightage, internal evaluation breakdown (25 marks practical), and experimental objectives for SEE 2082.',
    topics: ['Force & Motion Competencies', 'Chemical Equation Rubrics', 'Biology Practical Procedures', 'Internal 25 Marks Guideline'],
  },
  {
    id: 'manual-cdc-math',
    title: 'CDC Compulsory Mathematics Curriculum Specification Grid & Teacher Manual',
    titleNepali: 'अनिवार्य गणित विशिष्टीकरण तालिका तथा शिक्षक निर्देशिका २०८२',
    subject: 'math',
    subjectName: 'Compulsory Mathematics',
    type: 'Curriculum Manual',
    publisher: 'Curriculum Development Centre (CDC)',
    pages: 128,
    fileSize: '5.9 MB',
    pdfUrl: '/documents/manuals/cdc_comp_math_grade_10_manual.pdf',
    downloadCount: '38.4k',
    description: 'Detailed CDC Bloom taxonomy cognitive levels (Knowledge 20%, Understanding 30%, Application 30%, Higher Ability 20%) for SEE Math.',
    topics: ['Bloom Taxonomy Grid', 'Geometry Construction Standards', 'Arithmetic Word Problem Rubrics', 'Ogive Plotting Criteria'],
  },
  {
    id: 'manual-cdc-opt-math',
    title: 'Optional Mathematics Curriculum Manual & Derivation Digest',
    titleNepali: 'ऐच्छिक गणित विशिष्टीकरण तालिका तथा साध्य डाइजेस्ट',
    subject: 'opt_math',
    subjectName: 'Optional Mathematics',
    type: 'Curriculum Manual',
    publisher: 'Curriculum Development Centre (CDC)',
    pages: 116,
    fileSize: '5.2 MB',
    pdfUrl: '/documents/manuals/cdc_opt_math_grade_10_manual.pdf',
    downloadCount: '29.7k',
    description: 'Complete specification grid for Trigonometry, Matrices, Coordinate Geometry, Transformation, and Vectors.',
    topics: ['Cramer Rule Matrix Methods', 'Trigonometric Transformation Identities', 'Combined Vector Theorems'],
  },
  {
    id: 'manual-cdc-social',
    title: 'Social Studies & Life Skills CDC Curriculum Guide & Map Workbook',
    titleNepali: 'सामाजिक अध्ययन तथा जीवनोपयोगी शिक्षा पाठ्यक्रम तथा नक्सा कार्यपुस्तिका',
    subject: 'social',
    subjectName: 'Social Studies & Life Skills',
    type: 'Curriculum Manual',
    publisher: 'Curriculum Development Centre (CDC)',
    pages: 160,
    fileSize: '7.4 MB',
    pdfUrl: '/documents/manuals/cdc_social_grade_10_manual.pdf',
    downloadCount: '33.2k',
    description: 'Official Nepal and World map drawing rubrics, historical timeline guidelines, and constitutional civics answers.',
    topics: ['Nepal Map Drawing Grid', 'World Geography Criteria', 'Constitutional Law Summary', 'Peace & International Orgs'],
  },
  {
    id: 'manual-cdc-nepali',
    title: 'Nepali Language & Literature Teacher Specification Grid & Grammar Rules',
    titleNepali: 'नेपाली भाषा विशिष्टीकरण तालिका, वर्णविन्यास तथा व्याकरण निर्देशिका',
    subject: 'nepali',
    subjectName: 'Nepali (नेपाली)',
    type: 'Curriculum Manual',
    publisher: 'Curriculum Development Centre (CDC)',
    pages: 136,
    fileSize: '6.1 MB',
    pdfUrl: '/documents/manuals/cdc_nepali_grade_10_manual.pdf',
    downloadCount: '27.9k',
    description: 'Official standard orthography (वर्णविन्यास नियम २०८०), Padbarga identification rules, and essay marking parameters.',
    topics: ['मानक नेपाली वर्णविन्यास', 'पदवर्ग पहिचान', 'व्याकरण रूपान्तरण', 'समीक्षात्मक उत्तर लेखन'],
  },
  {
    id: 'manual-cdc-eng',
    title: 'English Language Specification Grid, Writing Rubrics & Listening Manual',
    titleNepali: 'अंग्रेजी भाषा विशिष्टीकरण तालिका तथा लेखन मार्गदर्शिका',
    subject: 'english',
    subjectName: 'English Language',
    type: 'Curriculum Manual',
    publisher: 'Curriculum Development Centre (CDC)',
    pages: 120,
    fileSize: '5.5 MB',
    pdfUrl: '/documents/manuals/cdc_english_grade_10_manual.pdf',
    downloadCount: '35.6k',
    description: 'Official criteria for Reading Comprehension, 25 Marks Internal Practical (Listening/Speaking), and writing mechanics.',
    topics: ['Writing Rubrics (Letters, CVs, Essays)', 'Grammar Transformation Rules', 'Reading Assessment Guidelines'],
  }
];

export const PRINTABLE_EXAM_PAPERS: PrintableExamPaper[] = [
  {
    id: 'print-sci-01',
    title: 'SEE 2082 All-Nepal Board Simulation Paper — Compulsory Science & Tech',
    subject: 'science',
    subjectName: 'Compulsory Science & Tech',
    paperCode: 'SCI-NEB-2082-A',
    totalMarks: 75,
    timeAllowed: '2 Hours 15 Minutes',
    instructions: [
      'Attempt all questions from Group A, B, C, and D.',
      'Figures in the right-hand margin indicate full marks.',
      'Draw neat, labelled diagrams wherever necessary.',
      'Candidates are required to give their answers in their own words as far as practicable.'
    ],
    groups: [
      {
        groupName: 'Group A (Very Short Answer Questions)',
        description: 'Answer the following questions in one sentence or define the term (1 × 15 = 15 Marks).',
        questionsCount: 15,
        marksPerQuestion: 1,
        totalGroupMarks: 15,
        questions: [
          { qNo: 1, question: 'State Newton\'s Universal Law of Gravitation.', marks: 1, answerLines: 3 },
          { qNo: 2, question: 'What is 1 Pascal pressure?', marks: 1, answerLines: 3 },
          { qNo: 3, question: 'Write the SI unit of electric power.', marks: 1, answerLines: 2 },
          { qNo: 4, question: 'State Modern Periodic Law.', marks: 1, answerLines: 3 },
          { qNo: 5, question: 'Write the chemical molecular formula of Bleaching Powder.', marks: 1, answerLines: 2 },
          { qNo: 6, question: 'Name any one main ore of Copper.', marks: 1, answerLines: 2 },
          { qNo: 7, question: 'Which hormone regulates blood sugar in human body?', marks: 1, answerLines: 2 },
          { qNo: 8, question: 'What is meant by phenotype ratio?', marks: 1, answerLines: 3 },
          { qNo: 9, question: 'Define critical angle in refraction of light.', marks: 1, answerLines: 3 },
          { qNo: 10, question: 'Write the main constituent metal in Bronze alloy.', marks: 1, answerLines: 2 },
        ]
      },
      {
        groupName: 'Group B (Short Answer Questions)',
        description: 'Give reasons or write two differences for each question (2 × 13 = 26 Marks).',
        questionsCount: 13,
        marksPerQuestion: 2,
        totalGroupMarks: 26,
        questions: [
          { qNo: 11, question: 'Why does an iron nail sink in water while a ship made of iron floats?', marks: 2, answerLines: 5 },
          { qNo: 12, question: 'Write any two differences between Upthrust and Weight.', marks: 2, answerLines: 5 },
          { qNo: 13, question: 'Why is Potassium more reactive than Sodium?', marks: 2, answerLines: 5 },
          { qNo: 14, question: 'Draw a labelled ray diagram showing Myopia (near-sightedness) and its optical correction.', marks: 2, answerLines: 6 },
          { qNo: 15, question: 'Mention two advantages of using Solar cells over fossil fuels.', marks: 2, answerLines: 4 },
        ]
      },
      {
        groupName: 'Group C (Problem Solving & Numericals)',
        description: 'Solve the following calculations showing all given values, formulas, and units (3 × 6 = 18 Marks).',
        questionsCount: 6,
        marksPerQuestion: 3,
        totalGroupMarks: 18,
        questions: [
          { qNo: 16, question: 'Calculate the gravitational force between Earth (M = 6 × 10²⁴ kg) and Moon (m = 7.4 × 10²² kg) separated by a distance of 3.84 × 10⁸ m. (G = 6.67 × 10⁻¹¹ N·m²/kg²)', marks: 3, answerLines: 8 },
          { qNo: 17, question: 'A step-down transformer converts 220V AC into 11V. If primary coil has 800 turns, calculate the number of turns in secondary coil. Also calculate secondary current if primary current is 0.5A (assume 100% efficiency).', marks: 3, answerLines: 8 },
          { qNo: 18, question: 'Balance the following equations:\n(a) CaCO₃ + HCl → CaCl₂ + H₂O + CO₂\n(b) N₂ + H₂ → NH₃\n(c) Fe + H₂O (steam) → Fe₃O₄ + H₂', marks: 3, answerLines: 7 },
        ]
      },
      {
        groupName: 'Group D (Long Answer & Analytical Questions)',
        description: 'Explain in detail with diagrams and complete step-by-step chemical or physical derivations (4 × 4 = 16 Marks).',
        questionsCount: 4,
        marksPerQuestion: 4,
        totalGroupMarks: 16,
        questions: [
          { qNo: 19, question: 'Describe the laboratory preparation of Ammonia gas (NH₃) with:\n(i) Principle & balanced chemical equation\n(ii) Labelled apparatus diagram\n(iii) Gas collection method & reasons\n(iv) One chemical test for identification', marks: 4, answerLines: 12 },
          { qNo: 20, question: 'Explain Mendel\'s Dihybrid Cross of pea plants (Round Yellow × Wrinkled Green seeds) with a clear Punnett Square chart. State the phenotypic and genotypic ratios of the F₂ generation.', marks: 4, answerLines: 12 },
        ]
      }
    ]
  },
  {
    id: 'print-math-01',
    title: 'SEE 2082 All-Nepal Board Simulation Paper — Compulsory Mathematics',
    subject: 'math',
    subjectName: 'Compulsory Mathematics',
    paperCode: 'MATH-NEB-2082-A',
    totalMarks: 75,
    timeAllowed: '3 Hours',
    instructions: [
      'All questions are compulsory.',
      'Mathematical tables and geometrical instruments may be used.',
      'Show all steps of mathematical working clearly.'
    ],
    groups: [
      {
        groupName: 'Group A (1 Mark Questions)',
        description: 'Definitions, formulas, and fundamental algebraic statements (1 × 6 = 6 Marks).',
        questionsCount: 6,
        marksPerQuestion: 1,
        totalGroupMarks: 6,
        questions: [
          { qNo: 1, question: 'Write the formula for calculating semi-annual compound amount when principal is P, rate is R%, and time is T years.', marks: 1, answerLines: 3 },
          { qNo: 2, question: 'What is the relation between inscribed angle and central angle standing on the same arc of a circle?', marks: 1, answerLines: 3 },
          { qNo: 3, question: 'State the formula for total surface area of a cone having radius r and slant height l.', marks: 1, answerLines: 2 },
        ]
      },
      {
        groupName: 'Group B (2 Marks Questions)',
        description: 'Short algebraic, financial, and geometric applications (2 × 11 = 22 Marks).',
        questionsCount: 11,
        marksPerQuestion: 2,
        totalGroupMarks: 22,
        questions: [
          { qNo: 4, question: 'In a survey of 120 students, 70 like football and 60 like volleyball. If 10 like neither, find the number of students who like both sports using a Venn diagram.', marks: 2, answerLines: 6 },
          { qNo: 5, question: 'The price of an article after adding 13% VAT is NPR 6,780. Find the initial price before VAT.', marks: 2, answerLines: 5 },
          { qNo: 6, question: 'Find the HCF of: x³ - y³ and x⁴ + x²y² + y⁴.', marks: 2, answerLines: 6 },
        ]
      },
      {
        groupName: 'Group C (3 Marks Questions)',
        description: 'Analytical problem solving, geometry riders, and combined 3D mensuration (3 × 8 = 24 Marks).',
        questionsCount: 8,
        marksPerQuestion: 3,
        totalGroupMarks: 24,
        questions: [
          { qNo: 7, question: 'A solid toy is in the form of a cone surmounted on a hemisphere. The radius of hemisphere is 7 cm and total height of the toy is 31 cm. Find the volume of the toy (Take π = 22/7).', marks: 3, answerLines: 9 },
          { qNo: 8, question: 'Solve the simultaneous equations: 2/x + 3/y = 7 and 3/x + 2/y = 8.', marks: 3, answerLines: 8 },
        ]
      },
      {
        groupName: 'Group D (4 Marks Questions)',
        description: 'Theoretical proofs, construction, and quadratic applications (4 × 5 = 20 Marks).',
        questionsCount: 5,
        marksPerQuestion: 4,
        totalGroupMarks: 20,
        questions: [
          { qNo: 9, question: 'Theoretically prove that the angle in a semicircle is a right angle (90°). Draw neat diagram, write Given, To Prove, Construction, and Statements with Reasons.', marks: 4, answerLines: 12 },
          { qNo: 10, question: 'From the top of a 60m high tower, the angles of depression of two cars on the same side of the tower are observed to be 30° and 60°. Find the distance between the two cars.', marks: 4, answerLines: 10 },
        ]
      }
    ]
  }
];
